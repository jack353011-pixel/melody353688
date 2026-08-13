const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/27-offline-rewards.js'), 'utf8');

assert.match(source, /const OFFLINE_VERSION = 8;/, '離線存檔版本尚未升級');

const qualification = source.match(/function _offlineRuntimeQualified\(now, profile, map, difficulty\) \{[\s\S]*?\n    \}\n\n    function _offlineRuntimeStale[\s\S]*?\n    \}/);
assert.ok(qualification, '找不到離線實戰資格判定');
const qualificationCtx = vm.createContext({
    runtime: null,
    OFFLINE_SAMPLE_MIN_KILLS: 3,
    OFFLINE_SAMPLE_MIN_MS: 15000,
    OFFLINE_RECENT_KILL_MS: 30000,
    _offlineCurrentDifficulty: () => 'normal'
});
vm.runInContext('let _offlineRuntime = globalThis.runtime;\n' + qualification[0] + '\n' +
    'globalThis.checkQualified = _offlineRuntimeQualified; globalThis.checkStale = _offlineRuntimeStale;', qualificationCtx);

const regularProfile = { bossRoom: false };
qualificationCtx.runtime = { map: 'field', difficulty: 'normal', firstKillAt: 0, lastKillAt: 0, kills: 0, bossKills: 0, lastBossAt: 0 };
vm.runInContext('_offlineRuntime = globalThis.runtime;', qualificationCtx);
assert.equal(qualificationCtx.checkQualified(100000, regularProfile, 'field', 'normal'), false,
    '剛載入或剛切圖不應沿用舊樣本直接掛網');

qualificationCtx.runtime = { map: 'field', difficulty: 'normal', firstKillAt: 90000, lastKillAt: 99900, kills: 3, bossKills: 0, lastBossAt: 0 };
vm.runInContext('_offlineRuntime = globalThis.runtime;', qualificationCtx);
assert.equal(qualificationCtx.checkQualified(100000, regularProfile, 'field', 'normal'), false,
    '一般地圖未實戰滿 15 秒不應通過');
qualificationCtx.runtime.firstKillAt = 80000;
assert.equal(qualificationCtx.checkQualified(100000, regularProfile, 'field', 'normal'), true,
    '一般地圖滿 15 秒且擊殺 3 隻應通過');
assert.equal(qualificationCtx.checkQualified(140001, regularProfile, 'field', 'normal'), false,
    '太久沒有擊殺後應失去掛網資格');
assert.equal(qualificationCtx.checkStale(140001, regularProfile, 'field', 'normal'), true,
    '太久沒有擊殺應顯示樣本過期');

const bossProfile = { bossRoom: true };
qualificationCtx.runtime = { map: 'boss_room', difficulty: 'normal', firstKillAt: 0, lastKillAt: 0, kills: 0, bossKills: 0, lastBossAt: 0 };
vm.runInContext('_offlineRuntime = globalThis.runtime;', qualificationCtx);
assert.equal(qualificationCtx.checkQualified(100000, bossProfile, 'boss_room', 'normal'), false,
    '純頭目房未擊敗頭目前不應掛網');
qualificationCtx.runtime.bossKills = 1;
qualificationCtx.runtime.lastBossAt = 99900;
assert.equal(qualificationCtx.checkQualified(100000, bossProfile, 'boss_room', 'normal'), true,
    '純頭目房本次擊敗頭目後應通過');

assert.match(source, /return _offlineRuntimeQualified\(now, profile, mapState\.current, difficulty\);/,
    '建立離線快照時沒有讀取本次實戰資格');
assert.doesNotMatch(source, /if \(_offlineRuntime && _offlineRuntime\.lastKillAt > 0 && now - _offlineRuntime\.lastKillAt/,
    '舊的 lastKillAt=0 繞過判定仍存在');

const trueOfflineOptions = source.match(/label: '離線收益',[\s\S]*?claimHandle: claimHandle/);
assert.ok(trueOfflineOptions, '找不到真正離線收益選項');
assert.match(trueOfflineOptions[0], /advanceCombatTime: true/,
    '真正離線結算沒有推進技能冷卻、增益與戰鬥時間');

assert.match(source, /let claimHandle = _offlineAcquireClaim\(now\);/,
    '離線結算缺少短效跨分頁鎖');
assert.match(source, /saved\.claimedUntil = Math\.max\([\s\S]*?now\);/,
    '領取時間沒有與角色獎勵一起寫入角色狀態');
assert.match(source, /if \(savedOk\)[\s\S]*?_offlineCommitClaim\(options\.claimHandle, now\)/,
    '角色存檔成功後沒有提交領取時間');
assert.match(source, /_offlinePendingClaimAt = Math\.max\(_offlinePendingClaimAt, now\);[\s\S]*?_offlineReleaseClaim\(options\.claimHandle, true\)/,
    '角色存檔失敗時沒有回復外部領取點與 checkpoint');
assert.match(source, /if \(result === true\) _offlineCommitDeferredClaim\(\);/,
    '後續手動存檔成功時沒有提交延後領取時間');

console.log('離線掛網核心回歸測試通過');
