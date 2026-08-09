// ========== 🔮 寶珠系統 v1 ==========
// 寶石強化數值、符文提供配方；寶珠改變流派節奏。固定核心／共鳴／守護三格，避免三顆純攻擊寶珠造成乘算膨脹。
const ORB_MAX_LEVEL = 5;
const ORB_UPGRADE_COST = {1:30,2:60,3:120,4:240};
const ORB_RANK_NAME = {1:'破碎',2:'完整',3:'精製',4:'古代',5:'神話'};
const ORB_SLOT_NAME = {core:'核心',resonance:'共鳴',guard:'守護'};
const ORB_DEFS = {
    orb_ember:{slot:'core',icon:'🔥',n:'熾心寶珠',color:'#fb923c',condition:'灼燒',ele:'fire',story:'灰燼裡仍有心跳。守火者說，那是第一輪日出留下的脈搏。'},
    orb_frost:{slot:'core',icon:'❄️',n:'寒星寶珠',color:'#7dd3fc',condition:'冰凍',ele:'water',story:'星光墜入冰湖後不曾熄滅，只是不再發出聲音。'},
    orb_decay:{slot:'core',icon:'☣️',n:'腐壤寶珠',color:'#86efac',condition:'中毒',ele:'earth',story:'古樹拒絕死去，便將腐朽藏進根鬚，等待下一場雨。'},
    orb_gale:{slot:'core',icon:'🌪️',n:'風痕寶珠',color:'#c4b5fd',condition:'流血',ele:'wind',story:'無名劍士最後一刀沒有落下，傷口卻隨風留在敵人身上。'},
    orb_dawn:{slot:'core',icon:'🌅',n:'曙光寶珠',color:'#fde68a',story:'第一道光不是為勝者升起，而是為仍願意踏出城門的人。'},
    orb_dusk:{slot:'core',icon:'🌘',n:'暮影寶珠',color:'#a5b4fc',story:'黃昏收走將熄的名字，讓最後一擊不必記住死者的臉。'},
    orb_echo:{slot:'resonance',icon:'〽️',n:'回響寶珠',color:'#e879f9',story:'被遺忘的咒語仍在空殿回返，直到有人再次聽見。'},
    orb_hunter:{slot:'resonance',icon:'🜲',n:'獵魂寶珠',color:'#facc15',story:'獵人不追逐足跡；他等待戰利品的靈魂先暴露方向。'},
    orb_rhythm:{slot:'resonance',icon:'🎵',n:'律動寶珠',color:'#67e8f9',story:'第五次鐘聲永遠比前四次更重，因為守夜人只敲給仍醒著的人聽。'},
    orb_focus:{slot:'resonance',icon:'◉',n:'凝息寶珠',color:'#93c5fd',story:'法師將未曾出口的咒文封在珠心，魔力滿盈時才聽得見。'},
    orb_iron:{slot:'guard',icon:'🛡️',n:'鐵壁寶珠',color:'#94a3b8',story:'城牆崩毀後，仍有一小塊石頭記得自己曾保護過誰。'},
    orb_devour:{slot:'guard',icon:'🩸',n:'噬魔寶珠',color:'#fda4af',story:'它吞食逸散的法力，卻用溫熱的血回報持有者。'},
    orb_recovery:{slot:'guard',icon:'🌿',n:'回生寶珠',color:'#6ee7b7',story:'被踩碎的嫩芽沒有復仇，只從足印中央重新生長。'},
    orb_aegis:{slot:'guard',icon:'🔷',n:'靈幕寶珠',color:'#818cf8',story:'古代術士把最後一層結界縮成珠子，留給無法回家的學徒。'}
};

