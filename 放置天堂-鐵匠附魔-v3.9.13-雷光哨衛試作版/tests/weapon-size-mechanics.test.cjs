const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console:{ log(){}, warn(){}, error(){} } });
const runFile = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename:file });

runFile('js/00-data.js');
const uiSource = fs.readFileSync(path.join(root, 'js/10-ui-tabs.js'), 'utf8');
const weaponTagsSource = uiSource.match(/const WEAPON_TAGS = \{[\s\S]*?\n\};\nfunction getWeaponTags\(id\)\{ return WEAPON_TAGS\[id\] \|\| \[\]; \}/);
assert.ok(weaponTagsSource, '找不到完整武器 Tag 表');
vm.runInContext(weaponTagsSource[0], context, { filename:'js/10-ui-tabs.js#weapon-tags' });
context.isWandWeapon = d => !!(d && d.type === 'wpn' && (d.isWand || /魔杖|法杖/.test(d.n || '') || (/杖/.test(d.n || '') && !/權杖/.test(d.n || ''))));
const dropsSource = fs.readFileSync(path.join(root, 'js/01-drops-config.js'), 'utf8');
const atkFamilySource = dropsSource.match(/function atkSpdFamily\(id\) \{[\s\S]*?\n\}\n\/\/ 取「動作\/分鐘」/);
assert.ok(atkFamilySource, '找不到攻速武器家族解析器');
vm.runInContext(atkFamilySource[0].replace(/\n\/\/ 取「動作\/分鐘」$/, ''), context, { filename:'js/01-drops-config.js#atk-family' });
runFile('js/00-weapon-size-mechanics.js');

