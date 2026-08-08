// 🐉 原技能「屠宰者」× 原裝備「寒冰鎖鏈劍」：冰龍追擊 v3.8.95
(function(){
'use strict';
const SK='sk_dragon_slaughter',WPN='wpn_chain_frost';
let base=DB.items[WPN];
if(base){
 base.core='frostDragonChase';
 if(!String(base.d||'').includes('冰龍追擊')){
  base.d=(base.d||'')+' 屠宰者延伸「冰龍追擊」：三連斬完成後追加基礎最多3目標的水屬性追擊，並有20%基礎機率嘗試冰凍1.5秒。基礎冷卻10秒、最低5秒；原本屠宰者的三連斬、弱點曝光與HP消耗完全保留。';
 }
}
function weapon(){
 let item=player&&player.eq&&player.eq.wpn,def=item&&DB.items[item.id];
 return item&&item.id===WPN&&def&&def.core==='frostDragonChase'?def:null;
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 return{
  fdd:Math.min(80,Number(total.fdd)||0),
  fdn:Math.min(2,Math.floor(Number(total.fdn)||0)),
  fdf:Math.min(25,Number(total.fdf)||0),
  fdc:Math.min(50,Number(total.fdc)||0)
 };
}
function ensure(){
 if(player&&!Number.isFinite(player.frostDragonCd95))player.frostDragonCd95=0;
}
function living(){
 return mapState&&Array.isArray(mapState.mobs)?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[];
}
function host(){
 let h=document.getElementById('battle-view')||document.getElementById('game-screen');
 if(h&&getComputedStyle(h).position==='static')h.style.position='relative';
 return h;
}
function installCss(){
 if(document.getElementById('frost-dragon95-css'))return;
 let style=document.createElement('style');
 style.id='frost-dragon95-css';
 style.textContent=`
#frost-dragon95{position:absolute;left:2%;bottom:8%;width:390px;height:260px;z-index:1004;pointer-events:none;overflow:visible}
#frost-dragon95 img{position:absolute;left:-80px;bottom:35px;width:245px;filter:brightness(1.8) saturate(1.8) hue-rotate(145deg) drop-shadow(0 0 18px #38bdf8);animation:frostDragonFly95 1.05s cubic-bezier(.2,.7,.2,1) forwards}
#frost-dragon95 .chain{position:absolute;left:72px;bottom:67px;width:250px;height:8px;border-top:5px dashed #bae6fd;transform:rotate(-10deg);filter:drop-shadow(0 0 8px #0ea5e9);animation:frostChain95 .85s ease-out forwards}
#frost-dragon95 .flake{position:absolute;color:#e0f2fe;font-size:32px;text-shadow:0 0 12px #38bdf8;animation:frostFlake95 .9s ease-out forwards}
#frost-dragon95 .f1{left:155px;bottom:75px}.f2{left:230px;bottom:118px;animation-delay:.08s}.f3{left:310px;bottom:88px;animation-delay:.16s}
#frost-dragon95 b{position:absolute;left:20px;right:0;bottom:0;text-align:center;color:#e0f2fe;font:bold 16px/22px sans-serif;text-shadow:0 0 9px #0284c7,0 2px 4px #000;animation:frostTitle95 .95s ease-out forwards}
#frost-dragon-status95{position:absolute;right:3%;bottom:70px;z-index:1000;min-width:175px;padding:1px 8px;border:1px solid #38bdf8;border-radius:8px;background:#082f49;color:#e0f2fe;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
@keyframes frostDragonFly95{0%{transform:translate(-40px,70px) scale(.45);opacity:0}25%{opacity:1}100%{transform:translate(300px,-120px) scale(1.15);opacity:0}}
@keyframes frostChain95{0%{transform:rotate(-10deg) scaleX(.05);opacity:0}35%{opacity:1}100%{transform:rotate(-10deg) scaleX(1.25);opacity:0}}
@keyframes frostFlake95{0%{transform:scale(.2) rotate(0);opacity:0}35%{opacity:1}100%{transform:scale(1.7) rotate(160deg);opacity:0}}
@keyframes frostTitle95{0%{transform:translateY(15px);opacity:0}30%{opacity:1}100%{transform:translateY(-25px);opacity:0}}`;
 document.head.appendChild(style);
}
function visual(){
 let h=host();if(!h)return;
 installCss();
 let old=document.getElementById('frost-dragon95');if(old)old.remove();
 let e=document.createElement('div');
 e.id='frost-dragon95';
 e.innerHTML='<img src="assets/anim/飛龍/skill_4.png" alt=""><i class="chain"></i><i class="flake f1">❄</i><i class="flake f2">❄</i><i class="flake f3">❄</i><b>🐉 冰龍追擊</b>';
 h.appendChild(e);
 setTimeout(()=>{if(e&&e.remove)e.remove()},1150);
}
function badge(){
 let h=host();if(!h||!player)return;
 let e=document.getElementById('frost-dragon-status95');
 if(player.cls==='dragon'&&weapon()){
  if(!e){e=document.createElement('div');e.id='frost-dragon-status95';h.appendChild(e)}
  let cd=Math.ceil((player.frostDragonCd95||0)/10),b=bonus();
  e.textContent='冰龍追擊 '+(3+b.fdn)+'目標　'+(cd>0?'CD '+cd+'秒':'可發動');
 }else if(e)e.remove();
}
function damage(target){
 let b=bonus(),str=Number(player.d&&player.d.str)||Number(player.base&&player.base.str)||10;
 let wis=Number(player.d&&player.d.wis)||Number(player.base&&player.base.wis)||10;
 let melee=Number(player.d&&player.d.meleeDmg)||0;
 let raw=28+(Number(player.lv)||1)*.95+str*1.4+wis*1.2+melee*.5;
 let attr=typeof magicAttrDefense==='function'?magicAttrDefense(target,'water'):0;
 let mr=typeof mrMult==='function'?mrMult(Math.max(0,Number(target.mr)||0)):1;
 let counter=typeof elementCounterMult==='function'?elementCounterMult('water',target.e):1;
 let dealt=Math.max(1,Math.floor(raw*(1+b.fdd/100)*(1-attr)*mr*counter));
 return typeof d2rHuntDamage==='function'?d2rHuntDamage(player,target,dealt):dealt;
}
function impact(primaryUid){
 let b=bonus(),all=living(),primary=all.find(m=>m.uid===primaryUid);
 let targets=(primary?[primary]:[]).concat(all.filter(m=>!primary||m.uid!==primary.uid)).slice(0,3+b.fdn);
 let rows=[],freezeChance=20+b.fdf;
 targets.forEach(target=>{
  let dealt=damage(target);
  target.curHp-=dealt;target.justHit='water';target._spellHurt=true;
  if(typeof mobWake==='function')mobWake(target);
  if(target.curHp>0&&Math.random()*100<freezeChance&&typeof applyMobStatus==='function'){
   applyMobStatus(target,{kind:'freeze',dur:1.5},'冰龍追擊');
  }
  rows.push(target.n+' '+dealt);
  if(target.curHp<=0){
   let index=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);
   if(index!==-1&&typeof killMob==='function')killMob(index);
  }
 });
 if(rows.length&&typeof logCombat==='function')logCombat('<span class="text-sky-300 font-bold">【冰龍追擊】</span>'+rows.join('、'),'magic');
 try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
}
function trigger(primaryUid){
 ensure();
 if(!weapon()||player.cls!=='dragon'||player.dead||player.frostDragonCd95>0||!living().length)return false;
 let b=bonus();
 player.frostDragonCd95=Math.max(50,Math.round(100*(1-b.fdc/100)));
 visual();impact(primaryUid);badge();
 return true;
}
function targetUid(){
 try{let target=typeof getTarget==='function'?getTarget():null;return target&&target.uid}catch(e){return null}
}
let oldManual=window.manualCast;
window.manualCast=function(id){
 if(id!==SK)return oldManual.apply(this,arguments);
 let uid=targetUid(),hp=player.hp,cd=player.cds&&player.cds.atkSk,result=oldManual.apply(this,arguments);
 if(player.hp<hp||(player.cds&&player.cds.atkSk)!==cd)trigger(uid);
 return result;
};
let oldInner=window.castSkillInner;
window.castSkillInner=function(id){
 let uid=id===SK?targetUid():null,result=oldInner.apply(this,arguments);
 if(result&&id===SK)trigger(uid);
 return result;
};
if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let oldTick=window.tick;
window.tick=function(){
 let result=oldTick.apply(this,arguments);ensure();
 if(player.frostDragonCd95>0)player.frostDragonCd95--;
 badge();
 return result;
};
ensure();
})();
