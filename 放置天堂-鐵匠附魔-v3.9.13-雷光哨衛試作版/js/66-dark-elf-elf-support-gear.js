// 🌑🌿 v3.9.75：蝕毒雙刃／魔石伏擊／火勢劍舞／精靈號令配套裝備。
// 每個流派同時最多讀取兩項主要專精，未專精的物品仍保留基礎屬性、詞綴、孔洞與嵌入物。
(function(){
'use strict';
if(typeof DB==='undefined'||!DB.items)return;
Object.assign(DB.items,{
 hlm_venom_relay:{n:'蝕痕渡毒冠',img:'assets/icons/armors/死亡騎士頭盔.png',legend:true,type:'arm',slot:'helm',ac:4,dex:2,mhp:30,safe:4,p:235000,gachaWeight:5,venomTransferPct:20,flowSupport:'venomTwinblades',flowSupportLabel:'毒性轉移',d:'蝕毒雙刃配套。設為主要專精時，換目標轉移的毒性強度由50%提高至70%；不新增毒層，也不引爆。同流派最多啟用2項主要專精。魔獸軍王巴蘭卡2%掉落。'},
 clk_venom_route:{n:'毒影迴路斗篷',img:'assets/icons/armors/黑暗斗篷.png',legend:true,type:'arm',slot:'cloak',ac:4,mr:10,er:3,safe:4,p:240000,gachaWeight:5,venomTransferCooldownPct:20,flowSupport:'venomTwinblades',flowSupportLabel:'轉刃節奏',d:'蝕毒雙刃配套。設為主要專精時，毒性轉移間隔縮短20%（最低2.4秒）。不改變原附加劇毒的觸發率。同流派最多啟用2項。巴蘭卡2%掉落。'},
 glv_venom_pressure:{n:'腐勢毒刃手套',img:'assets/icons/armors/黑暗手套.png',legend:true,type:'arm',slot:'gloves',ac:3,meleeHit:2,dex:1,safe:4,p:245000,gachaWeight:5,venomWeakenTicks:10,flowSupport:'venomTwinblades',flowSupportLabel:'大型腐勢',d:'蝕毒雙刃配套。設為主要專精時，大型敵人的毒勢衰弱多維持1秒；不轉為純傷害倍率。同流派最多啟用2項。巴蘭卡2%掉落。'},
 bot_venom_pursuit:{n:'蝕月追跡長靴',img:'assets/icons/armors/黑暗長靴.png',legend:true,type:'arm',slot:'boots',ac:4,dex:1,dr:1,safe:4,p:250000,gachaWeight:5,venomWeakenCooldownPct:20,flowSupport:'venomTwinblades',flowSupportLabel:'腐勢循環',d:'蝕毒雙刃配套。設為主要專精時，大型敵人腐勢的內部間隔縮短20%（最低3秒）。同流派最多啟用2項。巴蘭卡2%掉落。'},

 hlm_darkstone_delay:{n:'靜黑法流冠',img:'assets/icons/armors/抗魔法頭盔.png',legend:true,type:'arm',slot:'helm',ac:4,wis:2,mmp:25,safe:4,p:235000,gachaWeight:5,darkstoneDelayTicks:5,flowSupport:'darkstoneAmbush',flowSupportLabel:'施法推遲',d:'魔石伏擊配套。設為主要專精時，黑魔石對敵方所有法術的推遲增加0.5秒，總推遲仍有硬上限。同流派最多啟用2項。暗殺軍王史雷佛2%掉落。'},
 clk_darkstone_return:{n:'伏影回聲斗篷',img:'assets/icons/armors/隱身斗篷.png',legend:true,type:'arm',slot:'cloak',ac:4,mr:12,wis:1,safe:4,p:240000,gachaWeight:5,darkstoneCooldownPct:20,flowSupport:'darkstoneAmbush',flowSupportLabel:'伏擊復位',d:'魔石伏擊配套。設為主要專精時，魔石伏擊冷卻縮短20%（最低6秒）。仍只在命中有法術的敵人時消耗材料。同流派最多啟用2項。史雷佛2%掉落。'},
 glv_darkstone_frugal:{n:'黑曜節石護手',img:'assets/icons/armors/暗殺軍王手套.png',legend:true,type:'arm',slot:'gloves',ac:3,wis:1,meleeHit:2,safe:4,p:245000,gachaWeight:5,darkstonePreserveEvery:3,flowSupport:'darkstoneAmbush',flowSupportLabel:'魔石回響',d:'魔石伏擊配套。設為主要專精時，每第3次成功伏擊由魔石回響代替消耗；背包仍需有至少1顆未鎖定二級黑魔石。無隨機退料，方便掌握消耗。同流派最多啟用2項。史雷佛2%掉落。'},
 bot_darkstone_muffle:{n:'沉默伏行靴',img:'assets/icons/armors/拉斯塔巴德長靴.png',legend:true,type:'arm',slot:'boots',ac:4,er:3,mpR:2,safe:4,p:250000,gachaWeight:5,darkstoneWeakenTicks:10,flowSupport:'darkstoneAmbush',flowSupportLabel:'魔力失衡',d:'魔石伏擊配套。設為主要專精時，成功伏擊同時使敵人衰弱1秒；不附加額外傷害。同流派最多啟用2項。史雷佛2%掉落。'},

 hlm_flame_rhythm:{n:'踏燼節奏冠',img:'assets/icons/armors/無頭騎士的餘火.png',legend:true,type:'arm',slot:'helm',ac:4,str:1,resFire:10,safe:4,p:235000,gachaWeight:5,flameHeatGain:4,flowSupport:'flameSwordDance',flowSupportLabel:'熱勢累積',d:'火勢劍舞配套。設為主要專精時，每次命中的熱勢獲得由12提高至16；不直接放大傷害。同流派最多啟用2項。火靈之主2%掉落。'},
 clk_flame_hold:{n:'餘焰留步斗篷',img:'assets/icons/armors/火屬性斗篷.png',legend:true,type:'arm',slot:'cloak',ac:4,mr:10,resFire:10,safe:4,p:240000,gachaWeight:5,flameHeatHoldTicks:5,flowSupport:'flameSwordDance',flowSupportLabel:'餘焰維持',d:'火勢劍舞配套。設為主要專精時，停止命中後的熱勢衰退間隔延長0.5秒；不延長烈焰之魂本身。同流派最多啟用2項。火靈之主2%掉落。'},
 glv_flame_press:{n:'火勢壓步護手',img:'assets/icons/armors/火靈手套.png',legend:true,type:'arm',slot:'gloves',ac:3,meleeHit:2,str:1,safe:4,p:245000,gachaWeight:5,flameDelayTicks:3,flowSupport:'flameSwordDance',flowSupportLabel:'壓步干擾',d:'火勢劍舞配套。設為主要專精時，消耗熱勢造成的敵方物理行動推遲增加0.3秒；對頭目仍受較低上限。同流派最多啟用2項。火靈之主2%掉落。'},
 bot_flame_guard:{n:'踏火卸勢長靴',img:'assets/icons/armors/勇氣長靴.png',legend:true,type:'arm',slot:'boots',ac:4,dr:1,resFire:8,safe:4,p:250000,gachaWeight:5,flameGuardReducePct:3,flowSupport:'flameSwordDance',flowSupportLabel:'熱勢卸力',d:'火勢劍舞配套。設為主要專精時，熱勢防守的直接傷害減免由8%提高至11%；每次仍需消耗20熱勢且有5秒冷卻。同流派最多啟用2項。火靈之主2%掉落。'},

 hlm_spirit_relay:{n:'四靈傳令冠',img:'assets/icons/armors/精靈敏捷頭盔.png',legend:true,type:'arm',slot:'helm',ac:4,cha:2,mmp:30,safe:4,p:235000,gachaWeight:5,spiritCommandCooldownPct:20,flowSupport:'spiritCommand',flowSupportLabel:'號令輪轉',d:'精靈號令配套。設為主要專精時，四屬性號令共用冷卻縮短20%（最低5秒）。不新增精靈數量。同流派最多啟用2項。四大夢幻之島精靈王共用2%掉落。'},
 clk_spirit_tide:{n:'水靈納息斗篷',img:'assets/icons/armors/水屬性斗篷.png',legend:true,type:'arm',slot:'cloak',ac:4,mr:10,cha:1,resWater:10,safe:4,p:240000,gachaWeight:5,spiritWaterHealPct:2,flowSupport:'spiritCommand',flowSupportLabel:'水靈治癒',d:'精靈號令配套。設為主要專精時，水靈號令治癒量增加2%最大HP；仍只由現有精靈執行。同流派最多啟用2項。四大精靈王共用2%掉落。'},
 glv_spirit_ridge:{n:'地靈築護手套',img:'assets/icons/armors/地靈手套.png',legend:true,type:'arm',slot:'gloves',ac:3,cha:1,dr:1,resEarth:10,safe:4,p:245000,gachaWeight:5,spiritEarthShieldPct:2,flowSupport:'spiritCommand',flowSupportLabel:'地靈護盾',d:'精靈號令配套。設為主要專精時，地靈號令護盾增加2%最大HP；護盾以覆蓋而非無限叠加。同流派最多啟用2項。四大精靈王共用2%掉落。'},
 bot_spirit_gust:{n:'風火傳勢長靴',img:'assets/icons/armors/神意長靴.png',legend:true,type:'arm',slot:'boots',ac:4,cha:1,er:3,resWind:10,safe:4,p:250000,gachaWeight:5,spiritAttackDelayTicks:3,flowSupport:'spiritCommand',flowSupportLabel:'風火擾勢',d:'精靈號令配套。設為主要專精時，火靈／風靈主動號令對敵方物理行動的推遲增加0.3秒；不額外生成召喚物或傷害倍率。同流派最多啟用2項。四大精靈王共用2%掉落。'}
});

function addDrops(mob,ids,rate){
 if(typeof MOB_DROPS!=='object')return;let rows=MOB_DROPS[mob]||(MOB_DROPS[mob]=[]);
 ids.forEach(id=>{if(!rows.some(row=>row&&row[0]===id))rows.push([id,rate])});
}
addDrops('魔獸軍王巴蘭卡',['hlm_venom_relay','clk_venom_route','glv_venom_pressure','bot_venom_pursuit'],2);
addDrops('暗殺軍王史雷佛',['hlm_darkstone_delay','clk_darkstone_return','glv_darkstone_frugal','bot_darkstone_muffle'],2);
addDrops('火靈之主',['hlm_flame_rhythm','clk_flame_hold','glv_flame_press','bot_flame_guard'],2);
let spirit=['hlm_spirit_relay','clk_spirit_tide','glv_spirit_ridge','bot_spirit_gust'];
['夢幻之島火精靈王','夢幻之島水精靈王','夢幻之島風精靈王','夢幻之島地精靈王'].forEach(n=>addDrops(n,spirit,.5));
})();
