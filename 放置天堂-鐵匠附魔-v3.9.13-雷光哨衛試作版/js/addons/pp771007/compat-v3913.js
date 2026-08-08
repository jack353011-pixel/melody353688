/*
 * pp771007 外掛層與本專案 v3.9.13 的相容性標記。
 *
 * 本專案已經有獨立的手機版、NPC 清單、D2R 裝備技能、符文組與新存檔欄位。
 * 尚未完成資料遷移測試的外掛先鎖定，避免玩家誤以為開關已生效，或讓舊版 wrapper
 * 改寫目前的存檔。鎖定項目仍會列在外掛面板，方便看到後續整合進度。
 */
(function () {
    'use strict';
    if (!window.AFK_TOGGLES) return;

    var locks = {
        mobile: '目前版本已內建手機版面與底部導覽，不再重複載入舊版手機殼。',
        npclist: '目前版本已內建手機 NPC 單欄清單。',
        history: '目前版本已啟用原生離線結算，但此外掛讀取舊版紀錄格式；完成資料轉接前先停用。',
        traditional: '會改變全部裝備掉落強化值，需先與目前詞綴、洞數及符文組規則合併。',
        pwa: '目前測試網址會變動；待改成固定網址後再啟用離線 App 快取。',
        reissueid: '會不可逆改寫全部角色身分，安全審核完成前不開放。',
        skin: '目前版本不顯示非官方轉載橫幅與宣傳資訊。'
    };

    AFK_TOGGLES.list().forEach(function (spec) {
        if (locks[spec.id]) spec.locked = locks[spec.id];
        // 保留目前的圖形裝備視窗；需要條列式時可由玩家主動開啟。
        if (spec.id === 'eqlist') spec.def = false;
    });

    window.IDLE_ADDON_COMPAT = {
        source: 'https://github.com/pp771007/idle-lineage-class',
        sourceCommit: '2f5c9df4b8fe23416fe6790e5e3a103e022a94a9',
        targetVersion: 'v3.9.13',
        locked: Object.assign({}, locks)
    };
})();
