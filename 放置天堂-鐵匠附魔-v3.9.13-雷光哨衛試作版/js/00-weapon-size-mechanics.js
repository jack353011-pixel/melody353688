// ===== 武器 × 怪物體型機制（v3.9.62 普通武器舊效果接管版） =====
// 體型與階級分離：S=小型、L=大型，其餘=中型；首領不會被自動視為大型。
// 每個體型只能選一個行為效果，避免同一擊疊加多個純傷害倍率。
const WEAPON_SIZE_EFFECTS = Object.freeze({
    pierce: Object.freeze({ n: '貫穿', tag: '貫穿' }),
    sweep: Object.freeze({ n: '橫掃', tag: '橫掃' }),
    break_stance: Object.freeze({ n: '破勢', tag: '破勢' }),
    stagger: Object.freeze({ n: '震盪', tag: '震盪' }),
    disrupt: Object.freeze({ n: '施法干擾', tag: '施法干擾' }),
    focus: Object.freeze({ n: '回靈', tag: '回靈' }),
    suppress: Object.freeze({ n: '壓制', tag: '壓制' })
});

// 特殊武器不直接複製整套家族能力，而是逐項宣告保留／強化／替換／犧牲。
// 目前先收斂雙手矛：對小型擅長貫穿、對大型擅長破勢。
const WEAPON_PROTOTYPE_FAMILIES = Object.freeze({
    '雙手矛': Object.freeze({
        small: Object.freeze({ effect: 'pierce', chance: 25, splashPct: 40, maxTargets: 1 }),
        large: Object.freeze({ effect: 'break_stance', defense: 2, durationTicks: 50 })
    }),
    '雙手劍': Object.freeze({
        small: Object.freeze({ effect: 'sweep', every: 3, splashPct: 50, maxTargets: 2 }),
        large: Object.freeze({ effect: 'stagger', delayTicks: 5, cooldownTicks: 30 })
    }),
    '雙手鈍器': Object.freeze({
        small: Object.freeze({ effect: 'stagger', delayTicks: 4, cooldownTicks: 30 }),
        large: Object.freeze({ effect: 'break_stance', defense: 2, durationTicks: 50 })
    }),
    '單手劍': Object.freeze({
        small: Object.freeze({ effect: 'sweep', every: 4, splashPct: 40, maxTargets: 1 }),
        large: Object.freeze({ effect: 'stagger', delayTicks: 3, cooldownTicks: 30 })
    }),
    '單手鈍器': Object.freeze({
        small: Object.freeze({ effect: 'stagger', delayTicks: 3, cooldownTicks: 30 }),
        large: Object.freeze({ effect: 'break_stance', defense: 1, durationTicks: 40 })
    }),
    '匕首': Object.freeze({
        small: Object.freeze({ effect: 'pierce', chance: 15, splashPct: 30, maxTargets: 1 }),
        large: Object.freeze({ effect: 'break_stance', defense: 1, durationTicks: 30 })
    }),
    '單手矛': Object.freeze({
        small: Object.freeze({ effect: 'pierce', chance: 20, splashPct: 35, maxTargets: 1 }),
        large: Object.freeze({ effect: 'break_stance', defense: 1, durationTicks: 40 })
    }),
    '弓': Object.freeze({
        small: Object.freeze({ effect: 'stagger', delayTicks: 2, cooldownTicks: 30 }),
        large: Object.freeze({ effect: 'break_stance', defense: 1, durationTicks: 30 })
    }),
    '十字弓': Object.freeze({
        small: Object.freeze({ effect: 'break_stance', defense: 1, durationTicks: 30 }),
        large: Object.freeze({ effect: 'stagger', delayTicks: 3, cooldownTicks: 30 })
    }),
    '魔杖': Object.freeze({
        small: Object.freeze({ effect: 'disrupt', durationTicks: 10, cooldownTicks: 40 }),
        large: Object.freeze({ effect: 'stagger', delayTicks: 2, cooldownTicks: 40 })
    }),
    '雙刀': Object.freeze({
        small: Object.freeze({ effect: 'stagger', delayTicks: 3, cooldownTicks: 40 }),
        large: Object.freeze({ effect: 'break_stance', defense: 1, durationTicks: 40 })
    }),
    '鋼爪': Object.freeze({
        small: Object.freeze({ effect: 'break_stance', defense: 1, durationTicks: 30 }),
        large: Object.freeze({ effect: 'stagger', delayTicks: 4, cooldownTicks: 40 })
    }),
    '鎖鏈劍': Object.freeze({
        small: Object.freeze({ effect: 'stagger', delayTicks: 3, cooldownTicks: 40 }),
        large: Object.freeze({ effect: 'break_stance', defense: 1, durationTicks: 40 })
    }),
    '奇古獸': Object.freeze({
        small: Object.freeze({ effect: 'stagger', delayTicks: 2, cooldownTicks: 50 }),
        large: Object.freeze({ effect: 'focus', mp: 1, cooldownTicks: 40 })
    }),
    '投射器': Object.freeze({
        small: Object.freeze({ effect: 'stagger', delayTicks: 2, cooldownTicks: 40 }),
        large: Object.freeze({ effect: 'suppress', durationTicks: 20, cooldownTicks: 50 })
    })
});

