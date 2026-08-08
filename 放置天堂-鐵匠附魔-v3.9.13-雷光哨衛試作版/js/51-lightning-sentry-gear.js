// ⚡ 原技能「暗影之牙」× 雷光哨衛鋼爪：雷光哨衛 v3.9.13
(function(){
'use strict';
const SK='sk_dark_fang',WPN='wpn_lightning_sentry_claw';
DB.items[WPN]={
 n:'雷光哨衛鋼爪',img:'assets/icons/weapons/惡魔鋼爪.png',legend:true,
 type:'wpn',w2h:true,dmgS:24,dmgL:20,hit:4,dmgBonus:6,spd:.9,eff:'combo',comboRate:33,
 req:'dark',reqLv:60,safe:6,p:340000,gachaWeight:5,core:'lightningSentry',
 d:'黑暗妖精專屬雙手鋼爪。暗影之牙延伸「雷光哨衛」：原本額外傷害增益完整保留；成功施放後部署可見哨衛 6 秒，每秒發射基礎 2 道風雷電束。基礎冷卻 12 秒、最低 6 秒。全身黑暗妖精防具與飾品可出現專用強化詞綴。闇精靈王 5% 掉落。'
};

function weapon(){
 let item=player&&player.eq&&player.eq.wpn,def=item&&DB.items[item.id];
 return item&&item.id===WPN&&def&&def.core==='lightningSentry'?def:null;
}
function bonus(){
 let total=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};
 return{
  trd:Math.min(80,Number(total.trd)||0),
  trn:Math.min(2,Math.floor(Number(total.trn)||0)),
  trt:Math.min(60,Number(total.trt)||0),
  trc:Math.min(50,Number(total.trc)||0)
 };
}
function ensure(){
 if(!player)return;
 if(!Number.isFinite(player.lightningSentryCd313))player.lightningSentryCd313=0;
 if(!Number.isFinite(player.lightningSentryActive313))player.lightningSentryActive313=0;
 if(!Number.isFinite(player.lightningSentryNext313))player.lightningSentryNext313=0;
}
function duration(){return Math.round(60*(1+bonus().trt/100))}
function living(){return typeof mapState!=='undefined'&&mapState&&Array.isArray(mapState.mobs)?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[]}
function host(){
 let h=document.getElementById('battle-view')||document.getElementById('game-screen');
 if(h&&getComputedStyle(h).position==='static')h.style.position='relative';
 return h;
}
function installCss(){
 if(document.getElementById('lightning-sentry313-css'))return;
 let style=document.createElement('style');style.id='lightning-sentry313-css';
 style.textContent=`
#lightning-sentry313{position:absolute;left:4%;bottom:7%;width:210px;height:145px;z-index:1002;pointer-events:none}
#lightning-sentry313 .trap{position:absolute;bottom:18px;width:62px;height:34px;border:4px solid #a5f3fc;border-radius:50%;background:radial-gradient(circle,#f8fafc 0 10%,#2563eb 15%,#172554 55%,#020617 70%);box-shadow:0 0 17px #38bdf8,inset 0 0 13px #67e8f9;animation:sentryHover313 .7s ease-in-out infinite alternate}
#lightning-sentry313 .trap:before,#lightning-sentry313 .trap:after{content:"";position:absolute;left:25px;bottom:24px;width:6px;height:46px;background:linear-gradient(#fff,#38bdf8,transparent);filter:drop-shadow(0 0 6px #22d3ee);transform:rotate(-18deg)}
#lightning-sentry313 .trap:after{transform:rotate(18deg)}
#lightning-sentry313 .t1{left:18px}#lightning-sentry313 .t2{right:18px;animation-delay:-.35s!important}
#lightning-sentry313 b{position:absolute;left:0;right:0;bottom:-4px;text-align:center;color:#cffafe;font:bold 13px/18px sans-serif;text-shadow:0 0 9px #0284c7,0 2px 4px #000}
#lightning-sentry-bolt313{position:absolute;inset:0;z-index:1009;pointer-events:none;overflow:hidden}
#lightning-sentry-bolt313 svg{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 0 8px #0ea5e9)}
#lightning-sentry-bolt313 path{fill:none;stroke:#e0f2fe;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:11 5;animation:sentryBolt313 .42s ease-out forwards}
#lightning-sentry-bolt313 strong{position:absolute;left:0;right:0;bottom:18%;text-align:center;color:#bae6fd;font:bold 18px/24px sans-serif;text-shadow:0 0 10px #0284c7,0 2px 4px #000;animation:sentryTitle313 .65s ease-out forwards}
#lightning-sentry-status313{position:absolute;right:3%;bottom:116px;z-index:1000;min-width:190px;padding:1px 8px;border:1px solid #22d3ee;border-radius:8px;background:#082f49;color:#cffafe;text-align:center;font:11px/17px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
@keyframes sentryHover313{from{transform:translateY(3px) scale(.96)}to{transform:translateY(-7px) scale(1.05)}}
@keyframes sentryBolt313{0%{stroke-dashoffset:70;opacity:0}20%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes sentryTitle313{0%{transform:translateY(10px);opacity:0}30%{opacity:1}100%{transform:translateY(-24px);opacity:0}}`;
 document.head.appendChild(style);
}
function trapVisual(){
 let h=host();if(!h||!player)return;installCss();
 let e=document.getElementById('lightning-sentry313');
 if(player.cls==='dark'&&weapon()&&player.lightningSentryActive313>0){
  if(!e){e=document.createElement('div');e.id='lightning-sentry313';e.innerHTML='<i class="trap t1"></i><i class="trap t2"></i><b>⚡ 雷光哨衛</b>';h.appendChild(e)}
 }else if(e)e.remove();
}
function boltVisual(targets,bolts){
 let h=host();if(!h)return;installCss();
 let old=document.getElementById('lightning-sentry-bolt313');if(old)old.remove();
 let hr=h.getBoundingClientRect(),ml=document.getElementById('mob-list'),starts=[[hr.width*.11,hr.height*.76],[hr.width*.23,hr.height*.76]],paths=[];
 for(let i=0;i<bolts;i++){
  let target=targets[i%targets.length],x=hr.width*.72,y=hr.height*(.32+(i%3)*.12);
  if(ml&&target){let card=ml.querySelector('[data-uid="'+target.uid+'"]');if(card){let r=card.getBoundingClientRect();x=r.left+r.width/2-hr.left;y=r.top+r.height/2-hr.top}}
  let p=starts[i%2],mx=(p[0]+x)/2+(i%2?24:-24),my=(p[1]+y)/2+(i%3-1)*18;
  paths.push('<path d="M '+p[0]+' '+p[1]+' L '+mx+' '+my+' L '+x+' '+y+'" style="animation-delay:'+(i*.04)+'s"/>');
 }
 let e=document.createElement('div');e.id='lightning-sentry-bolt313';
 e.innerHTML='<svg viewBox="0 0 '+hr.width+' '+hr.height+'">'+paths.join('')+'</svg><strong>⚡ 雷光哨衛 × '+bolts+'</strong>';
 h.appendChild(e);setTimeout(()=>{if(e&&e.remove)e.remove()},720);
}
function badge(){
 let h=host();if(!h||!player)return;installCss();
 let e=document.getElementById('lightning-sentry-status313');
 if(player.cls==='dark'&&weapon()){
  if(!e){e=document.createElement('div');e.id='lightning-sentry-status313';h.appendChild(e)}
  ensure();let active=Math.ceil(player.lightningSentryActive313/10),cd=Math.ceil(player.lightningSentryCd313/10),bolts=2+bonus().trn;
  e.textContent=active>0?'雷光哨衛 '+bolts+'電束　剩 '+active+'秒':('雷光哨衛　'+(cd>0?'CD '+cd+'秒':'暗影之牙可部署'));
 }else if(e)e.remove();
 trapVisual();
}
function boltDamage(target,b){
 let level=Math.max(1,Number(player.lv)||1),dex=Math.max(0,Number(player.d&&player.d.dex)||0),wis=Math.max(0,Number(player.d&&player.d.wis)||0),melee=Math.max(0,Number(player.d&&player.d.meleeDmg)||0);
 let raw=roll(1,8)+12+Math.floor(level*.42)+Math.floor(dex*.55)+Math.floor(wis*.35)+Math.floor(melee*.25);
 let attr=typeof magicAttrDefense==='function'?magicAttrDefense(target,'wind'):0,mr=typeof mrMult==='function'?mrMult(Math.max(0,Number(target.mr)||0)):1,counter=typeof elementCounterMult==='function'?elementCounterMult('wind',target.e):1;
 let damage=Math.max(1,Math.floor(raw*.36*(1+b.trd/100)*(1-attr)*mr*counter));
 if(typeof fragileMult==='function')damage=Math.max(1,Math.floor(damage*fragileMult(target)));
 if(typeof classSkillEquipMult==='function')damage=Math.max(1,Math.floor(damage*classSkillEquipMult(DB.skills[SK],player,SK)));
 if(typeof d2rHuntDamage==='function')damage=d2rHuntDamage(player,target,damage);
 return damage;
}
function pulse(){
 if(!weapon()||player.cls!=='dark'||player.dead)return false;
 let all=living();if(!all.length)return false;
 let b=bonus(),bolts=2+b.trn,rows=[],hitTargets=[];
 for(let i=0;i<bolts&&all.length;i++){
  let target=all[i%all.length];if(!target||target.curHp<=0)continue;
  let damage=boltDamage(target,b);target.curHp-=damage;target.justHit='wind';target._spellHurt=true;hitTargets.push(target);
  if(typeof moonShatterOnDamage==='function')moonShatterOnDamage(player,target,damage);
  if(typeof reflectWallOnDamage==='function')reflectWallOnDamage(target,damage,'magic',null);
  if(typeof mobWake==='function')mobWake(target);
  rows.push(target.n+' '+damage);
  if(target.curHp<=0&&typeof killMob==='function'){
   let index=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);if(index!==-1)killMob(index);
   all=living();
  }
 }
 if(hitTargets.length)boltVisual(hitTargets,rows.length);
 if(rows.length&&typeof logCombat==='function')logCombat('<span class="text-cyan-300 font-bold">【雷光哨衛】</span>'+rows.join('、'),'magic');
 try{if(typeof renderMobs==='function')renderMobs()}catch(e){}
 return rows.length>0;
}
function deploy(){
 ensure();if(!weapon()||player.cls!=='dark'||player.dead||player.lightningSentryCd313>0)return false;
 let b=bonus();player.lightningSentryCd313=Math.max(60,Math.round(120*(1-b.trc/100)));
 player.lightningSentryActive313=duration();player.lightningSentryNext313=1;
 if(typeof logCombat==='function')logCombat('<span class="text-cyan-200 font-bold">【雷光哨衛鋼爪】</span>暗影之牙喚醒兩座雷光哨衛。','player-special');
 badge();return true;
}

