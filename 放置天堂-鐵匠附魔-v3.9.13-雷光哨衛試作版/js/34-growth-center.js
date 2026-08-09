// ========== ♾️ 成長中心 v3.8.69 ==========
// 萬能藥快捷、三套裝備預設、三隊傭兵遠征、無限轉生。
(function () {
    const STATS = ['str','dex','con','int','wis','cha'];
    const STAT_N = {str:'力量',dex:'敏捷',con:'體質',int:'智力',wis:'精神',cha:'魅力'};
    const EXPEDITION_HOURS = [1,4,8];

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function ensureGrowth() {
        if (!player.growthCenter || typeof player.growthCenter !== 'object') player.growthCenter = {};
        let g = player.growthCenter;
        if (!Array.isArray(g.loadouts)) g.loadouts = [null,null,null];
        while (g.loadouts.length < 3) g.loadouts.push(null);
        if (!Array.isArray(g.expeditions)) g.expeditions = [null,null,null];
        while (g.expeditions.length < 3) g.expeditions.push(null);
        if (!player.rebirthBonus || typeof player.rebirthBonus !== 'object') player.rebirthBonus = {};
        STATS.forEach(s => { player.rebirthBonus[s] = Math.max(0, Math.floor(Number(player.rebirthBonus[s]) || 0)); });
        player.rebirthCount = Math.max(0, Math.floor(Number(player.rebirthCount) || 0));
        player.rebirthPoints = Math.max(0, Math.floor(Number(player.rebirthPoints) || 0));
        return g;
    }
    function modal() {
        let el = document.getElementById('growth-center-modal');
        if (!el) {
            el = document.createElement('div');
            el.id = 'growth-center-modal';
            el.className = 'hidden fixed inset-0 z-[10080] bg-black/80 flex items-center justify-center p-3';
            el.onclick = e => { if (e.target === el) closeGrowthCenter(); };
            document.body.appendChild(el);
        }
        return el;
    }
    window.closeGrowthCenter = function () { modal().classList.add('hidden'); };
    window.openGrowthCenter = function (tab) {
        if (typeof player !== 'object' || !player) return;
        ensureGrowth();
        let el = modal();
        el.classList.remove('hidden');
        el.dataset.tab = tab || el.dataset.tab || 'panacea';
        renderGrowthCenter();
    };
    window.growthTab = function (tab) { modal().dataset.tab = tab; renderGrowthCenter(); };

    function panaceaRows() {
        let defs = Object.keys(DB.items).map(id => ({id, d:DB.items[id]})).filter(x => x.d && x.d.eff === 'panacea');
        return defs.map(x => {
            let count = (player.inv || []).filter(i => i.id === x.id).reduce((n,i) => n + Math.max(0, Math.floor(i.cnt || 1)), 0);
            return `<div class="gc-row"><b class="${x.d.c || 'text-pink-300'}">${esc(x.d.n)}</b><span>${STAT_N[x.d.pstat]}：${naturalStat(x.d.pstat).toLocaleString()}　持有 ${count.toLocaleString()}</span>
                <div><button onclick="growthUsePanacea('${x.id}',10)">10</button><button onclick="growthUsePanacea('${x.id}',100)">100</button><button onclick="growthUsePanacea('${x.id}','all')">全部</button></div></div>`;
        }).join('') || '<p class="text-slate-400">尚未持有或資料庫沒有萬能藥。</p>';
    }
    window.growthUsePanacea = function (id, amount) {
        let d = DB.items[id]; if (!d || d.eff !== 'panacea') return;
        let stacks = (player.inv || []).filter(i => i.id === id), have = stacks.reduce((n,i) => n + Math.max(0, Math.floor(i.cnt || 1)), 0);
        let use = amount === 'all' ? have : Math.min(have, Math.max(0, Math.floor(Number(amount) || 0)));
        if (!use) { logSys(`沒有可使用的 ${d.n}。`); return; }
        let left = use;
        stacks.forEach(i => { if (!left) return; let take = Math.min(left, Math.max(0, Math.floor(i.cnt || 1))); i.cnt = Math.max(0, (i.cnt || 1) - take); left -= take; });
        player.inv = player.inv.filter(i => (i.cnt || 0) > 0);
        if (!player.panacea) player.panacea = {};
        player.panacea[d.pstat] = (player.panacea[d.pstat] || 0) + use;
        player.panaceaUsed = (player.panaceaUsed || 0) + use;
        calcStats(); updateUI(); saveGame();
        logSys(`快速使用 ${d.n} ×${use.toLocaleString()}，${STAT_N[d.pstat]}永久 +${use.toLocaleString()}。`);
        renderGrowthCenter();
    };

    function loadoutRows() {
        let g = ensureGrowth();
        return [0,1,2].map(i => {
            let p = g.loadouts[i], count = p && p.items ? p.items.length : 0;
            return `<div class="gc-card"><b>裝備預設 ${i+1}</b><span>${p ? `${esc(p.name || ('預設 '+(i+1)))}・${count} 件` : '尚未儲存'}</span>
                <div><button onclick="growthSaveLoadout(${i})">儲存目前</button><button ${p?'':'disabled'} onclick="growthApplyLoadout(${i})">套用</button><button ${p?'':'disabled'} onclick="growthDeleteLoadout(${i})">刪除</button></div></div>`;
        }).join('');
    }
    function cloneItem(i) { return i ? JSON.parse(JSON.stringify(i)) : null; }
    window.growthSaveLoadout = function (idx) {
        let g = ensureGrowth(), name = prompt('預設名稱：', `預設 ${idx+1}`); if (name === null) return;
        g.loadouts[idx] = {name:String(name).slice(0,24), items:Object.keys(player.eq || {}).filter(k => player.eq[k]).map(k => ({slot:k,item:cloneItem(player.eq[k])}))};
        saveGame(); renderGrowthCenter();
    };
    function sameInstance(a,b) {
        if (!a || !b) return false;
        if (a.uid && b.uid && a.uid === b.uid) return true;
        if (typeof sameItemSig === 'function') return sameItemSig(a,b);
        return a.id === b.id && Number(a.en||0) === Number(b.en||0) && String(a.attr||'') === String(b.attr||'') && String(a.seteff||'') === String(b.seteff||'');
    }
    window.growthApplyLoadout = function (idx) {
        let p = ensureGrowth().loadouts[idx]; if (!p || !Array.isArray(p.items)) return;
        if (typeof mapState === 'object' && mapState && !mapState.safe) { logSys('請先回到安全區再切換裝備預設。'); return; }
        Object.keys(player.eq || {}).forEach(k => {
            let it = player.eq[k]; if (!it) return;
            let d = DB.items[it.id];
            if (it.id === 'wpn_shaha_arrow') return;
            if (!d || !d.virtual) player.inv.push(it);
            player.eq[k] = null;
        });
        let missing = [];
        p.items.forEach(row => {
            let at = player.inv.findIndex(i => sameInstance(i,row.item));
            if (at < 0) { missing.push(row.item && DB.items[row.item.id] ? DB.items[row.item.id].n : row.item.id); return; }
            let inst = player.inv.splice(at,1)[0];
            if (!checkCanEquip(inst)) { player.inv.push(inst); missing.push(DB.items[inst.id].n); return; }
            player.eq[row.slot] = inst;
        });
        if (typeof syncShahaArrow === 'function') syncShahaArrow();
        calcStats(); renderTabs(); updateUI(); saveGame();
        logSys(`已套用裝備預設「${p.name}」${missing.length ? `；缺少／無法裝備：${missing.join('、')}` : '。'}`);
        closeGrowthCenter();
    };
    window.growthDeleteLoadout = function (idx) { ensureGrowth().loadouts[idx] = null; saveGame(); renderGrowthCenter(); };

    function savedMercSlots() {
        let rows = [];
        for (let n=1;n<=SAVE_SLOT_MAX;n++) {
            if (String(n) === String(currentSlot)) continue;
            try {
                let raw = _saveUnwrap(_lzGet('lineage_idle_save_'+n)).payload;
                if (!raw) continue;
                let p = JSON.parse(raw).p;
                if (p) rows.push({slot:String(n), name:p.name || allyName(p), lv:Math.max(1,Math.floor(p.lv||1)), id:p.enSeed||('slot'+n)});
            } catch(e) {}
        }
        return rows;
    }
    function expeditionRows() {
        let g=ensureGrowth(), mercs=savedMercSlots(), now=Date.now();
        return [0,1,2].map(i => {
            let x=g.expeditions[i];
            if (x) {
                let done=now>=x.endsAt, remain=Math.max(0,x.endsAt-now), min=Math.ceil(remain/60000);
                return `<div class="gc-card"><b>遠征隊 ${i+1}・${esc(x.name)}</b><span>${done?'✅ 已完成':`剩餘 ${min} 分鐘`}・${x.hours} 小時</span><div><button ${done?'':'disabled'} onclick="growthClaimExpedition(${i})">領取獎勵</button></div></div>`;
            }
            let opts=mercs.map(m=>`<option value="${m.slot}">${esc(m.name)} Lv.${m.lv}（存檔 ${m.slot}）</option>`).join('');
            return `<div class="gc-card"><b>遠征隊 ${i+1}</b><select id="gc-exp-slot-${i}"><option value="">選擇傭兵</option>${opts}</select><select id="gc-exp-hour-${i}">${EXPEDITION_HOURS.map(h=>`<option value="${h}">${h} 小時</option>`).join('')}</select><div><button onclick="growthStartExpedition(${i})">出發</button></div></div>`;
        }).join('');
    }
    window.growthStartExpedition = function (idx) {
        let g=ensureGrowth(), slot=String(document.getElementById('gc-exp-slot-'+idx).value||''), hours=Number(document.getElementById('gc-exp-hour-'+idx).value)||1;
        let merc=savedMercSlots().find(m=>m.slot===slot); if(!merc){logSys('請先選擇可用傭兵。');return;}
        if ((player.allies||[]).some(a=>a&&String(a._slot)===slot)) { logSys('正在主隊出戰的傭兵不能同時遠征。'); return; }
        if (g.expeditions.some((x,j)=>j!==idx&&x&&x.slot===slot&&Date.now()<x.endsAt)) { logSys('這名傭兵已在另一支遠征隊。'); return; }
        g.expeditions[idx]={slot,name:merc.name,lv:merc.lv,hours,startedAt:Date.now(),endsAt:Date.now()+hours*3600000};
        saveGame(); renderGrowthCenter();
    };
    window.growthClaimExpedition = function (idx) {
        let g=ensureGrowth(), x=g.expeditions[idx]; if(!x||Date.now()<x.endsAt)return;
        let gold=Math.floor(x.lv*x.hours*750), exp=Math.floor(x.lv*x.hours*5000), pots=Math.max(1,Math.floor(x.hours*x.lv/10));
        player.gold=(player.gold||0)+gold; player.exp=(player.exp||0)+exp;
        if (DB.items.potion_ult) gainItem('potion_ult',pots,false,false,false,true);
        if (typeof checkLvUp==='function') checkLvUp();
        g.expeditions[idx]=null; calcStats(); updateUI(); saveGame();
        logSys(`遠征完成：獲得 ${gold.toLocaleString()} 金幣、${exp.toLocaleString()} 經驗與白色藥水 ×${pots}。`);
        renderGrowthCenter();
    };

    function rebirthPanel() {
        ensureGrowth();
        let bonuses=STATS.map(s=>`<button onclick="growthSpendRebirth('${s}')" ${player.rebirthPoints>0?'':'disabled'}>${STAT_N[s]} +${player.rebirthBonus[s]}</button>`).join('');
        return `<div class="gc-rebirth"><div class="text-lg text-amber-300 font-bold">第 ${player.rebirthCount} 次轉生</div>
            <p>角色達 Lv.100 可無限轉生。每次回到 Lv.1，保留裝備、物品、技能、收藏與萬能藥，並取得 <b class="text-emerald-300">3 點永久自由屬性</b>。</p>
            <div class="gc-stat-buttons">${bonuses}</div><p>未分配轉生點：<b>${player.rebirthPoints}</b></p>
            <button class="gc-danger" onclick="growthRebirth()" ${(player.lv||1)>=100?'':'disabled'}>執行轉生（需要 Lv.100）</button></div>`;
    }
    function repairCost(it) {
        let max = typeof d2rDurabilityMax === 'function' ? d2rDurabilityMax(it) : 0;
        if (!max) return 0;
        let miss = max - d2rDurabilityNow(it); if (miss <= 0) return 0;
        let qi = typeof D2R_QUALITY_KEYS !== 'undefined' ? Math.max(0,D2R_QUALITY_KEYS.indexOf(it.d2q)) : 0;
        let base = Math.max(100, Number((DB.items[it.id]||{}).p)||100);
        return Math.min(5000000, Math.max(1, Math.ceil(base * (miss/max) * (1 + qi*.75))));
    }
    function repairPanel() {
        let rows = Object.entries(player.eq||{}).filter(([,it]) => it && repairCost(it)>0);
        let total = rows.reduce((s,[,it])=>s+repairCost(it),0);
        let list = rows.length ? rows.map(([slot,it])=>`<div class="gc-card"><b>${getItemFullName(it)}</b><span>耐久 ${d2rDurabilityNow(it)}/${d2rDurabilityMax(it)}</span><span>${repairCost(it).toLocaleString()} 金幣</span></div>`).join('') : '<p>目前裝備不需要維修。</p>';
        let action = `<div class="gc-repair-action"><button onclick="growthRepairAll()" ${rows.length?'':'disabled'}>🔧 一鍵維修（${total.toLocaleString()} 金幣）</button><span>${rows.length ? `共 ${rows.length} 件需要維修` : '沒有需要維修的裝備'}</span></div>`;
        return `<div class="gc-repair">${action}${list}<p>任何地圖都能維修；耐久歸零裝備不消失，D2R 詞綴效果降至 70%。</p></div>`;
    }
    window.growthRepairAll = function () {
        let items=Object.values(player.eq||{}).filter(Boolean), total=items.reduce((s,it)=>s+repairCost(it),0);
        if(total<=0){logSys('目前沒有需要維修的裝備。');return;}
        if((player.gold||0)<total){logSys(`<span class="text-red-400">金幣不足，需要 ${total.toLocaleString()}。</span>`);return;}
        player.gold-=total; items.forEach(it=>{let max=d2rDurabilityMax(it);if(max)it.dur=max;}); calcStats(); updateUI(); saveGame(); renderGrowthCenter();
        logSys(`<span class="text-emerald-300">已修復所有已裝備物品，共花費 ${total.toLocaleString()} 金幣。</span>`);
    };
    function socketOpenCost(it) {
        let opened = typeof equipSocketOpenCount === 'function' ? equipSocketOpenCount(it) : 0;
        let d = DB.items[it.id] || {}, qi = typeof D2R_QUALITY_KEYS !== 'undefined' ? Math.max(0,D2R_QUALITY_KEYS.indexOf(it.d2q)) : 0;
        let base = Math.max(10000, Math.floor((Number(d.p) || 1000) * .5));
        return Math.min(5000000, Math.max(10000, Math.ceil(base * [1,2,4,8,16,32][opened] * (1 + qi * .25))));
    }
    function socketCandidates() {
        let out = [];
        Object.entries(player.eq || {}).forEach(([slot,it]) => {
            if (it && typeof equipSocketMax === 'function' && equipSocketMax(it) > equipSocketOpenCount(it)) out.push({key:'eq:'+slot,it,where:'已裝備'});
        });
        (player.inv || []).forEach(it => {
            if (it && typeof equipSocketMax === 'function' && equipSocketMax(it) > equipSocketOpenCount(it)) out.push({key:'inv:'+it.uid,it,where:'背包'});
        });
        return out;
    }
    function socketPanel() {
        let rows = socketCandidates();
        let list = rows.length ? rows.map(row => {
            let opened=equipSocketOpenCount(row.it), max=equipSocketMax(row.it), cost=socketOpenCost(row.it);
            return `<div class="gc-card"><div><b>${getItemFullName(row.it)}</b><small class="text-slate-400">${row.where}${(row.it.cnt||1)>1?`・堆疊 ${row.it.cnt} 件`:''}</small></div>
                <span class="text-cyan-300">孔 ${opened}/${max}　→　${opened+1}/${max}</span>
                <button onclick="growthOpenSocket('${esc(row.key)}')" ${(player.gold||0)>=cost?'':'disabled'}>開孔 ${cost.toLocaleString()}</button></div>`;
        }).join('') : '<p class="text-slate-400">目前沒有可以繼續開孔的裝備。</p>';
        return `<div class="gc-socket">${list}<p class="text-slate-400 mt-3">任何地圖都能開孔，每次開一孔且必定成功。武器／盔甲最多 6 孔，頭盔／盾牌 4 孔，手套／長靴／斗篷 2 孔；飾品、箭矢、遺物與虛擬裝備不可開孔。</p><p class="text-amber-300">怪物掉落的八色裝備可能自帶 1～6 孔；寶石與符文可依序鑲入已開啟的空孔。</p></div>`;
    }
    window.growthOpenSocket = function (key) {
        key=String(key||''); let it=null, equipped=false;
        if(key.startsWith('eq:')){let slot=key.slice(3);it=player.eq&&player.eq[slot];equipped=true;}
        else if(key.startsWith('inv:')) it=(player.inv||[]).find(x=>String(x.uid)===key.slice(4));
        if(!it || typeof equipSocketMax!=='function') { logSys('找不到要開孔的裝備。'); renderGrowthCenter(); return; }
        let max=equipSocketMax(it), opened=equipSocketOpenCount(it);
        if(!max || opened>=max){logSys('這件裝備已無法繼續開孔。');renderGrowthCenter();return;}
        let cost=socketOpenCost(it);
        if((player.gold||0)<cost){logSys(`<span class="text-red-400">金幣不足，需要 ${cost.toLocaleString()}。</span>`);return;}
        // 背包同簽章可能堆疊；只取一件開孔，原堆疊保持未變，避免整疊免費一起開孔。
        if(!equipped && (Number(it.cnt)||1)>1){
            it.cnt--;
            let one=JSON.parse(JSON.stringify(it)); one.cnt=1; one.uid=uid(); one.junk=false;
            delete one.junkSince; delete one._autoSellQty; delete one._ruleJunk; one._userKeep=true;
            player.inv.push(one); it=one;
        }
        player.gold-=cost;
        it.socketMax=max;
        if(!Array.isArray(it.sockets)) it.sockets=[];
        it.sockets=equipSocketRows(it); it.sockets.push(null);
        it.junk=false; delete it.junkSince; delete it._autoSellQty; delete it._ruleJunk; it._userKeep=true;
        calcStats(); updateUI(); renderTabs(); saveGame();
        logSys(`<span class="text-cyan-300 font-bold">◆ ${getItemFullName(it)} 開啟第 ${it.sockets.length} 孔，花費 ${cost.toLocaleString()} 金幣。</span>`);
        renderGrowthCenter();
    };
    function gemCount(id) {
        return (player.inv||[]).filter(i=>i.id===id).reduce((s,i)=>s+Math.max(0,Math.floor(Number(i.cnt)||1)),0);
    }
    function takeGem(id,count) {
        let left=count;
        (player.inv||[]).filter(i=>i.id===id).forEach(i=>{if(!left)return;let n=Math.min(left,Math.max(0,Math.floor(Number(i.cnt)||1)));i.cnt-=n;left-=n;});
        player.inv=(player.inv||[]).filter(i=>(Number(i.cnt)||0)>0);
        return left===0;
    }
    function gemEquipmentRows() {
        let rows=[];
        Object.entries(player.eq||{}).forEach(([slot,it])=>{if(it&&equipSocketOpenCount(it)>0)rows.push({key:'eq:'+slot,it,where:'已裝備'});});
        (player.inv||[]).forEach(it=>{if(it&&equipSocketOpenCount(it)>0)rows.push({key:'inv:'+it.uid,it,where:'背包'});});
        return rows;
    }
    function gemOptionsForItem(it) {
        return GEM_IDS.filter(id=>gemCount(id)>0&&gemEffectForItem(id,it)).map(id=>`<option value="${id}">${DB.items[id].n} ×${gemCount(id)}（${gemEffectForItem(id,it).label}）</option>`).join('');
    }
    function gemPanel() {
        let owned=GEM_IDS.filter(id=>gemCount(id)>0);
        let inventory=owned.length?owned.map(id=>{let g=gemDef(id),next=g.rank<5?`<button onclick="growthCombineGem('${id}',false)" ${gemCount(id)>=3?'':'disabled'}>合成 3→1</button>`:'';return `<div class="gc-card"><b>${g.colorDef.icon} ${DB.items[id].n}</b><span>持有 ${gemCount(id).toLocaleString()}</span><div>${next}</div></div>`;}).join(''):'<p class="text-slate-400">尚未持有寶石；擊敗怪物有機率取得。</p>';
        let serial=0, equips=gemEquipmentRows();
        let equipment=equips.length?equips.map(row=>{
            let sockets=equipSocketRows(row.it), opts=gemOptionsForItem(row.it);
            let slots=sockets.map((socket,index)=>{
                if(socket){
                    let gd=gemDef(socket.id),eff=gemEffectForItem(socket.id,row.it),fee=gd?Math.floor(gd.rankDef.value*.2):0;
                    return `<div class="gc-gem-slot"><span>孔 ${index+1}：${gd?gd.colorDef.icon+' '+DB.items[socket.id].n:socket.id}${eff?'・'+eff.label:''}</span><button onclick="growthRemoveGem('${esc(row.key)}',${index})">拆除 ${fee.toLocaleString()}</button></div>`;
                }
                let sid='gc-gem-select-'+(serial++);
                return `<div class="gc-gem-slot"><span>孔 ${index+1}：空</span>${opts?`<select id="${sid}">${opts}</select><button onclick="growthInsertGem('${esc(row.key)}',${index},document.getElementById('${sid}').value)">鑲嵌</button>`:'<small class="text-slate-500">沒有適用寶石</small>'}</div>`;
            }).join('');
            return `<div class="gc-gem-equip"><b>${getItemFullName(row.it)}</b><small>${row.where}・孔 ${sockets.length}/${equipSocketMax(row.it)}・${typeof runewordHint==='function'?runewordHint(row.it):''}</small>${slots}</div>`;
        }).join(''):'<p class="text-slate-400">目前沒有已開孔的裝備。</p>';
        return `<div class="gc-gems"><div class="flex gap-2 mb-3"><button onclick="growthCombineAllGems()">全部合成</button></div><h3 class="text-fuchsia-300 font-bold mb-2">寶石背包</h3>${inventory}<h3 class="text-cyan-300 font-bold mt-5 mb-2">鑲嵌／拆除</h3>${equipment}<p class="text-slate-400 mt-3">任何地圖都能鑲嵌或拆除寶石。3 顆同色同階合成下一階；皇家為最高階。拆除費為寶石價值 20%，寶石會完整回到背包，原孔保留。</p></div>`;
    }
    function locateGemTarget(key,splitStack) {
        key=String(key||'');
        if(key.startsWith('eq:'))return {it:player.eq&&player.eq[key.slice(3)],equipped:true};
        if(!key.startsWith('inv:'))return {it:null,equipped:false};
        let it=(player.inv||[]).find(x=>String(x.uid)===key.slice(4));
        if(it&&splitStack&&(Number(it.cnt)||1)>1){
            it.cnt--;let one=JSON.parse(JSON.stringify(it));one.cnt=1;one.uid=uid();one.junk=false;
            delete one.junkSince;delete one._autoSellQty;delete one._ruleJunk;one._userKeep=true;player.inv.push(one);it=one;
        }
        return {it,equipped:false};
    }
    window.growthInsertGem = function(key,index,gemId) {
        let g=gemDef(gemId),target=locateGemTarget(key,false),it=target.it;index=Math.floor(Number(index));
        if(!g||!it||gemCount(gemId)<1){logSys('寶石或目標裝備已不存在。');renderGrowthCenter();return;}
        let sockets=equipSocketRows(it);if(index<0||index>=sockets.length||sockets[index]){logSys('選擇的孔位已無法鑲嵌。');renderGrowthCenter();return;}
        let eff=gemEffectForItem(gemId,it);if(!eff){logSys('這顆寶石無法用於此裝備。');return;}
        target=locateGemTarget(key,true);it=target.it;sockets=equipSocketRows(it);
        if(!takeGem(gemId,1))return;
        sockets[index]={kind:'gem',id:gemId};it.sockets=sockets;it.junk=false;it._userKeep=true;
        calcStats();updateUI();renderTabs();saveGame();logSys(`<span class="text-fuchsia-300 font-bold">💎 ${DB.items[gemId].n} 已鑲入 ${getItemFullName(it)}：${eff.label}。</span>`);renderGrowthCenter();
    };
    window.growthRemoveGem = function(key,index) {
        let target=locateGemTarget(key,false),it=target.it;index=Math.floor(Number(index));if(!it)return;
        let sockets=equipSocketRows(it),socket=sockets[index],g=socket&&socket.kind==='gem'?gemDef(socket.id):null;
        if(!g){logSys('該孔位沒有可拆除的寶石。');renderGrowthCenter();return;}
        let fee=Math.floor(g.rankDef.value*.2);if((player.gold||0)<fee){logSys(`<span class="text-red-400">拆除需要 ${fee.toLocaleString()} 金幣。</span>`);return;}
        target=locateGemTarget(key,true);it=target.it;sockets=equipSocketRows(it);
        player.gold-=fee;sockets[index]=null;it.sockets=sockets;gainItem(g.id,1,true,true);
        calcStats();updateUI();renderTabs();saveGame();logSys(`<span class="text-cyan-300">已安全拆除 ${DB.items[g.id].n}，花費 ${fee.toLocaleString()} 金幣。</span>`);renderGrowthCenter();
    };
    window.growthCombineGem = function(id,all) {
        let g=gemDef(id);if(!g||g.rank>=5)return;
        let times=all?Math.floor(gemCount(id)/3):1;if(times<1||gemCount(id)<times*3){logSys('同色同階寶石不足 3 顆。');return;}
        takeGem(id,times*3);let next=`gem_${g.color}_${g.rank+1}`;gainItem(next,times,true,true);
        saveGame();renderTabs();logSys(`<span class="text-fuchsia-300">合成 ${DB.items[next].n} ×${times}。</span>`);renderGrowthCenter();
    };
    window.growthCombineAllGems = function() {
        let made=0;
        Object.keys(GEM_COLORS).forEach(color=>{for(let rank=1;rank<5;rank++){let id=`gem_${color}_${rank}`,times=Math.floor(gemCount(id)/3);if(times>0){takeGem(id,times*3);gainItem(`gem_${color}_${rank+1}`,times,true,true);made+=times;}}});
        if(!made){logSys('目前沒有可合成的寶石。');return;}
        saveGame();renderTabs();logSys(`<span class="text-fuchsia-300 font-bold">💎 全部合成完成，共製作 ${made} 顆高階寶石。</span>`);renderGrowthCenter();
    };
    function runeCount(id){return (player.inv||[]).filter(i=>i.id===id).reduce((s,i)=>s+Math.max(0,Math.floor(Number(i.cnt)||1)),0);}
    function takeRune(id){
        let st=(player.inv||[]).find(i=>i.id===id&&(i.cnt||1)>0);if(!st)return false;
        st.cnt=(st.cnt||1)-1;if(st.cnt<=0)player.inv=player.inv.filter(i=>i!==st);return true;
    }
    function runePanel(){
        let owned=RUNE_IDS.filter(id=>runeCount(id)>0);
        let inv=owned.length?owned.map(id=>`<div class="gc-card"><b>ᚱ ${DB.items[id].n}</b><span>持有 ${runeCount(id)}・${runeDef(id).d}</span><span>${runeDef(id).slot==='wpn'?'武器':runeDef(id).slot==='arm'?'防具':runeDef(id).slot==='wpnhelm'?'武器／頭盔':'武器／防具'}</span></div>`).join(''):'<p class="text-slate-400">尚未持有符文；符文比寶石稀有。</p>';
        let kindName={wpn:'武器',armor:'盔甲',shield:'盾牌',magicwpn:'魔法武器',helm:'頭盔',meleewpn:'近戰武器',rangedwpn:'遠程武器',magicorshield:'魔法武器／盾牌'};
        let words=RUNEWORDS.map(word=>{
            let sequence=word.seq.map(id=>((DB.items[id]&&DB.items[id].n)||id).replace(' 符文','')).join(' → ');
            return `<div class="gc-card"><b>ᚱ ${word.n}</b><span>${sequence}</span><span>${kindName[word.kind]||word.kind}・指定 ${word.seq.length} 孔</span><small class="text-slate-400">${word.d}</small></div>`;
        }).join('');
        let serial=0,equipment=gemEquipmentRows();
        let gear=equipment.length?equipment.map(row=>{
            let sockets=equipSocketRows(row.it);
            let opts=owned.filter(id=>runeCount(id)>0&&runeFitsItem(id,row.it)).map(id=>`<option value="${id}">${DB.items[id].n} ×${runeCount(id)}（${runeDef(id).d}）</option>`).join('');
            let slots=sockets.map((socket,index)=>{
                if(socket){
                    let isRune=socket.kind==='rune',r=isRune?runeDef(socket.id):null,fee=r?Math.floor(r.p*.3):0;
                    return `<div class="gc-gem-slot"><span>孔 ${index+1}：${(DB.items[socket.id]&&DB.items[socket.id].n)||socket.id}${r?'・'+r.d:''}</span>${isRune?`<button onclick="growthRemoveRune('${esc(row.key)}',${index})">拆除 ${fee.toLocaleString()}</button>`:'<small class="text-slate-500">寶石孔位</small>'}</div>`;
                }
                let sid='gc-rune-select-'+serial++;
                return `<div class="gc-gem-slot"><span>孔 ${index+1}：空</span>${opts?`<select id="${sid}">${opts}</select><button onclick="growthInsertRune('${esc(row.key)}',${index},document.getElementById('${sid}').value)">鑲嵌</button>`:'<small class="text-slate-500">沒有符合部位的符文</small>'}</div>`;
            }).join('');
            return `<div class="gc-gem-equip"><b>${getItemFullName(row.it)}</b><small>${row.where}・孔 ${sockets.length}/${equipSocketMax(row.it)}</small>${slots}</div>`;
        }).join(''):'<p class="text-slate-400">目前沒有已開孔的裝備。</p>';
        return `<div><h3 class="text-amber-300 font-bold mb-2">符文背包</h3>${inv}<h3 class="text-violet-300 font-bold mt-5 mb-2">符文之語配方（${RUNEWORDS.length}）</h3>${words}<h3 class="text-cyan-300 font-bold mt-5 mb-2">鑲嵌／拆除</h3>${gear}<p class="text-slate-400 mt-3">任何地圖都能鑲嵌或拆除符文。符文之語必須使用無詞綴的白色裝備，裝備總孔數必須與配方指定孔數完全相同，並從第 1 孔開始依順序填滿所有孔；不能使用有多餘孔的底材。所有符文均可放入有孔武器／防具以完成配方，單顆效果只在符文標示的部位生效。符文不可合成；拆除費為符文價值 30%。</p></div>`;
    }
    window.growthInsertRune=function(key,index,id){
        index=Math.floor(Number(index));let r=runeDef(id),target=locateGemTarget(key,false),it=target.it;
        if(!r||!it||runeCount(id)<1||!runeFitsItem(id,it)){logSys('符文不符合目標裝備部位。');renderGrowthCenter();return;}
        let sockets=equipSocketRows(it);if(index<0||index>=sockets.length||sockets[index]){logSys('選擇的孔位已無法鑲嵌。');renderGrowthCenter();return;}
        target=locateGemTarget(key,true);it=target.it;sockets=equipSocketRows(it);if(!takeRune(id))return;
        sockets[index]={kind:'rune',id};it.sockets=sockets;it.junk=false;it._userKeep=true;
        calcStats();updateUI();renderTabs();saveGame();logSys(`<span class="text-amber-300 font-bold">ᚱ ${DB.items[id].n} 已鑲入 ${getItemFullName(it)}。</span>`);renderGrowthCenter();
    };
    window.growthRemoveRune=function(key,index){
        index=Math.floor(Number(index));let target=locateGemTarget(key,false),it=target.it;if(!it)return;
        let sockets=equipSocketRows(it),socket=sockets[index],r=socket&&socket.kind==='rune'?runeDef(socket.id):null;
        if(!r){logSys('該孔位沒有符文。');renderGrowthCenter();return;}
        let fee=Math.floor(r.p*.3);if((player.gold||0)<fee){logSys(`<span class="text-red-400">拆除需要 ${fee.toLocaleString()} 金幣。</span>`);return;}
        target=locateGemTarget(key,true);it=target.it;sockets=equipSocketRows(it);player.gold-=fee;sockets[index]=null;it.sockets=sockets;gainItem(socket.id,1,true,true);
        calcStats();updateUI();renderTabs();saveGame();logSys(`<span class="text-cyan-300">已安全拆除 ${DB.items[socket.id].n}。</span>`);renderGrowthCenter();
    };
    function alchemySourceOptions() {
        if(typeof alchemyFusionSources!=='function')return '';
        return alchemyFusionSources(player).map(row=>`<option value="${esc(row.token)}">${esc(row.label)}</option>`).join('');
    }
    function alchemyAccessoryCandidates() {
        let rows=[];
        Object.entries(player.eq||{}).forEach(([slot,it])=>{
            if(it&&(it.alchemyCore||(typeof alchemyAccessoryBaseEligible==='function'&&alchemyAccessoryBaseEligible(it))))rows.push({key:'eq:'+slot,it,where:'已裝備・'+slot});
        });
        (player.inv||[]).forEach(it=>{
            if(it&&(it.alchemyCore||(typeof alchemyAccessoryBaseEligible==='function'&&alchemyAccessoryBaseEligible(it))))rows.push({key:'inv:'+it.uid,it,where:'背包'});
        });
        return rows;
    }
    function alchemyPanel() {
        if(typeof alchemyEnsure!=='function')return '<p class="text-red-300">符文鍊金模組尚未載入，請重新整理。</p>';
        let growth=alchemyEnsure(player),sources=alchemySourceOptions(),cores=growth.alchemyCores||[];
        let activeRows=typeof alchemyAccessoryRows==='function'?alchemyAccessoryRows(player):[];
        let activeCount=activeRows.filter(row=>row.enabled).length,ringCount=activeRows.filter(row=>row.enabled&&row.ring).length;
        let fusion=sources?`<div class="gc-alchemy-fuse"><select id="gc-alchemy-source-a">${sources}</select><span>＋</span><select id="gc-alchemy-source-b">${sources}</select><button onclick="growthFuseAlchemy()">♾️ 融合</button></div>`:'<p class="text-slate-400">至少需要兩個可用來源；同種基礎符文需要持有兩顆。</p>';
        let storage=cores.length?cores.map(core=>{
            let lines=alchemyCoreLines(core).map(line=>`<small>${esc(line)}</small>`).join('');
            return `<div class="gc-alchemy-core"><b>✦ ${esc(alchemyCoreName(core))}</b>${lines}<span>總吸收 ${alchemyCoreAbsorbed(core)} 顆基礎符文・可繼續融合或綁定飾品</span></div>`;
        }).join(''):'<p class="text-slate-400">尚未製作鍊金符文。</p>';
        let serial=0,candidates=alchemyAccessoryCandidates(),coreOptions=cores.map(core=>`<option value="${esc(core.aid)}">${esc(alchemyCoreName(core))}</option>`).join('');
        let accessories=candidates.length?candidates.map(row=>{
            let core=typeof alchemyNormalizeCore==='function'?alchemyNormalizeCore(row.it.alchemyCore):null;
            if(core){
                row.it.alchemyCore=core;
                let state=alchemyCoreState(player,row.it),stateText=state.enabled?'✅ 生效中':(state.state==='stored'?'📦 裝備後判定':`⏸ ${state.reason||'暫停'}`),fee=alchemyUnbindCost(core);
                let lines=alchemyCoreLines(core).map(line=>`<small>${esc(line)}</small>`).join('');
                return `<div class="gc-alchemy-equip"><div><b>${getItemFullName(row.it)}</b><small>${esc(row.where)}</small></div><strong class="${state.enabled?'text-emerald-300':'text-amber-300'}">${stateText}</strong>${lines}<div>${state.state!=='stored'?`<button onclick="growthToggleAlchemy('${esc(row.key)}')">${core.active===false?'要求啟用':'停用'}</button>`:''}<button onclick="growthUnbindAlchemy('${esc(row.key)}')">取回核心 ${fee.toLocaleString()}</button></div></div>`;
            }
            let sid='gc-alchemy-core-'+serial++;
            return `<div class="gc-alchemy-equip"><div><b>${getItemFullName(row.it)}</b><small>${esc(row.where)}・可綁定</small></div>${coreOptions?`<select id="${sid}">${coreOptions}</select><button onclick="growthBindAlchemy('${esc(row.key)}',document.getElementById('${sid}').value)">綁定核心</button>`:'<span class="text-slate-500">保管區沒有鍊金符文</span>'}</div>`;
        }).join(''):'<p class="text-slate-400">目前沒有可綁定的項鍊、戒指或皮帶。</p>';
        return `<div class="gc-alchemy"><div class="gc-alchemy-status"><b>目前生效 ${activeCount}/${ALCHEMY_ACCESSORY_CORE_LIMIT}</b><span>戒指 ${ringCount}/${ALCHEMY_ACCESSORY_RING_LIMIT}・保管 ${cores.length}/${ALCHEMY_CORE_STORAGE_LIMIT}</span></div>
            <h3 class="text-fuchsia-300 font-bold mt-3 mb-2">無限符文融合</h3>${fusion}<p class="text-slate-400 mt-2">符文＋符文會產生新符文；新符文可以再次投入。相同特質在累計 2／4／8／16…顆時升階；雙特質各保留 60% 基礎效果。第一版最多兩種特質，出現第三種時不會消耗材料。</p>
            <h3 class="text-violet-300 font-bold mt-5 mb-2">鍊金符文保管區</h3>${storage}
            <h3 class="text-cyan-300 font-bold mt-5 mb-2">項鍊／戒指／皮帶</h3>${accessories}<p class="text-amber-300 mt-3">普通、八色、祝福、遠古與特殊飾品都能保存一顆核心；全身最多兩顆生效，四個戒指合計最多一顆。超過限制只暫停、不會消失。鍊金核心不形成既有符文之語，能力與普通符文共用上限。</p></div>`;
    }
    window.growthFuseAlchemy=function(){
        let a=document.getElementById('gc-alchemy-source-a'),b=document.getElementById('gc-alchemy-source-b');
        if(!a||!b||typeof alchemyCommitFusion!=='function'){logSys('目前沒有足夠的融合來源。');return;}
        let result=alchemyCommitFusion(player,a.value,b.value);
        if(!result||!result.ok){logSys(`<span class="text-red-300">${esc(result&&result.error||'融合失敗。')}</span>`);renderGrowthCenter();return;}
        calcStats();updateUI();renderTabs();saveGame();
        logSys(`<span class="text-fuchsia-300 font-bold">♾️ 融合完成：${esc(alchemyCoreName(result.core))}。</span>`);renderGrowthCenter();
    };
    window.growthBindAlchemy=function(key,aid){
        let target=locateGemTarget(key,false),it=target.it,growth=alchemyEnsure(player),at=growth.alchemyCores.findIndex(core=>core.aid===String(aid||''));
        if(!it||at<0||!alchemyAccessoryBaseEligible(it)){logSys('這件飾品或鍊金符文已無法綁定。');renderGrowthCenter();return;}
        target=locateGemTarget(key,true);it=target.it;
        let core=alchemyNormalizeCore(growth.alchemyCores.splice(at,1)[0]);core.active=true;it.alchemyCore=core;it.junk=false;it._userKeep=true;
        calcStats();updateUI();renderTabs();saveGame();logSys(`<span class="text-fuchsia-300 font-bold">✦ ${esc(alchemyCoreName(core))} 已綁定至 ${getItemFullName(it)}。</span>`);renderGrowthCenter();
    };
    window.growthUnbindAlchemy=function(key){
        let target=locateGemTarget(key,false),it=target.it,growth=alchemyEnsure(player),core=it&&alchemyNormalizeCore(it.alchemyCore);
        if(!it||!core){logSys('這件飾品沒有鍊金核心。');return;}
        if(growth.alchemyCores.length>=ALCHEMY_CORE_STORAGE_LIMIT){logSys('鍊金符文保管區已滿。');return;}
        let fee=alchemyUnbindCost(core);if((player.gold||0)<fee){logSys(`<span class="text-red-400">取回核心需要 ${fee.toLocaleString()} 金幣。</span>`);return;}
        player.gold-=fee;delete it.alchemyCore;core.active=true;growth.alchemyCores.push(core);
        calcStats();updateUI();renderTabs();saveGame();logSys(`<span class="text-cyan-300">已安全取回 ${esc(alchemyCoreName(core))}。</span>`);renderGrowthCenter();
    };
    window.growthToggleAlchemy=function(key){
        let target=locateGemTarget(key,false),it=target.it,core=it&&alchemyNormalizeCore(it.alchemyCore);if(!it||!core)return;
        core.active=core.active===false;it.alchemyCore=core;calcStats();updateUI();renderTabs();saveGame();renderGrowthCenter();
    };
    window.growthSpendRebirth = function (s) {
        if (!STATS.includes(s) || player.rebirthPoints<=0) return;
        player.rebirthPoints--; player.rebirthBonus[s]++; calcStats(); updateUI(); saveGame(); renderGrowthCenter();
    };
    window.growthRebirth = function () {
        if ((player.lv||1)<100) { logSys('角色達到 Lv.100 後才能轉生。'); return; }
        if (!confirm('確定轉生？等級會回到 Lv.1，其他進度保留，並獲得 3 點永久自由屬性。')) return;
        ensureGrowth(); player.rebirthCount++; player.rebirthPoints+=3; player.lv=1; player.exp=0; player.bonus=0;
        calcStats(); player.curHp=player.mhp; player.mp=player.mmp; updateUI(); saveGame();
        logSys(`<span class="text-amber-300 font-bold">♾️ 完成第 ${player.rebirthCount} 次轉生，獲得 3 點永久自由屬性！</span>`);
        renderGrowthCenter();
    };
    function d2rOverviewPanel() {
        let raw = typeof d2rEquipTotals === 'function' ? d2rEquipTotals(player) : {};
        let hunt = typeof d2rHuntTotals === 'function' ? d2rHuntTotals(player) : {};
        let combat = typeof d2rCombatAffixTotals === 'function' ? d2rCombatAffixTotals(player) : {};
        let defs = [
            ['gf','金幣取得量',50,'%'],['xf','經驗值取得量',25,'%'],
            ['nd','對一般怪物傷害',30,'%'],['bd','對頭目傷害',20,'%'],
            ['kh','擊殺恢復 HP',60,''],['km','擊殺恢復 MP',15,'']
        ];
        let cards = defs.map(([code,name,cap,unit]) => {
            let before=Math.max(0,Number(raw[code])||0), value=Math.max(0,Number(hunt[code])||0), capped=before>=cap;
            let pct=Math.max(0,Math.min(100,value/cap*100)), show=Number.isInteger(value)?value:value.toFixed(1);
            return `<div class="gc-d2r-card ${capped?'gc-d2r-capped':''}"><div><b>${name}</b>${capped?'<small>已封頂</small>':''}</div>
                <span>${show}${unit} / ${cap}${unit}</span><div class="gc-d2r-bar"><i style="width:${pct}%"></i></div></div>`;
        }).join('');
        let combatDefs=[['fpen','火焰穿透',30],['wpen','寒冰穿透',30],['epen','大地穿透',30],['apen','風雷穿透',30],['sdm','異常增傷',40],['bdr','頭目減傷',25],['und','不死獵殺',35],['dem','惡魔獵殺',35],['dra','屠龍',35],['hsk','破硬皮',30],['opn','先制增傷',30],['exe','處決增傷',40],['pdr','物理減傷',20],['mdr','魔法減傷',20],['ldr','瀕死減傷',25],['adr','異常減傷',25],['udr','不死減傷',25],['ddr','惡魔減傷',25],['blk','堅守格擋',18],['mgd','魔力護體',30],['rcv','傷勢回流',12],['sav','致命守護',20],['bar','傷勢壁壘',50],['rip','反擊意志',30],['ber','浴血增傷',35],['fmp','滿魔增傷',30],['shp','護盾猛攻',30],['ksh','擊殺護盾',10],['krc','擊殺回春',6],['kfu','擊殺戰意',30],['frz','霜縛追擊',35],['brn','焚燒追擊',35],['psn','劇毒追擊',35],['bld','流血追擊',35],['ctl','控場追擊',30],['deb','破綻追擊',30]];
        combatDefs.push(['fbr','烈焰催化',30],['wfr','霜潮共鳴',30],['eps','腐土共生',30],['wbl','風刃放血',30]);
        cards += combatDefs.map(([code,name,cap])=>{let before=Math.max(0,Number(raw[code])||0),value=Math.max(0,Number(combat[code])||0),capped=before>=cap,pct=Math.max(0,Math.min(100,value/cap*100)),show=Number.isInteger(value)?value:value.toFixed(1);return `<div class="gc-d2r-card ${capped?'gc-d2r-capped':''}"><div><b>${name}</b>${capped?'<small>已封頂</small>':''}</div><span>${show}% / ${cap}%</span><div class="gc-d2r-bar"><i style="width:${pct}%"></i></div></div>`;}).join('');
        let all = typeof d2rEquipTotals === 'function' ? d2rEquipTotals(player) : {}, groups=[
            ['攻擊／節奏','md,rd,mg,mh,rh,gh,as,mc,rc,gc,mcd,rcd,gcd,fpen,wpen,epen,apen,sdm,und,dem,dra,hsk,opn,exe,ber,fmp,shp,kfu,frz,brn,psn,bld,ctl,deb,fbr,wfr,eps,wbl'],
            ['防禦／受擊反應','hp,mp,hpp,mpp,ac,mr,er,dr,rf,rw,re,ra,rn,abr,bdr,pdr,mdr,ldr,adr,udr,ddr,blk,mgd,rcv,sav,bar,rip,ksh,krc'],
            ['資源／狩獵','mf,wt,hpr,mpr,pot,gf,xf,nd,bd,kh,km'],
            ['命中／觸發特效','ff,fw,fa,fe,ph,pm,kx,ts,pi,ks'],
            ['玩法改變','sp,fh']
        ];
        let summary=groups.map(([name,codes])=>{let rows=codes.split(',').filter(k=>(Number(all[k])||0)>0).map(k=>`${(typeof D2R_SHORT_LABEL!=='undefined'&&D2R_SHORT_LABEL[k])||(D2R_AFFIX_LABEL&&D2R_AFFIX_LABEL[k])||k} ${k==='ac'?'-':'+'}${Number(all[k]).toFixed(Number(all[k])%1?1:0)}${['as','mc','rc','gc','mcd','rcd','gcd','hpp','mpp','pot','abr','gf','xf','nd','bd','kx','ts','pi','ks','sp','fh','fpen','wpen','epen','apen','sdm','bdr','und','dem','dra','hsk','opn','exe','pdr','mdr','ldr','adr','udr','ddr','blk','mgd','rcv','sav','bar','rip','ber','fmp','shp','ksh','krc','kfu','frz','brn','psn','bld','ctl','deb','fbr','wfr','eps','wbl'].includes(k)?'%':''}`);return `<div class="gc-d2r-group"><b>${name}</b><span>${rows.length?rows.join('｜'):'目前沒有'}</span></div>`;}).join('');
        return `<div class="gc-d2r"><p class="text-slate-300 mb-3">以下為強化與耐久計算後的實際生效值；達到全身上限時顯示「已封頂」。寶石、符文與符文之語不列入八色詞綴增幅。</p>
            <div class="gc-d2r-grid">${cards}</div><h3 class="text-amber-300 font-bold mt-5 mb-2">全身八色詞綴分類</h3>${summary}</div>`;
    }
    function enchantCost(it,mode) {
        let qi=Math.max(0,D2R_QUALITY_KEYS.indexOf(it.d2q)),base=[10000,30000,100000,300000,1000000,3000000][qi]||0;
        let count=Math.max(0,Math.floor(Number(it.d2CraftCount)||0)),gold=Math.min(10000000,Math.ceil(base*(1+count*.5)*(mode==='value'?.5:1)));
        return {gold,rank:qi>=4?3:(qi>=2?1:0),qi};
    }
    function anyGemRankCount(rank) {
        return rank?GEM_IDS.filter(id=>{let g=gemDef(id);return g&&g.rank===rank;}).reduce((n,id)=>n+gemCount(id),0):0;
    }
    function takeAnyGemRank(rank) {
        if(!rank)return true;
        let id=GEM_IDS.find(x=>{let g=gemDef(x);return g&&g.rank===rank&&gemCount(x)>0;});
        return !!id&&takeGem(id,1);
    }
    function enchantCandidates() {
        let rows=[];Object.entries(player.eq||{}).forEach(([slot,it])=>{if(it&&d2rAffixRows(it).length)rows.push({key:'eq:'+slot,it,where:'已裝備'});});
        (player.inv||[]).forEach(it=>{if(it&&d2rAffixRows(it).length)rows.push({key:'inv:'+it.uid,it,where:'背包'});});return rows;
    }
    function enchantPanel() {
        let rows=enchantCandidates(),serial=0;
        let html=rows.length?rows.map(row=>{
            let it=row.it,qi=D2R_QUALITY_KEYS.indexOf(it.d2q),locked=qi>=6,sel='gc-enchant-'+serial++,type=enchantCost(it,'type'),value=enchantCost(it,'value');
            let opts=d2rAffixRows(it).map((r,i)=>`<option value="${i}">${i+1}. ${d2rAffixText(r)}</option>`).join('');
            let mat=type.rank?`＋任意 ${type.rank===1?'碎裂':'無瑕'}寶石 1 顆（持有 ${anyGemRankCount(type.rank)}）`:'';
            return `<div class="gc-enchant-item"><div><b>${getItemFullName(it)}</b><small>${row.where}・已改造 ${Math.max(0,Math.floor(Number(it.d2CraftCount)||0))} 次</small></div>
                <select id="${sel}" ${locked?'disabled':''}>${opts}</select><div class="gc-enchant-actions">
                <button ${locked?'disabled':''} onclick="growthEnchant('${esc(row.key)}',document.getElementById('${sel}').value,'type')">更換詞綴 ${type.gold.toLocaleString()}</button>
                <button ${locked?'disabled':''} onclick="growthEnchant('${esc(row.key)}',document.getElementById('${sel}').value,'value')">重骰數值 ${value.gold.toLocaleString()}</button></div>
                <small class="${locked?'text-red-300':'text-fuchsia-300'}">${locked?'不朽／太古裝備不可改造':`費用：金幣${mat}`}</small></div>`;
        }).join(''):'<p class="text-slate-400">目前沒有可改造的八色裝備。</p>';
        return `<div class="gc-enchant"><p class="text-slate-300 mb-3">任何地圖都能進行附魔改造。更換詞綴會保留原 T 階並改成適合該裝備的新能力；重骰數值只改變同 T 階區間內的數字。每次改造都會提高後續費用，最高 1,000 萬金幣。</p>${html}</div>`;
    }
    window.growthEnchant=function(key,index,mode){
        let target=locateGemTarget(key,false),it=target.it,indexN=Math.floor(Number(index));if(!it||!d2rAffixRows(it)[indexN])return;
        let cost=enchantCost(it,mode);if(cost.qi>=6){logSys('不朽與太古裝備不可附魔改造。');return;}
        if((player.gold||0)<cost.gold){logSys(`<span class="text-red-400">金幣不足，需要 ${cost.gold.toLocaleString()}。</span>`);return;}
        if(cost.rank&&anyGemRankCount(cost.rank)<1){logSys(`<span class="text-red-400">需要任意一顆${cost.rank===1?'碎裂':'無瑕'}寶石。</span>`);return;}
        target=locateGemTarget(key,true);it=target.it;
        if(!d2rRerollSingleAffix(it,indexN,mode)){logSys('目前沒有符合限制的新詞綴可供更換。');return;}
        player.gold-=cost.gold;if(cost.rank)takeAnyGemRank(cost.rank);it.d2CraftCount=Math.max(0,Math.floor(Number(it.d2CraftCount)||0))+1;it.junk=false;it._userKeep=true;
        calcStats();updateUI();renderTabs();saveGame();logSys(`<span class="text-fuchsia-300 font-bold">✦ ${getItemFullName(it)} 已完成${mode==='value'?'數值重骰':'詞綴更換'}。</span>`);renderGrowthCenter();
    };

    window.renderGrowthCenter = function () {
        let el=modal(), tab=el.dataset.tab||'panacea';
        let body = tab==='panacea'?panaceaRows():tab==='loadout'?loadoutRows():tab==='expedition'?expeditionRows():tab==='repair'?repairPanel():tab==='socket'?socketPanel():tab==='gems'?gemPanel():tab==='runes'?runePanel():tab==='alchemy'?alchemyPanel():tab==='d2r'?d2rOverviewPanel():tab==='enchant'?enchantPanel():rebirthPanel();
        el.innerHTML=`<style>
        #growth-center-modal .gc-shell{width:min(920px,96vw);height:min(920px,92vh);height:min(920px,92dvh);max-height:92vh;max-height:92dvh;overflow:hidden;display:flex;flex-direction:column;background:#0f172a;border:2px solid #a16207;border-radius:16px;color:#e2e8f0;box-shadow:0 0 60px #000}
        #growth-center-modal .gc-head,#growth-center-modal .gc-tabs{display:flex;flex:0 0 auto;gap:8px;align-items:center;padding:12px 16px;border-bottom:1px solid #334155;flex-wrap:wrap}
        #growth-center-modal .gc-head h2{font-size:22px;color:#fde68a;font-weight:bold;flex:1}#growth-center-modal button,#growth-center-modal select{background:#1e293b;border:1px solid #64748b;border-radius:7px;padding:7px 11px;color:#e2e8f0}
        #growth-center-modal button:hover:not(:disabled){filter:brightness(1.35)}#growth-center-modal button:disabled{opacity:.35}#growth-center-modal .active{background:#92400e;border-color:#f59e0b}
        #growth-center-modal .gc-body{padding:16px;overflow-y:auto;flex:1 1 auto;min-height:0;max-height:none;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}#growth-center-modal .gc-row,#growth-center-modal .gc-card{display:grid;grid-template-columns:1fr 2fr auto;gap:12px;align-items:center;padding:12px;margin-bottom:9px;background:#1e293b;border:1px solid #475569;border-radius:10px}
        #growth-center-modal .gc-card{grid-template-columns:1fr 1.4fr auto}#growth-center-modal .gc-row div,#growth-center-modal .gc-card div{display:flex;gap:6px}.gc-stat-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.gc-rebirth p{margin:10px 0;color:#cbd5e1}.gc-danger{background:#7f1d1d!important;border-color:#ef4444!important}
        #growth-center-modal .gc-repair-action{position:sticky;top:-1px;z-index:3;display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:4px 0 10px;background:#0f172a}#growth-center-modal .gc-repair-action button{flex:1;min-height:44px;background:#92400e;border-color:#f59e0b;color:#fef3c7;font-weight:bold}#growth-center-modal .gc-repair-action span{color:#fcd34d;white-space:nowrap}
        #growth-center-modal .gc-gem-equip{padding:12px;margin-bottom:10px;background:#1e293b;border:1px solid #475569;border-radius:10px;display:grid;gap:7px}#growth-center-modal .gc-gem-equip>small{color:#94a3b8}.gc-gem-slot{display:flex;gap:7px;align-items:center;padding:7px;border-top:1px solid #334155}.gc-gem-slot>span{flex:1}.gc-gem-slot select{max-width:420px}
        #growth-center-modal .gc-d2r-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.gc-d2r-card,.gc-d2r-group{padding:12px;background:#1e293b;border:1px solid #475569;border-radius:10px}.gc-d2r-card>div:first-child{display:flex;justify-content:space-between}.gc-d2r-card>span{display:block;color:#fde68a;font-weight:bold;margin:7px 0}.gc-d2r-card small{color:#4ade80}.gc-d2r-capped{border-color:#22c55e}.gc-d2r-bar{height:7px;background:#0f172a;border-radius:9px;overflow:hidden}.gc-d2r-bar i{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#22c55e)}.gc-d2r-group{display:grid;grid-template-columns:110px 1fr;gap:10px;margin-bottom:8px}.gc-d2r-group>b{color:#c4b5fd}.gc-d2r-group>span{color:#cbd5e1}
        #growth-center-modal .gc-enchant-item{display:grid;grid-template-columns:1.2fr 1.5fr auto;gap:10px;align-items:center;padding:12px;margin-bottom:10px;background:#1e293b;border:1px solid #7e22ce;border-radius:10px}.gc-enchant-item>div:first-child{display:grid}.gc-enchant-item small{color:#94a3b8}.gc-enchant-actions{display:flex;gap:6px}
        #growth-center-modal .gc-alchemy-status{display:flex;justify-content:space-between;gap:10px;padding:12px;background:#312e81;border:1px solid #8b5cf6;border-radius:10px}.gc-alchemy-fuse{display:grid;grid-template-columns:1fr auto 1fr auto;gap:8px;align-items:center}.gc-alchemy-core,.gc-alchemy-equip{display:grid;gap:6px;padding:12px;margin-bottom:9px;background:#1e293b;border:1px solid #7e22ce;border-radius:10px}.gc-alchemy-core small,.gc-alchemy-equip small{color:#c4b5fd}.gc-alchemy-core>span{color:#94a3b8}.gc-alchemy-equip>div{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.gc-alchemy-equip>div:first-child{display:grid}.gc-alchemy-equip>select{width:100%}
        @media(max-width:700px){#growth-center-modal .gc-row,#growth-center-modal .gc-card,.gc-enchant-item{grid-template-columns:1fr}.gc-stat-buttons,.gc-d2r-grid{grid-template-columns:1fr}.gc-d2r-group{grid-template-columns:1fr}#growth-center-modal .gc-repair-action{flex-direction:column;align-items:stretch}#growth-center-modal .gc-repair-action button{width:100%;min-height:48px;font-size:16px}#growth-center-modal .gc-repair-action span{text-align:center;font-size:13px}#growth-center-modal .gc-alchemy-fuse{grid-template-columns:1fr}#growth-center-modal .gc-alchemy-fuse>span{text-align:center}#growth-center-modal .gc-alchemy-fuse button,#growth-center-modal .gc-alchemy-fuse select{width:100%;min-height:46px}#growth-center-modal .gc-alchemy-status{flex-direction:column}}
        </style><div class="gc-shell"><div class="gc-head"><h2>♾️ 成長中心</h2><button onclick="closeGrowthCenter()">✕ 關閉</button></div>
        <div class="gc-tabs">${[['panacea','萬能藥'],['loadout','裝備預設'],['expedition','傭兵遠征'],['d2r','D2R 總覽'],['enchant','鐵匠附魔'],['repair','裝備維修'],['socket','裝備開孔'],['gems','寶石'],['runes','符文'],['alchemy','符文鍊金'],['rebirth','無限轉生']].map(x=>`<button class="${tab===x[0]?'active':''}" onclick="growthTab('${x[0]}')">${x[1]}</button>`).join('')}
        <button onclick="closeGrowthCenter();switchTab('automation',document.getElementById('btn-automation'))">自動狩獵設定</button><button onclick="closeGrowthCenter();openCollectionPanel()">圖鑑收藏</button></div>
        <div class="gc-body">${body}</div></div>`;
    };
})();
