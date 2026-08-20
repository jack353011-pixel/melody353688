const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', '67-dragon-faction-war.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const context = { console };
vm.createContext(context);
vm.runInContext(source, context);
const core = context.DragonFactionWarCore;

test('clan entry is nested under the dragon war tab', () => {
    assert.equal(indexHtml.includes('id="btn-clan"'), false);
    assert.equal(indexHtml.includes('id="btn-dragon-war"'), true);
    assert.equal(source.includes("dragonWarSetSection('clan')"), true);
});

test('old saves migrate to neutral without touching unrelated character data', () => {
    const state = core.normalize(null);
    assert.equal(state.affiliation, 'neutral');
    assert.equal(state.round, 0);
    assert.equal(state.oath, null);
});

test('collaborator may switch freely before the first battle', () => {
    let state = core.setAffiliation(null, 'light').state;
    const result = core.setAffiliation(state, 'dark');
    assert.equal(result.ok, true);
    assert.equal(result.state.affiliation, 'dark');
});

test('first battle requires a deliberate oath before another battle', () => {
    let state = core.setAffiliation(null, 'light').state;
    let first = core.fight(state, { line:'north', operation:'advance', power:300 }, () => 0);
    assert.equal(first.ok, true);
    assert.equal(first.state.pendingOath, true);
    assert.equal(core.fight(first.state, { line:'north', operation:'advance', power:300 }, () => 0).ok, false);
    let switched = core.setAffiliation(first.state, 'dark');
    assert.equal(switched.ok, true);
    assert.equal(switched.state.affiliation, 'dark');
    let neutral = core.setAffiliation(first.state, 'neutral');
    assert.equal(neutral.ok, true);
    assert.equal(neutral.state.pendingOath, false);
    assert.equal(neutral.state.participated, false);
    let sworn = core.swearOath(core.setAffiliation(first.state, 'light').state);
    assert.equal(sworn.ok, true);
    assert.equal(sworn.state.oath, 'light');
    assert.equal(core.setAffiliation(sworn.state, 'dark').ok, false);
});

test('one player battle also advances the two AI-controlled lines', () => {
    let state = core.setAffiliation(null, 'dark').state;
    let result = core.fight(state, { line:'center', operation:'raid', power:450 }, () => 0.1);
    assert.notEqual(result.state.lines.north.progress, 0);
    assert.notEqual(result.state.lines.south.progress, 0);
    assert.equal(result.state.round, 1);
});

test('campaign ends after twelve rounds and progress remains bounded', () => {
    let state = core.createState();
    state.affiliation = 'light';
    state.oath = 'light';
    let result;
    for (let i = 0; i < core.MAX_ROUNDS; i++) {
        result = core.fight(state, { line:'north', operation:'raid', power:999 }, () => 0);
        assert.equal(result.ok, true);
        state = result.state;
    }
    assert.equal(state.ended, true);
    assert.ok(['light','dark','draw'].includes(state.winner));
    const preview = core.seasonRewardInfo(state, 999);
    assert.equal(preview.eligible, true);
    assert.ok(preview.gold >= 2500);
    assert.ok(preview.reputation >= 10);
    const claimed = core.claimSeasonReward(state, 999);
    assert.equal(claimed.ok, true);
    assert.equal(claimed.state.rewardClaimed, true);
    assert.equal(core.claimSeasonReward(claimed.state, 999).ok, false);
    Object.values(state.lines).forEach(line => assert.ok(line.progress >= -100 && line.progress <= 100));
});

test('season reward uses power recorded during participation, not delayed claim power', () => {
    let state = core.createState();
    state.affiliation = 'light';
    state.oath = 'light';
    state.oathSeason = 1;
    for (let i = 0; i < core.MAX_ROUNDS; i++) {
        state = core.fight(state, { line:'south', operation:'advance', power:300, now:1000 }, () => 0).state;
    }
    const normal = core.seasonRewardInfo(state, 300);
    const delayed = core.seasonRewardInfo(state, 999999);
    assert.equal(delayed.gold, normal.gold);
    assert.equal(delayed.reputation, normal.reputation);
});

test('finished seasons restart at the next local midnight', () => {
    let state = core.createState();
    state.affiliation = 'light';
    state.oath = 'light';
    for (let i = 0; i < core.MAX_ROUNDS; i++) {
        state = core.fight(state, { line:'north', operation:'advance', power:500, now:1000 }, () => 0).state;
    }
    assert.equal(state.nextSeasonAt, core.dailyResetAt(1000));
    assert.equal(core.resetCampaign(state, state.nextSeasonAt - 1).ended, true);
    const next = core.resetCampaign(state, state.nextSeasonAt);
    assert.equal(next.ended, false);
    assert.equal(next.season, 2);
});

