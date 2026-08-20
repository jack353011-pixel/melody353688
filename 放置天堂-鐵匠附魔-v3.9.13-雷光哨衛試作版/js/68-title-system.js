// 🏷️ 稱號系統：稱號只作展示與歷史紀錄，不提供任何能力值。
(function (global) {
    'use strict';

    const VERSION = 3;
    const CATEGORIES = [
        { id:'achievement', name:'成就', icon:'🏆' },
        { id:'story', name:'劇情', icon:'📜' },
        { id:'clan', name:'血盟', icon:'🛡️' },
        { id:'war', name:'國戰', icon:'🐉' },
        { id:'castle', name:'城主', icon:'🏰' },
        { id:'hidden', name:'隱藏', icon:'✦' }
    ];
    const DEFINITIONS = [
        { id:'first_steps', category:'achievement', name:'初入亞丁', icon:'🌱', rarity:'common', requirement:'角色等級達到 10。', criterion:'level', value:10 },
        { id:'veteran_adventurer', category:'achievement', name:'歷戰冒險者', icon:'🗡️', rarity:'rare', requirement:'角色等級達到 50。', criterion:'level', value:50 },
        { id:'century_legend', category:'achievement', name:'百級傳說', icon:'👑', rarity:'legend', requirement:'角色等級達到 100。', criterion:'level', value:100 },
        { id:'aden_millionaire', category:'achievement', name:'亞丁富豪', icon:'💰', rarity:'rare', requirement:'角色身上金幣曾達到 1,000,000。', criterion:'gold', value:1000000 },
        { id:'goblin_slayer', category:'achievement', name:'哥布林屠夫', icon:'⚔️', rarity:'common', requirement:'累計擊殺 10,000 隻名稱含「哥布林」的怪物。', criterion:'goblinKills', value:10000 },
        { id:'death_knight_hunter', category:'achievement', name:'死亡騎士獵人', icon:'💀', rarity:'rare', requirement:'擊敗死亡騎士。', criterion:'deathKnightKills', value:1 },
        { id:'kurt_conqueror', category:'achievement', name:'克特征服者', icon:'⚡', rarity:'rare', requirement:'擊敗克特。', criterion:'kurtKills', value:1 },
        { id:'fire_dragon_slayer', category:'achievement', name:'火龍討伐者', icon:'🔥', rarity:'rare', requirement:'擊敗巴拉卡斯。', criterion:'valakasKills', value:1 },
        { id:'millennial_truth_witness', category:'achievement', name:'千年真相的見證者', icon:'🏺', rarity:'legend', requirement:'完成全部遺物圖鑑。', criterion:'allRelics' },

        { id:'antharas_cleanser', category:'story', name:'安塔瑞斯淨化者', icon:'🌿', rarity:'rare', requirement:'擊敗被侵蝕的瘋狂安塔瑞斯。', criterion:'corruptedAntharasKills', value:1 },
        { id:'kingdom_traitor', category:'story', name:'王國叛徒', icon:'📜', rarity:'rare', requirement:'在特殊劇情或政治事件中作出對應選擇。', criterion:'storyFlag', flag:'kingdomTraitor' },

        { id:'clan_companion', category:'clan', name:'同盟之證', icon:'🤝', rarity:'common', requirement:'目前已加入血盟。', criterion:'clanMember', current:true },
        { id:'clan_leader', category:'clan', name:'血盟盟主', icon:'🛡️', rarity:'rare', requirement:'目前為血盟盟主。', criterion:'clanLeader', current:true },
        { id:'dragon_clan_hero', category:'clan', name:'龍族英雄', icon:'🐲', rarity:'legend', requirement:'加入血盟，並在任一陣營累積 240 國戰聲望。', criterion:'clanWarHero' },

        { id:'war_recruit', category:'war', name:'陣營新兵', icon:'⚑', rarity:'common', requirement:'任一陣營聲望達 15。', criterion:'warReputation', value:15 },
        { id:'frontline_knight', category:'war', name:'戰線騎士', icon:'⚔️', rarity:'common', requirement:'任一陣營聲望達 50。', criterion:'warReputation', value:50 },
        { id:'faction_standard_bearer', category:'war', name:'陣營旗手', icon:'🚩', rarity:'rare', requirement:'任一陣營聲望達 120。', criterion:'warReputation', value:120 },
        { id:'national_war_hero', category:'war', name:'國戰英傑', icon:'🐉', rarity:'legend', requirement:'任一陣營聲望達 240。', criterion:'warReputation', value:240 },
        { id:'kingdom_warlord', category:'war', name:'王國戰神', icon:'⚜️', rarity:'legend', requirement:'任一陣營聲望達 500。', criterion:'warReputation', value:500 },
        { id:'first_war_veteran', category:'war', name:'第一季戰線見證者', icon:'⌛', rarity:'rare', requirement:'參與第 1 季國戰；換季後仍永久保留。', criterion:'warSeason', value:1 },
        { id:'three_season_veteran', category:'war', name:'三季老兵', icon:'🎖️', rarity:'rare', requirement:'累計參與三個不同國戰賽季。', criterion:'warSeasonCount', value:3 },

        { id:'kent_lord', category:'castle', name:'肯特城主', icon:'♛', rarity:'legend', requirement:'目前是佔領肯特城之血盟盟主。', criterion:'castleLeader', city:'kent', current:true },
        { id:'windwood_lord', category:'castle', name:'風木城主', icon:'♛', rarity:'legend', requirement:'目前是佔領風木城之血盟盟主。', criterion:'castleLeader', city:'windwood', current:true },
        { id:'heine_lord', category:'castle', name:'海音城主', icon:'♛', rarity:'legend', requirement:'目前是佔領海音城之血盟盟主。', criterion:'castleLeader', city:'heine', current:true },
        { id:'first_kent_siege_survivor', category:'castle', name:'第一次肯特攻城戰生還者', icon:'🏰', rarity:'rare', requirement:'完成一次肯特攻城戰並獲勝；失去城池後仍永久保留。', criterion:'siegeWins', city:'kent', value:1 },
        { id:'first_windwood_siege_survivor', category:'castle', name:'風木攻城戰生還者', icon:'🌲', rarity:'rare', requirement:'完成一次風木城攻城戰並獲勝；失去城池後仍永久保留。', criterion:'siegeWins', city:'windwood', value:1 },
        { id:'first_heine_siege_survivor', category:'castle', name:'海音攻城戰生還者', icon:'🌊', rarity:'rare', requirement:'完成一次海音城攻城戰並獲勝；失去城池後仍永久保留。', criterion:'siegeWins', city:'heine', value:1 },
        { id:'three_castle_conqueror', category:'castle', name:'三城征服者', icon:'🗺️', rarity:'legend', requirement:'曾分別攻下肯特城、風木城與海音城。', criterion:'allCastleWins' },

        { id:'abyss_returner', category:'hidden', name:'深淵歸來者', icon:'🜏', rarity:'legend', requirement:'擊敗吉爾塔斯。', criterion:'giltasKills', value:1, hidden:true },
        { id:'forgotten_one', category:'hidden', name:'被遺忘之人', icon:'✦', rarity:'legend', requirement:'隱藏劇情條件尚未揭露。', criterion:'storyFlag', flag:'forgottenOne', hidden:true }
    ];
    const DEFINITION_BY_ID = Object.fromEntries(DEFINITIONS.map(def => [def.id, def]));

    function number(value) {
        value = Math.floor(Number(value) || 0);
        return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, value));
    }
    function defaultState() {
        return {
            version:VERSION,
            equipped:null,
            unlocked:{},
            progress:{ goblinKills:0, deathKnightKills:0, kurtKills:0, giltasKills:0, valakasKills:0, corruptedAntharasKills:0, siegeWins:{} },
            storyFlags:{}
        };
    }
    function normalize(raw) {
        let out = defaultState(), source = raw && typeof raw === 'object' ? raw : {};
        out.equipped = DEFINITION_BY_ID[source.equipped] ? source.equipped : null;
        if (source.unlocked && typeof source.unlocked === 'object' && !Array.isArray(source.unlocked)) {
            Object.keys(source.unlocked).forEach(id => {
                if (DEFINITION_BY_ID[id] && !DEFINITION_BY_ID[id].current) out.unlocked[id] = Math.max(1, number(source.unlocked[id]) || 1);
            });
        }
        let progress = source.progress && typeof source.progress === 'object' ? source.progress : {};
        out.progress.goblinKills = number(progress.goblinKills);
        out.progress.deathKnightKills = number(progress.deathKnightKills);
        out.progress.kurtKills = number(progress.kurtKills);
        out.progress.giltasKills = number(progress.giltasKills);
        out.progress.valakasKills = number(progress.valakasKills);
        out.progress.corruptedAntharasKills = number(progress.corruptedAntharasKills);
        let wins = progress.siegeWins && typeof progress.siegeWins === 'object' ? progress.siegeWins : {};
        ['kent','windwood','heine'].forEach(city => { out.progress.siegeWins[city] = number(wins[city]); });
        if (source.storyFlags && typeof source.storyFlags === 'object' && !Array.isArray(source.storyFlags)) {
            Object.keys(source.storyFlags).slice(0, 32).forEach(flag => { if (source.storyFlags[flag]) out.storyFlags[String(flag).slice(0, 64)] = true; });
        }
        return out;
    }
    function conditionMet(def, state, sources) {
        sources = sources || {};
        switch (def.criterion) {
            case 'level': return number(sources.level) >= def.value;
            case 'gold': return number(sources.gold) >= def.value;
            case 'goblinKills': return state.progress.goblinKills >= def.value;
            case 'deathKnightKills': return state.progress.deathKnightKills >= def.value;
            case 'kurtKills': return state.progress.kurtKills >= def.value;
            case 'giltasKills': return state.progress.giltasKills >= def.value;
            case 'valakasKills': return state.progress.valakasKills >= def.value;
            case 'corruptedAntharasKills': return state.progress.corruptedAntharasKills >= def.value;
            case 'allRelics': return number(sources.relicTotal) > 0 && number(sources.relicGot) >= number(sources.relicTotal);
            case 'storyFlag': return !!state.storyFlags[def.flag];
            case 'clanMember': return !!sources.clanMember;
            case 'clanLeader': return !!sources.clanLeader;
            case 'clanWarHero': return !!sources.clanMember && number(sources.warReputation) >= 240;
            case 'warReputation': return number(sources.warReputation) >= def.value;
            case 'warSeason': return Array.isArray(sources.warSeasons) && sources.warSeasons.includes(def.value);
            case 'warSeasonCount': return new Set(Array.isArray(sources.warSeasons) ? sources.warSeasons : []).size >= def.value;
            case 'castleLeader': return !!sources.clanLeader && sources.castleCity === def.city;
            case 'siegeWins': return number(state.progress.siegeWins[def.city]) >= def.value || (def.city === 'kent' && !!sources.legacyKentWin);
            case 'allCastleWins': return ['kent','windwood','heine'].every(city => number(state.progress.siegeWins[city]) >= 1);
            default: return false;
        }
    }
    function isAvailable(def, state, sources) {
        if (!def) return false;
        return def.current ? conditionMet(def, state, sources) : !!state.unlocked[def.id];
    }
    function evaluate(raw, sources, now) {
        let state = normalize(raw), added = [], at = Math.max(1, number(now) || Date.now());
        DEFINITIONS.forEach(def => {
            if (!def.current && !state.unlocked[def.id] && conditionMet(def, state, sources)) {
                state.unlocked[def.id] = at;
                added.push(def.id);
            }
        });
        if (state.equipped && !isAvailable(DEFINITION_BY_ID[state.equipped], state, sources)) state.equipped = null;
        return { state:state, added:added };
    }
    function recordKills(raw, rows) {
        let state = normalize(raw);
        (Array.isArray(rows) ? rows : []).forEach(row => {
            let name = String(row && row.name || ''), count = number(row && row.count);
            if (!name || !count) return;
            if (name.includes('哥布林')) state.progress.goblinKills = number(state.progress.goblinKills + count);
            if (name === '死亡騎士') state.progress.deathKnightKills = number(state.progress.deathKnightKills + count);
            if (name === '克特') state.progress.kurtKills = number(state.progress.kurtKills + count);
            if (name === '吉爾塔斯') state.progress.giltasKills = number(state.progress.giltasKills + count);
            if (name.includes('巴拉卡斯')) state.progress.valakasKills = number(state.progress.valakasKills + count);
            if (name.includes('被侵蝕的瘋狂安塔瑞斯')) state.progress.corruptedAntharasKills = number(state.progress.corruptedAntharasKills + count);
        });
        return state;
    }
    function recordSiege(raw, city, won) {
        let state = normalize(raw);
        if (won && Object.prototype.hasOwnProperty.call(state.progress.siegeWins, city)) state.progress.siegeWins[city] = number(state.progress.siegeWins[city] + 1);
        return state;
    }
    function setEquipped(raw, id, sources) {
        let checked = evaluate(raw, sources), state = checked.state;
        if (id == null || id === '') { state.equipped = null; return { ok:true, state:state }; }
        let def = DEFINITION_BY_ID[id];
        if (!isAvailable(def, state, sources)) return { ok:false, error:'尚未取得這個稱號。', state:state };
        state.equipped = id;
        return { ok:true, state:state };
    }

    const Core = { VERSION, CATEGORIES, DEFINITIONS, DEFINITION_BY_ID, defaultState, normalize, conditionMet, isAvailable, evaluate, recordKills, recordSiege, setEquipped };
    global.TitleSystemCore = Core;

    let activeCategory = 'achievement';
    function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function liveSources() {
        let clanInfo = null, castleCity = null, clanLeader = false;
        try {
            if (typeof global.clanTitleSnapshot === 'function') {
                let snapshot = global.clanTitleSnapshot(player);
                clanInfo = snapshot && snapshot.member ? { name:snapshot.name } : null;
                castleCity = snapshot && snapshot.castleCity || null;
                clanLeader = !!(snapshot && snapshot.leader);
            } else {
                if (typeof global.clanGetModeInfo === 'function') clanInfo = global.clanGetModeInfo(player);
                if (typeof global.clanGetCastleCity === 'function') castleCity = global.clanGetCastleCity(player);
                if (typeof global.clanIsLeaderRole === 'function') clanLeader = global.clanIsLeaderRole(player);
            }
        } catch (e) {}
        let war = null;
        try { if (global.DragonFactionWarCore) war = global.DragonFactionWarCore.normalize(player.dragonWar); } catch (e) {}
        let warReputation = war ? Math.max(Number(war.reputation.light) || 0, Number(war.reputation.dark) || 0) : 0;
        let warSeasons = war ? Object.keys(war.seasonRecords || {}).filter(key => war.seasonRecords[key] && war.seasonRecords[key].participated).map(Number) : [];
        let relicIds = typeof RELIC_ITEM_CAT !== 'undefined' && RELIC_ITEM_CAT ? Object.keys(RELIC_ITEM_CAT) : [];
        let relicDex = player && player.relicDex && typeof player.relicDex === 'object' ? player.relicDex : {};
        return {
            level:number(player && player.lv),
            gold:number(player && player.gold),
            clanMember:!!clanInfo,
            clanLeader:!!clanLeader,
            clanName:clanInfo ? String(clanInfo.name || '') : '',
            castleCity:castleCity,
            warReputation:warReputation,
            warSeasons:warSeasons,
            relicTotal:relicIds.length,
            relicGot:relicIds.filter(id => relicDex[id]).length,
            legacyKentWin:!!(player && player.siege && player.siege.city === 'kent' && player.siege.result === 'win')
        };
    }
    function announce(ids) {
        if (!ids || !ids.length || typeof global.logSys !== 'function') return;
        ids.forEach(id => {
            let def = DEFINITION_BY_ID[id];
            if (def) global.logSys(`<span class="text-amber-300 font-bold">🏷️ 獲得稱號【${esc(def.name)}】</span><span class="text-slate-300">（稱號不增加能力，可點角色名字上方自由展示）</span>`);
        });
    }
    function sync(silent) {
        if (typeof player === 'undefined' || !player || !player.cls) return defaultState();
        let result = evaluate(player.titleState, liveSources());
        player.titleState = result.state;
        if (!silent) announce(result.added);
        return result.state;
    }
    function recordKill(mob, count) {
        if (typeof player === 'undefined' || !player || !mob) return;
        player.titleState = recordKills(player.titleState, [{ name:mob.n, count:count || 1 }]);
        sync(false);
    }
    function recordOfflineKills(profile, normalKills, bossPlan, normalPlan) {
        if (typeof player === 'undefined' || !player) return;
        let rows = [];
        try {
            if (Array.isArray(normalPlan)) normalPlan.forEach(row => rows.push({ name:row.mob && row.mob.n, count:row.kills }));
            else if (profile && Array.isArray(profile.mobs) && profile.mobs.length === 1) rows.push({ name:profile.mobs[0].n, count:normalKills });
        } catch (e) {}
        if (bossPlan && Array.isArray(bossPlan.rows)) bossPlan.rows.forEach(row => rows.push({ name:row.mob && row.mob.n, count:row.kills }));
        player.titleState = recordKills(player.titleState, rows);
        sync(false);
    }
    function recordSiegeResult(city, result) {
        if (typeof player === 'undefined' || !player) return;
        player.titleState = recordSiege(player.titleState, city, result === 'win' || result === true);
        sync(false);
    }
    function setStoryFlag(flag) {
        if (typeof player === 'undefined' || !player || !flag) return;
        let state = normalize(player.titleState);
        state.storyFlags[String(flag).slice(0, 64)] = true;
        player.titleState = state;
        sync(false);
    }
    function clanLine(sources) {
        if (!sources.clanMember || !sources.clanName) return '';
        return `〈${sources.clanName}${sources.clanLeader ? '・盟主' : ''}〉`;
    }
    function refreshDisplay() {
        if (typeof document === 'undefined') return;
        let button = document.getElementById('st-title'), clan = document.getElementById('st-clan-line');
        if (typeof player === 'undefined' || !player || !player.cls) {
            if (button) button.textContent = '＋ 選擇稱號';
            if (clan) clan.textContent = '';
            return;
        }
        let sources = liveSources(), result = evaluate(player.titleState, sources), state = result.state;
        player.titleState = state;
        let def = DEFINITION_BY_ID[state.equipped];
        if (button) {
            button.textContent = def ? `${def.rarity === 'legend' ? '✦ ' : ''}【${def.name}】` : '＋ 選擇稱號';
            button.dataset.rarity = def ? def.rarity : 'none';
            button.title = def ? `目前展示：${def.name}（點擊更換）` : '點擊選擇展示稱號';
        }
        if (clan) {
            clan.textContent = clanLine(sources);
            clan.style.display = clan.textContent ? '' : 'none';
        }
    }
    function ensurePanel() {
        if (typeof document === 'undefined') return null;
        let overlay = document.getElementById('title-system-overlay');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'title-system-overlay';
        overlay.className = 'title-system-overlay hidden';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', '稱號圖鑑');
        overlay.innerHTML = '<div class="title-system-panel"><div class="title-system-head"><div><strong>🏷️ 稱號圖鑑</strong><small>一次只展示一個稱號，不提供能力加成</small></div><button type="button" onclick="closeTitlePanel()" aria-label="關閉稱號圖鑑">✕</button></div><div id="title-system-tabs" class="title-system-tabs"></div><div id="title-system-summary" class="title-system-summary"></div><div id="title-system-list" class="title-system-list"></div><button type="button" class="title-system-remove" onclick="titleEquip(null)">不展示稱號</button></div>';
        overlay.addEventListener('click', event => { if (event.target === overlay) closePanel(); });
        document.body.appendChild(overlay);
        return overlay;
    }
    function renderPanel() {
        let overlay = ensurePanel();
        if (!overlay || typeof player === 'undefined' || !player || !player.cls) return;
        let sources = liveSources(), result = evaluate(player.titleState, sources), state = result.state;
        player.titleState = state;
        let tabs = document.getElementById('title-system-tabs');
        let summary = document.getElementById('title-system-summary');
        let list = document.getElementById('title-system-list');
        if (!tabs || !summary || !list) return;
        tabs.innerHTML = CATEGORIES.map(category => {
            let defs = DEFINITIONS.filter(def => def.category === category.id);
            let got = defs.filter(def => isAvailable(def, state, sources)).length;
            return `<button type="button" class="${activeCategory === category.id ? 'active' : ''}" onclick="titleSetCategory('${category.id}')"><span>${category.icon} ${category.name}</span><small>${got}/${defs.length}</small></button>`;
        }).join('');
        let category = CATEGORIES.find(row => row.id === activeCategory) || CATEGORIES[0];
        let defs = DEFINITIONS.filter(def => def.category === category.id);
        let got = defs.filter(def => isAvailable(def, state, sources)).length;
        summary.innerHTML = `<span>${category.icon} ${category.name}稱號</span><span>已取得 ${got} / ${defs.length}</span>`;
        list.innerHTML = defs.map(def => {
            let available = isAvailable(def, state, sources), equipped = state.equipped === def.id;
            let hidden = def.hidden && !available;
            let name = hidden ? '？？？' : def.name;
            let requirement = hidden ? '達成隱藏條件後才會揭露。' : def.requirement;
            let action = equipped ? '展示中' : (available ? '點擊展示' : '尚未取得');
            return `<button type="button" class="title-system-card rarity-${def.rarity}${available ? ' unlocked' : ' locked'}${equipped ? ' equipped' : ''}" onclick="titleEquip('${def.id}')" ${available ? '' : 'disabled'}><span class="title-system-emblem">${hidden ? '？' : def.icon}</span><span class="title-system-copy"><strong>【${esc(name)}】</strong><small>${esc(requirement)}</small></span><span class="title-system-action">${action}</span></button>`;
        }).join('');
    }
    function openPanel() {
        let overlay = ensurePanel();
        if (!overlay) return;
        renderPanel();
        overlay.classList.remove('hidden');
    }
    function closePanel() {
        let overlay = typeof document !== 'undefined' ? document.getElementById('title-system-overlay') : null;
        if (overlay) overlay.classList.add('hidden');
    }
    function setCategory(category) {
        if (CATEGORIES.some(row => row.id === category)) activeCategory = category;
        renderPanel();
    }
    function equip(id) {
        if (typeof player === 'undefined' || !player) return;
        let result = setEquipped(player.titleState, id, liveSources());
        player.titleState = result.state;
        if (!result.ok) { if (typeof global.alert === 'function') global.alert(result.error); return; }
        refreshDisplay();
        renderPanel();
        try { if (typeof global.saveGame === 'function') global.saveGame(); } catch (e) {}
    }

    global.titleSyncUnlocks = sync;
    global.titleRecordKill = recordKill;
    global.titleRecordOfflineKills = recordOfflineKills;
    global.titleRecordSiege = recordSiegeResult;
    global.titleSetStoryFlag = setStoryFlag;
    global.refreshTitleDisplay = refreshDisplay;
    global.openTitlePanel = openPanel;
    global.closeTitlePanel = closePanel;
    global.titleSetCategory = setCategory;
    global.titleEquip = equip;
    if (typeof global.addEventListener === 'function') global.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });
})(typeof window !== 'undefined' ? window : globalThis);
