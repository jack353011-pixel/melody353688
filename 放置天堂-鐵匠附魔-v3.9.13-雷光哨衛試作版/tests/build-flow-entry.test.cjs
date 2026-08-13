const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console:{log(){},warn(){},error(){}} });
const run = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename:file});
run('js/00-data.js');
run('js/00-tag-core.js');

// 載入正式環境的武器標籤與攻速家族判定。炫風斬曾只在沒有 atkSpdFamily 的測試環境通過，
// 實戰卻因家族回傳「單手／雙手鈍器」而無法命中「斧」字判定。
const uiSource = fs.readFileSync(path.join(root, 'js/10-ui-tabs.js'), 'utf8');
const weaponTagsSource = uiSource.match(/const WEAPON_TAGS = \{[\s\S]*?\n\};\nfunction getWeaponTags\(id\)\{ return WEAPON_TAGS\[id\] \|\| \[\]; \}/);
assert.ok(weaponTagsSource, '無法擷取正式 WEAPON_TAGS');
vm.runInContext(weaponTagsSource[0], context, {filename:'js/10-ui-tabs.js#weapon-tags'});
const dropsConfigSource = fs.readFileSync(path.join(root, 'js/01-drops-config.js'), 'utf8');
const attackFamilySource = dropsConfigSource.match(/function atkSpdFamily\(id\) \{[\s\S]*?\n\}/);
assert.ok(attackFamilySource, '無法擷取正式 atkSpdFamily');
vm.runInContext(attackFamilySource[0], context, {filename:'js/01-drops-config.js#atk-family'});

const result = vm.runInContext(`(() => {
    DB.items.test_flow_sword={n:'測試長劍',type:'wpn'};
    DB.items.test_flow_core_sword={n:'測試核心劍',type:'wpn',core:'royalValorBlade'};
    DB.items.test_flow_chain={n:'測試鎖鏈劍',type:'wpn',chainsword:true};
    DB.items.test_flow_armor={n:'測試盔甲',type:'arm',slot:'armor'};
    DB.items.test_flow_support={n:'測試披風',type:'arm',slot:'cloak',royalValorDamagePct:20};
    DB.items.test_flow_magic={n:'測試法杖',type:'wpn',isWand:true,mdmg:1};
    DB.items.test_flow_axe={n:'測試巨斧',type:'wpn'};
    DB.items.test_flow_bow={n:'測試獵弓',type:'wpn',isBow:true,ranged:true};
    DB.items.test_flow_launcher={n:'測試鐵手甲',type:'wpn',isBow:true,ranged:true,animFam:'gauntlet'};
    DB.items.test_flow_claw={n:'測試鋼爪',type:'wpn'};
    DB.items.test_flow_qigu={n:'測試奇古獸',type:'wpn',qigu:true};
    DB.items.test_flow_boots={n:'測試戰靴',type:'arm',slot:'boots'};
    DB.items.test_flow_shield={n:'測試盾牌',type:'arm',slot:'shield'};
    DB.items.test_flow_cloak={n:'測試披風',type:'arm',slot:'cloak'};
    DB.items.test_flow_helm={n:'測試頭盔',type:'arm',slot:'helm'};
    const owner=(skills,eq)=>({skills,eq});
    const royal=owner(['sk_royal_bravewill'],{wpn:{id:'test_flow_sword'},cloak:{id:'test_flow_support'}});
    const noSkill=owner([],{wpn:{id:'test_flow_core_sword'}});
    const core=owner(['sk_royal_bravewill'],{wpn:{id:'test_flow_core_sword'}});
    const dragon=owner(['sk_dragon_deathlightning'],{wpn:{id:'test_flow_chain'}});
    const knight=owner(['sk_reduction_armor'],{armor:{id:'test_flow_armor'}});
    const archer=owner(['sk_elf_triple'],{wpn:{id:'test_flow_bow'}});
    const launcher=owner(['sk_elf_triple'],{wpn:{id:'test_flow_launcher'}});
    const dark=owner(['sk_dark_fang'],{wpn:{id:'test_flow_claw'}});
    const kindItems={magic:'test_flow_magic',launcher:'test_flow_launcher',bow:'test_flow_bow',axe:'test_flow_axe',sword:'test_flow_sword',chainSword:'test_flow_chain',qigu:'test_flow_qigu',claw:'test_flow_claw'};
    const slotItems={wpn:'test_flow_sword',boots:'test_flow_boots',shield:'test_flow_shield',cloak:'test_flow_cloak',helm:'test_flow_helm',armor:'test_flow_armor'};
    const everyRule=Object.entries(BUILD_FLOW_RULES).map(([id,rule])=>{
      const itemId=rule.gear==='slot'?slotItems[rule.slot]:kindItems[rule.gear];
      return {id,active:buildFlowAccess(owner([rule.skills[0]],{[rule.slot]:{id:itemId}}),id).active,noSkill:buildFlowAccess(owner([],{[rule.slot]:{id:itemId}}),id).active};
    });
    return {
      ruleCount:everyRule.length,
      inactiveRuleCount:everyRule.filter(x=>!x.active).length,
      noSkillActiveCount:everyRule.filter(x=>x.noSkill).length,
      royalActive:buildFlowAccess(royal,'royalValorBlade').active,
      royalTag:characterAffinityTagSnapshot(royal).has('流派:王者劍氣'),
      royalSupport:buildFlowSupportValue(royal,'royalValorBlade','royalValorDamagePct'),
      coreWithoutSkill:buildFlowAccess(noSkill,'royalValorBlade').active,
      coreDetected:buildFlowCoreEquipped(core,'royalValorBlade'),
      dragonActive:buildFlowAccess(dragon,'thunderDragonStorm').active,
      knightActive:buildFlowAccess(knight,'unyieldingFortress').active,
      bowRain:buildFlowAccess(archer,'multiArrowRain').active,
      bowJavelin:buildFlowAccess(archer,'thunderJavelin').active,
      launcherRain:buildFlowAccess(launcher,'multiArrowRain').active,
      launcherJavelin:buildFlowAccess(launcher,'thunderJavelin').active,
      sentryActive:buildFlowAccess(dark,'lightningSentry').active
    };
})()`, context);

