// 世界殘響：內容與取得點依《世界觀.pdf》配置，讓地點、人物、頭目與物品彼此交叉作證。
(function () {
    const LORE_VERSION = 'aden-world-pdf-1';
    const ITEM_FRAGMENTS = Object.freeze({
        item_olin_diary: {
            no: '01', title: '歐林逃亡日記',
            lines: [
                '「巴風特被重新封印後，象牙塔開始追查所有參與者。我只能帶著卷軸往古魯丁地監最深處逃。」',
                '末頁列著七樓的補給價格；歐林把不死族當成屏障，也把冒險者當成唯一的生路。'
            ]
        },
        relic_orin_ring: {
            no: '02', title: '被分開保存的證詞',
            lines: [
                '戒指內圈同時刻著歐林與西瑪的名字，卻被後人刻意磨成兩段。',
                '象牙塔舊名冊將兩人列在同一頁；那一頁的研究題目只有「異界召喚」。'
            ]
        },
        wpn_dk_flameblade: {
            no: '03', title: '被抹去的名號',
            lines: [
                '劍鍔殘留古亞丁王冠的固定孔，王名所在的位置則被熔成一塊焦黑。',
                '這與古魯丁地監裡被鑿掉姓名的墓碑相同：有人不只要他死，還要他從歷史裡消失。'
            ]
        },
        wpn_powerless_baless: {
            no: '04', title: '天才失去魔力之後',
            lines: [
                '杖芯仍留有象牙塔最高階研究室的編號，持有人欄寫著「巴列斯」。',
                '除名理由不是能力不足，而是「拒絕停止惡魔召喚與禁忌黑魔法研究」。'
            ]
        },
        wpn_laia_wand: {
            no: '05', title: '被除名者的魔杖',
            lines: [
                '杖柄嵌著一枚亞丁王室舊勳章，受勳者姓名是冰之女王。',
                '現行名冊找不到這枚勳章，彷彿她從未替王朝出過力。'
            ]
        },
        mat_ice_crystal: {
            no: '06', title: '凍住的代價',
            lines: [
                '結晶裡封著王室使者撕毀文書的倒影。文書被毀的同時，寒氣從洞窟蔓延到整片山區。',
                '冰之女王不是因寒冷而隱居；寒冷是她被除名之後留下的傷口。'
            ]
        },
        item_dragon_egg: {
            no: '07', title: '沒有被殺死的龍',
            lines: [
                '蛋殼上的四道古印分別對應地、水、火、風，排列方式與千年前的封龍陣一致。',
                '王國史稱四龍已被討伐，印記卻只代表封印；龍從未真正死亡。'
            ]
        },
        item_soul_orb: {
            no: '08', title: '象牙塔的兩種結論',
            lines: [
                '靈魂之球與巴列斯魔杖仍會共鳴。現行報告稱這只是殘留魔力，舊報告則稱它是召喚實驗的核心。',
                '兩份報告都蓋著象牙塔印章，差別只在撰寫年代。'
            ]
        }
    });

    const AREA_FRAGMENTS = Object.freeze({
        town_talking: {
            no: '09', title: '宮殿般的流放地', source: '地區・說話之島村莊',
            lines: [
                '島上為公主準備的住處與王宮規格相同，門外的守衛卻把每日訪客逐一送回亞丁。',
                '這裡不像避難所，更像待遇優厚、不能離開的監視居所。'
            ]
        },
        zone_14: {
            no: '10', title: '地監底層的海潮', source: '地區・說話之島地監2樓',
            lines: [
                '最深處牆後傳來規律海潮聲，古代魔法陣的方向則指向古魯丁地監。',
                '吉倫知道入口卻沒有告訴公主；這條路曾讓巴風特的同夥逃往大陸。'
            ]
        },
        town_gludin: {
            no: '11', title: '活下來的名冊', source: '地區・古魯丁村莊',
            lines: [
                '村莊重建名冊反覆出現「全村失聯」「僅數人生還」「重新建村」。',
                '頁角寫著村民的話：「活下來，才有資格談其他事情。」'
            ]
        },
        gludio: {
            no: '12', title: '被血染紅的土地', source: '地區・古魯丁遠古戰場',
            lines: [
                '人類、精靈與半獸人的舊軍牌混在同一層泥土裡，沒有任何一方真正後退。',
                '戰場紀錄說每日死者以千計；雨後的土直到今日仍泛著暗紅。'
            ]
        },
        zone_09: {
            no: '13', title: '四名學徒的除名紀錄', source: '地區・古魯丁地監4樓',
            lines: [
                '卡士柏、巴土瑟、西瑪、馬庫爾原是象牙塔前途最好的高階魔法師。',
                '他們為長生與力量潛入地監，最後被死亡魔力侵蝕，成了死亡騎士的傀儡。'
            ]
        },
        zone_12: {
            no: '14', title: '七樓的貨單', source: '地區・古魯丁地監7樓',
            lines: [
                '貨單同時列著象牙塔卷軸、巴風特研究器具與冒險者補給品，簽名是歐林。',
                '逃亡者把最危險的地監當成藏身處，也靠販售物資繼續活著。'
            ]
        },
        town_aden: {
            no: '15', title: '從未滅亡的王朝', source: '地區・亞丁城鎮',
            lines: [
                '王宮碑文宣稱亞丁王朝千年來從未中斷；舊城基石卻把現王國稱為「繼承古名的新國」。',
                '現亞丁繼承了制度與名義，卻沒有完整繼承古亞丁的血統。'
            ]
        },
        town_elf: {
            no: '16', title: '永遠不該打開的門', source: '地區・妖精森林村莊',
            lines: [
                '精靈女王親定的禁令只允許受承認的森林妖精進入，其他種族與黑妖都被拒於門外。',
                '她參與過千年前的封龍，理由只有一句：「有些錯誤不能再發生。」'
            ]
        },
        town_silver_knight: {
            no: '17', title: '制度的誓詞', source: '地區・銀騎士村莊',
            lines: [
                '受訓騎士的第一條誓詞是服從制度，結訓後便由王國派往各地。',
                '村中教義相信秩序：先維持世界，再慢慢修正錯誤。'
            ]
        },
        town_ivory_tower: {
            no: '18', title: '證據室的兩份年代', source: '地區・象牙塔',
            lines: [
                '千年前政變與二十年前政治鬥爭的卷宗，在人名被遮住後幾乎完全相同。',
                '象牙塔沒有寫下結論，只留下方法：「證據，推理，真相。」'
            ]
        },
        crystal_cave3: {
            no: '19', title: '冰中的王室捐獻簿', source: '地區・水晶洞穴3樓',
            lines: [
                '冰層封著一冊古亞丁捐獻簿，冰之女王曾長年供應封印所需物資。',
                '她的名字被後來墨水覆蓋，但原字在寒氣下重新浮現。'
            ]
        },
        town_heine: {
            no: '20', title: '水龍事件修復碑', source: '地區・海音城鎮',
            lines: [
                '修復碑將災難稱為水龍入侵，舊工匠的背記卻寫著「封印短暫鬆動」。',
                '法利昂並非從遠方到來；牠一直在封印之下。'
            ]
        },
        town_witon: {
            no: '21', title: '守封者的成年禮', source: '地區・威頓村莊',
            lines: [
                '龍騎士自出生便守在火龍封印附近，必須經過試煉並與龍魂共鳴才能離村。',
                '石壁上的教誨寫著：「力量不是恩賜，是代價。」'
            ]
        },
        town_silent: {
            no: '22', title: '十年大戰的界碑', source: '地區・沉默洞穴',
            lines: [
                '黑妖原本出自妖精森林，因理念不同分裂，並在十年大戰敗退至此。',
                '新立界碑寫著：「代償可以被告知，是否承受應由自己選擇。」'
            ]
        },
        town_hyperia: {
            no: '23', title: '二十年前重新出現的島', source: '地區・希培利亞',
            lines: [
                '這座古代島嶼曾隨席琳沉睡與時空裂痕一起消失，二十年前的政治風暴使裂痕短暫重開。',
                '幻術師只提醒來客：看見的不一定是真的，看不見的也不代表不存在。'
            ]
        },
        kent: {
            no: '24', title: '糧倉與軍隊', source: '地區・肯特周邊',
            lines: [
                '肯特的肥沃農地不只養活居民，也決定王國能維持多少軍隊。',
                '因此城塞的糧食帳與兵員帳始終由同一名官員保管。'
            ]
        },
        town_giran: {
            no: '25', title: '萬金城的地下帳', source: '地區・奇岩城鎮',
            lines: [
                '地上帳本記著貿易與稅收，地下帳本記著同一批財富流向未署名的勢力。',
                '奇岩不是政治中心或軍事要塞；財富、慾望與交易本身就是它的權力。'
            ]
        }
    });

    const MOB_FRAGMENTS = Object.freeze({
        '巴風特': {
            no: '26', title: '哈汀召來的異界惡魔', source: '擊敗・巴風特',
            lines: [
                '封印核心留著人類大魔法師哈汀的術式，不屬於亞丁本土的魔物譜系。',
                '巴風特是禁忌召喚實驗的結果；牠的出現與封印，是天堂早期黑魔法悲劇的一部分。'
            ]
        },
        '死亡騎士': {
            no: '27', title: '沒有名字的囚王', source: '擊敗・死亡騎士',
            lines: [
                '焦黑鎧甲下仍有王族禮服碎片，王冠曾被熔毀，墓碑文字也被鑿除。',
                '他沒有真正死去；後世只剩「死亡騎士」這個稱呼，原名則從歷史消失。'
            ]
        },
        '卡士柏': {
            no: '28', title: '高階魔法師的末路', source: '擊敗・卡士柏',
            lines: [
                '殘破法袍仍帶著象牙塔高階資格印，袖口卻縫上死亡騎士的紋章。',
                '卡士柏不是生於地監的不死族，而是為追求長生主動走進來的人。'
            ]
        },
        '西瑪': {
            no: '29', title: '尚未腐爛的學生證', source: '擊敗・西瑪',
            lines: [
                '證件將西瑪列為象牙塔正式高階魔法師，導師評語仍寫著「前途光明」。',
                '死亡魔力侵蝕了靈魂，卻沒能抹去她曾經屬於象牙塔的證明。'
            ]
        },
        '巴列斯': {
            no: '30', title: '越過界線的天才', source: '擊敗・巴列斯',
            lines: [
                '他的術式證明其天賦曾足以與神明匹敵，也證明他明知禁令仍繼續召喚惡魔。',
                '象牙塔失去的不是普通叛徒，而是它有史以來最偉大的天才魔法師。'
            ]
        },
        '冰之女王': {
            no: '31', title: '已經付過的代價', source: '擊敗・冰之女王',
            lines: [
                '她曾為古亞丁王朝出錢出力，後來卻在某次事件後被王室除名。',
                '洞窟裡只剩一句回聲：「你們口中的秩序與真相，我都已經付過代價了。」'
            ]
        },
        '安塔瑞斯': {
            no: '32', title: '地龍封印', source: '擊敗・安塔瑞斯',
            lines: [
                '地龍心口沒有致命舊傷，只有千年前封印留下的完整鎖痕。',
                '古亞丁記錄中的「討伐」應是後世修辭；真正發生的是封印。'
            ]
        },
        '法利昂': {
            no: '33', title: '曾經鬆動的水印', source: '擊敗・法利昂',
            lines: [
                '水龍鱗片上有兩層封印：千年前的主印，以及數百年前匆忙補上的修復印。',
                '第二層年代與海音水龍事件一致。'
            ]
        },
        '巴拉卡斯': {
            no: '34', title: '火龍窟的守望', source: '擊敗・巴拉卡斯',
            lines: [
                '火龍周圍散落歷代龍騎士試煉用的刻印石，每一代都在維持同一道封鎖線。',
                '威頓的戰士不是等待屠龍，而是世代承擔封印失敗的風險。'
            ]
        },
        '林德拜爾': {
            no: '35', title: '風龍留下的第四道痕', source: '擊敗・林德拜爾',
            lines: [
                '風龍翼骨上的古印與地、水、火三龍完全同源，補齊了封龍陣缺失的第四角。',
                '四龍在千年前被分別封印，沒有任何一頭被真正殺死。'
            ]
        }
    });

    const LORE_THEORIES = Object.freeze([
        {
            no: 'I', requires: ['03', '15', '18', '27'], title: '古亞丁的名字沒有中斷',
            text: '古亞丁並未被正式宣告滅亡，現王國因此能繼承其名義與制度；但被抹去的王名和不完整血統，證明統治本身曾經斷裂。'
        },
        {
            no: 'II', requires: ['09', '15', '18', '23'], title: '二十年前正在重演千年前',
            text: '公主父母失敗的政治鬥爭、希培利亞裂痕重開與被修改的千年前政變彼此同時出現。二十年前的事件可能是同一場權力鬥爭的重演。'
        },
        {
            no: 'III', requires: ['01', '10', '13', '14', '26'], title: '巴風特到古魯丁的逃亡線',
            text: '哈汀召來巴風特，研究失敗後歐林經說話之島地監底層的海底通道逃往古魯丁，最後躲進七樓；卡士柏等人則在同一地監成為死亡騎士的傀儡。'
        },
        {
            no: 'IV', requires: ['07', '32', '33', '34', '35'], title: '四龍從未被殺死',
            text: '地、水、火、風四龍留下的是同源封印而非致命傷。海音事件只是法利昂封印曾短暫鬆動的證據，千年前的四龍討伐其實是四龍封印。'
        }
    ]);

    let _worldLoreFilter = 'all';

    function fragmentList() {
        let out = [];
        Object.keys(ITEM_FRAGMENTS).forEach(itemId => {
            let fragment = ITEM_FRAGMENTS[itemId];
            let itemName = (typeof DB !== 'undefined' && DB.items && DB.items[itemId]) ? DB.items[itemId].n : itemId;
            out.push(Object.assign({ source: '物品・' + itemName, kind: 'item' }, fragment));
        });
        Object.keys(AREA_FRAGMENTS).forEach(key => out.push(Object.assign({ kind: 'area' }, AREA_FRAGMENTS[key])));
        Object.keys(MOB_FRAGMENTS).forEach(key => out.push(Object.assign({ kind: 'mob' }, MOB_FRAGMENTS[key])));
        return out.sort((a, b) => Number(a.no) - Number(b.no));
    }

    function seenList() {
        if (typeof player === 'undefined' || !player) return [];
        if (player.worldLoreVersion !== LORE_VERSION) {
            player.worldLoreSeen = [];
            player.worldLoreVersion = LORE_VERSION;
            try { if (player.cls && typeof saveGame === 'function') saveGame(); } catch (e) {}
        }
        if (!Array.isArray(player.worldLoreSeen)) player.worldLoreSeen = [];
        return player.worldLoreSeen;
    }

    function reveal(fragment, announce) {
        if (!fragment || typeof player === 'undefined' || !player) return false;
        let seen = seenList();
        if (seen.includes(fragment.no)) return false;
        seen.push(fragment.no);
        seen.sort((a, b) => Number(a) - Number(b));
        if (announce && typeof logSys === 'function') {
            logSys(`<div class="world-lore-log"><b>◈ 發現世界殘響・碎片 ${fragment.no}</b><strong>${fragment.title}</strong>`
                + fragment.lines.map(line => `<span>${line}</span>`).join('') + `</div>`);
        }
        try { if (typeof saveGame === 'function') saveGame(); } catch (e) {}
        return true;
    }

    function worldLoreItemHTML(item) {
        const fragment = item && ITEM_FRAGMENTS[item.id];
        if (!fragment) return '';
        reveal(fragment, false);
        return `<section class="world-lore-fragment"><div class="world-lore-heading">◈ 世界殘響・碎片 ${fragment.no}</div>`
            + `<div><strong>${fragment.title}</strong>`
            + fragment.lines.map(line => `<p>${line}</p>`).join('')
            + `<small>殘響只是被留下的說法，未必是真相。</small></div></section>`;
    }

    function worldLoreOnAreaEnter(mapKey) {
        reveal(AREA_FRAGMENTS[mapKey], true);
    }

    function worldLoreOnMobEncounter(mob) {
        reveal(mob && MOB_FRAGMENTS[mob.n], true);
    }

    function worldLoreOnMobKill(mob) {
        reveal(mob && MOB_FRAGMENTS[mob.n], true);
    }

    function theoryHTML(seen) {
        return `<section class="world-lore-theories"><h3>◇ 線索交會</h3><p>集齊指定殘響後才會形成推論；推論仍可能是錯的。</p><div>`
            + LORE_THEORIES.map(theory => {
                let found = theory.requires.filter(no => seen.includes(no)).length;
                if (found < theory.requires.length) {
                    return `<article class="world-lore-theory locked"><span>推論 ${theory.no}・線索 ${found}/${theory.requires.length}</span><strong>尚無法拼合</strong></article>`;
                }
                return `<article class="world-lore-theory"><span>推論 ${theory.no}・已拼合</span><strong>${theory.title}</strong><p>${theory.text}</p></article>`;
            }).join('') + `</div></section>`;
    }

    function renderWorldLoreBook() {
        let body = document.getElementById('world-lore-book-body');
        let count = document.getElementById('world-lore-book-count');
        if (!body) return;
        let seen = seenList(), all = fragmentList();
        if (count) count.textContent = `${seen.length} / ${all.length}`;
        let filterLabels = { all: '全部', item: '物品／遺物', area: '地區', mob: '人物／頭目' };
        document.querySelectorAll('#world-lore-book-tools button').forEach(button => {
            let filter = button.dataset.loreFilter;
            let group = filter === 'all' ? all : all.filter(fragment => fragment.kind === filter);
            let found = group.filter(fragment => seen.includes(fragment.no)).length;
            button.textContent = `${filterLabels[filter] || filter} ${found}/${group.length}`;
            button.classList.toggle('active', filter === _worldLoreFilter);
        });
        let visible = _worldLoreFilter === 'all' ? all : all.filter(fragment => fragment.kind === _worldLoreFilter);
        body.innerHTML = (_worldLoreFilter === 'all' ? theoryHTML(seen) : '') + visible.map(fragment => {
            if (!seen.includes(fragment.no)) {
                return `<article class="world-lore-book-card locked"><div>碎片 ${fragment.no}</div><strong>尚未發現</strong><p>線索仍沉睡在世界的某個角落。</p></article>`;
            }
            return `<article class="world-lore-book-card"><div>碎片 ${fragment.no}・${fragment.source}</div><strong>${fragment.title}</strong>`
                + fragment.lines.map(line => `<p>${line}</p>`).join('') + `</article>`;
        }).join('');
    }

    function worldLoreSetFilter(filter) {
        _worldLoreFilter = ['all', 'item', 'area', 'mob'].includes(filter) ? filter : 'all';
        renderWorldLoreBook();
    }

    function openWorldLoreBook() {
        try { if (typeof closeCollectionPanel === 'function') closeCollectionPanel(); } catch (e) {}
        renderWorldLoreBook();
        let modal = document.getElementById('world-lore-book');
        if (modal) modal.classList.remove('hidden');
    }

    function closeWorldLoreBook() {
        let modal = document.getElementById('world-lore-book');
        if (modal) modal.classList.add('hidden');
    }

    function worldLoreBookBackdrop(event) {
        if (event && event.target && event.target.id === 'world-lore-book') closeWorldLoreBook();
    }

    window.WORLD_LORE_ITEM_FRAGMENTS = ITEM_FRAGMENTS;
    window.WORLD_LORE_AREA_FRAGMENTS = AREA_FRAGMENTS;
    window.WORLD_LORE_MOB_FRAGMENTS = MOB_FRAGMENTS;
    window.worldLoreItemHTML = worldLoreItemHTML;
    window.worldLoreOnAreaEnter = worldLoreOnAreaEnter;
    window.worldLoreOnMobEncounter = worldLoreOnMobEncounter;
    window.worldLoreOnMobKill = worldLoreOnMobKill;
    window.worldLoreSetFilter = worldLoreSetFilter;
    window.openWorldLoreBook = openWorldLoreBook;
    window.closeWorldLoreBook = closeWorldLoreBook;
    window.worldLoreBookBackdrop = worldLoreBookBackdrop;
})();
