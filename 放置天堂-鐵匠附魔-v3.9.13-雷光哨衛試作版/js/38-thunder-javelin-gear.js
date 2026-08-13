// ⚡ 原技能「三重矢」× 雷霆標槍：第三箭延伸為連鎖雷電 v3.8.96
(function(){
'use strict';
const SK='sk_elf_triple',W='wpn_thunder_javelin';
DB.items[W]={
 n:'雷霆標槍',img:'assets/icons/weapons/d2r-gear/thunder-javelin.png',
 type:'wpn',isBow:true,ranged:true,animFam:'gauntlet',oneHand:true,
 dmgS:4,dmgL:4,hit:3,dmgBonus:4,rapidfire:55,spd:1,req:'elf',safe:6,
 p:145000,gachaWeight:5,core:'thunderJavelin',cdr:20,
 d:'三重矢延伸：第三箭命中後向其他敵人跳出基礎最多4次雷電，每次傷害衰減20%。全身妖精防具與飾品可出現專用強化詞綴。基礎冷卻5秒、最低2.5秒；仍消耗箭矢，原本三重矢完全保留。林德拜爾 5% 掉落。'
};
function weapon(){
 return typeof buildFlowSource==='function'?buildFlowSource(player,'thunderJavelin'):null;
}
function live(){
 return mapState&&Array.isArray(mapState.mobs)?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[];
}
function kill(t){
 if(!t||t.curHp>0)return;
 let i=mapState.mobs.findIndex(m=>m&&m.uid===t.uid);
 if(i!==-1)killMob(i);
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 return{
  tjd:Math.min(80,Number(total.tjd)||0),
  tjn:Math.min(2,Math.floor(Number(total.tjn)||0)),
  tjs:Math.min(12,Number(total.tjs)||0),
  tjc:Math.min(50,Number(total.tjc)||0)
 };
}
function lightningDamage(t,jump,b){
 let dex=Math.max(0,Number(player.d&&player.d.dex)||Number(player.dex)||0);
 let ranged=Math.max(0,Number(player.d&&player.d.rangedDmg)||0);
 let raw=roll(2,8)+Math.floor(dex/3)+ranged;
 let attr=typeof magicAttrDefense==='function'?magicAttrDefense(t,'wind'):0;
 let mr=typeof mrMult==='function'?mrMult(Math.max(0,Number(t.mr)||0)):1;
 let ele=typeof elementCounterMult==='function'?elementCounterMult('wind',t.e):1;
 let decay=Math.max(.08,.20-b.tjs/100);
 return Math.max(1,Math.floor(raw*(1+b.tjd/100)*Math.pow(1-decay,jump)*(1-attr)*mr*ele));
}
function host(){
 let h=document.getElementById('battle-view')||document.getElementById('game-screen');
 if(h&&getComputedStyle(h).position==='static')h.style.position='relative';
 return h;
}
function chainFx(seq){
 let h=host(),ml=document.getElementById('mob-list');
 if(!h||!ml||!seq.length)return;
 let old=document.getElementById('thunder-javelin-fx');if(old)old.remove();
 let hr=h.getBoundingClientRect(),pts=[(hr.width*.10)+','+(hr.height*.67)];
 seq.forEach(m=>{
  let c=ml.querySelector('[data-uid="'+m.uid+'"]');
  if(c){let r=c.getBoundingClientRect();pts.push((r.left+r.width/2-hr.left)+','+(r.top+r.height/2-hr.top))}
 });
 if(pts.length<2)return;
 let svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.id='thunder-javelin-fx';svg.setAttribute('viewBox','0 0 '+hr.width+' '+hr.height);
 svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:1001;pointer-events:none;filter:drop-shadow(0 0 7px #38bdf8)';
 let p=document.createElementNS('http://www.w3.org/2000/svg','polyline');
 p.setAttribute('points',pts.join(' '));p.setAttribute('fill','none');p.setAttribute('stroke','#e0f2fe');
 p.setAttribute('stroke-width','6');p.setAttribute('stroke-linejoin','bevel');p.setAttribute('stroke-dasharray','12 5');
 svg.appendChild(p);h.appendChild(svg);setTimeout(()=>{if(svg.parentNode)svg.remove()},700);
}
function badge(){
 let h=host();if(!h||!player)return;
 let e=document.getElementById('thunder-javelin-status96');
 if(player.cls==='elf'&&weapon()){
  if(!e){
   e=document.createElement('div');e.id='thunder-javelin-status96';
   e.style.cssText='position:absolute;right:3%;bottom:47px;z-index:1000;min-width:175px;padding:1px 8px;border:1px solid #38bdf8;border-radius:8px;background:#082f49;color:#e0f2fe;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none';
   h.appendChild(e);
  }
  let b=bonus(),cd=Math.ceil((player.thunderJavelinCd||0)/10);
  e.textContent='雷霆標槍 '+(4+b.tjn)+'次彈跳　'+(cd>0?'CD '+cd+'秒':'可發動');
 }else if(e)e.remove();
}
function trigger(primaryUid){
 if((Number(window._chargedStrikeCasting)||0)>0)return;
 let w=weapon();
 if(!w||!player||player.cls!=='elf'||player.dead||(player.thunderJavelinCd||0)>0)return;
 let b=bonus(),targets=live().filter(m=>String(m.uid)!==String(primaryUid)).slice(0,4+b.tjn);
 if(!targets.length)return;
 let baseCd=Math.ceil(5000/(100+(w.cdr||0)));
 player.thunderJavelinCd=Math.max(25,Math.round(baseCd*(1-b.tjc/100)));
 let rows=[];
 targets.forEach((t,n)=>{
  let d=lightningDamage(t,n,b);t.curHp-=d;t.justHit='wind';t._spellHurt=true;
  rows.push(t.n+' '+d);kill(t);
 });
 chainFx(targets);
 logCombat('<span class="text-cyan-300 font-bold">【雷霆標槍】</span>第三箭引發連鎖雷電：'+rows.join('、'),'magic');
 badge();
 try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
}
function currentUid(){
 let t=typeof getTarget==='function'?getTarget():null;
 return t&&t.uid!=null?t.uid:null;
}
if(typeof window.manualCast==='function'){
 let om=window.manualCast;
 window.manualCast=function(id){
  if(id!==SK)return om.apply(this,arguments);
  let uid=currentUid(),mp=player.mp,c=(player.manualCd&&player.manualCd[id])||0,r=om.apply(this,arguments);
  if(player.mp<mp||((player.manualCd&&player.manualCd[id])||0)>c)trigger(uid);
  return r;
 };
}
if(typeof window.castSkillInner==='function'){
 let oi=window.castSkillInner;
 window.castSkillInner=function(id){
  if(id!==SK)return oi.apply(this,arguments);
  let uid=currentUid(),r=oi.apply(this,arguments);if(r)trigger(uid);return r;
 };
 castSkillInner=window.castSkillInner;
}
if(typeof window.tick==='function'){
 let ot=window.tick;
 window.tick=function(){
  let r=ot.apply(this,arguments);
  if(player&&!Number.isFinite(player.thunderJavelinCd))player.thunderJavelinCd=0;
  if(player&&player.thunderJavelinCd>0)player.thunderJavelinCd--;
  badge();
  return r;
 };
}
})();