let oldManual=window.manualCast;
window.manualCast=function(id){
 if(typeof oldManual!=='function')return false;
 if(id!==SK)return oldManual.apply(this,arguments);
 let mp=player.mp,before=Number(player.buffs&&player.buffs[SK])||0,result=oldManual.apply(this,arguments),after=Number(player.buffs&&player.buffs[SK])||0;
 if(result!==false&&(player.mp<mp||after>before))deploy();return result;
};
let oldInner=window.castSkillInner;
window.castSkillInner=function(id){
 if(typeof oldInner!=='function')return false;
 let result=oldInner.apply(this,arguments);if(result&&id===SK)deploy();return result;
};
if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let oldTick=window.tick;
window.tick=function(){
 let result=typeof oldTick==='function'?oldTick.apply(this,arguments):undefined;ensure();
 if(player.lightningSentryCd313>0)player.lightningSentryCd313--;
 if(!weapon()||player.cls!=='dark'||player.dead){player.lightningSentryActive313=0;player.lightningSentryNext313=0}
 else if(player.lightningSentryActive313>0){
  player.lightningSentryActive313--;player.lightningSentryNext313--;
  if(player.lightningSentryNext313<=0){pulse();player.lightningSentryNext313=10}
 }
 badge();return result;
};
ensure();
})();
