// 🪓 原技能「咆哮」× 風暴巨斧：怒氣炫風斬 v3.8.87
(function(){
'use strict';
const SK='sk_warrior_roar',W='wpn_whirlwind_axe';
DB.items[W]={
 n:'風暴巨斧',img:'assets/icons/weapons/巨人的斧頭.png',
 type:'wpn',w2h:true,dmgS:30,dmgL:36,hit:2,dmgBonus:5,spd:.9,eff:'crush',ignHardSkin:true,req:'warrior',safe:6,
 p:380000,gachaWeight:5,core:'whirlwind',d:'咆哮延伸：消耗35怒氣施展炫風斬，持續旋轉攻擊全體敵人。基礎持續4秒、冷卻10秒；原本咆哮傷害完全保留。古代巨人5%掉落。'
};
function weapon(){return typeof buildFlowSource==='function'?buildFlowSource(player,'whirlwind'):null}
function bonus(){let t=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};return{ww:Math.min(80,+t.ww||0),wd:Math.min(60,+t.wd||0),wr:Math.min(60,+t.wr||0),wc:Math.min(40,+t.wc||0)}}
function ensure(){if(!player)return;if(!Number.isFinite(player.whirlRage))player.whirlRage=0;if(!Number.isFinite(player.whirlCd))player.whirlCd=0}
function live(){return mapState&&mapState.mobs?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[]}
function host(){let h=document.getElementById('battle-view')||document.getElementById('game-screen');if(h&&getComputedStyle(h).position==='static')h.style.position='relative';return h}
function css(){if(document.getElementById('whirl87-css'))return;let s=document.createElement('style');s.id='whirl87-css';s.textContent=`
#whirl87{position:absolute;left:8%;bottom:4%;width:190px;height:190px;z-index:999;pointer-events:none;border:5px solid #bae6fd;border-radius:50%;box-shadow:0 0 18px #38bdf8,inset 0 0 24px #0ea5e9;animation:wh87 .32s linear infinite}
#whirl87:before{content:"🪓　🪓";position:absolute;inset:18px;color:#fff;font-size:38px;line-height:145px;text-align:center;border:4px dashed #f8fafc;border-radius:50%}
#whirl87 b{position:absolute;left:-20px;right:-20px;bottom:-5px;text-align:center;color:#fde68a;text-shadow:0 2px 5px #000}
#whirl-rage87{position:absolute;left:8%;bottom:2px;width:190px;height:18px;z-index:1000;background:#1e293b;border:1px solid #f97316;border-radius:8px;overflow:hidden;pointer-events:none}
#whirl-rage87 i{display:block;height:100%;background:linear-gradient(90deg,#dc2626,#fb923c);transition:width .15s}
#whirl-rage87 b{position:absolute;inset:0;text-align:center;color:#fff;font:11px/17px sans-serif;text-shadow:0 1px 3px #000}
@keyframes wh87{to{transform:rotate(360deg)}}`;document.head.appendChild(s)}
function visuals(){let h=host();if(!h||!player)return;css();let e=document.getElementById('whirl87');if(player.whirlActive&&player.whirlActive>0){if(!e){e=document.createElement('div');e.id='whirl87';e.innerHTML='<b>🌪️ 炫風斬</b>';h.appendChild(e)}}else if(e)e.remove();let bar=document.getElementById('whirl-rage87');if(player.cls==='warrior'&&weapon()){if(!bar){bar=document.createElement('div');bar.id='whirl-rage87';bar.innerHTML='<i></i><b></b>';h.appendChild(bar)}bar.querySelector('i').style.width=Math.max(0,Math.min(100,player.whirlRage||0))+'%';let cd=Math.ceil((player.whirlCd||0)/10),txt='怒氣 '+Math.floor(player.whirlRage||0)+'/100'+(cd>0?'　CD '+cd+'秒':'　可施展');bar.querySelector('b').textContent=txt;bar.title=txt}else if(bar)bar.remove()}
function hit(){let b=bonus(),targets=live(),str=Number(player.d&&player.d.str)||Number(player.base&&player.base.str)||10,melee=Number(player.d&&player.d.meleeDmg)||0,base=30+(player.lv||1)*1.5+str*2+melee;targets.forEach(m=>{let d=Math.max(1,Math.floor(base*(1+b.ww/100)*(typeof fragileMult==='function'?fragileMult(m):1)));if(typeof d2rHuntDamage==='function')d=d2rHuntDamage(player,m,d);m.curHp-=d;m.justHit='physical';if(typeof mobWake==='function')mobWake(m);if(m.curHp<=0){let i=mapState.mobs.findIndex(x=>x&&x.uid===m.uid);if(i!==-1)killMob(i)}});if(targets.length){logCombat('<span class="text-sky-300 font-bold">【炫風斬】</span>旋刃掃過 '+targets.length+' 名敵人。','player-special');try{renderMobs()}catch(e){}}}
function trigger(){ensure();let w=weapon();if(!w||player.cls!=='warrior'||player.dead||player.whirlCd>0)return false;if(player.whirlRage<35){if(!player._whirlWarn||state.ticks-player._whirlWarn>50){player._whirlWarn=state.ticks;logSys('<span class="text-orange-300">怒氣不足35，咆哮仍正常施放，但無法觸發炫風斬。</span>')}return false}let b=bonus();player.whirlRage-=35;player.whirlCd=Math.max(40,Math.round(100*(1-b.wc/100)));player.whirlActive=Math.round(40*(1+b.wd/100));player.whirlNext=1;logCombat('<span class="text-orange-300 font-bold">【炫風斬流派】</span>怒氣爆發，開始炫風斬！','player-special');visuals();return true}
function snap(){return live().reduce((s,m)=>s+(m.curHp||0),0)}
let opa=window.playerAttack;window.playerAttack=function(){ensure();let before=snap(),r=opa.apply(this,arguments),after=snap();if(player&&player.cls==='warrior'&&after<before){let b=bonus();player.whirlRage=Math.min(100,player.whirlRage+5*(1+b.wr/100));visuals()}return r};playerAttack=window.playerAttack;
let om=window.manualCast;window.manualCast=function(id){if(id!==SK)return om.apply(this,arguments);let mp=player.mp,c=player.manualCd[id]||0,r=om.apply(this,arguments);if(player.mp<mp||(player.manualCd[id]||0)>c)trigger();return r};
let oi=window.castSkillInner;window.castSkillInner=function(id){let r=oi.apply(this,arguments);if(r&&id===SK)trigger();return r};if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let ot=window.tick;window.tick=function(){let r=ot.apply(this,arguments);ensure();if(player.whirlCd>0)player.whirlCd--;if(player.whirlActive>0){player.whirlActive--;player.whirlNext--;if(player.whirlNext<=0){hit();player.whirlNext=5}}visuals();return r};
ensure();
})();