function orbClampInt(v,min,max){return Math.max(min,Math.min(max,Math.floor(Number(v)||0)));}
function orbEnsure(owner){
    if(!owner||typeof owner!=='object')return null;
    let o=owner.orbs;
    if(!o||typeof o!=='object'||Array.isArray(o))o=owner.orbs={};
    o.dust=orbClampInt(o.dust,0,999999999);
    if(!o.owned||typeof o.owned!=='object'||Array.isArray(o.owned))o.owned={};
    Object.keys(o.owned).forEach(id=>{
        if(!ORB_DEFS[id]){delete o.owned[id];return;}
        let row=o.owned[id];if(!row||typeof row!=='object')row=o.owned[id]={};
        row.level=orbClampInt(row.level||1,1,ORB_MAX_LEVEL);
    });
    if(!o.equipped||typeof o.equipped!=='object')o.equipped={};
    Object.keys(ORB_SLOT_NAME).forEach(slot=>{
        let id=String(o.equipped[slot]||'');
        o.equipped[slot]=(id&&ORB_DEFS[id]&&ORB_DEFS[id].slot===slot&&o.owned[id])?id:'';
    });
    o.introDrops=orbClampInt(o.introDrops,0,3);
    o.trialClaimed=!!o.trialClaimed;
    return o;
}
function orbOwned(owner,id){let o=orbEnsure(owner);return !!(o&&o.owned[id]);}
function orbLevel(owner,id){let o=orbEnsure(owner);return o&&o.owned[id]?o.owned[id].level:0;}
function orbEquipped(owner,slot,normalized){let o=normalized||orbEnsure(owner),id=o&&o.equipped[slot];return id&&ORB_DEFS[id]&&o.owned[id]?{id,def:ORB_DEFS[id],level:o.owned[id].level}:null;}
function orbCoreBonus(level){return 5+orbClampInt(level,1,5);}                 // 6%～10%
function orbEchoRate(level){return 3+orbClampInt(level,1,5);}                  // 4%～8%，命中時 ×1.5（平均 2%～4%）
function orbHunterPct(level){return 1+orbClampInt(level,1,5);}                 // 2%～6% 掉落率
function orbIronPct(level){return 3+orbClampInt(level,1,5);}                   // 4%～8% 最終減傷
function orbDevourPct(level){return .5+.25*orbClampInt(level,1,5);}            // 每 5 秒 0.75%～1.75% HP
function orbRhythmPct(level){return 15+orbClampInt(level,1,5);}                // 每第 5 擊 +16%～20%，平均 3.2%～4%
function orbFocusPct(level){return 1+.6*orbClampInt(level,1,5);}                // 滿魔 +1.6%～4%
function orbRecoveryPct(level){return 3+orbClampInt(level,1,5);}               // 受傷後回復該次 4%～8%
function orbAegisPct(level){return 7+orbClampInt(level,1,5);}                  // 魔法最終減傷 8%～12%
function orbTargetCondition(target,kind){
    if(typeof d2rTargetCondition==='function')return d2rTargetCondition(target,kind);
    let st=target&&(target.st||target.statuses)||{};
    if(kind==='brn')return (st.burn||0)>0||!!(target&&target._burnDot&&target._burnDot.left>0);
    if(kind==='frz')return (st.freeze||0)>0;
    if(kind==='psn')return (st.poison||0)>0||!!(target&&target._burstPoison&&target._burstPoison.left>0);
    if(kind==='bld')return (st.bleed||0)>0||!!(target&&target.bleeds&&target.bleeds.length);
    return false;
}

