// 👁️ 原技能「心靈破壞」× 新裝備「夢魘奇古獸」：心靈共振 v3.9.7
(function(){
'use strict';
const SK='sk_illu_mindbreak',WPN='wpn_nightmare_qigu';

DB.items[WPN]={
 n:'夢魘奇古獸',type:'wpn',qigu:true,img:'assets/icons/weapons/共鳴奇古獸.png',
 dmgS:28,dmgL:28,hit:0,spd:.8,mdmg:2,wis:2,mpR:5,req:'illusion',safe:6,
 p:320000,gachaWeight:5,core:'mindEcho',
 d:'幻術士專屬·奇古獸。心靈破壞延伸「心靈共振」：原本單體傷害與最大 MP 5% 消耗完整保留；命中後追加可見心靈波，基礎最多攻擊2名目標，每次擴散傷害衰減25%。基礎冷卻7秒、最低3.5秒。全身幻術士防具與飾品可出現專用強化詞綴。不幸的幻象眼魔5%掉落。'
};

function weapon(){
 let item=player&&player.eq&&player.eq.wpn,def=item&&DB.items[item.id];
 return item&&item.id===WPN&&def&&def.core==='mindEcho'?def:null;
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 return{
  med:Math.min(80,Number(total.med)||0),
  men:Math.min(2,Math.floor(Number(total.men)||0)),
  mes:Math.min(15,Number(total.mes)||0),
  mec:Math.min(50,Number(total.mec)||0)
 };
}
function ensure(){
 if(player&&!Number.isFinite(player.mindEchoCd97))player.mindEchoCd97=0;
}
function living(){
 return typeof mapState!=='undefined'&&mapState&&Array.isArray(mapState.mobs)
  ?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[];
}
function host(){
 let h=document.getElementById('battle-view')||document.getElementById('game-screen');
 if(h&&getComputedStyle(h).position==='static')h.style.position='relative';
 return h;
}
function installCss(){
 if(document.getElementById('mind-echo97-css'))return;
 let style=document.createElement('style');
 style.id='mind-echo97-css';
 style.textContent=`
#mind-echo97{position:absolute;left:3%;bottom:8%;width:390px;height:260px;z-index:1005;pointer-events:none;overflow:visible}
#mind-echo97 img{position:absolute;left:8px;bottom:35px;width:145px;filter:brightness(1.45) saturate(1.7) hue-rotate(235deg) drop-shadow(0 0 20px #c084fc);animation:mindEye97 1.05s ease-out forwards}
#mind-echo97 .iris{position:absolute;left:95px;bottom:85px;width:82px;height:48px;border:4px solid #e9d5ff;border-radius:55% 45% 55% 45%;transform:rotate(-10deg);box-shadow:0 0 13px #c084fc,inset 0 0 15px #7e22ce;animation:mindIris97 .95s ease-out forwards}
#mind-echo97 .iris:after{content:'';position:absolute;left:27px;top:8px;width:22px;height:22px;border-radius:50%;background:#f5d0fe;box-shadow:0 0 12px 7px #a855f7}
#mind-echo97 .ring{position:absolute;left:115px;bottom:97px;width:40px;height:18px;border:4px solid #d8b4fe;border-radius:50%;filter:drop-shadow(0 0 7px #a855f7);animation:mindRing97 .85s ease-out forwards}
#mind-echo97 .r2{animation-delay:.09s}.r3{animation-delay:.18s}
#mind-echo97 b{position:absolute;left:0;right:0;bottom:2px;text-align:center;color:#f3e8ff;font:bold 17px/22px sans-serif;text-shadow:0 0 9px #9333ea,0 2px 4px #000;animation:mindTitle97 1s ease-out forwards}
#mind-echo-status97{position:absolute;right:3%;bottom:70px;z-index:1000;min-width:180px;padding:1px 8px;border:1px solid #c084fc;border-radius:8px;background:#2e1065;color:#f3e8ff;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
@keyframes mindEye97{0%{transform:translate(-35px,35px) scale(.3) rotate(-15deg);opacity:0}25%{opacity:1}100%{transform:translate(80px,-45px) scale(1.12) rotate(8deg);opacity:0}}
@keyframes mindIris97{0%{transform:rotate(-10deg) scale(.1);opacity:0}30%{opacity:1}100%{transform:rotate(-10deg) scale(1.6);opacity:0}}
@keyframes mindRing97{0%{transform:scale(.15);opacity:0}30%{opacity:1}100%{transform:translate(190px,-55px) scale(4.6);opacity:0}}
@keyframes mindTitle97{0%{transform:translateY(15px);opacity:0}30%{opacity:1}100%{transform:translateY(-28px);opacity:0}}`;
 document.head.appendChild(style);
}
function visual(){
 let h=host();if(!h)return;
 installCss();
 let old=document.getElementById('mind-echo97');if(old)old.remove();
 let e=document.createElement('div');
 e.id='mind-echo97';
 e.innerHTML='<img src="assets/icons/weapons/共鳴奇古獸.png" alt=""><i class="iris"></i><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i><b>👁 心靈共振</b>';
 h.appendChild(e);
 setTimeout(()=>{if(e&&e.remove)e.remove()},1150);
}
function badge(){
 let h=host();if(!h||!player)return;
 let e=document.getElementById('mind-echo-status97');
 if(player.cls==='illusion'&&weapon()){
  if(!e){e=document.createElement('div');e.id='mind-echo-status97';h.appendChild(e)}
  let cd=Math.ceil((player.mindEchoCd97||0)/10),b=bonus();
  e.textContent='心靈共振 '+(2+b.men)+'目標　'+(cd>0?'CD '+cd+'秒':'可發動');
 }else if(e)e.remove();
}
function damage(target,index){
 let b=bonus(),spent=Math.max(1,Math.floor((Number(player.mmp)||0)*.05));
 let base=typeof magicBaseDamage==='function'?magicBaseDamage(spent,player.d,0,true):spent+(Number(player.d&&player.d.magicDmg)||0);
 let attr=typeof magicAttrDefense==='function'?magicAttrDefense(target,'none'):0;
 let coef=typeof magicDamageCoef==='function'?magicDamageCoef(player.d,attr,2):Math.max(0,1-attr);
 let mr=typeof mrMult==='function'?mrMult(Math.max(0,Number(target.mr)||0)):1;
 let decay=Math.max(.10,.25-b.mes/100),raw=base*coef*.70;
 let mult=(1+b.med/100)*Math.pow(1-decay,index)*mr;
 if(typeof fragileMult==='function')mult*=fragileMult(target);
 if(typeof illuLvMult==='function')mult*=illuLvMult(player);
 if(typeof wpnEnFinalMult==='function')mult*=wpnEnFinalMult(player.eq&&player.eq.wpn);
 if(typeof classSkillEquipMult==='function')mult*=classSkillEquipMult(DB.skills[SK],player,SK);
 let dealt=Math.max(1,Math.floor(raw*mult));
 return typeof d2rHuntDamage==='function'?d2rHuntDamage(player,target,dealt):dealt;
}
function impact(primaryUid){
 let b=bonus(),all=living(),primary=all.find(m=>m.uid===primaryUid);
 let targets=(primary?[primary]:[]).concat(all.filter(m=>!primary||m.uid!==primary.uid)).slice(0,2+b.men);
 let rows=[];
 targets.forEach((target,index)=>{
  let dealt=damage(target,index);
  target.curHp-=dealt;target.justHit='magic';target._spellHurt=true;
  if(typeof mobWake==='function')mobWake(target);
  rows.push(target.n+' '+dealt);
  if(target.curHp<=0){
   let mobIndex=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);
   if(mobIndex!==-1&&typeof killMob==='function')killMob(mobIndex);
  }
 });
 if(rows.length&&typeof logCombat==='function')logCombat('<span class="text-purple-300 font-bold">【心靈共振】</span>'+rows.join('、'),'magic');
 try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
}
function trigger(primaryUid){
 ensure();
 if(!weapon()||player.cls!=='illusion'||player.dead||player.mindEchoCd97>0||!living().length)return false;
 let b=bonus();
 player.mindEchoCd97=Math.max(35,Math.round(70*(1-b.mec/100)));
 visual();impact(primaryUid);badge();
 return true;
}
function targetUid(){
 try{let target=typeof getTarget==='function'?getTarget():null;return target&&target.uid}catch(e){return null}
}

let oldManual=window.manualCast;
window.manualCast=function(id){
 if(id!==SK||typeof oldManual!=='function')return typeof oldManual==='function'?oldManual.apply(this,arguments):false;
 let uid=targetUid(),mp=player.mp,cd=player.cds&&player.cds.atkSk,result=oldManual.apply(this,arguments);
 if(result!==false&&(player.mp<mp||(player.cds&&player.cds.atkSk)!==cd))trigger(uid);
 return result;
};
let oldInner=window.castSkillInner;
window.castSkillInner=function(id){
 if(typeof oldInner!=='function')return false;
 let uid=id===SK?targetUid():null,result=oldInner.apply(this,arguments);
 if(result&&id===SK)trigger(uid);
 return result;
};
if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let oldTick=window.tick;
window.tick=function(){
 let result=typeof oldTick==='function'?oldTick.apply(this,arguments):undefined;ensure();
 if(player.mindEchoCd97>0)player.mindEchoCd97--;
 badge();
 return result;
};
ensure();
})();
