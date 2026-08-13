const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const offline = read('js/27-offline-rewards.js');
const kills = read('js/05-kill-progression.js');
const drops = read('js/01-drops-config.js');
const world = read('js/11-world-map.js');

const profileSection = offline.match(/function _offlineCurrentDifficulty\(\)[\s\S]*?\n    function _offlineResetRuntime/);
assert.ok(profileSection, '找不到離線難度與樣本分流程式');
const profileCtx = vm.createContext({
    player: { sherineWorld:false, sherineMad:false, cls:'knight' },
    OFFLINE_VERSION: 7,
    OFFLINE_MAX_SAVED_PROFILES: 15,
    OFFLINE_MAX_EXP_PER_MIN: 1e12,
    OFFLINE_MAX_GOLD_PER_MIN: 1e10,
    OFFLINE_MAX_KILLS_PER_MIN: 3000,
    _offlineFinite: (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback,
    _offlineClamp: (value, lo, hi) => Math.max(lo, Math.min(hi, Number(value) || 0)),
    _offlineMapName: map => map,
    _offlineMobProfiles: rows => Array.isArray(rows) ? rows : [],
    _offlineBossProfiles: rows => Array.isArray(rows) ? rows : [],
    _offlineSurvivalProfile: raw => raw || null
});
vm.runInContext(profileSection[0].replace(/\n    function _offlineResetRuntime$/, ''), profileCtx);

const sameMapProfiles = profileCtx._offlineSavedProfiles([
    { map:'forest', difficulty:'normal', killsPerMin:10, updatedAt:1 },
    { map:'forest', difficulty:'world', killsPerMin:20, updatedAt:2 },
    { map:'forest', difficulty:'mad', killsPerMin:30, updatedAt:3 }
], null);
assert.equal(sameMapProfiles.length, 3, '同地圖三種難度的離線樣本不應互相覆蓋');

const profileState = { profile:sameMapProfiles[0], profiles:sameMapProfiles };
profileCtx.player.sherineWorld = true;
assert.equal(profileCtx._offlineProfileForMap(profileState, 'forest').difficulty, 'world', '煉獄應只讀煉獄離線樣本');
profileCtx.player.sherineWorld = false;
profileCtx.player.sherineMad = true;
assert.equal(profileCtx._offlineProfileForMap(profileState, 'forest').difficulty, 'mad', '地獄應只讀地獄離線樣本');

assert.equal(profileCtx._offlineProfile({ map:'legacy', mobs:[{ sherine:true }] }).difficulty, 'world', '舊煉獄樣本應能從怪物快照遷移');
assert.equal(profileCtx._offlineProfile({ map:'legacy', mobs:[{ sherine:true, sherineMad:true }] }).difficulty, 'mad', '舊地獄樣本應能從怪物快照遷移');
assert.equal(profileCtx._offlineProfile({ map:'legacy', mobs:[] }).difficulty, 'normal', '無難度證據的舊樣本應安全降為普通');

const blessSection = offline.match(/function _offlineEquipmentBlessRate\(mob\) \{[\s\S]*?\n    \}/);
assert.ok(blessSection, '找不到離線裝備祝福率程式');
const blessCtx = vm.createContext({});
vm.runInContext(blessSection[0], blessCtx);
assert.equal(blessCtx._offlineEquipmentBlessRate({}), 0.01, '普通怪離線祝福率應為 1%');
assert.equal(blessCtx._offlineEquipmentBlessRate({ sherine:true }), 0.03, '煉獄一般怪離線祝福率應為 3%');
assert.equal(blessCtx._offlineEquipmentBlessRate({ sherine:true, sherineMad:true }), 0.05, '地獄一般怪離線祝福率應為 5%');
assert.equal(blessCtx._offlineEquipmentBlessRate({ sherine:true, boss:true }), 0.20, '煉獄頭目離線祝福率應為 20%');
assert.equal(blessCtx._offlineEquipmentBlessRate({ sherine:true, sherineMad:true, boss:true }), 0.30, '地獄頭目離線祝福率應為 30%');

assert.match(offline, /function _offlineFallbackMobs\(map, difficulty\)/, '離線備援怪物沒有接收樣本難度');
assert.match(offline, /sherine: difficulty !== 'normal'/, '地獄備援怪物仍可能遺失席琳旗標');
assert.match(offline, /sherineMad: difficulty === 'mad'/, '地獄備援怪物仍可能遺失地獄旗標');
assert.match(kills, /sherineMadActive\(\) \? 'prideRankSherineMad'/, '傲慢之塔地獄排名尚未分流');
assert.match(kills, /sherineMadActive\(\) \? 'riftRankSherineMad'/, '時空裂痕地獄排名尚未分流');
assert.match(drops, /prideRankSherineMad:/, '存檔預設缺少傲慢之塔地獄排名');
assert.match(drops, /riftRankSherineMad:/, '存檔預設缺少時空裂痕地獄排名');
assert.match(drops, /if \(p\.sherineMad\) p\.sherineWorld = false/, '讀檔時沒有修復互斥難度旗標');
assert.match(world, /排名紀錄（地獄）/, '傲慢之塔介面沒有獨立顯示地獄排名');
assert.match(kills, /排名紀錄（地獄）/, '時空裂痕介面沒有獨立顯示地獄排名');

console.log('席琳模式回歸測試通過');
