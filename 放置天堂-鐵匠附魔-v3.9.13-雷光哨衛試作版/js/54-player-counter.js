// ===== ★ 累積冒險者人數（GitHub Pages 靜態站） =====
// 首次成功登記後以 localStorage 記住本裝置；後續載入只讀總數，不重複增加。
// CounterAPI 的 unique 過濾同時降低首次開多分頁造成的重複計數；連線失敗不影響遊戲。
(function () {
    'use strict';
    const DEVICE_MARK_KEY = 'lineage_unique_player_counted_v1';
    const COUNTER_URL = 'https://counterapi.com/api/jack353011-pixel.github.io/device-player/melody353688-v1';

    function deviceWasCounted() {
        try { return localStorage.getItem(DEVICE_MARK_KEY) === '1'; }
        catch (e) { return false; }
    }

    function rememberDevice() {
        try { localStorage.setItem(DEVICE_MARK_KEY, '1'); }
        catch (e) { /* 隱私模式可能禁止 localStorage；交由伺服器 unique 過濾。 */ }
    }

    function showCount(value) {
        const badge = document.getElementById('player-count-badge');
        const text = document.getElementById('player-count-text');
        if (!badge || !text) return;
        text.textContent = `累積冒險者：${value.toLocaleString('zh-TW')} 人`;
        badge.classList.remove('player-count-error');
        badge.classList.add('player-count-ready');
        badge.setAttribute('aria-label', `累積冒險者 ${value} 人`);
    }

    function showUnavailable() {
        const badge = document.getElementById('player-count-badge');
        const text = document.getElementById('player-count-text');
        if (!badge || !text) return;
        text.textContent = '累積冒險者：暫時無法取得';
        badge.classList.remove('player-count-ready');
        badge.classList.add('player-count-error');
    }

    async function loadPlayerCount() {
        const counted = deviceWasCounted();
        const query = counted ? '?readOnly=true' : '?unique=true';
        try {
            const response = await fetch(COUNTER_URL + query, { cache: 'no-store' });
            if (!response.ok) throw new Error(`player counter HTTP ${response.status}`);
            const result = await response.json();
            const value = Number(result && result.value);
            if (!Number.isFinite(value) || value < 0) throw new Error('invalid player counter value');
            if (!counted) rememberDevice();
            showCount(Math.floor(value));
        } catch (e) {
            showUnavailable();
            if (typeof console !== 'undefined' && console.warn) console.warn('[player-counter]', e);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadPlayerCount, { once: true });
    else loadPlayerCount();
})();
