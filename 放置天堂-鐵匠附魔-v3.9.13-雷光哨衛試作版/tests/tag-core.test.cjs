const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console:{ log(){}, warn(){}, error(){} } });
const runFile = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename:file });

runFile('js/00-data.js');
vm.runInContext("const MAGIC_MASTERY_SKILLS = ['sk_blizzard','sk_tornado','sk_quake','sk_fire_storm'];", context);
runFile('js/00-tag-core.js');

const result = vm.runInContext(`(() => {
    DB.items.__tag_test_dragon_a = {type:'arm', tags:['龍族','重型'], grantAffinityTags:['訓練:龍語']};
    DB.items.__tag_test_dragon_b = {type:'acc', tags:['龍族']};
    DB.items.__tag_test_key = {type:'misc'};
    const classes = ['royal','knight','mage','elf','dark','illusion','dragon','warrior'];
    const owners = classes.map(cls => ({cls, mastery:null}));
    owners.push({cls:'elf', mastery:'e_magic'}, {cls:'royal', mastery:'k_royal_magic'});
    function oldReq(owner, sk, skId) {
        if (owner.cls === 'dark') {
            if (sk.reqD !== undefined) return sk.reqD;
            if (sk.reqM !== undefined && (sk.tier === 1 || sk.tier === 2)) return sk.tier === 1 ? 12 : 24;
            return undefined;
        }
        if (owner.cls === 'illusion') return sk.reqI;
        if (owner.cls === 'dragon') return sk.reqDk;
        if (owner.cls === 'warrior') {
            if (sk.reqW !== undefined) return sk.reqW;
            if (sk.reqM !== undefined && sk.tier === 1) return 15;
            return undefined;
        }
        if (owner.cls === 'royal') {
            if (sk.reqRoy !== undefined) return sk.reqRoy;
            if (sk.reqM !== undefined && sk.tier === 1) return 10;
            if (sk.reqM !== undefined && sk.tier === 2) return 20;
            if (owner.mastery === 'k_royal_magic' && sk.reqM !== undefined && sk.tier >= 3 && sk.tier <= 5) return sk.reqM;
            return undefined;
        }
        let level = owner.cls === 'mage' ? sk.reqM : (owner.cls === 'knight' ? sk.reqK : sk.reqE);
        if (level === undefined && owner.cls === 'elf' && owner.mastery === 'e_magic' && MAGIC_MASTERY_SKILLS.includes(skId)) level = sk.reqM;
        return level;
    }
    const mismatches = [];
    owners.forEach(owner => Object.entries(DB.skills).forEach(([id, skill]) => {
        const legacy = oldReq(owner, skill, id);
        const tagged = skillAccessTagStatus(owner, skill, id).level;
        if (legacy !== tagged) mismatches.push({owner, id, legacy, tagged});
    }));
    const snapshot = characterTagSnapshot({
        cls:'elf', mastery:'e_sword', demonTempleOpen:true,
        eq:{armor:{id:'__tag_test_dragon_a',uid:'eq-a'},ring:{id:'__tag_test_dragon_b',uid:'eq-b'}},
        inv:[{id:'__tag_test_key',uid:'inv-key',cnt:3}]
    });
    return {
        mismatches,
        genericPass:tagRuleMatch(['武器','劍','火焰'], {all:['武器','劍'], none:['詛咒']}).matched,
        genericBlock:!tagRuleMatch(['武器','弓'], {all:['武器','劍']}).matched,
        masteryPass:tagRuleMatch(playerCapabilityTags({cls:'elf', mastery:'e_sword'}), {all:['精通:e_sword']}).matched,
        customPass:tagRuleMatch(playerCapabilityTags({cls:'mage', capabilityTags:['訓練:劍術']}), {all:['訓練:劍術']}).matched,
        explicit:skillAccessTagStatus({cls:'elf', mastery:'e_sword'}, {qualificationRule:{all:['精通:e_sword'], level:23}}, 'test'),
        affinityCannotQualify:!skillAccessTagStatus(
            {cls:'mage',eq:{armor:{id:'__tag_test_dragon_a',uid:'qual-block'}}},
            {qualificationRule:{all:['龍族'],level:1}}, 'blocked-test'
        ).allowed,
        qualificationCanQualify:skillAccessTagStatus(
            {cls:'mage',qualificationTags:['資格:龍語']},
            {qualificationRule:{all:['資格:龍語'],level:7}}, 'qualification-test'
        ).level,
        synergyMatches:skillSynergyTagStatus(
            {cls:'mage',eq:{armor:{id:'__tag_test_dragon_a',uid:'synergy-ok'}}},
            {synergyTagRule:{all:['龍族']}}
        ).matched,
        snapshot:{
            dragonCount:snapshot.count('龍族',{scope:'裝備中'}),
            dragonSources:snapshot.sources('龍族',{scope:'裝備中'}).length,
            grant:snapshot.has('訓練:龍語',{scope:'裝備中'}),
            held:snapshot.count('持有:__tag_test_key',{scope:'持有'}),
            quest:snapshot.has('任務:魔族神殿開放',{scope:'任務'}),
            inventoryNotEquipped:snapshot.count('持有:__tag_test_key',{scope:'裝備中'})
        }
    };
})()`, context);

assert.equal(result.mismatches.length, 0, `Tag 技能轉接與舊需求不一致：${JSON.stringify(result.mismatches.slice(0, 5))}`);
assert.equal(result.genericPass, true);
assert.equal(result.genericBlock, true);
assert.equal(result.masteryPass, true);
assert.equal(result.customPass, true);
assert.equal(result.explicit.allowed, true);
assert.equal(result.explicit.level, 23);
assert.equal(result.affinityCannotQualify, true);
assert.equal(result.qualificationCanQualify, 7);
assert.equal(result.synergyMatches, true);
assert.equal(result.snapshot.dragonCount, 2);
assert.equal(result.snapshot.dragonSources, 2);
assert.equal(result.snapshot.grant, true);
assert.equal(result.snapshot.held, 3);
assert.equal(result.snapshot.quest, true);
assert.equal(result.snapshot.inventoryNotEquipped, 0);

// 裝備標籤保留為判定與搜尋資料，但不顯示在物品完整能力內。
const uiSource = fs.readFileSync(path.join(root, 'js/10-ui-tabs.js'), 'utf8');
const itemDescStart = uiSource.indexOf('function buildItemDescHTML(item)');
const itemDescEnd = uiSource.indexOf('\nfunction compareCardHTML(', itemDescStart);
const itemDescSource = uiSource.slice(itemDescStart, itemDescEnd);
assert.ok(itemDescStart >= 0 && itemDescEnd > itemDescStart, '找不到 buildItemDescHTML 區段');
assert.equal(itemDescSource.includes('equipmentTagHTML('), false, '物品能力介面不可顯示裝備標籤表');
assert.equal(itemDescSource.includes('equipmentTagRuleHTML('), false, '物品能力介面不可顯示標籤相符提示');
assert.ok(uiSource.includes('function equipmentTagProfile(itemOrId)'), '裝備標籤資料功能不可移除');
assert.ok(uiSource.includes("el.dataset.equipmentTags = equipmentTags(i).join(' ')"), '裝備標籤搜尋索引不可移除');
const vfxSource = fs.readFileSync(path.join(root, 'js/09-vfx-render.js'), 'utf8');
assert.equal(vfxSource.includes('monsterTagProfile(m)'), false, '怪物頭上不可顯示階級／體型／種族標籤');
assert.ok(uiSource.includes('function monsterTagProfile(mob)'), '怪物標籤判定資料不可移除');
console.log('tag-core: ok');
