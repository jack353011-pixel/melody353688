// 🐉 龍族國戰：「一個王國、光明／暗影兩陣營」的單機 MMO 戰場。
// 國戰與血盟攻城完全分開；陣營只影響國戰稱號、戰績與可見內容，不改動角色能力、裝備、好友或血盟。
(function (global) {
    'use strict';

    const VERSION = 1;
    const MAX_ROUNDS = 12;
    const SEASON_COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const WORLD_STORAGE_KEY = 'fb5_dragon_war_world_v1';
    const FACTIONS = {
        light:{ name:'光明陣營', short:'光', color:'#fde047' },
        dark:{ name:'暗影陣營', short:'暗', color:'#a5b4fc' }
    };
    const LINES = {
        north:{ name:'北境戰線', icon:'❄️', objectives:['霜狼烽火臺','冰河補給站','北境結界石'] },
        center:{ name:'王都戰線', icon:'🏰', objectives:['舊城門','王家武器庫','日曜廣場'] },
        south:{ name:'南方戰線', icon:'🌊', objectives:['龍潮碼頭','商旅糧倉','火山結界石'] }
    };
    const OPERATIONS = {
        advance:{ name:'正面推進', delta:14, chance:0, rep:8 },
        raid:{ name:'奇襲據點', delta:21, chance:-0.14, rep:12 },
        fortify:{ name:'固守防線', delta:9, chance:0.16, rep:6 }
    };
    const SUPPORTERS = ['龍族遠征軍','象牙塔賢者','精靈聯軍','黑暗妖精斥候','奇岩商會','流浪傭兵團','邊境領主軍'];
    const SUPPORT_EFFECTS = ['NPC 增援','結界防禦','快速復活'];
    const WORLD_FIELDS = ['worldRevision','season','round','maxRounds','lines','activity','victories','support','ended','winner','lastSettlement','nextSeasonAt','history'];

    function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function blankLine() { return { progress:0, lightWins:0, darkWins:0 }; }
    function createState() {
        return {
            version:VERSION, affiliation:'neutral', oath:null, oathSeason:0, participated:false, pendingOath:false,
            seasonRecords:{},
            reputation:{ light:0, dark:0 }, season:1, round:0, maxRounds:MAX_ROUNDS,
            lines:{ north:blankLine(), center:blankLine(), south:blankLine() },
            activity:{ light:100, dark:100 }, victories:{ light:0, dark:0 },
            support:null, ended:false, winner:null, lastSettlement:null, rewardClaimed:false,
            worldRevision:0, nextSeasonAt:0, history:[]
        };
    }
    function normalize(raw) {
        let base = createState(), state = raw && typeof raw === 'object' ? clone(raw) : {};
        let out = Object.assign(base, state);
        out.version = VERSION;
        if (!['neutral','light','dark'].includes(out.affiliation)) out.affiliation = 'neutral';
        if (!['light','dark'].includes(out.oath)) out.oath = null;
        if (out.oath) out.affiliation = out.oath;
        out.participated = !!out.participated;
        out.pendingOath = !!out.pendingOath && !out.oath;
        out.seasonRecords = out.seasonRecords && typeof out.seasonRecords === 'object' ? out.seasonRecords : {};
        out.reputation = Object.assign({ light:0, dark:0 }, out.reputation || {});
        out.activity = Object.assign({ light:100, dark:100 }, out.activity || {});
        out.victories = Object.assign({ light:0, dark:0 }, out.victories || {});
        ['light','dark'].forEach(id => {
            out.reputation[id] = Math.max(0, Number(out.reputation[id]) || 0);
            out.activity[id] = Math.max(0, Number(out.activity[id]) || 0);
            out.victories[id] = Math.max(0, Math.floor(Number(out.victories[id]) || 0));
        });
        if (out.pendingOath && !FACTIONS[out.affiliation]) out.pendingOath = false;
        out.lines = out.lines || {};
        Object.keys(LINES).forEach(id => {
            out.lines[id] = Object.assign(blankLine(), out.lines[id] || {});
            out.lines[id].progress = clamp(out.lines[id].progress, -100, 100);
            out.lines[id].lightWins = Math.max(0, Math.floor(Number(out.lines[id].lightWins) || 0));
            out.lines[id].darkWins = Math.max(0, Math.floor(Number(out.lines[id].darkWins) || 0));
        });
        out.season = Math.max(1, Math.floor(Number(out.season) || 1));
        let cleanRecords = {};
        Object.keys(out.seasonRecords).sort((a,b) => Number(b) - Number(a)).slice(0, 6).forEach(key => {
            let season = Math.max(1, Math.floor(Number(key) || 0)), record = out.seasonRecords[key];
            if (!season || !record || typeof record !== 'object') return;
            cleanRecords[season] = {
                participated:!!record.participated,
                faction:FACTIONS[record.faction] ? record.faction : null,
                sworn:!!record.sworn,
                claimed:!!record.claimed,
                power:Math.max(0, Number(record.power) || 0)
            };
        });
        out.seasonRecords = cleanRecords;
        out.oathSeason = Math.max(0, Math.floor(Number(out.oathSeason) || 0));
        if (out.oath && !out.oathSeason) out.oathSeason = out.season;
        if (out.participated && !out.seasonRecords[out.season]) {
            out.seasonRecords[out.season] = { participated:true, faction:out.oath || (FACTIONS[out.affiliation] ? out.affiliation : null), sworn:!!out.oath, claimed:!!out.rewardClaimed, power:0 };
        }
        if (out.oath && out.oathSeason !== out.season) {
            out.oath = null;
            out.participated = false;
            out.pendingOath = false;
        }
        out.round = clamp(Math.floor(Number(out.round) || 0), 0, MAX_ROUNDS);
        out.maxRounds = MAX_ROUNDS;
        out.ended = !!out.ended || out.round >= MAX_ROUNDS;
        out.winner = ['light','dark','draw'].includes(out.winner) ? out.winner : null;
        if (out.ended && !out.winner) out.winner = finalWinner(out);
        if (out.ended && out.winner) out.lastSettlement = { season:out.season, winner:out.winner };
        else if (!out.lastSettlement || !['light','dark','draw'].includes(out.lastSettlement.winner)) out.lastSettlement = null;
        else out.lastSettlement = { season:Math.max(1, Math.floor(Number(out.lastSettlement.season) || 1)), winner:out.lastSettlement.winner };
        let settlementRecord = out.lastSettlement && out.seasonRecords[out.lastSettlement.season];
        out.rewardClaimed = !!(settlementRecord && settlementRecord.claimed);
        out.worldRevision = Math.max(0, Math.floor(Number(out.worldRevision) || 0));
        out.nextSeasonAt = Math.max(0, Number(out.nextSeasonAt) || 0);
        if (!out.support || !FACTIONS[out.support.faction] || !SUPPORT_EFFECTS.includes(out.support.effect)) out.support = null;
        else out.support = { faction:out.support.faction, name:String(out.support.name || '王國援軍'), effect:out.support.effect };
        out.history = Array.isArray(out.history) ? out.history.slice(0, 30) : [];
        return out;
    }
    function strength(state, faction) {
        let lineValue = Object.values(state.lines).reduce((sum, line) => sum + (faction === 'light' ? line.progress : -line.progress), 0);
        return Math.max(1, state.activity[faction] + state.victories[faction] * 12 + lineValue * 0.35);
    }
    function balanceInfo(raw) {
        let state = normalize(raw), light = strength(state, 'light'), dark = strength(state, 'dark');
        let weaker = Math.abs(light - dark) < 8 ? null : (light < dark ? 'light' : 'dark');
        return { light:Math.round(light), dark:Math.round(dark), weaker:weaker, ratio:weaker ? clamp(Math.abs(light-dark) / Math.max(light,dark), 0, .35) : 0 };
    }
    function setAffiliation(raw, faction) {
        let state = normalize(raw);
        if (!['neutral','light','dark'].includes(faction)) return { ok:false, error:'無效的陣營。', state:state };
        if (state.oath && faction !== state.oath) return { ok:false, error:'已完成正式宣誓，本季無法更換陣營。', state:state };
        state.affiliation = faction;
        if (state.pendingOath && faction === 'neutral') {
            state.pendingOath = false;
            state.participated = false;
            delete state.seasonRecords[state.season];
        }
        return { ok:true, state:state };
    }
    function swearOath(raw) {
        let state = normalize(raw), faction = state.affiliation;
        if (state.ended) return { ok:false, error:'本季戰事已結束，無法補行宣誓。', state:state };
        if (!state.participated || !state.pendingOath) return { ok:false, error:'至少完成一次試戰後，才能正式宣誓。', state:state };
        if (!FACTIONS[faction]) return { ok:false, error:'請先選擇協力陣營。', state:state };
        state.oath = faction; state.oathSeason = state.season; state.pendingOath = false;
        let record = state.seasonRecords[state.season] || {};
        state.seasonRecords[state.season] = { participated:true, faction:faction, sworn:true, claimed:false, power:Math.max(0, Number(record.power) || 0) };
        state.history.unshift(`你已向${FACTIONS[faction].name}完成本季宣誓。`);
        return { ok:true, state:state };
    }
    function objectiveCount(progress, faction) {
        let value = faction === 'light' ? progress : -progress;
        return value >= 85 ? 3 : value >= 55 ? 2 : value >= 25 ? 1 : 0;
    }
    function finalWinner(state) {
        let lightNodes = 0, darkNodes = 0, sum = 0;
        Object.values(state.lines).forEach(line => { lightNodes += objectiveCount(line.progress,'light'); darkNodes += objectiveCount(line.progress,'dark'); sum += line.progress; });
        if (lightNodes !== darkNodes) return lightNodes > darkNodes ? 'light' : 'dark';
        return sum === 0 ? 'draw' : (sum > 0 ? 'light' : 'dark');
    }
    function dailyResetAt(now) {
        let value = Number(now);
        let date = new Date(Number.isFinite(value) ? value : Date.now());
        date.setHours(24, 0, 0, 0);
        return date.getTime();
    }
    function supportDescription(support, faction) {
        if (!support || !FACTIONS[support.faction]) return '無援軍效果';
        let own = support.faction === faction;
        if (support.effect === 'NPC 增援') return own ? '成功率 +8%' : '成功率 -8%';
        if (support.effect === '結界防禦') return own ? '敗退損失 -50%' : '成功推進 -50%';
        if (support.effect === '快速復活') return own ? '成功率 +4%、敗退損失 -25%' : '成功率 -4%、成功推進 -25%';
        return '無援軍效果';
    }
    function battleChance(raw, input) {
        let state = normalize(raw), faction = input && input.faction || state.affiliation;
        let operation = OPERATIONS[input && input.operation];
        if (!FACTIONS[faction] || !operation) return 0;
        let power = Math.max(1, Number(input.power) || 1), balance = balanceInfo(state);
        let clanBonus = clamp(input && input.clanBonus, 0, .05);
        let activeSupport = state.support, supportChance = 0;
        if (activeSupport && activeSupport.effect === 'NPC 增援') supportChance = activeSupport.faction === faction ? .08 : -.08;
        else if (activeSupport && activeSupport.effect === '快速復活') supportChance = activeSupport.faction === faction ? .04 : -.04;
        let aided = balance.weaker === faction;
        return clamp(.56 + operation.chance + supportChance + clanBonus + (aided ? .12 + balance.ratio * .35 : 0) + clamp((power - 300) / 2500, -.12, .12), .22, .88);
    }
    function fight(raw, input, randomFn) {
        let state = normalize(raw), rng = typeof randomFn === 'function' ? randomFn : Math.random;
        let faction = state.affiliation, lineId = input && input.line, operationId = input && input.operation;
        if (!FACTIONS[faction]) return { ok:false, error:'中立角色可照常遊玩；若要參戰，請先選擇協力陣營。', state:state };
        if (state.pendingOath) return { ok:false, error:'試戰已完成，請先正式宣誓再參加下一戰。', state:state };
        if (state.ended) return { ok:false, error:'本季戰事已結束。', state:state };
        if (!LINES[lineId] || !OPERATIONS[operationId]) return { ok:false, error:'無效的戰線或戰術。', state:state };

        let operation = OPERATIONS[operationId], power = Math.max(1, Number(input.power) || 1);
        let activeSupport = state.support;
        let playerSupported = !!(activeSupport && activeSupport.faction === faction);
        let enemySupported = !!(activeSupport && activeSupport.faction !== faction);
        let chance = battleChance(state, { faction:faction, operation:operationId, power:power, clanBonus:input && input.clanBonus });
        let success = clamp(rng(), 0, .999999) < chance;
        let magnitude = success ? operation.delta : Math.max(5, Math.round(operation.delta * .58));
        if (activeSupport && ((success && enemySupported) || (!success && playerSupported))) {
            if (activeSupport.effect === '結界防禦') magnitude = Math.max(2, Math.round(magnitude * .50));
            else if (activeSupport.effect === '快速復活') magnitude = Math.max(2, Math.round(magnitude * .75));
        }
        let sign = faction === 'light' ? 1 : -1;
        state.lines[lineId].progress = clamp(state.lines[lineId].progress + sign * (success ? magnitude : -magnitude), -100, 100);
        state.lines[lineId][(success ? faction : (faction === 'light' ? 'dark' : 'light')) + 'Wins']++;
        state.victories[success ? faction : (faction === 'light' ? 'dark' : 'light')]++;
        state.activity[faction] += 5;

        let other = faction === 'light' ? 'dark' : 'light';
        Object.keys(LINES).filter(id => id !== lineId).forEach(id => {
            let aiBalance = balanceInfo(state), underdog = aiBalance.weaker;
            let shift = 4 + Math.floor(clamp(rng(),0,.999999) * 9);
            let aiFaction = rng() < .5 ? 'light' : 'dark';
            if (underdog && rng() < .64) aiFaction = underdog;
            if (activeSupport && rng() < .70) aiFaction = activeSupport.faction;
            if (activeSupport && activeSupport.effect === 'NPC 增援' && aiFaction === activeSupport.faction) shift += 3;
            else if (activeSupport && activeSupport.effect === '結界防禦' && aiFaction !== activeSupport.faction) shift = Math.max(2, shift - 3);
            else if (activeSupport && activeSupport.effect === '快速復活' && aiFaction === activeSupport.faction) shift += 1;
            state.lines[id].progress = clamp(state.lines[id].progress + (aiFaction === 'light' ? shift : -shift), -100, 100);
            state.activity[aiFaction] += 2;
        });

        let afterBalance = balanceInfo(state), supportFaction = afterBalance.weaker || (rng() < .5 ? 'light' : 'dark');
        state.support = { faction:supportFaction, name:SUPPORTERS[Math.floor(clamp(rng(),0,.999999)*SUPPORTERS.length)], effect:SUPPORT_EFFECTS[Math.floor(clamp(rng(),0,.999999)*SUPPORT_EFFECTS.length)] };
        state.round++;
        state.participated = true;
        let seasonRecord = state.seasonRecords[state.season] || {};
        state.seasonRecords[state.season] = {
            participated:true,
            faction:state.oath || faction,
            sworn:!!state.oath,
            claimed:false,
            power:Math.max(power, Number(seasonRecord.power) || 0)
        };
        if (!state.oath) state.pendingOath = true;
        let rep = success ? operation.rep : 2;
        state.reputation[faction] = Math.max(0, Number(state.reputation[faction]) || 0) + rep;
        let rewardGold = success ? Math.max(1000, Math.round(power * (operationId === 'raid' ? 18 : 12))) : Math.max(300, Math.round(power * 3));
        let playerText = `${FACTIONS[faction].short}軍在${LINES[lineId].name}執行「${operation.name}」${success ? '成功' : '失利'}，戰線${success ? '推進' : '後撤'} ${magnitude} 點。`;
        state.history.unshift(playerText);
        state.history.unshift(`${state.support.name}宣布支援${FACTIONS[supportFaction].name}：${state.support.effect}。`);
        if (state.round >= MAX_ROUNDS) {
            state.ended = true; state.winner = finalWinner(state);
            let inputNow = input && Number(input.now);
            let finishedAt = Number.isFinite(inputNow) && inputNow >= 0 ? inputNow : Date.now();
            state.nextSeasonAt = dailyResetAt(finishedAt);
            state.lastSettlement = { season:state.season, winner:state.winner };
            state.history.unshift(state.winner === 'draw' ? '本季國戰以僵局收場。' : `${FACTIONS[state.winner].name}贏得本季國戰。`);
        }
        state.worldRevision++;
        state.history = state.history.slice(0, 30);
        return { ok:true, state:state, success:success, chance:chance, rewardGold:rewardGold, reputation:rep, text:playerText, opposingFaction:other, supportApplied:activeSupport };
    }
    function seasonRewardInfo(raw, power) {
        let state = normalize(raw), settlement = state.lastSettlement;
        if (!settlement) return { eligible:false, reason:'目前沒有可領取的賽季獎勵。', state:state };
        let record = state.seasonRecords[settlement.season];
        if (!record || !record.participated) return { eligible:false, reason:'此角色沒有參加該季國戰。', state:state, season:settlement.season };
        if (!record.sworn || !FACTIONS[record.faction]) return { eligible:false, reason:'試戰不列入賽季獎勵，必須完成正式宣誓。', state:state, season:settlement.season };
        if (record.claimed) return { eligible:false, reason:'此角色已領取該季獎勵。', state:state, season:settlement.season };
        power = Math.max(1, Number(record.power) || Number(power) || 1);
        let gold, reputation;
        if (settlement.winner === record.faction) {
            gold = Math.max(10000, Math.round(power * 40)); reputation = 40;
        } else if (settlement.winner === 'draw') {
            gold = Math.max(5000, Math.round(power * 20)); reputation = 20;
        } else {
            gold = Math.max(2500, Math.round(power * 10)); reputation = 10;
        }
        return { eligible:true, state:state, season:settlement.season, faction:record.faction, winner:settlement.winner, gold:gold, reputation:reputation };
    }
    function claimSeasonReward(raw, power) {
        let info = seasonRewardInfo(raw, power);
        if (!info.eligible) return { ok:false, error:info.reason, state:info.state, season:info.season };
        let state = info.state, record = state.seasonRecords[info.season];
        record.claimed = true;
        state.rewardClaimed = true;
        state.reputation[info.faction] += info.reputation;
        return { ok:true, state:state, season:info.season, faction:info.faction, winner:info.winner, gold:info.gold, reputation:info.reputation };
    }
    function campaignCooldownRemaining(raw, now) {
        let state = normalize(raw), at = Number(now);
        if (!Number.isFinite(at)) at = Date.now();
        return state.ended ? Math.max(0, state.nextSeasonAt - at) : 0;
    }
    function resetCampaign(raw, now) {
        let old = normalize(raw), state = createState();
        if (!old.ended || campaignCooldownRemaining(old, now) > 0) return old;
        state.affiliation = old.oath || old.affiliation;
        state.oath = null; // 新季重新開放立場，避免永久鎖死。
        state.participated = false; state.pendingOath = false;
        state.reputation = old.reputation; state.seasonRecords = old.seasonRecords;
        state.season = old.season + 1; state.worldRevision = old.worldRevision + 1;
        state.lastSettlement = old.lastSettlement;
        state.history = [`第 ${state.season} 季龍族國戰開始，所有戰線重新洗牌。`];
        return state;
    }
    function rankFor(rep) {
        rep = Math.max(0, Number(rep) || 0);
        if (rep >= 240) return '國戰英傑';
        if (rep >= 120) return '陣營旗手';
        if (rep >= 50) return '戰線騎士';
        if (rep >= 15) return '陣營新兵';
        return '陣營協力者';
    }

    function rankProgress(rep) {
        const ranks = [
            { at:0, name:'陣營協力者' }, { at:15, name:'陣營新兵' }, { at:50, name:'戰線騎士' },
            { at:120, name:'陣營旗手' }, { at:240, name:'國戰英傑' }
        ];
        rep = Math.max(0, Number(rep) || 0);
        let index = 0;
        ranks.forEach((rank, i) => { if (rep >= rank.at) index = i; });
        let current = ranks[index], next = ranks[index + 1] || null;
        return {
            name:current.name, reputation:rep, nextName:next && next.name, nextAt:next && next.at,
            percent:next ? clamp((rep - current.at) / (next.at - current.at) * 100, 0, 100) : 100
        };
    }
    function worldSnapshot(raw) {
        let state = normalize(raw), out = {};
        WORLD_FIELDS.forEach(field => { out[field] = clone(state[field]); });
        return out;
    }
    function mergeWorld(raw, world) {
        let state = normalize(raw);
        if (world && typeof world === 'object') WORLD_FIELDS.forEach(field => {
            if (Object.prototype.hasOwnProperty.call(world, field)) state[field] = clone(world[field]);
        });
        return normalize(state);
    }
    function canCommitWorld(world, expectedRevision) {
        let expected = Math.max(0, Math.floor(Number(expectedRevision) || 0));
        return normalize(world).worldRevision === expected;
    }

    const Core = { VERSION, MAX_ROUNDS, SEASON_COOLDOWN_MS, WORLD_STORAGE_KEY, FACTIONS, LINES, OPERATIONS, createState, normalize, setAffiliation, swearOath, fight, seasonRewardInfo, claimSeasonReward, resetCampaign, campaignCooldownRemaining, balanceInfo, objectiveCount, finalWinner, dailyResetAt, battleChance, supportDescription, rankFor, rankProgress, worldSnapshot, mergeWorld, canCommitWorld };
    global.DragonFactionWarCore = Core;

    let _dragonWarSection = 'war';

    function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function readSharedWorld() {
        try {
            if (!global.localStorage) return null;
            let raw = global.localStorage.getItem(WORLD_STORAGE_KEY);
            return raw ? worldSnapshot(JSON.parse(raw)) : null;
        } catch (e) { return null; }
    }
    function writeSharedWorld(state) {
        try { if (global.localStorage) global.localStorage.setItem(WORLD_STORAGE_KEY, JSON.stringify(worldSnapshot(state))); } catch (e) {}
    }
    function commitSharedWorld(state, expectedRevision) {
        try {
            if (!global.localStorage) return true;
            let raw = global.localStorage.getItem(WORLD_STORAGE_KEY);
            let current = raw ? JSON.parse(raw) : createState();
            if (!canCommitWorld(current, expectedRevision)) return false;
            global.localStorage.setItem(WORLD_STORAGE_KEY, JSON.stringify(worldSnapshot(state)));
            return true;
        } catch (e) { return false; }
    }
    function currentState() {
        if (typeof player === 'undefined' || !player) return createState();
        let personal = normalize(player.dragonWar), world = readSharedWorld();
        player.dragonWar = world ? mergeWorld(personal, world) : personal;
        if (!world) writeSharedWorld(player.dragonWar);
        return player.dragonWar;
    }
    function playerPower() {
        if (typeof player === 'undefined' || !player) return 1;
        let d = player.d || {}, allies = (player.allies || []).filter(a => a && !a._downed);
        let offense = Math.max(d.meleeDmg || 0, d.rangedDmg || 0, d.magicDmg || 0);
        return Math.max(20, Math.round((player.lv || 1) * 6 + offense * 5 + (d.dr || 0) * 8 + allies.reduce((n,a) => n + (a.lv || 1) * 2, 0)));
    }
    function persistAndRender() {
        try { if (typeof saveGame === 'function') saveGame(); } catch (e) {}
        renderDragonWarTab();
    }
    function rejectStaleWorld() {
        let latest = readSharedWorld();
        if (latest) player.dragonWar = mergeWorld(player.dragonWar, latest);
        if (typeof alert === 'function') alert('戰場已被另一個分頁更新，本次操作未扣除或發放任何獎勵。已載入最新戰況，請再試一次。');
        renderDragonWarTab();
    }
    function chooseFaction(faction) {
        let result = setAffiliation(currentState(), faction);
        if (!result.ok) { alert(result.error); return; }
        player.dragonWar = result.state;
        if (typeof logSys === 'function') logSys(faction === 'neutral' ? '<span class="text-slate-300">你取消試戰並回到中立立場，日常玩法不受影響。</span>' : `<span class="text-amber-200">你目前以「協力者」身分支援${FACTIONS[faction].name}；正式宣誓前仍可改選。</span>`);
        persistAndRender();
    }
    function oath() {
        let state = currentState(), faction = state.affiliation;
        if (!FACTIONS[faction]) return;
        if (typeof confirm === 'function' && !confirm(`確定宣誓加入${FACTIONS[faction].name}？\n本季結束前無法改投另一陣營。`)) return;
        let result = swearOath(state);
        if (!result.ok) { alert(result.error); return; }
        player.dragonWar = result.state;
        if (typeof logSys === 'function') logSys(`<span class="text-violet-300 font-bold">🐉 你已正式宣誓加入${FACTIONS[faction].name}。</span>`);
        persistAndRender();
    }
    function doFight(line, operation) {
        let state = currentState();
        if (!state.participated && !state.oath && typeof confirm === 'function' && !confirm('這是本季試戰。戰鬥後可改選陣營或回到中立；正式宣誓後才會鎖定。\n\n確定出戰？')) return;
        let power = playerPower(), expectedRevision = state.worldRevision;
        let clanBonus = typeof global.clanHouseWarBonus === 'function' ? global.clanHouseWarBonus(player) : 0;
        let result = fight(state, { line:line, operation:operation, power:power, clanBonus:clanBonus });
        if (!result.ok) { alert(result.error); renderDragonWarTab(); return; }
        if (!commitSharedWorld(result.state, expectedRevision)) { rejectStaleWorld(); return; }
        player.dragonWar = result.state;
        let seasonClaim = result.state.ended ? claimSeasonReward(result.state, power) : null;
        if (seasonClaim && seasonClaim.ok) player.dragonWar = seasonClaim.state;
        let seasonGold = seasonClaim && seasonClaim.ok ? seasonClaim.gold : 0;
        let seasonRep = seasonClaim && seasonClaim.ok ? seasonClaim.reputation : 0;
        player.gold = Math.max(0, (Number(player.gold) || 0) + result.rewardGold + seasonGold);
        if (typeof logSys === 'function') logSys(`<span class="${result.success ? 'text-emerald-300' : 'text-red-300'} font-bold">🐉 ${esc(result.text)}</span> 獎勵 ${result.rewardGold.toLocaleString()} 金幣，陣營聲望 +${result.reputation}。${seasonGold ? `（另含第 ${seasonClaim.season} 季結算 ${seasonGold.toLocaleString()} 金幣、${seasonRep} 聲望）` : ''}`);
        if (typeof global.titleSyncUnlocks === 'function') global.titleSyncUnlocks(false);
        persistAndRender();
    }
    function claimReward() {
        let result = claimSeasonReward(currentState(), playerPower());
        if (!result.ok) { if (typeof alert === 'function') alert(result.error); renderDragonWarTab(); return; }
        player.dragonWar = result.state;
        player.gold = Math.max(0, (Number(player.gold) || 0) + result.gold);
        if (typeof logSys === 'function') logSys(`<span class="text-amber-200 font-bold">🐉 第 ${result.season} 季國戰結算：${result.gold.toLocaleString()} 金幣、${result.reputation} 聲望已領取。</span>`);
        if (typeof global.titleSyncUnlocks === 'function') global.titleSyncUnlocks(false);
        persistAndRender();
    }
    function newSeason() {
        let state = currentState();
        if (!state.ended) { alert('本季國戰尚未結束。'); return; }
        let remaining = campaignCooldownRemaining(state);
        if (remaining > 0) { alert(`國戰部隊正在整備，${cooldownText(remaining)}後才能開啟下一季。`); return; }
        let expectedRevision = state.worldRevision, next = resetCampaign(state);
        if (!commitSharedWorld(next, expectedRevision)) { rejectStaleWorld(); return; }
        player.dragonWar = next;
        persistAndRender();
    }
    function cooldownText(ms) {
        let totalMinutes = Math.max(1, Math.ceil(ms / 60000));
        let hours = Math.floor(totalMinutes / 60), minutes = totalMinutes % 60;
        return hours > 0 ? `${hours} 小時 ${minutes} 分` : `${minutes} 分鐘`;
    }
    function refreshSeasonCountdown() {
        if (typeof document === 'undefined') return;
        let button = document.getElementById('dragon-war-next-season');
        if (!button || typeof player === 'undefined' || !player) return;
        let remaining = campaignCooldownRemaining(currentState());
        button.disabled = remaining > 0;
        button.textContent = remaining > 0 ? `每日 00:00 換季·${cooldownText(remaining)}` : '開啟下一季';
    }
    function sectionNav() {
        return `<div class="dragon-war-section-nav" role="tablist" aria-label="國戰與血盟">
            <button type="button" role="tab" aria-selected="${_dragonWarSection === 'war'}" class="${_dragonWarSection === 'war' ? 'active' : ''}" onclick="dragonWarSetSection('war')">🐉 國戰</button>
            <button type="button" role="tab" aria-selected="${_dragonWarSection === 'clan'}" class="${_dragonWarSection === 'clan' ? 'active' : ''}" onclick="dragonWarSetSection('clan')">🛡️ 血盟</button>
        </div>`;
    }
    function setSection(section) {
        _dragonWarSection = section === 'clan' ? 'clan' : 'war';
        renderDragonWarTab();
    }
    function renderDragonWarTab(section) {
        let div = typeof document !== 'undefined' ? document.getElementById('tab-dragon-war') : null;
        if (!div || typeof player === 'undefined' || !player) return;
        if (section === 'war' || section === 'clan') _dragonWarSection = section;
        if (_dragonWarSection === 'clan') {
            div.innerHTML = `<div class="dragon-war-shell">${sectionNav()}<section id="dragon-war-clan-content" class="dragon-war-clan-content"></section></div>`;
            setTimeout(function () {
                let clanContent = document.getElementById('dragon-war-clan-content');
                if (!clanContent) return;
                if (typeof renderClanTab === 'function') renderClanTab(clanContent);
                else clanContent.innerHTML = '<div class="p-3 text-red-300">血盟系統尚未完成載入。</div>';
            }, 0);
            return;
        }
        let state = currentState(), faction = FACTIONS[state.affiliation], balance = balanceInfo(state), power = playerPower();
        let factionRep = faction ? state.reputation[state.affiliation] : 0, progress = rankProgress(factionRep);
        let status = state.oath ? `${FACTIONS[state.oath].name}·${progress.name}` : (faction ? `${faction.name}協力者` : '中立旅人');
        let factionButtons = ['light','dark'].map(id => `<button class="dragon-war-faction ${id}${state.affiliation === id ? ' selected' : ''}" onclick="dragonWarChooseFaction('${id}')" ${state.oath && state.oath !== id ? 'disabled' : ''}><strong>${id === 'light' ? '☀️' : '🌙'} ${FACTIONS[id].name}</strong><br><span class="text-xs opacity-80">${id === 'light' ? '信奉秩序與穩定，也必須面對隱瞞的歷史。' : '信奉改革與反抗，也可能走向激進。'}</span></button>`).join('');
        let locked = !faction || state.pendingOath || state.ended;
        let clanBonus = typeof global.clanHouseWarBonus === 'function' ? global.clanHouseWarBonus(player) : 0;
        let lineCards = Object.keys(LINES).map(id => {
            let spec = LINES[id], line = state.lines[id], pos = (line.progress + 100) / 2;
            let lightN = objectiveCount(line.progress,'light'), darkN = objectiveCount(line.progress,'dark');
            let actions = Object.keys(OPERATIONS).map(op => {
                let rate = faction ? Math.round(battleChance(state, { faction:state.affiliation, operation:op, power:power, clanBonus:clanBonus }) * 100) : 0;
                return `<button onclick="dragonWarFight('${id}','${op}')" ${locked ? 'disabled' : ''} title="${op === 'advance' ? '穩定推進' : op === 'raid' ? '高風險高收益' : '成功率較高'}"><span>${OPERATIONS[op].name}</span><small>${faction ? `${rate}%` : '--'}</small></button>`;
            }).join('');
            return `<div class="dragon-war-line"><div class="dragon-war-line-head"><span>${spec.icon} ${spec.name}</span><span class="dragon-war-pill">光 ${lightN}：${darkN} 暗</span></div><div class="dragon-war-track" title="-100 為暗影完全壓制，+100 為光明完全壓制"><span class="dragon-war-marker" style="left:${pos}%"></span></div><div class="dragon-war-objectives">戰略點：${spec.objectives.map((x,i) => `<span style="color:${i < lightN ? '#fde047' : (i < darkN ? '#a5b4fc' : '#94a3b8')}">${esc(x)}</span>`).join(' · ')}</div><div class="dragon-war-actions mt-2">${actions}</div></div>`;
        }).join('');
        let oathBox = state.pendingOath ? `<div class="dragon-war-card border-violet-400 text-center"><div class="font-bold text-violet-200">試戰完成：現在才是正式選擇</div><div class="text-xs text-slate-300 my-2">你可以改選光／暗、回到中立，或宣誓鎖定${faction ? faction.name : '目前陣營'}；不宣誓不影響其他玩法。</div><button class="btn bg-violet-900 border-violet-400 text-violet-100" onclick="dragonWarSwearOath()">正式宣誓</button></div>` : '';
        let winnerText = state.ended ? (state.winner === 'draw' ? '僵局' : `${FACTIONS[state.winner].name}獲勝`) : `第 ${state.round + 1} / ${MAX_ROUNDS} 回合`;
        let support = state.support ? `${state.support.name} → ${FACTIONS[state.support.faction].short}軍（${state.support.effect}）` : '第三勢力尚在觀望';
        let supportEffect = state.support && faction ? supportDescription(state.support, state.affiliation) : '選擇陣營後顯示實際效果';
        let seasonWait = campaignCooldownRemaining(state);
        let seasonButton = state.ended ? `<button id="dragon-war-next-season" class="btn mt-3 w-full bg-amber-900 border-amber-500" onclick="dragonWarNewSeason()" ${seasonWait > 0 ? 'disabled' : ''}>${seasonWait > 0 ? `每日 00:00 換季·${cooldownText(seasonWait)}` : '開啟下一季'}</button>` : '';
        let pendingReward = seasonRewardInfo(state, power);
        let rewardBox = pendingReward.eligible ? `<section class="dragon-war-card border-amber-400 text-center"><div class="font-bold text-amber-200">🎁 第 ${pendingReward.season} 季角色獎勵待領取</div><div class="text-xs text-slate-300 my-2">${FACTIONS[pendingReward.faction].name}戰果：${pendingReward.winner === 'draw' ? '僵局' : `${FACTIONS[pendingReward.winner].name}獲勝`}。可領 ${pendingReward.gold.toLocaleString()} 金幣與 ${pendingReward.reputation} 聲望。</div><button class="btn bg-amber-900 border-amber-400 text-amber-100" onclick="dragonWarClaimReward()">領取賽季獎勵</button></section>` : '';
        let nextRank = progress.nextName ? `距離「${progress.nextName}」還差 ${Math.max(0, progress.nextAt - factionRep)}` : '已達最高稱號';
        div.innerHTML = `<div class="dragon-war-shell">${sectionNav()}<section class="dragon-war-hero"><div class="text-xl font-black text-amber-100">🐉 王國陣營戰</div><div class="text-xs text-slate-300 mt-1">所有角色共享同一戰場進度；陣營、宣誓、聲望與賽季領獎仍由各角色獨立保留。</div><div class="mt-2"><span class="dragon-war-pill">${esc(status)}</span> <span class="dragon-war-pill">第 ${state.season} 季·${winnerText}</span></div></section>${rewardBox}<section class="dragon-war-card dragon-war-personal"><div><span>你的國戰力</span><b>${power.toLocaleString()}</b></div><div><span>${faction ? `${faction.name}聲望` : '陣營聲望'}</span><b>${factionRep.toLocaleString()}</b></div><div class="dragon-war-rank"><span>${esc(nextRank)}</span><div><i style="width:${progress.percent}%"></i></div></div></section><section class="dragon-war-card"><div class="font-bold mb-2">選擇立場</div><div class="dragon-war-factions">${factionButtons}</div><button class="mt-2 text-xs text-slate-400 underline" onclick="dragonWarChooseFaction('neutral')" ${state.oath ? 'disabled' : ''}>保持中立（試戰後、宣誓前也可返回）</button></section>${oathBox}<section class="dragon-war-card"><div class="dragon-war-balance"><div><span class="text-yellow-200">光明戰力</span><br><b>${balance.light}</b></div><div><span class="text-violet-200">當前援軍</span><br><b>${esc(support)}</b><small>${esc(supportEffect)}</small></div><div><span class="text-indigo-200">暗影戰力</span><br><b>${balance.dark}</b></div></div><div class="text-[11px] text-slate-400 mt-2">系統依總戰力、勝場與活躍度調整本場效果；援軍不會提供永久能力加成。</div></section><section class="dragon-war-lines">${lineCards}</section><section class="dragon-war-card"><div class="flex justify-between items-center"><b>王國頻道·戰況</b><span class="text-xs text-slate-400">你親自打一條戰線，其餘由 AI 同步模擬</span></div><div class="dragon-war-history mt-2">${state.history.length ? state.history.map(x => `<div>• ${esc(x)}</div>`).join('') : '<div class="text-slate-500">尚無戰場消息。</div>'}</div>${seasonButton}</section></div>`;
    }

    global.renderDragonWarTab = renderDragonWarTab;
    global.dragonWarSetSection = setSection;
    global.dragonWarChooseFaction = chooseFaction;
    global.dragonWarSwearOath = oath;
    global.dragonWarFight = doFight;
    global.dragonWarClaimReward = claimReward;
    global.dragonWarNewSeason = newSeason;
    if (typeof global.setInterval === 'function') global.setInterval(refreshSeasonCountdown, 30000);
    if (typeof global.addEventListener === 'function') global.addEventListener('storage', function (event) {
        if (event.key !== WORLD_STORAGE_KEY || typeof player === 'undefined' || !player) return;
        try {
            player.dragonWar = mergeWorld(player.dragonWar, event.newValue ? JSON.parse(event.newValue) : null);
            renderDragonWarTab();
        } catch (e) {}
    });
})(typeof window !== 'undefined' ? window : globalThis);
