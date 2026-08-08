// 🔥❄️⚡ 馬賽克流派支援裝備 v3.9.12
(function(){
'use strict';
if(typeof DB==='undefined'||!DB.items)return;

Object.assign(DB.items,{
 'hlm_mosaic_gaze':{
  n:'萬象凝視頭飾',img:'assets/icons/armors/黑暗頭飾.png',legend:true,
  type:'arm',slot:'helm',ac:3,mr:8,dex:2,req:'dark',reqLv:60,safe:4,
  p:180000,gachaWeight:5,mosaicChargeTimePct:25,
  d:'馬賽克支援裝備。裝備馬賽克符文武器時，元素蓄能保存時間 +25%；沒有馬賽克武器時不會啟動技能。可正常獲得詞綴、洞數與寶石效果。'
 },
 'glv_mosaic_talon':{
  n:'鳳凰聚氣手甲',img:'assets/icons/armors/混沌手套.png',legend:true,
  type:'arm',slot:'gloves',ac:2,meleeHit:2,dex:1,req:'dark',reqLv:60,safe:4,
  p:200000,gachaWeight:5,mosaicExtraChargeRate:30,
  d:'馬賽克支援裝備。雙重破壞期間，成功普攻累積馬賽克蓄能時有 30% 機率額外獲得 1 層；蓄能上限仍為 3 層。可正常獲得詞綴、洞數與寶石效果。'
 },
 'bot_mosaic_dance':{
  n:'龍爪幻舞長靴',img:'assets/icons/armors/影子長靴.png',legend:true,
  type:'arm',slot:'boots',ac:3,er:5,dex:1,req:'dark',reqLv:60,safe:4,
  p:210000,gachaWeight:5,mosaicCooldownPct:10,
  d:'馬賽克支援裝備。馬賽克元素終結的獨立冷卻縮短 10%；與詞綴合計後冷卻最低仍為 5 秒。可正常獲得詞綴、洞數與寶石效果。'
 },
 'amu_mosaic_prism':{
  n:'稜光萬象護符',img:'assets/icons/accessories/黑法師項鍊.png',legend:true,unique:true,
  type:'acc',slot:'amulet',ac:0,mr:8,dex:2,mmp:40,req:'dark',reqLv:60,safe:0,
  p:260000,gachaWeight:5,mosaicPenetration:12,
  d:'馬賽克支援裝備。馬賽克元素終結獲得 12% 元素穿透，計算時降低目標火、水、風抗性，並降低 24 點有效 MR；不影響原本會心一擊。可正常獲得裝備詞綴。'
 }
});
})();
