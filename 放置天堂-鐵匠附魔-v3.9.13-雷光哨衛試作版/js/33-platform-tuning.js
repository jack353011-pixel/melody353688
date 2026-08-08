// ===== 平台設定：效能、流量、手機快速導覽、平衡工具 UI =====
(function () {
    const KEY = 'idle_lineage_platform_v1';
    const defaults = { lowPower: false, lowData: false };
    let cfg = Object.assign({}, defaults);
    try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
        apply();
    }
    function apply() {
        document.documentElement.classList.toggle('low-power-mode', !!cfg.lowPower);
        document.documentElement.classList.toggle('low-data-mode', !!cfg.lowData);
        syncPlatformTuningUI();
    }
    window.setLowPowerMode = function (on) { cfg.lowPower = !!on; save(); };
    window.setLowDataMode = function (on) { cfg.lowData = !!on; save(); };
    window.syncPlatformTuningUI = function () {
        let lp = document.getElementById('set-low-power'); if (lp) lp.checked = !!cfg.lowPower;
        let ld = document.getElementById('set-low-data'); if (ld) ld.checked = !!cfg.lowData;
        ['exp', 'gold', 'drop'].forEach(k => {
            let out=document.getElementById('balance-'+k+'-value');
            if(out) {
                let value=typeof balanceMult==='function'?balanceMult(k):(k==='exp'?1:.5);
                out.textContent=Number(value).toFixed(2)+'×';
            }
        });
    };
    window.mobileJumpTo = function (id) {
        let el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: cfg.lowPower ? 'auto' : 'smooth', block: 'start' });
    };
    document.addEventListener('DOMContentLoaded', apply);
    if (document.readyState !== 'loading') apply();
})();
