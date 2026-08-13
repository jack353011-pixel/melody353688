const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({console:{log(){},warn(){},error(){}}});context.window=context;
const run=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
run('js/00-data.js');run('js/00-tag-core.js');
vm.runInContext(`
MOB_DROPS={};state={ticks:0,running:true};mapState={mobs:[]};logs=[];sys=[];baseManualCalls=0;spiritAttacks=0;
logCombat=s=>logs.push(s);logSys=s=>sys.push(s);getMobColor=()=>'';updateUI=()=>{};
newMobStatus=()=>({});combatTargetSizeTag=m=>m.s==='L'?'大型':(m.s==='S'?'小型':'中型');
getTarget=()=>mapState.mobs[0];
playerAttack=()=>{let t=getTarget();t.curHp-=10;return true};
d2rTriggerIncoming=(owner,dmg)=>dmg;
manualCast=()=>{baseManualCalls++;return true};
tick=()=>true;
spiritAttackOnce=(s,t)=>{spiritAttacks++;t.curHp-=5};
`,context);
run('js/65-dark-elf-elf-flows.js');run('js/66-dark-elf-elf-support-gear.js');

const result=vm.runInContext(`(()=>{
 DB.items.test_dual={n:'普通雙刀',type:'wpn',w2h:true,eff:'combo'};
 DB.items.test_dagger={n:'普通短劍',type:'wpn'};
 DB.items.test_sword={n:'普通長劍',type:'wpn'};
 DB.items.test_wand={n:'普通魔杖',type:'wpn',isWand:true};

 let old={uid:1,n:'舊目標',s:'S',hp:500,curHp:500,st:{poison:50,poisonUnit:100,poisonDmg:100}};
 let fresh={uid:2,n:'新目標',s:'S',hp:500,curHp:500,st:{poison:50,poisonUnit:20,poisonDmg:20}};
 player={skills:['sk_dark_poison'],eq:{wpn:{id:'test_dual'}},buffs:{sk_dark_poison:100},inv:[],_venomPrevious75:old};mapState.mobs=[fresh];state.ticks=50;playerAttack();
 let relayUnit=fresh.st.poisonUnit,relayCd=player._venomRelayCd75;

 let giant={uid:3,n:'大型木人',s:'L',hp:500,curHp:500,st:{poison:50,poisonUnit:20,poisonDmg:20}};
 mapState.mobs=[giant];state.ticks=100;playerAttack();let largeWeaken=giant.st.weaken;

 let caster={uid:4,n:'施法木人',s:'S',hp:500,curHp:500,mag:{cd:40},mag2:{cd:60},_magCd:{mag:10,mag2:20},st:{}};
 player={skills:['sk_dark_refine'],eq:{wpn:{id:'test_dagger'}},buffs:{},inv:[{id:'mat_blackstone2',cnt:2}]};mapState.mobs=[caster];state.ticks=200;playerAttack();
 let stoneLeft=player.inv[0].cnt,magicDelay=[caster._magCd.mag,caster._magCd.mag2],ambushCd=player._darkstoneAmbushCd75;
 let locked={uid:5,n:'鎖定材料木人',s:'S',hp:500,curHp:500,mag:{cd:40},_magCd:{mag:10},st:{}};
 player={skills:['sk_dark_refine'],eq:{wpn:{id:'test_dagger'}},buffs:{},inv:[{id:'mat_blackstone2',cnt:1,lock:true}]};mapState.mobs=[locked];state.ticks=400;playerAttack();let lockedDelay=locked._magCd.mag;

 let flameMob={uid:6,n:'火勢木人',s:'S',hp:1000,curHp:1000,_atkCd:5,st:{}};
 player={skills:['sk_elf_flamesoul'],eq:{wpn:{id:'test_sword'}},buffs:{sk_elf_flamesoul:100},hp:500,mhp:500};mapState.mobs=[flameMob];state.ticks=500;
 playerAttack();playerAttack();playerAttack();playerAttack();let heatAfterPress=player._flameHeat75,enemyAtkCd=flameMob._atkCd;
 state.ticks=510;let guarded=d2rTriggerIncoming(player,100,{},'physical'),heatAfterGuard=player._flameHeat75;

 let spirit={uid:7,skId:'sk_elf_summon2',ele:'water',hp:100,mhp:100};
 player={skills:['sk_elf_summon2'],eq:{wpn:{id:'test_wand'}},buffs:{sk_elf_summon2:100},summonsV2:[spirit],elfEle:'water',hp:400,mhp:1000};mapState.mobs=[];state.ticks=600;
 let waterResult=manualCast('sk_elf_summon2'),waterHp=player.hp,manualAfterWater=baseManualCalls;
 player._spiritCommandCd75=0;spirit.ele='earth';state.ticks=700;manualCast('sk_elf_summon2');let earthShield=player._d2rShield;
 let commandTarget={uid:8,n:'號令木人',s:'S',hp:500,curHp:500,_atkCd:5,st:{}};mapState.mobs=[commandTarget];player._spiritCommandCd75=0;spirit.ele='fire';state.ticks=800;manualCast('sk_elf_summon2');let fireHp=commandTarget.curHp,fireAttacks=spiritAttacks;

 let supportIds=Object.keys(DB.items).filter(id=>DB.items[id]&&['venomTwinblades','darkstoneAmbush','flameSwordDance','spiritCommand'].includes(DB.items[id].flowSupport));
 let coreIds=['wpn_corroded_moon_dual','wpn_blackstone_ambush_dagger','wpn_ember_dance_sword','wpn_spirit_command_wand'];
 return {relayUnit,relayCd,largeWeaken,stoneLeft,magicDelay,ambushCd,lockedDelay,heatAfterPress,enemyAtkCd,guarded,heatAfterGuard,waterResult,waterHp,manualAfterWater,earthShield,fireHp,fireAttacks,
  supports:supportIds.length,darkSupportLevels:supportIds.filter(id=>['venomTwinblades','darkstoneAmbush'].includes(DB.items[id].flowSupport)).map(id=>DB.items[id].reqLv),elfSupportLevels:supportIds.filter(id=>['flameSwordDance','spiritCommand'].includes(DB.items[id].flowSupport)).map(id=>DB.items[id].reqLv),supportReqAll:supportIds.every(id=>DB.items[id].req==='all'),coreDrops:Object.values(MOB_DROPS).flat().filter(r=>coreIds.includes(r[0])).length,supportDropIds:new Set(Object.values(MOB_DROPS).flat().filter(r=>supportIds.includes(r[0])).map(r=>r[0])).size};
})()`,context);