// 單一傷害結算只執行一次，不製造額外傷害事件，因此不會遞迴觸發寶珠。
function orbOutgoingDamage(owner,target,dmg,ele){
    dmg=Math.max(0,Number(dmg)||0);if(!owner||!target||!dmg)return Math.max(0,Math.floor(dmg));
    let orbs=orbEnsure(owner),core=orbEquipped(owner,'core',orbs),pct=0;
    if(core&&core.def.ele===ele){
        let kind={fire:'brn',water:'frz',earth:'psn',wind:'bld'}[ele];
        if(kind&&orbTargetCondition(target,kind))pct+=orbCoreBonus(core.level);
    }else if(core&&core.id==='orb_dawn'){
        let hp=Math.max(0,Number(target.curHp)||0),mhp=Math.max(1,Number(target.hp)||1);
        if(hp/mhp>=.9)pct+=orbCoreBonus(core.level);
    }else if(core&&core.id==='orb_dusk'){
        let hp=Math.max(0,Number(target.curHp)||0),mhp=Math.max(1,Number(target.hp)||1);
        if(hp/mhp<=.3)pct+=orbCoreBonus(core.level);
    }
    let resonance=orbEquipped(owner,'resonance',orbs);
    if(resonance&&resonance.id==='orb_echo'&&Math.random()*100<orbEchoRate(resonance.level)){
        pct+=50;
        let now=typeof state==='object'&&state?state.ticks:0;
        if(now>=(owner._orbEchoLogAt||0)&&typeof logCombat==='function'){
            owner._orbEchoLogAt=now+30;
            logCombat('<span class="font-bold" style="color:#e879f9">【回響寶珠】</span>傷害在空間中再次震盪。','player-special',owner===player?'player':'mercenary');
        }
    }else if(resonance&&resonance.id==='orb_rhythm'){
        owner._orbRhythmCount=orbClampInt(owner._orbRhythmCount,0,4)+1;
        if(owner._orbRhythmCount>=5){owner._orbRhythmCount=0;pct+=orbRhythmPct(resonance.level);}
    }else if(resonance&&resonance.id==='orb_focus'){
        let mmp=Math.max(0,Number(owner.mmp)||0);
        if(mmp>0&&(Number(owner.mp)||0)/mmp>=.9)pct+=orbFocusPct(resonance.level);
    }
    let guard=orbEquipped(owner,'guard',orbs);
    if(guard&&guard.id==='orb_devour'&&ele&&ele!=='none'){
        let now=typeof state==='object'&&state?state.ticks:0,hpKey=owner===player?'hp':'curHp',mhp=Math.max(1,Number(owner.mhp)||1);
        if(now>=(owner._orbDevourAt||0)&&(Number(owner[hpKey])||0)>0&&(Number(owner[hpKey])||0)<mhp){
            let heal=Math.max(1,Math.floor(mhp*orbDevourPct(guard.level)/100));
            owner[hpKey]=Math.min(mhp,(Number(owner[hpKey])||0)+heal);owner._orbDevourAt=now+50;
            if(typeof logCombat==='function')logCombat(`<span class="font-bold" style="color:#fda4af">【噬魔寶珠】</span>回復 ${heal} HP。`,'heal',owner===player?'player':'mercenary');
        }
    }
    return Math.max(1,Math.floor(dmg*(100+pct)/100));
}
function orbIncomingDamage(owner,dmg,source,kind){
    dmg=Math.max(0,Math.floor(Number(dmg)||0));let orbs=orbEnsure(owner),guard=orbEquipped(owner,'guard',orbs);
    if(!dmg||!guard)return dmg;
    if(guard.id==='orb_iron')return Math.max(1,Math.floor(dmg*(1-orbIronPct(guard.level)/100)));
    if(guard.id==='orb_aegis'&&kind==='magic')return Math.max(1,Math.floor(dmg*(1-orbAegisPct(guard.level)/100)));
    return dmg;
}
function orbAfterIncoming(owner,dmg){
    dmg=Math.max(0,Math.floor(Number(dmg)||0));let orbs=orbEnsure(owner),guard=orbEquipped(owner,'guard',orbs);
    if(!owner||!dmg||!guard||guard.id!=='orb_recovery')return;
    let hpKey=owner===player?'hp':'curHp',hp=Math.max(0,Number(owner[hpKey])||0),mhp=Math.max(1,Number(owner.mhp)||1);
    if(!hp||hp>=mhp)return;
    let heal=Math.min(mhp-hp,Math.max(1,Math.floor(dmg*orbRecoveryPct(guard.level)/100)));
    if(heal>0)owner[hpKey]=hp+heal;
}
function orbLootMultiplier(owner){let orbs=orbEnsure(owner),x=orbEquipped(owner,'resonance',orbs);return x&&x.id==='orb_hunter'?1+orbHunterPct(x.level)/100:1;}

