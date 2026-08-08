// 🔥❄️⚡ 符文之語「馬賽克」× 原技能「雙重破壞＋會心一擊」 v3.9.12
(function(){
'use strict';
const CHARGE_SK='sk_dark_double',FINISH_SK='sk_dark_crit',WORD='mosaic';

function mosaicWord(){
 let item=player&&player.eq&&player.eq.wpn;if(!item)return null;
 let word=typeof effectiveRuneword==='function'?effectiveRuneword(player,item):(typeof activeRuneword==='function'?activeRuneword(item):null);
 return word&&word.id===WORD?word:null;
}
function weapon(){
 let item=player&&player.eq&&player.eq.wpn,def=item&&DB.items[item.id];
 return mosaicWord()&&def?def:null;
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 let support={chargeTime:0,extraCharge:0,cooldown:0,penetration:0};
 if(player&&player.eq)Object.keys(player.eq).forEach(function(slot){
  let item=player.eq[slot],def=item&&DB.items[item.id];if(!def)return;
  support.chargeTime+=Number(def.mosaicChargeTimePct)||0;
  support.extraCharge+=Number(def.mosaicExtraChargeRate)||0;
  support.cooldown+=Number(def.mosaicCooldownPct)||0;
  support.penetration+=Number(def.mosaicPenetration)||0;
 });
 return{
  mzd:Math.min(80,Number(total.mzd)||0),
  mzn:Math.min(2,Math.floor(Number(total.mzn)||0)),
  mzt:Math.min(80,(Number(total.mzt)||0)+Math.min(40,support.chargeTime)),
  mzc:Math.min(50,(Number(total.mzc)||0)+Math.min(20,support.cooldown)),
  mzx:Math.min(50,support.extraCharge),
  mzp:Math.min(20,support.penetration)
 };
}
function ensure(){
 if(!player)return;
 if(!Number.isFinite(player.mosaicCharge311))player.mosaicCharge311=0;
 if(!Number.isFinite(player.mosaicChargeLeft311))player.mosaicChargeLeft311=0;
 if(!Number.isFinite(player.mosaicFinishCd311))player.mosaicFinishCd311=0;
}
function doubleActive(){return !!(player&&player.buffs&&(Number(player.buffs[CHARGE_SK])||0)>0)}
function duration(){return Math.round(120*(1+bonus().mzt/100))}
function live(){
 return typeof mapState!=='undefined'&&mapState&&Array.isArray(mapState.mobs)?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[];
}
function targetNow(){try{return typeof getTarget==='function'?getTarget():null}catch(e){return null}}
function host(){
 let h=document.getElementById('battle-view')||document.getElementById('game-screen');
 if(h&&getComputedStyle(h).position==='static')h.style.position='relative';
 return h;
}
function installCss(){
 if(document.getElementById('mosaic311-css'))return;
 let style=document.createElement('style');style.id='mosaic311-css';
 style.textContent=`
#mosaic-charge311{position:absolute;left:5%;bottom:9%;width:155px;height:145px;z-index:1003;pointer-events:none}
#mosaic-charge311 i{position:absolute;width:33px;height:33px;border:3px solid #fff;border-radius:50%;opacity:.18;transform:scale(.7);transition:.2s;box-shadow:0 0 14px currentColor,inset 0 0 12px currentColor}
#mosaic-charge311 i.on{opacity:1;transform:scale(1);animation:mzOrb311 .7s ease-in-out infinite alternate}
#mosaic-charge311 .fire{left:10px;bottom:18px;color:#fb923c;background:#7c2d12}
#mosaic-charge311 .water{left:58px;top:5px;color:#67e8f9;background:#164e63;animation-delay:-.2s!important}
#mosaic-charge311 .wind{right:8px;bottom:18px;color:#c4b5fd;background:#312e81;animation-delay:-.4s!important}
#mosaic-charge311 b{position:absolute;left:-12px;right:-12px;bottom:-8px;text-align:center;color:#f5d0fe;font:bold 12px/18px sans-serif;text-shadow:0 0 8px #a855f7,0 2px 4px #000}
#mosaic-release311{position:absolute;inset:0;z-index:1010;pointer-events:none;overflow:hidden}
#mosaic-release311 .ring{position:absolute;left:50%;top:48%;width:440px;height:440px;margin:-220px;border-radius:50%;background:conic-gradient(from 0deg,#fb923c,#fef08a,#67e8f9,#2563eb,#c4b5fd,#22d3ee,#fb923c);mask:radial-gradient(circle,transparent 48%,#000 50%,#000 62%,transparent 64%);filter:drop-shadow(0 0 18px #a855f7);animation:mzRing311 .95s ease-out forwards}
#mosaic-release311 .burst{position:absolute;left:50%;top:48%;width:40px;height:40px;margin:-20px;border-radius:50%;background:#fff;box-shadow:0 0 25px 18px #fb923c,0 0 55px 34px #22d3ee,0 0 90px 52px #8b5cf6;animation:mzBurst311 .8s ease-out forwards}
#mosaic-release311 .shard{position:absolute;left:50%;top:48%;font:bold 38px/40px serif;color:#fff;text-shadow:0 0 12px currentColor;animation:mzShard311 .9s ease-out forwards}
#mosaic-release311 .s1{color:#fb923c;--x:-250px;--y:-120px}.s2{color:#67e8f9;--x:230px;--y:-145px}.s3{color:#c4b5fd;--x:-220px;--y:155px}.s4{color:#fde68a;--x:245px;--y:135px}.s5{color:#38bdf8;--x:0px;--y:-220px}.s6{color:#f0abfc;--x:10px;--y:215px}
#mosaic-release311 strong{position:absolute;left:0;right:0;bottom:12%;text-align:center;color:#fff;font:bold 24px/30px sans-serif;text-shadow:0 0 12px #a855f7,0 3px 6px #000;animation:mzTitle311 1s ease-out forwards}
#mosaic-status311{position:absolute;right:3%;bottom:93px;z-index:1000;min-width:205px;padding:1px 8px;border:1px solid #d946ef;border-radius:8px;background:#2e1065;color:#fae8ff;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
@keyframes mzOrb311{from{transform:translateY(2px) scale(.93)}to{transform:translateY(-7px) scale(1.08)}}
@keyframes mzRing311{0%{transform:scale(.08) rotate(0);opacity:0}25%{opacity:1}100%{transform:scale(1.35) rotate(270deg);opacity:0}}
@keyframes mzBurst311{0%{transform:scale(.1);opacity:0}25%{opacity:1}100%{transform:scale(5);opacity:0}}
@keyframes mzShard311{0%{transform:translate(-50%,-50%) scale(.3) rotate(0);opacity:0}25%{opacity:1}100%{transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1.6) rotate(240deg);opacity:0}}
@keyframes mzTitle311{0%{transform:translateY(20px);opacity:0}30%{opacity:1}100%{transform:translateY(-35px);opacity:0}}`;
 document.head.appendChild(style);
}
function chargeVisual(){
 let h=host();if(!h||!player)return;installCss();
 let e=document.getElementById('mosaic-charge311');
 if(player.cls==='dark'&&weapon()&&player.mosaicCharge311>0){
  if(!e){e=document.createElement('div');e.id='mosaic-charge311';e.innerHTML='<i class="fire"></i><i class="water"></i><i class="wind"></i><b></b>';h.appendChild(e)}
  Array.from(e.querySelectorAll('i')).forEach((orb,index)=>orb.classList.toggle('on',index<player.mosaicCharge311));
  e.querySelector('b').textContent='馬賽克蓄能 '+player.mosaicCharge311+'/3';
 }else if(e)e.remove();
}
function releaseVisual(){
 let h=host();if(!h)return;installCss();
 let old=document.getElementById('mosaic-release311');if(old)old.remove();
 let e=document.createElement('div');e.id='mosaic-release311';
 e.innerHTML='<i class="ring"></i><i class="burst"></i><i class="shard s1">✦</i><i class="shard s2">❄</i><i class="shard s3">ϟ</i><i class="shard s4">✦</i><i class="shard s5">❄</i><i class="shard s6">ϟ</i><strong>🔥❄️⚡ 馬賽克元素終結</strong>';
 h.appendChild(e);setTimeout(()=>{if(e&&e.remove)e.remove()},1150);
}
function badge(){
 let h=host();if(!h||!player)return;installCss();
 let e=document.getElementById('mosaic-status311');
 if(player.cls==='dark'&&weapon()){
  if(!e){e=document.createElement('div');e.id='mosaic-status311';h.appendChild(e)}
  ensure();let charge=Math.floor(player.mosaicCharge311||0),left=Math.ceil((player.mosaicChargeLeft311||0)/10),cd=Math.ceil((player.mosaicFinishCd311||0)/10);
  if(!doubleActive())e.textContent='馬賽克　需開啟雙重破壞';
  else if(charge<3)e.textContent='馬賽克蓄能 '+charge+'/3'+(charge?'　剩 '+left+'秒':'');
  else e.textContent='馬賽克 3/3保留　'+(cd>0?'CD '+cd+'秒':'會心一擊可釋放');
 }else if(e)e.remove();
 chargeVisual();
}
function addCharge(){
 ensure();if(!weapon()||player.cls!=='dark'||player.dead||!doubleActive())return false;
 let b=bonus(),before=player.mosaicCharge311,extra=before<3&&Math.random()*100<b.mzx?1:0,gain=1+extra;
 player.mosaicCharge311=Math.min(3,before+gain);player.mosaicChargeLeft311=duration();
 if(player.mosaicCharge311>before&&typeof logCombat==='function')logCombat('<span class="text-fuchsia-300 font-bold">【馬賽克】</span>元素蓄能 '+player.mosaicCharge311+'/3'+(extra?'（鳳凰聚氣 +1）':'')+'。','player-special');
 badge();return true;
}
function canRelease(){
 ensure();return !!(weapon()&&player.cls==='dark'&&!player.dead&&doubleActive()&&player.mosaicCharge311>=3&&player.mosaicFinishCd311<=0);
}
function pulseDamage(target,ele,b){
 let level=Math.max(1,Number(player.lv)||1),str=Math.max(0,Number(player.d&&player.d.str)||0),dex=Math.max(0,Number(player.d&&player.d.dex)||0),melee=Math.max(0,Number(player.d&&player.d.meleeDmg)||0);
 let raw=roll(1,10)+20+Math.floor(level*.8)+Math.floor(str*1.1)+Math.floor(dex*.9)+melee;
 let attr=typeof magicAttrDefense==='function'?Math.max(0,magicAttrDefense(target,ele)-b.mzp/100):0;
 let effectiveMr=Math.max(0,(Number(target.mr)||0)-b.mzp*2),mr=typeof mrMult==='function'?mrMult(effectiveMr):1,counter=typeof elementCounterMult==='function'?elementCounterMult(ele,target.e):1;
 let damage=Math.max(1,Math.floor(raw*.32*(1+b.mzd/100)*(1-attr)*mr*counter));
 if(typeof fragileMult==='function')damage=Math.max(1,Math.floor(damage*fragileMult(target)));
 if(typeof classSkillEquipMult==='function')damage=Math.max(1,Math.floor(damage*classSkillEquipMult(DB.skills[FINISH_SK],player,FINISH_SK)));
 if(typeof d2rHuntDamage==='function')damage=d2rHuntDamage(player,target,damage);
 return damage;
}
function release(primaryUid){
 if(!canRelease())return false;
 let b=bonus(),targets=live(),primary=targets.find(m=>String(m.uid)===String(primaryUid));
 if(primary)targets=[primary].concat(targets.filter(m=>m!==primary));
 targets=targets.slice(0,3+b.mzn);if(!targets.length)return false;
 player.mosaicFinishCd311=Math.max(50,Math.round(100*(1-b.mzc/100)));
 player.mosaicCharge311=3;player.mosaicChargeLeft311=duration();
 let rows=[];
 for(let target of targets){
  if(player.dead)break;
  let fire=pulseDamage(target,'fire',b),water=pulseDamage(target,'water',b),wind=pulseDamage(target,'wind',b),total=fire+water+wind;
  target.curHp-=total;target.justHit='wind';target._spellHurt=true;
  if(typeof moonShatterOnDamage==='function')moonShatterOnDamage(player,target,total);
  if(typeof reflectWallOnDamage==='function')reflectWallOnDamage(target,total,'magic',null);
  if(typeof mobWake==='function')mobWake(target);
  rows.push(target.n+' '+total+'（火'+fire+'／水'+water+'／風'+wind+'）');
  if(target.curHp<=0&&typeof killMob==='function'){
   let index=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);if(index!==-1)killMob(index);
  }
 }
 releaseVisual();
 if(rows.length&&typeof logCombat==='function')logCombat('<span class="text-fuchsia-200 font-bold">【馬賽克元素終結】</span>'+rows.join('、')+'；三層蓄能完整保留。','magic');
 try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
 badge();return true;
}

let oldAttack=window.playerAttack;
window.playerAttack=function(){
 let target=targetNow(),before=target&&Number(target.curHp),result=typeof oldAttack==='function'?oldAttack.apply(this,arguments):undefined;
 if(target&&Number.isFinite(before)&&Number(target.curHp)<before)addCharge();
 return result;
};
if(typeof playerAttack==='function')playerAttack=window.playerAttack;

let oldManual=window.manualCast;
window.manualCast=function(id){
 if(typeof oldManual!=='function')return false;
 if(id===CHARGE_SK){let result=oldManual.apply(this,arguments);badge();return result}
 if(id!==FINISH_SK)return oldManual.apply(this,arguments);
 let target=targetNow(),use=canRelease(),hp=player.hp,mp=player.mp,result=oldManual.apply(this,arguments);
 if(use&&result!==false&&(result===true||player.hp<hp||player.mp<mp))release(target&&target.uid);
 return result;
};
let oldInner=window.castSkillInner;
window.castSkillInner=function(id){
 if(typeof oldInner!=='function')return false;
 let target=id===FINISH_SK?targetNow():null,use=id===FINISH_SK&&canRelease(),result=oldInner.apply(this,arguments);
 if(use&&result)release(target&&target.uid);if(id===CHARGE_SK)badge();return result;
};
if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let oldTick=window.tick;
window.tick=function(){
 let result=typeof oldTick==='function'?oldTick.apply(this,arguments):undefined;ensure();
 if(player.mosaicFinishCd311>0)player.mosaicFinishCd311--;
 if(!weapon()||player.cls!=='dark'||player.dead||!doubleActive()){
  player.mosaicCharge311=0;player.mosaicChargeLeft311=0;
 }else if(player.mosaicCharge311>0){
  player.mosaicChargeLeft311--;
  if(player.mosaicChargeLeft311<=0){player.mosaicCharge311=0;player.mosaicChargeLeft311=0;if(typeof logCombat==='function')logCombat('<span class="text-slate-400">【馬賽克】元素蓄能消散。</span>','player-special')}
 }
 badge();return result;
};
ensure();
})();
