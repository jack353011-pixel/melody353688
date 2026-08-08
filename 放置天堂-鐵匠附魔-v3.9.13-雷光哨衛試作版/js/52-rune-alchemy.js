// ========== ♾️ 飾品符文鍊金 v3.9.14 試作 ==========
// 兩個來源（基礎符文／已融合核心）合成一顆可再次融合的鍊金符文。
// 鍊金核心只綁定項鍊、戒指、皮帶；全身最多兩顆生效，四個戒指合計最多一顆生效。
(function () {
    'use strict';

    const CORE_LIMIT = 2;
    const RING_LIMIT = 1;
    const TRAIT_LIMIT = 2;
    const MAX_POWER_RANK = 8;
    const STORAGE_LIMIT = 60;
    const SLOT_PRIORITY = ['amulet', 'belt', 'ring1', 'ring2', 'ring3', 'ring4'];
    const KNOWN_NAMES = {
        'rune_el|rune_eld': '循環符文',
        'rune_tir|rune_vex': '魔力洪流符文',
        'rune_sol|rune_um': '神盾符文',
        'rune_ist|rune_lem': '財寶符文',
        'rune_amn|rune_pul': '獵王符文',
        'rune_mal|rune_ohm': '破壞符文'
    };

    function finiteInt(value, fallback) {
        value = Number(value);
        if (!Number.isFinite(value)) return fallback;
        return Math.floor(value);
    }

    function alchemyEnsure(owner) {
        if (!owner || typeof owner !== 'object') return null;
        if (!owner.growthCenter || typeof owner.growthCenter !== 'object') owner.growthCenter = {};
        let growth = owner.growthCenter;
        if (!Array.isArray(growth.alchemyCores)) growth.alchemyCores = [];
        growth.alchemyCores = growth.alchemyCores.map(alchemyNormalizeCore).filter(Boolean).slice(0, STORAGE_LIMIT);
        return growth;
    }

    function alchemyCoreId() {
        if (typeof uid === 'function') return 'ac_' + uid();
        return 'ac_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    }

    function alchemyNormalizeCore(raw) {
        if (!raw || typeof raw !== 'object' || !Array.isArray(raw.traits)) return null;
        let byId = Object.create(null);
        raw.traits.forEach(row => {
            let id = String(row && row.id || '');
            if (typeof runeDef !== 'function' || !runeDef(id)) return;
            let essence = Math.max(1, Math.min(1000000000, finiteInt(row.essence, 1)));
            byId[id] = Math.min(1000000000, (byId[id] || 0) + essence);
        });
        let traits = Object.keys(byId).sort((a, b) => {
            let ar = runeDef(a), br = runeDef(b);
            return (br.tier - ar.tier) || a.localeCompare(b);
        }).slice(0, TRAIT_LIMIT).map(id => ({ id: id, essence: byId[id] }));
        if (!traits.length) return null;
        return {
            aid: String(raw.aid || alchemyCoreId()).slice(0, 80),
            traits: traits,
            createdAt: Math.max(0, finiteInt(raw.createdAt, Date.now())),
            active: raw.active !== false
        };
    }

    function alchemyTraitRank(essence) {
        essence = Math.max(1, finiteInt(essence, 1));
        return Math.min(MAX_POWER_RANK, Math.floor(Math.log2(essence)) + 1);
    }

    function alchemyTraitValue(core, trait) {
        core = alchemyNormalizeCore(core);
        if (!core || !trait) return 0;
        let def = runeDef(trait.id);
        if (!def) return 0;
        let rank = alchemyTraitRank(trait.essence);
        let rankMult = 1 + (rank - 1) * 0.15;
        let hybridMult = core.traits.length > 1 ? 0.60 : 1;
        let value = Math.max(0, Number(def.value) || 0) * rankMult * hybridMult;
        value = Math.min(Math.max(0, Number(def.cap) || value), value);
        return Math.round(value * 10) / 10;
    }

    function alchemyCoreAbsorbed(core) {
        core = alchemyNormalizeCore(core);
        return core ? core.traits.reduce((sum, row) => sum + row.essence, 0) : 0;
    }

    function shortRuneName(id) {
        let def = typeof runeDef === 'function' ? runeDef(id) : null;
        return String(def && def.n || id).replace(/\s*符文\s*$/, '');
    }

    function alchemyCoreName(core) {
        core = alchemyNormalizeCore(core);
        if (!core) return '失效的鍊金符文';
        if (core.traits.length === 1) {
            let row = core.traits[0], rank = alchemyTraitRank(row.essence);
            return `${rank > 1 ? '精煉 ' : ''}${shortRuneName(row.id)}共鳴符文 R${rank}`;
        }
        let key = core.traits.map(row => row.id).sort().join('|');
        let name = KNOWN_NAMES[key] || core.traits.map(row => shortRuneName(row.id)).join('・') + '混合符文';
        let rank = Math.max.apply(null, core.traits.map(row => alchemyTraitRank(row.essence)));
        return `${name} R${rank}`;
    }

    function alchemyEffectLabel(code, value) {
        let meta = typeof RUNEWORD_EFFECT_META !== 'undefined' ? RUNEWORD_EFFECT_META[code] : null;
        if (!meta) return `${code} +${value}`;
        return `${meta[0]} ${meta[2] ? '-' : '+'}${value}${meta[1] || ''}`;
    }

    function alchemyCoreLines(core) {
        core = alchemyNormalizeCore(core);
        if (!core) return [];
        return core.traits.map(row => {
            let def = runeDef(row.id), rank = alchemyTraitRank(row.essence);
            return `${shortRuneName(row.id)} R${rank}（吸收 ${row.essence}）・${alchemyEffectLabel(def.code, alchemyTraitValue(core, row))}`;
        });
    }

    function alchemyAccessoryBaseEligible(item) {
        let def = item && item.id && DB.items[item.id];
        if (!def || def.type !== 'acc' || !['amulet', 'ring', 'belt'].includes(def.slot)) return false;
        return !def.virtual;
    }

    function alchemyAccessoryRows(owner) {
        if (!owner || !owner.eq) return [];
        let keys = Object.keys(owner.eq);
        let rank = slot => {
            let idx = SLOT_PRIORITY.indexOf(slot);
            return idx >= 0 ? idx : 100 + keys.indexOf(slot);
        };
        let rows = keys.filter(slot => owner.eq[slot] && owner.eq[slot].alchemyCore)
            .sort((a, b) => rank(a) - rank(b))
            .map(slot => {
                let item = owner.eq[slot], core = alchemyNormalizeCore(item.alchemyCore);
                if (!core) return null;
                item.alchemyCore = core;
                let def = DB.items[item.id];
                if (!def || def.type !== 'acc' || !['amulet', 'ring', 'belt'].includes(def.slot)) return null;
                return { slot: slot, item: item, core: core, ring: def.slot === 'ring', enabled: false, reason: '' };
            }).filter(Boolean);
        let active = 0, rings = 0;
        rows.forEach(row => {
            if (row.core.active === false) { row.reason = '手動停用'; return; }
            if (active >= CORE_LIMIT) { row.reason = `全身最多 ${CORE_LIMIT} 顆`; return; }
            if (row.ring && rings >= RING_LIMIT) { row.reason = `戒指最多 ${RING_LIMIT} 顆`; return; }
            row.enabled = true;
            active++;
            if (row.ring) rings++;
        });
        return rows;
    }

    function alchemyCoreState(owner, item) {
        if (!item || !item.alchemyCore) return { state: 'none', enabled: false, reason: '' };
        let equipped = !!(owner && owner.eq && Object.values(owner.eq).includes(item));
        if (!equipped) return { state: 'stored', enabled: false, reason: '尚未裝備' };
        let row = alchemyAccessoryRows(owner).find(entry => entry.item === item);
        if (!row) return { state: 'invalid', enabled: false, reason: '部位不符合' };
        return { state: row.enabled ? 'active' : 'paused', enabled: row.enabled, reason: row.reason };
    }

    function alchemyCodeCap(code) {
        let caps = (typeof RUNE_IDS !== 'undefined' ? RUNE_IDS : []).map(id => runeDef(id))
            .filter(def => def && def.code === code).map(def => Math.max(0, Number(def.cap) || 0));
        return caps.length ? Math.max.apply(null, caps) : Number.MAX_SAFE_INTEGER;
    }

    function alchemyAccessoryTotals(owner) {
        let out = {};
        alchemyAccessoryRows(owner).filter(row => row.enabled).forEach(row => {
            row.core.traits.forEach(trait => {
                let def = runeDef(trait.id);
                if (!def) return;
                let cap = alchemyCodeCap(def.code), value = alchemyTraitValue(row.core, trait);
                out[def.code] = Math.min(cap, (out[def.code] || 0) + value);
            });
        });
        return out;
    }

    function alchemyRuneCount(owner, id) {
        return (owner && Array.isArray(owner.inv) ? owner.inv : []).filter(item => item && item.id === id)
            .reduce((sum, item) => sum + Math.max(0, finiteInt(item.cnt, 1)), 0);
    }

    function alchemyTakeRune(owner, id, count) {
        let left = Math.max(0, finiteInt(count, 0));
        if (!left || !owner || !Array.isArray(owner.inv)) return false;
        for (let idx = owner.inv.length - 1; idx >= 0 && left > 0; idx--) {
            let item = owner.inv[idx];
            if (!item || item.id !== id) continue;
            let have = Math.max(1, finiteInt(item.cnt, 1)), take = Math.min(have, left);
            if (take >= have) owner.inv.splice(idx, 1); else item.cnt = have - take;
            left -= take;
        }
        return left === 0;
    }

    function alchemyFusionSources(owner) {
        let growth = alchemyEnsure(owner), rows = [];
        if (!growth) return rows;
        (typeof RUNE_IDS !== 'undefined' ? RUNE_IDS : []).forEach(id => {
            let count = alchemyRuneCount(owner, id);
            if (count > 0) rows.push({ token: 'r:' + id, kind: 'rune', id: id, count: count, label: `${DB.items[id].n} ×${count}`, traits: [{ id: id, essence: 1 }] });
        });
        growth.alchemyCores.forEach(core => rows.push({ token: 'c:' + core.aid, kind: 'core', id: core.aid, count: 1, label: alchemyCoreName(core), traits: core.traits.map(row => ({ id: row.id, essence: row.essence })) }));
        return rows;
    }

    function alchemyFusionPlan(owner, tokenA, tokenB) {
        let sources = alchemyFusionSources(owner), a = sources.find(row => row.token === tokenA), b = sources.find(row => row.token === tokenB);
        if (!a || !b) return { ok: false, error: '選擇的符文來源已不存在。' };
        if (a.kind === 'core' && b.kind === 'core' && a.id === b.id) return { ok: false, error: '同一顆鍊金符文不能同時放入兩格。' };
        if (a.kind === 'rune' && b.kind === 'rune' && a.id === b.id && alchemyRuneCount(owner, a.id) < 2) return { ok: false, error: `需要兩顆 ${DB.items[a.id].n}。` };
        let byId = Object.create(null);
        a.traits.concat(b.traits).forEach(row => { byId[row.id] = Math.min(1000000000, (byId[row.id] || 0) + Math.max(1, finiteInt(row.essence, 1))); });
        let ids = Object.keys(byId);
        if (ids.length > TRAIT_LIMIT) return { ok: false, error: `第一版每顆最多保留 ${TRAIT_LIMIT} 種特質；請融合相同或既有特質。` };
        let core = alchemyNormalizeCore({ aid: alchemyCoreId(), traits: ids.map(id => ({ id: id, essence: byId[id] })), createdAt: Date.now(), active: true });
        return { ok: !!core, error: core ? '' : '無法產生鍊金符文。', sourceA: a, sourceB: b, core: core };
    }

    function alchemyCommitFusion(owner, tokenA, tokenB) {
        let growth = alchemyEnsure(owner), plan = alchemyFusionPlan(owner, tokenA, tokenB);
        if (!growth || !plan.ok) return plan;
        let removeCoreIds = [plan.sourceA, plan.sourceB].filter(row => row.kind === 'core').map(row => row.id);
        let afterCount = growth.alchemyCores.length - removeCoreIds.length + 1;
        if (afterCount > STORAGE_LIMIT) return { ok: false, error: `鍊金符文保管上限為 ${STORAGE_LIMIT} 顆。` };
        let runeNeeds = Object.create(null);
        [plan.sourceA, plan.sourceB].filter(row => row.kind === 'rune').forEach(row => { runeNeeds[row.id] = (runeNeeds[row.id] || 0) + 1; });
        for (let id of Object.keys(runeNeeds)) if (alchemyRuneCount(owner, id) < runeNeeds[id]) return { ok: false, error: `${DB.items[id].n} 數量不足。` };
        Object.keys(runeNeeds).forEach(id => alchemyTakeRune(owner, id, runeNeeds[id]));
        if (removeCoreIds.length) growth.alchemyCores = growth.alchemyCores.filter(core => !removeCoreIds.includes(core.aid));
        growth.alchemyCores.push(plan.core);
        return plan;
    }

    function alchemyUnbindCost(core) {
        return Math.min(2000000, Math.max(10000, alchemyCoreAbsorbed(core) * 10000));
    }

    window.ALCHEMY_ACCESSORY_CORE_LIMIT = CORE_LIMIT;
    window.ALCHEMY_ACCESSORY_RING_LIMIT = RING_LIMIT;
    window.ALCHEMY_CORE_STORAGE_LIMIT = STORAGE_LIMIT;
    window.alchemyEnsure = alchemyEnsure;
    window.alchemyNormalizeCore = alchemyNormalizeCore;
    window.alchemyTraitRank = alchemyTraitRank;
    window.alchemyTraitValue = alchemyTraitValue;
    window.alchemyCoreAbsorbed = alchemyCoreAbsorbed;
    window.alchemyCoreName = alchemyCoreName;
    window.alchemyCoreLines = alchemyCoreLines;
    window.alchemyAccessoryBaseEligible = alchemyAccessoryBaseEligible;
    window.alchemyAccessoryRows = alchemyAccessoryRows;
    window.alchemyCoreState = alchemyCoreState;
    window.alchemyCodeCap = alchemyCodeCap;
    window.alchemyAccessoryTotals = alchemyAccessoryTotals;
    window.alchemyFusionSources = alchemyFusionSources;
    window.alchemyFusionPlan = alchemyFusionPlan;
    window.alchemyCommitFusion = alchemyCommitFusion;
    window.alchemyUnbindCost = alchemyUnbindCost;
})();