const result = vm.runInContext(`(() => {
    const sword = DB.items.wpn_2hsword;
    const spear = DB.items.wpn_4;
    const autoLegacySpear = DB.items.wpn_17;
    const owner = {};
    const inst = {id:'wpn_2hsword',uid:'size-test'};
    const breakTarget = {s:'L'};
    const staggerTarget = {s:'L',atkSpd:2,_atkCd:10};
    const elmo = DB.items.relic_elmo_spear;
    const demon = DB.items.wpn_demonking_spear;
    const ancient = DB.items.wpn_ancient_spear;
    const dragonSlayer = DB.items.wpn_dragonslayer;
    const demonGreatsword = DB.items.wpn_demonking_2hsword;
    const oldGreatsword = DB.items.wpn_old_greatsword;
    const battleaxe = DB.items.wpn_battleaxe;
    const mapler = DB.items.wpn_mapler_punish;
    const ohmMaul = DB.items.relic_ohm_maul;
    const iceMaul = DB.items.relic_icestone_maul;
    const longSword = DB.items.wpn_longsword;
    const kurtSword = DB.items.wpn_kurt_sword;
    const earthSword = DB.items.relic_earthshatter_sword;
    const pagrioSword = DB.items.wpn_pagrio_wrath;
    const mace = DB.items.wpn_2;
    const thorHammer = DB.items.wpn_thor_hammer;
    const osisHammer = DB.items.wpn_osis_hammer;
    const hellfireHammer = DB.items.relic_hellfire_hammer;
    const dagger = DB.items.wpn_dagger1;
    const shadowDagger = DB.items.relic_shadow_stinger;
    const thornDagger = DB.items.relic_thorn_needle;
    const bloodDagger = DB.items.relic_blood_ritual_dagger;
    const oneHandSpear = DB.items.wpn_21;
    const lizardSpear = DB.items.relic_lizard_tongue;
    const guardSpear = DB.items.relic_guard_spear;
    const frostSpear = DB.items.wpn_frost_spear;
    const bow = DB.items.wpn_3;
    const antennaBow = DB.items.relic_giantant_antenna;
    const sharpshooterBow = DB.items.relic_sharpshooter_bow;
    const rottenBow = DB.items.wpn_rotten_longbow;
    const crossbow = DB.items.wpn_31;
    const abyssCrossbow = DB.items.wpn_xbow_abyss;
    const crimsonCrossbow = DB.items.wpn_crimson_xbow;
    const sniperCrossbow = DB.items.relic_forgotten_sniperbow;
    const wand = DB.items.wpn_oakwand;
    const laiaWand = DB.items.wpn_laia_wand;
    const holyWand = DB.items.wpn_holycrystal_wand;
    const disruptTarget = {s:'S',st:{magicseal:0}};
    const bossDisruptTarget = {s:'S',boss:true,st:{magicseal:0}};
    const dualBlade = DB.items.wpn_dual_bronze;
    const redshadowDual = DB.items.wpn_redshadow_dual;
    const destroyDual = DB.items.wpn_dual_destroy;
    const wingDual = DB.items.relic_wing_chaos_blades;
    const claw = DB.items.wpn_claw_bronze;
    const spiderClaw = DB.items.relic_spider_claw;
    const beastClaw = DB.items.wpn_beastking_claw;
    const hiddenClaw = DB.items.wpn_demon_claw_hidden;
    const chainSword = DB.items.wpn_chain_annihilator;
    const frostChain = DB.items.wpn_chain_frost;
    const bloodChain = DB.items.wpn_chain_bloodthirst;
    const hiddenChain = DB.items.wpn_demon_chain_hidden;
    const qigu = DB.items.wpn_qigu_obsidian;
    const frostQigu = DB.items.wpn_qigu_frost;
    const meditateQigu = DB.items.wpn_qigu_meditate;
    const hiddenQigu = DB.items.wpn_demon_qigu_hidden;
    const focusOwner = {mp:3,mmp:10};
    const launcher = DB.items.wpn_kukulkan_gauntlet;
    const blowdart = DB.items.relic_yuka_blowdart;
    const sling = DB.items.relic_jack_sling;
    const corpseNeedle = DB.items.relic_corpse_needle;
    const suppressTarget = {s:'L',st:{broken:0}};
    const ordinarySword = DB.items.wpn_9;
    const ordinaryMace = DB.items.wpn_13;
    const ordinaryBow = DB.items.wpn_elfbow;
    const namedLowWeight = DB.items.wpn_thebes_wand;
    const unassignedRelic = DB.items.relic_goblin_blade;
    const abyssClaw = DB.items.wpn_claw_abyss;
    const abyssDual = DB.items.wpn_dual_abyss;
    const manaDagger = DB.items.wpn_manadagger;
    const ironAxe = DB.items.wpn_iron_axehead;
    const giantAxe = DB.items.wpn_giant_axehead;
    const ancientAxe = DB.items.wpn_ancient_axe;
    const thebesGreatsword = DB.items.wpn_thebes_2hsword;
    const emperorBlade = DB.items.wpn_emperor_blade;
    const giltasSword = DB.items.wpn_giltas_sword;
    const cursedEmperor = DB.items.wpn_cursed_emperor_blade;
    const demonSword = DB.items.wpn_demon_sword;
    const oldSwordNamed = DB.items.wpn_old_sword;
    const ancientDarkelfSword = DB.items.wpn_ancient_darkelf_sword;
    const hiddenDemonSword = DB.items.wpn_demon_sword_hidden;
    const powerlessBaless = DB.items.wpn_powerless_baless;
    const demonScythe = DB.items.wpn_demon_scythe;
    const thebesWand = DB.items.wpn_thebes_wand;
    const darkmageWand = DB.items.wpn_darkmage_wand;
    const onmyojiFan = DB.items.wpn_onmyoji_fan;
    const powerlessBaphomet = DB.items.wpn_powerless_baphomet;
    const hiddenDemonWand = DB.items.wpn_demon_wand_hidden;
    const darkCrystalball = DB.items.wpn_dark_crystalball;
    const orcNail = DB.items.relic_orc_nail;
    const sharkTeeth = DB.items.relic_shark_teeth;
    const killerbeeSting = DB.items.relic_killerbee_sting;
    const kairaFang = DB.items.relic_kaira_fang;
    const ogiGreataxe = DB.items.relic_ogi_greataxe;
    const fighterAxe = DB.items.relic_fighter_axe;
    const giantThrowstone = DB.items.relic_giant_throwstone;
    const mudIdol = DB.items.relic_mud_idol;
    const weatheredObelisk = DB.items.relic_weathered_obelisk;
    const ratmanSkewer = DB.items.relic_ratman_skewer;
    const lizardmanCleaver = DB.items.relic_lizardman_cleaver;
    const etoWhip = DB.items.relic_eto_whip;
    const serpentFang = DB.items.relic_serpent_fang;
    const executorSkewer = DB.items.relic_executor_skewer;
    const ushioniHorn = DB.items.relic_sr_ushioni_horn;
    const venomFang = DB.items.relic_venom_fang;
    const parrotBeak = DB.items.relic_parrot_beak;
    const crocFang = DB.items.relic_croc_fang;
    const giantToothpick = DB.items.relic_giant_toothpick;
    const veteranGreatsword = DB.items.relic_veteran_greatsword;
    const deadgeneralGreatsword = DB.items.relic_deadgeneral_greatsword;
    const guardianGreatsword = DB.items.relic_guardian_greatsword;
    const firekingBlast = DB.items.relic_fireking_blast;
    const reaperScythe = DB.items.relic_reaper_scythe;
    const gremlinClub = DB.items.relic_gremlin_club;
    const huskyBone = DB.items.relic_husky_bone;
    const icefieldPick = DB.items.relic_icefield_pick;
    const werewolfMace = DB.items.relic_werewolf_mace;
    const strongFemur = DB.items.relic_strong_femur;
    const summonerWhip = DB.items.relic_summoner_whip;
    const medusaStinger = DB.items.relic_medusa_stinger;
    const executorAxe = DB.items.relic_executor_axe;
    const lavaFists = DB.items.relic_lava_fists;
    const monkeyStaff = DB.items.relic_monkey_staff;
    const ashFist = DB.items.relic_ash_fist;
    const relicSwordCases = [
        ['goblin', DB.items.relic_goblin_blade],
        ['gladiator', DB.items.relic_gladiator_scimitar],
        ['orc-cleaver', DB.items.relic_orc_cleaver],
        ['hobgoblin', DB.items.relic_hobgoblin_grinder],
        ['butcher', DB.items.relic_orc_butcher],
        ['pirate', DB.items.relic_pirate_scimitar],
        ['harvey', DB.items.relic_harvey_claw],
        ['darkelf', DB.items.relic_darkelf_grindblade],
        ['wisp', DB.items.relic_wisp_remnant],
        ['ashwarrior', DB.items.relic_ashwarrior_flamesword],
        ['spider', DB.items.relic_ancient_spider_claw],
        ['ant', DB.items.relic_ant_pincer],
        ['uncursed-emperor', DB.items.wpn_uncursed_emperor_blade],
        ['kama', DB.items.relic_sr_kama_blade],
        ['blackblade', DB.items.relic_warrior_blackblade],
        ['mageblade', DB.items.relic_mageblade_knife],
        ['flame-dk', DB.items.relic_flame_dk_sword]
    ];
    const relicWandCases = [
        ['zombie-shin', DB.items.relic_zombie_shin],
        ['amp-staff', DB.items.relic_amp_staff],
        ['apprentice', DB.items.relic_apprentice_wand],
        ['frostdeath', DB.items.relic_frostdeath_breath],
        ['beholder', DB.items.relic_beholder_gaze],
        ['evil-lizard', DB.items.relic_evillizard_eye],
        ['lightbeam', DB.items.relic_lightbeam_wand],
        ['eto', DB.items.relic_eto_wand],
        ['succubus', DB.items.relic_succubus_wand],
        ['warlock', DB.items.relic_warlock_grimoire],
        ['windking', DB.items.relic_windking_roar],
        ['rockmage', DB.items.relic_rockmage_secret],
        ['ocean', DB.items.relic_ocean_orb],
        ['kyuubi', DB.items.relic_sr_kyuubi_wand],
        ['water', DB.items.relic_water_orb],
        ['steelmonk', DB.items.relic_steelmonk_staff]
    ];
    return {
        sizes:[combatTargetSizeTag({s:'S'}),combatTargetSizeTag({s:'M'}),combatTargetSizeTag({s:'L'})],
        swordSmall:weaponSizeMechanic(sword,{s:'S'}).effect,
        swordLarge:weaponSizeMechanic(sword,{s:'L'}).effect,
        swordMedium:weaponSizeMechanic(sword,{s:'M'}),
        spearSmall:weaponSizeMechanic(spear,{s:'S'}).effect,
        spearLarge:weaponSizeMechanic(spear,{s:'L'}).effect,
        elmoSmall:weaponSizeMechanic(elmo,{s:'S'}),
        elmoLarge:weaponSizeMechanic(elmo,{s:'L'}),
        demonLarge:weaponSizeMechanic(demon,{s:'L'}),
        ancientLarge:weaponSizeMechanic(ancient,{s:'L'}),
        dragonSmall:weaponSizeMechanic(dragonSlayer,{s:'S'}),
        dragonLarge:weaponSizeMechanic(dragonSlayer,{s:'L'}),
        demonSwordSmall:weaponSizeMechanic(demonGreatsword,{s:'S'}),
        demonSwordLarge:weaponSizeMechanic(demonGreatsword,{s:'L'}),
        oldSwordSmall:weaponSizeMechanic(oldGreatsword,{s:'S'}),
        oldSwordLarge:weaponSizeMechanic(oldGreatsword,{s:'L'}),
        battleSmall:weaponSizeMechanic(battleaxe,{s:'S'}),
        battleLarge:weaponSizeMechanic(battleaxe,{s:'L'}),
        maplerSmall:weaponSizeMechanic(mapler,{s:'S'}),
        maplerLarge:weaponSizeMechanic(mapler,{s:'L'}),
        ohmSmall:weaponSizeMechanic(ohmMaul,{s:'S'}),
        ohmLarge:weaponSizeMechanic(ohmMaul,{s:'L'}),
        iceSmall:weaponSizeMechanic(iceMaul,{s:'S'}),
        iceLarge:weaponSizeMechanic(iceMaul,{s:'L'}),
        longSwordSmall:weaponSizeMechanic(longSword,{s:'S'}),
        longSwordLarge:weaponSizeMechanic(longSword,{s:'L'}),
        kurtSmall:weaponSizeMechanic(kurtSword,{s:'S'}),
        kurtLarge:weaponSizeMechanic(kurtSword,{s:'L'}),
        earthSwordSmall:weaponSizeMechanic(earthSword,{s:'S'}),
        earthSwordLarge:weaponSizeMechanic(earthSword,{s:'L'}),
        pagrioSmall:weaponSizeMechanic(pagrioSword,{s:'S'}),
        pagrioLarge:weaponSizeMechanic(pagrioSword,{s:'L'}),
        maceSmall:weaponSizeMechanic(mace,{s:'S'}),
        maceLarge:weaponSizeMechanic(mace,{s:'L'}),
        thorSmall:weaponSizeMechanic(thorHammer,{s:'S'}),
        thorLarge:weaponSizeMechanic(thorHammer,{s:'L'}),
        osisSmall:weaponSizeMechanic(osisHammer,{s:'S'}),
        osisLarge:weaponSizeMechanic(osisHammer,{s:'L'}),
        hellfireSmall:weaponSizeMechanic(hellfireHammer,{s:'S'}),
        hellfireLarge:weaponSizeMechanic(hellfireHammer,{s:'L'}),
        daggerSmall:weaponSizeMechanic(dagger,{s:'S'}),
        daggerLarge:weaponSizeMechanic(dagger,{s:'L'}),
        shadowSmall:weaponSizeMechanic(shadowDagger,{s:'S'}),
        shadowLarge:weaponSizeMechanic(shadowDagger,{s:'L'}),
        thornSmall:weaponSizeMechanic(thornDagger,{s:'S'}),
        thornLarge:weaponSizeMechanic(thornDagger,{s:'L'}),
        bloodSmall:weaponSizeMechanic(bloodDagger,{s:'S'}),
        bloodLarge:weaponSizeMechanic(bloodDagger,{s:'L'}),
        oneSpearSmall:weaponSizeMechanic(oneHandSpear,{s:'S'}),
        oneSpearLarge:weaponSizeMechanic(oneHandSpear,{s:'L'}),
        lizardSpearSmall:weaponSizeMechanic(lizardSpear,{s:'S'}),
        lizardSpearLarge:weaponSizeMechanic(lizardSpear,{s:'L'}),
        guardSpearSmall:weaponSizeMechanic(guardSpear,{s:'S'}),
        guardSpearLarge:weaponSizeMechanic(guardSpear,{s:'L'}),
        frostSpearSmall:weaponSizeMechanic(frostSpear,{s:'S'}),
        frostSpearLarge:weaponSizeMechanic(frostSpear,{s:'L'}),
        bowSmall:weaponSizeMechanic(bow,{s:'S'}),
        bowLarge:weaponSizeMechanic(bow,{s:'L'}),
        antennaBowSmall:weaponSizeMechanic(antennaBow,{s:'S'}),
        antennaBowLarge:weaponSizeMechanic(antennaBow,{s:'L'}),
        sharpshooterBowSmall:weaponSizeMechanic(sharpshooterBow,{s:'S'}),
        sharpshooterBowLarge:weaponSizeMechanic(sharpshooterBow,{s:'L'}),
        rottenBowSmall:weaponSizeMechanic(rottenBow,{s:'S'}),
        rottenBowLarge:weaponSizeMechanic(rottenBow,{s:'L'}),
        crossbowSmall:weaponSizeMechanic(crossbow,{s:'S'}),
        crossbowLarge:weaponSizeMechanic(crossbow,{s:'L'}),
        abyssCrossbowSmall:weaponSizeMechanic(abyssCrossbow,{s:'S'}),
        abyssCrossbowLarge:weaponSizeMechanic(abyssCrossbow,{s:'L'}),
        crimsonCrossbowSmall:weaponSizeMechanic(crimsonCrossbow,{s:'S'}),
        crimsonCrossbowLarge:weaponSizeMechanic(crimsonCrossbow,{s:'L'}),
        sniperCrossbowSmall:weaponSizeMechanic(sniperCrossbow,{s:'S'}),
        sniperCrossbowLarge:weaponSizeMechanic(sniperCrossbow,{s:'L'}),
        wandSmall:weaponSizeMechanic(wand,{s:'S'}),
        wandLarge:weaponSizeMechanic(wand,{s:'L'}),
        laiaWandSmall:weaponSizeMechanic(laiaWand,{s:'S'}),
        laiaWandLarge:weaponSizeMechanic(laiaWand,{s:'L'}),
        holyWandSmall:weaponSizeMechanic(holyWand,{s:'S'}),
        holyWandLarge:weaponSizeMechanic(holyWand,{s:'L'}),
        disruptFirst:applyWeaponSizeDisrupt(disruptTarget,{durationTicks:10,cooldownTicks:40},100),
        disruptBlocked:applyWeaponSizeDisrupt(disruptTarget,{durationTicks:10,cooldownTicks:40},110),
        disruptSeal:disruptTarget.st.magicseal,
        disruptBoss:applyWeaponSizeDisrupt(bossDisruptTarget,{durationTicks:10,cooldownTicks:40},100),
        dualSmall:weaponSizeMechanic(dualBlade,{s:'S'}),
        dualLarge:weaponSizeMechanic(dualBlade,{s:'L'}),
        redshadowDualSmall:weaponSizeMechanic(redshadowDual,{s:'S'}),
        redshadowDualLarge:weaponSizeMechanic(redshadowDual,{s:'L'}),
        destroyDualSmall:weaponSizeMechanic(destroyDual,{s:'S'}),
        destroyDualLarge:weaponSizeMechanic(destroyDual,{s:'L'}),
        wingDualSmall:weaponSizeMechanic(wingDual,{s:'S'}),
        wingDualLarge:weaponSizeMechanic(wingDual,{s:'L'}),
        clawSmall:weaponSizeMechanic(claw,{s:'S'}),
        clawLarge:weaponSizeMechanic(claw,{s:'L'}),
        spiderClawSmall:weaponSizeMechanic(spiderClaw,{s:'S'}),
        spiderClawLarge:weaponSizeMechanic(spiderClaw,{s:'L'}),
        beastClawSmall:weaponSizeMechanic(beastClaw,{s:'S'}),
        beastClawLarge:weaponSizeMechanic(beastClaw,{s:'L'}),
        hiddenClawSmall:weaponSizeMechanic(hiddenClaw,{s:'S'}),
        hiddenClawLarge:weaponSizeMechanic(hiddenClaw,{s:'L'}),
        chainSmall:weaponSizeMechanic(chainSword,{s:'S'}),
        chainLarge:weaponSizeMechanic(chainSword,{s:'L'}),
        frostChainSmall:weaponSizeMechanic(frostChain,{s:'S'}),
        frostChainLarge:weaponSizeMechanic(frostChain,{s:'L'}),
        bloodChainSmall:weaponSizeMechanic(bloodChain,{s:'S'}),
        bloodChainLarge:weaponSizeMechanic(bloodChain,{s:'L'}),
        hiddenChainSmall:weaponSizeMechanic(hiddenChain,{s:'S'}),
        hiddenChainLarge:weaponSizeMechanic(hiddenChain,{s:'L'}),
        qiguSmall:weaponSizeMechanic(qigu,{s:'S'}),
        qiguLarge:weaponSizeMechanic(qigu,{s:'L'}),
        frostQiguSmall:weaponSizeMechanic(frostQigu,{s:'S'}),
        frostQiguLarge:weaponSizeMechanic(frostQigu,{s:'L'}),
        meditateQiguSmall:weaponSizeMechanic(meditateQigu,{s:'S'}),
        meditateQiguLarge:weaponSizeMechanic(meditateQigu,{s:'L'}),
        hiddenQiguSmall:weaponSizeMechanic(hiddenQigu,{s:'S'}),
        hiddenQiguLarge:weaponSizeMechanic(hiddenQigu,{s:'L'}),
        focusFirst:applyWeaponSizeFocus(focusOwner,{mp:1,cooldownTicks:40},100),
        focusBlocked:applyWeaponSizeFocus(focusOwner,{mp:1,cooldownTicks:40},110),
        focusSecond:applyWeaponSizeFocus(focusOwner,{mp:1,cooldownTicks:40},140),
        focusMp:focusOwner.mp,
        launcherSmall:weaponSizeMechanic(launcher,{s:'S'}),
        launcherLarge:weaponSizeMechanic(launcher,{s:'L'}),
        blowdartSmall:weaponSizeMechanic(blowdart,{s:'S'}),
        blowdartLarge:weaponSizeMechanic(blowdart,{s:'L'}),
        slingSmall:weaponSizeMechanic(sling,{s:'S'}),
        slingLarge:weaponSizeMechanic(sling,{s:'L'}),
        needleSmall:weaponSizeMechanic(corpseNeedle,{s:'S'}),
        needleLarge:weaponSizeMechanic(corpseNeedle,{s:'L'}),
        suppressFirst:applyWeaponSizeSuppress(suppressTarget,{durationTicks:20,cooldownTicks:50},100),
        suppressBlocked:applyWeaponSizeSuppress(suppressTarget,{durationTicks:20,cooldownTicks:50},120),
        suppressDuration:suppressTarget.st.broken,
        ordinarySwordSmall:weaponSizeMechanic(ordinarySword,{s:'S'}),
        ordinarySwordLarge:weaponSizeMechanic(ordinarySword,{s:'L'}),
        ordinaryMaceSmall:weaponSizeMechanic(ordinaryMace,{s:'S'}),
        ordinaryBowLarge:weaponSizeMechanic(ordinaryBow,{s:'L'}),
        namedLowWeightSmall:weaponSizeMechanic(namedLowWeight,{s:'S'}),
        unassignedRelicSmall:weaponSizeMechanic(unassignedRelic,{s:'S'}),
        autoAudit:auditAutomaticWeaponPrototypeInheritance(DB.items),
        autoEligibleCount:Object.values(DB.items).filter(weaponMayAutoInheritPrototype).length,
        manualRemainingCount:Object.values(DB.items).filter(def => def && def.type === 'wpn' && !def.isArrow && !def.sizeMechanics && !def.prototypePolicy && !weaponMayAutoInheritPrototype(def)).length,
        abyssClawSmall:weaponSizeMechanic(abyssClaw,{s:'S'}),
        abyssClawLarge:weaponSizeMechanic(abyssClaw,{s:'L'}),
        abyssDualSmall:weaponSizeMechanic(abyssDual,{s:'S'}),
        abyssDualLarge:weaponSizeMechanic(abyssDual,{s:'L'}),
        manaDaggerSmall:weaponSizeMechanic(manaDagger,{s:'S'}),
        manaDaggerLarge:weaponSizeMechanic(manaDagger,{s:'L'}),
        ironAxeSmall:weaponSizeMechanic(ironAxe,{s:'S'}),
        ironAxeLarge:weaponSizeMechanic(ironAxe,{s:'L'}),
        giantAxeSmall:weaponSizeMechanic(giantAxe,{s:'S'}),
        giantAxeLarge:weaponSizeMechanic(giantAxe,{s:'L'}),
        ancientAxeSmall:weaponSizeMechanic(ancientAxe,{s:'S'}),
        ancientAxeLarge:weaponSizeMechanic(ancientAxe,{s:'L'}),
        thebesGreatswordSmall:weaponSizeMechanic(thebesGreatsword,{s:'S'}),
        thebesGreatswordLarge:weaponSizeMechanic(thebesGreatsword,{s:'L'}),
        emperorBladeSmall:weaponSizeMechanic(emperorBlade,{s:'S'}),
        emperorBladeLarge:weaponSizeMechanic(emperorBlade,{s:'L'}),
        giltasSwordSmall:weaponSizeMechanic(giltasSword,{s:'S'}),
        giltasSwordLarge:weaponSizeMechanic(giltasSword,{s:'L'}),
        cursedEmperorSmall:weaponSizeMechanic(cursedEmperor,{s:'S'}),
        cursedEmperorLarge:weaponSizeMechanic(cursedEmperor,{s:'L'}),
        demonSwordSmallNamed:weaponSizeMechanic(demonSword,{s:'S'}),
        demonSwordLargeNamed:weaponSizeMechanic(demonSword,{s:'L'}),
        oldSwordNamedSmall:weaponSizeMechanic(oldSwordNamed,{s:'S'}),
        oldSwordNamedLarge:weaponSizeMechanic(oldSwordNamed,{s:'L'}),
        ancientDarkelfSmall:weaponSizeMechanic(ancientDarkelfSword,{s:'S'}),
        ancientDarkelfLarge:weaponSizeMechanic(ancientDarkelfSword,{s:'L'}),
        hiddenDemonSwordSmall:weaponSizeMechanic(hiddenDemonSword,{s:'S'}),
        hiddenDemonSwordLarge:weaponSizeMechanic(hiddenDemonSword,{s:'L'}),
        powerlessBalessSmall:weaponSizeMechanic(powerlessBaless,{s:'S'}),
        powerlessBalessLarge:weaponSizeMechanic(powerlessBaless,{s:'L'}),
        demonScytheSmall:weaponSizeMechanic(demonScythe,{s:'S'}),
        demonScytheLarge:weaponSizeMechanic(demonScythe,{s:'L'}),
        thebesWandSmall:weaponSizeMechanic(thebesWand,{s:'S'}),
        thebesWandLarge:weaponSizeMechanic(thebesWand,{s:'L'}),
        darkmageWandSmall:weaponSizeMechanic(darkmageWand,{s:'S'}),
        darkmageWandLarge:weaponSizeMechanic(darkmageWand,{s:'L'}),
        onmyojiFanSmall:weaponSizeMechanic(onmyojiFan,{s:'S'}),
        onmyojiFanLarge:weaponSizeMechanic(onmyojiFan,{s:'L'}),
        powerlessBaphometSmall:weaponSizeMechanic(powerlessBaphomet,{s:'S'}),
        powerlessBaphometLarge:weaponSizeMechanic(powerlessBaphomet,{s:'L'}),
        hiddenDemonWandSmall:weaponSizeMechanic(hiddenDemonWand,{s:'S'}),
        hiddenDemonWandLarge:weaponSizeMechanic(hiddenDemonWand,{s:'L'}),
        darkCrystalballSmall:weaponSizeMechanic(darkCrystalball,{s:'S'}),
        darkCrystalballLarge:weaponSizeMechanic(darkCrystalball,{s:'L'}),
        orcNailSmall:weaponSizeMechanic(orcNail,{s:'S'}),
        orcNailLarge:weaponSizeMechanic(orcNail,{s:'L'}),
        sharkTeethSmall:weaponSizeMechanic(sharkTeeth,{s:'S'}),
        sharkTeethLarge:weaponSizeMechanic(sharkTeeth,{s:'L'}),
        killerbeeStingSmall:weaponSizeMechanic(killerbeeSting,{s:'S'}),
        killerbeeStingLarge:weaponSizeMechanic(killerbeeSting,{s:'L'}),
        kairaFangSmall:weaponSizeMechanic(kairaFang,{s:'S'}),
        kairaFangLarge:weaponSizeMechanic(kairaFang,{s:'L'}),
        ogiGreataxeSmall:weaponSizeMechanic(ogiGreataxe,{s:'S'}),
        ogiGreataxeLarge:weaponSizeMechanic(ogiGreataxe,{s:'L'}),
        fighterAxeSmall:weaponSizeMechanic(fighterAxe,{s:'S'}),
        fighterAxeLarge:weaponSizeMechanic(fighterAxe,{s:'L'}),
        giantThrowstoneSmall:weaponSizeMechanic(giantThrowstone,{s:'S'}),
        giantThrowstoneLarge:weaponSizeMechanic(giantThrowstone,{s:'L'}),
        mudIdolSmall:weaponSizeMechanic(mudIdol,{s:'S'}),
        mudIdolLarge:weaponSizeMechanic(mudIdol,{s:'L'}),
        weatheredObeliskSmall:weaponSizeMechanic(weatheredObelisk,{s:'S'}),
        weatheredObeliskLarge:weaponSizeMechanic(weatheredObelisk,{s:'L'}),
        ratmanSkewerSmall:weaponSizeMechanic(ratmanSkewer,{s:'S'}),
        ratmanSkewerLarge:weaponSizeMechanic(ratmanSkewer,{s:'L'}),
        lizardmanCleaverSmall:weaponSizeMechanic(lizardmanCleaver,{s:'S'}),
        lizardmanCleaverLarge:weaponSizeMechanic(lizardmanCleaver,{s:'L'}),
        etoWhipSmall:weaponSizeMechanic(etoWhip,{s:'S'}),
        etoWhipLarge:weaponSizeMechanic(etoWhip,{s:'L'}),
        serpentFangSmall:weaponSizeMechanic(serpentFang,{s:'S'}),
        serpentFangLarge:weaponSizeMechanic(serpentFang,{s:'L'}),
        executorSkewerSmall:weaponSizeMechanic(executorSkewer,{s:'S'}),
        executorSkewerLarge:weaponSizeMechanic(executorSkewer,{s:'L'}),
        ushioniHornSmall:weaponSizeMechanic(ushioniHorn,{s:'S'}),
        ushioniHornLarge:weaponSizeMechanic(ushioniHorn,{s:'L'}),
        venomFangSmall:weaponSizeMechanic(venomFang,{s:'S'}),
        venomFangLarge:weaponSizeMechanic(venomFang,{s:'L'}),
        parrotBeakSmall:weaponSizeMechanic(parrotBeak,{s:'S'}),
        parrotBeakLarge:weaponSizeMechanic(parrotBeak,{s:'L'}),
        crocFangSmall:weaponSizeMechanic(crocFang,{s:'S'}),
        crocFangLarge:weaponSizeMechanic(crocFang,{s:'L'}),
        giantToothpickSmall:weaponSizeMechanic(giantToothpick,{s:'S'}),
        giantToothpickLarge:weaponSizeMechanic(giantToothpick,{s:'L'}),
        veteranGreatswordSmall:weaponSizeMechanic(veteranGreatsword,{s:'S'}),
        veteranGreatswordLarge:weaponSizeMechanic(veteranGreatsword,{s:'L'}),
        deadgeneralGreatswordSmall:weaponSizeMechanic(deadgeneralGreatsword,{s:'S'}),
        deadgeneralGreatswordLarge:weaponSizeMechanic(deadgeneralGreatsword,{s:'L'}),
        guardianGreatswordSmall:weaponSizeMechanic(guardianGreatsword,{s:'S'}),
        guardianGreatswordLarge:weaponSizeMechanic(guardianGreatsword,{s:'L'}),
        firekingBlastSmall:weaponSizeMechanic(firekingBlast,{s:'S'}),
        firekingBlastLarge:weaponSizeMechanic(firekingBlast,{s:'L'}),
        reaperScytheSmall:weaponSizeMechanic(reaperScythe,{s:'S'}),
        reaperScytheLarge:weaponSizeMechanic(reaperScythe,{s:'L'}),
        gremlinClubSmall:weaponSizeMechanic(gremlinClub,{s:'S'}),
        gremlinClubLarge:weaponSizeMechanic(gremlinClub,{s:'L'}),
        huskyBoneSmall:weaponSizeMechanic(huskyBone,{s:'S'}),
        huskyBoneLarge:weaponSizeMechanic(huskyBone,{s:'L'}),
        icefieldPickSmall:weaponSizeMechanic(icefieldPick,{s:'S'}),
        icefieldPickLarge:weaponSizeMechanic(icefieldPick,{s:'L'}),
        werewolfMaceSmall:weaponSizeMechanic(werewolfMace,{s:'S'}),
        werewolfMaceLarge:weaponSizeMechanic(werewolfMace,{s:'L'}),
        strongFemurSmall:weaponSizeMechanic(strongFemur,{s:'S'}),
        strongFemurLarge:weaponSizeMechanic(strongFemur,{s:'L'}),
        summonerWhipSmall:weaponSizeMechanic(summonerWhip,{s:'S'}),
        summonerWhipLarge:weaponSizeMechanic(summonerWhip,{s:'L'}),
        medusaStingerSmall:weaponSizeMechanic(medusaStinger,{s:'S'}),
        medusaStingerLarge:weaponSizeMechanic(medusaStinger,{s:'L'}),
        executorAxeSmall:weaponSizeMechanic(executorAxe,{s:'S'}),
        executorAxeLarge:weaponSizeMechanic(executorAxe,{s:'L'}),
        lavaFistsSmall:weaponSizeMechanic(lavaFists,{s:'S'}),
        lavaFistsLarge:weaponSizeMechanic(lavaFists,{s:'L'}),
        monkeyStaffSmall:weaponSizeMechanic(monkeyStaff,{s:'S'}),
        monkeyStaffLarge:weaponSizeMechanic(monkeyStaff,{s:'L'}),
        ashFistSmall:weaponSizeMechanic(ashFist,{s:'S'}),
        ashFistLarge:weaponSizeMechanic(ashFist,{s:'L'}),
        relicSwordPolicies:JSON.stringify(relicSwordCases.map(([id,def]) => {
            const small = weaponSizeMechanic(def,{s:'S'}), large = weaponSizeMechanic(def,{s:'L'});
            const power = cfg => cfg ? (cfg.splashPct || cfg.delayTicks || cfg.defense || 0) : 0;
            return [id, small && small.effect || '', small && small.prototypeMode || '', power(small), large && large.effect || '', large && large.prototypeMode || '', power(large)];
        })),
        relicWandPolicies:JSON.stringify(relicWandCases.map(([id,def]) => {
            const small = weaponSizeMechanic(def,{s:'S'}), large = weaponSizeMechanic(def,{s:'L'});
            const power = cfg => cfg ? (cfg.durationTicks || cfg.delayTicks || 0) : 0;
            return [id, small && small.effect || '', small && small.prototypeMode || '', power(small), large && large.effect || '', large && large.prototypeMode || '', power(large)];
        })),
        legacySuppressedSmall:weaponPrototypeSuppressesLegacyEffect(elmo,{s:'S'},'pierce'),
        legacySuppressedLarge:weaponPrototypeSuppressesLegacyEffect(elmo,{s:'L'},'pierce'),
        legacyAutoSuppressed:weaponPrototypeSuppressesLegacyEffect(autoLegacySpear,{s:'S'},'pierce'),
        counter:[
            weaponSizeMechanicCounter(owner,inst,'sweep',3),
            weaponSizeMechanicCounter(owner,inst,'sweep',3),
            weaponSizeMechanicCounter(owner,inst,'sweep',3),
            weaponSizeMechanicCounter(owner,inst,'sweep',3)
        ],
        breakApplied:applyWeaponSizeBreak(breakTarget,{defense:2,durationTicks:50},100),
        breakActive:weaponSizeDefenseBreak(breakTarget,149),
        breakExpired:weaponSizeDefenseBreak(breakTarget,150),
        staggerFirst:applyWeaponSizeStagger(staggerTarget,{delayTicks:5,cooldownTicks:30},100),
        staggerBlocked:applyWeaponSizeStagger(staggerTarget,{delayTicks:5,cooldownTicks:30},120),
        staggerCd:staggerTarget._atkCd,
        splashTwo:weaponSizeSplashPlan(100,{splashPct:50,maxTargets:2},2),
        splashOne:weaponSizeSplashPlan(100,{splashPct:50,maxTargets:2},1),
        splashCapped:weaponSizeSplashPlan(100,{splashPct:50,maxTargets:2},8),
        splashMinimum:weaponSizeSplashPlan(1,{splashPct:50,maxTargets:2},2),
        audit:auditWeaponSizeMechanics(DB.items),
        policyAudit:auditWeaponPrototypePolicies(DB.items),
        keepReject:auditWeaponPrototypePolicies({bad:{prototypePolicy:{family:'雙手矛',small:{mode:'keep'},large:{mode:'keep'}}}}),
        replaceReject:auditWeaponPrototypePolicies({bad:{prototypePolicy:{family:'雙手矛',small:{mode:'keep'},large:{mode:'replace',mechanic:{effect:'unknown'}}}}}),
        budgetReject:auditWeaponSizeMechanics({bad:{sizeMechanics:{small:{effect:'pierce',chance:50,splashPct:50},large:{effect:'break_stance',defense:8}}}}),
        text:weaponSizeMechanicDescription(weaponSizeMechanicEntries(spear)[0]),
        policyText:weaponSizeMechanicDescription(weaponSizeMechanicEntries(elmo)[0]),
        sacrificeText:weaponPrototypePolicyNotes(elmo)[0]
    };
})()`, context);

