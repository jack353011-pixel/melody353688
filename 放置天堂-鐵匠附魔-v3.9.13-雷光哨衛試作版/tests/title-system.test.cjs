const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', '68-title-system.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const context = { console };
vm.createContext(context);
vm.runInContext(source, context);
const core = context.TitleSystemCore;

function sources(overrides) {
    return Object.assign({
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

test('old characters start without an equipped title', () => {
    const state = core.normalize(null);
    assert.equal(state.equipped, null);
    assert.deepEqual(Object.keys(state.unlocked), []);
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
