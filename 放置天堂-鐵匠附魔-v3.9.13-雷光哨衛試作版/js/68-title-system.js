// 🏷️ 稱號系統：稱號只作展示與歷史紀錄，不提供任何能力值。
(function (global) {
    'use strict';

    const VERSION = 5;
    const FORGOTTEN_ELITES = [
        '遺忘之島巨大鱷魚', '遺忘之島卡司特王', '遺忘之島食人妖精王',
        '遺忘之島獨眼巨人', '遺忘之島飛龍', '遺忘之島巨大牛人'
    ];
    const RASTABAD_ELDERS = [
        '長老．琪娜', '長老．安迪斯', '長老．巴塔斯', '長老．巴洛斯',
        '長老．巴陸德', '長老．拉曼斯', '長老．泰瑪斯', '長老．艾迪爾'
    ];
    const RASTABAD_KINGS = ['魔獸軍王巴蘭卡', '法令軍王蕾雅', '冥法軍王海露拜', '暗殺軍王史雷佛'];
    const STORY_EVENTS = [
        { id:'sherine_whisper', icon:'🌙', title:'席琳的低語', hint:'前往席琳所在的村莊。', maps:['town_sherine'], titleId:'sherine_listener', lines:['席琳沒有預言你的勝敗，只問你是否願意凝視世界的另一面。', '當你踏進她的領域，熟悉的亞丁也第一次露出陌生的輪廓。'] },
        { id:'rift_first_step', icon:'🌀', title:'裂痕彼端', hint:'親自踏入一次時空裂痕戰場。', maps:['rift_battle'], titleId:'rift_walker', lines:['龜裂之核在掌中崩碎，昨日與明日同時從裂口吹來。', '你留下的不是足跡，而是一段不屬於任何年代的回聲。'] },
        { id:'sunrise_seal', icon:'🌅', title:'日出國的殘印', hint:'深入日出之國的疆域。', maps:['sunrise_castle','sunrise_east','sunrise_west','sunrise_north'], titleId:'sunrise_envoy', lines:['城牆上的晨光照不散妖氣，守門人的名字也早已被風磨去。', '你帶回亞丁的，是一枚證明日出國仍在抵抗的殘印。'] },
        { id:'rastabad_gate', icon:'🕯️', title:'黑暗帝國之門', hint:'穿越拉斯塔巴德的入口或地底通道。', maps:['rastabad_gate','rastabad_cave1','rastabad_cave2','rastabad_cave3','rastabad_beast','king_baranka_room','law_king_room','necro_king_room','assassin_king_room','dark_magic_lab','necro_training','elder_room'], titleId:'rasta_infiltrator', lines:['門後沒有歡呼，只有被封印的軍令與仍在巡行的亡魂。', '拉斯塔巴德沒有真正覆滅；它只是把王朝藏進更深的黑暗。'] },
        { id:'elder_testimony', icon:'📚', title:'八長老的證詞', hint:'擊敗八位不同的拉斯塔巴德長老。', titleId:'elder_chronicler', lines:['八位長老各自守著一段互相矛盾的歷史。', '當最後一人倒下，散落的證詞拼出同一個答案：王朝的終局從來不是意外。'] },
        { id:'four_kings_fall', icon:'♜', title:'四軍王的終局', hint:'分別擊敗拉斯塔巴德四大軍王。', titleId:'four_kings_end', lines:['魔獸、法令、冥法與暗殺的徽印終於不再回應軍令。', '四支軍團一同沉默，黑暗帝國最後的王座也失去了支柱。'] }
    ];
    const STORY_EVENT_BY_ID = Object.fromEntries(STORY_EVENTS.map(event => [event.id, event]));
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
        { id:'echo_listener', category:'achievement', name:'殘響聆聽者', icon:'◈', rarity:'rare', requirement:'發現 20 段世界殘響。', criterion:'loreFragments', value:20 },
        { id:'story_wayfarer', category:'achievement', name:'亞丁行腳者', icon:'🧭', rarity:'rare', requirement:'完成四段不同的故事事件。', criterion:'storyEventCount', value:4 },

        { id:'antharas_cleanser', category:'story', name:'安塔瑞斯淨化者', icon:'🌿', rarity:'rare', requirement:'擊敗被侵蝕的瘋狂安塔瑞斯。', criterion:'corruptedAntharasKills', value:1 },
        { id:'kingdom_traitor', category:'story', name:'王國叛徒', icon:'📜', rarity:'rare', requirement:'王國分裂事件中，選擇公開被掩藏的歷史。與「王國守護者」互斥，且與國戰光／暗陣營無關。', criterion:'storyFlag', flag:'kingdomTraitor' },
        { id:'kingdom_guardian', category:'story', name:'王國守護者', icon:'⚜️', rarity:'rare', requirement:'王國分裂事件中，選擇維持現行秩序。與「王國叛徒」互斥，且與國戰光／暗陣營無關。', criterion:'storyFlag', flag:'kingdomGuardian' },
        { id:'oblivion_explorer', category:'story', name:'迷霧踏破者', icon:'🏝️', rarity:'rare', requirement:'完成依斯巴的航程，親自登上遺忘之島。', criterion:'storyFlag', flag:'oblivionExplorer' },
        { id:'sunrise_exorcist', category:'story', name:'日出除妖師', icon:'🦊', rarity:'legend', requirement:'擊敗白面金毛九尾狐・殺生石。', criterion:'nineTailedFoxKills', value:1 },
        { id:'dantes_witness', category:'story', name:'冥皇終焉見證者', icon:'💀', rarity:'legend', requirement:'在崩壞的長老會議廳擊敗真‧死亡騎士 冥皇丹特斯。', criterion:'dantesKills', value:1 },
        { id:'sherine_listener', category:'story', name:'席琳聆聽者', icon:'🌙', rarity:'rare', requirement:'完成故事事件「席琳的低語」。', criterion:'storyEvent', event:'sherine_whisper' },
        { id:'rift_walker', category:'story', name:'裂痕行者', icon:'🌀', rarity:'rare', requirement:'完成故事事件「裂痕彼端」。', criterion:'storyEvent', event:'rift_first_step' },
        { id:'sunrise_envoy', category:'story', name:'日出殘印使者', icon:'🌅', rarity:'rare', requirement:'完成故事事件「日出國的殘印」。', criterion:'storyEvent', event:'sunrise_seal' },
        { id:'rasta_infiltrator', category:'story', name:'黑暗帝國潛行者', icon:'🕯️', rarity:'rare', requirement:'完成故事事件「黑暗帝國之門」。', criterion:'storyEvent', event:'rastabad_gate' },
        { id:'elder_chronicler', category:'story', name:'八長老編年者', icon:'📚', rarity:'legend', requirement:'完成故事事件「八長老的證詞」。', criterion:'storyEvent', event:'elder_testimony' },
        { id:'four_kings_end', category:'story', name:'四軍王終結者', icon:'♜', rarity:'legend', requirement:'完成故事事件「四軍王的終局」。', criterion:'storyEvent', event:'four_kings_fall' },

        { id:'clan_companion', category:'clan', name:'同盟之證', icon:'🤝', rarity:'common', requirement:'目前已加入血盟。', criterion:'clanMember', current:true },
        { id:'clan_leader', category:'clan', name:'血盟盟主', icon:'🛡️', rarity:'rare', requirement:'目前為血盟盟主。', criterion:'clanLeader', current:true },
        { id:'dragon_clan_hero', category:'clan', name:'龍族英雄', icon:'🐲', rarity:'legend', requirement:'加入血盟，並在任一陣營累積 240 國戰聲望。', criterion:'clanWarHero' },
        { id:'house_collaborator', category:'clan', name:'盟屋協力者', icon:'🧱', rarity:'common', requirement:'親自完成一次每日盟屋協作。', criterion:'clanHouseBuilds', value:1 },
        { id:'tempered_ally', category:'clan', name:'百鍊盟友', icon:'⚒️', rarity:'rare', requirement:'累計完成 30 次盟屋訓練。', criterion:'clanHouseTrainings', value:30 },
        { id:'clan_pillar', category:'clan', name:'血盟支柱', icon:'🏛️', rarity:'rare', requirement:'在血盟歷史中累計獲得 1,000 貢獻。消耗貢獻不會倒扣進度。', criterion:'clanTotalContribution', value:1000 },
        { id:'home_architect', category:'clan', name:'盟屋築造者', icon:'🏗️', rarity:'rare', requirement:'作為盟主，親自完成一次盟屋大廳或設施升級。', criterion:'clanHouseUpgrades', value:1 },

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
        { id:'forgotten_one', category:'hidden', name:'被遺忘之人', icon:'✦', rarity:'legend', requirement:'擊敗遺忘之島的巨大鱷魚、卡司特王、食人妖精王、獨眼巨人、飛龍與巨大牛人。', criterion:'forgottenElites', value:6, hidden:true },
        { id:'desperate_survivor', category:'hidden', name:'絕境生還者', icon:'♥', rarity:'legend', requirement:'在存活且 HP 不高於 5% 時，親自擊敗一隻非建築頭目。', criterion:'lowHpBossKills', value:1, hidden:true },
        { id:'double_witness', category:'hidden', name:'雙面見證者', icon:'☽', rarity:'legend', requirement:'曾分別為光與暗陣營累積至少 120 國戰聲望。', criterion:'dualFactionReputation', value:120, hidden:true },
        { id:'forbidden_chronicler', category:'hidden', name:'禁史保管人', icon:'🗝️', rarity:'legend', requirement:'完成稱號圖鑑中的全部六段故事事件。', criterion:'allStoryEvents', hidden:true },
        { id:'dark_dynasty_bane', category:'hidden', name:'黑王朝送葬者', icon:'⚰️', rarity:'legend', requirement:'擊敗八長老、四大軍王與真‧死亡騎士 冥皇丹特斯。', criterion:'darkDynasty', hidden:true }
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
            progress:{ goblinKills:0, deathKnightKills:0, kurtKills:0, giltasKills:0, valakasKills:0, corruptedAntharasKills:0, nineTailedFoxKills:0, dantesKills:0, lowHpBossKills:0, loreFragments:0, forgottenElites:{}, rastabadElders:{}, rastabadKings:{}, storyEvents:{}, siegeWins:{} },
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
        out.progress.nineTailedFoxKills = number(progress.nineTailedFoxKills);
        out.progress.dantesKills = number(progress.dantesKills);
        out.progress.lowHpBossKills = number(progress.lowHpBossKills);
        out.progress.loreFragments = number(progress.loreFragments);
        let forgotten = progress.forgottenElites && typeof progress.forgottenElites === 'object' && !Array.isArray(progress.forgottenElites) ? progress.forgottenElites : {};
        FORGOTTEN_ELITES.forEach(name => { if (forgotten[name]) out.progress.forgottenElites[name] = true; });
        let elders = progress.rastabadElders && typeof progress.rastabadElders === 'object' && !Array.isArray(progress.rastabadElders) ? progress.rastabadElders : {};
        RASTABAD_ELDERS.forEach(name => { if (elders[name]) out.progress.rastabadElders[name] = true; });
        let kings = progress.rastabadKings && typeof progress.rastabadKings === 'object' && !Array.isArray(progress.rastabadKings) ? progress.rastabadKings : {};
        RASTABAD_KINGS.forEach(name => { if (kings[name]) out.progress.rastabadKings[name] = true; });
        let events = progress.storyEvents && typeof progress.storyEvents === 'object' && !Array.isArray(progress.storyEvents) ? progress.storyEvents : {};
        STORY_EVENTS.forEach(event => { if (events[event.id]) out.progress.storyEvents[event.id] = true; });
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
            case 'nineTailedFoxKills': return state.progress.nineTailedFoxKills >= def.value;
            case 'dantesKills': return state.progress.dantesKills >= def.value;
            case 'lowHpBossKills': return state.progress.lowHpBossKills >= def.value;
            case 'forgottenElites': return Object.keys(state.progress.forgottenElites).length >= def.value;
            case 'loreFragments': return state.progress.loreFragments >= def.value;
            case 'storyEvent': return !!state.progress.storyEvents[def.event];
            case 'storyEventCount': return Object.keys(state.progress.storyEvents).length >= def.value;
            case 'allStoryEvents': return STORY_EVENTS.every(event => state.progress.storyEvents[event.id]);
            case 'darkDynasty': return RASTABAD_ELDERS.every(name => state.progress.rastabadElders[name]) && RASTABAD_KINGS.every(name => state.progress.rastabadKings[name]) && state.progress.dantesKills >= 1;
            case 'allRelics': return number(sources.relicTotal) > 0 && number(sources.relicGot) >= number(sources.relicTotal);
            case 'storyFlag': return !!state.storyFlags[def.flag];
            case 'clanMember': return !!sources.clanMember;
            case 'clanLeader': return !!sources.clanLeader;
            case 'clanWarHero': return !!sources.clanMember && number(sources.warReputation) >= 240;
            case 'clanHouseBuilds': return number(sources.clanHouseBuilds) >= def.value;
            case 'clanHouseTrainings': return number(sources.clanHouseTrainings) >= def.value;
            case 'clanTotalContribution': return number(sources.clanTotalContribution) >= def.value;
            case 'clanHouseUpgrades': return number(sources.clanHouseUpgrades) >= def.value;
            case 'warReputation': return number(sources.warReputation) >= def.value;
            case 'dualFactionReputation': return number(sources.lightReputation) >= def.value && number(sources.darkReputation) >= def.value;
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
            if (name === '白面金毛九尾狐・殺生石') state.progress.nineTailedFoxKills = number(state.progress.nineTailedFoxKills + count);
            if (name === '真‧死亡騎士 冥皇丹特斯') state.progress.dantesKills = number(state.progress.dantesKills + count);
            if (FORGOTTEN_ELITES.includes(name)) state.progress.forgottenElites[name] = true;
            if (RASTABAD_ELDERS.includes(name)) state.progress.rastabadElders[name] = true;
            if (RASTABAD_KINGS.includes(name)) state.progress.rastabadKings[name] = true;
        });
        if (RASTABAD_ELDERS.every(name => state.progress.rastabadElders[name])) state.progress.storyEvents.elder_testimony = true;
        if (RASTABAD_KINGS.every(name => state.progress.rastabadKings[name])) state.progress.storyEvents.four_kings_fall = true;
        return state;
    }
    function recordStoryArea(raw, mapKey) {
        let state = normalize(raw), key = String(mapKey || '');
        STORY_EVENTS.forEach(event => { if (event.maps && event.maps.includes(key)) state.progress.storyEvents[event.id] = true; });
        return state;
    }
    function recordLoreProgress(raw, count) {
        let state = normalize(raw);
        state.progress.loreFragments = Math.max(state.progress.loreFragments, number(count));
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

    function choosePolitics(raw, path) {
        let state = normalize(raw);
        if (state.storyFlags.kingdomGuardian || state.storyFlags.kingdomTraitor) return { ok:false, error:'這個角色已經作出政治選擇。', state:state };
        if (path !== 'guardian' && path !== 'traitor') return { ok:false, error:'無效的政治選擇。', state:state };
        state.storyFlags[path === 'guardian' ? 'kingdomGuardian' : 'kingdomTraitor'] = true;
        return { ok:true, state:state };
    }

    const Core = { VERSION, CATEGORIES, DEFINITIONS, DEFINITION_BY_ID, FORGOTTEN_ELITES, RASTABAD_ELDERS, RASTABAD_KINGS, STORY_EVENTS, STORY_EVENT_BY_ID, defaultState, normalize, conditionMet, isAvailable, evaluate, recordKills, recordStoryArea, recordLoreProgress, recordSiege, setEquipped, choosePolitics };
    global.TitleSystemCore = Core;

    let activeCategory = 'achievement';
    function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function liveSources() {
        let clanInfo = null, castleCity = null, clanLeader = false, clanStats = {};
        try {
            if (typeof global.clanTitleSnapshot === 'function') {
                let snapshot = global.clanTitleSnapshot(player);
                clanInfo = snapshot && snapshot.member ? { name:snapshot.name } : null;
                castleCity = snapshot && snapshot.castleCity || null;
                clanLeader = !!(snapshot && snapshot.leader);
                clanStats = snapshot || {};
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
            clanHouseBuilds:number(clanStats.houseBuilds),
            clanHouseTrainings:number(clanStats.houseTrainings),
            clanHouseUpgrades:number(clanStats.houseUpgrades),
            clanTotalContribution:number(clanStats.totalContribution),
            warReputation:warReputation,
            lightReputation:war ? number(war.reputation.light) : 0,
            darkReputation:war ? number(war.reputation.dark) : 0,
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
    function completedStoryIds(raw) {
        let state = normalize(raw);
        return STORY_EVENTS.filter(event => state.progress.storyEvents[event.id]).map(event => event.id);
    }
    function newlyCompletedStoryIds(before, after) {
        let oldIds = new Set(completedStoryIds(before));
        return completedStoryIds(after).filter(id => !oldIds.has(id));
    }
    function announceStoryEvents(ids) {
        if (!ids || !ids.length || typeof global.logSys !== 'function') return;
        ids.forEach(id => {
            let event = STORY_EVENT_BY_ID[id];
            if (!event) return;
            global.logSys(`<div class="title-story-event-log"><b>${event.icon} 故事事件・${esc(event.title)}</b>${event.lines.map(line => `<span>${esc(line)}</span>`).join('')}<small>已收入「稱號圖鑑 → 劇情」的故事紀錄。</small></div>`);
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
        let before = player.titleState;
        player.titleState = recordKills(player.titleState, [{ name:mob.n, count:count || 1 }]);
        if (mob.boss && mob.race !== '建築' && number(player.hp) > 0 && number(player.mhp) > 0 && number(player.hp) * 20 <= number(player.mhp)) {
            let state = normalize(player.titleState);
            state.progress.lowHpBossKills = number(state.progress.lowHpBossKills + 1);
            player.titleState = state;
        }
        announceStoryEvents(newlyCompletedStoryIds(before, player.titleState));
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
        let before = player.titleState;
        player.titleState = recordKills(player.titleState, rows);
        announceStoryEvents(newlyCompletedStoryIds(before, player.titleState));
        sync(false);
    }
    function recordStoryAreaEvent(mapKey) {
        if (typeof player === 'undefined' || !player || !mapKey) return;
        let before = player.titleState;
        let next = recordStoryArea(before, mapKey);
        let added = newlyCompletedStoryIds(before, next);
        if (!added.length) return;
        player.titleState = next;
        announceStoryEvents(added);
        sync(false);
        try { if (typeof global.saveGame === 'function') global.saveGame(); } catch (e) {}
    }
    function recordWorldLoreProgress(count) {
        if (typeof player === 'undefined' || !player) return;
        let before = normalize(player.titleState).progress.loreFragments;
        player.titleState = recordLoreProgress(player.titleState, count);
        if (player.titleState.progress.loreFragments !== before) sync(false);
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
    function choosePoliticalPath(path) {
        if (typeof player === 'undefined' || !player) return;
        if (number(player.lv) < 40) { if (typeof global.alert === 'function') global.alert('角色等級達到 40 後才能面對王國分裂事件。'); return; }
        if (player.dead) { if (typeof global.alert === 'function') global.alert('角色死亡期間無法作出永久政治選擇，請先復活。'); return; }
        let label = path === 'guardian' ? '維持現行秩序' : '公開被掩藏的歷史';
        if (typeof global.confirm === 'function' && !global.confirm(`確定選擇「${label}」？\n這是角色的永久歷史，且不會強迫你選擇國戰光／暗陣營。`)) return;
        let before = normalize(player.titleState);
        let result = choosePolitics(before, path);
        if (!result.ok) { if (typeof global.alert === 'function') global.alert(result.error); return; }
        let evaluated = evaluate(result.state, liveSources());
        player.titleState = evaluated.state;
        let saved = true;
        try { if (typeof global.saveGame === 'function') saved = global.saveGame() === true; } catch (e) { saved = false; }
        if (!saved) {
            player.titleState = before;
            renderPanel();
            if (typeof global.alert === 'function') global.alert('角色存檔失敗，這次政治選擇已取消；請確認可正常存檔後再選擇。');
            return;
        }
        announce(evaluated.added);
        renderPanel();
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
        let politicalChoice = '', storyJournal = '';
        if (category.id === 'story' && !state.storyFlags.kingdomGuardian && !state.storyFlags.kingdomTraitor) {
            let ready = sources.level >= 40;
            politicalChoice = `<section class="title-system-choice"><strong>⚖️ 王國分裂事件</strong><p>${ready ? '你發現了王國刻意掩藏的歷史。這是獨立的政治選擇，不代表光／暗陣營善惡。' : '角色等級達到 40 後，將面對一次永久的政治選擇。'}</p><div><button type="button" onclick="titleChoosePolitics('guardian')" ${ready ? '' : 'disabled'}>維持現行秩序</button><button type="button" onclick="titleChoosePolitics('traitor')" ${ready ? '' : 'disabled'}>公開被掩藏的歷史</button></div></section>`;
        }
        if (category.id === 'story') {
            let completed = STORY_EVENTS.filter(event => state.progress.storyEvents[event.id]).length;
            storyJournal = `<details class="title-story-journal"><summary><span>📖 故事事件</span><small>已完成 ${completed} / ${STORY_EVENTS.length}</small></summary><div>${STORY_EVENTS.map(event => {
                let done = !!state.progress.storyEvents[event.id];
                return `<article class="${done ? 'completed' : 'locked'}"><strong>${done ? event.icon : '◇'} ${done ? esc(event.title) : '尚未揭露'}</strong>${done ? event.lines.map(line => `<p>${esc(line)}</p>`).join('') : `<p>${esc(event.hint)}</p>`}<small>${done ? '故事已收入紀錄' : '完成線索後自動揭露'}</small></article>`;
            }).join('')}</div></details>`;
        }
        list.innerHTML = storyJournal + politicalChoice + defs.map(def => {
            let available = isAvailable(def, state, sources), equipped = state.equipped === def.id;
            let hidden = def.hidden && !available;
            let name = hidden ? '？？？' : def.name;
            let requirement = hidden ? '達成隱藏條件後才會揭露。' : def.requirement;
            let exclusive = (def.id === 'kingdom_traitor' && state.storyFlags.kingdomGuardian) || (def.id === 'kingdom_guardian' && state.storyFlags.kingdomTraitor);
            let action = equipped ? '展示中' : (available ? '點擊展示' : (exclusive ? '互斥・無法取得' : '尚未取得'));
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
    global.titleRecordStoryArea = recordStoryAreaEvent;
    global.titleRecordLoreProgress = recordWorldLoreProgress;
    global.titleRecordSiege = recordSiegeResult;
    global.titleSetStoryFlag = setStoryFlag;
    global.titleChoosePolitics = choosePoliticalPath;
    global.refreshTitleDisplay = refreshDisplay;
    global.openTitlePanel = openPanel;
    global.closeTitlePanel = closePanel;
    global.titleSetCategory = setCategory;
    global.titleEquip = equip;
    if (typeof global.addEventListener === 'function') global.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });
})(typeof window !== 'undefined' ? window : globalThis);
