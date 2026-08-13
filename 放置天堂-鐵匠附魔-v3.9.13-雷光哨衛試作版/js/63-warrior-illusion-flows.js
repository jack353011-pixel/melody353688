// ⚔️🔮 v3.9.73：戰士／幻術士各補兩個正式流派。核心裝只特化，不作入場券。
(function(){
'use strict';
const THROW='sk_warrior_throwaxe';
const TITANS=['sk_warrior_titan_rock','sk_warrior_titan_magic','sk_warrior_titan_bullet'];
const CUBES=['sk_illu_cube_burn','sk_illu_cube_quake','sk_illu_cube_shock','sk_illu_cube_harmony'];
const PAIN='sk_illu_pain';

DB.items.wpn_blood_hunter_axe={
 n:'鮮血追獵斧',img:'assets/icons/weapons/巨人的斧頭.png',legend:true,type:'wpn',w2h:true,
 dmgS:27,dmgL:34,hit:3,dmgBonus:4,spd:1,eff:'crush',ignHardSkin:true,req:'warrior',reqLv:50,safe:6,
 p:330000,gachaWeight:5,core:'bloodAxeHunt',
 d:'戰士流派核心特化。戰斧投擲＋任意斧即可啟動「血斧追獵」；命中流血目標時，每2秒至多追擊一次並延長既有流血，追擊對頭目有生命比例硬上限。此斧只強化原技能與追擊，不是流派入場券。古代巨人5%掉落。'
};
DB.items.arm_titan_reverse_wall={
 n:'泰坦逆壁重鎧',img:'assets/icons/armors/歐姆士兵的重裝鎧甲.png',legend:true,type:'arm',slot:'armor',heavyArmor:true,
 ac:10,dr:4,con:3,mhp:70,req:'warrior',reqLv:55,safe:4,p:360000,gachaWeight:5,core:'titanWall',
 d:'戰士流派核心特化。任一泰坦技能＋重甲即可啟動「泰坦逆壁」；低生命時降低直接傷害，每承受3次傷害可形成有冷卻與生命比例上限的護盾。原本泰坦反擊完整保留，此甲不是流派入場券。古代巨人5%掉落。'
};
DB.items.wpn_fourfold_qigu={
 n:'四相共鳴奇古獸',img:'assets/icons/weapons/共鳴奇古獸.png',legend:true,type:'wpn',qigu:true,
 dmgS:29,dmgL:29,mdmg:3,int:2,wis:2,mpR:4,spd:.8,req:'illusion',reqLv:50,safe:6,
 p:350000,gachaWeight:5,core:'cubeResonance',
 d:'幻術士流派核心特化。任一立方技能＋任意奇古獸即可啟動「立方共鳴」；最後施放的立方決定唯一共鳴：燃燒追傷、地裂護盾、衝擊短控、和諧回魔。一次只運作一種共鳴，全部效果皆有頻率或比例上限。不幸的幻象眼魔5%掉落。'
};
DB.items.arm_pain_mirror={
 n:'鏡痛幻甲',img:'assets/icons/armors/幻術士斗篷.png',legend:true,type:'arm',slot:'armor',
 ac:8,dr:2,wis:3,mhp:55,mmp:45,req:'illusion',reqLv:55,safe:4,p:350000,gachaWeight:5,core:'painMirror',
 d:'幻術士流派核心特化。疼痛的歡愉＋任意身甲即可啟動「痛覺鏡界」；直接受傷時累積痛覺，達門檻後轉化為有8秒冷卻與生命比例上限的護盾。原本等量反射完整保留，此甲不是流派入場券。邪惡的鐮刀死神5%掉落。'
};

function addDrop(mob,id){
 if(typeof MOB_DROPS!=='object')return;
 let rows=MOB_DROPS[mob]||(MOB_DROPS[mob]=[]);
 if(!rows.some(row=>row&&row[0]===id))rows.push([id,5]);
}
addDrop('古代巨人','wpn_blood_hunter_axe');
addDrop('古代巨人','arm_titan_reverse_wall');
addDrop('不幸的幻象眼魔','wpn_fourfold_qigu');
addDrop('邪惡的鐮刀死神','arm_pain_mirror');

function flow(id,cls){
 return !!(player&&player.cls===cls&&typeof buildFlowSource==='function'&&buildFlowSource(player,id));
}
function core(id){return typeof buildFlowCoreEquipped==='function'&&buildFlowCoreEquipped(player,id)}
function now(){return typeof state==='object'&&state?Number(state.ticks)||0:0}
function liveTarget(){try{return typeof getTarget==='function'?getTarget():null}catch(e){return null}}
function slay(m){
 if(!m||m.curHp>0||typeof mapState==='undefined'||!mapState.mobs)return;
 let i=mapState.mobs.findIndex(x=>x&&x.uid===m.uid);if(i!==-1&&typeof killMob==='function')killMob(i);
}
function skillMult(id){return typeof classSkillEquipMult==='function'?classSkillEquipMult(DB.skills[id],player,id):1}
function support(id,prop){return typeof buildFlowSupportValue==='function'?Number(buildFlowSupportValue(player,id,prop))||0:0}

// 血斧追獵：只延伸戰斧投擲已建立的流血；不新增流血層，避免雙重觸發。
let oldAttack=window.playerAttack;
window.playerAttack=function(){
 let target=liveTarget(),before=target?Number(target.curHp)||0:0,result=typeof oldAttack==='function'?oldAttack.apply(this,arguments):undefined;
 if(!target||target.curHp<=0||before<=target.curHp||!flow('bloodAxeHunt','warrior')||!(player.buffs&&player.buffs[THROW]>0)||!target.bleeds||!target.bleeds.length)return result;
 let tick=now();if(tick<(target._bloodAxeHuntCd||0))return result;
 let huntCd=Math.min(40,support('bloodAxeHunt','bloodHuntCooldownPct'));
 target._bloodAxeHuntCd=tick+Math.max(12,Math.round(20*(1-huntCd/100)));
 let extend=10+Math.min(10,support('bloodAxeHunt','bloodHuntExtendTicks'));
 target.bleeds.forEach(row=>{row.ticksLeft=Math.min(100,(Number(row.ticksLeft)||0)+extend)});
 let bleed=target.bleeds.reduce((sum,row)=>sum+(Number(row.dmg)||0),0);
 let convert=1+Math.min(40,support('bloodAxeHunt','bloodHuntBleedScalePct'))/100;
 let raw=Math.max(1,Math.floor((bleed*.45*convert+(player.lv||1)*.35)*skillMult(THROW)));
 let bossCap=.006+Math.min(.4,support('bloodAxeHunt','bloodHuntBossCapPct'))/100;
 let cap=Math.max(1,Math.floor((target.hp||target.curHp||1)*(target.boss ? bossCap : .03)));
 let dealt=Math.min(raw,cap);target.curHp-=dealt;target.justHit='none';
 if(typeof mobWake==='function')mobWake(target);
 if(typeof logCombat==='function')logCombat(`<span class="text-red-300 font-bold">【血斧追獵】</span>撕開既有傷口，追加 ${dealt} 點傷害。`,'player-special');
 slay(target);return result;
};
if(typeof playerAttack==='function')playerAttack=window.playerAttack;

// 泰坦逆壁／痛覺鏡界：接在既有傷害減免之後；護盾留給下一擊，不回寫當前傷害兩次。
let oldIncoming=window.d2rTriggerIncoming;
window.d2rTriggerIncoming=function(owner,dmg,source,kind){
 dmg=typeof oldIncoming==='function'?oldIncoming.apply(this,arguments):Math.max(0,Math.floor(Number(dmg)||0));
 if(owner!==player||dmg<=0)return dmg;
 let tick=now(),mhp=Math.max(1,Number(player.mhp)||1),hp=Math.max(0,Number(player.hp)||0);
 if(flow('titanWall','warrior')&&hp<mhp*(typeof titanThreshold==='function'?titanThreshold():.4)){
  let reduce=Math.min(15,12+support('titanWall','titanWallReducePct'));
  dmg=Math.max(1,Math.floor(dmg*(1-reduce/100)));player._titanWallHits73=(player._titanWallHits73||0)+1;
  let hits=Math.max(2,3-Math.floor(support('titanWall','titanWallHitsReduced')));
  if(player._titanWallHits73>=hits&&tick>=(player._titanWallCd73||0)){
   let cd=Math.min(37.5,support('titanWall','titanWallCooldownPct'));
   player._titanWallHits73=0;player._titanWallCd73=tick+Math.max(50,Math.round(80*(1-cd/100)));
   let shieldPct=Math.min(8,(core('titanWall') ? 6 : 5)+support('titanWall','titanWallShieldPct'));
   let guard=Math.max(1,Math.floor(mhp*shieldPct/100));
   player._d2rShield=Math.max(player._d2rShield||0,guard);
   if(typeof logCombat==='function')logCombat(`<span class="text-stone-300 font-bold">【泰坦逆壁】</span>承受衝擊後形成 ${guard} 點護盾。`,'player-special');
  }
 }
 if(flow('painMirror','illusion')&&player.buffs&&player.buffs[PAIN]>0){
  let reduce=Math.min(11,8+support('painMirror','painMirrorReducePct'));
  dmg=Math.max(1,Math.floor(dmg*(1-reduce/100)));
  let cap=mhp*.15;player._painMirrorCharge73=Math.min(cap,(player._painMirrorCharge73||0)+dmg);
  let threshold=Math.max(8,10-support('painMirror','painMirrorThresholdPct'));
  if(player._painMirrorCharge73>=mhp*threshold/100&&tick>=(player._painMirrorCd73||0)){
   let cd=Math.min(37.5,support('painMirror','painMirrorCooldownPct'));
   player._painMirrorCharge73=0;player._painMirrorCd73=tick+Math.max(50,Math.round(80*(1-cd/100)));
   let shieldPct=Math.min(11,(core('painMirror') ? 9 : 8)+support('painMirror','painMirrorShieldPct'));
   let guard=Math.max(1,Math.floor(mhp*shieldPct/100));
   player._d2rShield=Math.max(player._d2rShield||0,guard);
   if(typeof logCombat==='function')logCombat(`<span class="text-fuchsia-300 font-bold">【痛覺鏡界】</span>痛覺轉化為 ${guard} 點護盾。`,'player-special');
  }
 }
 return dmg;
};
if(typeof d2rTriggerIncoming==='function')d2rTriggerIncoming=window.d2rTriggerIncoming;

function rememberCube(id,ok){
 if(ok===false||!CUBES.includes(id)||!flow('cubeResonance','illusion')||!(player.buffs&&player.buffs[id]>0))return;
 player._cubeResonance73=id;
}
let oldManual=window.manualCast;
window.manualCast=function(id){let r=typeof oldManual==='function'?oldManual.apply(this,arguments):undefined;rememberCube(id,r);return r};
if(typeof manualCast==='function')manualCast=window.manualCast;
let oldInner=window.castSkillInner;
window.castSkillInner=function(id){let r=typeof oldInner==='function'?oldInner.apply(this,arguments):false;rememberCube(id,r);return r};
if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;

function resonanceTick(){
 if(!flow('cubeResonance','illusion')||player.dead||!state.running)return;
 let id=player._cubeResonance73;
 if(!id||!(player.buffs&&player.buffs[id]>0))id=CUBES.find(x=>player.buffs&&player.buffs[x]>0);
 if(!id)return;player._cubeResonance73=id;
 let tick=now();if(tick%40!==0||player._cubeResonanceLast73===tick)return;player._cubeResonanceLast73=tick;
 let exact=core('cubeResonance')?1.1:1,mhp=Math.max(1,Number(player.mhp)||1),target=liveTarget();
 if(id==='sk_illu_cube_burn'&&target&&target.curHp>0){
  let burn=1+Math.min(20,support('cubeResonance','cubeBurnDamagePct'))/100;
  let raw=Math.max(1,Math.floor((6+(player.lv||1)*.3+(player.d&&player.d.magicDmg||0)*.5)*skillMult(id)*burn));
  let cap=Math.max(1,Math.floor((target.hp||target.curHp||1)*(target.boss ? .004 : .02)));
  let dealt=Math.min(raw,cap);target.curHp-=dealt;target.justHit='fire';if(typeof mobWake==='function')mobWake(target);
  if(typeof logCombat==='function')logCombat(`<span class="text-orange-300 font-bold">【燃燒共鳴】</span>灼印追加 ${dealt} 點傷害。`,'dot');slay(target);
 }else if(id==='sk_illu_cube_quake'){
  let shieldPct=Math.min(3,2+support('cubeResonance','cubeQuakeShieldPct'));
  let guard=Math.max(1,Math.floor(mhp*shieldPct/100*exact));player._d2rShield=Math.max(player._d2rShield||0,guard);
 }else if(id==='sk_illu_cube_shock'&&target&&target.curHp>0&&Math.random()<(Math.min(30,20+support('cubeResonance','cubeShockChancePct'))/100)*exact&&typeof applyMobStatus==='function'){
  applyMobStatus(target,{kind:'paralyze',pbase:200,dur:1},'衝擊共鳴');
 }else if(id==='sk_illu_cube_harmony'){
  let recoverPct=Math.min(3,2+support('cubeResonance','cubeHarmonyRecoverPct'));
  let mp=Math.max(1,Math.min(20,Math.floor((player.mmp||1)*recoverPct/100*exact)));if(typeof teamRecoverMp==='function')teamRecoverMp(mp);
  let guard=Math.max(1,Math.floor(mhp*.01*exact));player._d2rShield=Math.max(player._d2rShield||0,guard);
 }
}
let oldTick=window.tick;
window.tick=function(){let r=typeof oldTick==='function'?oldTick.apply(this,arguments):undefined;resonanceTick();return r};
if(typeof tick==='function')tick=window.tick;
})();