assert.deepEqual(Array.from(result.sizes), ['小型','中型','大型']);
assert.equal(result.swordSmall, 'sweep');
assert.equal(result.swordLarge, 'stagger');
assert.equal(result.swordMedium, null);
assert.equal(result.spearSmall, 'pierce');
assert.equal(result.spearLarge, 'break_stance');
assert.equal(result.elmoSmall.effect, 'pierce');
assert.equal(result.elmoSmall.chance, 35);
assert.equal(result.elmoSmall.prototypeMode, 'enhance');
assert.equal(result.elmoLarge, null);
assert.equal(result.demonLarge.effect, 'stagger');
assert.equal(result.demonLarge.prototypeMode, 'replace');
assert.equal(result.ancientLarge.effect, 'break_stance');
assert.equal(result.ancientLarge.defense, 3);
assert.equal(result.ancientLarge.prototypeMode, 'enhance');
assert.equal(result.dragonSmall, null);
assert.equal(result.dragonLarge.effect, 'stagger');
assert.equal(result.dragonLarge.delayTicks, 6);
assert.equal(result.dragonLarge.prototypeMode, 'enhance');
assert.equal(result.demonSwordSmall.effect, 'sweep');
assert.equal(result.demonSwordSmall.prototypeMode, 'keep');
assert.equal(result.demonSwordLarge.effect, 'break_stance');
assert.equal(result.demonSwordLarge.prototypeMode, 'replace');
assert.equal(result.oldSwordSmall.effect, 'sweep');
assert.equal(result.oldSwordSmall.splashPct, 54);
assert.equal(result.oldSwordSmall.prototypeMode, 'enhance');
assert.equal(result.oldSwordLarge, null);
assert.equal(result.battleSmall.effect, 'stagger');
assert.equal(result.battleSmall.delayTicks, 4);
assert.equal(result.battleLarge.effect, 'break_stance');
assert.equal(result.maplerSmall.effect, 'sweep');
assert.equal(result.maplerSmall.splashPct, 45);
assert.equal(result.maplerSmall.prototypeMode, 'replace');
assert.equal(result.maplerLarge.effect, 'break_stance');
assert.equal(result.maplerLarge.prototypeMode, 'keep');
assert.equal(result.ohmSmall, null);
assert.equal(result.ohmLarge.effect, 'break_stance');
assert.equal(result.ohmLarge.defense, 3);
assert.equal(result.ohmLarge.prototypeMode, 'enhance');
assert.equal(result.iceSmall.effect, 'stagger');
assert.equal(result.iceSmall.delayTicks, 5);
assert.equal(result.iceSmall.prototypeMode, 'enhance');
assert.equal(result.iceLarge, null);
assert.equal(result.longSwordSmall.effect, 'sweep');
assert.equal(result.longSwordSmall.every, 4);
assert.equal(result.longSwordLarge.effect, 'stagger');
assert.equal(result.longSwordLarge.delayTicks, 3);
assert.equal(result.kurtSmall, null);
assert.equal(result.kurtLarge.effect, 'stagger');
assert.equal(result.kurtLarge.delayTicks, 4);
assert.equal(result.kurtLarge.prototypeMode, 'enhance');
assert.equal(result.earthSwordSmall, null);
assert.equal(result.earthSwordLarge.effect, 'break_stance');
assert.equal(result.earthSwordLarge.prototypeMode, 'replace');
assert.equal(result.pagrioSmall.effect, 'sweep');
assert.equal(result.pagrioSmall.splashPct, 50);
assert.equal(result.pagrioSmall.prototypeMode, 'enhance');
assert.equal(result.pagrioLarge, null);
assert.equal(result.maceSmall.effect, 'stagger');
assert.equal(result.maceSmall.delayTicks, 3);
assert.equal(result.maceLarge.effect, 'break_stance');
assert.equal(result.maceLarge.defense, 1);
assert.equal(result.thorSmall.effect, 'stagger');
assert.equal(result.thorSmall.delayTicks, 4);
assert.equal(result.thorSmall.prototypeMode, 'enhance');
assert.equal(result.thorLarge, null);
assert.equal(result.osisSmall.effect, 'sweep');
assert.equal(result.osisSmall.prototypeMode, 'replace');
assert.equal(result.osisLarge.effect, 'break_stance');
assert.equal(result.osisLarge.prototypeMode, 'keep');
assert.equal(result.hellfireSmall, null);
assert.equal(result.hellfireLarge.effect, 'break_stance');
assert.equal(result.hellfireLarge.defense, 2);
assert.equal(result.hellfireLarge.prototypeMode, 'enhance');
assert.equal(result.daggerSmall.effect, 'pierce');
assert.equal(result.daggerSmall.chance, 15);
assert.equal(result.daggerSmall.splashPct, 30);
assert.equal(result.daggerLarge.effect, 'break_stance');
assert.equal(result.daggerLarge.defense, 1);
assert.equal(result.shadowSmall.effect, 'pierce');
assert.equal(result.shadowSmall.chance, 25);
assert.equal(result.shadowSmall.prototypeMode, 'enhance');
assert.equal(result.shadowLarge, null);
assert.equal(result.thornSmall, null);
assert.equal(result.thornLarge.effect, 'break_stance');
assert.equal(result.thornLarge.defense, 2);
assert.equal(result.thornLarge.prototypeMode, 'enhance');
assert.equal(result.bloodSmall, null);
assert.equal(result.bloodLarge.effect, 'break_stance');
assert.equal(result.bloodLarge.prototypeMode, 'keep');
assert.equal(result.oneSpearSmall.effect, 'pierce');
assert.equal(result.oneSpearSmall.chance, 20);
assert.equal(result.oneSpearSmall.splashPct, 35);
assert.equal(result.oneSpearLarge.effect, 'break_stance');
assert.equal(result.oneSpearLarge.defense, 1);
assert.equal(result.lizardSpearSmall.effect, 'pierce');
assert.equal(result.lizardSpearSmall.chance, 25);
assert.equal(result.lizardSpearSmall.prototypeMode, 'enhance');
assert.equal(result.lizardSpearLarge, null);
assert.equal(result.guardSpearSmall, null);
assert.equal(result.guardSpearLarge.effect, 'break_stance');
assert.equal(result.guardSpearLarge.defense, 2);
assert.equal(result.guardSpearLarge.prototypeMode, 'enhance');
assert.equal(result.frostSpearSmall.effect, 'pierce');
assert.equal(result.frostSpearSmall.prototypeMode, 'keep');
assert.equal(result.frostSpearLarge, null);
assert.equal(result.bowSmall.effect, 'stagger');
assert.equal(result.bowSmall.delayTicks, 2);
assert.equal(result.bowLarge.effect, 'break_stance');
assert.equal(result.bowLarge.defense, 1);
assert.equal(result.antennaBowSmall.effect, 'stagger');
assert.equal(result.antennaBowSmall.delayTicks, 3);
assert.equal(result.antennaBowSmall.prototypeMode, 'enhance');
assert.equal(result.antennaBowLarge, null);
assert.equal(result.sharpshooterBowSmall, null);
assert.equal(result.sharpshooterBowLarge.effect, 'break_stance');
assert.equal(result.sharpshooterBowLarge.defense, 2);
assert.equal(result.sharpshooterBowLarge.prototypeMode, 'enhance');
assert.equal(result.rottenBowSmall, null);
assert.equal(result.rottenBowLarge.effect, 'break_stance');
assert.equal(result.rottenBowLarge.defense, 2);
assert.equal(result.rottenBowLarge.prototypeMode, 'enhance');
assert.equal(result.crossbowSmall.effect, 'break_stance');
assert.equal(result.crossbowSmall.defense, 1);
assert.equal(result.crossbowLarge.effect, 'stagger');
assert.equal(result.crossbowLarge.delayTicks, 3);
assert.equal(result.abyssCrossbowSmall.effect, 'break_stance');
assert.equal(result.abyssCrossbowSmall.defense, 2);
assert.equal(result.abyssCrossbowSmall.prototypeMode, 'enhance');
assert.equal(result.abyssCrossbowLarge, null);
assert.equal(result.crimsonCrossbowSmall, null);
assert.equal(result.crimsonCrossbowLarge.effect, 'stagger');
assert.equal(result.crimsonCrossbowLarge.delayTicks, 4);
assert.equal(result.crimsonCrossbowLarge.prototypeMode, 'enhance');
assert.equal(result.sniperCrossbowSmall, null);
assert.equal(result.sniperCrossbowLarge.effect, 'stagger');
assert.equal(result.sniperCrossbowLarge.prototypeMode, 'keep');
assert.equal(result.wandSmall.effect, 'disrupt');
assert.equal(result.wandSmall.durationTicks, 10);
assert.equal(result.wandLarge.effect, 'stagger');
assert.equal(result.wandLarge.delayTicks, 2);
assert.equal(result.laiaWandSmall.effect, 'disrupt');
assert.equal(result.laiaWandSmall.durationTicks, 15);
assert.equal(result.laiaWandSmall.prototypeMode, 'enhance');
assert.equal(result.laiaWandLarge, null);
assert.equal(result.holyWandSmall, null);
assert.equal(result.holyWandLarge.effect, 'stagger');
assert.equal(result.holyWandLarge.delayTicks, 3);
assert.equal(result.holyWandLarge.prototypeMode, 'enhance');
assert.equal(result.disruptFirst, true);
assert.equal(result.disruptBlocked, false);
assert.equal(result.disruptSeal, 10);
assert.equal(result.disruptBoss, false);
assert.equal(result.dualSmall.effect, 'stagger');
assert.equal(result.dualSmall.delayTicks, 3);
assert.equal(result.dualLarge.effect, 'break_stance');
assert.equal(result.dualLarge.defense, 1);
assert.equal(result.redshadowDualSmall.effect, 'stagger');
assert.equal(result.redshadowDualSmall.delayTicks, 4);
assert.equal(result.redshadowDualSmall.prototypeMode, 'enhance');
assert.equal(result.redshadowDualLarge, null);
assert.equal(result.destroyDualSmall, null);
assert.equal(result.destroyDualLarge.effect, 'break_stance');
assert.equal(result.destroyDualLarge.defense, 2);
assert.equal(result.destroyDualLarge.prototypeMode, 'enhance');
assert.equal(result.wingDualSmall, null);
assert.equal(result.wingDualLarge.effect, 'break_stance');
assert.equal(result.wingDualLarge.prototypeMode, 'keep');
assert.equal(result.clawSmall.effect, 'break_stance');
assert.equal(result.clawSmall.defense, 1);
assert.equal(result.clawLarge.effect, 'stagger');
assert.equal(result.clawLarge.delayTicks, 4);
assert.equal(result.spiderClawSmall.effect, 'break_stance');
assert.equal(result.spiderClawSmall.defense, 2);
assert.equal(result.spiderClawSmall.prototypeMode, 'enhance');
assert.equal(result.spiderClawLarge, null);
assert.equal(result.beastClawSmall, null);
assert.equal(result.beastClawLarge.effect, 'stagger');
assert.equal(result.beastClawLarge.delayTicks, 5);
assert.equal(result.beastClawLarge.prototypeMode, 'enhance');
assert.equal(result.hiddenClawSmall, null);
assert.equal(result.hiddenClawLarge.effect, 'stagger');
assert.equal(result.hiddenClawLarge.prototypeMode, 'keep');
assert.equal(result.chainSmall.effect, 'stagger');
assert.equal(result.chainSmall.delayTicks, 3);
assert.equal(result.chainLarge.effect, 'break_stance');
assert.equal(result.chainLarge.defense, 1);
assert.equal(result.frostChainSmall.effect, 'stagger');
assert.equal(result.frostChainSmall.delayTicks, 4);
assert.equal(result.frostChainSmall.prototypeMode, 'enhance');
assert.equal(result.frostChainLarge, null);
assert.equal(result.bloodChainSmall, null);
assert.equal(result.bloodChainLarge.effect, 'break_stance');
assert.equal(result.bloodChainLarge.defense, 2);
assert.equal(result.bloodChainLarge.prototypeMode, 'enhance');
assert.equal(result.hiddenChainSmall, null);
assert.equal(result.hiddenChainLarge.effect, 'break_stance');
assert.equal(result.hiddenChainLarge.prototypeMode, 'keep');
assert.equal(result.qiguSmall.effect, 'stagger');
assert.equal(result.qiguSmall.delayTicks, 2);
assert.equal(result.qiguLarge.effect, 'focus');
assert.equal(result.qiguLarge.mp, 1);
assert.equal(result.frostQiguSmall.effect, 'stagger');
assert.equal(result.frostQiguSmall.delayTicks, 3);
assert.equal(result.frostQiguSmall.prototypeMode, 'enhance');
assert.equal(result.frostQiguLarge, null);
assert.equal(result.meditateQiguSmall, null);
assert.equal(result.meditateQiguLarge.effect, 'focus');
assert.equal(result.meditateQiguLarge.mp, 2);
assert.equal(result.meditateQiguLarge.prototypeMode, 'enhance');
assert.equal(result.hiddenQiguSmall.effect, 'stagger');
assert.equal(result.hiddenQiguSmall.prototypeMode, 'keep');
assert.equal(result.hiddenQiguLarge, null);
assert.equal(result.focusFirst, 1);
assert.equal(result.focusBlocked, 0);
assert.equal(result.focusSecond, 1);
assert.equal(result.focusMp, 5);
assert.equal(result.launcherSmall.effect, 'stagger');
assert.equal(result.launcherSmall.delayTicks, 2);
assert.equal(result.launcherLarge.effect, 'suppress');
assert.equal(result.launcherLarge.durationTicks, 20);
assert.equal(result.blowdartSmall.effect, 'stagger');
assert.equal(result.blowdartSmall.delayTicks, 3);
assert.equal(result.blowdartSmall.prototypeMode, 'enhance');
assert.equal(result.blowdartLarge, null);
assert.equal(result.slingSmall, null);
assert.equal(result.slingLarge.effect, 'suppress');
assert.equal(result.slingLarge.durationTicks, 30);
assert.equal(result.slingLarge.prototypeMode, 'enhance');
assert.equal(result.needleSmall.effect, 'stagger');
assert.equal(result.needleSmall.prototypeMode, 'keep');
assert.equal(result.needleLarge, null);
assert.equal(result.suppressFirst, true);
assert.equal(result.suppressBlocked, false);
assert.equal(result.suppressDuration, 20);
assert.equal(result.ordinarySwordSmall.effect, 'sweep');
assert.equal(result.ordinarySwordSmall.prototypeFamily, '單手劍');
assert.equal(result.ordinarySwordSmall.prototypeInherited, true);
assert.equal(result.ordinarySwordLarge.effect, 'stagger');
assert.equal(result.ordinaryMaceSmall.effect, 'stagger');
assert.equal(result.ordinaryMaceSmall.prototypeFamily, '單手鈍器');
assert.equal(result.ordinaryBowLarge.effect, 'break_stance');
assert.equal(result.ordinaryBowLarge.prototypeFamily, '弓');
assert.equal(result.namedLowWeightSmall, null);
assert.equal(result.unassignedRelicSmall, null);
assert.deepEqual(Array.from(result.autoAudit), []);
assert.equal(result.autoEligibleCount, 112);
assert.equal(result.manualRemainingCount, 0);
assert.equal(result.abyssClawSmall.effect, 'break_stance');
assert.equal(result.abyssClawSmall.defense, 2);
assert.equal(result.abyssClawSmall.prototypeMode, 'enhance');
assert.equal(result.abyssClawLarge, null);
assert.equal(result.abyssDualSmall.effect, 'stagger');
assert.equal(result.abyssDualSmall.delayTicks, 4);
assert.equal(result.abyssDualSmall.prototypeMode, 'enhance');
assert.equal(result.abyssDualLarge, null);
assert.equal(result.manaDaggerSmall, null);
assert.equal(result.manaDaggerLarge.effect, 'break_stance');
assert.equal(result.manaDaggerLarge.prototypeMode, 'keep');
assert.equal(result.ironAxeSmall, null);
assert.equal(result.ironAxeLarge.effect, 'break_stance');
assert.equal(result.ironAxeLarge.defense, 1);
assert.equal(result.ironAxeLarge.prototypeMode, 'keep');
assert.equal(result.giantAxeSmall, null);
assert.equal(result.giantAxeLarge.effect, 'break_stance');
assert.equal(result.giantAxeLarge.defense, 2);
assert.equal(result.giantAxeLarge.prototypeMode, 'enhance');
assert.equal(result.ancientAxeSmall.effect, 'stagger');
assert.equal(result.ancientAxeSmall.delayTicks, 4);
assert.equal(result.ancientAxeSmall.prototypeMode, 'enhance');
assert.equal(result.ancientAxeLarge, null);
assert.equal(result.thebesGreatswordSmall, null);
assert.equal(result.thebesGreatswordLarge.effect, 'stagger');
assert.equal(result.thebesGreatswordLarge.prototypeMode, 'keep');
assert.equal(result.emperorBladeSmall, null);
assert.equal(result.emperorBladeLarge.effect, 'stagger');
assert.equal(result.emperorBladeLarge.delayTicks, 6);
assert.equal(result.emperorBladeLarge.prototypeMode, 'enhance');
assert.equal(result.giltasSwordSmall, null);
assert.equal(result.giltasSwordLarge.effect, 'break_stance');
assert.equal(result.giltasSwordLarge.defense, 2);
assert.equal(result.giltasSwordLarge.prototypeMode, 'replace');
assert.equal(result.cursedEmperorSmall, null);
assert.equal(result.cursedEmperorLarge.effect, 'stagger');
assert.equal(result.cursedEmperorLarge.prototypeMode, 'keep');
assert.equal(result.demonSwordSmallNamed.effect, 'sweep');
assert.equal(result.demonSwordSmallNamed.prototypeMode, 'keep');
assert.equal(result.demonSwordLargeNamed, null);
assert.equal(result.oldSwordNamedSmall.effect, 'sweep');
assert.equal(result.oldSwordNamedSmall.splashPct, 50);
assert.equal(result.oldSwordNamedSmall.prototypeMode, 'enhance');
assert.equal(result.oldSwordNamedLarge, null);
assert.equal(result.ancientDarkelfSmall, null);
assert.equal(result.ancientDarkelfLarge.effect, 'stagger');
assert.equal(result.ancientDarkelfLarge.prototypeMode, 'keep');
assert.equal(result.hiddenDemonSwordSmall, null);
assert.equal(result.hiddenDemonSwordLarge.effect, 'stagger');
assert.equal(result.hiddenDemonSwordLarge.delayTicks, 4);
assert.equal(result.hiddenDemonSwordLarge.prototypeMode, 'enhance');
assert.equal(result.powerlessBalessSmall, null);
assert.equal(result.powerlessBalessLarge, null);
assert.equal(result.demonScytheSmall.effect, 'disrupt');
assert.equal(result.demonScytheSmall.prototypeMode, 'keep');
assert.equal(result.demonScytheLarge, null);
assert.equal(result.thebesWandSmall, null);
assert.equal(result.thebesWandLarge.effect, 'stagger');
assert.equal(result.thebesWandLarge.prototypeMode, 'keep');
assert.equal(result.darkmageWandSmall.effect, 'disrupt');
assert.equal(result.darkmageWandSmall.prototypeMode, 'keep');
assert.equal(result.darkmageWandLarge, null);
assert.equal(result.onmyojiFanSmall.effect, 'disrupt');
assert.equal(result.onmyojiFanSmall.durationTicks, 15);
assert.equal(result.onmyojiFanSmall.prototypeMode, 'enhance');
assert.equal(result.onmyojiFanLarge, null);
assert.equal(result.powerlessBaphometSmall, null);
assert.equal(result.powerlessBaphometLarge, null);
assert.equal(result.hiddenDemonWandSmall, null);
assert.equal(result.hiddenDemonWandLarge.effect, 'stagger');
assert.equal(result.hiddenDemonWandLarge.delayTicks, 3);
assert.equal(result.hiddenDemonWandLarge.prototypeMode, 'enhance');
assert.equal(result.darkCrystalballSmall.effect, 'disrupt');
assert.equal(result.darkCrystalballSmall.prototypeMode, 'keep');
assert.equal(result.darkCrystalballLarge, null);
assert.equal(result.orcNailSmall, null);
assert.equal(result.orcNailLarge.effect, 'break_stance');
assert.equal(result.orcNailLarge.prototypeMode, 'keep');
assert.equal(result.sharkTeethSmall.effect, 'pierce');
assert.equal(result.sharkTeethSmall.chance, 20);
assert.equal(result.sharkTeethSmall.prototypeMode, 'enhance');
assert.equal(result.sharkTeethLarge, null);
assert.equal(result.killerbeeStingSmall.effect, 'pierce');
assert.equal(result.killerbeeStingSmall.prototypeMode, 'keep');
assert.equal(result.killerbeeStingLarge, null);
assert.equal(result.kairaFangSmall, null);
assert.equal(result.kairaFangLarge.effect, 'break_stance');
assert.equal(result.kairaFangLarge.prototypeMode, 'keep');
assert.equal(result.ogiGreataxeSmall, null);
assert.equal(result.ogiGreataxeLarge.effect, 'break_stance');
assert.equal(result.ogiGreataxeLarge.prototypeMode, 'keep');
assert.equal(result.fighterAxeSmall, null);
assert.equal(result.fighterAxeLarge.effect, 'break_stance');
assert.equal(result.fighterAxeLarge.prototypeMode, 'keep');
assert.equal(result.giantThrowstoneSmall, null);
assert.equal(result.giantThrowstoneLarge.effect, 'break_stance');
assert.equal(result.giantThrowstoneLarge.defense, 3);
assert.equal(result.giantThrowstoneLarge.prototypeMode, 'enhance');
assert.equal(result.mudIdolSmall.effect, 'stagger');
assert.equal(result.mudIdolSmall.delayTicks, 5);
assert.equal(result.mudIdolSmall.prototypeMode, 'enhance');
assert.equal(result.mudIdolLarge, null);
assert.equal(result.weatheredObeliskSmall, null);
assert.equal(result.weatheredObeliskLarge.effect, 'break_stance');
assert.equal(result.weatheredObeliskLarge.prototypeMode, 'keep');
assert.equal(result.ratmanSkewerSmall.effect, 'pierce');
assert.equal(result.ratmanSkewerSmall.chance, 35);
assert.equal(result.ratmanSkewerSmall.prototypeMode, 'enhance');
assert.equal(result.ratmanSkewerLarge, null);
assert.equal(result.lizardmanCleaverSmall, null);
assert.equal(result.lizardmanCleaverLarge.effect, 'break_stance');
assert.equal(result.lizardmanCleaverLarge.prototypeMode, 'keep');
assert.equal(result.etoWhipSmall.effect, 'pierce');
assert.equal(result.etoWhipSmall.prototypeMode, 'keep');
assert.equal(result.etoWhipLarge, null);
assert.equal(result.serpentFangSmall.effect, 'pierce');
assert.equal(result.serpentFangSmall.prototypeMode, 'keep');
assert.equal(result.serpentFangLarge, null);
assert.equal(result.executorSkewerSmall, null);
assert.equal(result.executorSkewerLarge.effect, 'break_stance');
assert.equal(result.executorSkewerLarge.defense, 3);
assert.equal(result.executorSkewerLarge.prototypeMode, 'enhance');
assert.equal(result.ushioniHornSmall, null);
assert.equal(result.ushioniHornLarge.effect, 'break_stance');
assert.equal(result.ushioniHornLarge.prototypeMode, 'keep');
assert.equal(result.venomFangSmall, null);
assert.equal(result.venomFangLarge.effect, 'stagger');
assert.equal(result.venomFangLarge.prototypeMode, 'keep');
assert.equal(result.parrotBeakSmall.effect, 'sweep');
assert.equal(result.parrotBeakSmall.splashPct, 54);
assert.equal(result.parrotBeakSmall.prototypeMode, 'enhance');
assert.equal(result.parrotBeakLarge, null);
assert.equal(result.crocFangSmall, null);
assert.equal(result.crocFangLarge.effect, 'stagger');
assert.equal(result.crocFangLarge.delayTicks, 6);
assert.equal(result.crocFangLarge.prototypeMode, 'enhance');
assert.equal(result.giantToothpickSmall.effect, 'sweep');
assert.equal(result.giantToothpickSmall.prototypeMode, 'keep');
assert.equal(result.giantToothpickLarge, null);
assert.equal(result.veteranGreatswordSmall, null);
assert.equal(result.veteranGreatswordLarge.effect, 'stagger');
assert.equal(result.veteranGreatswordLarge.prototypeMode, 'keep');
assert.equal(result.deadgeneralGreatswordSmall.effect, 'sweep');
assert.equal(result.deadgeneralGreatswordSmall.splashPct, 54);
assert.equal(result.deadgeneralGreatswordSmall.prototypeMode, 'enhance');
assert.equal(result.deadgeneralGreatswordLarge, null);
assert.equal(result.guardianGreatswordSmall, null);
assert.equal(result.guardianGreatswordLarge.effect, 'stagger');
assert.equal(result.guardianGreatswordLarge.prototypeMode, 'keep');
assert.equal(result.firekingBlastSmall.effect, 'sweep');
assert.equal(result.firekingBlastSmall.prototypeMode, 'keep');
assert.equal(result.firekingBlastLarge, null);
assert.equal(result.reaperScytheSmall, null);
assert.equal(result.reaperScytheLarge.effect, 'stagger');
assert.equal(result.reaperScytheLarge.delayTicks, 6);
assert.equal(result.reaperScytheLarge.prototypeMode, 'enhance');
assert.equal(result.gremlinClubSmall, null);
assert.equal(result.gremlinClubLarge.effect, 'break_stance');
assert.equal(result.gremlinClubLarge.prototypeMode, 'keep');
assert.equal(result.huskyBoneSmall.effect, 'stagger');
assert.equal(result.huskyBoneSmall.prototypeMode, 'keep');
assert.equal(result.huskyBoneLarge, null);
assert.equal(result.icefieldPickSmall, null);
assert.equal(result.icefieldPickLarge.effect, 'break_stance');
assert.equal(result.icefieldPickLarge.prototypeMode, 'keep');
assert.equal(result.werewolfMaceSmall, null);
assert.equal(result.werewolfMaceLarge.effect, 'break_stance');
assert.equal(result.werewolfMaceLarge.defense, 2);
assert.equal(result.werewolfMaceLarge.prototypeMode, 'enhance');
assert.equal(result.strongFemurSmall.effect, 'stagger');
assert.equal(result.strongFemurSmall.prototypeMode, 'keep');
assert.equal(result.strongFemurLarge, null);
assert.equal(result.summonerWhipSmall, null);
assert.equal(result.summonerWhipLarge.effect, 'break_stance');
assert.equal(result.summonerWhipLarge.prototypeMode, 'keep');
assert.equal(result.medusaStingerSmall, null);
assert.equal(result.medusaStingerLarge.effect, 'break_stance');
assert.equal(result.medusaStingerLarge.defense, 2);
assert.equal(result.medusaStingerLarge.prototypeMode, 'enhance');
assert.equal(result.executorAxeSmall, null);
assert.equal(result.executorAxeLarge.effect, 'break_stance');
assert.equal(result.executorAxeLarge.prototypeMode, 'keep');
assert.equal(result.lavaFistsSmall.effect, 'stagger');
assert.equal(result.lavaFistsSmall.prototypeMode, 'keep');
assert.equal(result.lavaFistsLarge, null);
assert.equal(result.monkeyStaffSmall.effect, 'stagger');
assert.equal(result.monkeyStaffSmall.prototypeMode, 'keep');
assert.equal(result.monkeyStaffLarge, null);
assert.equal(result.ashFistSmall.effect, 'stagger');
assert.equal(result.ashFistSmall.delayTicks, 4);
assert.equal(result.ashFistSmall.prototypeMode, 'enhance');
assert.equal(result.ashFistLarge, null);
assert.deepEqual(JSON.parse(result.relicSwordPolicies), [
    ['goblin','','',0,'stagger','keep',3],
    ['gladiator','sweep','keep',40,'','',0],
    ['orc-cleaver','sweep','keep',40,'','',0],
    ['hobgoblin','','',0,'stagger','enhance',4],
    ['butcher','','',0,'stagger','keep',3],
    ['pirate','sweep','enhance',50,'','',0],
    ['harvey','','',0,'stagger','keep',3],
    ['darkelf','','',0,'stagger','enhance',4],
    ['wisp','','',0,'stagger','keep',3],
    ['ashwarrior','','',0,'stagger','keep',3],
    ['spider','sweep','enhance',50,'','',0],
    ['ant','sweep','keep',40,'','',0],
    ['uncursed-emperor','','',0,'stagger','keep',3],
    ['kama','sweep','keep',40,'','',0],
    ['blackblade','sweep','keep',40,'','',0],
    ['mageblade','','',0,'stagger','keep',3],
    ['flame-dk','','',0,'','',0]
]);
assert.deepEqual(JSON.parse(result.relicWandPolicies), [
    ['zombie-shin','','',0,'stagger','keep',2],
    ['amp-staff','','',0,'stagger','keep',2],
    ['apprentice','disrupt','keep',10,'','',0],
    ['frostdeath','disrupt','keep',10,'','',0],
    ['beholder','disrupt','keep',10,'','',0],
    ['evil-lizard','','',0,'stagger','keep',2],
    ['lightbeam','disrupt','keep',10,'','',0],
    ['eto','','',0,'','',0],
    ['succubus','','',0,'stagger','keep',2],
    ['warlock','disrupt','keep',10,'','',0],
    ['windking','disrupt','enhance',15,'','',0],
    ['rockmage','','',0,'','',0],
    ['ocean','','',0,'stagger','enhance',3],
    ['kyuubi','','',0,'','',0],
    ['water','disrupt','keep',10,'','',0],
    ['steelmonk','','',0,'stagger','enhance',3]
]);
assert.equal(result.legacySuppressedSmall, true);
assert.equal(result.legacySuppressedLarge, true);
assert.equal(result.legacyAutoSuppressed, true);
assert.deepEqual(Array.from(result.counter), [false,false,true,false]);
assert.equal(result.breakApplied, 2);
assert.equal(result.breakActive, 2);
assert.equal(result.breakExpired, 0);
assert.equal(result.staggerFirst, true);
assert.equal(result.staggerBlocked, false);
assert.equal(result.staggerCd, 15);
assert.deepEqual({...result.splashTwo}, {count:2,total:50,each:25});
assert.deepEqual({...result.splashOne}, {count:1,total:50,each:50});
assert.deepEqual({...result.splashCapped}, {count:2,total:50,each:25});
assert.deepEqual({...result.splashMinimum}, {count:1,total:1,each:1});
assert.deepEqual(Array.from(result.audit), []);
assert.deepEqual(Array.from(result.policyAudit), []);
assert.equal(result.keepReject.length, 1);
assert.match(result.keepReject[0], /最多只能保留一項/);
assert.equal(result.replaceReject.length, 1);
assert.match(result.replaceReject[0], /替換缺少有效/);
assert.equal(result.budgetReject.length, 2);
assert.match(result.text, /對小型.*貫穿.*25%.*40%/);
assert.match(result.policyText, /原型強化.*35%.*40%/);
assert.match(result.sacrificeText, /對大型.*原型犧牲.*破勢/);
const pandoraSource = fs.readFileSync(path.join(root, 'js/14-craft-pandora.js'), 'utf8');
assert.match(pandoraSource, /weaponPrototypeSuppressesLegacyEffect\(d, '中型', 'pierce'\)/);
assert.match(pandoraSource, /weaponSizeMechanicEntries\(d\).*weaponSizeMechanicDescription\(entry\)/);
assert.match(pandoraSource, /weaponPrototypePolicyNotes\(d\)/);
console.log('weapon-size-mechanics: ok');
