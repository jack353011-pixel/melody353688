// ⚔️🔮 v3.9.74：血斧追獵／泰坦逆壁／立方共鳴／痛覺鏡界配套裝備。
// 每個流派雖有四個方向，同時最多只讀取兩項主要專精，避免「全裝」壓過取捨。
(function(){
'use strict';
if(typeof DB==='undefined'||!DB.items)return;

Object.assign(DB.items,{
 'hlm_blood_hunt_scent':{
  n:'嗅血追跡戰盔',img:'assets/icons/armors/戰士團頭盔.png',legend:true,type:'arm',slot:'helm',ac:5,str:1,mhp:35,req:'warrior',reqLv:50,safe:4,
  p:230000,gachaWeight:5,bloodHuntCooldownPct:20,flowSupport:'bloodAxeHunt',flowSupportLabel:'追擊節奏',
  d:'血斧追獵配套裝備。設為「流派:血斧追獵」主要專精時，追擊間隔縮短20%（最低1.2秒）。同流派最多啟用2項主要專精；流派由戰斧投擲＋任意斧啟動，不要求鮮血追獵斧。古代巨人2%掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'clk_blood_hunt_trail':{
  n:'赤痕獵路披風',img:'assets/icons/armors/炎魔的血光斗篷.png',legend:true,type:'arm',slot:'cloak',ac:4,mr:8,mhp:35,req:'warrior',reqLv:50,safe:4,
  p:235000,gachaWeight:5,bloodHuntExtendTicks:10,flowSupport:'bloodAxeHunt',flowSupportLabel:'傷口延續',
  d:'血斧追獵配套裝備。設為主要專精時，追擊使既有流血額外延長1秒；流血總剩餘時間仍受10秒硬上限限制。同流派最多啟用2項主要專精。古代巨人2%掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'glv_blood_hunt_rend':{
  n:'裂創追獵護手',img:'assets/icons/armors/力量手套.png',legend:true,type:'arm',slot:'gloves',ac:3,meleeHit:2,str:1,req:'warrior',reqLv:50,safe:4,
  p:245000,gachaWeight:5,bloodHuntBleedScalePct:20,flowSupport:'bloodAxeHunt',flowSupportLabel:'流血轉傷',
  d:'血斧追獵配套裝備。設為主要專精時，追擊由既有流血換算的傷害提高20%；不增加流血層數，頭目比例上限照常。同流派最多啟用2項主要專精。古代巨人2%掉落。可正常獲得詞綴、洞數與寶石效果。'
 },
 'bot_blood_hunt_giant':{
  n:'巨獸逐血戰靴',img:'assets/icons/armors/勇氣長靴.png',legend:true,type:'arm',slot:'boots',ac:4,str:1,dr:1,req:'warrior',reqLv:50,safe:4,
  p:250000,gachaWeight:5,bloodHuntBossCapPct:.2,flowSupport:'bloodAxeHunt',flowSupportLabel:'巨獸追獵',
  d:'血斧追獵配套裝備。設為主要專精時，對頭目追擊的生命比例上限由0.6%提高至0.8%；一般敵人上限不變。同流派最多啟用2項主要專精。古代巨人2%掉落。可正常獲得詞綴、洞數與寶石效果。'
 },

 'hlm_titan_endure':{
  n:'泰坦承震戰盔',img:'assets/icons/armors/巴蘭卡頭盔.png',legend:true,type:'arm',slot:'helm',ac:6,con:2,mhp:45,req:'warrior',reqLv:55,safe:4,
  p:245000,gachaWeight:5,titanWallHitsReduced:1,flowSupport:'titanWall',flowSupportLabel:'逆壁蓄力',
  d:'泰坦逆壁配套裝備。設為「流派:泰坦逆壁」主要專精時，形成護盾所需承傷次數由3次降為2次。同流派最多啟用2項主要專精；流派由任一泰坦技能＋重甲啟動，不要求泰坦逆壁重鎧。古代巨人2%掉落。'
 },
 'clk_titan_pressure':{
  n:'巨壓不退披風',img:'assets/icons/armors/戰士團斗篷.png',legend:true,type:'arm',slot:'cloak',ac:5,mr:10,con:1,req:'warrior',reqLv:55,safe:4,
  p:250000,gachaWeight:5,titanWallReducePct:3,flowSupport:'titanWall',flowSupportLabel:'危境減傷',
  d:'泰坦逆壁配套裝備。設為主要專精時，低生命直接傷害減免由12%提高至15%；不影響持續傷害。同流派最多啟用2項主要專精。古代巨人2%掉落。'
 },
 'glv_titan_bulwark':{
  n:'逆壁鋼心護手',img:'assets/icons/armors/鋼鐵手套.png',legend:true,type:'arm',slot:'gloves',ac:4,dr:2,con:1,req:'warrior',reqLv:55,safe:4,
  p:255000,gachaWeight:5,titanWallShieldPct:2,flowSupport:'titanWall',flowSupportLabel:'逆壁護盾',
  d:'泰坦逆壁配套裝備。設為主要專精時，逆壁護盾增加2%最大生命；核心重鎧的1%特化仍可疊加，但總值受硬上限限制。同流派最多啟用2項主要專精。古代巨人2%掉落。'
 },
 'bot_titan_recover':{
  n:'泰坦復勢戰靴',img:'assets/icons/armors/鋼鐵長靴.png',legend:true,type:'arm',slot:'boots',ac:5,mhp:45,dr:1,req:'warrior',reqLv:55,safe:4,
  p:260000,gachaWeight:5,titanWallCooldownPct:20,flowSupport:'titanWall',flowSupportLabel:'逆壁復勢',
  d:'泰坦逆壁配套裝備。設為主要專精時，護盾冷卻縮短20%（最低5秒）。同流派最多啟用2項主要專精；其餘裝備能力照常生效。古代巨人2%掉落。'
 },

 'hlm_cube_ember':{
  n:'燃相幻視冠',img:'assets/icons/armors/紅騎士頭巾.png',legend:true,type:'arm',slot:'helm',ac:4,int:2,resFire:10,req:'illusion',reqLv:50,safe:4,
  p:240000,gachaWeight:5,cubeBurnDamagePct:20,flowSupport:'cubeResonance',flowSupportLabel:'燃燒共鳴',
  d:'立方共鳴配套裝備。設為「流派:立方共鳴」主要專精時，燃燒共鳴追傷提高20%；頭目生命比例上限不變。同流派最多啟用2項主要專精；流派由任一立方＋任意奇古獸啟動。僅最後施放的一種立方產生共鳴。不幸的幻象眼魔2%掉落。'
 },
 'clk_cube_quake':{
  n:'地相沉著披風',img:'assets/icons/armors/地屬性斗篷.png',legend:true,type:'arm',slot:'cloak',ac:5,mr:10,con:1,resEarth:10,req:'illusion',reqLv:50,safe:4,
  p:245000,gachaWeight:5,cubeQuakeShieldPct:1,flowSupport:'cubeResonance',flowSupportLabel:'地裂共鳴',
  d:'立方共鳴配套裝備。設為主要專精時，地裂共鳴護盾增加1%最大生命；週期與護盾覆蓋方式不變。同流派最多啟用2項主要專精。不幸的幻象眼魔2%掉落。'
 },
 'glv_cube_shock':{
  n:'衝相導流護手',img:'assets/icons/armors/風靈手套.png',legend:true,type:'arm',slot:'gloves',ac:3,int:1,wis:1,resWind:10,req:'illusion',reqLv:50,safe:4,
  p:250000,gachaWeight:5,cubeShockChancePct:10,flowSupport:'cubeResonance',flowSupportLabel:'衝擊共鳴',
  d:'立方共鳴配套裝備。設為主要專精時，衝擊共鳴短暫控制機率由20%提高至30%；仍每4秒最多判定一次。同流派最多啟用2項主要專精。不幸的幻象眼魔2%掉落。'
 },
 'bot_cube_harmony':{
  n:'和相循環法靴',img:'assets/icons/armors/魔力泉源長靴.png',legend:true,type:'arm',slot:'boots',ac:4,mmp:40,mpR:3,wis:1,req:'illusion',reqLv:50,safe:4,
  p:255000,gachaWeight:5,cubeHarmonyRecoverPct:1,flowSupport:'cubeResonance',flowSupportLabel:'和諧共鳴',
  d:'立方共鳴配套裝備。設為主要專精時，和諧共鳴回魔由2%提高至3%最大MP；單次仍受20MP硬上限限制。同流派最多啟用2項主要專精。不幸的幻象眼魔2%掉落。'
 },

 'hlm_pain_awaken':{
  n:'痛覺甦醒冠',img:'assets/icons/armors/混沌頭盔.png',legend:true,type:'arm',slot:'helm',ac:4,wis:2,mhp:35,req:'illusion',reqLv:55,safe:4,
  p:245000,gachaWeight:5,painMirrorThresholdPct:2,flowSupport:'painMirror',flowSupportLabel:'蓄痛門檻',
  d:'痛覺鏡界配套裝備。設為「流派:痛覺鏡界」主要專精時，護盾轉化門檻由累積10%最大生命傷害降為8%。同流派最多啟用2項主要專精；流派由疼痛的歡愉＋任意身甲啟動。邪惡的鐮刀死神2%掉落。'
 },
 'clk_pain_veil':{
  n:'受苦靜默披風',img:'assets/icons/armors/混沌斗篷.png',legend:true,type:'arm',slot:'cloak',ac:5,mr:12,wis:1,req:'illusion',reqLv:55,safe:4,
  p:250000,gachaWeight:5,painMirrorReducePct:3,flowSupport:'painMirror',flowSupportLabel:'痛覺減傷',
  d:'痛覺鏡界配套裝備。設為主要專精時，直接傷害減免由8%提高至11%；持續傷害與原本反射不受影響。同流派最多啟用2項主要專精。邪惡的鐮刀死神2%掉落。'
 },
 'glv_pain_convert':{
  n:'鏡痛轉化護手',img:'assets/icons/armors/墮落手套.png',legend:true,type:'arm',slot:'gloves',ac:3,wis:1,dr:1,req:'illusion',reqLv:55,safe:4,
  p:255000,gachaWeight:5,painMirrorShieldPct:2,flowSupport:'painMirror',flowSupportLabel:'鏡界護盾',
  d:'痛覺鏡界配套裝備。設為主要專精時，鏡界護盾增加2%最大生命；核心幻甲的1%特化仍可疊加，但總值受硬上限限制。同流派最多啟用2項主要專精。邪惡的鐮刀死神2%掉落。'
 },
 'bot_pain_return':{
  n:'痛返幽影法靴',img:'assets/icons/armors/影子長靴.png',legend:true,type:'arm',slot:'boots',ac:4,er:4,mmp:30,req:'illusion',reqLv:55,safe:4,
  p:260000,gachaWeight:5,painMirrorCooldownPct:20,flowSupport:'painMirror',flowSupportLabel:'鏡界復甦',
  d:'痛覺鏡界配套裝備。設為主要專精時，護盾轉化冷卻縮短20%（最低5秒）。同流派最多啟用2項主要專精；其餘裝備能力照常生效。邪惡的鐮刀死神2%掉落。'
 }
});

function addDrops(mob,ids){
 if(typeof MOB_DROPS!=='object')return;
 let rows=MOB_DROPS[mob]||(MOB_DROPS[mob]=[]);
 ids.forEach(id=>{if(!rows.some(row=>row&&row[0]===id))rows.push([id,2])});
}
addDrops('古代巨人',['hlm_blood_hunt_scent','clk_blood_hunt_trail','glv_blood_hunt_rend','bot_blood_hunt_giant','hlm_titan_endure','clk_titan_pressure','glv_titan_bulwark','bot_titan_recover']);
addDrops('不幸的幻象眼魔',['hlm_cube_ember','clk_cube_quake','glv_cube_shock','bot_cube_harmony']);
addDrops('邪惡的鐮刀死神',['hlm_pain_awaken','clk_pain_veil','glv_pain_convert','bot_pain_return']);
})();
