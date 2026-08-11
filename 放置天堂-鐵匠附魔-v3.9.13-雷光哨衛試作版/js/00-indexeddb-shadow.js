/* ============================================================================
 * IndexedDB phase 4: compact primary store + synchronous compatibility cache
 *
 * Character saves and durable shared progress now have a versioned primary copy
 * in IndexedDB. localStorage remains a synchronous compatibility cache so the
 * existing game can keep its immediate _lsGet contract. At startup both copies
 * are reconciled per key: a newer local write is promoted, while a missing or
 * stale cache entry is restored from IndexedDB. Any database failure leaves the
 * legacy localStorage path usable. Rotating automatic backups remain in their
 * dedicated IndexedDB store and still fall back to localStorage when necessary.
 * Phase 4 removes the obsolete all-key shadow duplicate and keeps only a short
 * crash journal in localStorage instead of an ever-growing revision table.
 * ========================================================================== */
(function () {
  'use strict';

  var api = {
    phase: 'compact-primary', state: 'opening', authoritative: 'localStorage',
    keyCount: 0, verifiedAt: 0, lastError: '', pending: 0, writes: 0,
    backupCount: 0, backupLastError: '', primaryCount: 0,
    primaryRestored: 0, primaryLastError: '', primaryBytes: 0,
    journalCount: 0
  };
  window.FB5_IDB_SHADOW = api;

  function notify() {
    try { window.dispatchEvent(new CustomEvent('fb5:idb-shadow-state', { detail: api.getStatus() })); } catch (e) {}
  }
  function setState(state, err) {
    api.state = state;
    api.lastError = err ? String(err && err.message || err) : '';
    notify();
  }
  api.getStatus = function () {
    return {
      phase: api.phase, state: api.state, authoritative: api.authoritative,
      keyCount: api.keyCount, verifiedAt: api.verifiedAt,
      lastError: api.lastError, pending: api.pending, writes: api.writes,
      backupCount: api.backupCount, backupLastError: api.backupLastError,
      primaryCount: api.primaryCount, primaryRestored: api.primaryRestored,
      primaryLastError: api.primaryLastError, primaryBytes: api.primaryBytes,
      journalCount: api.journalCount
    };
  };

  if (window.fableStore) {
    setState('file-store');
    api.ready = Promise.resolve(api.getStatus());
    api.flush = function () { return api.ready; };
    api.audit = function () { return Promise.resolve({ ok: true, skipped: 'file-store' }); };
    return;
  }
  if (!window.indexedDB || typeof window._lsSet !== 'function' || typeof window._lsRemove !== 'function') {
    setState('unsupported', 'IndexedDB or storage facade unavailable');
    api.ready = Promise.resolve(api.getStatus());
    api.flush = function () { return api.ready; };
    api.audit = function () { return Promise.resolve({ ok: false, skipped: 'unsupported' }); };
    return;
  }

  var DB_NAME = 'idle_lineage_storage';
  var DB_VERSION = 4;
  var KV_STORE = 'kv';
  var META_STORE = 'meta';
  var BACKUP_STORE = 'autoBackups';
  var PRIMARY_STORE = 'primaryState';
  var PRIMARY_META_KEY = 'primaryState';
  var PRIMARY_REVISION_KEY = 'fb5_idb_primary_revisions_v1';
  var PRIMARY_RESET_KEY = 'fb5_idb_primary_reset_v1';
  var db = null;
  var migrating = true;
  var queued = [];
  var flushTimer = 0;
  var flushChain = Promise.resolve();
  var nativeSet = window._lsSet;
  var nativeRemove = window._lsRemove;
  var backupCache = Object.create(null);
  var backupChain = Promise.resolve();
  var primaryRevisions = readPrimaryRevisions();
  var primarySequence = 0;
  var primaryActive = Object.create(null);
  var primarySizes = Object.create(null);

  function primaryKey(key) {
    key = String(key || '');
    if (/^lineage_idle_save(?:_\d+)?(?:_bak)?$/.test(key)) return true;
    if (/^lineage_idle_(?:warehouse|carddex|equipdex|miscdex|relicdex)(?:_classic|_trad)?$/.test(key)) return true;
    if (/^lineage_idle_(?:antharas_points|autosell_global_v1)/.test(key)) return true;
    if (key.indexOf('lineage_idle_offline_v1_') === 0) return true;
    if (key.indexOf('fb5_pet_roster') === 0) return true;
    if (key === 'fb5_clan_state_v1' || key === 'fb5_merc_exp_ledger' ||
        key === 'fb5_deleted_role_guards_v1' || key === 'fb5_pandora_relic_market_v1') return true;
    return key.indexOf('fb5_mercenary_employment_v1_') === 0;
  }
  function readPrimaryRevisions() {
    try {
      var parsed = JSON.parse(localStorage.getItem(PRIMARY_REVISION_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : Object.create(null);
    } catch (e) { return Object.create(null); }
  }
  function writePrimaryRevisions(map) {
    primaryRevisions = map && typeof map === 'object' ? map : Object.create(null);
    var keys = Object.keys(primaryRevisions).filter(function (key) { return Number(primaryRevisions[key]) > 0; });
    api.journalCount = keys.length;
    try {
      if (keys.length) nativeSet(PRIMARY_REVISION_KEY, JSON.stringify(primaryRevisions));
      else nativeRemove(PRIMARY_REVISION_KEY);
    } catch (e) {}
  }
  function savePrimaryRevisions() {
    try {
      var latest = JSON.parse(localStorage.getItem(PRIMARY_REVISION_KEY) || '{}');
      if (latest && typeof latest === 'object' && !Array.isArray(latest)) {
        Object.keys(latest).forEach(function (key) {
          primaryRevisions[key] = Math.max(Number(primaryRevisions[key]) || 0, Number(latest[key]) || 0);
        });
      }
    } catch (e) {}
    writePrimaryRevisions(primaryRevisions);
  }
  function clearCommittedRevisions(records) {
    var latest = readPrimaryRevisions();
    (records || []).forEach(function (rec) {
      var key = String(rec && rec.key || ''), rev = Math.max(0, Number(rec && rec.rev) || 0);
      if (key && Math.max(0, Number(latest[key]) || 0) <= rev) delete latest[key];
    });
    writePrimaryRevisions(latest);
  }
  function nextPrimaryRevision(key) {
    try {
      var latest = JSON.parse(localStorage.getItem(PRIMARY_REVISION_KEY) || '{}');
      if (latest && typeof latest === 'object') primaryRevisions[key] = Math.max(Number(primaryRevisions[key]) || 0, Number(latest[key]) || 0);
    } catch (e) {}
    var floor = Date.now() * 100;
    var previous = Math.max(0, Number(primaryRevisions[key]) || 0);
    var rev = Math.max(floor + (primarySequence++ % 100), previous + 1);
    primaryRevisions[key] = rev;
    savePrimaryRevisions();
    return rev;
  }
  function localPrimaryRows() {
    primaryRevisions = readPrimaryRevisions();
    var rows = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!primaryKey(key)) continue;
        var value = localStorage.getItem(key);
        if (value != null) rows.push({ key: key, value: value, rev: Math.max(0, Number(primaryRevisions[key]) || 0), deleted: false });
      }
    } catch (e) {}
    return rows;
  }
  function updatePrimaryMetrics() {
    api.primaryCount = Object.keys(primaryActive).length;
    api.primaryBytes = Object.keys(primarySizes).reduce(function (sum, key) { return sum + Math.max(0, Number(primarySizes[key]) || 0); }, 0);
    api.journalCount = Object.keys(primaryRevisions).length;
  }
  function txDone(tx) {
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(); };
      tx.onabort = tx.onerror = function () { reject(tx.error || new Error('IndexedDB transaction failed')); };
    });
  }
  function requestDone(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('IndexedDB request failed')); };
    });
  }
  function openDatabase() {
    return new Promise(function (resolve, reject) {
      var req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); }
      catch (e) { reject(e); return; }
      req.onupgradeneeded = function () {
        var upgradeDb = req.result;
        // Phase 1/2 的 kv 是 localStorage 全量副本；第三階段已有正式主資料桶後不再需要。
        if (upgradeDb.objectStoreNames.contains(KV_STORE)) upgradeDb.deleteObjectStore(KV_STORE);
        if (!upgradeDb.objectStoreNames.contains(META_STORE)) upgradeDb.createObjectStore(META_STORE);
        if (!upgradeDb.objectStoreNames.contains(BACKUP_STORE)) {
          var backups = upgradeDb.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
          backups.createIndex('slot', 'slot', { unique: false });
        }
        if (!upgradeDb.objectStoreNames.contains(PRIMARY_STORE)) upgradeDb.createObjectStore(PRIMARY_STORE, { keyPath: 'key' });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('IndexedDB open failed')); };
      req.onblocked = function () { setState('blocked', 'IndexedDB upgrade blocked by another tab'); };
    });
  }

  function queueOp(type, key, value, primaryRev) {
    queued.push({ type: type, key: String(key), value: value, primaryRev: primaryRev || 0 });
    api.pending = queued.length;
    if (!migrating && db && !flushTimer) {
      flushTimer = setTimeout(function () { flushTimer = 0; flushQueued(); }, 0);
    }
  }
  // Preserve the old synchronous contract. A failed localStorage write is never
  // reported as successful merely because the primary database may accept it.
  window._lsSet = function (key, value) {
    var ok = nativeSet(key, value);
    if (ok && primaryKey(key)) queueOp('put', key, value, nextPrimaryRevision(String(key)));
    return ok;
  };
  window._lsRemove = function (key) {
    nativeRemove(key);
    if (primaryKey(key)) queueOp('delete', key, null, nextPrimaryRevision(String(key)));
  };

  function flushBatch(batch) {
    if (!db || !batch.length) return Promise.resolve();
    var latest = Object.create(null), order = [];
    batch.forEach(function (op) {
      if (!Object.prototype.hasOwnProperty.call(latest, op.key)) order.push(op.key);
      latest[op.key] = op;
    });
    var tx = db.transaction(PRIMARY_STORE, 'readwrite');
    var done = txDone(tx);
    var store = tx.objectStore(PRIMARY_STORE), applied = Object.create(null);
    order.forEach(function (key) {
      var op = latest[key];
      // 多分頁同時寫入時，只允許較新的版本覆蓋，避免較晚完成的舊交易倒退主資料。
      var req = store.get(key);
      req.onsuccess = function () {
        var current = req.result, currentRev = Math.max(0, Number(current && current.rev) || 0);
        if (currentRev > op.primaryRev) return;
        var rec = {
          key: key, value: op.type === 'delete' ? '' : String(op.value),
          rev: op.primaryRev, updatedAt: Date.now(), deleted: op.type === 'delete'
        };
        store.put(rec);
        applied[key] = rec;
      };
    });
    return done.then(function () {
      api.writes += order.length;
      order.forEach(function (key) {
        var rec = applied[key];
        if (!rec) return;
        if (rec.deleted) {
          delete primaryActive[key];
          delete primarySizes[key];
        } else {
          primaryActive[key] = true;
          primarySizes[key] = rec.key.length + rec.value.length;
        }
      });
      clearCommittedRevisions(order.map(function (key) { return { key: key, rev: latest[key].primaryRev }; }));
      updatePrimaryMetrics();
      api.lastError = '';
      if (api.state === 'degraded') api.state = 'ready';
      notify();
    });
  }
  function flushQueued() {
    if (migrating || !db || !queued.length) return flushChain;
    var batch = queued.splice(0, queued.length);
    api.pending = queued.length;
    flushChain = flushChain.then(function () { return flushBatch(batch); }).catch(function (e) {
      // Keep only the newest failed operations for a later retry.
      queued = batch.concat(queued);
      api.pending = queued.length;
      setState('degraded', e);
    });
    return flushChain;
  }

  function markOptimized() {
    var now = Date.now();
    var tx = db.transaction(META_STORE, 'readwrite');
    var done = txDone(tx);
    tx.objectStore(META_STORE).put({
      phase: 4, authoritative: 'IndexedDB(primary)+localStorage(sync-cache)', state: 'optimized',
      primaryCount: api.primaryCount, primaryBytes: api.primaryBytes, optimizedAt: now
    }, 'migration');
    tx.objectStore(META_STORE).put({
      phase: 4, primaryCount: api.primaryCount, primaryBytes: api.primaryBytes, optimizedAt: now
    }, PRIMARY_META_KEY);
    return done.then(function () {
      try { api.keyCount = localStorage.length; } catch (e) { api.keyCount = 0; }
      api.verifiedAt = now;
    });
  }

  function readPrimaryRecords() {
    var tx = db.transaction(PRIMARY_STORE, 'readonly'), done = txDone(tx);
    return requestDone(tx.objectStore(PRIMARY_STORE).getAll()).then(function (rows) {
      return done.then(function () { return Array.isArray(rows) ? rows : []; });
    });
  }
  function replacePrimaryRecords(records) {
    records = Array.isArray(records) ? records : [];
    var tx = db.transaction([PRIMARY_STORE, META_STORE], 'readwrite'), done = txDone(tx);
    var store = tx.objectStore(PRIMARY_STORE), now = Date.now(), count = 0;
    store.clear();
    primaryActive = Object.create(null);
    primarySizes = Object.create(null);
    records.forEach(function (rec) {
      if (!rec || !primaryKey(rec.key) || typeof rec.value !== 'string' || rec.deleted === true) return;
      var rev = Math.max(1, Number(rec.rev) || nextPrimaryRevision(rec.key));
      primaryRevisions[rec.key] = Math.max(Number(primaryRevisions[rec.key]) || 0, rev);
      store.put({ key: String(rec.key), value: rec.value, rev: rev, updatedAt: Math.max(1, Number(rec.updatedAt) || now), deleted: false });
      primaryActive[String(rec.key)] = true;
      primarySizes[String(rec.key)] = String(rec.key).length + rec.value.length;
      count++;
    });
    tx.objectStore(META_STORE).put({ phase: 4, migratedAt: now, primaryCount: count }, PRIMARY_META_KEY);
    return done.then(function () {
      clearCommittedRevisions(records);
      updatePrimaryMetrics();
      try { nativeRemove(PRIMARY_RESET_KEY); } catch (e) {}
      return count;
    });
  }
  function rebuildPrimaryFromLocal() {
    var rows = localPrimaryRows().map(function (row) {
      var rev = row.rev || nextPrimaryRevision(row.key);
      return { key: row.key, value: row.value, rev: rev, updatedAt: Date.now(), deleted: false };
    });
    return replacePrimaryRecords(rows);
  }
  function reconcilePrimary() {
    var reset = false;
    try { reset = localStorage.getItem(PRIMARY_RESET_KEY) === '1'; } catch (e) {}
    var metaTx = db.transaction(META_STORE, 'readonly'), metaDone = txDone(metaTx);
    return requestDone(metaTx.objectStore(META_STORE).get(PRIMARY_META_KEY)).then(function (meta) {
      return metaDone.then(function () { return meta; });
    }).then(function (meta) {
      if (reset || !meta || Number(meta.phase) < 3) return rebuildPrimaryFromLocal();
      return readPrimaryRecords().then(function (dbRows) {
        var dbByKey = Object.create(null), localByKey = Object.create(null), promote = [], restored = 0, committed = [];
        primaryActive = Object.create(null);
        primarySizes = Object.create(null);
        dbRows.forEach(function (rec) {
          if (!rec || !primaryKey(rec.key)) return;
          dbByKey[rec.key] = rec;
          if (!rec.deleted) {
            primaryActive[rec.key] = true;
            primarySizes[rec.key] = String(rec.key).length + String(rec.value || '').length;
          }
        });
        localPrimaryRows().forEach(function (rec) { localByKey[rec.key] = rec; });
        var keys = Object.create(null);
        Object.keys(dbByKey).forEach(function (key) { keys[key] = true; });
        Object.keys(localByKey).forEach(function (key) { keys[key] = true; });
        Object.keys(keys).forEach(function (key) {
          var local = localByKey[key], stored = dbByKey[key];
          var localRev = Math.max(0, Number(primaryRevisions[key]) || 0, Number(local && local.rev) || 0);
          var dbRev = Math.max(0, Number(stored && stored.rev) || 0);
          // 已提交且內容相同：直接確認版本，不把正常同步快取誤算成「每次啟動都要恢復」。
          if (local && stored && stored.deleted !== true && stored.value === local.value) {
            primaryActive[key] = true;
            primarySizes[key] = key.length + local.value.length;
            committed.push({ key: key, rev: dbRev });
            return;
          }
          // localStorage 已刪除但刪除版本尚未寫入 IndexedDB：保留 tombstone，不能把舊主檔復活。
          if (!local && localRev > dbRev) {
            promote.push({ key: key, value: '', rev: localRev, updatedAt: Date.now(), deleted: true });
            delete primaryActive[key];
            return;
          }
          if (local && (!stored || localRev > dbRev || (localRev === dbRev && stored.value !== local.value))) {
            var promotedRev = localRev > dbRev ? localRev : nextPrimaryRevision(key);
            promote.push({ key: key, value: local.value, rev: promotedRev, updatedAt: Date.now(), deleted: false });
            primaryActive[key] = true;
            return;
          }
          if (stored && stored.deleted === true && dbRev >= localRev) {
            if (local) { nativeRemove(key); restored++; }
            delete primaryActive[key];
            delete primarySizes[key];
            committed.push({ key: key, rev: dbRev });
            return;
          }
          if (stored && !stored.deleted && (!local || dbRev > localRev)) {
            if (nativeSet(key, stored.value) === false) throw new Error('localStorage compatibility cache restore failed');
            primaryActive[key] = true;
            primarySizes[key] = key.length + stored.value.length;
            committed.push({ key: key, rev: dbRev });
            restored++;
          }
        });
        api.primaryRestored = restored;
        clearCommittedRevisions(committed);
        updatePrimaryMetrics();
        if (!promote.length) return api.primaryCount;
        var tx = db.transaction(PRIMARY_STORE, 'readwrite'), done = txDone(tx), store = tx.objectStore(PRIMARY_STORE);
        promote.forEach(function (rec) { store.put(rec); });
        return done.then(function () { return readPrimaryRecords(); }).then(function (rows) {
          primaryActive = Object.create(null);
          primarySizes = Object.create(null);
          rows.forEach(function (rec) {
            if (!rec || rec.deleted) return;
            primaryActive[rec.key] = true;
            primarySizes[rec.key] = String(rec.key).length + String(rec.value || '').length;
          });
          clearCommittedRevisions(promote);
          updatePrimaryMetrics();
          return api.primaryCount;
        });
      });
    }).then(function (count) {
      api.primaryLastError = '';
      return count;
    }).catch(function (e) {
      api.primaryLastError = String(e && e.message || e);
      throw e;
    });
  }

  // ── Rotating automatic backups continue to live primarily in IndexedDB. ──
  function cleanBackupRecord(rec) {
    if (!rec || typeof rec !== 'object' || typeof rec.raw !== 'string' || !rec.raw) return null;
    var slot = Math.max(1, Math.floor(Number(rec.slot) || 1));
    var at = Math.max(1, Math.floor(Number(rec.at) || Date.now()));
    return {
      id: String(rec.id || (slot + ':' + at + ':' + Math.random().toString(36).slice(2, 8))),
      slot: slot, at: at, lv: Math.max(1, Math.floor(Number(rec.lv) || 1)),
      name: String(rec.name || ''), raw: rec.raw
    };
  }
  function backupMeta(rec, index) {
    return { id: rec.id, index: index + 1, slot: rec.slot, at: rec.at, lv: rec.lv, name: rec.name };
  }
  function cacheRecords(records) {
    backupCache = Object.create(null);
    (records || []).forEach(function (rec) {
      rec = cleanBackupRecord(rec);
      if (!rec) return;
      if (!backupCache[rec.slot]) backupCache[rec.slot] = [];
      backupCache[rec.slot].push(backupMeta(rec, 0));
    });
    Object.keys(backupCache).forEach(function (slot) {
      backupCache[slot].sort(function (a, b) { return b.at - a.at; });
      backupCache[slot] = backupCache[slot].slice(0, 3).map(function (rec, i) { rec.index = i + 1; return rec; });
    });
    api.backupCount = Object.keys(backupCache).reduce(function (n, slot) { return n + backupCache[slot].length; }, 0);
    notify();
  }
  function cacheSlotRecords(slot, records) {
    slot = Math.max(1, Math.floor(Number(slot) || 1));
    var clean = (records || []).map(cleanBackupRecord).filter(Boolean).sort(function (a, b) { return b.at - a.at; }).slice(0, 3);
    if (clean.length) backupCache[slot] = clean.map(function (rec, i) { return backupMeta(rec, i); });
    else delete backupCache[slot];
    api.backupCount = Object.keys(backupCache).reduce(function (n, key) { return n + backupCache[key].length; }, 0);
    notify();
  }
  function loadBackupCache() {
    var tx = db.transaction(BACKUP_STORE, 'readonly');
    var done = txDone(tx);
    return requestDone(tx.objectStore(BACKUP_STORE).getAll()).then(function (records) {
      return done.then(function () { cacheRecords(records); return records; });
    });
  }
  function pruneBackups() {
    return loadBackupCache().then(function (records) {
      var remove = [], grouped = Object.create(null);
      records.forEach(function (rec) {
        if (!grouped[rec.slot]) grouped[rec.slot] = [];
        grouped[rec.slot].push(rec);
      });
      Object.keys(grouped).forEach(function (slot) {
        grouped[slot].sort(function (a, b) { return b.at - a.at; });
        grouped[slot].slice(3).forEach(function (rec) { remove.push(rec.id); });
      });
      if (!remove.length) { cacheRecords(records); return; }
      var tx = db.transaction(BACKUP_STORE, 'readwrite');
      var done = txDone(tx), store = tx.objectStore(BACKUP_STORE);
      remove.forEach(function (id) { store.delete(id); });
      return done.then(loadBackupCache);
    });
  }
  function pruneBackupSlot(slot) {
    slot = Math.max(1, Math.floor(Number(slot) || 1));
    var tx = db.transaction(BACKUP_STORE, 'readonly'), done = txDone(tx);
    return requestDone(tx.objectStore(BACKUP_STORE).index('slot').getAll(slot)).then(function (records) {
      return done.then(function () {
        records.sort(function (a, b) { return b.at - a.at; });
        var keep = records.slice(0, 3), remove = records.slice(3);
        if (!remove.length) { cacheSlotRecords(slot, keep); return; }
        var delTx = db.transaction(BACKUP_STORE, 'readwrite'), delDone = txDone(delTx), store = delTx.objectStore(BACKUP_STORE);
        remove.forEach(function (rec) { store.delete(rec.id); });
        return delDone.then(function () { cacheSlotRecords(slot, keep); });
      });
    });
  }
  function writeBackup(rec) {
    rec = cleanBackupRecord(rec);
    if (!rec) return Promise.reject(new Error('Invalid automatic backup'));
    var tx = db.transaction(BACKUP_STORE, 'readwrite');
    var done = txDone(tx);
    tx.objectStore(BACKUP_STORE).put(rec);
    return done.then(function () { return pruneBackupSlot(rec.slot); }).then(function () { api.backupLastError = ''; return rec; });
  }
  function fallbackBackupToLocal(rec) {
    try {
      var prefix = 'lineage_idle_save_' + rec.slot + '_auto_bak_', meta = [];
      try { meta = JSON.parse(localStorage.getItem(prefix + 'meta') || '[]'); } catch (e) {}
      for (var i = 2; i >= 1; i--) {
        var older = localStorage.getItem(prefix + i);
        if (older != null && !nativeSet(prefix + (i + 1), older)) return false;
      }
      if (!nativeSet(prefix + '1', rec.raw)) return false;
      meta.unshift({ at: rec.at, lv: rec.lv, name: rec.name });
      return nativeSet(prefix + 'meta', JSON.stringify(meta.slice(0, 3)));
    } catch (e) { return false; }
  }
  function legacyBackupRows() {
    var rows = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i), match = /^lineage_idle_save_(\d+)_auto_bak_([1-3])$/.exec(key || '');
        if (!match) continue;
        var raw = localStorage.getItem(key); if (!raw) continue;
        var slot = Number(match[1]), idx = Number(match[2]), meta = [];
        try { meta = JSON.parse(localStorage.getItem('lineage_idle_save_' + slot + '_auto_bak_meta') || '[]'); } catch (e) {}
        var info = meta[idx - 1] || {};
        var at = Math.max(1, Math.floor(Number(info.at) || (Date.now() - idx)));
        rows.push({ id: 'legacy:' + slot + ':' + at + ':' + idx, slot: slot, at: at, lv: info.lv, name: info.name, raw: raw, legacyKey: key });
      }
    } catch (e) {}
    return rows;
  }
  function migrateLegacyBackups() {
    var rows = legacyBackupRows();
    if (!rows.length) return loadBackupCache();
    var tx = db.transaction(BACKUP_STORE, 'readwrite');
    var done = txDone(tx), store = tx.objectStore(BACKUP_STORE);
    rows.forEach(function (rec) { var clean = cleanBackupRecord(rec); if (clean) store.put(clean); });
    return done.then(pruneBackups).then(function () {
      // IndexedDB commit + readback completed. Only now release the old quota.
      var slots = Object.create(null);
      rows.forEach(function (rec) { slots[rec.slot] = true; window._lsRemove(rec.legacyKey); });
      Object.keys(slots).forEach(function (slot) { window._lsRemove('lineage_idle_save_' + slot + '_auto_bak_meta'); });
    });
  }
  api.autoBackupList = function (slot) {
    slot = Math.max(1, Math.floor(Number(slot) || 1));
    return (backupCache[slot] || []).map(function (rec) {
      return { id: rec.id, index: rec.index, at: rec.at, lv: rec.lv, name: rec.name };
    });
  };
  api.queueAutoBackup = function (slot, raw, info, minIntervalMs) {
    slot = Math.max(1, Math.floor(Number(slot) || 1));
    var current = api.autoBackupList(slot), now = Math.max(1, Math.floor(Number(info && info.at) || Date.now()));
    if (current[0] && now - current[0].at < Math.max(0, Number(minIntervalMs) || 0)) return false;
    var rec = cleanBackupRecord({ slot: slot, at: now, lv: info && info.lv, name: info && info.name, raw: raw });
    if (!rec) return false;
    var optimistic = backupMeta(rec, 0);
    backupCache[slot] = [optimistic].concat(backupCache[slot] || []).sort(function (a, b) { return b.at - a.at; }).slice(0, 3)
      .map(function (x, i) { x.index = i + 1; return x; });
    api.backupCount = Object.keys(backupCache).reduce(function (n, key) { return n + backupCache[key].length; }, 0);
    backupChain = backupChain.catch(function () {}).then(function () { return api.ready; }).then(function () { return writeBackup(rec); }).catch(function (e) {
      api.backupLastError = String(e && e.message || e);
      fallbackBackupToLocal(rec);
      setState('degraded', e);
      return db ? loadBackupCache().catch(function () {}) : null;
    });
    return true;
  };
  api.saveAutoBackup = function (slot, raw, info) {
    var rec = cleanBackupRecord({ slot: slot, at: info && info.at, lv: info && info.lv, name: info && info.name, raw: raw });
    if (!rec) return Promise.reject(new Error('Invalid automatic backup'));
    backupChain = backupChain.catch(function () {}).then(function () { return api.ready; }).then(function () { return writeBackup(rec); });
    return backupChain;
  };
  api.getAutoBackup = function (slot, index) {
    return api.ready.then(function () { return backupChain; }).then(function () {
      var list = api.autoBackupList(slot), meta = list[Math.max(1, Math.floor(Number(index) || 1)) - 1];
      if (!meta) return null;
      var tx = db.transaction(BACKUP_STORE, 'readonly'), done = txDone(tx);
      return requestDone(tx.objectStore(BACKUP_STORE).get(meta.id)).then(function (rec) { return done.then(function () { return rec || null; }); });
    });
  };
  api.exportAutoBackups = function () {
    return api.ready.then(function () { return backupChain; }).then(function () {
      if (!db) return [];
      var tx = db.transaction(BACKUP_STORE, 'readonly'), done = txDone(tx);
      return requestDone(tx.objectStore(BACKUP_STORE).getAll()).then(function (rows) { return done.then(function () { return rows; }); });
    });
  };
  api.importAutoBackups = function (records) {
    records = Array.isArray(records) ? records.map(cleanBackupRecord).filter(Boolean) : [];
    backupChain = backupChain.catch(function () {}).then(function () { return api.ready; }).then(function () {
      var tx = db.transaction(BACKUP_STORE, 'readwrite'), done = txDone(tx), store = tx.objectStore(BACKUP_STORE);
      store.clear(); records.forEach(function (rec) { store.put(rec); });
      return done.then(pruneBackups).then(function () { return api.backupCount; });
    });
    return backupChain;
  };

  api.exportPrimaryRecords = function () {
    return api.ready.then(function () { return flushQueued(); }).then(function () {
      if (!db) return [];
      return readPrimaryRecords().then(function (rows) {
        return rows.filter(function (rec) { return rec && rec.deleted !== true; }).map(function (rec) {
          return { key: rec.key, value: rec.value, rev: rec.rev, updatedAt: rec.updatedAt };
        });
      });
    });
  };
  api.importPrimaryRecords = function (records) {
    records = Array.isArray(records) ? records.filter(function (rec) {
      return rec && primaryKey(rec.key) && typeof rec.value === 'string' && rec.deleted !== true;
    }).map(function (rec) {
      var key = String(rec.key), rev = Math.max(Number(primaryRevisions[key]) || 0, Number(rec.rev) || 0);
      if (!rev) rev = nextPrimaryRevision(key);
      return { key: key, value: rec.value, rev: rev, updatedAt: Math.max(1, Number(rec.updatedAt) || Date.now()), deleted: false };
    }) : [];
    try { nativeSet(PRIMARY_RESET_KEY, '1'); } catch (e) {}
    var incoming = Object.create(null);
    records.forEach(function (rec) { incoming[String(rec.key)] = rec; });
    localPrimaryRows().forEach(function (rec) {
      if (!incoming[rec.key]) nativeRemove(rec.key);
    });
    records.forEach(function (rec) {
      if (nativeSet(rec.key, rec.value) === false) throw new Error('localStorage compatibility cache import failed');
      primaryRevisions[rec.key] = Math.max(Number(primaryRevisions[rec.key]) || 0, Number(rec.rev) || 0, 1);
    });
    savePrimaryRevisions();
    return replacePrimaryRecords(records);
  };
  api.replacePrimaryFromLocal = function () {
    try { nativeSet(PRIMARY_RESET_KEY, '1'); } catch (e) {}
    return rebuildPrimaryFromLocal();
  };

  api.audit = function () {
    if (!db) return Promise.resolve({ ok: false, state: api.state });
    return flushQueued().then(function () { return readPrimaryRecords(); }).then(function (dbRows) {
      var local = Object.create(null), active = dbRows.filter(function (rec) { return rec && rec.deleted !== true; });
      localPrimaryRows().forEach(function (rec) { local[rec.key] = rec.value; });
      var primaryOk = active.length === Object.keys(local).length && active.every(function (rec) { return local[rec.key] === rec.value; });
      return { ok: primaryOk, primaryOk: primaryOk, primaryCount: active.length, journalCount: api.journalCount };
    })
      .catch(function (e) { return { ok: false, error: String(e && e.message || e) }; });
  };
  api.flush = function () {
    return api.ready.then(function () { return flushQueued(); }).then(function () { return api.getStatus(); });
  };

  api.ready = openDatabase().then(function (opened) {
    db = opened;
    db.onversionchange = function () { try { db.close(); } catch (e) {} setState('blocked', 'Database version changed'); };
    setState('migrating');
    return migrateLegacyBackups().then(function () {
      return reconcilePrimary();
    }).then(function () {
      return markOptimized();
    }).then(function () {
      migrating = false;
      api.authoritative = 'IndexedDB(primary)+localStorage(sync-cache)';
      setState('ready');
      return flushQueued();
    }).then(function () { return api.getStatus(); });
  }).catch(function (e) {
    migrating = false;
    setState('failed', e);
    return api.getStatus();
  });

  function flushOnHide() { if (document.visibilityState === 'hidden') flushQueued(); }
  document.addEventListener('visibilitychange', flushOnHide);
  window.addEventListener('pagehide', flushQueued);
})();