function orbDropPoolForMob(mob,slot){
    let ids=[],race=String(mob&&mob.race||''),ele=String(mob&&mob.e||'none'),mr=Math.max(0,Number(mob&&mob.mr)||0);
    if(!slot||slot==='core'){
        let elemental={fire:'orb_ember',water:'orb_frost',earth:'orb_decay',wind:'orb_gale'}[ele];
        if(elemental)ids.push(elemental);
        if(race==='惡魔'||mob&&mob.un)ids.push('orb_dusk');
        else if(!elemental||mob&&mob.boss)ids.push('orb_dawn');
    }
    if(!slot||slot==='resonance'){
        if(race==='惡魔'||mob&&mob.un||mr>=30)ids.push('orb_echo','orb_focus');
        if(mob&&mob.boss||mob&&mob.hard)ids.push('orb_rhythm');
    if(!ids.length||(!(mob&&mob.boss)&&!(mob&&mob.hard)&&mr<30))ids.push('orb_hunter');
    }
    if(!slot||slot==='guard'){
        if(mob&&mob.hard||race==='巨人'||race==='高崙')ids.push('orb_iron');
        if(race==='惡魔'||mob&&mob.un||mr>=30)ids.push('orb_aegis');
        else ids.push('orb_devour','orb_recovery');
    }
    if(slot&&!ids.length)ids=Object.keys(ORB_DEFS).filter(id=>ORB_DEFS[id].slot===slot);
    if(!ids.length)ids=Object.keys(ORB_DEFS);
    return [...new Set(ids)];
}
function orbRandomId(slot,mob){
    let ids=orbDropPoolForMob(mob,slot);
    return ids[Math.floor(Math.random()*ids.length)]||'';
}
function orbGrant(owner,id,source){
    let o=orbEnsure(owner),def=ORB_DEFS[id];if(!o||!def)return false;
    if(o.owned[id]){
        let dust=15;o.dust+=dust;
        if(typeof logSys==='function')logSys(`<span class="text-fuchsia-300 font-bold">🔮 ${def.n} 化為 ${dust} 寶珠粉塵。</span>`);
        return false;
    }
    o.owned[id]={level:1};
    if(!o.equipped[def.slot])o.equipped[def.slot]=id;
    if(typeof logSys==='function')logSys(`<span class="font-bold" style="color:${def.color}">🔮 獲得${source?' '+source:''}「${def.n}」；已收入${ORB_SLOT_NAME[def.slot]}欄位。</span>`);
    return true;
}
function orbOnKill(mob){
    if(!mob||mob.race==='建築'||mob.race==='血盟'||mob.noGold)return;
    let o=orbEnsure(player);if(!o)return;
    let id='';
    if(mob.boss&&o.introDrops<3){
        let slot=['core','resonance','guard'][o.introDrops++];id=orbRandomId(slot,mob);
    }else{
        let rate=mob.boss?0.12:(mob.hard?0.002:0.0002);
        if(Math.random()>=rate)return;
        id=orbRandomId('',mob);
    }
    if(id)orbGrant(player,id,mob.boss?'頭目寶珠':'寶珠');
}

