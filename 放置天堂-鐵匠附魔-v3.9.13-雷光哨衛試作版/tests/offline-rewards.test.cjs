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

const claimSection = source.match(/function _offlineClaimTime\(value, now\) \{[\s\S]*?\n    function _offlineApplyAllyExp/);
assert.ok(claimSection, '找不到 claim 生命週期程式');
const claimStore = Object.create(null);
const claimCtx = vm.createContext({
    player: { offlineHunt: { claimedUntil: 0 } },
    OFFLINE_VERSION: 8,
    OFFLINE_CLAIM_LOCK_MS: 60000,
    _offlineClaimOwner: 'owner-a',
    _offlineFinite: (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback,
    _offlineStoreKey: kind => kind,
    _offlineReadJson: key => claimStore[key] ? JSON.parse(JSON.stringify(claimStore[key])) : null,
    _offlineWriteJson: (key, value) => { claimStore[key] = JSON.parse(JSON.stringify(value)); return true; },
    _offlineStorageRemove: key => { delete claimStore[key]; return true; },
    _offlineNow: () => 5000,
    Math
});
vm.runInContext('let _offlinePendingClaimAt = 0;\n' +
    claimSection[0].replace(/\n    function _offlineApplyAllyExp$/, '') + '\n' +
    'globalThis.acquireClaim=_offlineAcquireClaim; globalThis.commitClaim=_offlineCommitClaim; ' +
    'globalThis.releaseClaim=_offlineReleaseClaim; globalThis.commitDeferred=_offlineCommitDeferredClaim; ' +
    'globalThis.setPendingAt=v=>{_offlinePendingClaimAt=v}; globalThis.getPendingAt=()=>_offlinePendingClaimAt;', claimCtx);

claimStore.claim = { status: 'committed', claimedUntil: 900 };
claimStore.checkpoint = { marker: 'old' };
let claimHandle = claimCtx.acquireClaim(1000);
assert.ok(claimHandle, '應能取得 claim token');
claimStore.claim = { status: 'pending', token: 'foreign', owner: 'owner-b', claimedUntil: 1100, lockUntil: 61000 };
claimStore.checkpoint = { marker: 'newer-tab' };
assert.equal(claimCtx.commitClaim(claimHandle, 1200), false, '失去 token 後不得提交 claim');
assert.equal(claimCtx.releaseClaim(claimHandle, true), false, '失去 token 後不得回滾');
assert.equal(claimStore.checkpoint.marker, 'newer-tab', '失去 token 的舊分頁覆蓋了新 checkpoint');

claimStore.claim = { status: 'committed', claimedUntil: 1400 };
claimStore.checkpoint = { marker: 'before-owned' };
claimHandle = claimCtx.acquireClaim(1500);
claimCtx.player.offlineHunt.claimedUntil = 1700;
assert.equal(claimCtx.commitClaim(claimHandle, 1600), true, '持有 token 時應能提交 claim');
assert.equal(claimStore.claim.claimedUntil, 1700, '提交 claim 不得早於角色內部已保存時間');

claimStore.claim = { status: 'committed', claimedUntil: 3000 };
claimCtx.player.offlineHunt.claimedUntil = 2500;
claimCtx.setPendingAt(2000);
assert.equal(claimCtx.commitDeferred(), true, '沒有有效鎖時應能提交延後 claim');
assert.equal(claimStore.claim.claimedUntil, 3000, '延後 claim 不得讓既有領取時間倒退');
claimStore.claim = { status: 'pending', token: 'foreign-live', owner: 'owner-b', claimedUntil: 4000, lockUntil: 65000 };
claimCtx.setPendingAt(3500);
assert.equal(claimCtx.commitDeferred(), false, '其他分頁持有有效鎖時不得插隊提交');
assert.equal(claimStore.claim.token, 'foreign-live', '延後 claim 覆蓋了其他分頁的有效鎖');

const restoreSection = source.match(/function _offlineRestorePendingCatchup\(sourceOverride\) \{[\s\S]*?\n    function _offlineCommitRestoredCatchup/);
assert.ok(restoreSection, '找不到待補跑恢復流程');
const catchupStore = { catchup: { ms: 5000 } };
const sourceOverride = { eligible: true, map: 'field', profile: { map: 'field', killsPerMin: 10 } };
const restoreCtx = vm.createContext({
    TICK_MS: 100,
    window: { offlineSettleCatchup: () => { throw new Error('simulated grant failure'); } },
    _offlineStoreKey: () => 'catchup',
    _offlineReadJson: key => catchupStore[key] || null,
    _offlineStorageRemove: key => { delete catchupStore[key]; return true; },
    _offlineFinite: (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback
});
vm.runInContext('let _offlineRestoredCatchupKey=""; let _offlineLastBatchSavedOk=false;\n' +
    restoreSection[0].replace(/\n    function _offlineCommitRestoredCatchup$/, '') + '\n' +
    'globalThis.restorePending=_offlineRestorePendingCatchup; globalThis.restoredKey=()=>_offlineRestoredCatchupKey;', restoreCtx);
assert.throws(() => restoreCtx.restorePending(sourceOverride), /simulated grant failure/,
    '補跑內部例外應向上回報');
assert.ok(catchupStore.catchup, '補跑例外後持久憑證不應被刪除');
assert.equal(restoreCtx.restoredKey(), '', '補跑例外後不應留下可被普通存檔誤提交的記憶體標記');

assert.match(source, /catchupSource = \{[\s\S]*?profile: JSON\.parse\(JSON\.stringify\(profile\)\)/,
    '主離線結算前沒有保存合格補跑來源');
assert.match(source, /_offlineRestorePendingCatchup\(catchupSource\)/,
    '待補跑沒有使用結算前保存的合格來源');
assert.match(source, /function _offlineSettleCatchup\(elapsedMs, reason, sourceOverride\)/,
    '背景補跑結算沒有接收保存的來源');

console.log('離線掛網核心回歸測試通過');