assert.equal(result.relayUnit,50,'換目標應轉移舊毒的50%，不叠層或爆發');
assert.equal(result.relayCd,90,'毒性轉移應有4秒內部冷卻');
assert.equal(result.largeWeaken,20,'中毒的大型敵人應受到2秒衰弱');
assert.equal(result.stoneLeft,1,'魔石伏擊只應消耗1顆二級黑魔石');
assert.equal(Array.from(result.magicDelay).join(','),'25,35','魔石伏擊應同時推遲所有敵方法術1.5秒');
assert.equal(result.ambushCd,300,'魔石伏擊基礎冷卻應10秒');
assert.equal(result.lockedDelay,10,'被鎖定的黑魔石不得被自動消耗或觸發伏擊');
assert.equal(result.heatAfterPress,28,'第四次命中應獲得48熱勢並消耗20點壓步');
assert.equal(result.enemyAtkCd,12,'火勢壓步應推遲小型敵人0.7秒');
assert.equal(result.guarded,92,'熱勢防守應減少8%直接傷害');
assert.equal(result.heatAfterGuard,8,'防守應消耗20熱勢');
assert.equal(result.waterResult,true,'精靈存活時再點召喚技能應改為號令');
assert.equal(result.waterHp,480,'水靈號令應恢復8%最大HP');
assert.equal(result.manualAfterWater,0,'號令不得重複召喚或走原施法管線');
assert.equal(result.earthShield,60,'地靈號令應建立6%最大HP護盾');
assert.equal(result.fireHp,495,'火靈號令應命令現有精靈立即攻擊一次');
assert.equal(result.fireAttacks,1,'火靈號令不得新增召喚實體');
assert.equal(result.supports,16,'四個流派應各有4件配套裝備');
assert.equal(Array.from(result.darkSupportLevels).every(v=>v===45),true,'蝕毒雙刃／魔石伏擊配套應需 Lv.45');
assert.equal(Array.from(result.elfSupportLevels).every(v=>v===50),true,'火勢劍舞／精靈號令配套應需 Lv.50');
assert.equal(result.supportReqAll,true,'新配套應維持全職業可穿，流派效果仍由技能與武器 Tag 判定');
assert.equal(result.coreDrops,7,'四件核心中，四靈號令杖由4個精靈王共同掉落');
assert.equal(result.supportDropIds,16,'16件配套裝備都應有故事相符的掉落來源');
console.log('黑暗妖精／妖精四流派機制測試通過');
