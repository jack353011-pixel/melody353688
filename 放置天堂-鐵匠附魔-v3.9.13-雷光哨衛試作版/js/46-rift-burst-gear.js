// 🕳️ 原技能「粉碎能量」× 新裝備「裂界奇古獸」：裂界衝擊 v3.9.8
(function(){
'use strict';
const SK='sk_illu_crush',WPN='wpn_rift_qigu';

DB.items[WPN]={
 n:'裂界奇古獸',type:'wpn',qigu:true,img:'assets/icons/weapons/黑曜石奇古獸.png',
 dmgS:30,dmgL:30,hit:0,spd:.8,mdmg:2,int:2,mpR:3,req:'illusion',safe:6,
 p:380000,gachaWeight:5,core:'riftBurst',
 d:'幻術士專屬·奇古獸。粉碎能量延伸「裂界衝擊」：原本單體武器傷害與 MP 消耗完整保留；命中後追加可見的裂界震波，基礎最多攻擊3名目標，造成原技能方向60%的武器震波傷害，並有10%基礎機率短暫暈眩。基礎冷卻6秒、最低3秒。全身幻術士防具與飾品可出現專用強化詞綴。邪惡的鐮刀死神5%掉落。'
};

function weapon(){
 return typeof buildFlowSource==='function'?buildFlowSource(player,'riftBurst'):null;
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 return{
  rbd:Math.min(80,Number(total.rbd)||0),
  rbn:Math.min(2,Math.floor(Number(total.rbn)||0)),
  rbf:Math.min(25,Number(total.rbf)||0),
  rbc:Math.min(50,Number(total.rbc)||0)
 };
}
function ensure(){
 if(player&&!Number.isFinite(player.riftBurstCd98))player.riftBurstCd98=0;
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
 if(document.getElementById('rift-burst98-css'))return;
 let style=document.createElement('style');
 style.id='rift-burst98-css';
 style.textContent=`
#rift-burst98{position:absolute;left:2%;bottom:7%;width:440px;height:275px;z-index:1006;pointer-events:none;overflow:visible}
#rift-burst98 img{position:absolute;left:2px;bottom:38px;width:150px;filter:brightness(1.6) saturate(1.8) hue-rotate(225deg) drop-shadow(0 0 20px #a855f7);animation:riftBeast98 1.05s ease-out forwards}
#rift-burst98 .rift{position:absolute;left:105px;bottom:82px;width:250px;height:120px;clip-path:polygon(0 45%,18% 25%,26% 44%,45% 10%,51% 43%,72% 20%,68% 52%,100% 42%,72% 64%,81% 92%,51% 61%,39% 100%,34% 60%,12% 78%,21% 55%);background:linear-gradient(90deg,#581c87,#e9d5ff 45%,#7e22ce);filter:drop-shadow(0 0 9px #d8b4fe);animation:riftCrack98 .92s cubic-bezier(.2,.7,.2,1) forwards}
#rift-burst98 .wave{position:absolute;left:120px;bottom:102px;width:90px;height:45px;border:5px solid #d8b4fe;border-left:0;border-radius:0 60% 60% 0;filter:drop-shadow(0 0 8px #9333ea);animation:riftWave98 .85s ease-out forwards}
#rift-burst98 .w2{animation-delay:.08s}.w3{animation-delay:.16s}
#rift-burst98 b{position:absolute;left:0;right:0;bottom:0;text-align:center;color:#f3e8ff;font:bold 17px/22px sans-serif;text-shadow:0 0 10px #7e22ce,0 2px 4px #000;animation:riftTitle98 1s ease-out forwards}
#rift-burst-status98{position:absolute;right:3%;bottom:70px;z-index:1000;min-width:180px;padding:1px 8px;border:1px solid #a855f7;border-radius:8px;background:#1e1033;color:#f3e8ff;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
@keyframes riftBeast98{0%{transform:translate(-35px,45px) scale(.35);opacity:0}25%{opacity:1}100%{transform:translate(70px,-35px) scale(1.1);opacity:0}}
@keyframes riftCrack98{0%{transform:scaleX(.05) scaleY(.3);opacity:0}25%{opacity:1}100%{transform:translateX(70px) scaleX(1.35) scaleY(1.2);opacity:0}}
@keyframes riftWave98{0%{transform:scale(.1);opacity:0}30%{opacity:1}100%{transform:translate(205px,-30px) scale(3.1);opacity:0}}
@keyframes riftTitle98{0%{transform:translateY(15px);opacity:0}30%{opacity:1}100%{transform:translateY(-28px);opacity:0}}`;
 document.head.appendChild(style);
}
function visual(){
 let h=host();if(!h)return;
 installCss();
 let old=document.getElementById('rift-burst98');if(old)old.remove();
 let e=document.createElement('div');
 e.id='rift-burst98';
 e.innerHTML='<img src="assets/icons/weapons/黑曜石奇古獸.png" alt=""><i class="rift"></i><i class="wave w1"></i><i class="wave w2"></i><i class="wave w3"></i><b>🕳️ 裂界衝擊</b>';
 h.appendChild(e);
 setTimeout(()=>{if(e&&e.remove)e.remove()},1150);
}
function badge(){
 let h=host();if(!h||!player)return;
 let e=document.getElementById('rift-burst-status98');
 if(player.cls==='illusion'&&weapon()){
  if(!e){e=document.createElement('div');e.id='rift-burst-status98';h.appendChild(e)}
  let cd=Math.ceil((player.riftBurstCd98||0)/10),b=bonus();
  e.textContent='裂界衝擊 '+(3+b.rbn)+'目標　'+(cd>0?'CD '+cd+'秒':'可發動');
 }else if(e)e.remove();
}
function damage(target){
 let b=bonus(),item=player.eq&&player.eq.wpn,def=item&&DB.items[item.id];
 let dice=Math.max(1,Number(def&&(target.s==='L'?def.dmgL:def.dmgS))||2);
 let rolled=typeof roll==='function'?roll(1,dice):Math.max(1,Math.ceil(dice/2));
 let en=typeof enhanceWpnBonus==='function'?Number(enhanceWpnBonus(item&&item.en).dmg)||0:Math.max(0,Number(item&&item.en)||0);
 let base=rolled+(Number(player.d&&player.d.meleeDmg)||0)+en;
 let ele=typeof getWpnEle==='function'?getWpnEle(item,def):(def&&def.ele)||'none';
 let attr=typeof magicAttrDefense==='function'?magicAttrDefense(target,ele):0;
 let raw=typeof magicBaseDamage==='function'?magicBaseDamage(base,player.d,0,true):base+(Number(player.d&&player.d.magicDmg)||0);
 let coef=typeof magicDamageCoef==='function'?magicDamageCoef(player.d,attr,1):Math.max(0,1-attr);
 let mult=.60*(1+b.rbd/100);
 if(typeof fragileMult==='function')mult*=fragileMult(target);
 if(typeof illuLvMult==='function')mult*=illuLvMult(player);
 if(typeof wpnEnFinalMult==='function')mult*=wpnEnFinalMult(item);
 if(typeof elementCounterMult==='function')mult*=elementCounterMult(ele,target.e);
 if(typeof classSkillEquipMult==='function')mult*=classSkillEquipMult(DB.skills[SK],player,SK);
 let dealt=Math.max(1,Math.floor(raw*coef*mult));
 return typeof d2rHuntDamage==='function'?d2rHuntDamage(player,target,dealt):dealt;
}
function impact(primaryUid){
 let b=bonus(),all=living(),primary=all.find(m=>m.uid===primaryUid);
 let targets=(primary?[primary]:[]).concat(all.filter(m=>!primary||m.uid!==primary.uid)).slice(0,3+b.rbn);
 let rows=[],stunChance=10+b.rbf;
 targets.forEach(target=>{
  let dealt=damage(target);
  target.curHp-=dealt;target.justHit='magic';target._spellHurt=true;
  if(typeof mobWake==='function')mobWake(target);
  if(target.curHp>0&&Math.random()*100<stunChance&&typeof applyMobStatus==='function'){
   applyMobStatus(target,{kind:'stun',dur:1},'裂界衝擊');
  }
  rows.push(target.n+' '+dealt);
  if(target.curHp<=0){
   let mobIndex=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);
   if(mobIndex!==-1&&typeof killMob==='function')killMob(mobIndex);
  }
 });
 if(rows.length&&typeof logCombat==='function')logCombat('<span class="text-fuchsia-300 font-bold">【裂界衝擊】</span>'+rows.join('、'),'magic');
 try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
}
function trigger(primaryUid){
 ensure();
 if(!weapon()||player.cls!=='illusion'||player.dead||player.riftBurstCd98>0||!living().length)return false;
 let b=bonus();
 player.riftBurstCd98=Math.max(30,Math.round(60*(1-b.rbc/100)));
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
 if(player.riftBurstCd98>0)player.riftBurstCd98--;
 badge();
 return result;
};
ensure();
})();
