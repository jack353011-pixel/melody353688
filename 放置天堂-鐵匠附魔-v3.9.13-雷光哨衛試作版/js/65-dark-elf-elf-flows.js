// 🌑🌿 v3.9.75：黑暗妖精／妖精各兩個流派。核心裝只特化，原技能＋廣義武器即可入場。
(function(){
'use strict';
const POISON='sk_dark_poison',REFINE='sk_dark_refine',FLAME='sk_elf_flamesoul',SUMMON='sk_elf_summon2';

Object.assign(DB.items,{
 wpn_corroded_moon_dual:{
  n:'蝕月雙刃',img:'assets/icons/weapons/暗影雙刀.png',legend:true,type:'wpn',w2h:true,eff:'combo',comboRate:30,
  dmgS:22,dmgL:17,hit:6,dmgBonus:5,dex:2,wis:1,spd:.8,req:'all',safe:6,p:340000,gachaWeight:5,core:'venomTwinblades',coreMechanicOnly:true,
  prototypePolicy:{family:'雙刀',small:{mode:'keep'},large:{mode:'sacrifice'}},
  d:'蝕毒雙刃核心特化。附加劇毒＋任意雙刀即可啟動流派；換目標時可轉移既有毒性，對大型敵人則以毒勢使其短暫衰弱。本武器只強化轉移與衰弱，不是流派入場券；保留雙刀的小型原型能力，犧牲大型原型能力。魔獸軍王巴蘭卡5%掉落。'
 },
 wpn_blackstone_ambush_dagger:{
  n:'黑曜伏擊短劍',img:'assets/icons/weapons/拉斯塔巴德短劍.png',legend:true,type:'wpn',
  dmgS:19,dmgL:16,hit:8,dmgBonus:4,wis:2,mpR:2,spd:.6,req:'all',safe:6,p:335000,gachaWeight:5,core:'darkstoneAmbush',coreMechanicOnly:true,
  prototypePolicy:{family:'匕首',small:{mode:'sacrifice'},large:{mode:'keep'}},
  d:'魔石伏擊核心特化。提煉魔石＋任意匕首即可啟動流派；命中會施法的敵人時，有冷卻地消耗一顆未鎖定的二級黑魔石，推遲其所有法術。不會自動吃掉被鎖定的材料，也不消耗三、四級黑魔石。本武器只強化干擾，不是流派入場券；犧牲小型原型能力，保留大型原型能力。暗殺軍王史雷佛5%掉落。'
 },
 wpn_ember_dance_sword:{
  n:'火勢踏燼劍',img:'assets/icons/weapons/灰燼戰士的火焰長劍.png',legend:true,type:'wpn',
  dmgS:23,dmgL:23,hit:6,dmgBonus:5,str:2,resFire:10,spd:1,req:'all',safe:6,p:345000,gachaWeight:5,core:'flameSwordDance',coreMechanicOnly:true,
  prototypePolicy:{family:'單手劍',small:{mode:'keep'},large:{mode:'sacrifice'}},
  d:'火勢劍舞核心特化。烈焰之魂＋任意非鎖鏈劍即可啟動流派；近戰命中累積連續熱勢，可消耗熱勢推遲敵人下次物理行動，受到直接傷害時也可轉為一次防守。沒有第三擊爆發或純傷害倍率。本武器只強化熱勢循環，不是入場券；保留小型原型能力，犧牲大型原型能力。火靈之主5%掉落。'
 },
 wpn_spirit_command_wand:{
  n:'四靈號令杖',img:'assets/icons/weapons/水晶魔杖.png',legend:true,type:'wpn',isWand:true,magic:true,
  dmgS:13,dmgL:13,hit:4,dmgBonus:2,mdmg:3,int:2,cha:2,mpR:4,spd:1,req:'all',safe:6,p:350000,gachaWeight:5,core:'spiritCommand',coreMechanicOnly:true,
  d:'精靈號令核心特化。召喚強力屬性精靈＋任意魔法武器即可啟動流派。精靈存活時再手動點按原召喚技能，不重複召喚、不消耗MP，改為依當前屬性下達火攻、水癒、地護或風擾號令。始終只操作既有的一隻精靈；本杖只強化號令，不是流派入場券。四大夢幻之島精靈王共用5%掉落。'
 }
});

function addDrop(mob,id,rate){
 if(typeof MOB_DROPS!=='object')return;let rows=MOB_DROPS[mob]||(MOB_DROPS[mob]=[]);
 if(!rows.some(row=>row&&row[0]===id))rows.push([id,rate]);
}
addDrop('魔獸軍王巴蘭卡','wpn_corroded_moon_dual',5);
addDrop('暗殺軍王史雷佛','wpn_blackstone_ambush_dagger',5);
addDrop('火靈之主','wpn_ember_dance_sword',5);
['夢幻之島火精靈王','夢幻之島水精靈王','夢幻之島風精靈王','夢幻之島地精靈王'].forEach(n=>addDrop(n,'wpn_spirit_command_wand',1.25));

function flow(id){return !!(player&&typeof buildFlowSource==='function'&&buildFlowSource(player,id))}
function core(id){return typeof buildFlowCoreEquipped==='function'&&buildFlowCoreEquipped(player,id)}
function support(id,prop){return typeof buildFlowSupportValue==='function'?Number(buildFlowSupportValue(player,id,prop))||0:0}
function now(){return typeof state==='object'&&state?Number(state.ticks)||0:0}
function liveTarget(){try{return typeof getTarget==='function'?getTarget():null}catch(e){return null}}
function sizeOf(target){return typeof combatTargetSizeTag==='function'?combatTargetSizeTag(target):(target&&target.s==='L'?'大型':'小型')}
function validHit(target,before){return !!(target&&before>Number(target.curHp)&&!player.dead)}

function transferVenom(target,previous,tick){
 if(!previous||previous===target||previous._dead||previous.curHp<=0||!previous.st||previous.st.poison<=0||tick<(player._venomRelayCd75||0))return;
 let ratio=Math.min(80,50+(core('venomTwinblades')?10:0)+support('venomTwinblades','venomTransferPct'))/100;
 let unit=Math.max(1,Math.floor((previous.st.poisonUnit||previous.st.poisonDmg||1)*ratio));
 target.st=target.st||(typeof newMobStatus==='function'?newMobStatus():{});
 if((target.st.poison||0)<=0||unit>(target.st.poisonUnit||0)){
  target.st.poison=Math.max(20,Math.floor((previous.st.poison||0)*ratio));target.st.poisonTick=10;target.st.poisonStacks=1;target.st.poisonUnit=unit;target.st.poisonDmg=unit;target.st.poisonSrc='player';
  let cdPct=Math.min(40,support('venomTwinblades','venomTransferCooldownPct'));player._venomRelayCd75=tick+Math.max(24,Math.round(40*(1-cdPct/100)));
  if(typeof logCombat==='function')logCombat(`<span class="text-green-300 font-bold">【蝕毒轉刃】</span>旧傷的毒性沿雙刃轉入 <span class="${typeof getMobColor==='function'?getMobColor(target.lv):''}">${target.n}</span>。`,'player-special');
 }
}
function corrodeLarge(target,tick){
 if(sizeOf(target)!=='大型'||tick<(target._venomWeakenCd75||0))return;
 target.st=target.st||(typeof newMobStatus==='function'?newMobStatus():{});
 let dur=Math.min(40,20+(core('venomTwinblades')?5:0)+support('venomTwinblades','venomWeakenTicks'));
 target.st.weaken=Math.max(target.st.weaken||0,dur);
 let cdPct=Math.min(40,support('venomTwinblades','venomWeakenCooldownPct'));target._venomWeakenCd75=tick+Math.max(30,Math.round(50*(1-cdPct/100)));
 if(typeof logCombat==='function')logCombat('<span class="text-lime-300 font-bold">【蝕毒腐勢】</span>劇毒擾亂大型敵人的發力。','player-special');
}
function magicKeys(target){return ['mag','mag2','mag3','mag4','mag5'].filter(key=>target&&target[key])}
function blackstoneStack(){return (player.inv||[]).find(it=>it&&it.id==='mat_blackstone2'&&!it.lock&&(it.cnt||1)>0)}
function useBlackstone(stack){if(!stack)return false;if((stack.cnt||1)>1)stack.cnt--;else{let i=player.inv.indexOf(stack);if(i>=0)player.inv.splice(i,1)}return true}
function darkstoneAmbush(target,tick){
 let keys=magicKeys(target),stack=blackstoneStack();if(!keys.length||!stack||tick<(player._darkstoneAmbushCd75||0))return;
 let every=Math.floor(support('darkstoneAmbush','darkstonePreserveEvery'))||0;
 player._darkstoneUseCount75=(player._darkstoneUseCount75||0)+1;
 let preserved=every>=2&&player._darkstoneUseCount75%every===0;if(!preserved&&!useBlackstone(stack))return;
 let delay=Math.min(25,(target.boss?8:15)+(core('darkstoneAmbush')?2:0)+support('darkstoneAmbush','darkstoneDelayTicks'));
 target._magCd=target._magCd||{};keys.forEach(key=>{target._magCd[key]=Math.max(0,target._magCd[key]===undefined?(target[key].cd||10):target._magCd[key])+delay});
 let weaken=Math.min(30,support('darkstoneAmbush','darkstoneWeakenTicks'));if(weaken){target.st=target.st||(typeof newMobStatus==='function'?newMobStatus():{});target.st.weaken=Math.max(target.st.weaken||0,weaken)}
 let cdPct=Math.min(40,support('darkstoneAmbush','darkstoneCooldownPct'));player._darkstoneAmbushCd75=tick+Math.max(60,Math.round(100*(1-cdPct/100)));
 if(typeof logCombat==='function')logCombat(`<span class="text-violet-300 font-bold">【魔石伏擊】</span>${preserved?'魔石回響未被消耗，':'消耗二級黑魔石，'}敵人的施法被推遲 ${(delay/10).toFixed(1)} 秒。`,'player-special');
}
function flameDanceHit(target,tick){
 let gain=Math.min(20,12+(core('flameSwordDance')?2:0)+support('flameSwordDance','flameHeatGain'));
 player._flameHeat75=Math.min(100,(player._flameHeat75||0)+gain);player._flameHeatDecayAt75=tick;if(target.curHp<=0||target._dead)return;
 if(player._flameHeat75<40||tick<(target._flameDanceDelayCd75||0))return;
 player._flameHeat75-=20;
 let delay=Math.min(12,(target.boss?3:(sizeOf(target)==='大型'?5:7))+(core('flameSwordDance')?1:0)+support('flameSwordDance','flameDelayTicks'));
 target._atkCd=Math.max(0,Number(target._atkCd)||0)+delay;target._flameDanceDelayCd75=tick+30;
 if(typeof logCombat==='function')logCombat(`<span class="text-orange-300 font-bold">【火勢壓步】</span>消耗熱勢，壓住敵人下一次物理行動 ${ (delay/10).toFixed(1) } 秒。`,'player-special');
}

let oldAttack=window.playerAttack;
window.playerAttack=function(){
 let target=liveTarget(),before=target?Number(target.curHp)||0:0,previous=player&&player._venomPrevious75;
 let result=typeof oldAttack==='function'?oldAttack.apply(this,arguments):undefined;if(!validHit(target,before))return result;
 let tick=now();
 let alive=target.curHp>0&&!target._dead;
 if(alive&&flow('venomTwinblades')&&player.buffs&&player.buffs[POISON]>0&&target.st&&target.st.poison>0){transferVenom(target,previous,tick);corrodeLarge(target,tick);player._venomPrevious75=target}
 if(alive&&flow('darkstoneAmbush'))darkstoneAmbush(target,tick);
 if(flow('flameSwordDance')&&player.buffs&&player.buffs[FLAME]>0)flameDanceHit(target,tick);
 return result;
};
if(typeof playerAttack==='function')playerAttack=window.playerAttack;

let oldIncoming=window.d2rTriggerIncoming;
window.d2rTriggerIncoming=function(owner,dmg,source,kind){
 dmg=typeof oldIncoming==='function'?oldIncoming.apply(this,arguments):Math.max(0,Math.floor(Number(dmg)||0));
 if(owner!==player||dmg<=0||!flow('flameSwordDance')||!(player.buffs&&player.buffs[FLAME]>0)||(player._flameHeat75||0)<20||now()<(player._flameGuardCd75||0))return dmg;
 let reduce=Math.min(15,8+(core('flameSwordDance')?1:0)+support('flameSwordDance','flameGuardReducePct'));
 player._flameHeat75-=20;player._flameGuardCd75=now()+50;
 let guarded=Math.max(1,Math.floor(dmg*(1-reduce/100)));
 if(typeof logCombat==='function')logCombat(`<span class="text-amber-300 font-bold">【火勢踏步】</span>消耗熱勢化開 ${dmg-guarded} 點直接傷害。`,'player-special');
 return guarded;
};
if(typeof d2rTriggerIncoming==='function')d2rTriggerIncoming=window.d2rTriggerIncoming;

function spiritAlive(){return (player.summonsV2||[]).find(s=>s&&s.skId===SUMMON&&!s._downed&&(s.hp||0)>0)}
function spiritCommand(){
 if(!state.running||player.dead||!flow('spiritCommand')||!(player.buffs&&player.buffs[SUMMON]>0))return null;
 let spirit=spiritAlive();if(!spirit)return null;
 let tick=now();if(tick<(player._spiritCommandCd75||0)){if(typeof logSys==='function')logSys('精靈號令冷卻中。');return false}
 let target=liveTarget(),ele=spirit.ele||player.elfEle,exact=core('spiritCommand')?1:0;
 if((ele==='fire'||ele==='wind')&&(!target||target.curHp<=0)){if(typeof logSys==='function')logSys('目前沒有可供精靈攻擊的敵人。');return false}
 if(ele==='water'){
  let pct=Math.min(14,8+exact+support('spiritCommand','spiritWaterHealPct')),heal=Math.max(1,Math.floor((player.mhp||1)*pct/100)),before=player.hp;player.hp=Math.min(player.mhp,player.hp+heal);
  if(typeof logCombat==='function')logCombat(`<span class="text-sky-300 font-bold">【水靈號令】</span>精靈治癒了 ${player.hp-before} 點 HP。`,'heal');
 }else if(ele==='earth'){
  let pct=Math.min(12,6+exact+support('spiritCommand','spiritEarthShieldPct')),guard=Math.max(1,Math.floor((player.mhp||1)*pct/100));player._d2rShield=Math.max(player._d2rShield||0,guard);
  if(typeof logCombat==='function')logCombat(`<span class="text-emerald-300 font-bold">【地靈號令】</span>精靈築起 ${guard} 點護盾。`,'player-special');
 }else{
  if(ele==='wind'){
   target.st=target.st||(typeof newMobStatus==='function'?newMobStatus():{});target.st.slow=Math.max(target.st.slow||0,10);
  }
  if(typeof spiritAttackOnce==='function')spiritAttackOnce(spirit,target,player);
  if(target&&target.curHp>0){let delay=Math.min(10,2+exact+support('spiritCommand','spiritAttackDelayTicks'));target._atkCd=Math.max(0,Number(target._atkCd)||0)+delay}
  if(typeof logCombat==='function')logCombat(`<span class="${ele==='fire'?'text-orange-300':'text-cyan-300'} font-bold">【${ele==='fire'?'火靈攻勢':'風靈擾勢'}號令】</span>現有精靈立即執行了一次指令。`,'player-special');
 }
 let cdPct=Math.min(37.5,support('spiritCommand','spiritCommandCooldownPct'));player._spiritCommandCd75=tick+Math.max(50,Math.round(80*(1-cdPct/100)));
 if(typeof updateUI==='function')updateUI();return true;
}
let oldManual=window.manualCast;
window.manualCast=function(id){if(id===SUMMON){let commanded=spiritCommand();if(commanded!==null)return commanded}return typeof oldManual==='function'?oldManual.apply(this,arguments):undefined};
if(typeof manualCast==='function')manualCast=window.manualCast;

function flowTick(){
 if(!player||player.dead)return;let tick=now();
 if((player._flameHeat75||0)>0&&tick>=(player._flameHeatDecayAt75||0)+Math.min(20,10+support('flameSwordDance','flameHeatHoldTicks'))){
  player._flameHeat75=Math.max(0,player._flameHeat75-1);player._flameHeatDecayAt75=tick;
 }
}
let oldTick=window.tick;window.tick=function(){let r=typeof oldTick==='function'?oldTick.apply(this,arguments):undefined;flowTick();return r};if(typeof tick==='function')tick=window.tick;
})();
