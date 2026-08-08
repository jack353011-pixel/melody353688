// ========== 🩺 長時間掛機效能監控與自動保護 v3.8.42 ==========
(function () {
    const KEY = 'idle_lineage_perf_guard_v1';
    let cfg = { auto:true };
    try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e) {}
    let samples = [], totalTicks = 0, slowTicks = 0, peak = 0, guardOn = false, healthySince = 0, lastCleanup = null;

    function finite(v) { return Number.isFinite(v) ? v : 0; }
    function saveCfg() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch(e) {} }
    function addSample(ms) {
        ms = Math.max(0, finite(ms));
        samples.push(ms); if (samples.length > 600) samples.shift();
        totalTicks++; if (ms >= 50) slowTicks++; peak = Math.max(peak, ms);
    }
    function stats() {
        let recent = samples.slice(-100), sum = recent.reduce((a,b)=>a+b,0);
        let avg = recent.length ? sum/recent.length : 0;
        let sorted = recent.slice().sort((a,b)=>a-b);
        let p95 = sorted.length ? sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))] : 0;
        let mem = null;
        try { if (performance.memory) mem = { used:performance.memory.usedJSHeapSize, limit:performance.memory.jsHeapSizeLimit }; } catch(e) {}
        return {
            avg, p95, peak, totalTicks, slowTicks, guardOn,
            allies:(player && player.allies || []).length,
            summons:(player && player.summonsV2 || []).length + ((player && player.summon)?1:0) + ((player && player.charmed)?1:0),
            mobs:(typeof mapState==='object' && mapState && mapState.mobs || []).length,
            vfx:(document.getElementById('vfx-layer') || {children:[]}).children.length,
            combat:(document.getElementById('combat-log') || {children:[]}).children.length,
            system:(document.getElementById('sys-log') || {children:[]}).children.length,
            memory:mem
        };
    }
    function trimChildren(el, max) {
        if (!el) return 0; let n=0;
        while(el.children.length>max){el.removeChild(el.firstChild);n++;}
        return n;
    }
    window.performanceGuardCleanup = function (silent) {
        let removed=0, layer=document.getElementById('vfx-layer');
        if(layer){removed+=layer.children.length; while(layer.firstChild) layer.removeChild(layer.firstChild);}
        removed+=trimChildren(document.getElementById('combat-log'),50);
        removed+=trimChildren(document.getElementById('sys-log'),50);
        document.querySelectorAll('.vfx-spell,.damage-number,.floating-damage').forEach(el=>{if(el.parentNode){el.remove();removed++;}});
        if(!silent) {
            samples=[]; totalTicks=0; slowTicks=0; peak=0; healthySince=0;
            lastCleanup={at:Date.now(),removed:removed};
            let result=document.getElementById('performance-guard-cleanup-result');
            if(result){
                result.textContent=`✓ ${new Date(lastCleanup.at).toLocaleTimeString()} 已完成：移除 ${removed} 個暫存節點，效能統計已重置`;
                result.classList.remove('hidden');
            }
            renderPerformanceGuard();
            if(typeof logSys==='function') logSys(`效能清理完成：移除 ${removed} 個暫存畫面節點，並重置效能統計；遊戲進度不受影響。`);
        }
        return removed;
    };
    function setGuard(on) {
        on=!!on; if(guardOn===on)return;
        guardOn=on;
        document.documentElement.classList.toggle('performance-guard-mode',on);
        if(on) performanceGuardCleanup(true);
        if(typeof logSys==='function') logSys(on
            ? '<span class="text-amber-300">🩺 偵測到持續高負載，已暫停非必要動畫並清理特效；戰鬥與收益照常。</span>'
            : '<span class="text-emerald-300">🩺 效能已恢復穩定，自動保護解除。</span>');
    }
    function guardCheck() {
        let s=stats(), overloaded=s.avg>=20 || s.p95>=45 || s.vfx>100;
        if(cfg.auto && overloaded){healthySince=0;setGuard(true);}
        else if(guardOn){
            if(s.avg<10 && s.p95<25){if(!healthySince)healthySince=Date.now();if(Date.now()-healthySince>=60000)setGuard(false);}
            else healthySince=0;
        }
        if(s.vfx>150) performanceGuardCleanup(true);
        renderPerformanceGuard();
    }
    window.setPerformanceGuardAuto=function(on){cfg.auto=!!on;saveCfg();if(!cfg.auto)setGuard(false);renderPerformanceGuard();};
    window.performanceGuardSnapshot=stats;
    window.renderPerformanceGuard=function(){
        let s=stats(), box=document.getElementById('performance-guard-status'); if(!box)return;
        let level=s.avg>=20||s.p95>=45?'高負載':(s.avg>=10||s.p95>=25?'注意':'穩定');
        let color=level==='高負載'?'text-red-300':(level==='注意'?'text-amber-300':'text-emerald-300');
        let mem=s.memory?`${(s.memory.used/1048576).toFixed(0)} MB / ${(s.memory.limit/1073741824).toFixed(1)} GB`:'瀏覽器未提供';
        box.innerHTML=`<div class="flex items-center justify-between"><b class="${color}">${level}${s.guardOn?'・保護中':''}</b><span>平均 ${s.avg.toFixed(1)} ms・P95 ${s.p95.toFixed(1)} ms</span></div>
        <div class="grid grid-cols-2 gap-x-3 mt-2 text-xs text-slate-400"><span>峰值：${s.peak.toFixed(1)} ms</span><span>慢更新：${s.slowTicks.toLocaleString()}</span><span>敵人／傭兵：${s.mobs}／${s.allies}</span><span>召喚／特效：${s.summons}／${s.vfx}</span><span>戰鬥／系統日誌：${s.combat}／${s.system}</span><span>記憶體：${mem}</span></div>`;
        let chk=document.getElementById('set-perf-auto');if(chk)chk.checked=!!cfg.auto;
        let result=document.getElementById('performance-guard-cleanup-result');
        if(result && lastCleanup){
            result.textContent=`✓ ${new Date(lastCleanup.at).toLocaleTimeString()} 已完成：移除 ${lastCleanup.removed} 個暫存節點，效能統計已重置`;
            result.classList.remove('hidden');
        }
    };

    // 在遊戲計時器建立前包裝 tick；只量測既有計算，不改變戰鬥順序。
    if(typeof tick==='function'){
        const originalTick=tick;
        tick=function(){
            let t0=(typeof performance!=='undefined'?performance.now():Date.now());
            try{return originalTick.apply(this,arguments);}
            finally{addSample((typeof performance!=='undefined'?performance.now():Date.now())-t0);}
        };
    }
    setInterval(guardCheck,5000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)guardCheck();});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderPerformanceGuard);else renderPerformanceGuard();
})();
