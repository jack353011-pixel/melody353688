// 👑🛡️🐉 王者劍氣／不屈堡壘／雷龍風暴配套裝備 v3.9.69
(function(){
'use strict';
if(typeof DB==='undefined'||!DB.items)return;

Object.assign(DB.items,{
 'hlm_royal_valor_crown':{
  n:'王者榮耀冠',img:'assets/icons/armors/克特頭盔.png',legend:true,
  type:'arm',slot:'helm',ac:5,mr:12,cha:2,req:'royal',reqLv:55,safe:4,
  p:230000,gachaWeight:5,royalValorChance:10,
  d:'王者劍氣配套裝備。具備「流派:王者劍氣」時，王者劍氣觸發機率 +10%。流派由勇猛意志＋單手劍啟動，不要求指定核心武器。克特 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'clk_royal_lion_mantle':{
  n:'金獅戰意披風',img:'assets/icons/armors/紅色斗篷.png',legend:true,
  type:'arm',slot:'cloak',ac:4,mr:8,mhp:40,cha:1,req:'royal',reqLv:55,safe:4,
  p:240000,gachaWeight:5,royalValorDamagePct:20,
  d:'王者劍氣配套裝備。具備「流派:王者劍氣」時，王者劍氣傷害 +20%。流派由勇猛意志＋單手劍啟動，不要求指定核心武器。克特 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'glv_royal_swordwind':{
  n:'御前劍風護手',img:'assets/icons/armors/克特手套.png',legend:true,
  type:'arm',slot:'gloves',ac:3,meleeHit:3,str:1,req:'royal',reqLv:55,safe:4,
  p:250000,gachaWeight:5,royalValorExtraWaves:1,
  d:'王者劍氣配套裝備。具備「流派:王者劍氣」時，每次發動額外斬出 1 道王者劍氣。流派由勇猛意志＋單手劍啟動，不要求指定核心武器。克特 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'amu_royal_oath':{
  n:'王權誓約項鍊',img:'assets/icons/accessories/法令軍王之鍊.png',legend:true,unique:true,
  type:'acc',slot:'amulet',ac:0,mr:10,str:1,cha:2,req:'royal',reqLv:55,safe:0,
  p:290000,gachaWeight:5,royalValorCooldownPct:20,
  d:'王者劍氣配套裝備。具備「流派:王者劍氣」時，王者劍氣發動間隔縮短 20%。流派由勇猛意志＋單手劍啟動，不要求指定核心武器。克特 2% 掉落。可正常獲得裝備詞綴。'
 },

 'hlm_unyielding_bastion':{
  n:'不屈壁壘戰盔',img:'assets/icons/armors/神聖執行團的頭盔.png',legend:true,
  type:'arm',slot:'helm',ac:5,con:2,mhp:40,req:'knight',reqLv:55,safe:4,
  p:230000,gachaWeight:5,unyieldingHitsReduced:1,
  d:'不屈堡壘配套裝備。具備「流派:不屈堡壘」時，觸發所需承傷次數 -1。流派由增幅防禦＋任意盔甲啟動，不要求指定核心盔甲。古代巨人 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'shd_unyielding_bulwark':{
  n:'古代鋼心巨盾',img:'assets/icons/armors/笨重的鋼鐵石盾.png',legend:true,
  type:'arm',slot:'shield',ac:8,block:75,dr:4,con:1,req:'knight',reqLv:55,safe:4,
  p:270000,gachaWeight:5,unyieldingShieldPct:5,
  d:'不屈堡壘配套裝備。具備「流派:不屈堡壘」時，護盾增加 5% 最大生命。流派由增幅防禦＋任意盔甲啟動，不要求指定核心盔甲。古代巨人 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'glv_unyielding_impact':{
  n:'堡壘震擊護手',img:'assets/icons/armors/鋼鐵手套.png',legend:true,
  type:'arm',slot:'gloves',ac:3,meleeHit:2,str:1,con:1,req:'knight',reqLv:55,safe:4,
  p:250000,gachaWeight:5,unyieldingDamagePct:20,
  d:'不屈堡壘配套裝備。具備「流派:不屈堡壘」時，堡壘震波傷害 +20%。流派由增幅防禦＋任意盔甲啟動，不要求指定核心盔甲。古代巨人 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'bot_unyielding_march':{
  n:'不退鋼軍戰靴',img:'assets/icons/armors/真．冥皇鋼靴.png',legend:true,
  type:'arm',slot:'boots',ac:5,mhp:50,dr:2,req:'knight',reqLv:55,safe:4,
  p:260000,gachaWeight:5,unyieldingCooldownPct:20,
  d:'不屈堡壘配套裝備。具備「流派:不屈堡壘」時，冷卻縮短 20%。流派由增幅防禦＋任意盔甲啟動，不要求指定核心盔甲。古代巨人 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },

 'hlm_thunder_dragon_horn':{
  n:'雷龍角冠',img:'assets/icons/armors/雷光加護的頭飾.png',legend:true,
  type:'arm',slot:'helm',ac:5,wis:2,resWind:12,req:'dragon',reqLv:55,safe:4,
  p:240000,gachaWeight:5,thunderDragonDurationPct:25,
  d:'雷龍風暴配套裝備。具備「流派:雷龍風暴」時，持續時間 +25%。流派由奪命之雷＋任意鎖鏈劍啟動，不要求指定核心武器。林德拜爾 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'clk_thunder_dragon_tempest':{
  n:'風暴龍翼披風',img:'assets/icons/armors/龍騎士斗篷.png',legend:true,
  type:'arm',slot:'cloak',ac:5,mr:10,resWind:15,req:'dragon',reqLv:55,safe:4,
  p:250000,gachaWeight:5,thunderDragonDamagePct:20,
  d:'雷龍風暴配套裝備。具備「流派:雷龍風暴」時，雷龍風暴傷害 +20%。流派由奪命之雷＋任意鎖鏈劍啟動，不要求指定核心武器。林德拜爾 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'glv_thunder_dragon_spine':{
  n:'雷脊導引護手',img:'assets/icons/armors/龍鱗臂甲.png',legend:true,
  type:'arm',slot:'gloves',ac:3,meleeHit:2,str:1,wis:1,req:'dragon',reqLv:55,safe:4,
  p:260000,gachaWeight:5,thunderDragonExtraBolts:1,
  d:'雷龍風暴配套裝備。具備「流派:雷龍風暴」時，每次雷暴脈衝額外降下 1 道雷束。流派由奪命之雷＋任意鎖鏈劍啟動，不要求指定核心武器。林德拜爾 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'bot_thunder_dragon_step':{
  n:'逐雷龍步戰靴',img:'assets/icons/armors/勇氣長靴.png',legend:true,
  type:'arm',slot:'boots',ac:4,er:5,resWind:10,req:'dragon',reqLv:55,safe:4,
  p:260000,gachaWeight:5,thunderDragonCadencePct:20,
  d:'雷龍風暴配套裝備。具備「流派:雷龍風暴」時，雷暴脈衝間隔縮短 20%；與詞綴合計後最低為 0.3 秒。流派由奪命之雷＋任意鎖鏈劍啟動，不要求指定核心武器。林德拜爾 2% 掉落。可正常獲得詞綴、洞數與寶石效果。'
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

// 🧩 v3.9.70 技能觸發熱修：先集中驗證，穩定後再拆回各技能檔。
(function(){
'use strict';
const FANG='sk_dark_fang',STEALTH='sk_dark_stealth';

function equipCore(slot,core){
 let item=player&&player.eq&&player.eq[slot],def=item&&DB.items[item.id];
 return !!(item&&def&&def.core===core);
}
function totals(){return typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{}}
function living(){return typeof mapState!=='undefined'&&mapState&&Array.isArray(mapState.mobs)?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[]}
function sentryBonus(){let t=totals();return{trt:Math.min(60,Number(t.trt)||0),trc:Math.min(50,Number(t.trc)||0)}}
function cloneBonus(){let t=totals();return{shn:Math.min(2,Math.floor(Number(t.shn)||0)),sht:Math.min(60,Number(t.sht)||0),shc:Math.min(40,Number(t.shc)||0)}}

function deploySentryFallback(){
 if(!player||player.cls!=='dark'||player.dead||!equipCore('wpn','lightningSentry')||(Number(player.lightningSentryCd313)||0)>0)return false;
 let b=sentryBonus();
 player.lightningSentryCd313=Math.max(60,Math.round(120*(1-b.trc/100)));
 player.lightningSentryActive313=Math.round(60*(1+b.trt/100));
 player.lightningSentryNext313=1;
 if(typeof logCombat==='function')logCombat('<span class="text-cyan-200 font-bold">【雷光哨衛鋼爪】</span>觸發保險補上雷光哨衛部署。','player-special');
 return true;
}
function deployCloneFallback(){
 if(!player||player.cls!=='dark'||player.dead||!equipCore('cloak','shadowClone')||(Number(player.shadowCloneCd93)||0)>0||!living().length)return false;
 let b=cloneBonus();
 player.shadowCloneCd93=Math.max(70,Math.round(140*(1-b.shc/100)));
 player.shadowClone93={left:Math.round(60*(1+b.sht/100)),next:1,count:1+b.shn,hit:0,anim:0};
 if(typeof logCombat==='function')logCombat('<span class="text-fuchsia-300 font-bold">【暗影幻身斗篷】</span>敵人出現，補上先前暗隱術的暗影分身。','player-special');
 return true;
}
function ensureLatch(){
 if(!player)return;
 if(!Number.isFinite(player._skillHotfixFangSeen370))player._skillHotfixFangSeen370=0;
 if(!Number.isFinite(player._skillHotfixStealthSeen370))player._skillHotfixStealthSeen370=0;
 if(typeof player._skillHotfixFangHandled370!=='boolean')player._skillHotfixFangHandled370=false;
 if(typeof player._skillHotfixStealthHandled370!=='boolean')player._skillHotfixStealthHandled370=false;
}
function syncFallbacks(){
 if(typeof player==='undefined'||!player)return;
 ensureLatch();
 let fang=Number(player.buffs&&player.buffs[FANG])||0,fangPrev=Number(player._skillHotfixFangSeen370)||0;
 if(fang<=0)player._skillHotfixFangHandled370=false;
 else{
  if(fang>fangPrev+1)player._skillHotfixFangHandled370=false;
  if(!equipCore('wpn','lightningSentry')||player.cls!=='dark')player._skillHotfixFangHandled370=true;
  else if((Number(player.lightningSentryActive313)||0)>0||(Number(player.lightningSentryCd313)||0)>0)player._skillHotfixFangHandled370=true;
  else if(!player._skillHotfixFangHandled370&&deploySentryFallback())player._skillHotfixFangHandled370=true;
 }
 player._skillHotfixFangSeen370=fang;

 let stealth=Number(player.buffs&&player.buffs[STEALTH])||0,stealthPrev=Number(player._skillHotfixStealthSeen370)||0;
 if(stealth<=0)player._skillHotfixStealthHandled370=false;
 else{
  if(stealth>stealthPrev+1)player._skillHotfixStealthHandled370=false;
  if(!equipCore('cloak','shadowClone')||player.cls!=='dark')player._skillHotfixStealthHandled370=true;
  else if(player.shadowClone93||(Number(player.shadowCloneCd93)||0)>0)player._skillHotfixStealthHandled370=true;
  else if(!player._skillHotfixStealthHandled370&&living().length&&deployCloneFallback())player._skillHotfixStealthHandled370=true;
 }
 player._skillHotfixStealthSeen370=stealth;
}

let oldTick370=window.tick;
if(typeof oldTick370==='function'){
 window.tick=function(){
  if(typeof state!=='undefined'&&!state.running)return;
  if(typeof player!=='undefined'&&player&&player.dead)return;
  let result=oldTick370.apply(this,arguments);
  try{syncFallbacks()}catch(e){if(typeof console!=='undefined'&&console.warn)console.warn('[skill-trigger-hotfix]',e)}
  return result;
 };
 if(typeof tick==='function')tick=window.tick;
}
})();
