// 世界殘響：內容與取得點依新版《世界觀.docx》配置，讓地點、人物、頭目與物品彼此交叉作證。
(function () {
    // 保留既有版本鍵，避免更換世界觀來源檔時清空玩家已找到的殘響。
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
        },
        item_ancient_scroll: {
            no: '62', title: '被裁成證明的古代卷軸',
            lines: [
                '卷軸上半寫著「新王朝繼承亞丁之名、法律與官署」，常被王國學者用來證明王權從未中斷。',
                '被裁掉的下半仍殘留壓痕：「舊王室失權、諸地分裂之後」。同一份文書既能證明繼承，也能證明覆亡。'
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
        },
        windwood_dungeon: {
            no: '38', title: '天才越界後的終點', source: '地區・風木地監',
            lines: [
                '地監深處的研究台同時刻著象牙塔術式與惡魔召喚陣，落款是巴列斯。',
                '他曾是象牙塔最偉大的天才；對力量的渴望越過正統魔法界線後，研究沒有停止，只是移到了王國看不見的地下。'
            ]
        },
        zone_21: {
            no: '39', title: '以骨架標示力量的地下城', source: '地區・奇岩地監4樓',
            lines: [
                '巨大的樑柱不是按承重需要排列，而是以主人的力量決定數量；骨架越多，代表曾居住於此的存在越強。',
                '這些建築不像人類工法。奇岩的財富建立在地上，地下卻仍保留著更古老力量的尺度。'
            ]
        },
        fire_dragon: {
            no: '40', title: '守封者走過的試煉階梯', source: '地區・火龍窟',
            lines: [
                '熔岩旁的石階依序刻著戰鬥、試煉與龍魂共鳴，每一階都留有不同世代龍騎士的名字。',
                '他們從出生便守在火龍封印附近；通過階段不是為了獲得榮耀，而是證明自己能承受力量的代價。'
            ]
        },
        zone_03: {
            no: '41', title: '從洞窟蔓延到山區的寒冷', source: '地區・歐瑞雪原',
            lines: [
                '雪層下仍可見被同一瞬間凍住的道路與界碑，寒氣的源頭一路指向冰之洞窟。',
                '冰之女王曾協助古亞丁，卻在某次事件後被王國除名；此後她退居洞窟，周圍山區也永遠停在冰雪之中。'
            ]
        },
        town_oren: {
            no: '42', title: '從未停課的魔法城', source: '地區・歐瑞村莊',
            lines: [
                '歐瑞的訓練名冊跨越古亞丁與現王國，課程名稱幾度修改，培養魔法師的工作卻從未中斷。',
                '受訓者後來進入軍隊、學院與宮廷。這座城沒有王座，卻能長期影響王國政治。'
            ]
        }
    });

    // 同一個故事樞紐可以留下多層證據；玩家每次調查只取出一片，避免把核心史料硬塞到無關地圖。
    const AREA_EXTRA_FRAGMENTS = Object.freeze({
        town_gludin: Object.freeze([{
            no: '58', title: '鞋底帶血的送信簿', source: '地區・古魯丁村莊',
            lines: [
                '村莊信使的簿冊沒有王國火漆，只有戰場、難民聚落與偏遠道路留下的泥痕；被屠村的日期，比亞丁公告早了整整三天。',
                '他地位低到不能改寫命令，卻親眼看過命令抵達以前發生的事。倖存者相信的不是王城版本，而是他鞋底帶回來的血。'
            ]
        }]),
        town_talking: Object.freeze([{
            no: '43', title: '封緘的旁支族譜', source: '地區・說話之島村莊',
            lines: [
                '居所書庫裡有一頁被封存的族譜：公主父親或母親，出自約一百二十年前古亞丁王室旁支最後留下的血脈。',
                '現王國沒有完整繼承古亞丁血統，卻將這名繼承者安置在與王宮同規格、由專人監控的島上。'
            ]
        }]),
        town_aden: Object.freeze([{
            no: '44', title: '二十年前的流放命令', source: '地區・亞丁城鎮',
            lines: [
                '王宮副本把公主父母的敗北寫成「政治流放」，目的地是說話之島；守衛附表卻要求每日回報訪客與行蹤。',
                '命令旁的舊政變卷宗有相同刪改痕跡。二十年前的鬥爭，像千年前那場被抹去的事件再次發生。'
            ]
        }, {
            no: '56', title: '同一天的兩份王國公告', source: '地區・亞丁城鎮',
            lines: [
                '王國使者宣讀的新版公告寫著「亞丁從未滅亡」；告示牌背面卻黏著尚未刮淨的舊稿，承認千年前王室曾失去王權。',
                '兩份文書都蓋著中央火漆。使者沒有說謊——他只是被命令把其中一份叫作歷史，另一份叫作叛言。'
            ]
        }, {
            no: '63', title: '十字城圖上缺少的一角', source: '地區・亞丁城鎮',
            lines: [
                '王宮展示的十字城圖標出商業區、港口與住宅區，第四臂卻被金箔覆住；刮開後，底下仍寫著「貧民區」。',
                '萬城之城把王室、貨物與富戶安排在能被看見的道路上。住在第四臂的人沒有離開亞丁，只是先從王國展示的城市裡消失。'
            ]
        }]),
        talking_island_port: Object.freeze([{
            no: '45', title: '王室航線的雙聯帳', source: '地區・說話之島港口',
            lines: [
                '前一聯記載島與大陸的商船往來，後一聯只記王室抽取的船費、貨稅與獲准登船的人名。',
                '亞丁大陸與說話之島並非斷絕往來；王室控制的是能離島的航線，以及航線帶來的收入。'
            ]
        }]),
        gludio: Object.freeze([{
            no: '60', title: '沒有送到的停戰命令', source: '地區・古魯丁遠古戰場',
            lines: [
                '倒在舊界碑旁的使者遺骨仍抱著密封筒。命令要求人類、精靈與半獸人在日落前停戰，封口卻從未被任何前線將領拆開。',
                '官方戰史說三方拒絕停戰；這封沒有送到的命令證明，至少有一場延續到夜裡的屠殺，沒有人真正收到選擇。'
            ]
        }]),
        elf_forest: Object.freeze([{
            no: '46', title: '樹樁後的骨城', source: '地區・妖魔森林',
            lines: [
                '東部森林的樹木被成片砍倒，圍牆與城壘在空地上連成妖魔部落；建築主樑取自巨大怪物骨架。',
                '骨架數量不是裝飾，而是地位尺度：用得越多，表示主人越強。這套秩序不需要亞丁承認也能運作。'
            ]
        }]),
        heine: Object.freeze([{
            no: '47', title: '沒有列名的援軍', source: '地區・海音周邊',
            lines: [
                '十年前的戰場殘旗仍縫著戰士部族的記號；他們曾在海音危急時出手，城內紀念簿卻找不到援軍姓名。',
                '倖存者被背棄後仍住在繁華商都邊緣，只留下一句準則：「不要聽他答應什麼，看他願意付出什麼。」'
            ]
        }]),
        town_heine: Object.freeze([{
            no: '64', title: '水都重建的兩筆奉獻', source: '地區・海音城鎮',
            lines: [
                '伊娃神殿的重建簿把潔淨水道列為信徒奉獻；同頁背面卻記著戰士部族在水龍封印鬆動時搬運石材、拖回傷者。',
                '水都以信仰記住自己如何復原，卻把實際付出的人寫在帳頁背面。神殿鐘聲響起時，城外的戰士營地依然聽得見。'
            ]
        }]),
        town_giran: Object.freeze([{
            no: '59', title: '敵國印蠟下的交易價', source: '地區・奇岩城鎮',
            lines: [
                '地下帳夾著秘密使者的報價單：光與暗的貴族白天互稱叛徒，夜裡卻交換糧價、俘虜名單與封印異動。',
                '兩個陣營彼此競爭，也從未真正斷絕交流。建立在謊言上的秩序與可能引發混亂的真相，都有人願意出價。'
            ]
        }, {
            no: '66', title: '王冠抵押在商會的夜晚', source: '地區・奇岩城鎮',
            lines: [
                '奇岩地下帳記著一筆沒有公開的王室借款：二十年前政治風暴最激烈的夜晚，宮廷以三年港稅向商會換取軍餉。',
                '亞丁擁有王冠，肯特供應糧食；真正讓命令隔日仍能送出的，卻是奇岩沒有署名的金幣。財富不坐王座，也能決定王座撐多久。'
            ]
        }]),
        windwood: Object.freeze([{
            no: '65', title: '送不到地監的配水牌', source: '地區・風木周邊',
            lines: [
                '荒野配水牌把最後一車清水優先送往城牆，通往風木地監的份額則被反覆劃掉；同一天，巴列斯的地下研究紀錄仍寫著「供應無虞」。',
                '資源匱乏沒有讓禁忌研究停止，只讓代價落到看不見研究室的居民身上。風木地上缺水，地下卻從未缺過召喚材料。'
            ]
        }]),
        town_kent_castle: Object.freeze([{
            no: '48', title: '兩種城池名冊', source: '地區・肯特城',
            lines: [
                '肯特檔案把領地分成「王國法定城池」與「實際控制領地」。妖魔城堡能自行徵稅，仍被王室註記為不具合法性。',
                '名冊夾著一份政治聯姻草案，原想在某次事件後穩固權力；日期停在二十年前，沒有任何一方完成簽署。'
            ]
        }, {
            no: '57', title: '少了一句的城主命令', source: '地區・肯特城',
            lines: [
                '中央原令要求肯特先開糧倉救濟，再徵調守軍；城主使者交到軍營的版本，卻只剩「徵調守軍」。被刪的一句壓在使者私印底下。',
                '城主使者代表的是地方權力。他沒有偽造亞丁的命令，只讓最不利於城主的一部分沒能抵達。'
            ]
        }])
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
        '巴土瑟': {
            no: '72', title: '土痕下的同屆名冊', source: '擊敗・巴土瑟',
            lines: [
                '巴土瑟之帽內層縫著象牙塔同屆編號，旁邊依序寫著卡士柏、西瑪與馬庫爾；四個名字原本屬於同一組高階研究生。',
                '死亡魔力讓他只剩反覆施放地裂術的本能，帽沿卻還留著入塔時寫下的誓句：「讓知識保護仍活著的人。」'
            ]
        },
        '馬庫爾': {
            no: '73', title: '照不亮出口的光箭', source: '擊敗・馬庫爾',
            lines: [
                '馬庫爾的法帽刻著引路用的光箭術式，原本是四人進入地監後辨認撤退方向的記號。如今每一道光箭都只射向闖入者。',
                '術式沒有失效；失去的是決定方向的人。死亡騎士把他們留下的知識，改成了守住牢獄的鎖。'
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

    const NPC_FRAGMENTS = Object.freeze({
        npc_gilen: {
            no: '36', title: '吉倫沒有回答的問題', source: '交談・吉倫',
            lines: [
                '因魔法延壽的吉倫認得古亞丁舊文，也承認說話之島地監底層存在通往大陸的海底通道。',
                '他知道入口卻沒有告訴公主，只留下一句：「理解之後再決定。」'
            ]
        },
        npc_elfqueen: {
            no: '37', title: '封龍者關上的門', source: '交談・精靈女皇',
            lines: [
                '精靈女皇承認自己參與過千年前的封龍，也承認那時曾與吉倫並肩。',
                '但她拒絕說明政變當日發生的事：「有些錯誤不能再發生，所以有些門永遠不該打開。」'
            ]
        }
    });

    // 人物不會第一次見面就說出全部；先帶回相關物證，再交談才會解開第二層證詞。
    const NPC_EXTRA_FRAGMENTS = Object.freeze({
        npc_gilen: Object.freeze([{
            no: '49', requires: ['09', '10', '36', '43', '44', '45'], title: '兩條離島路線', source: '追問・吉倫',
            lead: '吉倫掃過你帶來的紀錄，沒有繼續回答。還缺能同時證明王室監控、港口航線與地監密道的物證。',
            lines: [
                '當族譜、流放令與港口帳放在他面前，吉倫終於承認：公主的一條離島路受王室查驗，另一條藏在地監海底。',
                '他早知道兩條路都存在。選擇沉默不是因為無知，而是認為公主還沒理解每條路會讓誰付出代價。'
            ]
        }, {
            no: '67', requires: ['03', '15', '18', '27', '43', '44', '49', '56', '62'], title: '繼承不等於沒有覆亡', source: '再問・吉倫',
            lead: '吉倫不接受只憑王室血脈判斷正統。帶回被抹去的王名、兩個年代的政變卷宗、古代繼承文書與現王國公告，他才願意談「亞丁從未滅亡」真正指的是什麼。',
            lines: [
                '吉倫把裁斷的古卷與現王國公告拼在一起：「城市、法律與名字確實延續了；失去權力的王室、分裂的土地與後來重新統一的新王朝，也確實存在。」',
                '他拒絕替任何血脈加冕。亞丁可以是文明的延續，也可以是王朝的覆亡；宣稱兩者只能有一個為真，才是千年來最成功的改寫。'
            ]
        }]),
        npc_elfqueen: Object.freeze([{
            no: '50', requires: ['16', '22', '37', '46'], title: '分裂不是血統', source: '追問・精靈女皇',
            lead: '精靈女皇拒絕談論十年大戰。只有同時帶回妖精森林禁令、沉默洞穴界碑與妖魔森林痕跡，才能迫使她面對分裂以前的歷史。',
            lines: [
                '界碑與骨城的證據讓精靈女皇不再否認：黑暗妖精同樣源自妖精森林，十年大戰以前雙方仍共享相同的祖先。',
                '真正使族群分裂的不是血統，而是誰有資格決定門能否打開、代價應由誰承受。她仍相信自己的封門沒有錯。'
            ]
        }, {
            no: '71', requires: ['07', '16', '22', '32', '33', '34', '35', '37', '50'], title: '封印與封門是同一個選擇', source: '再問・精靈女皇',
            lead: '精靈女皇不肯把四龍封印與森林禁令放在一起談。找齊四道龍印、妖精森林的門與沉默洞穴的界碑，再證明黑妖分裂不是血統，她才會回答兩者是否出自同一個選擇。',
            lines: [
                '四道龍印與兩族界碑排在面前後，精靈女皇承認：千年前封住巨龍，後來封住森林的門，都是她為了不讓舊錯誤重演所做的決定。',
                '她仍不後悔封印，卻第一次沒有把沉默稱為保護：「我知道門後的代價，所以替所有人關上了門。這能證明我的恐懼，不能證明他們沒有選擇的資格。」'
            ]
        }]),
        npc_duwen: Object.freeze([{
            no: '51', requires: ['20', '47'], title: '城裡沒有那面旗', source: '追問・多文',
            lead: '多文看向海音城外，叫你不要只讀城內的碑。先比較水都留下的官方紀錄，以及周邊戰場沒有被收走的東西。',
            lines: [
                '多文認出海音周邊的殘旗，也證實戰士曾在十年前替這座城作戰；他拒絕說出下令背棄援軍的人。',
                '他只指向城內沒有戰士姓名的紀念簿：「承諾可以重寫，付出過什麼不能。」'
            ]
        }, {
            no: '68', requires: ['20', '33', '47', '51', '64'], title: '鐘聲蓋不住營地的名字', source: '再問・多文',
            lead: '多文不願再談背叛，只要你去確認水龍封印、城內修復碑、城外殘旗與伊娃神殿重建簿，看看海音究竟把誰寫在正面、誰留在背面。',
            lines: [
                '多文讀完重建簿，補上帳頁沒有記錄的人名。戰士在水龍封印鬆動時守住水道，十年前又一次救援海音；兩次付出都被改寫成城市自己的勝利。',
                '他沒有要求拆掉神殿碑，只把名單壓在碑座下：「讓鐘聲繼續響。但下一個來讀歷史的人，至少會先看見我們。」'
            ]
        }]),
        npc_ricky: Object.freeze([{
            no: '69', requires: ['17', '24', '48', '52', '57', '61'], title: '誓言不能只約束接令的人', source: '追問・瑞奇',
            lead: '瑞奇仍要求騎士服從制度。先帶回銀騎士村誓詞、肯特糧倉與城籍，以及命令在使者手中改變的完整證據，他才願意回答騎士究竟該服從哪一個版本。',
            lines: [
                '瑞奇逐字比對中央原令、城主刪改與守衛隊長的遞送圖，仍然沒有否定騎士誓言：「沒有制度，最強的人說的話就是法律。」',
                '他在誓詞末尾補上一行：「傳令、改令與發令者同受誓言約束。」制度若只要求接令的騎士服從，卻容許握印的人任意刪字，那不是秩序，只是方便。'
            ]
        }]),
        npc_taras: Object.freeze([{
            no: '70', requires: ['13', '18', '28', '29', '42', '62', '67'], title: '證據室也會選擇留下什麼', source: '追問・塔拉斯',
            lead: '塔拉斯只接受能重複檢驗的材料。帶回象牙塔兩個年代的卷宗、卡士柏一族的遺物、古代卷軸與吉倫的判讀，他才會檢查「證據、推理、真相」之間缺了什麼。',
            lines: [
                '塔拉斯確認每件遺物都是真品，卻把問題指向證據室本身：卡士柏等人的學生證被留下，研究題目與失敗責任卻分散在不同年代的櫃子裡。',
                '「證據不會自己走向真相。」他在象牙塔格言後補上小字，「先問誰決定哪些東西能成為證據。」推理若只使用被允許留下的材料，也能得到一個完美而錯誤的答案。'
            ]
        }, {
            no: '74', requires: ['01', '13', '27', '28', '29', '70', '72', '73'], title: '四頂法帽沒有第五個出口', source: '再問・塔拉斯',
            lead: '塔拉斯要看的不是單一亡者。帶回歐林日記、地監除名紀錄、死亡騎士痕跡，以及卡士柏、巴土瑟、西瑪、馬庫爾四人的個別遺物，他才願意重建那次進入地監的完整名單。',
            lines: [
                '四頂法帽與歐林日記的日期吻合：卡士柏、巴土瑟、西瑪、馬庫爾為了長生與禁忌力量一同進入古魯丁地監，沒有人按撤退術式回到象牙塔。',
                '塔拉斯把四人的名字重新寫回名冊，註記不是「地監魔物」，而是「失蹤學生」：他們做過錯誤的選擇，也遭死亡騎士奪走後來重新選擇的能力。'
            ]
        }]),
        npc_kent_guard: Object.freeze([{
            no: '52', requires: ['24', '45', '48'], title: '治安之外的回報', source: '追問・肯特守衛隊長',
            lead: '守衛隊長只承認公開勤務。糧倉、王室航線與城籍名冊之間若沒有共同證據，他不會讓你查看密封派駐令。',
            lines: [
                '守衛隊長拿出的派駐令分成兩欄：公開職責是治安與護衛，密封職責是監視地方、傳遞人員與物資情報。',
                '妖精森林、沉默洞穴、希培利亞、火龍窟與妖魔城堡不在名冊內；不是因為王國不想監視，而是制度還無法直接伸進去。'
            ]
        }, {
            no: '61', requires: ['52', '56', '57', '58', '59', '60'], title: '命令在路上變成歷史', source: '再問・肯特守衛隊長',
            lead: '守衛隊長不肯評論使者制度。先找齊中央公告、城主刪改、村莊見聞、秘密往來與那封沒有送到的命令，才能看懂他桌上的遞送圖。',
            lines: [
                '五份使者紀錄攤開後，守衛隊長終於承認：王國命令離開王城以後，會被地方刪改、被道路延誤、被秘密交易利用，也可能隨送信人一起消失。',
                '「官方版本不是一個人寫成的。」他收起遞送圖，「它是所有成功抵達的話，壓過所有沒能抵達的話。」'
            ]
        }]),
        npc_shenien: Object.freeze([{
            no: '53', requires: ['18', '23', '44'], title: '裂痕記得同一天', source: '追問・希蓮恩',
            lead: '希蓮恩說日期比故事可靠。先找出象牙塔的兩份年代、希培利亞重現紀錄，以及亞丁二十年前真正發出的命令。',
            lines: [
                '希蓮恩把亞丁流放命令的日期與希培利亞重現紀錄疊在一起：政治鬥爭結束的那一天，時空裂痕也短暫開啟。',
                '她不斷言兩者必有因果，只提醒：「同時發生不是真相，但故意把同一天拆成兩段歷史，也不是偶然。」'
            ]
        }]),
        npc_procel: Object.freeze([{
            no: '54', requires: ['21', '40'], title: '不是授勳的試煉', source: '追問・普洛凱爾',
            lead: '普洛凱爾不評論外人眼中的英雄試煉。威頓的成年禮與火龍窟階梯都留下拓印後，他才願意說明試煉真正挑選的是什麼。',
            lines: [
                '普洛凱爾讀完威頓成年禮與火龍窟階梯的拓印，否認那些試煉是為了選出英雄。',
                '每一階都在確認龍騎士能否承受龍魂與封印反噬；通過者獲得的不是榮耀，而是繼續守下去的資格。'
            ]
        }]),
        npc_brudica: Object.freeze([{
            no: '55', requires: ['16', '22', '46'], title: '敗退不是答案', source: '追問・布魯迪卡',
            lead: '布魯迪卡要你先看過兩邊留下的邊界：妖精森林的門、沉默洞穴的界碑，以及妖魔森林在戰後形成的秩序。',
            lines: [
                '布魯迪卡承認黑暗妖精在十年大戰中敗退，也承認沉默洞穴的族人仍記得妖精森林曾是故鄉。',
                '但敗北只決定他們住在哪裡，不能證明精靈女皇有權替所有人拒絕代價：「知道後仍要選，才是我們離開的理由。」'
            ]
        }])
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
        },
        {
            no: 'V', requires: ['15', '18', '36', '37'], title: '長壽者選擇保持沉默',
            text: '吉倫與精靈女皇都活過足以接近古亞丁真相的歲月，也都知道現行歷史有缺口；一人要求先理解，一人選擇封門，兩人都沒有把完整答案交給公主。'
        },
        {
            no: 'VI', requires: ['04', '08', '18', '30', '38'], title: '巴列斯的研究沒有停止',
            text: '象牙塔知道巴列斯越過了正統魔法的界線，也留下互相矛盾的研究報告。被除名後，他把同一套術式帶進風木地下，繼續惡魔召喚與禁忌黑魔法。'
        },
        {
            no: 'VII', requires: ['05', '06', '19', '31', '41'], title: '寒冷是除名留下的傷口',
            text: '冰之女王曾為古亞丁提供援助，王室卻在某次事件後抹去她的名字。她退入洞窟時蔓延到整片山區的寒氣，可能不是天災，而是被背棄後留下的結果。'
        },
        {
            no: 'VIII', requires: ['08', '18', '30', '42'], title: '魔法教育也是政治力量',
            text: '歐瑞長年培養遍布王國的魔法師，象牙塔則保存、修改並解釋魔法紀錄。能決定什麼是正統、什麼能被記住，本身就是不需要王座的權力。'
        },
        {
            no: 'IX', requires: ['16', '17', '21', '22', '23', '47'], title: '光與暗不是善惡分界',
            text: '封門、秩序、承擔、選擇、懷疑與行動都是面對舊錯誤的方法。各族真正衝突的是誰能決定代價、何時揭開真相，而不是誰天生代表正義或邪惡。'
        },
        {
            no: 'X', requires: ['09', '15', '24', '25', '45', '46', '48'], title: '王國用制度決定什麼算存在',
            text: '王國以守衛、航線、糧倉、稅收與城籍控制土地，也以承認或除名控制歷史。妖魔城堡明明能統治與徵稅，卻和古亞丁的斷裂一樣，可以在官方名冊裡被寫成不存在。'
        },
        {
            no: 'XI', requires: ['49', '50', '51', '52', '53', '54', '55'], title: '證人保護的是自己的選擇',
            text: '吉倫、精靈女皇、戰士、守衛與各族導師並非不知道歷史，而是各自省略會動搖自身信念的部分。把物證帶回去追問，才看得見沉默背後不是同一個理由。'
        },
        {
            no: 'XII', requires: ['56', '57', '58', '59', '60', '61'], title: '歷史取決於哪句話成功抵達',
            text: '中央使者決定官方版本，城主使者刪去不利命令，村莊信使帶回現場，秘密使者維持敵對中的往來，失蹤使者則讓一種可能永遠沒有發生。歷史不只會被書寫，也會在遞送途中被改變。'
        },
        {
            no: 'XIII', requires: ['03', '15', '27', '43', '44', '56', '62', '67'], title: '亞丁延續了，王朝沒有',
            text: '古亞丁的城市、法律、官署與國名被新王朝繼承，所以文明沒有消失；被熔毀的王冠、失權的舊王室與重新統一的記錄，則證明統治血脈曾經中斷。官方把「文明延續」換成「王朝未亡」，讓兩句不同的話看起來像同一件事。'
        },
        {
            no: 'XIV', requires: ['24', '25', '47', '48', '63', '64', '65', '66', '68'], title: '每座繁華城市都有看不見的帳頁',
            text: '亞丁把貧民區蓋在城圖下，海音把援軍寫在重建簿背面，風木把居民的水轉給地下研究，奇岩用未署名借款支撐王冠。秩序並非沒有代價，而是擅長把付出代價的人移到讀者看不見的位置。'
        },
        {
            no: 'XV', requires: ['53', '54', '55', '67', '68', '69', '70', '71'], title: '光與暗選擇的是方法，不是善惡',
            text: '吉倫要求理解，瑞奇修補制度，塔拉斯追問證據，精靈女皇防止錯誤重演；希蓮恩懷疑表象，普洛凱爾承擔代價，布魯迪卡堅持選擇，多文只相信實際付出。八種方法都可能保護人，也都可能傷害人；陣營分界從來不能替任何選擇證明正義。'
        },
        {
            no: 'XVI', requires: ['01', '13', '27', '28', '29', '72', '73', '74'], title: '四名魔法師成了同一座牢獄的鎖',
            text: '卡士柏、巴土瑟、西瑪、馬庫爾原是象牙塔同屆的高階魔法師，為長生與黑魔法一起走進古魯丁地監。死亡魔力沒有抹去他們的法術，而是奪走法術原本要保護、引路與研究的目的，讓四人成為死亡騎士的傀儡守衛。'
        }
    ]);

    const LORE_ERAS = Object.freeze([
        {
            label: '千年前', requires: ['07', '15', '16', '18', '32', '33', '34', '35', '37'],
            title: '第一次政變與四龍封印',
            text: '古亞丁在政變期間封印四龍，王朝名義沒有消失，事件經過卻被後世重新書寫。精靈女皇是仍活著的參與者之一。'
        },
        {
            label: '約一百二十年前', requires: ['09', '15', '36'],
            title: '最後的旁支血脈',
            text: '公主的父親或母親出自古亞丁王室最後一支旁系。現王國繼承古名與制度，血統卻早已不完整。'
        },
        {
            label: '二十年前', requires: ['09', '18', '23'],
            title: '政治鬥爭與裂痕重開',
            text: '公主父母在政治鬥爭中失敗，公主出生於被監視的說話之島；同一場政治風暴也讓希培利亞的時空裂痕短暫開啟。'
        },
        {
            label: '十年前', requires: ['47'],
            title: '戰士援助海音後遭到背棄',
            text: '戰士曾在海音危急時提供援助，事後卻被排除在城市紀錄之外。繁華重新開始後，他們留在城市邊緣，只相信實際付出的行動。'
        },
        {
            label: '現在', requires: ['09', '10', '20', '36'],
            title: '從監視之島開始的旅程',
            text: '公主在王宮規格的監視居所長大。吉倫知道離島密道卻保持沉默，而鬆動過的水龍封印證明千年前的問題仍未結束。'
        }
    ]);

    let _worldLoreFilter = 'all';
    let _worldLoreCurrentArea = null;
    let _worldLoreDiscoveryTimer = null;

    function fragmentsAtArea(mapKey) {
        let out = [];
        if (AREA_FRAGMENTS[mapKey]) out.push(AREA_FRAGMENTS[mapKey]);
        if (AREA_EXTRA_FRAGMENTS[mapKey]) out.push(...AREA_EXTRA_FRAGMENTS[mapKey]);
        return out;
    }

    function fragmentsAtNpc(npcId) {
        let out = [];
        if (NPC_FRAGMENTS[npcId]) out.push(NPC_FRAGMENTS[npcId]);
        if (NPC_EXTRA_FRAGMENTS[npcId]) out.push(...NPC_EXTRA_FRAGMENTS[npcId]);
        return out;
    }

    function fragmentList() {
        let out = [];
        Object.keys(ITEM_FRAGMENTS).forEach(itemId => {
            let fragment = ITEM_FRAGMENTS[itemId];
            let itemName = (typeof DB !== 'undefined' && DB.items && DB.items[itemId]) ? DB.items[itemId].n : itemId;
            out.push(Object.assign({ source: '物品・' + itemName, kind: 'item', hint: '仔細查看與這段歷史相關的物品。' }, fragment));
        });
        Object.keys(AREA_FRAGMENTS).forEach(key => out.push(Object.assign({ kind: 'area', hint: '抵達相關地區後，主動調查附近的痕跡。' }, AREA_FRAGMENTS[key])));
        Object.keys(AREA_EXTRA_FRAGMENTS).forEach(key => AREA_EXTRA_FRAGMENTS[key].forEach(fragment => {
            out.push(Object.assign({ kind: 'area', hint: '抵達相關地區後，繼續調查同一段歷史留下的其他痕跡。' }, fragment));
        }));
        Object.keys(MOB_FRAGMENTS).forEach(key => out.push(Object.assign({ kind: 'mob', hint: '擊敗與這段歷史有關的人物或頭目。' }, MOB_FRAGMENTS[key])));
        Object.keys(NPC_FRAGMENTS).forEach(key => out.push(Object.assign({ kind: 'mob', hint: '與知道這段歷史的人物交談。' }, NPC_FRAGMENTS[key])));
        Object.keys(NPC_EXTRA_FRAGMENTS).forEach(key => NPC_EXTRA_FRAGMENTS[key].forEach(fragment => {
            out.push(Object.assign({ kind: 'mob', hint: '先找到與此人證詞相關的物證，再回去交談追問。' }, fragment));
        }));
        return out.sort((a, b) => Number(a.no) - Number(b.no));
    }

    function seenList() {
        if (typeof player === 'undefined' || !player) return [];
        if (player.worldLoreVersion !== LORE_VERSION) {
            player.worldLoreSeen = [];
            player.worldLoreLeadsSeen = [];
            player.worldLoreVersion = LORE_VERSION;
            try { if (player.cls && typeof saveGame === 'function') saveGame(); } catch (e) {}
        }
        if (!Array.isArray(player.worldLoreSeen)) player.worldLoreSeen = [];
        return player.worldLoreSeen;
    }

    function leadSeenList() {
        if (typeof player === 'undefined' || !player) return [];
        if (!Array.isArray(player.worldLoreLeadsSeen)) player.worldLoreLeadsSeen = [];
        return player.worldLoreLeadsSeen;
    }

    function rememberWorldLoreLead(fragment) {
        if (!fragment || typeof player === 'undefined' || !player) return;
        let heard = leadSeenList();
        if (heard.includes(fragment.no)) return;
        heard.push(fragment.no);
        heard.sort((a, b) => Number(a) - Number(b));
        try { if (typeof saveGame === 'function') saveGame(); } catch (e) {}
    }

    function closeWorldLoreDiscovery() {
        if (_worldLoreDiscoveryTimer) clearTimeout(_worldLoreDiscoveryTimer);
        _worldLoreDiscoveryTimer = null;
        if (typeof document === 'undefined') return;
        let discovery = document.getElementById('world-lore-discovery');
        if (discovery) {
            discovery.classList.add('hidden');
            delete discovery.dataset.mode;
        }
    }

    function showWorldLoreCard(card) {
        if (typeof document === 'undefined') return;
        let discovery = document.getElementById('world-lore-discovery');
        let no = document.getElementById('world-lore-discovery-no');
        let title = document.getElementById('world-lore-discovery-title');
        let lines = document.getElementById('world-lore-discovery-lines');
        let footnote = document.getElementById('world-lore-discovery-footnote');
        if (!discovery || !no || !title || !lines || !footnote) return;
        discovery.dataset.mode = card.mode || 'discovery';
        no.textContent = card.label;
        title.textContent = card.title;
        lines.innerHTML = card.lines.map(line => `<p>${line}</p>`).join('');
        footnote.textContent = card.footnote;
        discovery.classList.remove('hidden');
        if (_worldLoreDiscoveryTimer) clearTimeout(_worldLoreDiscoveryTimer);
        _worldLoreDiscoveryTimer = setTimeout(closeWorldLoreDiscovery, 9000);
    }

    function showWorldLoreDiscovery(fragment) {
        showWorldLoreCard({
            mode: 'discovery',
            label: `◈ 世界殘響・碎片 ${fragment.no}`,
            title: fragment.title,
            lines: fragment.lines,
            footnote: '已收入世界殘響，可在「成長 → 圖鑑收藏」重新閱讀。'
        });
    }

    function showWorldLoreLead(npc, fragment, missingCount) {
        showWorldLoreCard({
            mode: 'lead',
            label: '◇ 人物證詞尚未鬆動',
            title: `${npc.n || '對方'}仍不願回答`,
            lines: [fragment.lead || '對方似乎仍在等待能支持你追問的物證。', `尚缺 ${missingCount} 組相關物證。`],
            footnote: '追問方向已記入「世界殘響 → 未解證詞」；找到相關物證後，再回來交談。'
        });
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
        if (announce) showWorldLoreDiscovery(fragment);
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

    function syncWorldLoreAreaPrompt() {
        let prompt = document.getElementById('world-lore-area-prompt');
        if (!prompt) return;
        let seen = seenList();
        let unseen = fragmentsAtArea(_worldLoreCurrentArea).filter(fragment => !seen.includes(fragment.no));
        let button = prompt.querySelector('button');
        prompt.classList.toggle('hidden', unseen.length === 0);
        if (button) button.textContent = unseen.length > 1 ? `調查附近殘響（${unseen.length}）` : '調查附近殘響';
    }

    function worldLoreOnAreaEnter(mapKey) {
        _worldLoreCurrentArea = mapKey;
        syncWorldLoreAreaPrompt();
    }

    function worldLoreInvestigateArea() {
        let seen = seenList();
        let fragment = fragmentsAtArea(_worldLoreCurrentArea).find(candidate => !seen.includes(candidate.no));
        if (!fragment) return;
        reveal(fragment, true);
        syncWorldLoreAreaPrompt();
    }

    function worldLoreOnMobEncounter() {
        return false;
    }

    function worldLoreOnMobKill(mob) {
        reveal(mob && MOB_FRAGMENTS[mob.n], true);
    }

    function worldLoreOnNpcTalk(npc) {
        if (!npc) return;
        let seen = seenList();
        let fragment = fragmentsAtNpc(npc.id).find(candidate => {
            if (seen.includes(candidate.no)) return false;
            return !candidate.requires || candidate.requires.every(no => seen.includes(no));
        });
        if (fragment) {
            reveal(fragment, true);
            return;
        }
        let locked = fragmentsAtNpc(npc.id).find(candidate => !seen.includes(candidate.no) && candidate.requires);
        if (locked) {
            let missingCount = locked.requires.filter(no => !seen.includes(no)).length;
            rememberWorldLoreLead(locked);
            showWorldLoreLead(npc, locked, missingCount);
        }
    }

    function leadNotesHTML(seen) {
        let heard = leadSeenList();
        let notes = [];
        Object.keys(NPC_EXTRA_FRAGMENTS).forEach(key => NPC_EXTRA_FRAGMENTS[key].forEach(fragment => {
            if (heard.includes(fragment.no) && !seen.includes(fragment.no)) notes.push(fragment);
        }));
        if (!notes.length) return '';
        return `<section class="world-lore-leads"><h3>◇ 未解證詞</h3><p>只記錄你親自追問過的人；取得物證後再回去交談。</p><div>`
            + notes.map(fragment => {
                let found = fragment.requires.filter(no => seen.includes(no)).length;
                return `<article class="world-lore-lead-note"><span>${fragment.source}・物證 ${found}/${fragment.requires.length}</span>`
                    + `<strong>證詞仍未鬆動</strong><p>${fragment.lead}</p></article>`;
            }).join('') + `</div></section>`;
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

    function eraHTML(seen) {
        return `<section class="world-lore-eras"><h3>⌛ 年代斷層</h3><p>線索足夠後才會顯示事件先後；這是目前能拼出的編年，不代表完整歷史。</p><div>`
            + LORE_ERAS.map(era => {
                let found = era.requires.filter(no => seen.includes(no)).length;
                if (found < era.requires.length) {
                    return `<article class="world-lore-era locked"><span>年代未明・線索 ${found}/${era.requires.length}</span><strong>時間關係尚未確定</strong></article>`;
                }
                return `<article class="world-lore-era"><span>${era.label}・已定位</span><strong>${era.title}</strong><p>${era.text}</p></article>`;
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
        body.innerHTML = (_worldLoreFilter === 'all' ? leadNotesHTML(seen) + eraHTML(seen) + theoryHTML(seen) : '') + visible.map(fragment => {
            if (!seen.includes(fragment.no)) {
                return `<article class="world-lore-book-card locked"><div>碎片 ${fragment.no}</div><strong>尚未發現</strong><p>${fragment.hint || '線索仍沉睡在世界的某個角落。'}</p></article>`;
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
    window.WORLD_LORE_AREA_EXTRA_FRAGMENTS = AREA_EXTRA_FRAGMENTS;
    window.WORLD_LORE_MOB_FRAGMENTS = MOB_FRAGMENTS;
    window.WORLD_LORE_NPC_FRAGMENTS = NPC_FRAGMENTS;
    window.WORLD_LORE_NPC_EXTRA_FRAGMENTS = NPC_EXTRA_FRAGMENTS;
    window.worldLoreItemHTML = worldLoreItemHTML;
    window.worldLoreOnAreaEnter = worldLoreOnAreaEnter;
    window.worldLoreInvestigateArea = worldLoreInvestigateArea;
    window.worldLoreOnMobEncounter = worldLoreOnMobEncounter;
    window.worldLoreOnMobKill = worldLoreOnMobKill;
    window.worldLoreOnNpcTalk = worldLoreOnNpcTalk;
    window.worldLoreSetFilter = worldLoreSetFilter;
    window.openWorldLoreBook = openWorldLoreBook;
    window.closeWorldLoreBook = closeWorldLoreBook;
    window.worldLoreBookBackdrop = worldLoreBookBackdrop;
    window.closeWorldLoreDiscovery = closeWorldLoreDiscovery;
})();