const WEAPON_PROTOTYPE_MODES = Object.freeze({
    keep: '保留', enhance: '強化', replace: '替換', sacrifice: '犧牲'
});

function combatTargetSizeTag(target) {
    if (target && target.s === 'L') return '大型';
    if (target && target.s === 'S') return '小型';
    return '中型';
}

function weaponSizeKey(targetOrSize) {
    let size = typeof targetOrSize === 'string' ? targetOrSize : combatTargetSizeTag(targetOrSize);
    return { size, key: size === '小型' ? 'small' : (size === '大型' ? 'large' : 'medium') };
}

function weaponPrototypeFamily(def) {
    if (!def || !def.prototypePolicy) return null;
    return WEAPON_PROTOTYPE_FAMILIES[def.prototypePolicy.family] || null;
}

let _weaponPrototypeIdCache = (typeof WeakMap === 'function') ? new WeakMap() : null;
function weaponPrototypeDefinitionId(def) {
    if (!def || typeof DB !== 'object' || !DB.items) return '';
    if (_weaponPrototypeIdCache && _weaponPrototypeIdCache.has(def)) return _weaponPrototypeIdCache.get(def);
    let id = Object.keys(DB.items).find(key => DB.items[key] === def) || '';
    if (_weaponPrototypeIdCache && id) _weaponPrototypeIdCache.set(def, id);
    return id;
}

// 普通武器才自動讀取既有武器家族 Tag；遺物、傳說與低權重具名武器必須明確選擇原型政策。
function weaponMayAutoInheritPrototype(def) {
    return !!(def && def.type === 'wpn' && !def.isArrow && !def.relic && !def.legend &&
        !def.sizeMechanics && !def.prototypePolicy && Number(def.gachaWeight) >= 10);
}

function weaponAutomaticPrototypeFamilyName(def) {
    if (!weaponMayAutoInheritPrototype(def) || typeof atkSpdFamily !== 'function') return '';
    let id = weaponPrototypeDefinitionId(def), family = id ? atkSpdFamily(id) : '';
    return family && WEAPON_PROTOTYPE_FAMILIES[family] ? family : '';
}

function weaponAutomaticPrototypeMechanic(def, targetOrSize) {
    let familyName = weaponAutomaticPrototypeFamilyName(def), family = WEAPON_PROTOTYPE_FAMILIES[familyName];
    if (!family) return null;
    let pos = weaponSizeKey(targetOrSize), base = family[pos.key];
    if (!base) return null;
    let cfg = Object.assign({}, base);
    cfg.size = pos.size;
    cfg.prototypeFamily = familyName;
    cfg.prototypeInherited = true;
    return cfg;
}

