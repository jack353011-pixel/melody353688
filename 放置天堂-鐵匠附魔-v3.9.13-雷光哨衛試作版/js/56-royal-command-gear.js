// 👑 原技能「灼熱武器」× 統御王冠：王旗號令 v3.9.14
(function(){
'use strict';
const SK='sk_royal_burnweapon',HELM='hlm_royal_command';
DB.items[HELM]={
 n:'統御王冠',img:'assets/icons/armors/蜥蜴領主的王冠.png',legend:true,
 type:'arm',slot:'helm',ac:4,mr:12,cha:2,req:'royal',reqLv:50,safe:4,p:300000,gachaWeight:5,core:'royalCommand',
 d:'王族專屬頭盔。灼熱武器延伸「王旗號令」：原本全隊傷害與命中光環完整保留；成功施放後展開統御王旗 30 秒，每 2 秒命令所有仍在作戰的傭兵各追擊一次。傷害受魅力、傭兵等級與專用詞綴強化。闇黑君王 5% 掉落。'
};
if(typeof MOB_DROPS==='object'){
 let rows=MOB_DROPS['闇黑君王']||(MOB_DROPS['闇黑君王']=[]);
 if(!rows.some(r=>r&&r[0]===HELM))rows.push([HELM,5]);
}
function crown(){let it=player&&player.eq&&player.eq.helm,d=it&&DB.items[it.id];return it&&it.id===HELM&&d&&d.core==='royalCommand'?d:null}
function bonus(){let t=typeof d2rEquipTotals==='function'?d2rEquipTotals(player):{};return{dmg:Math.min(80,Number(t.qmd)||0),extra:Math.min(2,Math.floor(Number(t.qmn)||0)),time:Math.min(60,Number(t.qmt)||0),cadence:Math.min(50,Number(t.qmc)||0)}}
function ensure(){if(!player)return;if(!Number.isFinite(player.royalCommandLeft314))player.royalCommandLeft314=0;if(!Number.isFinite(player.royalCommandNext314))player.royalCommandNext314=0}
function allies(){return player&&Array.isArray(player.allies)?player.allies.filter(a=>a&&!a._downed&&(Number(a.curHp)||0)>0):[]}
function living(){return typeof mapState!=='undefined'&&mapState&&Array.isArray(mapState.mobs)?mapState.mobs.filter(m=>m&&m.curHp>0&&!m._dead):[]}
function host(){let h=document.getElementById('battle-view')||document.getElementById('game-screen');if(h&&getComputedStyle(h).position==='static')h.style.position='relative';return h}
function css(){if(document.getElementById('royal-command314-css'))return;let s=document.createElement('style');s.id='royal-command314-css';s.textContent=`
#royal-command314{position:absolute;left:3%;bottom:7%;z-index:1001;width:190px;height:190px;pointer-events:none;filter:drop-shadow(0 0 12px #fbbf24)}
#royal-command314 .pole{position:absolute;left:35px;bottom:20px;width:7px;height:150px;background:linear-gradient(90deg,#78350f,#fde68a,#92400e);border-radius:4px}
#royal-command314 .flag{position:absolute;left:41px;top:20px;width:120px;height:75px;background:linear-gradient(135deg,#fef3c7,#f59e0b 55%,#991b1b);clip-path:polygon(0 0,100% 10%,82% 50%,100% 90%,0 100%);animation:royalFlag314 .8s ease-in-out infinite alternate}
#royal-command314 .flag:after{content:'♛';position:absolute;inset:4px 20px;color:#7f1d1d;font:bold 48px/65px serif;text-align:center;text-shadow:0 1px #fff7ed}
#royal-command314 b{position:absolute;left:0;right:0;bottom:0;text-align:center;color:#fef3c7;font:bold 14px/20px sans-serif;text-shadow:0 0 8px #b45309,0 2px 4px #000}
#royal-command-status314{position:absolute;right:3%;bottom:162px;z-index:1000;min-width:190px;padding:1px 8px;border:1px solid #f59e0b;border-radius:8px;background:#451a03;color:#fef3c7;text-align:center;font:11px/17px sans-serif;pointer-events:none}
@keyframes royalFlag314{from{transform:skewY(-2deg) scaleX(.96)}to{transform:skewY(3deg) scaleX(1.04)}}`;document.head.appendChild(s)}
function visual(){let h=host();if(!h||!player)return;css();let e=document.getElementById('royal-command314');if(player.cls==='royal'&&crown()&&player.royalCommandLeft314>0){if(!e){e=document.createElement('div');e.id='royal-command314';e.innerHTML='<i class="pole"></i><i class="flag"></i><b>👑 王旗號令</b>';h.appendChild(e)}}else if(e)e.remove()}
function badge(){let h=host();if(!h||!player)return;css();let e=document.getElementById('royal-command-status314');if(player.cls==='royal'&&crown()){if(!e){e=document.createElement('div');e.id='royal-command-status314';h.appendChild(e)}ensure();let sec=Math.ceil(player.royalCommandLeft314/10),count=allies().length;e.textContent=sec>0?'王旗號令 '+count+'名傭兵　剩 '+sec+'秒':'王旗號令　等待灼熱武器'}else if(e)e.remove();visual()}
function strikeDamage(ally,target,b){let lv=Math.max(1,Number(ally&&ally.lv)||Number(player.lv)||1),d=ally&&ally.d||{},power=Math.max(Number(d.meleeDmg)||0,Number(d.rangedDmg)||0,Number(d.magicDmg)||0),cha=Math.max(0,Number(player.d&&player.d.cha)||0),raw=12+lv*.55+power*.8+cha*.65;let dealt=Math.max(1,Math.floor(raw*(1+b.dmg/100)*(typeof fragileMult==='function'?fragileMult(target):1)));if(typeof classSkillEquipMult==='function')dealt=Math.max(1,Math.floor(dealt*classSkillEquipMult(DB.skills[SK],player,SK)));return typeof d2rHuntDamage==='function'?d2rHuntDamage(player,target,dealt):dealt}
function pulse(){let squad=allies(),targets=living();if(!squad.length||!targets.length)return false;let b=bonus(),orders=squad.length+b.extra,rows=[];for(let i=0;i<orders&&targets.length;i++){let ally=squad[i%squad.length];if(!ally||ally._downed||(Number(ally.curHp)||0)<=0)continue;let target=targets[i%targets.length],dmg=strikeDamage(ally,target,b);target.curHp-=dmg;let taken=typeof bossResilienceDamageTaken==='function'?bossResilienceDamageTaken(target,dmg):dmg;if(typeof moonShatterOnDamage==='function')moonShatterOnDamage(ally,target,taken);target.justHit='physical';if(typeof mobWake==='function')mobWake(target);if(typeof reflectWallOnDamage==='function')reflectWallOnDamage(target,taken,'melee',ally,true);rows.push((ally._allyName||'皇家護衛')+'→'+target.n+' '+taken);if(target.curHp<=0){let idx=mapState.mobs.findIndex(m=>m&&m.uid===target.uid);if(idx!==-1&&typeof killMob==='function')killMob(idx);targets=living()}}
 if(rows.length&&typeof logCombat==='function')logCombat('<span class="text-amber-300 font-bold">【王旗號令】</span>'+rows.join('、'),'mercenary');try{if(typeof renderMobs==='function')renderMobs()}catch(e){}return rows.length>0}
function deploy(){ensure();if(!crown()||player.cls!=='royal'||player.dead)return false;let b=bonus();player.royalCommandLeft314=Math.round(300*(1+b.time/100));player.royalCommandNext314=1;if(typeof logCombat==='function')logCombat('<span class="text-amber-200 font-bold">【統御王冠】</span>王旗展開，傭兵接受你的號令！','player-special');badge();return true}
let oldManual=window.manualCast;window.manualCast=function(id){if(typeof oldManual!=='function')return false;if(id!==SK)return oldManual.apply(this,arguments);let mp=player.mp,before=Number(player.buffs&&player.buffs[SK])||0,result=oldManual.apply(this,arguments),after=Number(player.buffs&&player.buffs[SK])||0;if(result!==false&&(player.mp<mp||after>before))deploy();return result};
let oldInner=window.castSkillInner;window.castSkillInner=function(id){if(typeof oldInner!=='function')return false;let result=oldInner.apply(this,arguments);if(result&&id===SK)deploy();return result};if(typeof castSkillInner==='function')castSkillInner=window.castSkillInner;
let oldTick=window.tick;window.tick=function(){let result=typeof oldTick==='function'?oldTick.apply(this,arguments):undefined;ensure();if(!crown()||player.cls!=='royal'||player.dead){player.royalCommandLeft314=0;player.royalCommandNext314=0}else if(player.royalCommandLeft314>0){player.royalCommandLeft314--;player.royalCommandNext314--;if(player.royalCommandNext314<=0){pulse();player.royalCommandNext314=Math.max(10,Math.round(20*(1-bonus().cadence/100)))}}badge();return result};
ensure();
})();
