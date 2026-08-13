// 🖤 原技能「暗隱術」× 暗影幻身斗篷：暗影分身 v3.8.93
(function(){
'use strict';
const SK='sk_dark_stealth',CLOAK='clk_shadow_doppelganger';
DB.items[CLOAK]={
 n:'暗影幻身斗篷',img:'assets/icons/armors/暗靈的迷霧披肩.png',
 type:'arm',slot:'cloak',ac:5,er:8,mr:10,req:'dark',safe:4,
 p:240000,gachaWeight:5,core:'shadowClone',
 d:'暗隱術延伸：戰鬥中召喚可見暗影分身6秒，每秒模仿一次近戰攻擊。基礎冷卻14秒、最低7秒；原本暗隱術的100%物理閃避完全保留。暗殺軍王史雷佛5%掉落。'
};
function cloak(){
 return typeof buildFlowSource==='function'?buildFlowSource(player,'shadowClone'):null;
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 return{
  shd:Math.min(80,Number(total.shd)||0),
  shn:Math.min(2,Math.floor(Number(total.shn)||0)),
  sht:Math.min(60,Number(total.sht)||0),
  shc:Math.min(40,Number(total.shc)||0)
 };
}
function ensure(){
 if(!player)return;
 if(!Number.isFinite(player.shadowCloneCd93))player.shadowCloneCd93=0;
}
function live(){
 return mapState&&Array.isArray(mapState.mobs)?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[];
}
function host(){
 let h=document.getElementById('battle-view')||document.getElementById('game-screen');
 if(h&&getComputedStyle(h).position==='static')h.style.position='relative';
 return h;
}
function installCss(){
 if(document.getElementById('shadow-clone93-css'))return;
 let style=document.createElement('style');
 style.id='shadow-clone93-css';
 style.textContent=`
#shadow-clone93{position:absolute;left:4%;bottom:4%;width:260px;height:190px;z-index:1002;pointer-events:none}
#shadow-clone93 img{position:absolute;bottom:18px;width:112px;max-height:155px;object-fit:contain;opacity:.86;filter:brightness(.42) saturate(2.2) hue-rotate(235deg) drop-shadow(0 0 12px #c026d3);animation:shadowFloat93 .7s ease-in-out infinite alternate}
#shadow-clone93 img:nth-child(1){left:4px}
#shadow-clone93 img:nth-child(2){left:74px;animation-delay:-.22s}
#shadow-clone93 img:nth-child(3){left:144px;animation-delay:-.44s}
#shadow-clone93 b{position:absolute;left:0;right:0;bottom:0;text-align:center;color:#f5d0fe;text-shadow:0 0 8px #a21caf,0 2px 4px #000}
#shadow-clone-status93{position:absolute;right:3%;bottom:2px;z-index:1000;min-width:165px;padding:1px 8px;border:1px solid #c026d3;border-radius:8px;background:#1e1b4b;color:#f5d0fe;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
@keyframes shadowFloat93{from{transform:translateY(2px) scale(.98)}to{transform:translateY(-7px) scale(1.03)}}`;
 document.head.appendChild(style);
}
function visual(){
 let h=host();if(!h||!player)return;
 installCss();
 let active=player.shadowClone93,e=document.getElementById('shadow-clone93');
 if(active&&active.left>0&&cloak()&&player.cls==='dark'&&!player.dead){
  if(!e){e=document.createElement('div');e.id='shadow-clone93';e.innerHTML='<b>🌑 暗影分身</b>';h.appendChild(e)}
  let imgs=Array.from(e.querySelectorAll('img'));
  while(imgs.length<active.count){let img=document.createElement('img');e.insertBefore(img,e.querySelector('b'));imgs.push(img)}
  while(imgs.length>active.count){imgs.pop().remove()}
  let attacking=(active.anim||0)>0,kind=attacking?'attack':'idle',max=attacking?9:10;
  imgs.forEach((img,index)=>{img.src='assets/anim/黑暗妖精盜賊/'+kind+'_'+((state.ticks+index*2)%max)+'.png'});
 }else if(e)e.remove();
 let badge=document.getElementById('shadow-clone-status93');
 if(player.cls==='dark'&&cloak()){
  if(!badge){badge=document.createElement('div');badge.id='shadow-clone-status93';h.appendChild(badge)}
  let cd=Math.ceil((player.shadowCloneCd93||0)/10),count=1+bonus().shn;
  badge.textContent='暗影分身 ×'+count+'　'+(active&&active.left>0?'作戰中 '+Math.ceil(active.left/10)+'秒':(cd>0?'CD '+cd+'秒':'可召喚'));
 }else if(badge)badge.remove();
}
function physicalDamage(target){
 let b=bonus(),str=Number(player.d&&player.d.str)||Number(player.base&&player.base.str)||10;
 let melee=Number(player.d&&player.d.meleeDmg)||0;
 let raw=18+(Number(player.lv)||1)*1.15+str*1.8+melee;
 let reduced=Math.max(1,raw-(Number(target.dr)||0)-(typeof mobHardSkin==='function'?mobHardSkin(target):0));
 let fragile=typeof fragileMult==='function'?fragileMult(target):1;
 let weapon=player.eq&&player.eq.wpn,def=weapon&&DB.items[weapon.id],element=typeof getWpnEle==='function'?getWpnEle(weapon,def):'none';
 let counter=typeof elementCounterMult==='function'?elementCounterMult(element,target.e):1;
 let damage=Math.max(1,Math.floor(reduced*(1+b.shd/100)*fragile*counter));
 return typeof d2rHuntDamage==='function'?d2rHuntDamage(player,target,damage):damage;
}
function strike(){
 let active=player.shadowClone93,targets=live();if(!active||!targets.length)return;
 let rows=[];
 for(let n=0;n<active.count&&targets.length;n++){
  let target=targets[(active.hit+n)%targets.length],damage=physicalDamage(target);
  target.curHp-=damage;target.justHit='physical';
  if(typeof mobWake==='function')mobWake(target);
  if(typeof reflectWallOnDamage==='function')reflectWallOnDamage(target,damage,'melee',null);
  rows.push(target.n+' '+damage);
  if(player.dead)break;
  if(target.curHp<=0){
   let index=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);
   if(index!==-1)killMob(index);
   targets=live();
  }
 }
 active.hit=(active.hit+active.count)%Math.max(1,targets.length||1);
 active.anim=4;
 if(rows.length)logCombat('<span class="text-fuchsia-300 font-bold">【暗影分身】</span>'+rows.join('、'),'player-special');
 try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
}
function trigger(){
 ensure();
 if(!cloak()||player.cls!=='dark'||player.dead||player.shadowCloneCd93>0||!live().length)return false;
 let b=bonus();
 player.shadowCloneCd93=Math.max(70,Math.round(140*(1-b.shc/100)));
 player.shadowClone93={left:Math.round(60*(1+b.sht/100)),next:1,count:1+b.shn,hit:0,anim:0};
 logCombat('<span class="text-fuchsia-300 font-bold">【暗影分身流派】</span>你的暗隱術分裂出戰鬥幻影！','player-special');
 visual();
 return true;
}
let oldManual=window.manualCast;
window.manualCast=function(id){
 if(id!==SK)return oldManual.apply(this,arguments);
 let mp=player.mp,before=(player.buffs&&player.buffs[SK])||0,result=oldManual.apply(this,arguments);
 if(player.mp<mp||((player.buffs&&player.buffs[SK])||0)>before)trigger();
 return result;
};
let oldInner=window.castSkillInner;
window.castSkillInner=function(id){
 let result=oldInner.apply(this,arguments);
 if(result&&id===SK)trigger();
 return result;
};
if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let oldTick=window.tick;
window.tick=function(){
 let result=oldTick.apply(this,arguments);ensure();
 if(player.shadowCloneCd93>0)player.shadowCloneCd93--;
 if(player.shadowClone93){
  if(!cloak()||player.cls!=='dark'||player.dead)player.shadowClone93=null;
  else{
   let active=player.shadowClone93;active.left--;active.next--;if(active.anim>0)active.anim--;
   if(active.left>0&&active.next<=0){strike();active.next=10}
   if(active.left<=0)player.shadowClone93=null;
  }
 }
 visual();
 return result;
};
ensure();
})();