assert.equal(result.ruleCount, 22, '共用流派表應完整登記 22 個流派');
assert.equal(result.inactiveRuleCount, 0, '有原技能與相符裝備時，每個流派都應可入場');
assert.equal(result.noSkillActiveCount, 0, '任何流派都不得繞過原技能資格');
assert.equal(result.royalActive, true, '普通單手劍＋勇猛意志應可進入王者劍氣流派');
assert.equal(result.royalTag, true, '流派入口應產生隱藏 Tag');
assert.equal(result.royalSupport, 20, '配套裝備應讀取流派狀態後生效');
assert.equal(result.coreWithoutSkill, false, '核心裝不得繞過原技能資格');
assert.equal(result.coreDetected, true, '指定核心仍應被辨識為特化裝');
assert.equal(result.dragonActive, true, '任意鎖鏈劍＋奪命之雷應可進入雷龍風暴');
assert.equal(result.knightActive, true, '任意盔甲＋增幅防禦應可進入不屈堡壘');
assert.equal(result.bowRain, true, '一般弓應進入多重箭雨');
assert.equal(result.bowJavelin, false, '一般弓不應同時進入雷霆標槍');
assert.equal(result.launcherRain, false, '投射鐵手甲不應同時進入多重箭雨');
assert.equal(result.launcherJavelin, true, '投射鐵手甲應進入雷霆標槍');
assert.equal(result.sentryActive, true, '任意鋼爪＋暗影之牙應可進入雷光哨衛');

const sourceFiles = [
 'js/37-meteor-rain-gear.js','js/38-thunder-javelin-gear.js','js/39-whirlwind-gear.js','js/40-leap-gear.js',
 'js/41-blessed-hammer-gear.js','js/42-shadow-clone-gear.js','js/43-vander-shockwave-gear.js','js/44-frost-dragon-chase-gear.js',
 'js/45-mind-echo-gear.js','js/46-rift-burst-gear.js','js/47-multi-arrow-rain-gear.js','js/48-charged-strike-gear.js',
 'js/51-lightning-sentry-gear.js','js/56-royal-command-gear.js','js/57-knight-shield-counter-gear.js','js/58-fire-dragon-form-gear.js',
 'js/59-royal-valor-blade-gear.js','js/60-knight-unyielding-fortress-gear.js','js/61-thunder-dragon-storm-gear.js'
];
sourceFiles.forEach(file => {
    const source=fs.readFileSync(path.join(root,file),'utf8');
    assert.match(source,/buildFlowSource\(player,/, `${file} 尚未改用共用流派入口`);
    assert.doesNotMatch(source,/return[^\n]*(?:\.core\s*===|===\s*[^\n]*\.core)/, `${file} 仍以指定核心作入場判定`);
});
const mageSource=fs.readFileSync(path.join(root,'js/36-d2r-gear-pack.js'),'utf8');
assert.match(mageSource,/arcaneLightningNext79/, '法師無核心時缺少靜電／連鎖輪替');
const supportSource=fs.readFileSync(path.join(root,'js/62-three-build-support-gear.js'),'utf8');
assert.doesNotMatch(supportSource,/沒有核心(?:武器|盔甲)時不會啟動技能/, '配套說明仍把核心裝當入場券');
const dropsSource=fs.readFileSync(path.join(root,'js/01-drops-config.js'),'utf8');
assert.match(dropsSource,/buildFlowCoreEquipped\(owner, buildId\)/, '核心裝 10% 原技能共鳴尚未接入技能倍率');

assert.deepEqual(Array.from(vm.runInContext(`getWeaponTags('wpn_whirlwind_axe')`, context)), ['雙手鈍器'], '風暴巨斧應是雙手鈍器');
assert.deepEqual(Array.from(vm.runInContext(`getWeaponTags('wpn_lightning_sentry_claw')`, context)), ['鋼爪'], '雷光哨衛鋼爪應可通過黑暗妖精裝備判定');
assert.deepEqual(Array.from(vm.runInContext(`getWeaponTags('wpn_royal_valor_blade')`, context)), ['單手劍'], '王者榮耀之劍應保留單手劍反擊機制');

const whirlwindSource=fs.readFileSync(path.join(root,'js/39-whirlwind-gear.js'),'utf8');
assert.match(whirlwindSource,/type:'wpn',w2h:true[^\n]*eff:'crush'[^\n]*ignHardSkin:true/, '風暴巨斧缺少雙手鈍器原生資料');
const lightningSource=fs.readFileSync(path.join(root,'js/51-lightning-sentry-gear.js'),'utf8');
assert.match(lightningSource,/comboRate:33,ignHardSkin:true/, '雷光哨衛鋼爪缺少鋼爪貫穿');
const thunderDragonSource=fs.readFileSync(path.join(root,'js/61-thunder-dragon-storm-gear.js'),'utf8');
assert.match(thunderDragonSource,/w2h:true,chainsword:true,weakExpose:true,ignHardSkin:true/, '雷脊鎖鏈劍缺少鎖鏈劍原生資料');

console.log('核心裝非流派入場券測試通過');
