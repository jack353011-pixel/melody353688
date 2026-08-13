const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const testMath = Object.create(Math);
const context = vm.createContext({console:{log(){},warn(){},error(){}},Math:testMath});
context.window = context;
const run = file => vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
run('js/00-data.js');
run('js/00-tag-core.js');

vm.runInContext(`
MOB_DROPS={};
state={ticks:0,running:true};
mapState={mobs:[]};
logs=[];
logCombat=(s)=>logs.push(s);
mobWake=()=>{};
killMob=i=>{if(mapState.mobs[i])mapState.mobs[i]._dead=true};
renderMobs=()=>{};
teamRecoverMp=n=>{player.mp=Math.min(player.mmp,player.mp+n)};
applyMobStatus=(m,s)=>{m.lastStatus=s.kind};
titanThreshold=()=>.4;
classSkillEquipMult=()=>1;
playerAttack=()=>{let t=getTarget();t.curHp-=10;return true};
d2rTriggerIncoming=(owner,dmg)=>dmg;
manualCast=()=>true;
castSkillInner=()=>true;
tick=()=>true;
`,context);
run('js/63-warrior-illusion-flows.js');
run('js/64-warrior-illusion-support-gear.js');

const result = vm.runInContext(`(() => {
 DB.items.test_axe={n:'普通戰斧',type:'wpn'};
 DB.items.test_heavy={n:'普通重鎧',type:'arm',slot:'armor',heavyArmor:true};
 DB.items.test_light={n:'普通皮甲',type:'arm',slot:'armor'};
 DB.items.test_qigu={n:'普通奇古獸',type:'wpn',qigu:true};

 let blood={uid:1,n:'流血木人',hp:1000,curHp:1000,bleeds:[{dmg:20,ticksLeft:40}]};
 player={cls:'warrior',lv:50,skills:['sk_warrior_throwaxe'],eq:{wpn:{id:'test_axe'}},buffs:{sk_warrior_throwaxe:100},d:{}};
 mapState.mobs=[blood];getTarget=()=>blood;state.ticks=20;
 playerAttack();let bloodFirst=blood.curHp,bloodDuration=blood.bleeds[0].ticksLeft;
 playerAttack();let bloodSecond=blood.curHp;

 player={cls:'warrior',skills:['sk_warrior_titan_rock'],eq:{armor:{id:'test_heavy'}},buffs:{},hp:300,mhp:1000};
 state.ticks=100;let titan1=d2rTriggerIncoming(player,100,{},'physical');
 let titan2=d2rTriggerIncoming(player,100,{},'physical');
 let titan3=d2rTriggerIncoming(player,100,{},'physical');
 let titanShield=player._d2rShield||0;
 let titanLight=buildFlowAccess({skills:['sk_warrior_titan_rock'],eq:{armor:{id:'test_light'}}},'titanWall').active;

 player={cls:'illusion',skills:['sk_illu_pain'],eq:{armor:{id:'test_light'}},buffs:{sk_illu_pain:100},hp:700,mhp:1000};
 state.ticks=200;let pain1=d2rTriggerIncoming(player,100,{},'magic');
 let pain2=d2rTriggerIncoming(player,100,{},'magic');let painShield=player._d2rShield||0;

 let cubeMob={uid:2,n:'共鳴木人',hp:1000,curHp:1000};
 player={cls:'illusion',lv:50,skills:['sk_illu_cube_burn'],eq:{wpn:{id:'test_qigu'}},buffs:{sk_illu_cube_burn:100},d:{magicDmg:20},mhp:500,mmp:200,mp:0};
 mapState.mobs=[cubeMob];getTarget=()=>cubeMob;state.ticks=40;
 manualCast('sk_illu_cube_burn');tick();
 let firstCubeChoice=player._cubeResonance73;
 let supportIds=Object.keys(DB.items).filter(id=>DB.items[id]&&['bloodAxeHunt','titanWall','cubeResonance','painMirror'].includes(DB.items[id].flowSupport));
 let supportOwner={skills:['sk_warrior_throwaxe'],eq:{
  helm:{id:'hlm_blood_hunt_scent'},cloak:{id:'clk_blood_hunt_trail'},gloves:{id:'glv_blood_hunt_rend'},boots:{id:'bot_blood_hunt_giant'},wpn:{id:'test_axe'}
 }};
 let supportFocus=buildFlowFocusIds(supportOwner,'bloodAxeHunt');

 let bloodSupport={uid:3,n:'延續木人',hp:1000,curHp:1000,bleeds:[{dmg:20,ticksLeft:40}]};
 player={cls:'warrior',lv:50,skills:['sk_warrior_throwaxe'],eq:{wpn:{id:'test_axe'},helm:{id:'hlm_blood_hunt_scent'},cloak:{id:'clk_blood_hunt_trail'}},buffs:{sk_warrior_throwaxe:100},d:{}};
 mapState.mobs=[bloodSupport];getTarget=()=>bloodSupport;state.ticks=100;playerAttack();

 let bloodBoss={uid:4,n:'巨獸木人',boss:true,hp:5000,curHp:5000,bleeds:[{dmg:100,ticksLeft:40}]};
 player={cls:'warrior',lv:50,skills:['sk_warrior_throwaxe'],eq:{wpn:{id:'test_axe'},gloves:{id:'glv_blood_hunt_rend'},boots:{id:'bot_blood_hunt_giant'}},buffs:{sk_warrior_throwaxe:100},d:{}};
 mapState.mobs=[bloodBoss];getTarget=()=>bloodBoss;state.ticks=200;playerAttack();

 player={cls:'warrior',skills:['sk_warrior_titan_rock'],eq:{armor:{id:'test_heavy'},helm:{id:'hlm_titan_endure'},cloak:{id:'clk_titan_pressure'}},buffs:{},hp:300,mhp:1000};
 state.ticks=300;let titanSupport1=d2rTriggerIncoming(player,100,{},'physical');let titanSupport2=d2rTriggerIncoming(player,100,{},'physical');
 let titanSupportShield=player._d2rShield||0;

 player={cls:'warrior',skills:['sk_warrior_titan_rock'],eq:{armor:{id:'test_heavy'},gloves:{id:'glv_titan_bulwark'},boots:{id:'bot_titan_recover'}},buffs:{},hp:300,mhp:1000};
 state.ticks=400;d2rTriggerIncoming(player,100,{},'physical');d2rTriggerIncoming(player,100,{},'physical');d2rTriggerIncoming(player,100,{},'physical');
 let titanShieldSpec=player._d2rShield||0,titanCdSpec=player._titanWallCd73;

 player={cls:'illusion',skills:['sk_illu_pain'],eq:{armor:{id:'test_light'},helm:{id:'hlm_pain_awaken'},cloak:{id:'clk_pain_veil'}},buffs:{sk_illu_pain:100},hp:700,mhp:1000};
 state.ticks=500;let painSupportHit=d2rTriggerIncoming(player,100,{},'magic');let painSupportShield=player._d2rShield||0;

 player={cls:'illusion',skills:['sk_illu_pain'],eq:{armor:{id:'test_light'},gloves:{id:'glv_pain_convert'},boots:{id:'bot_pain_return'}},buffs:{sk_illu_pain:100},hp:700,mhp:1000};
 state.ticks=600;d2rTriggerIncoming(player,100,{},'magic');d2rTriggerIncoming(player,100,{},'magic');
 let painShieldSpec=player._d2rShield||0,painCdSpec=player._painMirrorCd73;

 let burnSupport={uid:5,n:'高生命木人',hp:5000,curHp:5000};
 player={cls:'illusion',lv:50,skills:['sk_illu_cube_burn'],eq:{wpn:{id:'test_qigu'},helm:{id:'hlm_cube_ember'}},buffs:{sk_illu_cube_burn:100},d:{magicDmg:20},mhp:500,mmp:200,mp:0};
 mapState.mobs=[burnSupport];getTarget=()=>burnSupport;state.ticks=640;manualCast('sk_illu_cube_burn');tick();

 player={cls:'illusion',lv:50,skills:['sk_illu_cube_quake'],eq:{wpn:{id:'test_qigu'},cloak:{id:'clk_cube_quake'}},buffs:{sk_illu_cube_quake:100},d:{},mhp:500,mmp:200,mp:0};
 mapState.mobs=[{uid:6,n:'地相木人',hp:1000,curHp:1000}];getTarget=()=>mapState.mobs[0];state.ticks=680;manualCast('sk_illu_cube_quake');tick();let quakeShield=player._d2rShield||0;

 Math.random=()=>.25;
 let shockSupport={uid:7,n:'衝相木人',hp:1000,curHp:1000};
 player={cls:'illusion',lv:50,skills:['sk_illu_cube_shock'],eq:{wpn:{id:'test_qigu'},gloves:{id:'glv_cube_shock'}},buffs:{sk_illu_cube_shock:100},d:{},mhp:500,mmp:200,mp:0};
 mapState.mobs=[shockSupport];getTarget=()=>shockSupport;state.ticks=720;manualCast('sk_illu_cube_shock');tick();

 player={cls:'illusion',lv:50,skills:['sk_illu_cube_harmony'],eq:{wpn:{id:'test_qigu'},boots:{id:'bot_cube_harmony'}},buffs:{sk_illu_cube_harmony:100},d:{},mhp:500,mmp:500,mp:0};
 mapState.mobs=[{uid:8,n:'和相木人',hp:1000,curHp:1000}];getTarget=()=>mapState.mobs[0];state.ticks=760;manualCast('sk_illu_cube_harmony');tick();
 let harmonyMp=player.mp,harmonyShield=player._d2rShield||0;
 return {bloodFirst,bloodSecond,bloodDuration,titan1,titan2,titan3,titanShield,titanLight,pain1,pain2,painShield,cubeHp:cubeMob.curHp,cubeChoice:firstCubeChoice,
  coreDrops:Object.values(MOB_DROPS).flat().filter(r=>['wpn_blood_hunter_axe','arm_titan_reverse_wall','wpn_fourfold_qigu','arm_pain_mirror'].includes(r[0])).length,
  supportCount:supportIds.length,supportDrops:Object.values(MOB_DROPS).flat().filter(r=>supportIds.includes(r[0])&&r[1]===2).length,
  supportFocusCount:supportFocus.length,supportCooldown:buildFlowSupportValue(supportOwner,'bloodAxeHunt','bloodHuntCooldownPct'),supportInactive:buildFlowSupportValue(supportOwner,'bloodAxeHunt','bloodHuntBleedScalePct'),
  bloodSupportHp:bloodSupport.curHp,bloodSupportDuration:bloodSupport.bleeds[0].ticksLeft,bloodSupportCd:bloodSupport._bloodAxeHuntCd,bloodBossHp:bloodBoss.curHp,
  titanSupport1,titanSupport2,titanSupportShield,titanShieldSpec,titanCdSpec,painSupportHit,painSupportShield,painShieldSpec,painCdSpec,
  burnSupportHp:burnSupport.curHp,quakeShield,shockStatus:shockSupport.lastStatus,harmonyMp,harmonyShield};
})()`,context);

