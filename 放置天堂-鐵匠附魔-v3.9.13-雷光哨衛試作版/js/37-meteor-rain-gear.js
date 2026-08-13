// ☄️ 原技能「流星雨」× 隕星法杖＋技能延伸詞綴 v3.8.86
(function(){
'use strict';
const SK='sk_meteor',W='wpn_meteor_rain_staff_test';
DB.items[W]={n:'隕星法杖',img:'assets/icons/weapons/d2r-gear/meteor-staff.png',type:'wpn',isWand:true,dmgS:6,dmgL:6,mdmg:4,spd:1,req:'mage',safe:6,p:150000,gachaWeight:5,core:'meteor',cdr:25,d:'流星雨延伸：追加5顆可見小隕石，結束後留下4秒燃燒地面。基礎冷卻12秒、最低4秒；原技能完全不變，核心能力固定保留。不死鳥 5% 掉落。'};
function mw(){return typeof buildFlowSource==='function'?buildFlowSource(player,'meteor'):null}
function ext(){let t=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};return{mcx:Math.min(3,Math.floor(+t.mcx||0)),gd:Math.min(60,+t.gd||0),scd:Math.min(30,+t.scd||0)}}
function ensure(){
 if(!player||player.cls!=='mage')return;
 if(!Number.isFinite(player.meteorGearCd))player.meteorGearCd=0;
}
function live(){return mapState&&mapState.mobs?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[]}
function tgt(){let a=live(),t=typeof getTarget==='function'?getTarget():null;return t&&t.curHp>0&&!t._dead?t:(a.length?a[Math.floor(Math.random()*a.length)]:null)}
function dmg(t,dice,mult){let d=magicBaseDamage(roll(dice[0],dice[1]),player.d,0,true)*magicDamageCoef(player.d,magicAttrDefense(t,'fire'),10)*mrMult(Math.max(0,+t.mr||0))*elementCounterMult('fire',t.e)*(mult||1);return Math.max(1,Math.floor(d))}
function kill(t){if(t&&t.curHp<=0){let i=mapState.mobs.findIndex(m=>m&&m.uid===t.uid);if(i!==-1)killMob(i)}}
function css(){if(document.getElementById('meteor81-css'))return;let s=document.createElement('style');s.id='meteor81-css';s.textContent=`
 #meteor-ground81{position:absolute;left:5%;right:5%;bottom:3%;height:38%;z-index:995;pointer-events:none;background:radial-gradient(ellipse,#fbbf2477,#ea580c55 38%,transparent 72%);filter:drop-shadow(0 0 10px #ef4444);animation:mg81 .3s infinite alternate}
 .meteor-fall81{position:absolute;z-index:999;pointer-events:none;font-size:46px;filter:drop-shadow(0 0 9px #f97316);animation:mf81 .55s ease-in forwards}
 #meteor-ground81 b{position:absolute;left:0;right:0;bottom:2px;text-align:center;color:#fed7aa;text-shadow:0 1px 4px #000}
 @keyframes mf81{from{transform:translate(70px,-180px) scale(.55);opacity:.3}to{transform:translate(0,0) scale(1.25);opacity:1}}@keyframes mg81{to{filter:brightness(1.45) drop-shadow(0 0 14px #ef4444)}}`;document.head.appendChild(s)}
function host(){let h=document.getElementById('battle-view')||document.getElementById('game-screen');if(h&&getComputedStyle(h).position==='static')h.style.position='relative';return h}
function fallFx(t){let h=host();if(!h)return;css();let e=document.createElement('div');e.className='meteor-fall81';e.textContent='☄️';let x=20+Math.random()*60,y=25+Math.random()*45;if(t){let c=document.querySelector('.mob-target[data-uid="'+t.uid+'"]');if(c){let r=c.getBoundingClientRect(),hr=h.getBoundingClientRect();x=(r.left+r.width/2-hr.left)/Math.max(1,hr.width)*100;y=(r.top+r.height/2-hr.top)/Math.max(1,hr.height)*100}}e.style.left=x+'%';e.style.top=y+'%';h.appendChild(e);setTimeout(()=>e.remove(),650)}
function groundFx(){let h=host();if(!h)return;css();let e=document.getElementById('meteor-ground81');if(player&&player.meteorGround&&player.meteorGround.left>0){if(!e){e=document.createElement('div');e.id='meteor-ground81';e.innerHTML='<b>🔥 燃燒地面</b>';h.appendChild(e)}}else if(e)e.remove()}
function impact(){let t=tgt();fallFx(t);if(!t)return;let d=dmg(t,[3,12],1);t.curHp-=d;t.justHit='fire';t._spellHurt=true;kill(t);logCombat('<span class="text-orange-300 font-bold">【小隕石】</span>'+t.n+' 受到 '+d+' 點傷害。','magic','summon');try{if(typeof renderMobs==='function')renderMobs()}catch(e){}}
function burn(){let rows=[];live().forEach(t=>{let d=dmg(t,[1,6],.45);t.curHp-=d;t.justHit='fire';t._spellHurt=true;kill(t);rows.push(t.n+' '+d)});if(rows.length)logCombat('<span class="text-orange-300">【燃燒地面】</span>'+rows.join('、'),'dot','summon')}
function trigger(){ensure();let w=mw();if(!w||player.dead||player.meteorGearCd>0)return;let x=ext();player.meteorGearCd=Math.max(40,Math.ceil(12000/(100+(w.cdr||0)+x.scd)));player.meteorRain={left:30+6*x.mcx,next:2,count:5+x.mcx,ground:Math.round(40*(1+x.gd/100))};logCombat('<span class="text-orange-300 font-bold">【隕星流派】</span>天空開始墜落小隕石！','magic','summon')}
let om=window.manualCast;window.manualCast=function(id){if(id!==SK)return om.apply(this,arguments);let mp=player.mp,c=player.manualCd[id]||0,r=om.apply(this,arguments);if(player.mp<mp||(player.manualCd[id]||0)>c)trigger();return r};
let oi=window.castSkillInner;window.castSkillInner=function(id){let r=oi.apply(this,arguments);if(r&&id===SK)trigger();return r};if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let ot=window.tick;window.tick=function(){let r=ot.apply(this,arguments);ensure();if(player&&player.meteorGearCd>0)player.meteorGearCd--;if(player&&player.meteorRain){let m=player.meteorRain;m.left--;m.next--;if(m.next<=0&&m.count>0){impact();m.count--;m.next=6}if(m.left<=0||m.count<=0){let ground=m.ground||40;player.meteorRain=null;player.meteorGround={left:ground,next:10};groundFx()}}if(player&&player.meteorGround){let g=player.meteorGround;g.left--;g.next--;if(g.next<=0&&g.left>0){burn();g.next=10}if(g.left<=0){player.meteorGround=null;groundFx()}}groundFx();return r};
ensure();
})();
