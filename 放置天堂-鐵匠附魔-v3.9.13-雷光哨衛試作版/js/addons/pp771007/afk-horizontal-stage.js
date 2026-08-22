/**
 * afk-horizontal-stage.js — 2.5D 橫向戰鬥舞台試驗
 *
 * 第一階段刻意只改畫面：戰鬥 tick、攻擊距離、怪物生成、掉落、存檔全部沿用核心。
 * 目前只套 talking_island；遇到頭目／離開地圖立即退回經典舞台。
 */
(function () {
  'use strict';

  var ID = 'hstage';
  var TEST_MAP = 'talking_island';
  var step = 0;
  var lastStageOn = null;
  var lastBgX = '';
  var lastGroundX = '';
  var syncQueued = false;

  if (window.AFK_TOGGLES) {
    AFK_TOGGLES.register({
      id: ID,
      name: '橫向戰鬥舞台（試驗）',
      desc: '只在說話之島周邊改用 2.5D 橫向列隊與輕微清場捲動；純視覺，不影響戰鬥數值',
      group: '遊戲介面',
      def: false
    });
    if (!AFK_TOGGLES.enabled(ID)) return;
  }

  function stageAllowed() {
    if (typeof mapState === 'undefined' || !mapState || mapState.current !== TEST_MAP) return false;
    var mobs = mapState.mobs || [];
    for (var i = 0; i < mobs.length; i++) if (mobs[i] && mobs[i].boss) return false;
    return true;
  }

  function ensureBadge(bv) {
    var badge = document.getElementById('afk-hstage-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'afk-hstage-badge';
      badge.textContent = '橫向舞台・試驗';
      badge.title = '純視覺演出，不影響攻擊、掉落與掛機效率';
      bv.appendChild(badge);
    } else if (badge.parentNode !== bv) {
      bv.appendChild(badge);
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
    if (on) {
      ensureBadge(bv);
      // 十二步往返：避免原本每七次擊殺由最右瞬間跳回最左。
      var phase = step % 12;
      var drift = phase <= 6 ? phase : (12 - phase);
      var bgX = (48 + drift * 0.55).toFixed(2) + '%';
      var groundX = (-step * 22) + 'px';
      if (bgX !== lastBgX) { bv.style.setProperty('--afk-hstage-bg-x', bgX); lastBgX = bgX; }
      if (groundX !== lastGroundX) { bv.style.setProperty('--afk-hstage-ground-x', groundX); lastGroundX = groundX; }
    }
  }

  function queueStageSync() {
    if (syncQueued) return;
    syncQueued = true;
    var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
    raf(function () { syncQueued = false; syncStage(); });
  }

  function advanceStage() {
    if (!stageAllowed()) return;
    step += 1;
    if (step > 1000000) step = 0;   // 極長掛機保險；正常遊玩不會遇到重置點
    syncStage();
  }

  var css = document.createElement('style');
  css.id = 'afk-horizontal-stage-css';
  css.textContent = [
    '/* 橫向舞台只在 JS 套上 .afk-hstage 時生效；移除 class 即完整回到核心版面。 */',
    '#battle-view.afk-hstage{isolation:isolate;background-size:124% auto!important;background-position:var(--afk-hstage-bg-x,48%) 46%!important;transition:background-position 1.05s ease-out;}',
    '#battle-view.afk-hstage::before{content:"";position:absolute;left:-4%;right:-4%;bottom:0;height:78px;z-index:1;pointer-events:none;background-position:var(--afk-hstage-ground-x,0) 0;background-image:repeating-linear-gradient(105deg,transparent 0 24px,rgba(33,24,16,.22) 25px 30px),linear-gradient(to bottom,rgba(94,142,48,.98) 0 9px,rgba(48,83,35,.98) 10px 18px,rgba(92,67,42,.98) 19px 100%);box-shadow:0 -3px 8px rgba(20,35,17,.62),inset 0 10px 12px rgba(255,255,255,.07);transition:background-position 1.05s ease-out;}',
    '#battle-view.afk-hstage::after{content:"";position:absolute;left:0;right:0;bottom:42px;height:22px;z-index:9;pointer-events:none;opacity:.82;background:repeating-linear-gradient(78deg,transparent 0 14px,rgba(139,181,70,.75) 15px 17px,transparent 18px 29px);filter:drop-shadow(0 2px 1px rgba(14,35,12,.8));}',
    '#battle-view.afk-hstage #mob-list{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;z-index:4!important;pointer-events:none!important;}',
    '#battle-view.afk-hstage #mob-list>.mob-target{position:absolute!important;bottom:24px!important;width:10.5%!important;min-width:64px!important;max-width:88px!important;height:205px!important;z-index:4!important;pointer-events:none!important;transform:translateX(-50%)!important;overflow:visible!important;}',
    '#battle-view.afk-hstage #mob-list>.mob-target[data-uid]{pointer-events:auto!important;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(1){left:50%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(2){left:60.5%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(3){left:71%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(4){left:81.5%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target:nth-child(5){left:92%;}',
    '#battle-view.afk-hstage #mob-list>.mob-target .mob-img-wrap{flex:1 1 auto!important;min-height:0!important;overflow:visible!important;}',
    '#battle-view.afk-hstage #mob-list>.mob-target .mob-img-inner{transform:none!important;transform-origin:bottom center!important;}',
    '#battle-view.afk-hstage #player-morph-sprite,#battle-view.afk-hstage .party-sprite{bottom:52px!important;}',
    '#battle-view.afk-hstage #pet-layer{bottom:42px!important;height:auto!important;}',
    '#battle-view.afk-hstage #status-icon-bar{position:relative;z-index:40;}',
    '#afk-hstage-badge{display:none;position:absolute;right:8px;top:8px;z-index:60;pointer-events:none;padding:3px 8px;border:1px solid rgba(253,230,138,.7);border-radius:999px;background:rgba(15,23,42,.78);color:#fef3c7;font-size:11px;font-weight:800;letter-spacing:.04em;text-shadow:0 1px 2px #000;box-shadow:0 2px 7px rgba(0,0,0,.4);}',
    '#battle-view.afk-hstage>#afk-hstage-badge{display:block;}',
    '@media(max-width:768px){#battle-view.afk-hstage #mob-list>.mob-target{width:11%!important;min-width:0!important;max-width:52px!important;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(1){left:46%;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(2){left:58%;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(3){left:70%;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(4){left:82%;}#battle-view.afk-hstage #mob-list>.mob-target:nth-child(5){left:94%;}#afk-hstage-badge{font-size:10px;right:5px;top:5px;}#battle-view.afk-hstage::before{height:70px;}}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(css);

  // 把玩家與傭兵固定在舞台左側；離開試驗地圖後透明放行原版站位。
  if (typeof window._partySpritePos === 'function') {
    var originalPartySpritePos = window._partySpritePos;
    window._partySpritePos = function () {
      if (!stageAllowed()) return originalPartySpritePos.apply(this, arguments);
      return {
        P: { x: '27%', b: 52 },
        A: [
          { x: '15%', b: 52 }, { x: '36%', b: 52 }, { x: '8%', b: 70 },
          { x: '21%', b: 70 }, { x: '33%', b: 70 }, { x: '43%', b: 70 }, { x: '4%', b: 52 }
        ]
      };
    };
  }

  // 核心每次換圖都會套背景；在它完成後同步試驗 class，不改原函式結果。
  if (typeof window.applyAreaBackground === 'function') {
    var originalApplyAreaBackground = window.applyAreaBackground;
    window.applyAreaBackground = function () {
      var out = originalApplyAreaBackground.apply(this, arguments);
      syncStage();
      return out;
    };
  }

  // 每次擊殺只推進少量背景／地面，作為「繼續向右」的視覺提示；戰利品與數值照核心先完整結算。
  if (typeof window.killMob === 'function') {
    var originalKillMob = window.killMob;
    window.killMob = function () {
      var wasStage = stageAllowed();
      var out = originalKillMob.apply(this, arguments);
      if (wasStage) advanceStage();
      return out;
    };
  }

  // 頭目可能在不換圖的情況下生成；觀察怪物列即可即時退回／恢復試驗舞台。
  function observeBattle() {
    var list = document.getElementById('mob-list');
    if (!list || list._afkHstageObserved) return false;
    list._afkHstageObserved = true;
    new MutationObserver(queueStageSync).observe(list, { childList: true, subtree: false });
    syncStage();
    return true;
  }

  if (!observeBattle()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observeBattle, { once: true });
    else setTimeout(observeBattle, 0);
  }
  try { console.log('[AFK-hstage] ready — talking_island visual prototype'); } catch (e) {}
})();
