// 👑🛡️🐉 王者劍氣／不屈堡壘／雷龍風暴配套裝備 v3.9.69
(function(){
'use strict';
if(typeof DB==='undefined'||!DB.items)return;

Object.assign(DB.items,{
 'hlm_royal_valor_crown':{
  n:'王者榮耀冠',img:'assets/icons/armors/克特頭盔.png',legend:true,
  type:'arm',slot:'helm',ac:5,mr:12,cha:2,req:'royal',reqLv:55,safe:4,
  p:230000,gachaWeight:5,royalValorChance:10,
  d:'王者劍氣配套裝備。裝備「王者榮耀之劍」時，王者劍氣的觸發機率 +10%；沒有核心武器時不會啟動技能。克特 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'clk_royal_lion_mantle':{
  n:'金獅戰意披風',img:'assets/icons/armors/紅色斗篷.png',legend:true,
  type:'arm',slot:'cloak',ac:4,mr:8,mhp:40,cha:1,req:'royal',reqLv:55,safe:4,
  p:240000,gachaWeight:5,royalValorDamagePct:20,
  d:'王者劍氣配套裝備。裝備「王者榮耀之劍」時，王者劍氣傷害 +20%；沒有核心武器時不會啟動技能。克特 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'glv_royal_swordwind':{
  n:'御前劍風護手',img:'assets/icons/armors/克特手套.png',legend:true,
  type:'arm',slot:'gloves',ac:3,meleeHit:3,str:1,req:'royal',reqLv:55,safe:4,
  p:250000,gachaWeight:5,royalValorExtraWaves:1,
  d:'王者劍氣配套裝備。裝備「王者榮耀之劍」時，每次發動額外斬出 1 道王者劍氣；沒有核心武器時不會啟動技能。克特 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'amu_royal_oath':{
  n:'王權誓約項鍊',img:'assets/icons/accessories/法令軍王之鍊.png',legend:true,unique:true,
  type:'acc',slot:'amulet',ac:0,mr:10,str:1,cha:2,req:'royal',reqLv:55,safe:0,
  p:290000,gachaWeight:5,royalValorCooldownPct:20,
  d:'王者劍氣配套裝備。裝備「王者榮耀之劍」時，王者劍氣的發動間隔縮短 20%；沒有核心武器時不會啟動技能。克特 2% 掉落。可正常獲得裝備詞綴。'
 },

 'hlm_unyielding_bastion':{
  n:'不屈壁壘戰盔',img:'assets/icons/armors/神聖執行團的頭盔.png',legend:true,
  type:'arm',slot:'helm',ac:5,con:2,mhp:40,req:'knight',reqLv:55,safe:4,
  p:230000,gachaWeight:5,unyieldingHitsReduced:1,
  d:'不屈堡壘配套裝備。裝備「不屈鋼心鎧」時，觸發堡壘所需的承傷次數 -1；沒有核心盔甲時不會啟動技能。古代巨人 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'shd_unyielding_bulwark':{
  n:'古代鋼心巨盾',img:'assets/icons/armors/笨重的鋼鐵石盾.png',legend:true,
  type:'arm',slot:'shield',ac:8,block:75,dr:4,con:1,req:'knight',reqLv:55,safe:4,
  p:270000,gachaWeight:5,unyieldingShieldPct:5,
  d:'不屈堡壘配套裝備。裝備「不屈鋼心鎧」時，不屈堡壘護盾增加 5% 最大生命；沒有核心盔甲時不會啟動技能。古代巨人 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'glv_unyielding_impact':{
  n:'堡壘震擊護手',img:'assets/icons/armors/鋼鐵手套.png',legend:true,
  type:'arm',slot:'gloves',ac:3,meleeHit:2,str:1,con:1,req:'knight',reqLv:55,safe:4,
  p:250000,gachaWeight:5,unyieldingDamagePct:20,
  d:'不屈堡壘配套裝備。裝備「不屈鋼心鎧」時，堡壘震波傷害 +20%；沒有核心盔甲時不會啟動技能。古代巨人 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'bot_unyielding_march':{
  n:'不退鋼軍戰靴',img:'assets/icons/armors/真．冥皇鋼靴.png',legend:true,
  type:'arm',slot:'boots',ac:5,mhp:50,dr:2,req:'knight',reqLv:55,safe:4,
  p:260000,gachaWeight:5,unyieldingCooldownPct:20,
  d:'不屈堡壘配套裝備。裝備「不屈鋼心鎧」時，不屈堡壘冷卻縮短 20%；沒有核心盔甲時不會啟動技能。古代巨人 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },

 'hlm_thunder_dragon_horn':{
  n:'雷龍角冠',img:'assets/icons/armors/雷光加護的頭飾.png',legend:true,
  type:'arm',slot:'helm',ac:5,wis:2,resWind:12,req:'dragon',reqLv:55,safe:4,
  p:240000,gachaWeight:5,thunderDragonDurationPct:25,
  d:'雷龍風暴配套裝備。裝備「林德拜爾雷脊鎖鏈劍」時，雷龍風暴持續時間 +25%；沒有核心武器時不會啟動技能。林德拜爾 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'clk_thunder_dragon_tempest':{
  n:'風暴龍翼披風',img:'assets/icons/armors/龍騎士斗篷.png',legend:true,
  type:'arm',slot:'cloak',ac:5,mr:10,resWind:15,req:'dragon',reqLv:55,safe:4,
  p:250000,gachaWeight:5,thunderDragonDamagePct:20,
  d:'雷龍風暴配套裝備。裝備「林德拜爾雷脊鎖鏈劍」時，雷龍風暴傷害 +20%；沒有核心武器時不會啟動技能。林德拜爾 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'glv_thunder_dragon_spine':{
  n:'雷脊導引護手',img:'assets/icons/armors/龍鱗臂甲.png',legend:true,
  type:'arm',slot:'gloves',ac:3,meleeHit:2,str:1,wis:1,req:'dragon',reqLv:55,safe:4,
  p:260000,gachaWeight:5,thunderDragonExtraBolts:1,
  d:'雷龍風暴配套裝備。裝備「林德拜爾雷脊鎖鏈劍」時，每次雷暴脈衝額外降下 1 道雷束；沒有核心武器時不會啟動技能。林德拜爾 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'bot_thunder_dragon_step':{
  n:'逐雷龍步戰靴',img:'assets/icons/armors/勇氣長靴.png',legend:true,
  type:'arm',slot:'boots',ac:4,er:5,resWind:10,req:'dragon',reqLv:55,safe:4,
  p:260000,gachaWeight:5,thunderDragonCadencePct:20,
  d:'雷龍風暴配套裝備。裝備「林德拜爾雷脊鎖鏈劍」時，雷暴脈衝間隔縮短 20%；與詞綴合計後最低為 0.3 秒。沒有核心武器時不會啟動技能。林德拜爾 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 }
});

function addDrops(mob,ids){
 if(typeof MOB_DROPS!=='object')return;
 let rows=MOB_DROPS[mob]||(MOB_DROPS[mob]=[]);
 ids.forEach(id=>{if(!rows.some(row=>row&&row[0]===id))rows.push([id,2])});
}
addDrops('克特',['hlm_royal_valor_crown','clk_royal_lion_mantle','glv_royal_swordwind','amu_royal_oath']);
addDrops('古代巨人',['hlm_unyielding_bastion','shd_unyielding_bulwark','glv_unyielding_impact','bot_unyielding_march']);
addDrops('林德拜爾',['hlm_thunder_dragon_horn','clk_thunder_dragon_tempest','glv_thunder_dragon_spine','bot_thunder_dragon_step']);
})();
