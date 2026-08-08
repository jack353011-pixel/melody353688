// 世界殘響：把同一段歷史拆進不同物品，讓玩家自行拼湊且保留互相矛盾的證詞。
(function () {
    const ITEM_FRAGMENTS = Object.freeze({
        wpn_11: {
            no: '01', title: '沒有名字的清晨',
            lines: [
                '刀柄內側刻著一行極小的字：「若鐘在天亮前響起，別抬頭。」',
                '最後三個字被人反覆刮除，仍能辨出是「看太陽」。'
            ]
        },
        wpn_shortbow: {
            no: '02', title: '守夜人的證詞',
            lines: [
                '舊弓弦纏著王庭守夜人的紅線。守夜人只准面向西方，因為東方「不需要被守望」。',
                '然而線結的數量，恰好等於某座失蹤村莊的人口。'
            ]
        },
        wpn_silveraxe: {
            no: '03', title: '被削去的王徽',
            lines: [
                '斧柄曾刻有第一王朝的日輪徽記，如今只剩一道向下墜落的光。',
                '王庭史書稱此斧斬殺了拒絕黎明的叛徒；刃口上的銘文卻寫著：「他救了我們一次。」'
            ]
        },
        hlm_mummy_crown: {
            no: '04', title: '不肯迎接黎明的王',
            lines: [
                '枯王臨刑前沒有祈求寬恕，只問：「明日升起的，還算是太陽嗎？」',
                '行刑紀錄缺少最後一頁，王冠內側卻黏著燒焦的孩童名冊。'
            ]
        },
        amr_old_plate: {
            no: '05', title: '無火的鍛造',
            lines: [
                '盔甲沒有受熱或敲打的痕跡，彷彿金屬自己記得應有的形狀。',
                '古代鐵匠將這種現象稱為「前一個世界留下的習慣」。'
            ]
        },
        mat_youkai_soul: {
            no: '06', title: '封印中的人聲',
            lines: [
                '符紙裡偶爾傳出互相呼喚的聲音。那些名字全都出現在日出之國的祭典名冊上。',
                '名冊稱他們是受邀觀禮的百姓，卻沒有任何人留下返家的紀錄。'
            ]
        },
        wpn_onmyoji_fan: {
            no: '07', title: '陰陽寮殘頁',
            lines: [
                '「日輪熄滅後，以萬魂為薪，可續燃一紀。」',
                '旁註出自另一人之手：「第九次續燃後，連施術者也忘了真正的太陽。」'
            ]
        },
        relic_sr_old_umbrella: {
            no: '08', title: '東門沒有下雨',
            lines: [
                '百年唐傘記得每一場雨，唯獨祭典當日的東門一滴水也沒有。',
                '老人說那不是晴天，而是天空被某種巨大的火焰烤乾了。'
            ]
        },
        relic_sr_tengu_fan: {
            no: '09', title: '天狗所見之天',
            lines: [
                '天狗飛得比王城最高的塔更高，回來後便挖去自己的雙眼。',
                '牠只留下警告：「天空是一層幕，幕後有人轉動日輪。」'
            ]
        },
        relic_sr_kyuubi_wand: {
            no: '10', title: '玉藻的嘲笑',
            lines: [
                '玉藻從不稱那場儀式為日出，只稱它為「漂亮的焚屍」。',
                '她也從未否認自己參與其中，只說王庭付出的祭品比約定少了一人。'
            ]
        },
        relic_sr_ushioni_horn: {
            no: '11', title: '少掉的一人',
            lines: [
                '斷角上刻著祭品的數目：九千九百九十九。官方碑文記載的卻是一萬。',
                '最後一個位置沒有名字，只有一枚與王冠相同的日輪印。'
            ]
        },
        relic_sr_gasha_skull: {
            no: '12', title: '巨大骷髏的夢',
            lines: [
                '無數骨骸在夢裡反覆看見同一個清晨：王城歡呼、太陽升起，而他們的故鄉從地圖上消失。',
                '夢的最後，沒有名字的孩子問道：「下一次黎明，輪到哪裡？」'
            ]
        }
    });

    const AREA_FRAGMENTS = Object.freeze({
        sunrise_castle: {
            no: '13', title: '沒有影子的城墎', source: '地區・日出之國城墎',
            lines: [
                '城牆上的日晷全都指向正午，無論此刻是清晨或深夜。',
                '城內的窗戶一致朝向宮殿，彷彿居民被禁止觀看真正的天空。'
            ]
        },
        sunrise_east: {
            no: '14', title: '只往東方的足跡', source: '地區・日出之國東之地',
            lines: [
                '泥地裡有成千上萬道向東行走的足跡，沒有任何一道折返。',
                '路旁石碑寫著「迎日之民於此蒙福」，碑後卻刻滿求救的指痕。'
            ]
        },
        sunrise_west: {
            no: '15', title: '面向落日的墳墓', source: '地區・日出之國西之地',
            lines: [
                '這裡的死者全都面向西方下葬，與王庭的葬儀律法完全相反。',
                '墓碑年份每隔一百年便重複一次，姓名卻從未相同。'
            ]
        },
        sunrise_north: {
            no: '16', title: '雪下的灰', source: '地區・日出之國北之地',
            lines: [
                '北地積雪之下不是凍土，而是一層深不見底的人骨灰。',
                '灰裡仍有餘溫；每逢黎明，它們便同時低聲數到九千九百九十九。'
            ]
        }
    });

    const MOB_FRAGMENTS = Object.freeze({
        '白面金毛九尾狐・九尾': {
            no: '17', title: '玉藻的第二張臉', source: '遭遇・白面金毛九尾狐・九尾',
            lines: [
                '人形外皮裂開時，九條尾巴上各浮現一枚不同年代的王印。',
                '其中八枚已見於史書；最古老的一枚，卻屬於從未存在過的王朝。'
            ]
        },
        '白面金毛九尾狐・殺生石': {
            no: '18', title: '石中的契約', source: '遭遇・白面金毛九尾狐・殺生石',
            lines: [
                '妖狐化石後，石心傳出不屬於她的聲音：「契約仍有效，直到最後一人補齊。」',
                '那聲音與王城每天宣告黎明的司鐘者一模一樣。'
            ]
        },
        '鵺': {
            no: '19', title: '夢咒裡的王城', source: '擊敗・鵺',
            lines: [
                '鵺讓受害者夢見王城第一次點燃日輪；夢中主持儀式的並不是人類。',
                '醒來的人都忘了那張臉，只記得它沒有影子。'
            ]
        },
        '天狗': {
            no: '20', title: '幕後的風', source: '擊敗・天狗',
            lines: [
                '天狗倒下時，羽毛沒有落地，而是被一股向上的風吸入天空裂縫。',
                '裂縫後方沒有星辰，只有巨大齒輪與一條被繃緊的火線。'
            ]
        },
        '阿修羅像': {
            no: '21', title: '六隻手的用途', source: '擊敗・阿修羅像',
            lines: [
                '石像的六隻手並非戰鬥姿勢，而是在共同托住某個圓形重物。',
                '底座銘文寫著：「日輪墜落之日，六臂者將它送回天上。」'
            ]
        },
        '牛鬼': {
            no: '22', title: '王庭的運糧車', source: '擊敗・牛鬼',
            lines: [
                '牛鬼甲殼下嵌著一枚王庭運糧車的車牌，目的地是已不存在的第十村。',
                '貨物欄沒有米糧，只記著「活體燃料，一萬」。'
            ]
        },
        '巨大骷髏': {
            no: '23', title: '萬人共同的遺言', source: '擊敗・巨大骷髏',
            lines: [
                '骨骸崩落時，萬人的聲音只說出同一句：「我們不是祭品，我們是證人。」',
                '最後消失的那顆頭骨很小，額上帶著完整的王族日輪印。'
            ]
        }
    });

    function fragmentList() {
        let out = [];
        Object.keys(ITEM_FRAGMENTS).forEach(itemId => {
            let f = ITEM_FRAGMENTS[itemId];
            let itemName = (typeof DB !== 'undefined' && DB.items && DB.items[itemId]) ? DB.items[itemId].n : itemId;
            out.push(Object.assign({ source: '物品・' + itemName }, f));
        });
        Object.keys(AREA_FRAGMENTS).forEach(key => out.push(AREA_FRAGMENTS[key]));
        Object.keys(MOB_FRAGMENTS).forEach(key => out.push(MOB_FRAGMENTS[key]));
        return out.sort((a, b) => Number(a.no) - Number(b.no));
    }

    function seenList() {
        if (typeof player === 'undefined' || !player) return [];
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

    function renderWorldLoreBook() {
        let body = document.getElementById('world-lore-book-body');
        let count = document.getElementById('world-lore-book-count');
        if (!body) return;
        let seen = seenList(), all = fragmentList();
        if (count) count.textContent = `${seen.length} / ${all.length}`;
        body.innerHTML = all.map(fragment => {
            if (!seen.includes(fragment.no)) {
                return `<article class="world-lore-book-card locked"><div>碎片 ${fragment.no}</div><strong>尚未發現</strong><p>線索仍沉睡在世界的某個角落。</p></article>`;
            }
            return `<article class="world-lore-book-card"><div>碎片 ${fragment.no}・${fragment.source}</div><strong>${fragment.title}</strong>`
                + fragment.lines.map(line => `<p>${line}</p>`).join('') + `</article>`;
        }).join('');
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
    window.openWorldLoreBook = openWorldLoreBook;
    window.closeWorldLoreBook = closeWorldLoreBook;
    window.worldLoreBookBackdrop = worldLoreBookBackdrop;
})();