function weaponPrototypeMechanic(def, targetOrSize) {
    let family = weaponPrototypeFamily(def);
    if (!family) return null;
    let pos = weaponSizeKey(targetOrSize), base = family[pos.key], op = def.prototypePolicy[pos.key];
    if (!base || !op || op.mode === 'sacrifice') return null;
    let cfg = null;
    if (op.mode === 'keep') cfg = Object.assign({}, base);
    else if (op.mode === 'enhance') cfg = Object.assign({}, base, op.changes || {});
    else if (op.mode === 'replace') cfg = Object.assign({}, op.mechanic || {});
    if (!cfg || !WEAPON_SIZE_EFFECTS[cfg.effect]) return null;
    cfg.size = pos.size;
    cfg.prototypeMode = op.mode;
    cfg.prototypeFamily = def.prototypePolicy.family;
    return cfg;
}

function weaponSizeMechanic(def, targetOrSize) {
    if (!def) return null;
    if (def.prototypePolicy) return weaponPrototypeMechanic(def, targetOrSize);
    if (!def.sizeMechanics) return weaponAutomaticPrototypeMechanic(def, targetOrSize);
    let pos = weaponSizeKey(targetOrSize);
    let raw = def.sizeMechanics[pos.key];
    if (!raw) return null;
    let cfg = typeof raw === 'string' ? { effect: raw } : Object.assign({}, raw);
    if (!WEAPON_SIZE_EFFECTS[cfg.effect]) return null;
    cfg.size = pos.size;
    return cfg;
}

function weaponSizeMechanicEntries(def) {
    if (!def || (!def.sizeMechanics && !def.prototypePolicy && !weaponAutomaticPrototypeFamilyName(def))) return [];
    return ['small', 'medium', 'large'].map(key => {
        let size = key === 'small' ? '小型' : (key === 'large' ? '大型' : '中型');
        let cfg = weaponSizeMechanic(def, size);
        return cfg ? { key, size, cfg, meta: WEAPON_SIZE_EFFECTS[cfg.effect] } : null;
    }).filter(Boolean);
}

function weaponSizeMechanicDescription(entry) {
    if (!entry || !entry.cfg || !entry.meta) return '';
    let c = entry.cfg, text = '';
    if (c.effect === 'pierce') text = `命中後有 ${c.chance == null ? 25 : Math.min(100, Math.max(0, Number(c.chance) || 0))}% 機率貫穿另一名敵人，波及傷害 ${c.splashPct == null ? 40 : Math.min(100, Math.max(1, Number(c.splashPct) || 1))}%`;
    else if (c.effect === 'sweep') text = `每第 ${Math.max(2, Number(c.every) || 3)} 次命中橫掃附近敵人，總波及傷害 ${Math.max(1, Number(c.splashPct) || 50)}%，由最多 ${Math.max(1, Number(c.maxTargets) || 2)} 名敵人平分`;
    else if (c.effect === 'break_stance') text = `命中後削減 ${Math.max(1, Number(c.defense) || 2)} 點物理防禦，持續 ${Math.max(1, Number(c.durationTicks) || 50) / 10} 秒`;
    else if (c.effect === 'stagger') text = `命中後延後敵人 ${Math.max(1, Number(c.delayTicks) || 5) / 10} 秒行動（內置冷卻 ${Math.max(1, Number(c.cooldownTicks) || 30) / 10} 秒）`;
    else if (c.effect === 'disrupt') text = `命中後干擾非頭目敵人施法 ${Math.max(1, Number(c.durationTicks) || 10) / 10} 秒（內置冷卻 ${Math.max(1, Number(c.cooldownTicks) || 40) / 10} 秒）`;
    else if (c.effect === 'focus') text = `命中後恢復 ${Math.max(1, Number(c.mp) || 1)} 點 MP（內置冷卻 ${Math.max(1, Number(c.cooldownTicks) || 40) / 10} 秒）`;
    else if (c.effect === 'suppress') text = `命中後使敵人一般攻擊傷害降低 2 點，持續 ${Math.max(1, Number(c.durationTicks) || 20) / 10} 秒（內置冷卻 ${Math.max(1, Number(c.cooldownTicks) || 50) / 10} 秒）`;
    let policy = c.prototypeMode && WEAPON_PROTOTYPE_MODES[c.prototypeMode] ? `〔原型${WEAPON_PROTOTYPE_MODES[c.prototypeMode]}〕` : '';
    return `【對${entry.size}】${entry.meta.noun || entry.meta.n}${policy}：${text}`;
}