test('reinforcement types materially change battle resolution', () => {
    let base = core.createState();
    base.affiliation = 'light';
    base.oath = 'light';
    const plain = core.fight(base, { line:'north', operation:'advance', power:300 }, () => 0.99);

    let npc = JSON.parse(JSON.stringify(base));
    npc.support = { faction:'light', name:'龍族遠征軍', effect:'NPC 增援' };
    const reinforced = core.fight(npc, { line:'north', operation:'advance', power:300 }, () => 0.99);
    assert.ok(reinforced.chance > plain.chance);

    let barrier = JSON.parse(JSON.stringify(base));
    barrier.support = { faction:'light', name:'象牙塔賢者', effect:'結界防禦' };
    const defended = core.fight(barrier, { line:'north', operation:'advance', power:300 }, () => 0.99);
    assert.ok(Math.abs(defended.state.lines.north.progress) < Math.abs(plain.state.lines.north.progress));
});

test('battle odds and reinforcement effects are available for clear UI display', () => {
    let state = core.createState();
    state.affiliation = 'light';
    const normal = core.battleChance(state, { faction:'light', operation:'advance', power:300 });
    state.support = { faction:'light', name:'龍族遠征軍', effect:'NPC 增援' };
    const aided = core.battleChance(state, { faction:'light', operation:'advance', power:300 });
    assert.ok(aided > normal);
    assert.equal(core.supportDescription(state.support, 'light'), '成功率 +8%');
    assert.equal(core.supportDescription(state.support, 'dark'), '成功率 -8%');
});

test('rank progress reports the next reputation milestone', () => {
    const progress = core.rankProgress(50);
    assert.equal(progress.name, '戰線騎士');
    assert.equal(progress.nextName, '陣營旗手');
    assert.equal(progress.nextAt, 120);
    assert.ok(progress.percent >= 0 && progress.percent <= 100);
});

test('world battlefield is shared while personal faction and reputation remain separate', () => {
    let personal = core.createState();
    personal.affiliation = 'light';
    personal.oath = 'light';
    personal.oathSeason = 1;
    personal.reputation.light = 77;
    let worldState = core.createState();
    worldState.season = 2;
    worldState.round = 3;
    worldState.lines.north.progress = -42;
    const merged = core.mergeWorld(personal, core.worldSnapshot(worldState));
    assert.equal(merged.season, 2);
    assert.equal(merged.round, 3);
    assert.equal(merged.lines.north.progress, -42);
    assert.equal(merged.affiliation, 'light');
    assert.equal(merged.reputation.light, 77);
    assert.equal(merged.oath, null);
});

test('every sworn participating character may claim the same season once', () => {
    let world = core.createState();
    world.affiliation = 'light';
    world.oath = 'light';
    world.oathSeason = 1;
    for (let i = 0; i < core.MAX_ROUNDS; i++) {
        world = core.fight(world, { line:'north', operation:'advance', power:500, now:1000 }, () => 0).state;
    }
    let secondCharacter = core.createState();
    secondCharacter.affiliation = 'dark';
    secondCharacter.oath = 'dark';
    secondCharacter.oathSeason = 1;
    secondCharacter.participated = true;
    secondCharacter.seasonRecords[1] = { participated:true, faction:'dark', sworn:true, claimed:false };
    secondCharacter = core.mergeWorld(secondCharacter, core.worldSnapshot(world));
    const firstClaim = core.claimSeasonReward(world, 500);
    const secondClaim = core.claimSeasonReward(secondCharacter, 300);
    assert.equal(firstClaim.ok, true);
    assert.equal(secondClaim.ok, true);
    assert.notEqual(firstClaim.state, secondClaim.state);
    assert.equal(core.claimSeasonReward(secondClaim.state, 300).ok, false);
});

test('unclaimed character reward survives the next season reset', () => {
    let ended = core.createState();
    ended.affiliation = 'light';
    ended.oath = 'light';
    ended.oathSeason = 1;
    for (let i = 0; i < core.MAX_ROUNDS; i++) {
        ended = core.fight(ended, { line:'center', operation:'fortify', power:400, now:1000 }, () => 0).state;
    }
    const nextWorld = core.resetCampaign(ended, ended.nextSeasonAt);
    let personal = core.createState();
    personal.seasonRecords[1] = { participated:true, faction:'dark', sworn:true, claimed:false };
    personal = core.mergeWorld(personal, core.worldSnapshot(nextWorld));
    const preview = core.seasonRewardInfo(personal, 300);
    assert.equal(preview.eligible, true);
    assert.equal(preview.season, 1);
});

test('world revision rejects stale tab writes', () => {
    let state = core.createState();
    state.affiliation = 'light';
    state.oath = 'light';
    state.oathSeason = 1;
    const firstWrite = core.fight(state, { line:'north', operation:'advance', power:300 }, () => 0).state;
    assert.equal(firstWrite.worldRevision, state.worldRevision + 1);
    assert.equal(core.canCommitWorld(core.worldSnapshot(state), state.worldRevision), true);
    assert.equal(core.canCommitWorld(core.worldSnapshot(firstWrite), state.worldRevision), false);
});

test('incomplete completed saves recover a winner instead of crashing the UI', () => {
    const state = core.normalize({ round:12, ended:false, winner:null });
    assert.equal(state.ended, true);
    assert.ok(['light','dark','draw'].includes(state.winner));
});
