// ⚡ 原技能「精準射擊＋三重矢」× 雷霆標槍：充能一擊 v3.9.10
(function(){
'use strict';
const PRECISE='sk_elf_preciseshot',TRIPLE='sk_elf_triple',WPN='wpn_thunder_javelin';

function weapon(){
 return typeof buildFlowSource==='function'?buildFlowSource(player,'thunderJavelin'):null;
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 return{
  csd:Math.min(80,Number(total.csd)||0),
  csn:Math.min(2,Math.floor(Number(total.csn)||0)),
  csp:Math.min(25,Number(total.csp)||0),
  csc:Math.min(50,Number(total.csc)||0)
 };
}
function ensure(){
 if(player&&!Number.isFinite(player.chargedStrikeCd310))player.chargedStrikeCd310=0;
}
function preciseActive(){
 return !!(player&&player.buffs&&(Number(player.buffs[PRECISE])||0)>0);
}
function ready(){
 ensure();
 return !!(player&&player.cls==='elf'&&!player.dead&&weapon()&&preciseActive()&&player.chargedStrikeCd310<=0);
}
function currentTarget(){
 try{let target=typeof getTarget==='function'?getTarget():null;return target&&target.uid!=null?target:null}catch(e){return null}
}
function findTarget(uid){
 if(typeof mapState==='undefined'||!mapState||!Array.isArray(mapState.mobs))return null;
 return mapState.mobs.find(m=>m&&String(m.uid)===String(uid)&&m.curHp>0&&!m._dead)||null;
}
function host(){
 let h=document.getElementById('battle-view')||document.getElementById('game-screen');
 if(h&&getComputedStyle(h).position==='static')h.style.position='relative';
 return h;
}
function installCss(){
 if(document.getElementById('charged-strike310-css'))return;
 let style=document.createElement('style');style.id='charged-strike310-css';
 style.textContent=`
#charged-strike310{position:absolute;inset:0;z-index:1008;pointer-events:none;overflow:hidden}
#charged-strike310 img{position:absolute;left:4%;bottom:12%;width:130px;filter:brightness(1.7) saturate(1.6) hue-rotate(165deg) drop-shadow(0 0 18px #38bdf8);animation:csJavelin310 .8s ease-out forwards}
#charged-strike310 svg{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 0 7px #0ea5e9)}
#charged-strike310 path{fill:none;stroke:#e0f2fe;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:13 6;animation:csBolt310 .72s ease-out forwards}
#charged-strike310 b{position:absolute;left:0;right:0;bottom:18%;text-align:center;color:#bae6fd;font:bold 18px/24px sans-serif;text-shadow:0 0 12px #0284c7,0 2px 4px #000;animation:csTitle310 .9s ease-out forwards}
#charged-strike-status310{position:absolute;right:3%;bottom:70px;z-index:1000;min-width:190px;padding:1px 8px;border:1px solid #60a5fa;border-radius:8px;background:#172554;color:#dbeafe;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
@keyframes csJavelin310{0%{transform:translate(-30px,35px) rotate(-18deg) scale(.35);opacity:0}25%{opacity:1}100%{transform:translate(180px,-70px) rotate(8deg) scale(1.15);opacity:0}}
@keyframes csBolt310{0%{stroke-dashoffset:80;opacity:0}20%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes csTitle310{0%{transform:translateY(15px);opacity:0}30%{opacity:1}100%{transform:translateY(-30px);opacity:0}}`;
 document.head.appendChild(style);
}
function visual(target,count){
 let h=host();if(!h)return;installCss();
 let old=document.getElementById('charged-strike310');if(old)old.remove();
 let hr=h.getBoundingClientRect(),x=hr.width*.72,y=hr.height*.42,ml=document.getElementById('mob-list');
 if(ml&&target){let card=ml.querySelector('[data-uid="'+target.uid+'"]');if(card){let r=card.getBoundingClientRect();x=r.left+r.width/2-hr.left;y=r.top+r.height/2-hr.top}}
 let starts=[[hr.width*.12,hr.height*.70],[hr.width*.20,hr.height*.58],[hr.width*.29,hr.height*.76],[hr.width*.35,hr.height*.49],[hr.width*.43,hr.height*.68],[hr.width*.51,hr.height*.55]];
 let paths=starts.slice(0,count).map((p,i)=>{
  let mx=(p[0]+x)/2+(i%2?18:-18),my=(p[1]+y)/2+(i%3-1)*24;
  return '<path d="M '+p[0]+' '+p[1]+' L '+mx+' '+my+' L '+x+' '+y+'" style="animation-delay:'+(i*.04)+'s"/>';
 }).join('');
 let e=document.createElement('div');e.id='charged-strike310';
 e.innerHTML='<img src="assets/icons/weapons/d2r-gear/thunder-javelin.png" alt=""><svg viewBox="0 0 '+hr.width+' '+hr.height+'">'+paths+'</svg><b>⚡ 充能一擊 × '+count+'</b>';
 h.appendChild(e);setTimeout(()=>{if(e&&e.remove)e.remove()},1000);
}
function badge(){
 let h=host();if(!h||!player)return;
 let e=document.getElementById('charged-strike-status310');
 if(player.cls==='elf'&&weapon()){
  if(!e){e=document.createElement('div');e.id='charged-strike-status310';h.appendChild(e)}
  let count=4+bonus().csn,cd=Math.ceil((player.chargedStrikeCd310||0)/10);
  e.textContent=!preciseActive()?'充能一擊　需精準射擊':('充能一擊 '+count+'電束　'+(cd>0?'CD '+cd+'秒':'可發動'));
 }else if(e)e.remove();
}
function boltDamage(target,b){
 let dex=Math.max(0,Number(player.d&&player.d.dex)||Number(player.dex)||0);
 let ranged=Math.max(0,Number(player.d&&player.d.rangedDmg)||0);
 let raw=roll(2,8)+Math.floor(dex/3)+ranged;
 let attr=typeof magicAttrDefense==='function'?Math.max(0,magicAttrDefense(target,'wind')-b.csp/100):0;
 let effectiveMr=Math.max(0,(Number(target.mr)||0)-b.csp*2);
 let mr=typeof mrMult==='function'?mrMult(effectiveMr):1;
 let ele=typeof elementCounterMult==='function'?elementCounterMult('wind',target.e):1;
 let damage=Math.max(1,Math.floor(raw*.55*(1+b.csd/100)*(1-attr)*mr*ele));
 if(typeof classSkillEquipMult==='function')damage=Math.max(1,Math.floor(damage*classSkillEquipMult(DB.skills[TRIPLE],player,TRIPLE)));
 if(typeof d2rHuntDamage==='function')damage=d2rHuntDamage(player,target,damage);
 return damage;
}
function strike(uid){
 ensure();
 let target=findTarget(uid);if(!ready()||!target)return false;
 let b=bonus(),count=4+b.csn,total=0;
 for(let i=0;i<count;i++)total+=boltDamage(target,b);
 player.chargedStrikeCd310=Math.max(40,Math.round(80*(1-b.csc/100)));
 target.curHp-=total;target.justHit='wind';target._spellHurt=true;
 if(typeof moonShatterOnDamage==='function')moonShatterOnDamage(player,target,total);
 if(typeof reflectWallOnDamage==='function')reflectWallOnDamage(target,total,'magic',null);
 if(typeof mobWake==='function')mobWake(target);
 visual(target,count);
 if(typeof logCombat==='function')logCombat('<span class="text-sky-300 font-bold">【充能一擊】</span>'+count+'道電束集中命中 '+target.n+'，共 '+total+' 點風屬性傷害。','magic');
 if(target.curHp<=0&&typeof killMob==='function'){
  let index=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);if(index!==-1)killMob(index);
 }
 badge();try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
 return true;
}
function successful(beforeMp,beforeCd,result,id){
 let afterCd=player&&player.cds&&player.cds.atkSk;
 let manualCd=player&&player.manualCd&&player.manualCd[id];
 return result!==false&&((player&&player.mp<beforeMp)||afterCd!==beforeCd||(Number(manualCd)||0)>0||result===true);
}
function suppressBegin(){window._chargedStrikeCasting=(Number(window._chargedStrikeCasting)||0)+1}
function suppressEnd(){window._chargedStrikeCasting=Math.max(0,(Number(window._chargedStrikeCasting)||1)-1)}
function activate(){ensure();player.chargedStrikeCd310=0;badge()}

let oldManual=window.manualCast;
window.manualCast=function(id){
 if(typeof oldManual!=='function')return false;
 if(id===PRECISE){let mp=player.mp,cd=player.cds&&player.cds.atkSk,result=oldManual.apply(this,arguments);if(successful(mp,cd,result,id))activate();return result}
 if(id!==TRIPLE)return oldManual.apply(this,arguments);
 let target=currentTarget(),use=ready(),mp=player.mp,cd=player.cds&&player.cds.atkSk,result;
 if(use)suppressBegin();try{result=oldManual.apply(this,arguments)}finally{if(use)suppressEnd()}
 if(use&&successful(mp,cd,result,id))strike(target&&target.uid);
 return result;
};
let oldInner=window.castSkillInner;
window.castSkillInner=function(id){
 if(typeof oldInner!=='function')return false;
 if(id===PRECISE){let result=oldInner.apply(this,arguments);if(result)activate();return result}
 if(id!==TRIPLE)return oldInner.apply(this,arguments);
 let target=currentTarget(),use=ready(),result;
 if(use)suppressBegin();try{result=oldInner.apply(this,arguments)}finally{if(use)suppressEnd()}
 if(use&&result)strike(target&&target.uid);
 return result;
};
if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let oldTick=window.tick;
window.tick=function(){
 let result=typeof oldTick==='function'?oldTick.apply(this,arguments):undefined;ensure();
 if(player.chargedStrikeCd310>0)player.chargedStrikeCd310--;
 badge();return result;
};

let def=DB.items[WPN];
if(def&&!String(def.d||'').includes('充能一擊'))def.d+=' 精準射擊延伸「充能一擊」：精準射擊期間，下一次可發動的三重矢改為對主目標集中射出基礎4道風雷電束；此次不會同時觸發連鎖雷電。基礎冷卻8秒、最低4秒。';
ensure();
})();