function weaponPrototypePolicyNotes(def) {
    let family = weaponPrototypeFamily(def);
    if (!family) return [];
    return Object.keys(family).map(key => {
        let op = def.prototypePolicy[key], base = family[key];
        if (!op || op.mode !== 'sacrifice' || !WEAPON_SIZE_EFFECTS[base.effect]) return null;
        let size = key === 'small' ? '小型' : (key === 'large' ? '大型' : '中型');
        return `【對${size}】原型犧牲：不再獲得${WEAPON_SIZE_EFFECTS[base.effect].n}`;
    }).filter(Boolean);
}

// 明確政策與普通武器自動繼承都由體型解析接管家族效果，舊 eff/alsoPierce 不得再跨體型疊加。
function weaponPrototypeSuppressesLegacyEffect(def, targetOrSize, effect) {
    let family = weaponPrototypeFamily(def);
    if (!family) {
        let automaticFamily = weaponAutomaticPrototypeFamilyName(def);
        family = automaticFamily ? WEAPON_PROTOTYPE_FAMILIES[automaticFamily] : null;
    }
    if (!family || !effect) return false;
    return Object.values(family).some(cfg => cfg && cfg.effect === effect);
}

function weaponSizeMechanicCounter(owner, weaponInst, effect, every) {
    if (!owner || !effect) return false;
    let need = Math.max(2, Math.floor(Number(every) || 3));
    let weaponKey = weaponInst && (weaponInst.uid || weaponInst.id) || 'unarmed';
    let key = `${weaponKey}:${effect}`;
    if (!owner._weaponSizeCounts || typeof owner._weaponSizeCounts !== 'object') owner._weaponSizeCounts = {};
    let next = (Math.max(0, Math.floor(Number(owner._weaponSizeCounts[key]) || 0)) % need) + 1;
    if (next >= need) { owner._weaponSizeCounts[key] = 0; return true; }
    owner._weaponSizeCounts[key] = next;
    return false;
}

// 橫掃採固定總傷害預算：敵人增加只會分攤，不會把每名波及倍率重複相加。
function weaponSizeSplashPlan(mainDamage, cfg, availableTargets) {
    let maxTargets = Math.max(1, Math.floor(Number(cfg && cfg.maxTargets) || 2));
    let pct = cfg && cfg.splashPct != null ? Math.min(100, Math.max(1, Number(cfg.splashPct) || 1)) : 50;
    let total = Math.max(1, Math.floor(Math.max(1, Number(mainDamage) || 1) * pct / 100));
    let count = Math.min(maxTargets, total, Math.max(0, Math.floor(Number(availableTargets) || 0)));
    return { count, total, each: count > 0 ? Math.floor(total / count) : 0 };
}

function weaponSizeDefenseBreak(target, nowTicks) {
    if (!target) return 0;
    let now = Number.isFinite(nowTicks) ? nowTicks : ((typeof state === 'object' && state) ? Number(state.ticks) || 0 : 0);
    return now < (Number(target._weaponBreakUntil) || 0) ? Math.max(0, Number(target._weaponBreakDefense) || 0) : 0;
}

function applyWeaponSizeBreak(target, cfg, nowTicks) {
    if (!target || !cfg) return 0;
    let now = Number.isFinite(nowTicks) ? nowTicks : ((typeof state === 'object' && state) ? Number(state.ticks) || 0 : 0);
    let defense = Math.max(1, Math.floor(Number(cfg.defense) || 2));
    target._weaponBreakDefense = Math.max(weaponSizeDefenseBreak(target, now), defense);
    target._weaponBreakUntil = Math.max(Number(target._weaponBreakUntil) || 0, now + Math.max(1, Math.floor(Number(cfg.durationTicks) || 50)));
    return target._weaponBreakDefense;
}

function applyWeaponSizeStagger(target, cfg, nowTicks) {
    if (!target || !cfg) return false;
    let now = Number.isFinite(nowTicks) ? nowTicks : ((typeof state === 'object' && state) ? Number(state.ticks) || 0 : 0);
    if (now < (Number(target._weaponStaggerReadyAt) || 0)) return false;
    let delay = Math.max(1, Math.floor(Number(cfg.delayTicks) || 5));
    let cooldown = Math.max(1, Math.floor(Number(cfg.cooldownTicks) || 30));
    if (target._atkCd === undefined) target._atkCd = Math.max(1, Math.floor((Number(target.atkSpd) || 2) * 10));
    target._atkCd += delay;
    target._weaponStaggerReadyAt = now + cooldown;
    return true;
}