assert.equal(result.bloodFirst, 964, '血斧首次命中應包含基礎10與依流血、等級計算的追擊26');
assert.equal(result.bloodSecond, 954, '血斧在2秒冷卻內不得再次追擊');
assert.equal(result.bloodDuration, 50, '血斧應延長既有流血而非新增層數');
assert.deepEqual([result.titan1,result.titan2,result.titan3],[88,88,88], '泰坦逆壁低血量時應減傷12%');
assert.equal(result.titanShield, 50, '泰坦逆壁第三次受傷應獲得5%生命護盾');
assert.equal(result.titanLight, false, '一般輕甲不得啟動泰坦逆壁');
assert.deepEqual([result.pain1,result.pain2],[92,92], '痛覺鏡界應降低8%直接傷害');
assert.equal(result.painShield, 80, '痛覺達門檻後應轉化8%生命護盾');
assert.ok(result.cubeHp < 1000, '燃燒共鳴應產生有上限的追加傷害');
assert.equal(result.cubeChoice, 'sk_illu_cube_burn', '立方共鳴應記住最後施放的立方');
assert.equal(result.coreDrops, 4, '四件核心特化裝都應有故事相符的掉落來源');
assert.equal(result.supportCount, 16, '四個流派應各有四件配套裝備');
assert.equal(result.supportDrops, 16, '16件配套裝備都應有2%故事掉落來源');
assert.equal(result.supportFocusCount, 2, '每個流派最多只能啟用兩項主要專精');
assert.equal(result.supportCooldown, 20, '自動選中的第一項配套應生效');
assert.equal(result.supportInactive, 0, '未被選中的第三項配套不得偷渡效果');
assert.equal(result.bloodSupportHp, 964, '追擊節奏／傷口延續配置不得意外改變未選中的傷害專精');
assert.equal(result.bloodSupportDuration, 60, '傷口延續應把流血額外延長1秒');
assert.equal(result.bloodSupportCd, 116, '追擊節奏應把2秒間隔縮短為1.6秒');
assert.equal(result.bloodBossHp, 4950, '流血轉傷＋巨獸追獵應受0.8%頭目生命上限控制');
assert.deepEqual([result.titanSupport1,result.titanSupport2],[85,85], '泰坦危境減傷專精應提高至15%');
assert.equal(result.titanSupportShield, 50, '泰坦蓄力專精應在第二次受傷形成基礎護盾');
assert.equal(result.titanShieldSpec, 70, '泰坦護盾專精應提高至7%最大生命');
assert.equal(result.titanCdSpec, 464, '泰坦復勢應把8秒冷卻縮短為6.4秒');
assert.equal(result.painSupportHit, 89, '痛覺減傷專精應提高至11%');
assert.equal(result.painSupportShield, 80, '蓄痛門檻專精應在累積8%傷害時形成護盾');
assert.equal(result.painShieldSpec, 100, '鏡界護盾專精應提高至10%最大生命');
assert.equal(result.painCdSpec, 664, '痛返專精應把8秒冷卻縮短為6.4秒');
assert.equal(result.burnSupportHp, 4963, '燃燒專精應把未觸頂的共鳴傷害提高20%');
assert.equal(result.quakeShield, 15, '地裂專精應形成3%最大生命護盾');
assert.equal(result.shockStatus, 'paralyze', '衝擊專精30%機率應能通過25%測試骰');
assert.equal(result.harmonyMp, 15, '和諧專精應恢復3%最大MP');
assert.equal(result.harmonyShield, 5, '和諧專精不應偷改未選定的護盾比例');
console.log('戰士／幻術士四流派機制測試通過');
