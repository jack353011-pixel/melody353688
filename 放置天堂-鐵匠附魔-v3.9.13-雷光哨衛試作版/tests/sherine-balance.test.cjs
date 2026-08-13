const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const drops = read('js/01-drops-config.js');
const kills = read('js/05-kill-progression.js');
const combat = read('js/04-combat-attack.js');
const pets = read('js/22-pets.js');
const summons = read('js/23-summons.js');
const guards = read('js/31-castle-guards.js');
const offline = read('js/27-offline-rewards.js');
const world = read('js/11-world-map.js');
const status = read('js/06-status-allies.js');

const helpers = drops.match(/function sherineEnemyDamageMult[\s\S]*?\nfunction applySherineTheme/);
assert.ok(helpers, '找不到席琳倍率共用函式');
const helperCtx = vm.createContext({});
vm.runInContext(helpers[0].replace(/\nfunction applySherineTheme$/, ''), helperCtx);
assert.equal(helperCtx.sherineEnemyDamageMult({ _sherine:true }), 1.7, '煉獄傷害倍率錯誤');
assert.equal(helperCtx.sherineEnemyDamageMult({ _sherine:true, _sherineMad:true }), 2.6, '地獄傷害倍率錯誤');
assert.equal(helperCtx.sherineWorldDropMult({ _sherine:true }), 1.5, '煉獄掉落倍率錯誤');
assert.equal(helperCtx.sherineWorldDropMult({ _sherine:true, _sherineMad:true }), 2.25, '地獄掉落倍率錯誤');
assert.equal(helperCtx.sherineWorldExpMult(false), 2.5, '煉獄經驗倍率錯誤');
assert.equal(helperCtx.sherineWorldExpMult(true), 4, '地獄經驗倍率錯誤');
assert.equal(helperCtx.sherineWorldGoldMult(false), 2, '煉獄金錢倍率錯誤');
assert.equal(helperCtx.sherineWorldGoldMult(true), 3, '地獄金錢倍率錯誤');

const traitSection = kills.match(/function applySherineBuff\(idx\)[\s\S]*?\nfunction applySherineGrace\(/);
assert.ok(traitSection, '找不到席琳怪物強化與能力程式');
let mad = false;
const fixedMath = Object.create(Math);
fixedMath.random = () => 0;
const ctx = vm.createContext({
    Math: fixedMath,
    mapState: { current:'forest', mobs:[] },
    state: { ticks:50 },
    sherineWorldActive: () => true,
    sherineMadActive: () => mad,
    isSiegeArea: () => false,
    sherineWorldExpMult: value => value ? 4 : 2.5,
    sherineWorldGoldMult: value => value ? 3 : 2
});
vm.runInContext(traitSection[0].replace(/\nfunction applySherineGrace\($/, ''), ctx);

const baseMob = () => ({ n:'測試怪', lv:100, hp:100, curHp:100, ac:0, mr:100, exp:100, goldMin:100, goldMax:100, hit:20, dr:0, race:'野獸', st:{} });
ctx.mapState.mobs[0] = baseMob();
ctx.applySherineBuff(0);
let normal = ctx.mapState.mobs[0];
assert.equal(normal.hp, 250, '煉獄 HP 應為 ×2.5');
assert.equal(normal.mr, 125, '煉獄 MR 應為 +25%');
assert.equal(normal.exp, 250, '煉獄經驗應為 ×2.5');
assert.equal(normal.goldMin, 200, '煉獄金錢應為 ×2');
assert.equal(normal.hit, 25, '煉獄命中應為 ×1.25');
assert.equal(normal.dr, 20, '煉獄額外減傷應為等級÷5');
assert.equal(normal._sherineTraits.length, 1, '煉獄一般怪應取得一項能力');

mad = true;
ctx.mapState.mobs[0] = baseMob();
ctx.applySherineBuff(0);
let hell = ctx.mapState.mobs[0];
assert.equal(hell.hp, 500, '地獄 HP 應為 ×5');
assert.equal(hell.mr, 150, '地獄 MR 應為 +50%');
assert.equal(hell.exp, 400, '地獄經驗應為 ×4');
assert.equal(hell.goldMin, 300, '地獄金錢應為 ×3');
assert.equal(hell.hit, 32, '地獄命中應為 ×1.6');
assert.equal(hell.dr, 33, '地獄額外減傷應為等級÷3');
assert.equal(hell._sherineTraits.length, 2, '地獄一般怪應取得兩項不重複能力');
assert.equal(new Set(hell._sherineTraits).size, 2, '地獄能力不得重複');

ctx.mapState.mobs[0] = { ...baseMob(), _train:true };
ctx.applySherineBuff(0);
assert.equal(ctx.mapState.mobs[0]._sherineTraits, undefined, '訓練假人不應取得席琳隨機能力');

let renewal = { _sherine:true, hp:1000, curHp:500, _sherineTraits:['renewal'], st:{} };
ctx.sherineMobTraitTick(renewal);
assert.equal(renewal.curHp, 530, '再生能力每五秒應恢復 3% HP');
let phase = { _sherine:true, hp:1000, curHp:1000, ac:-20, mr:100, _sherineTraits:['phaseWard'], _sherinePhaseBaseAc:-20, _sherinePhaseBaseMr:100, _sherinePhaseMagic:false, st:{} };
ctx.sherineMobTraitTick(phase);
assert.equal(phase.ac, -20, '魔法相位不應額外降低 AC');
assert.equal(phase.mr, 130, '魔法相位應增加 30 MR');
ctx.state.ticks = 100;
ctx.sherineMobTraitTick(phase);
assert.equal(phase.ac, -28, '物理相位應降低 8 AC');
assert.equal(phase.mr, 100, '物理相位應還原 MR');

const damagePaths = [combat, pets, summons, guards].join('\n');
assert.doesNotMatch(damagePaths, /_sherineMad\s*\?\s*3\s*:\s*2/, '仍有單位沿用舊席琳傷害倍率');
assert.match(damagePaths, /sherineEnemyDamageMult\(mob\)/, '戰鬥路徑未使用共用席琳傷害倍率');
assert.match(kills, /mob\.curHp <= 0[\s\S]*sherineMobHasTrait\(mob, 'lastStand'\)/, '不屈能力尚未接入死亡結算');
assert.match(status, /m\._sherineTenacityUsed[\s\S]*dur = Math\.max\(10, Math\.floor\(dur \/ 2\)\)/, '席琳韌性尚未接入控制時間');
assert.match(offline, /function _offlineSherineCrystalCount/, '離線結算缺少結晶保底');
assert.match(offline, /mob\.sherineMad \? 40 : 100/, '離線結晶保底門檻錯誤');
assert.match(drops, /sherineCrystalPity: \{ world:0, mad:0 \}/, '存檔預設缺少結晶保底進度');
assert.match(world, /頭目累積 100 次未掉落時保底/, '煉獄介面未顯示保底');
assert.match(world, /頭目 40 次保底/, '地獄介面未顯示保底');
assert.match(world, /目前保底進度 \$\{worldPity\}\/100/, '煉獄介面未顯示目前保底進度');
assert.match(world, /目前保底進度 \$\{madPity\}\/40/, '地獄介面未顯示目前保底進度');

console.log('席琳難度平衡測試通過');