function applyWeaponSizeDisrupt(target, cfg, nowTicks) {
    if (!target || !cfg || target.boss) return false;
    let now = Number.isFinite(nowTicks) ? nowTicks : ((typeof state === 'object' && state) ? Number(state.ticks) || 0 : 0);
    if (now < (Number(target._weaponDisruptReadyAt) || 0)) return false;
    if (!target.st || typeof target.st !== 'object') target.st = (typeof newMobStatus === 'function') ? newMobStatus() : { magicseal: 0 };
    target.st.magicseal = Math.max(Number(target.st.magicseal) || 0, Math.max(1, Math.floor(Number(cfg.durationTicks) || 10)));
    target._weaponDisruptReadyAt = now + Math.max(1, Math.floor(Number(cfg.cooldownTicks) || 40));
    return true;
}

function applyWeaponSizeFocus(owner, cfg, nowTicks) {
    if (!owner || !cfg) return 0;
    let now = Number.isFinite(nowTicks) ? nowTicks : ((typeof state === 'object' && state) ? Number(state.ticks) || 0 : 0);
    if (now < (Number(owner._weaponFocusReadyAt) || 0)) return 0;
    let maxMp = Math.max(0, Number(owner.mmp) || 0), current = Math.max(0, Number(owner.mp) || 0);
    let restored = Math.min(Math.max(0, maxMp - current), Math.max(1, Math.floor(Number(cfg.mp) || 1)));
    if (restored <= 0) return 0;
    owner.mp = current + restored;
    owner._weaponFocusReadyAt = now + Math.max(1, Math.floor(Number(cfg.cooldownTicks) || 40));
    return restored;
}

function applyWeaponSizeSuppress(target, cfg, nowTicks) {
    if (!target || !cfg) return false;
    let now = Number.isFinite(nowTicks) ? nowTicks : ((typeof state === 'object' && state) ? Number(state.ticks) || 0 : 0);
    if (now < (Number(target._weaponSuppressReadyAt) || 0)) return false;
    if (!target.st || typeof target.st !== 'object') target.st = (typeof newMobStatus === 'function') ? newMobStatus() : { broken: 0 };
    target.st.broken = Math.max(Number(target.st.broken) || 0, Math.max(1, Math.floor(Number(cfg.durationTicks) || 20)));
    target._weaponSuppressReadyAt = now + Math.max(1, Math.floor(Number(cfg.cooldownTicks) || 50));
    return true;
}

function auditWeaponSizeMechanics(items) {
    let errors = [];
    Object.entries(items || {}).forEach(([id, def]) => {
        if (!def || !def.sizeMechanics) return;
        ['small', 'medium', 'large'].forEach(key => {
            let raw = def.sizeMechanics[key];
            if (!raw) return;
            let effect = typeof raw === 'string' ? raw : raw.effect;
            if (!WEAPON_SIZE_EFFECTS[effect]) errors.push(`${id}.${key}:未知效果 ${String(effect)}`);
            if (!raw || typeof raw === 'string' || raw.budgetOverride) return;
            if (effect === 'pierce') {
                let chance = raw.chance == null ? 25 : Math.max(0, Number(raw.chance) || 0), splash = raw.splashPct == null ? 40 : Math.max(0, Number(raw.splashPct) || 0);
                if (chance * splash / 100 > 15) errors.push(`${id}.${key}:貫穿平均增幅超過15%`);
            } else if (effect === 'sweep') {
                let every = Math.max(2, Number(raw.every) || 3), splash = raw.splashPct == null ? 50 : Math.max(0, Number(raw.splashPct) || 0);
                if (splash / every > 18) errors.push(`${id}.${key}:橫掃平均增幅超過18%`);
            } else if (effect === 'break_stance' && Math.max(0, Number(raw.defense) || 0) > 3) errors.push(`${id}.${key}:破勢超過3點防禦預算`);
            else if (effect === 'stagger') {
                let delay = Math.max(0, Number(raw.delayTicks) || 0), cooldown = Math.max(1, Number(raw.cooldownTicks) || 30);
                if (delay / cooldown > .2) errors.push(`${id}.${key}:震盪行動延遲預算超過20%`);
            } else if (effect === 'disrupt') {
                let duration = Math.max(0, Number(raw.durationTicks) || 0), cooldown = Math.max(1, Number(raw.cooldownTicks) || 40);
                if (duration / cooldown > .4) errors.push(`${id}.${key}:施法干擾覆蓋預算超過40%`);
            } else if (effect === 'focus' && Math.max(0, Number(raw.mp) || 0) > 2) errors.push(`${id}.${key}:回靈超過2點MP預算`);
            else if (effect === 'suppress') {
                let duration = Math.max(0, Number(raw.durationTicks) || 0), cooldown = Math.max(1, Number(raw.cooldownTicks) || 50);
                if (duration / cooldown > .6) errors.push(`${id}.${key}:壓制覆蓋預算超過60%`);
            }
        });
    });
    return errors;
}

