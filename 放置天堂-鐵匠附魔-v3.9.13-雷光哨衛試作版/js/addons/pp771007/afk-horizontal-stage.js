/**
 * afk-horizontal-stage.js — 手機友善橫向戰鬥舞台
 *
 * 目標：把現有自動戰鬥呈現成「橫向闖關 RPG」：玩家固定左側、敵人從右側列隊、
 * 背景與地面產生視差，並提供手機觸控的左右／跳躍視覺操作。
 * 核心戰鬥、掉落、存檔、數值完全沿用原系統，不重寫核心。
 */
(function () {
  'use strict';

  var ID = 'hstage';
  var step = 0;
  var playerOffset = 0;
  var jumpUntil = 0;
  var lastStageOn = null;
  var lastBgX = '';
  var lastGroundX = '';
  var syncQueued = false;

  if (window.AFK_TOGGLES) {
    AFK_TOGGLES.register({
      id: ID,
      name: '橫向戰鬥舞台',
      desc: '手機／桌機皆可用的橫向 RPG 戰鬥視圖；核心戰鬥與數值不變',
      group: '遊戲介面',
      def: true
    });
    if (!AFK_TOGGLES.enabled(ID)) return;
  }

  function stageAllowed() {
    if (typeof mapState === 'undefined' || !mapState || !mapState.current) return false;
    var mobs = mapState.mobs || [];
    for (var i = 0; i < mobs.length; i++) {
      if (mobs[i] && mobs[i].boss) return false;
    }
    return true;
  }

  function ensureBadge(bv) {
    var badge = document.getElementById('afk-hstage-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'afk-hstage-badge';
      badge.innerHTML = '<span>橫向冒險</span><small>自動戰鬥</small>';
      badge.title = '橫向呈現；戰鬥數值沿用原系統';
      bv.appendChild(badge);
    } else if (badge.parentNode !== bv) {
      bv.appendChild(badge);
    }
  }

  function ensureHud(bv) {
    var hud = document.getElementById('afk-hstage-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'afk-hstage-hud';
      hud.innerHTML =
        '<div class="hstage-quest">▶ 前進中</div>' +
        '<div class="hstage-controls" aria-label="橫向舞台操作">" +
          '<button type="button" data-hs="left" aria-label="向左">◀</button>' +
          '<button type="button" data-hs="jump" aria-label="跳躍">▲</button>' +
          '<button type="button" data-hs="right" aria-label="向右">▶</button>' +
        '</div>';
      bv.appendChild(hud);

      hud.addEventListener('pointerdown', function (ev) {
        var btn = ev.target.closest('[data-hs]');
        if (!btn) return;
        ev.preventDefault();
        var action = btn.getAttribute('data-hs');
        if (action === 'left') playerOffset = Math.max(-7, playerOffset - 1);
        if (action === 'right') playerOffset = Math.min(7, playerOffset + 1);
        if (action === 'jump') jumpUntil = Date.now() + 420;
        syncStage();
      }, { passive: false });
    }
  }

  function syncStage() {
    var bv = document.getElementById('battle-view');
    if (!bv) return;
    var on = stageAllowed();
    if (lastStageOn !== on) {
      bv.classList.toggle('afk-hstage', on);
      lastStageOn = on;
    }
    if (!on) return;

    ensureBadge(bv);
    ensureHud(bv);

    var phase = step % 20;
    var drift = phase <= 10 ? phase : 20 - phase;
    var bgX = (46 + drift * 0.7).toFixed(2) + '%';
    var groundX = (-step * 28) + 'px';
    if (bgX !== lastBgX) {
      bv.style.setProperty('--afk-hstage-bg-x', bgX);
      lastBgX = bgX;
    }
    if (groundX !== lastGroundX) {
      bv.style.setProperty('--afk-hstage-ground-x', groundX);
      lastGroundX = groundX;
    }

    bv.style.setProperty('--afk-hstage-player-x', 'calc(26% + ' + playerOffset + '%)');
    bv.classList.toggle('afk-hstage-jumping', Date.now() < jumpUntil);
  }

  function queueStageSync() {
    if (syncQueued) return;
    syncQueued = true;
    var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
    raf(function () {
      syncQueued = false;
      syncStage();
    });
  }

  function advanceStage() {
    if (!stageAllowed()) return;
    step += 1;
    if (step > 1000000) step = 0;
    syncStage();
  }

  var css = document.createElement('style');
  css.id = 'afk-horizontal-stage-css';
  css.textContent = [
    '#battle-view.afk-hstage{isolation:isolate;overflow:hidden!important;background-size:140% auto!important;background-position:var(--afk-hstage-bg-x,46%) 42%!important;transition:background-position .8s ease-out;touch-action:none;}',
    '#battle-view.afk-hstage::before{content:"";position:absolute;left:-8%;right:-8%;bottom:0;height:82px;z-index:1;pointer-events:none;background-position:var(--afk-hstage-ground-x,0) 0;background-image:repeating-linear-gradient(105deg,transparent 0 22px,rgba(33,24,16,.24) 23px 29px),linear-gradient(to bottom,rgba(106,151,55,.98) 0 9px,rgba(47,86,34,.98) 10px 18px,rgba(93,68,43,.98) 19px 100%);box-shadow:0 -4px 12px rgba(20,35,17,.64),inset 0 10px 12px rgba(255,255,255,.08);transition:background-position .8s ease-out;}',
    '#battle-view.afk-hstage::after{content:"";position:absolute;left:0;right:0;bottom:45px;height:24px;z-index:9;pointer-events:none;opacity:.82;background:repeating-linear-gradient(78deg,transparent 0 13px,rgba(157,194,82,.78) 14px 17px,transparent 18px 29px);filter:drop-shadow(0 2px 1px rgba(14,35,12,.8));}',
    '#battle-view.afk-hstage #mob-list{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;z-index:4!important;pointer-events:none!important;}',
    '#battle-view.afk-hstage #mob-list>.mob-target{position:absolute!important;bottom:24px!important;width:10.5%!important;min-width:64px!important;max-width:92px!important;height:205px!important;z-index:4!important;pointer-events:none!important;transform:translateX(-50%)!important;overflow:visible!important;}',
    '#battle-view.afk-hstage #mob-list>.mob-target[data-uid]{pointer-events:auto!important;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(1){left:52%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(2){left:63%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(3){left:74%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(4){left:85%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(5){left:96%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target .mob-img-wrap{flex:1 1 auto!important;min-height:0!important;overflow:visible!important;}',
    '#battle-view.afk-hstage #mob-list>.mob-target .mob-img-inner{transform:none!important;transform-origin:bottom center!important;}',
    '#battle-view.afk-hstage #player-morph-sprite,#battle-view.afk-hstage .party-sprite{bottom:52px!important;left:var(--afk-hstage-player-x,26%)!important;transition:left .16s ease,transform .16s ease;z-index:7!important;}',
    '#battle-view.afk-hstage-jumping #player-morph-sprite,#battle-view.afk-hstage-jumping .party-sprite{transform:translateY(-28px)!important;}',
    '#battle-view.afk-hstage #pet-layer{bottom:42px!important;height:auto!important;}',
    '#battle-view.afk-hstage #status-icon-bar{position:relative;z-index:40;}',
    '#afk-hstage-badge{position:absolute;right:8px;top:8px;z-index:60;pointer-events:none;padding:5px 9px;border:1px solid rgba(253,230,138,.72);border-radius:10px;background:rgba(15,23,42,.82);color:#fef3c7;font-size:11px;font-weight:800;letter-spacing:.04em;text-shadow:0 1px 2px #000;box-shadow:0 2px 8px rgba(0,0,0,.42);}',
    '#afk-hstage-badge small{display:block;margin-top:1px;font-size:9px;font-weight:600;opacity:.72;text-align:right;}',
    '#afk-hstage-hud{position:absolute;left:0;right:0;bottom:4px;z-index:80;display:flex;align-items:flex-end;justify-content:space-between;padding:0 8px;pointer-events:none;}',
    '.hstage-quest{padding:5px 9px;border-radius:9px;background:rgba(8,15,28,.72);border:1px solid rgba(255,255,255,.16);color:#f8fafc;font-size:11px;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,.35);}',
    '.hstage-controls{display:flex;gap:6px;pointer-events:auto;}',
    '.hstage-controls button{width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.24);background:rgba(15,23,42,.82);color:#fff;font-size:18px;font-weight:900;box-shadow:0 3px 9px rgba(0,0,0,.38);-webkit-tap-highlight-color:transparent;touch-action:none;}',
    '.hstage-controls button:active{transform:translateY(1px) scale(.96);background:rgba(51,65,85,.95);}',
    '@media(max-width:768px){#battle-view.afk-hstage #mob-list>.mob-target{width:11%!important;min-width:0!important;max-width:56px!important;height:170px!important;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(1){left:50%;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(2){left:62%;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(3){left:74%;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(4){left:86%;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(5){left:98%;}#afk-hstage-badge{right:5px;top:5px;font-size:10px;}#battle-view.afk-hstage::before{height:70px;}.hstage-quest{font-size:10px;padding:4px 7px;}.hstage-controls button{width:39px;height:39px;font-size:16px;}}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(css);

  if (typeof window._partySpritePos === 'function') {
    var originalPartySpritePos = window._partySpritePos;
    window._partySpritePos = function () {
      if (!stageAllowed()) return originalPartySpritePos.apply(this, arguments);
      return {
        P: { x: '26%', b: 52 },
        A: [
          { x: '14%', b: 52 }, { x: '35%', b: 52 }, { x: '8%', b: 70 },
          { x: '20%', b: 70 }, { x: '32%', b: 70 }, { x: '42%', b: 70 }, { x: '4%', b: 52 }
        ]
      };
    };
  }

  if (typeof window.applyAreaBackground === 'function') {
    var originalApplyAreaBackground = window.applyAreaBackground;
    window.applyAreaBackground = function () {
      var out = originalApplyAreaBackground.apply(this, arguments);
      syncStage();
      return out;
    };
  }

  if (typeof window.killMob === 'function') {
    var originalKillMob = window.killMob;
    window.killMob = function () {
      var wasStage = stageAllowed();
      var out = originalKillMob.apply(this, arguments);
      if (wasStage) advanceStage();
      return out;
    };
  }

  function observeBattle() {
    var list = document.getElementById('mob-list');
    if (!list || list._afkHstageObserved) return false;
    list._afkHstageObserved = true;
    new MutationObserver(queueStageSync).observe(list, { childList: true, subtree: false });
    syncStage();
    return true;
  }

  window.addEventListener('resize', queueStageSync, { passive: true });
  window.addEventListener('orientationchange', function () { setTimeout(queueStageSync, 80); }, { passive: true });
  document.addEventListener('visibilitychange', queueStageSync, { passive: true });

  if (!observeBattle()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observeBattle, { once: true });
    else setTimeout(observeBattle, 0);
  }
  setInterval(function () {
    if (stageAllowed()) syncStage();
  }, 180);

  try { console.log('[AFK-hstage] mobile horizontal battle stage ready'); } catch (e) {}
})();