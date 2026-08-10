/* ============================================================================
 * IndexedDB phase 1: verified shadow copy
 *
 * localStorage remains the only authoritative web save source in this phase.
 * Every core _lsSet/_lsRemove write is mirrored to IndexedDB after the
 * synchronous localStorage operation succeeds. On startup, one atomic
 * transaction replaces the shadow with a snapshot of localStorage, followed by
 * an exact read-back verification. Any IndexedDB error is isolated: the legacy
 * save path and its synchronous success/failure contract remain unchanged.
 * ========================================================================== */
(function () {
  'use strict';

  var api = {
    phase: 'shadow', state: 'opening', authoritative: 'localStorage',
    keyCount: 0, verifiedAt: 0, lastError: '', pending: 0, writes: 0
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
      lastError: api.lastError, pending: api.pending, writes: api.writes
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
  var DB_VERSION = 1;
  var KV_STORE = 'kv';
  var META_STORE = 'meta';
  var db = null;
  var migrating = true;
  var queued = [];
  var flushTimer = 0;
  var flushChain = Promise.resolve();
  var nativeSet = window._lsSet;
  var nativeRemove = window._lsRemove;

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
      phase: 1, authoritative: 'localStorage', state: 'copied',
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
      phase: 1, authoritative: 'localStorage', state: 'verified',
      keyCount: count, verifiedAt: now
    }, 'migration');
    return done.then(function () {
      api.keyCount = count;
      api.verifiedAt = now;
    });
  }

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
      migrating = false;
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
