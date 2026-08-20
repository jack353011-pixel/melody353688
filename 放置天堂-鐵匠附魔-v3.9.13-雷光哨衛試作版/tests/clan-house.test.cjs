const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', '25-clan-system.js'), 'utf8');

function createContext() {
    const values = new Map();
    const localStorage = {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
    const context = {
        console,
        localStorage,
        setInterval() { return 0; },
        document:{ getElementById() { return null; } },
        alert(message) { context.alerts.push(String(message)); },
        confirm() { return context.confirmResult; },
        confirmResult:true,
        alerts:[]
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
}

function oldClanState() {
    return {
        v:2,
        xp:0,
        modes:{
            normal:{ name:'測試血盟', leaderId:'leader', faction:'tros', createdAt:1, castle:null },
            classic:null
        },
        members:{ leader:{ mode:'normal', contribution:0, buffOn:false, buffAt:0 } },
        npcWorlds:{ normal:null, classic:null }
    };
}

test('old clan saves receive a safe level-one house', () => {
    const context = createContext();
    const state = context._clanNormalizeState(oldClanState());
    const house = state.modes.normal.house;
    assert.equal(state.v, 3);
    assert.equal(house.level, 1);
    assert.deepEqual(Object.keys(house.facilities).sort(), ['lounge', 'training', 'warRoom', 'warehouse']);
    Object.values(house.facilities).forEach(level => assert.equal(level, 1));
});

test('corrupt house values are bounded and unsafe daily markers are removed', () => {
    const context = createContext();
    const raw = oldClanState();
    raw.modes.normal.house = {
        level:999,
        funds:-1,
        materials:Infinity,
        facilities:{ warehouse:99, training:-4, warRoom:3, lounge:2 },
        dailyBuild:{ leader:'not-a-day', member:'2026-08-20' },
        logs:[{ at:-1, text:'保留' }, null]
    };
    const house = context._clanNormalizeState(raw).modes.normal.house;
    assert.equal(house.level, 5);
    assert.equal(house.funds, 0);
    assert.equal(house.materials, 240);
    assert.equal(house.facilities.warehouse, 5);
    assert.equal(house.facilities.training, 1);
    assert.equal(house.dailyBuild.leader, undefined);
    assert.equal(house.dailyBuild.member, '2026-08-20');
    assert.equal(house.logs.length, 1);
});

test('only the leader can spend shared resources to upgrade the hall', () => {
    const context = createContext();
    const state = context._clanNormalizeState(oldClanState());
    state.modes.normal.house.funds = 1000;
    state.modes.normal.house.materials = 20;
    assert.equal(context._clanWriteState(state), true);

    context.player = { cls:'royal', enSeed:'member', name:'一般成員', gold:0, classicMode:false };
    context.clanHouseUpgrade('hall');
    assert.equal(context._clanReadState().modes.normal.house.level, 1);
    assert.match(context.alerts.pop(), /只有盟主/);

    context.player.enSeed = 'leader';
    context.player.name = '盟主';
    context.clanHouseUpgrade('hall');
    const house = context._clanReadState().modes.normal.house;
    assert.equal(house.level, 2);
    assert.equal(house.funds, 600);
    assert.equal(house.materials, 14);
});

test('war room grants a bounded national-war-only chance bonus', () => {
    const context = createContext();
    const state = context._clanNormalizeState(oldClanState());
    state.modes.normal.house.level = 5;
    state.modes.normal.house.facilities.warRoom = 5;
    assert.equal(context._clanWriteState(state), true);
    assert.equal(context.clanHouseWarBonus({ cls:'knight', enSeed:'member', classicMode:false }), 0.05);
    assert.equal(context.clanHouseWarBonus({ cls:'knight', enSeed:'member', classicMode:true }), 0);
});

test('daily construction charges once and cannot be repeated by another role in the same clan', () => {
    const context = createContext();
    assert.equal(context._clanWriteState(context._clanNormalizeState(oldClanState())), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:20000, classicMode:false };
    context.player.enSeed = 'member';
    context.player.name = '一般成員';
    context.clanHouseDailyBuild();
    let house = context._clanReadState().modes.normal.house;
    assert.equal(context.player.gold, 10000);
    assert.equal(house.funds, 500);
    assert.equal(house.materials, 10);

    context.clanHouseDailyBuild();
    house = context._clanReadState().modes.normal.house;
    assert.equal(context.player.gold, 10000);
    assert.equal(house.funds, 500);
    assert.match(context.alerts.pop(), /血盟今天已完成/);
});

test('dead characters cannot consume the daily lounge use', () => {
    const context = createContext();
    assert.equal(context._clanWriteState(context._clanNormalizeState(oldClanState())), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:0, hp:0, mhp:100, mp:0, mmp:50, dead:true, classicMode:false };
    context.clanHouseRest();
    const house = context._clanReadState().modes.normal.house;
    assert.equal(house.dailyRest.leader, undefined);
    assert.match(context.alerts.pop(), /死亡狀態/);
});

test('full characters do not consume the daily lounge use', () => {
    const context = createContext();
    assert.equal(context._clanWriteState(context._clanNormalizeState(oldClanState())), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:0, hp:100, mhp:100, mp:50, mmp:50, dead:false, classicMode:false };
    context.clanHouseRest();
    const house = context._clanReadState().modes.normal.house;
    assert.equal(house.dailyRest.leader, undefined);
    assert.match(context.alerts.pop(), /已全滿/);
});

test('catch-up mode blocks gold and recovery transactions without consuming resources', () => {
    const context = createContext();
    assert.equal(context._clanWriteState(context._clanNormalizeState(oldClanState())), true);
    context.catchupActive = () => true;
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:20000, hp:50, mhp:100, mp:10, mmp:50, dead:false, classicMode:false };
    context.clanHouseDailyBuild();
    context.clanHouseRest();
    const house = context._clanReadState().modes.normal.house;
    assert.equal(context.player.gold, 20000);
    assert.equal(house.funds, 0);
    assert.equal(house.dailyRest.leader, undefined);
    assert.equal(context.alerts.filter(message => /結算離線進度/.test(message)).length, 2);
});

test('daily construction refuses partial rewards near the storage cap', () => {
    const context = createContext();
    const state = context._clanNormalizeState(oldClanState());
    state.modes.normal.house.funds = 3700;
    state.modes.normal.house.materials = 75;
    assert.equal(context._clanWriteState(state), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:20000, classicMode:false };
    context.clanHouseDailyBuild();
    const house = context._clanReadState().modes.normal.house;
    assert.equal(context.player.gold, 20000);
    assert.equal(house.funds, 3700);
    assert.equal(house.materials, 75);
    assert.match(context.alerts.pop(), /容量不足/);
});

test('cancelled upgrade confirmation does not spend shared resources', () => {
    const context = createContext();
    const state = context._clanNormalizeState(oldClanState());
    state.modes.normal.house.funds = 1000;
    state.modes.normal.house.materials = 20;
    assert.equal(context._clanWriteState(state), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:0, classicMode:false };
    context.confirmResult = false;
    context.clanHouseUpgrade('hall');
    const house = context._clanReadState().modes.normal.house;
    assert.equal(house.level, 1);
    assert.equal(house.funds, 1000);
    assert.equal(house.materials, 20);
});

test('training immediately recomputes active clan bonuses', () => {
    const context = createContext();
    assert.equal(context._clanWriteState(context._clanNormalizeState(oldClanState())), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:0, hp:100, mhp:100, mp:50, mmp:50, dead:false, classicMode:false };
    let recomputes = 0, updates = 0;
    context.calcStats = () => { recomputes++; };
    context.updateUI = () => { updates++; };
    context.clanHouseTrain();
    assert.equal(recomputes, 1);
    assert.equal(updates, 1);
});

test('house markup only uses background classes present in the compiled stylesheet', () => {
    assert.equal(source.includes('bg-amber-950/30'), false);
    assert.equal(source.includes('border-amber-700/60'), false);
    assert.equal(source.includes('bg-slate-900/70'), false);
});
