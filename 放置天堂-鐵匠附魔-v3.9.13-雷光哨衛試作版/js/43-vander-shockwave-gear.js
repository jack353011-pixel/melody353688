// ⚔️ 原技能「衝擊之暈」× 原裝備「騎士范德之劍」：范德震地 v3.8.94
(function(){
'use strict';
const SK='sk_shock_stun',WPN='wpn_vander_sword';
let base=DB.items[WPN];
if(base){
 base.core='vanderShockwave';
 if(!String(base.d||'').includes('范德震地')){
  base.d=(base.d||'')+' 衝擊之暈延伸「范德震地」：施展時追加基礎最多3目標的物理震波並短暫暈眩。基礎冷卻8秒、最低4秒；原技能的傷害、命中與暈眩完全保留。';
 }
}
function sword(){
 return typeof buildFlowSource==='function'?buildFlowSource(player,'vanderShockwave'):null;
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 return{
  vwd:Math.min(80,Number(total.vwd)||0),
  vwn:Math.min(2,Math.floor(Number(total.vwn)||0)),
  vws:Math.min(60,Number(total.vws)||0),
  vwc:Math.min(50,Number(total.vwc)||0)
 };
}
function ensure(){
 if(player&&!Number.isFinite(player.vanderWaveCd94))player.vanderWaveCd94=0;
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
 if(document.getElementById('vander-wave94-css'))return;
 let style=document.createElement('style');
 style.id='vander-wave94-css';
 style.textContent=`
#vander-wave94{position:absolute;left:3%;bottom:3%;width:280px;height:220px;z-index:1003;pointer-events:none;overflow:visible}
#vander-wave94 .vander-ring{position:absolute;left:50%;bottom:30px;width:52px;height:28px;margin-left:-26px;border:5px solid #fbbf24;border-radius:50%;box-shadow:0 0 18px #f97316,inset 0 0 14px #fde68a;animation:vanderRing94 .78s ease-out forwards}
#vander-wave94 .vander-ring:nth-child(2){animation-delay:.1s;border-color:#fb923c}
#vander-wave94 .vander-ring:nth-child(3){animation-delay:.2s;border-color:#ef4444}
#vander-wave94 .vander-crack{position:absolute;left:50%;bottom:35px;width:8px;height:130px;background:linear-gradient(#fff7ed,#fb923c 35%,transparent);transform-origin:50% 100%;filter:drop-shadow(0 0 6px #ef4444);clip-path:polygon(35% 100%,55% 58%,35% 55%,75% 0,52% 48%,74% 52%)}
#vander-wave94 .c1{transform:rotate(-68deg)}#vander-wave94 .c2{transform:rotate(-25deg)}#vander-wave94 .c3{transform:rotate(28deg)}#vander-wave94 .c4{transform:rotate(70deg)}
#vander-wave94 b{position:absolute;left:0;right:0;bottom:0;text-align:center;color:#fef3c7;font:bold 16px/22px sans-serif;text-shadow:0 0 8px #dc2626,0 2px 4px #000;animation:vanderTitle94 .8s ease-out forwards}
#vander-wave-status94{position:absolute;right:3%;bottom:24px;z-index:1000;min-width:170px;padding:1px 8px;border:1px solid #f59e0b;border-radius:8px;background:#451a03;color:#fef3c7;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
@keyframes vanderRing94{0%{transform:scale(.25);opacity:1}100%{transform:scale(5.3,3.4);opacity:0}}
@keyframes vanderTitle94{0%{transform:translateY(12px);opacity:0}25%{opacity:1}100%{transform:translateY(-28px);opacity:0}}`;
 document.head.appendChild(style);
}
function visual(){
 let h=host();if(!h)return;
 installCss();
 let old=document.getElementById('vander-wave94');if(old)old.remove();
 let e=document.createElement('div');
 e.id='vander-wave94';
 e.innerHTML='<i class="vander-ring"></i><i class="vander-ring"></i><i class="vander-ring"></i><i class="vander-crack c1"></i><i class="vander-crack c2"></i><i class="vander-crack c3"></i><i class="vander-crack c4"></i><b>⚔️ 范德震地</b>';
 h.appendChild(e);
 setTimeout(()=>{if(e&&e.remove)e.remove()},900);
}
function badge(){
 let h=host();if(!h||!player)return;
 let e=document.getElementById('vander-wave-status94');
 if(player.cls==='knight'&&sword()){
  if(!e){e=document.createElement('div');e.id='vander-wave-status94';h.appendChild(e)}
  let cd=Math.ceil((player.vanderWaveCd94||0)/10),targets=3+bonus().vwn;
  e.textContent='范德震地 '+targets+'目標　'+(cd>0?'CD '+cd+'秒':'可發動');
 }else if(e)e.remove();
}
function waveDamage(target){
 let b=bonus(),str=Number(player.d&&player.d.str)||Number(player.base&&player.base.str)||10;
 let melee=Number(player.d&&player.d.meleeDmg)||0;
 let raw=32+(Number(player.lv)||1)*1.25+str*2+melee;
 let reduced=Math.max(1,raw-(Number(target.dr)||0)-(typeof mobHardSkin==='function'?mobHardSkin(target):0));
 let damage=Math.max(1,Math.floor(reduced*(1+b.vwd/100)*(typeof fragileMult==='function'?fragileMult(target):1)));
 return typeof d2rHuntDamage==='function'?d2rHuntDamage(player,target,damage):damage;
}
function impact(primaryUid){
 let b=bonus(),all=living(),primary=all.find(m=>m.uid===primaryUid);
 let ordered=(primary?[primary]:[]).concat(all.filter(m=>!primary||m.uid!==primary.uid)).slice(0,3+b.vwn);
 let rows=[],stunSec=.5*(1+b.vws/100);
 ordered.forEach(target=>{
  let damage=waveDamage(target);
  target.curHp-=damage;target.justHit='physical';
  if(typeof mobWake==='function')mobWake(target);
  if(typeof reflectWallOnDamage==='function')reflectWallOnDamage(target,damage,'melee',null);
  if(!player.dead&&target.curHp>0&&typeof applyMobStatus==='function')applyMobStatus(target,{kind:'stun',dur:stunSec},'范德震地');
  rows.push(target.n+' '+damage);
  if(target.curHp<=0){
   let index=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);
   if(index!==-1&&typeof killMob==='function')killMob(index);
  }
 });
 if(rows.length&&typeof logCombat==='function')logCombat('<span class="text-amber-300 font-bold">【范德震地】</span>'+rows.join('、'),'player-special');
 try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
}
function trigger(primaryUid){
 ensure();
 if(!sword()||player.cls!=='knight'||player.dead||player.vanderWaveCd94>0||!living().length)return false;
 let b=bonus();
 player.vanderWaveCd94=Math.max(40,Math.round(80*(1-b.vwc/100)));
 visual();impact(primaryUid);badge();
 return true;
}
function targetUid(){
 try{let target=typeof getTarget==='function'?getTarget():null;return target&&target.uid}catch(e){return null}
}
let oldManual=window.manualCast;
window.manualCast=function(id){
 if(id!==SK)return oldManual.apply(this,arguments);
 let uid=targetUid(),mp=player.mp,cd=player.cds&&player.cds.atkSk,result=oldManual.apply(this,arguments);
 if(player.mp<mp||(player.cds&&player.cds.atkSk)!==cd)trigger(uid);
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
 if(player.vanderWaveCd94>0)player.vanderWaveCd94--;
 badge();
 return result;
};
ensure();
})();
