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

    function worldLoreItemHTML(item) {
        const fragment = item && ITEM_FRAGMENTS[item.id];
        if (!fragment) return '';
        return `<section class="world-lore-fragment"><div class="world-lore-heading">◈ 世界殘響・碎片 ${fragment.no}</div>`
            + `<div><strong>${fragment.title}</strong>`
            + fragment.lines.map(line => `<p>${line}</p>`).join('')
            + `<small>殘響只是被留下的說法，未必是真相。</small></div></section>`;
    }

    window.WORLD_LORE_ITEM_FRAGMENTS = ITEM_FRAGMENTS;
    window.worldLoreItemHTML = worldLoreItemHTML;
})();