function auditWeaponPrototypePolicies(items) {
    let errors = [], resolved = {};
    Object.entries(items || {}).forEach(([id, def]) => {
        if (!def || !def.prototypePolicy) return;
        let policy = def.prototypePolicy, family = WEAPON_PROTOTYPE_FAMILIES[policy.family];
        if (!family) { errors.push(`${id}:未知武器原型 ${String(policy.family)}`); return; }
        let keepCount = 0, sizeMechanics = {};
        Object.keys(family).forEach(key => {
            let op = policy[key], base = family[key];
            if (!op || !WEAPON_PROTOTYPE_MODES[op.mode]) { errors.push(`${id}.${key}:缺少有效的原型處置`); return; }
            if (op.mode === 'keep') keepCount++;
            if (op.mode === 'keep' && (op.changes || op.mechanic)) errors.push(`${id}.${key}:保留不得同時改寫原型`);
            if (op.mode === 'enhance' && op.changes && op.changes.effect && op.changes.effect !== base.effect) errors.push(`${id}.${key}:強化不得改變原型效果`);
            if (op.mode === 'replace' && (!op.mechanic || !WEAPON_SIZE_EFFECTS[op.mechanic.effect])) errors.push(`${id}.${key}:替換缺少有效的新機制`);
            if (op.mode === 'sacrifice' && (op.changes || op.mechanic)) errors.push(`${id}.${key}:犧牲不得殘留機制資料`);
            let size = key === 'small' ? '小型' : (key === 'large' ? '大型' : '中型');
            let cfg = weaponPrototypeMechanic(def, size);
            if (cfg) {
                cfg = Object.assign({}, cfg);
                delete cfg.size; delete cfg.prototypeMode; delete cfg.prototypeFamily;
                sizeMechanics[key] = cfg;
            }
        });
        if (keepCount > 1) errors.push(`${id}:最多只能保留一項武器原型能力`);
        if (Object.keys(sizeMechanics).length) resolved[id] = { sizeMechanics };
    });
    return errors.concat(auditWeaponSizeMechanics(resolved));
}

function auditAutomaticWeaponPrototypeInheritance(items) {
    let errors = [], resolved = {};
    Object.entries(items || {}).forEach(([id, def]) => {
        if (!weaponMayAutoInheritPrototype(def)) return;
        let family = weaponAutomaticPrototypeFamilyName(def);
        if (!family) { errors.push(`${id}:普通武器缺少可繼承的家族 Tag`); return; }
        let sizeMechanics = {};
        ['small', 'large'].forEach(key => {
            let size = key === 'small' ? '小型' : '大型', cfg = weaponAutomaticPrototypeMechanic(def, size);
            if (!cfg) return;
            cfg = Object.assign({}, cfg);
            delete cfg.size; delete cfg.prototypeFamily; delete cfg.prototypeInherited;
            sizeMechanics[key] = cfg;
        });
        resolved[id] = { sizeMechanics };
    });
    return errors.concat(auditWeaponSizeMechanics(resolved));
}