function orbPowerText(id,level){
    let d=ORB_DEFS[id],lv=orbClampInt(level,1,5);if(!d)return '';
    if(id==='orb_dawn')return `命中 HP 90% 以上敵人時，傷害 +${orbCoreBonus(lv)}%`;
    if(id==='orb_dusk')return `命中 HP 30% 以下敵人時，傷害 +${orbCoreBonus(lv)}%`;
    if(d.slot==='core')return `${d.ele==='fire'?'火':d.ele==='water'?'水':d.ele==='earth'?'地':'風'}屬性命中${d.condition}敵人時，傷害 +${orbCoreBonus(lv)}%`;
    if(id==='orb_echo')return `${orbEchoRate(lv)}% 機率使本次傷害提高 50%（不會再次觸發）`;
    if(id==='orb_hunter')return `一般物品掉落率 +${orbHunterPct(lv)}%（不影響寶石、符文與寶珠）`;
    if(id==='orb_rhythm')return `每第 5 次傷害提高 ${orbRhythmPct(lv)}%（平均最高 4%）`;
    if(id==='orb_focus')return `MP 90% 以上時，傷害 +${orbFocusPct(lv).toFixed(1).replace(/\.0$/,'')}%`;
    if(id==='orb_iron')return `受到的最終傷害 -${orbIronPct(lv)}%`;
    if(id==='orb_devour')return `造成元素傷害時，每 5 秒最多回復 ${orbDevourPct(lv).toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}% 最大 HP`;
    if(id==='orb_recovery')return `受傷後回復該次傷害的 ${orbRecoveryPct(lv)}%（致死傷害無效）`;
    if(id==='orb_aegis')return `受到的魔法最終傷害 -${orbAegisPct(lv)}%`;
    return '';
}
function orbRenderPanel(){
    let o=orbEnsure(player),ownedCount=Object.keys(ORB_DEFS).filter(id=>o.owned[id]).length,slotRows=Object.keys(ORB_SLOT_NAME).map(slot=>{
        let x=orbEquipped(player,slot,o);
        return `<div class="gc-orb-slot"><small>${ORB_SLOT_NAME[slot]}寶珠</small>${x?`<b style="color:${x.def.color}">${x.def.icon} ${x.def.n}</b><span>${ORB_RANK_NAME[x.level]}・Lv.${x.level}</span><button onclick="growthUnequipOrb('${slot}')">卸下</button>`:`<b class="text-slate-400">尚未裝備</b><span>只能裝備${ORB_SLOT_NAME[slot]}類寶珠</span>`}</div>`;
    }).join('');
    let cards=Object.keys(ORB_DEFS).map(id=>{
        let d=ORB_DEFS[id],row=o.owned[id],lv=row?row.level:1,equipped=o.equipped[d.slot]===id,cost=row&&lv<ORB_MAX_LEVEL?ORB_UPGRADE_COST[lv]:0;
        return `<article class="gc-orb-card ${row?'owned':'locked'}"><header><b style="color:${d.color}">${d.icon} ${d.n}</b><small>${ORB_SLOT_NAME[d.slot]}・${row?ORB_RANK_NAME[lv]+' Lv.'+lv:'尚未取得'}</small></header><p>${orbPowerText(id,lv)}</p><details><summary>殘響敘述</summary><p>${d.story}</p></details><div>${row?`<button ${equipped?'disabled':''} onclick="growthEquipOrb('${id}')">${equipped?'裝備中':'裝備'}</button><button ${lv>=ORB_MAX_LEVEL||o.dust<cost?'disabled':''} onclick="growthUpgradeOrb('${id}')">${lv>=ORB_MAX_LEVEL?'已滿級':`升級 ${cost} 粉塵`}</button>`:'<span class="text-slate-500">擊敗頭目或強敵取得</span>'}</div></article>`;
    }).join('');
    return `<div class="gc-orbs"><div class="gc-orb-summary"><b>寶珠粉塵：${o.dust.toLocaleString()}</b><span>已收集 ${ownedCount}/${Object.keys(ORB_DEFS).length}・固定三欄；核心最高 10%，共鳴平均／常駐最高 4%。</span>${o.trialClaimed?'':'<button onclick="growthClaimTrialOrbs()">領取試作寶珠</button>'}</div><div class="gc-orb-slots">${slotRows}</div><h3>寶珠收藏</h3><div class="gc-orb-grid">${cards}</div><p class="text-slate-400">前三次擊敗頭目會依序保底核心、共鳴、守護寶珠；之後頭目 12%、強敵 0.2%、一般敵人 0.02%。種類依怪物元素、種族與防禦特性決定；重複寶珠轉為 15 粉塵。寶珠傷害不會遞迴觸發寶珠。</p></div>`;
}
function growthClaimTrialOrbs(){
    let o=orbEnsure(player);if(!o||o.trialClaimed)return;o.trialClaimed=true;
    orbGrant(player,'orb_ember','試作');orbGrant(player,'orb_echo','試作');orbGrant(player,'orb_iron','試作');o.dust+=30;
    if(typeof saveGame==='function')saveGame();if(typeof renderGrowthCenter==='function')renderGrowthCenter();
}
function growthEquipOrb(id){
    let o=orbEnsure(player),d=ORB_DEFS[id];if(!o||!d||!o.owned[id])return;o.equipped[d.slot]=id;
    if(d.slot==='resonance')player._orbRhythmCount=0;
    if(typeof saveGame==='function')saveGame();if(typeof renderGrowthCenter==='function')renderGrowthCenter();
}
function growthUnequipOrb(slot){
    let o=orbEnsure(player);if(!o||!ORB_SLOT_NAME[slot])return;o.equipped[slot]='';
    if(typeof saveGame==='function')saveGame();if(typeof renderGrowthCenter==='function')renderGrowthCenter();
}
function growthUpgradeOrb(id){
    let o=orbEnsure(player),row=o&&o.owned[id];if(!row||row.level>=ORB_MAX_LEVEL)return;
    let cost=ORB_UPGRADE_COST[row.level];if(o.dust<cost)return;o.dust-=cost;row.level++;
    if(typeof logSys==='function')logSys(`<span class="text-fuchsia-300 font-bold">🔮 ${ORB_DEFS[id].n} 提升為 ${ORB_RANK_NAME[row.level]} Lv.${row.level}。</span>`);
    if(typeof saveGame==='function')saveGame();if(typeof renderGrowthCenter==='function')renderGrowthCenter();
}
