/* ============================================================================
 * IndexedDB phase 2: verified shadow copy + primary automatic backups
 *
 * localStorage remains the authoritative source for the main game state.
 * Every core _lsSet/_lsRemove write is mirrored to IndexedDB after the
 * synchronous localStorage operation succeeds. On startup, one atomic
 * transaction replaces the shadow with a snapshot of localStorage, followed by
 * an exact read-back verification. Any IndexedDB error is isolated: the legacy
 * save path and its synchronous success/failure contract remain unchanged.
 * Rotating automatic backups are the first data family promoted to IndexedDB;
 * legacy localStorage backup generations are migrated only after a successful
 * database transaction and remain covered by the full portable backup format.
 * ========================================================================== */
(function () {
  'use strict';

  var api = {
    phase: 'hybrid-backups', state: 'opening', authoritative: 'localStorage',
    keyCount: 0, verifiedAt: 0, lastError: '', pending: 0, writes: 0,
    backupCount: 0, backupLastError: ''
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
      backupCount: api.backupCount, backupLastError: api.backupLastError
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
  var DB_VERSION = 2;
  var KV_STORE = 'kv';
  var META_STORE = 'meta';
  var BACKUP_STORE = 'autoBackups';
  var db = null;
  var migrating = true;
  var queued = [];
  var flushTimer = 0;
  var flushChain = Promise.resolve();
  var nativeSet = window._lsSet;
  var nativeRemove = window._lsRemove;
  var backupCache = Object.create(null);
  var backupChain = Promise.resolve();

  function localSnapshot() {
    var rows = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key == null) continue;
        var value = localStorage.getItem(key);
        if (value != null) rows.push([key, value]);
      }
    } catch (e) {}
    rows.sort(function (a, b) { return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0); });
    return rows;
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
        if (!upgradeDb.objectStoreNames.contains(KV_STORE)) upgradeDb.createObjectStore(KV_STORE);
        if (!upgradeDb.objectStoreNames.contains(META_STORE)) upgradeDb.createObjectStore(META_STORE);
        if (!upgradeDb.objectStoreNames.contains(BACKUP_STORE)) {
          var backups = upgradeDb.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
          backups.createIndex('slot', 'slot', { unique: false });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('IndexedDB open failed')); };
      req.onblocked = function () { setState('blocked', 'IndexedDB upgrade blocked by another tab'); };
    });
  }

  function queueOp(type, key, value) {
    queued.push({ type: type, key: String(key), value: value });
    api.pending = queued.length;
    if (!migrating && db && !flushTimer) {
      flushTimer = setTimeout(function () { flushTimer = 0; flushQueued(); }, 0);
    }
  }
  // Preserve the old synchronous contract. A failed localStorage write is never
  // reported as successful merely because the shadow database may accept it.
  window._lsSet = function (key, value) {
    var ok = nativeSet(key, value);
    if (ok) queueOp('put', key, value);
    return ok;
  };
  window._lsRemove = function (key) {
    nativeRemove(key);
    queueOp('delete', key);
  };

  function flushBatch(batch) {
    if (!db || !batch.length) return Promise.resolve();
    var latest = Object.create(null), order = [];
    batch.forEach(function (op) {
      if (!Object.prototype.hasOwnProperty.call(latest, op.key)) order.push(op.key);
      latest[op.key] = op;
    });
    var tx = db.transaction(KV_STORE, 'readwrite');
    var done = txDone(tx);
    var store = tx.objectStore(KV_STORE);
    order.forEach(function (key) {
      var op = latest[key];
      if (op.type === 'delete') store.delete(key);
      else store.put(op.value, key);
    });
    return done.then(function () {
      api.writes += order.length;
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

  function replaceShadow(rows) {
    var tx = db.transaction([KV_STORE, META_STORE], 'readwrite');
    var done = txDone(tx);
    var kv = tx.objectStore(KV_STORE);
    kv.clear();
    rows.forEach(function (row) { kv.put(row[1], row[0]); });
    tx.objectStore(META_STORE).put({
      phase: 2, authoritative: 'localStorage+IndexedDB(autoBackups)', state: 'copied',
      keyCount: rows.length, copiedAt: Date.now()
    }, 'migration');
    return done;
  }
  function verifyRows(rows) {
    var tx = db.transaction(KV_STORE, 'readonly');
    var done = txDone(tx);
    var store = tx.objectStore(KV_STORE);
    var checks = [requestDone(store.count())];
    rows.forEach(function (row) {
      checks.push(requestDone(store.get(row[0])).then(function (value) { return value === row[1]; }));
    });
    return Promise.all(checks).then(function (results) {
      var matches = results[0] === rows.length;
      for (var i = 1; matches && i < results.length; i++) if (!results[i]) matches = false;
      return done.then(function () { return matches; });
    }, function (err) {
      // Observe the transaction rejection as well, avoiding an unhandled promise
      // while still preserving the more specific request error for diagnostics.
      return done.catch(function () {}).then(function () { throw err; });
    });
  }
  function markVerified(count) {
    var now = Date.now();
    var tx = db.transaction(META_STORE, 'readwrite');
    var done = txDone(tx);
    tx.objectStore(META_STORE).put({
      phase: 2, authoritative: 'localStorage+IndexedDB(autoBackups)', state: 'verified',
      keyCount: count, verifiedAt: now
    }, 'migration');
    return done.then(function () {
      api.keyCount = count;
      api.verifiedAt = now;
    });
  }

  // ── Phase 2: rotating automatic backups live primarily in IndexedDB. ──
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

  api.audit = function () {
    if (!db) return Promise.resolve({ ok: false, state: api.state });
    var rows = localSnapshot();
    return verifyRows(rows).then(function (ok) { return { ok: ok, keyCount: rows.length }; })
      .catch(function (e) { return { ok: false, error: String(e && e.message || e) }; });
  };
  api.flush = function () {
    return api.ready.then(function () { return flushQueued(); }).then(function () { return api.getStatus(); });
  };

  api.ready = openDatabase().then(function (opened) {
    db = opened;
    db.onversionchange = function () { try { db.close(); } catch (e) {} setState('blocked', 'Database version changed'); };
    setState('migrating');
    var rows = localSnapshot();
    return replaceShadow(rows).then(function () { return verifyRows(rows); }).then(function (ok) {
      if (!ok) throw new Error('IndexedDB shadow verification mismatch');
      return markVerified(rows.length);
    }).then(function () {
      return migrateLegacyBackups();
    }).then(function () {
      migrating = false;
      api.authoritative = 'localStorage+IndexedDB(autoBackups)';
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
