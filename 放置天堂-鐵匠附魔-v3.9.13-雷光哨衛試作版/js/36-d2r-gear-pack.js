// D2R 原技能 × 核心武器＋技能延伸詞綴正式版 v3.8.86
(function(){
'use strict';
const FB='sk_fireball',ICE='sk_icearrow',LIT='sk_aurora';
const ICE_IDS=['sk_icearrow','sk_chill','sk_ice_spike','sk_ice_lance','sk_blizzard','sk_frost_spike'];
const HY='wpn_hydra_staff_test',ST='wpn_static_field_staff_test',FO='wpn_frozen_orb_staff_test',CL='wpn_chain_lightning_staff_test';
DB.items[HY]={n:'九頭蛇法杖',img:'assets/icons/weapons/d2r-gear/hydra-staff.png',type:'wpn',isWand:true,dmgS:6,dmgL:6,mdmg:3,spd:1,req:'mage',safe:6,p:120000,gachaWeight:5,core:'hydra',cdr:25,d:'燃燒的火球延伸：召喚可見三首九頭蛇6秒。核心能力固定保留，仍可擁有一般詞綴、洞與寶石。炎魔的巴列斯 5% 掉落。'};
DB.items[ST]={n:'靜電法杖',img:'assets/icons/weapons/d2r-gear/static-staff.png',type:'wpn',isWand:true,dmgS:5,dmgL:5,mdmg:3,spd:1,req:'mage',safe:6,p:120000,gachaWeight:5,core:'static',cdr:25,d:'極光雷電延伸：展開靜電立場；一般怪目前生命-8%、頭目-2%，頭目最低50%。核心能力固定保留。黑長者 5% 掉落。'};
DB.items[FO]={n:'冰封球法杖',img:'assets/icons/weapons/d2r-gear/orb-staff.png',type:'wpn',isWand:true,dmgS:5,dmgL:5,mdmg:3,spd:1,req:'mage',safe:6,p:120000,gachaWeight:5,core:'orb',cdr:25,d:'冰箭延伸：生成可見冰封球4秒，每0.5秒射出冰片。核心能力固定保留。冰之女王 5% 掉落。'};
DB.items[CL]={n:'連鎖雷光法杖',img:'assets/icons/weapons/d2r-gear/chain-staff.png',type:'wpn',isWand:true,dmgS:5,dmgL:5,mdmg:3,spd:1,req:'mage',safe:6,p:120000,gachaWeight:5,core:'chain',cdr:25,d:'極光雷電延伸：追加5次可見連鎖閃電，每次彈跳傷害衰減15%。基礎冷卻6秒、最低2.5秒。核心能力固定保留。克特 5% 掉落。'};
function core(){let i=player&&player.eq&&player.eq.wpn,d=i&&DB.items[i.id];return d&&d.core?d:null}
function ext(){let t=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};return{hy:Math.min(60,+t.hy||0),hd:Math.min(60,+t.hd||0),st:Math.min(50,+t.st||0),os:Math.min(3,Math.floor(+t.os||0)),cb:Math.min(3,Math.floor(+t.cb||0)),scd:Math.min(30,+t.scd||0)}}
function ensure(){
 if(!player||player.cls!=='mage')return;
 ['hydraCd79','staticCd79','orbCd79','chainCd79'].forEach(k=>{if(!Number.isFinite(player[k]))player[k]=0});
}
function mobs(){return mapState&&mapState.mobs?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[]}
function target(){let t=typeof getTarget==='function'?getTarget():null,a=mobs();return t&&t.curHp>0&&!t._dead?t:(a[0]||null)}
function mdmg(t,ele,tier,dice){let d=magicBaseDamage(roll(dice[0],dice[1]),player.d,0,true)*magicDamageCoef(player.d,magicAttrDefense(t,ele),tier)*mrMult(Math.max(0,+t.mr||0))*elementCounterMult(ele,t.e);return Math.max(1,Math.floor(d))}
function kill(t){if(t&&t.curHp<=0){let i=mapState.mobs.findIndex(m=>m&&m.uid===t.uid);if(i!==-1)killMob(i)}}
function addCss(){
 if(document.getElementById('d2r79-css'))return;let s=document.createElement('style');s.id='d2r79-css';s.textContent=`
 #hydra79{position:absolute;left:14%;bottom:5px;width:225px;height:170px;z-index:999;pointer-events:none;filter:drop-shadow(0 0 12px #ef4444)}#hydra79 img{position:absolute;bottom:8px;width:115px;image-rendering:pixelated}#hydra79 .a{left:0;transform:rotate(-10deg)}#hydra79 .b{left:52px;bottom:20px;z-index:2}#hydra79 .c{left:104px;transform:rotate(10deg)}#hydra79 b,#orb79 b{position:absolute;bottom:0;left:0;right:0;text-align:center;color:#fff;font:bold 13px sans-serif;text-shadow:0 0 7px #0284c7}
 #orb79{position:absolute;bottom:70px;width:82px;height:82px;z-index:998;pointer-events:none;transform:translateX(-50%)}#orb79 i{position:absolute;inset:10px;border-radius:50%;background:radial-gradient(circle,#fff,#38bdf8 55%,#1d4ed8);box-shadow:0 0 22px #67e8f9;animation:op79 .25s infinite alternate}#orb79:before{content:"✦　✧";position:absolute;inset:0;border:3px dashed #e0f2fe;border-radius:50%;color:#fff;line-height:76px;text-align:center;animation:os79 .6s linear infinite}
 #static79{position:absolute;inset:10% 7%;z-index:997;border:4px solid #67e8f9;border-radius:50%;box-shadow:0 0 18px #22d3ee,inset 0 0 22px #2563eb;pointer-events:none;animation:op79 .2s infinite alternate}#static79 b{position:absolute;top:45%;left:0;right:0;text-align:center;color:#fff;text-shadow:0 0 8px #0284c7}
 .mob-target.heat79{box-shadow:inset 0 0 13px #f97316,0 0 8px #dc2626!important}@keyframes op79{to{transform:scale(1.08);filter:brightness(1.4)}}@keyframes os79{to{transform:rotate(360deg)}}`;document.head.appendChild(s)
}
function host(){let h=document.getElementById('battle-view')||document.getElementById('game-screen');if(h&&getComputedStyle(h).position==='static')h.style.position='relative';return h}
function rm(id){let e=document.getElementById(id);if(e)e.remove()}
function visuals(){
 addCss();let h=host();if(!h)return;
 if(player.hydra79){let e=document.getElementById('hydra79');if(!e){e=document.createElement('div');e.id='hydra79';e.innerHTML='<img class="a"><img class="b"><img class="c"><b>🐍 九頭蛇 🐍</b>';h.appendChild(e)}let at=player.hydra79.anim>0,base=at?'attack':'idle',max=at?10:14;e.querySelectorAll('img').forEach((im,n)=>im.src='assets/anim/%E8%9B%87%E5%A5%B3/'+base+'_'+((state.ticks+n*2)%max)+'.png')}else rm('hydra79');
 if(player.orb79){let e=document.getElementById('orb79');if(!e){e=document.createElement('div');e.id='orb79';e.innerHTML='<i></i><b>❄冰封球</b>';h.appendChild(e)}e.style.left=(18+(1-player.orb79.left/40)*64)+'%'}else rm('orb79');
 if(player.staticFx79>state.ticks){let e=document.getElementById('static79');if(!e){e=document.createElement('div');e.id='static79';e.innerHTML='<b>⚡ 靜電立場 ⚡</b>';h.appendChild(e)}}else rm('static79');
 let ml=document.getElementById('mob-list');if(ml){ml.querySelectorAll('.heat79').forEach(e=>e.classList.remove('heat79'));(mapState.mobs||[]).forEach(m=>{if(m&&m.heat79>state.ticks){let c=ml.querySelector('[data-uid="'+m.uid+'"]');if(c)c.classList.add('heat79')}})}
}
function hydraVolley(){if(!player.hydra79)return;player.hydra79.anim=7;let x=ext();for(let n=0;n<3;n++){let t=target();if(!t)break;let d=Math.max(1,Math.floor(mdmg(t,'fire',4,[2,12])*(1+x.hy/100)));t.curHp-=d;t.justHit='fire';t._spellHurt=true;kill(t)}visuals()}
function orbShards(n,mult){for(let x=0;x<n;x++){let t=target();if(!t)break;let d=Math.max(1,Math.floor(mdmg(t,'water',1,[1,8])*(mult||1)));t.curHp-=d;t.justHit='water';t._spellHurt=true;kill(t)}}
function chainFx(seq){
 let h=host(),ml=document.getElementById('mob-list');if(!h||!ml||!seq.length)return;
 let hr=h.getBoundingClientRect(),pts=[];seq.forEach(m=>{let c=ml.querySelector('[data-uid="'+m.uid+'"]');if(c){let r=c.getBoundingClientRect();pts.push((r.left+r.width/2-hr.left)+','+(r.top+r.height/2-hr.top))}});
 if(pts.length<2)return;rm('chain79');let svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='chain79';svg.setAttribute('viewBox','0 0 '+hr.width+' '+hr.height);svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:999;pointer-events:none;filter:drop-shadow(0 0 6px #22d3ee);';
 let p=document.createElementNS('http://www.w3.org/2000/svg','polyline');p.setAttribute('points',pts.join(' '));p.setAttribute('fill','none');p.setAttribute('stroke','#cffafe');p.setAttribute('stroke-width','5');p.setAttribute('stroke-linejoin','bevel');p.setAttribute('stroke-dasharray','9 5');svg.appendChild(p);h.appendChild(svg);setTimeout(()=>rm('chain79'),700);
}
function chainLightning(){
 let a=mobs();if(!a.length)return;let seq=[],start=target()||a[0],idx=Math.max(0,a.indexOf(start));
 let x=ext();for(let n=0;n<5+x.cb&&a.length;n++){let t=a[(idx+n)%a.length];if(!t||t.curHp<=0){a=mobs();if(!a.length)break;t=a[n%a.length]}seq.push(t);let d=Math.max(1,Math.floor(mdmg(t,'wind',3,[2,10])*Math.pow(.85,n)));t.curHp-=d;t.justHit='wind';t._spellHurt=true;kill(t)}
 chainFx(seq);if(seq.length)logCombat('<span class="text-cyan-300 font-bold">【連鎖雷光】</span>閃電彈跳 '+seq.length+' 次。','magic');
}
function activate(id,before){
 let w=core(),x=ext(),cdr=(w&&w.cdr||0)+x.scd;
 if(id===FB){(mapState.mobs||[]).forEach(m=>{if(m&&!m._dead&&before.has(String(m.uid))&&before.get(String(m.uid))>m.curHp&&m.curHp>0)m.heat79=state.ticks+30});if(w&&w.core==='hydra'&&player.hydraCd79<=0){player.hydraCd79=Math.max(40,Math.ceil(12000/(100+cdr)));player.hydra79={left:Math.round(60*(1+x.hd/100)),shot:1,anim:0};logCombat('【九頭蛇法杖】三首火蛇出現！','magic','summon')}}
 if(ICE_IDS.includes(id)){(mapState.mobs||[]).forEach(m=>{if(!m||m._dead||!before.has(String(m.uid)))return;let delta=before.get(String(m.uid))-m.curHp;if(delta>0&&m.heat79>state.ticks&&m.curHp>0){let d=Math.max(1,Math.floor(delta*(m.boss?.15:.30)));m.curHp-=d;delete m.heat79;kill(m);logCombat('【熱衝擊】'+m.n+' 額外 '+d+' 傷害。','magic')}});if(id===ICE&&w&&w.core==='orb'&&player.orbCd79<=0){player.orbCd79=Math.max(30,Math.ceil(8000/(100+cdr)));player.orb79={left:40,shot:1,bonus:x.os};logCombat('【冰封球法杖】冰箭凝聚成冰封球！','magic','summon')}}
 if(id===LIT&&w&&w.core==='static'&&player.staticCd79<=0){player.staticCd79=Math.max(40,Math.ceil(10000/(100+cdr)));player.staticFx79=state.ticks+14;(mapState.mobs||[]).forEach(m=>{if(!m||m._dead||m.curHp<=1)return;let floor=m.boss?Math.ceil((m.hp||1)*.5):1;if(m.curHp<=floor)return;let d=Math.floor(m.curHp*(m.boss?.02:.08)*(1+x.st/100)*(1-magicAttrDefense(m,'wind')));d=Math.max(0,Math.min(d,m.curHp-floor));m.curHp-=d});logCombat('【靜電立場】雷電圓環削減敵人目前生命。','magic')}
 if(id===LIT&&w&&w.core==='chain'&&player.chainCd79<=0){player.chainCd79=Math.max(25,Math.ceil(6000/(100+cdr)));chainLightning()}
 try{renderMobs()}catch(e){}visuals();
}
function snapshot(){let m=new Map();(mapState.mobs||[]).forEach(x=>{if(x)m.set(String(x.uid),x.curHp)});return m}
function watched(id){return id===FB||id===LIT||ICE_IDS.includes(id)}
let om=window.manualCast;window.manualCast=function(id){if(!watched(id))return om.apply(this,arguments);let b=snapshot(),mp=player.mp,c=player.manualCd[id]||0,r=om.apply(this,arguments);if(player.mp<mp||(player.manualCd[id]||0)>c)activate(id,b);return r};
let oi=window.castSkillInner;window.castSkillInner=function(id){if(!watched(id))return oi.apply(this,arguments);let b=snapshot(),r=oi.apply(this,arguments);if(r)activate(id,b);return r};if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let ot=window.tick;window.tick=function(){let r=ot.apply(this,arguments);ensure();['hydraCd79','staticCd79','orbCd79','chainCd79'].forEach(k=>{if(player&&player[k]>0)player[k]--});if(player&&player.hydra79){let h=player.hydra79;h.left--;h.shot--;if(h.anim>0)h.anim--;if(h.shot<=0&&h.left>0){hydraVolley();h.shot=15}if(h.left<=0)player.hydra79=null}if(player&&player.orb79){let o=player.orb79;o.left--;o.shot--;if(o.shot<=0&&o.left>0){orbShards(2+(o.bonus||0),1);o.shot=5}if(o.left<=0){orbShards(5+(o.bonus||0),.75);player.orb79=null}}visuals();return r};
ensure();
})();
