// 🏹 原技能「三重矢」× 新裝備「疾風獵弓」：多重箭雨 v3.9.9
(function(){
'use strict';
const SK='sk_elf_triple',WPN='wpn_gale_hunter_bow';

DB.items[WPN]={
 n:'疾風獵弓',type:'wpn',isBow:true,ranged:true,w2h:true,img:'assets/icons/weapons/沙哈之弓.png',
 dmgS:4,dmgL:4,hit:4,dmgBonus:5,rapidfire:85,spd:1,dex:2,ele:'wind',req:'elf',safe:6,
 p:320000,gachaWeight:5,core:'multiArrowRain',
 d:'妖精專屬雙手弓。三重矢延伸「多重箭雨」：原本三箭、15 MP 與箭矢消耗完整保留；成功施放後追加基礎6支風箭，分散攻擊場上敵人，每支造成一般箭方向65%的傷害。箭雨由疾風凝聚，不額外消耗箭矢。基礎冷卻7秒、最低3.5秒。全身妖精防具與飾品可出現專用強化詞綴。夢幻之島風精靈王5%掉落。'
};

function weapon(){
 return typeof buildFlowSource==='function'?buildFlowSource(player,'multiArrowRain'):null;
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 return{
  ard:Math.min(80,Number(total.ard)||0),
  arn:Math.min(4,Math.floor(Number(total.arn)||0)),
  arc:Math.min(25,Number(total.arc)||0),
  acd:Math.min(50,Number(total.acd)||0)
 };
}
function ensure(){
 if(player&&!Number.isFinite(player.multiArrowRainCd99))player.multiArrowRainCd99=0;
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
 if(document.getElementById('multi-arrow-rain99-css'))return;
 let style=document.createElement('style');
 style.id='multi-arrow-rain99-css';
 style.textContent=`
#multi-arrow-rain99{position:absolute;left:1%;bottom:5%;width:470px;height:310px;z-index:1007;pointer-events:none;overflow:visible}
#multi-arrow-rain99 img{position:absolute;left:0;bottom:35px;width:155px;filter:brightness(1.55) saturate(1.5) hue-rotate(75deg) drop-shadow(0 0 18px #67e8f9);animation:rainBow99 1.15s ease-out forwards}
#multi-arrow-rain99 .arrow{position:absolute;top:-15px;color:#ecfeff;font:bold 42px/45px serif;text-shadow:0 0 9px #22d3ee,0 0 16px #0284c7;transform:rotate(72deg);animation:rainArrow99 .85s cubic-bezier(.2,.7,.2,1) forwards}
#multi-arrow-rain99 .a1{left:135px}.a2{left:185px;animation-delay:.05s}.a3{left:235px;animation-delay:.1s}.a4{left:285px;animation-delay:.15s}.a5{left:335px;animation-delay:.2s}.a6{left:385px;animation-delay:.25s}
#multi-arrow-rain99 .gust{position:absolute;left:105px;bottom:70px;width:315px;height:95px;border-top:5px solid #a5f3fc;border-radius:50%;filter:drop-shadow(0 0 9px #06b6d4);animation:rainGust99 .9s ease-out forwards}
#multi-arrow-rain99 b{position:absolute;left:0;right:0;bottom:0;text-align:center;color:#cffafe;font:bold 17px/22px sans-serif;text-shadow:0 0 10px #0891b2,0 2px 4px #000;animation:rainTitle99 1.05s ease-out forwards}
#multi-arrow-rain-status99{position:absolute;right:3%;bottom:47px;z-index:1000;min-width:185px;padding:1px 8px;border:1px solid #22d3ee;border-radius:8px;background:#083344;color:#cffafe;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
@keyframes rainBow99{0%{transform:translate(-35px,45px) scale(.35);opacity:0}25%{opacity:1}100%{transform:translate(75px,-30px) scale(1.08);opacity:0}}
@keyframes rainArrow99{0%{transform:translate(-90px,-25px) rotate(72deg) scale(.5);opacity:0}25%{opacity:1}100%{transform:translate(35px,280px) rotate(72deg) scale(1.25);opacity:0}}
@keyframes rainGust99{0%{transform:scaleX(.1);opacity:0}35%{opacity:1}100%{transform:scaleX(1.25) translateX(35px);opacity:0}}
@keyframes rainTitle99{0%{transform:translateY(15px);opacity:0}30%{opacity:1}100%{transform:translateY(-28px);opacity:0}}`;
 document.head.appendChild(style);
}
function visual(){
 let h=host();if(!h)return;
 installCss();
 let old=document.getElementById('multi-arrow-rain99');if(old)old.remove();
 let e=document.createElement('div');
 e.id='multi-arrow-rain99';
 e.innerHTML='<img src="assets/icons/weapons/沙哈之弓.png" alt=""><i class="arrow a1">➶</i><i class="arrow a2">➶</i><i class="arrow a3">➶</i><i class="arrow a4">➶</i><i class="arrow a5">➶</i><i class="arrow a6">➶</i><i class="gust"></i><b>🏹 多重箭雨</b>';
 h.appendChild(e);
 setTimeout(()=>{if(e&&e.remove)e.remove()},1250);
}
function badge(){
 let h=host();if(!h||!player)return;
 let e=document.getElementById('multi-arrow-rain-status99');
 if(player.cls==='elf'&&weapon()){
  if(!e){e=document.createElement('div');e.id='multi-arrow-rain-status99';h.appendChild(e)}
  let cd=Math.ceil((player.multiArrowRainCd99||0)/10),b=bonus();
  e.textContent='多重箭雨 '+(6+b.arn)+'支　'+(cd>0?'CD '+cd+'秒':'可發動');
 }else if(e)e.remove();
}
function arrowDice(target,wpn,arrowData){
 if(arrowData)return Math.max(1,Number(target.s==='L'?arrowData.dmgL:arrowData.dmgS)||1);
 return Math.max(1,Number(wpn&&(target.s==='L'?wpn.dmgL:wpn.dmgS))||2);
}
function fireArrow(target,arrowData,b,delay){
 let wpn=weapon(),item=player.eq&&player.eq.wpn,forceCrit=Math.random()*100<b.arc;
 let res=typeof getPhysicalDmg==='function'
  ?getPhysicalDmg(arrowDice(target,wpn,arrowData),target,wpn,arrowData,false,false,false,forceCrit,item)
  :{hit:true,dmg:Math.max(1,Math.floor((Number(player.d&&player.d.rangedDmg)||10)+(Number(wpn&&wpn.dmgBonus)||0))),crit:forceCrit,ranged:true};
 if(!res||!res.hit)return{hit:false,dmg:0};
 let dealt=Math.max(1,Math.floor(res.dmg*.65*(1+b.ard/100)));
 if(typeof classSkillEquipMult==='function')dealt=Math.max(1,Math.floor(dealt*classSkillEquipMult(DB.skills[SK],player,SK)));
 if(typeof playArrowFx==='function')playArrowFx(player,target,delay);
 target.curHp-=dealt;target.justHit=typeof getWpnEle==='function'?getWpnEle(item,wpn):(wpn.ele||'wind');
 if(typeof moonShatterOnDamage==='function')moonShatterOnDamage(player,target,dealt);
 if(typeof reflectWallOnDamage==='function')reflectWallOnDamage(target,dealt,'ranged',null);
 if(typeof mobWake==='function')mobWake(target);
 return{hit:true,dmg:dealt,crit:!!res.crit};
}
function impact(primaryUid,arrowData){
 let b=bonus(),count=6+b.arn,rows={},primary=living().find(m=>String(m.uid)===String(primaryUid));
 for(let n=0;n<count&&!player.dead;n++){
  let all=living();if(!all.length)break;
  if(primary&&primary.curHp>0){all=[primary].concat(all.filter(m=>String(m.uid)!==String(primary.uid)))}
  let target=all[n%all.length],res=fireArrow(target,arrowData,b,n*55);
  if(!rows[target.n])rows[target.n]={hit:0,miss:0,dmg:0,crit:0};
  if(res.hit){rows[target.n].hit++;rows[target.n].dmg+=res.dmg;if(res.crit)rows[target.n].crit++}else rows[target.n].miss++;
  if(target.curHp<=0){
   let index=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);
   if(index!==-1&&typeof killMob==='function')killMob(index);
  }
 }
 let text=Object.keys(rows).map(name=>{let r=rows[name];return name+' '+r.dmg+(r.miss?'（Miss '+r.miss+'）':'')+(r.crit?'（暴擊 '+r.crit+'）':'')});
 if(text.length&&typeof logCombat==='function')logCombat('<span class="text-cyan-200 font-bold">【多重箭雨】</span>'+text.join('、'),'player');
 try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
}
function trigger(primaryUid,arrowData){
 ensure();
 if(!weapon()||player.cls!=='elf'||player.dead||player.multiArrowRainCd99>0||!living().length)return false;
 let b=bonus();
 player.multiArrowRainCd99=Math.max(35,Math.round(70*(1-b.acd/100)));
 visual();impact(primaryUid,arrowData);badge();
 return true;
}
function targetUid(){
 try{let target=typeof getTarget==='function'?getTarget():null;return target&&target.uid}catch(e){return null}
}
function arrowData(){
 let item=player&&player.eq&&player.eq.arrow;return item&&DB.items[item.id]||null;
}

let oldManual=window.manualCast;
window.manualCast=function(id){
 if(id!==SK||typeof oldManual!=='function')return typeof oldManual==='function'?oldManual.apply(this,arguments):false;
 let uid=targetUid(),arrow=arrowData(),mp=player.mp,cd=player.cds&&player.cds.atkSk,result=oldManual.apply(this,arguments);
 if(result!==false&&(player.mp<mp||(player.cds&&player.cds.atkSk)!==cd))trigger(uid,arrow);
 return result;
};
let oldInner=window.castSkillInner;
window.castSkillInner=function(id){
 if(typeof oldInner!=='function')return false;
 let uid=id===SK?targetUid():null,arrow=id===SK?arrowData():null,result=oldInner.apply(this,arguments);
 if(result&&id===SK)trigger(uid,arrow);
 return result;
};
if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let oldTick=window.tick;
window.tick=function(){
 let result=typeof oldTick==='function'?oldTick.apply(this,arguments):undefined;ensure();
 if(player.multiArrowRainCd99>0)player.multiArrowRainCd99--;
 badge();
 return result;
};
ensure();
})();
