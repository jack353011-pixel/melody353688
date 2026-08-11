const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const drops = fs.readFileSync(path.join(root, 'js/01-drops-config.js'), 'utf8');
const stats = fs.readFileSync(path.join(root, 'js/02-stats-recompute.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'js/10-ui-tabs.js'), 'utf8');
const context = vm.createContext({});

const speedHelpers = drops.match(/function d2rHitRecoveryTicks\([\s\S]*?\nfunction castIntervalTicks\(/);
assert.ok(speedHelpers, '找不到施法／硬直速度公式');
vm.runInContext(speedHelpers[0].replace(/\nfunction castIntervalTicks\($/, ''), context);

const eligible = drops.match(/function d2rEligibleAffixCodes\([\s\S]*?\n}\nfunction d2rRerollSingleAffix/);
assert.ok(eligible, '找不到 D2R 詞綴部位池');
vm.runInContext(eligible[0].replace(/\nfunction d2rRerollSingleAffix$/, ''), context);

const combatTotals = drops.match(/function d2rCombatAffixTotals\([\s\S]*?\n}\nfunction d2rTargetHasAbnormal/);
assert.ok(combatTotals, '找不到 D2R 戰鬥詞綴上限');
vm.runInContext(combatTotals[0].replace(/\nfunction d2rTargetHasAbnormal$/, ''), context);

const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual}`);

assert.equal(context.d2rHitRecoveryTicks(5, 0), 5, '0% 硬直恢復不得改變基礎值');
near(context.d2rHitRecoveryTicks(5, 40), 5 * 100 / 140, '40% 硬直恢復公式錯誤');
assert.equal(context.d2rHitRecoveryTicks(0, 40), 0, '原本 0 硬直不得被下限加回');
assert.equal(context.d2rHitRecoveryTicks(2, 40), 2, '硬直下限不得反向增加較快形態的硬直');
assert.equal(context.d2rHitRecoveryTicks(5, 999), context.d2rHitRecoveryTicks(5, 40), '硬直恢復必須在 40% 封頂');

near(context.d2rCastIntervalWithRate(12, 35, false), 12 * 100 / 135, '35% 施法速度公式錯誤');
near(context.d2rCastIntervalWithRate(12, 35, true), 12 * 100 / 117.5, '輔助施法應只吃一半速度');
assert.equal(context.d2rCastIntervalWithRate(8, 35, false), 7, '攻擊施法間隔下限應為 7 tick');
assert.equal(context.d2rCastIntervalWithRate(6, 35, false), 6, '施法下限不得反向拖慢更快形態');
assert.equal(context.d2rCastIntervalWithRate(8, 35, true), 8, '輔助施法間隔下限應為 8 tick');
assert.equal(context.d2rCastIntervalWithRate(12, 999, false), context.d2rCastIntervalWithRate(12, 35, false), '施法速度必須在 35% 封頂');

const capped = context.d2rCombatAffixTotals(null, { fcr:99, fhr:99 });
assert.equal(capped.fcr, 35, '全身施法速度上限錯誤');
assert.equal(capped.fhr, 40, '全身硬直恢復上限錯誤');

const pool = context.d2rEligibleAffixCodes;
assert.ok(pool({type:'wpn', mdmg:1, slot:'wpn'}, 2).includes('fcr'), '魔法武器應能出現施法速度');
assert.ok(!pool({type:'wpn', slot:'wpn'}, 2).includes('fcr'), '一般物理武器不應出現施法速度');
assert.ok(pool({type:'arm', slot:'gloves'}, 2).includes('fcr'), '手套應能出現施法速度');
assert.ok(pool({type:'arm', slot:'armor'}, 2).includes('fhr'), '盔甲應能出現硬直恢復');
assert.ok(pool({type:'acc', slot:'amulet'}, 2).includes('fcr') && pool({type:'acc', slot:'amulet'}, 2).includes('fhr'), '項鍊應能橋接兩種速度流派');
assert.ok(!pool({type:'acc', slot:'amulet'}, 1).includes('fcr'), '稀有以下不應出現速度特殊詞綴');

assert.match(drops, /fcr:'施法速度', fhr:'硬直恢復'/, '缺少速度詞綴名稱');
assert.match(drops, /fcr:\[\[8,10\]/, '缺少施法速度階級數值');
assert.match(drops, /fhr:\[\[10,12\]/, '缺少硬直恢復階級數值');
assert.match(stats, /d2rHitRecoveryTicks\(d\.hitstun,d\.fasterHitRecovery\)/, '硬直恢復尚未接入角色重算');
assert.match(stats, /d2rCastIntervalWithRate\(d\.castLock,d\.fasterCastRate,false\)/, '施法速度尚未接入角色重算');
assert.match(ui, /恢復 \+\$\{_fhr/, '裝備說明未顯示實際硬直恢復');

console.log('D2R 施法速度／硬直恢復測試通過');
