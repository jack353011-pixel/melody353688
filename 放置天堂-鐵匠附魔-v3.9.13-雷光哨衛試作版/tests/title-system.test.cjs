const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', '68-title-system.js'), 'utf8');
const worldSource = fs.readFileSync(path.join(__dirname, '..', 'js', '11-world-map.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const context = { console };
vm.createContext(context);
vm.runInContext(source, context);
const core = context.TitleSystemCore;

function sources(overrides) {
    return Object.assign({
        level:1,
        gold:0,
        clanMember:false,
        clanLeader:false,
        castleCity:null,
        warReputation:0,
        warSeasons:[],
        relicGot:0,
        relicTotal:10,
        legacyKentWin:false
    }, overrides || {});
}

function runtimeContext(player, overrides) {
    const nodes = {
        'st-title':{ textContent:'', dataset:{}, title:'' },
        'st-clan-line':{ textContent:'', style:{} }
    };
    const context = Object.assign({
        console,
        player:Object.assign({ cls:'knight', titleState:null, relicDex:{}, dragonWar:null }, player || {}),
        document:{ getElementById(id) { return nodes[id] || null; } }
    }, overrides || {});
    context.window = context;
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
}

test('old characters start without an equipped title', () => {
    const state = core.normalize(null);
    assert.equal(state.equipped, null);
    assert.deepEqual(Object.keys(state.unlocked), []);
});

test('title catalogue contains 30 unique titles across all six categories', () => {
    assert.equal(core.DEFINITIONS.length, 30);
    assert.equal(new Set(core.DEFINITIONS.map(def => def.id)).size, 30);
    core.CATEGORIES.forEach(category => {
        assert.ok(core.DEFINITIONS.some(def => def.category === category.id), category.id);
    });
});

test('version-one title saves migrate without losing existing progress or unlocks', () => {
    const state = core.normalize({
        version:1,
        equipped:'goblin_slayer',
        unlocked:{ goblin_slayer:123 },
        progress:{ goblinKills:10000, valakasKills:1, siegeWins:{ kent:1 } }
    });
    assert.equal(state.version, 3);
    assert.equal(state.equipped, 'goblin_slayer');
    assert.equal(state.unlocked.goblin_slayer, 123);
    assert.equal(state.progress.goblinKills, 10000);
    assert.equal(state.progress.valakasKills, 1);
    assert.equal(state.progress.siegeWins.kent, 1);
    assert.equal(state.progress.deathKnightKills, 0);
    assert.equal(state.progress.kurtKills, 0);
    assert.equal(state.progress.giltasKills, 0);
});

test('level and gold milestone titles become permanent after first unlock', () => {
    let state = core.evaluate(null, sources({ level:100, gold:1000000 }), 456).state;
    ['first_steps','veteran_adventurer','century_legend','aden_millionaire'].forEach(id => {
        assert.equal(state.unlocked[id], 456, id);
    });
    state = core.evaluate(state, sources({ level:1, gold:0 })).state;
    ['first_steps','veteran_adventurer','century_legend','aden_millionaire'].forEach(id => {
        assert.equal(state.unlocked[id], 456, id);
    });
});

test('goblin progress is permanent and only counts matching monster names', () => {
    let state = core.recordKills(null, [
        { name:'哥布林', count:6000 },
        { name:'哈柏哥布林', count:4000 },
        { name:'妖魔', count:99999 }
    ]);
    const result = core.evaluate(state, sources(), 1234);
    assert.equal(result.state.progress.goblinKills, 10000);
    assert.deepEqual(Array.from(result.added), ['goblin_slayer']);
    assert.equal(result.state.unlocked.goblin_slayer, 1234);
    assert.deepEqual(Array.from(core.evaluate(result.state, sources(), 9999).added), []);
});

test('dragon and story boss titles use exact target names', () => {
    let state = core.recordKills(null, [
        { name:'巴拉卡斯', count:1 },
        { name:'被侵蝕的瘋狂安塔瑞斯', count:1 }
    ]);
    const result = core.evaluate(state, sources());
    assert.equal(!!result.state.unlocked.fire_dragon_slayer, true);
    assert.equal(!!result.state.unlocked.antharas_cleanser, true);
});

test('death knight and Kurt titles count only their exact bosses', () => {
    let state = core.recordKills(null, [
        { name:'真‧死亡騎士 冥皇丹特斯', count:10 },
        { name:'克特之影', count:10 }
    ]);
    let result = core.evaluate(state, sources());
    assert.equal(result.state.unlocked.death_knight_hunter, undefined);
    assert.equal(result.state.unlocked.kurt_conqueror, undefined);

    state = core.recordKills(state, [{ name:'死亡騎士', count:1 }, { name:'克特', count:1 }]);
    result = core.evaluate(state, sources());
    assert.equal(!!result.state.unlocked.death_knight_hunter, true);
    assert.equal(!!result.state.unlocked.kurt_conqueror, true);
});

test('equipping a title replaces the previous one and unequip is explicit', () => {
    let state = core.recordKills(null, [{ name:'哥布林', count:10000 }, { name:'巴拉卡斯', count:1 }]);
    state = core.evaluate(state, sources()).state;
    let result = core.setEquipped(state, 'goblin_slayer', sources());
    assert.equal(result.ok, true);
    assert.equal(result.state.equipped, 'goblin_slayer');
    result = core.setEquipped(result.state, 'fire_dragon_slayer', sources());
    assert.equal(result.state.equipped, 'fire_dragon_slayer');
    result = core.setEquipped(result.state, null, sources());
    assert.equal(result.state.equipped, null);
});

test('current clan and castle titles disappear when the role is lost', () => {
    let live = sources({ clanMember:true, clanLeader:true, castleCity:'kent' });
    let member = core.setEquipped(null, 'clan_companion', live);
    assert.equal(member.ok, true);
    assert.equal(core.evaluate(member.state, sources()).state.equipped, null);
    let result = core.setEquipped(null, 'kent_lord', live);
    assert.equal(result.ok, true);
    assert.equal(result.state.equipped, 'kent_lord');
    result = core.evaluate(result.state, sources({ clanMember:true, clanLeader:false, castleCity:'kent' }));
    assert.equal(result.state.equipped, null);
    assert.equal(result.state.unlocked.kent_lord, undefined);
});

test('siege veteran title remains after the castle is lost', () => {
    let state = core.recordSiege(null, 'kent', true);
    state = core.evaluate(state, sources()).state;
    assert.equal(!!state.unlocked.first_kent_siege_survivor, true);
    const equipped = core.setEquipped(state, 'first_kent_siege_survivor', sources());
    assert.equal(equipped.ok, true);
    assert.equal(core.evaluate(equipped.state, sources({ castleCity:null })).state.equipped, 'first_kent_siege_survivor');
});

test('each legacy castle records its own permanent siege veteran title', () => {
    let state = null;
    ['kent','windwood','heine'].forEach(city => { state = core.recordSiege(state, city, true); });
    state = core.evaluate(state, sources()).state;
    ['first_kent_siege_survivor','first_windwood_siege_survivor','first_heine_siege_survivor'].forEach(id => {
        assert.equal(!!state.unlocked[id], true, id);
    });
    assert.equal(!!state.unlocked.three_castle_conqueror, true);
});

test('three-castle conqueror requires a victory in every legacy castle', () => {
    let state = core.recordSiege(null, 'kent', true);
    state = core.recordSiege(state, 'windwood', true);
    state = core.evaluate(state, sources()).state;
    assert.equal(state.unlocked.three_castle_conqueror, undefined);
    state = core.recordSiege(state, 'heine', true);
    state = core.evaluate(state, sources()).state;
    assert.equal(!!state.unlocked.three_castle_conqueror, true);
});

test('legacy siege fallback only treats a Kent victory as a Kent title win', () => {
    const heine = runtimeContext({ siege:{ city:'heine', result:'win' } });
    heine.refreshTitleDisplay();
    assert.equal(heine.player.titleState.unlocked.first_kent_siege_survivor, undefined);

    const kent = runtimeContext({ siege:{ city:'kent', result:'win' } });
    kent.refreshTitleDisplay();
    assert.equal(!!kent.player.titleState.unlocked.first_kent_siege_survivor, true);
});

test('legacy siege records the actual city only after castle ownership is saved', () => {
    assert.match(worldSource, /if \(typeof titleRecordSiege === 'function'\) titleRecordSiege\(_cfg\.key, 'win'\);/);
    assert.match(worldSource, /else \{\s*s\.result = 'claim_failed';/);
});

test('one title refresh reads one combined clan snapshot and one war snapshot', () => {
    const calls = { clan:0, war:0, legacy:0 };
    const context = runtimeContext({}, {
        clanTitleSnapshot() { calls.clan++; return { member:true, name:'測試血盟', castleCity:null, leader:false }; },
        clanGetModeInfo() { calls.legacy++; return null; },
        clanGetCastleCity() { calls.legacy++; return null; },
        clanIsLeaderRole() { calls.legacy++; return false; },
        DragonFactionWarCore:{ normalize() { calls.war++; return { reputation:{ light:0, dark:0 }, seasonRecords:{} }; } }
    });
    context.refreshTitleDisplay();
    assert.deepEqual(calls, { clan:1, war:1, legacy:0 });
});

test('national-war, clan and relic conditions unlock independently', () => {
    const result = core.evaluate(null, sources({
        clanMember:true,
        warReputation:240,
        warSeasons:[1, 4],
        relicGot:10
    }));
    ['war_recruit','frontline_knight','faction_standard_bearer','national_war_hero','first_war_veteran','dragon_clan_hero','millennial_truth_witness'].forEach(id => {
        assert.equal(!!result.state.unlocked[id], true, id);
    });
});

test('three-season veteran requires three distinct participated seasons', () => {
    let result = core.evaluate(null, sources({ warSeasons:[2, 2, 4] }));
    assert.equal(result.state.unlocked.three_season_veteran, undefined);
    result = core.evaluate(result.state, sources({ warSeasons:[2, 4, 7] }));
    assert.equal(!!result.state.unlocked.three_season_veteran, true);
});

test('kingdom warlord requires 500 reputation', () => {
    let result = core.evaluate(null, sources({ warReputation:499 }));
    assert.equal(result.state.unlocked.kingdom_warlord, undefined);
    result = core.evaluate(result.state, sources({ warReputation:500 }));
    assert.equal(!!result.state.unlocked.kingdom_warlord, true);
});

test('Giltas unlocks the hidden abyss returner title by exact boss name', () => {
    let state = core.recordKills(null, [{ name:'吉爾塔斯的幻影', count:1 }]);
    let result = core.evaluate(state, sources());
    assert.equal(result.state.unlocked.abyss_returner, undefined);
    state = core.recordKills(state, [{ name:'吉爾塔斯', count:1 }]);
    result = core.evaluate(state, sources());
    assert.equal(!!result.state.unlocked.abyss_returner, true);
    assert.equal(core.DEFINITION_BY_ID.abyss_returner.hidden, true);
});

test('hidden titles do not unlock or expose a display by default', () => {
    const def = core.DEFINITION_BY_ID.forgotten_one;
    const state = core.evaluate(null, sources()).state;
    assert.equal(def.hidden, true);
    assert.equal(core.isAvailable(def, state, sources()), false);
    assert.equal(core.setEquipped(state, def.id, sources()).ok, false);
});

test('title definitions contain no combat-stat bonuses', () => {
    core.DEFINITIONS.forEach(def => {
        ['str','dex','con','wis','int','cha','ac','mr','hp','mp','dmg','bonus'].forEach(field => assert.equal(def[field], undefined));
    });
});

test('the title control is rendered before the character name', () => {
    assert.ok(indexHtml.indexOf('id="st-title"') > 0);
    assert.ok(indexHtml.indexOf('id="st-title"') < indexHtml.indexOf('id="st-class"'));
    assert.equal(indexHtml.includes('js/68-title-system.js'), true);
});
