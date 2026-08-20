const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', '25-clan-system.js'), 'utf8');

function createContext() {
    const values = new Map();
    const listeners = {};
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
        addEventListener(type, listener) { (listeners[type] || (listeners[type] = [])).push(listener); },
        alert(message) { context.alerts.push(String(message)); },
        confirm() { return context.confirmResult; },
        confirmResult:true,
        alerts:[]
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(source, context);
    context.emitStorage = event => (listeners.storage || []).forEach(listener => listener(event));
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
    assert.equal(state.members.leader.totalContribution, 0);
    assert.equal(state.members.leader.houseBuilds, 0);
    assert.equal(state.members.leader.houseTrainings, 0);
    assert.equal(state.members.leader.houseUpgrades, 0);
});

test('old spendable contribution migrates into lifetime contribution', () => {
    const context = createContext();
    const raw = oldClanState();
    raw.members.leader.contribution = 250;
    const member = context._clanNormalizeState(raw).members.leader;
    assert.equal(member.contribution, 250);
    assert.equal(member.totalContribution, 250);
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
    assert.equal(context._clanReadState().members.leader.houseUpgrades, 1);
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

test('daily construction is once per role and gives shared resources plus personal contribution', () => {
    const context = createContext();
    assert.equal(context._clanWriteState(context._clanNormalizeState(oldClanState())), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:20000, classicMode:false };
    context.player.enSeed = 'member';
    context.player.name = '一般成員';
    context.clanHouseDailyBuild();
    let house = context._clanReadState().modes.normal.house;
    assert.equal(context.player.gold, 10000);
    assert.equal(house.funds, 200);
    assert.equal(house.materials, 3);
    assert.equal(context._clanReadState().members.member.houseBuilds, 1);
    assert.equal(context._clanReadState().members.member.contribution, 5);

    context.clanHouseDailyBuild();
    house = context._clanReadState().modes.normal.house;
    assert.equal(context.player.gold, 10000);
    assert.equal(house.funds, 200);
    assert.match(context.alerts.pop(), /此角色今天已完成/);

    context.player.enSeed = 'second';
    context.player.name = '第二成員';
    context.clanHouseDailyBuild();
    house = context._clanReadState().modes.normal.house;
    assert.equal(house.funds, 400);
    assert.equal(house.materials, 6);
});

test('failed character save safely rolls back construction when the house is unchanged', () => {
    const context = createContext();
    assert.equal(context._clanWriteState(context._clanNormalizeState(oldClanState())), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:20000, classicMode:false };
    let saves = 0;
    context.saveGame = () => ++saves > 1;
    context.clanHouseDailyBuild();
    const house = context._clanReadState().modes.normal.house;
    assert.equal(context.player.gold, 20000);
    assert.equal(house.funds, 0);
    assert.equal(house.materials, 0);
    assert.equal(house.dailyBuild.leader, undefined);
    assert.equal(context._clanReadState().members.leader.houseBuilds, 0);
    assert.match(context.alerts.pop(), /協作已取消/);
});

test('failed character save does not roll back across a newer house transaction', () => {
    const context = createContext();
    const seeded = context._clanNormalizeState(oldClanState());
    seeded.modes.normal.house.funds = 400;
    seeded.modes.normal.house.materials = 6;
    assert.equal(context._clanWriteState(seeded), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:20000, classicMode:false };
    let saves = 0;
    context.saveGame = () => {
        saves++;
        if (saves !== 1) return true;
        const upgrade = context._clanWithLock(state => {
            const house = state.modes.normal.house;
            house.funds -= 400;
            house.materials -= 6;
            house.level = 2;
            context._clanHouseTouch(house);
            return {};
        });
        assert.equal(upgrade.ok, true);
        return false;
    };
    context.clanHouseDailyBuild();
    const house = context._clanReadState().modes.normal.house;
    assert.equal(context.player.gold, 10000);
    assert.equal(house.level, 2);
    assert.equal(house.funds, 200);
    assert.equal(house.materials, 3);
    assert.equal(!!house.dailyBuild.leader, true);
    assert.equal(context._clanReadState().members.leader.houseBuilds, 1);
    assert.match(context.alerts.pop(), /協作保留並維持金幣扣除/);
});

test('storage changes refresh title identity and the visible clan panel', () => {
    const context = createContext();
    let titles = 0, panels = 0;
    context.refreshTitleDisplay = () => { titles++; };
    context.clanRenderTargetVisible = () => true;
    context.renderClanTab = () => { panels++; };
    context.emitStorage({ key:'unrelated' });
    context.emitStorage({ key:'fb5_clan_state_v1' });
    assert.equal(titles, 1);
    assert.equal(panels, 1);
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

test('daily construction refuses partial resource rewards near the storage cap', () => {
    const context = createContext();
    const state = context._clanNormalizeState(oldClanState());
    state.modes.normal.house.funds = 3900;
    state.modes.normal.house.materials = 78;
    assert.equal(context._clanWriteState(state), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:20000, classicMode:false };
    context.clanHouseDailyBuild();
    const house = context._clanReadState().modes.normal.house;
    assert.equal(context.player.gold, 20000);
    assert.equal(house.funds, 3900);
    assert.equal(house.materials, 78);
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
    const member = context._clanReadState().members.leader;
    assert.equal(member.houseTrainings, 1);
    assert.equal(member.totalContribution, 5);
});

test('only the first five daily collaborators add shared resources', () => {
    const context = createContext();
    assert.equal(context._clanWriteState(context._clanNormalizeState(oldClanState())), true);
    for (let i = 1; i <= 6; i++) {
        context.player = { cls:'knight', enSeed:`member-${i}`, name:`成員${i}`, gold:20000, classicMode:false };
        context.clanHouseDailyBuild();
    }
    const state = context._clanReadState();
    assert.equal(state.modes.normal.house.funds, 1000);
    assert.equal(state.modes.normal.house.materials, 15);
    assert.equal(state.members['member-6'].contribution, 5);
    assert.equal(state.members['member-6'].houseBuilds, 1);
});

test('level-five lounge allows two uses and restores statuses plus living companions', () => {
    const context = createContext();
    const state = context._clanNormalizeState(oldClanState());
    state.modes.normal.house.level = 5;
    state.modes.normal.house.facilities.lounge = 5;
    assert.equal(context._clanWriteState(state), true);
    const ally = { curHp:10, mhp:80, mp:2, mmp:30, _downed:false };
    const pet = { hp:3, mhp:40, mp:1, mmp:10, _downed:false };
    const summon = { hp:4, mhp:60, _downed:false };
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', hp:20, mhp:100, mp:5, mmp:50, dead:false, classicMode:false, statuses:{ poison:99 }, allies:[ally] };
    context.petsOutList = () => [pet];
    context.petMhpEff = value => value.mhp;
    context.summonV2List = () => [summon];
    context.clanHouseRest();
    context.player.hp = 50;
    context.clanHouseRest();
    context.clanHouseRest();
    const house = context._clanReadState().modes.normal.house;
    assert.equal(house.dailyRest.leader.count, 2);
    assert.equal(context.player.hp, 100);
    assert.equal(context.player.statuses.poison, 0);
    assert.equal(ally.curHp, 80);
    assert.equal(pet.hp, 40);
    assert.equal(summon.hp, 60);
    assert.equal(context.clanHouseRestRegenBonus(context.player).hp, 10);
    assert.match(context.alerts.pop(), /已用完/);
});

test('hall visitor and commission unlock at their intended levels', () => {
    const context = createContext();
    const state = context._clanNormalizeState(oldClanState());
    state.modes.normal.house.level = 3;
    state.modes.normal.house.materials = 10;
    assert.equal(context._clanWriteState(state), true);
    context.player = { cls:'royal', enSeed:'leader', name:'盟主', gold:0, hp:100, mhp:100, mp:50, mmp:50, dead:false, classicMode:false };
    context.clanHouseVisitorTrade();
    let house = context._clanReadState().modes.normal.house;
    assert.equal(house.funds, 500);
    assert.equal(house.materials, 0);
    context.clanHouseCommission();
    assert.match(context.alerts.pop(), /先完成今日訓練/);
    context.clanHouseTrain();
    context.clanHouseCommission();
    const member = context._clanReadState().members.leader;
    assert.equal(member.contribution, 10);
    assert.equal(member.totalContribution, 10);
});

test('title snapshot exposes persistent house and contribution history in one read', () => {
    const context = createContext();
    const state = context._clanNormalizeState(oldClanState());
    Object.assign(state.members.leader, { totalContribution:1234, houseBuilds:2, houseTrainings:30, houseUpgrades:4 });
    assert.equal(context._clanWriteState(state), true);
    const snapshot = context.clanTitleSnapshot({ cls:'royal', enSeed:'leader', classicMode:false });
    assert.equal(snapshot.totalContribution, 1234);
    assert.equal(snapshot.houseBuilds, 2);
    assert.equal(snapshot.houseTrainings, 30);
    assert.equal(snapshot.houseUpgrades, 4);
    assert.equal(snapshot.houseLevel, 1);
});

test('house markup only uses background classes present in the compiled stylesheet', () => {
    assert.equal(source.includes('bg-amber-950/30'), false);
    assert.equal(source.includes('border-amber-700/60'), false);
    assert.equal(source.includes('bg-slate-900/70'), false);
});
