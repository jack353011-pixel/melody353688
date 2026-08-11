// ===== Tag 規則核心 =====
// all＝全部符合、any＝至少一項符合、none＝不得包含。
// 裝備、技能、套裝與掉落都應共用此判定器，避免各系統自行解讀標籤。
function tagCoreList(value) {
    if (value == null) return [];
    return [...new Set((Array.isArray(value) ? value : [value]).filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()))];
}
function tagRuleMatch(subjectTags, rule) {
    rule = rule || {};
    let rawTags = subjectTags && typeof subjectTags.tagList === 'function' ? subjectTags.tagList(rule.scope ? { scope:rule.scope } : null)
        : (subjectTags && Array.isArray(subjectTags.tags) ? subjectTags.tags : subjectTags);
    let tags = new Set(tagCoreList(rawTags));
    let all = tagCoreList(rule.all), any = tagCoreList(rule.any), none = tagCoreList(rule.none);
    let missing = all.filter(tag => !tags.has(tag));
    let anyHits = any.filter(tag => tags.has(tag));
    let blocked = none.filter(tag => tags.has(tag));
    return {
        matched: !missing.length && (!any.length || anyHits.length > 0) && !blocked.length,
        tags: [...tags], missing, anyHits, blocked, rule
    };
}

// Tag 快照保留「來源、層級、範圍、數量」。同一件裝備在不同層重複出現同一 Tag，只計一次；
// 不同裝備則分別計數，讓套裝、天賦與任務可以正確讀取「[龍族] ×3」之類的條件。
function createTagSnapshot(rawEntries) {
    let entries = [], seen = new Set();
    (rawEntries || []).forEach((raw, index) => {
        let e = typeof raw === 'string' ? { tag:raw } : (raw || {}), tag = tagCoreList(e.tag)[0];
        if (!tag) return;
        let scope = e.scope || '角色', source = e.source || `anonymous:${index}`, layer = e.layer || '其他';
        let key = `${scope}\u0000${source}\u0000${tag}`;
        if (seen.has(key)) return;
        seen.add(key);
        entries.push({ tag, scope, source, layer, amount:Math.max(1, Math.floor(Number(e.amount) || 1)), itemId:e.itemId || null, slot:e.slot || null });
    });
    let snapshot = {
        version:1,
        entries,
        tags:[...new Set(entries.map(e => e.tag))],
        tagList(filter) {
            filter = filter || {};
            let scopes = tagCoreList(filter.scopes || filter.scope), layers = tagCoreList(filter.layers || filter.layer);
            return [...new Set(entries.filter(e => (!scopes.length || scopes.includes(e.scope)) && (!layers.length || layers.includes(e.layer))).map(e => e.tag))];
        },
        has(tag, filter) { return this.count(tag, filter) > 0; },
        count(tag, filter) {
            filter = filter || {};
            let scopes = tagCoreList(filter.scopes || filter.scope), layers = tagCoreList(filter.layers || filter.layer);
            return entries.filter(e => e.tag === tag && (!scopes.length || scopes.includes(e.scope)) && (!layers.length || layers.includes(e.layer)))
                .reduce((sum, e) => sum + e.amount, 0);
        },
        sources(tag, filter) {
            filter = filter || {};
            let scopes = tagCoreList(filter.scopes || filter.scope);
            return entries.filter(e => e.tag === tag && (!scopes.length || scopes.includes(e.scope))).map(e => e.source);
        },
        match(rule, filter) { return tagRuleMatch(this.tagList(filter), rule); }
    };
    return snapshot;
}

// 「職系」只作舊資料遷移橋梁。新內容應優先使用能力標籤（精通、武器訓練、元素等），
// 不再把職業名稱直接寫進裝備或技能。
const TAG_CLASS_LINEAGE = Object.freeze({
    royal:'系譜:王族', knight:'系譜:騎士', mage:'系譜:法師', elf:'系譜:妖精',
    dark:'系譜:黑暗妖精', illusion:'系譜:幻術士', dragon:'系譜:龍騎士', warrior:'系譜:戰士'
});
function classLineageTag(cls) { return TAG_CLASS_LINEAGE[cls] || (cls ? `系譜:${cls}` : ''); }
// 資格 Tag：只來自角色本身、學習／精通與世界狀態；永遠不讀裝備流派 Tag。
function playerQualificationTags(owner) {
    owner = owner || (typeof player !== 'undefined' ? player : null);
    if (!owner) return [];
    let tags = ['角色', '裝備:泛用'], lineage = classLineageTag(owner.cls);
    if (lineage) tags.push(lineage);
    if (owner.mastery) tags.push(`精通:${owner.mastery}`);
    tags.push(...tagCoreList(owner.qualificationTags), ...tagCoreList(owner.capabilityTags));   // capabilityTags＝舊存檔相容別名

    // 各職系原有的基礎跨系修習，改成能力標籤；技能本身只查標籤，不再查 owner.cls。
    if (owner.cls === 'dark') tags.push('修習:黑妖基礎奧術');
    if (owner.cls === 'warrior') tags.push('修習:戰士基礎奧術');
    if (owner.cls === 'royal') tags.push('修習:王族基礎奧術');
    return tagCoreList(tags);
}
function playerCapabilityTags(owner) { return playerQualificationTags(owner); }   // 舊呼叫相容；不再含任何裝備 Tag

// 流派 Tag：只描述「擅長什麼」。裝備、技能與天賦可授予流派標籤，但不得拿它判定能否穿戴／學習／進圖。
function characterAffinityTagSnapshot(owner) {
    owner = owner || (typeof player !== 'undefined' ? player : null);
    if (!owner) return createTagSnapshot([]);
    let entries = [];
    tagCoreList(owner.affinityTags || owner.buildTags).forEach(tag => entries.push({ tag, scope:'角色流派', layer:'角色流派', source:'character-affinity' }));

    if (owner.eq && typeof DB !== 'undefined' && DB.items) Object.entries(owner.eq).forEach(([slot, item]) => {
        let def = item && DB.items[item.id]; if (!def) return;
        let source = `equipment:${slot}:${item.uid || item.id}`, profile = typeof equipmentTagProfile === 'function' ? equipmentTagProfile(item) : null;
        if (profile && profile.layers) profile.layers.forEach(layer => layer.tags.forEach(tag => entries.push({ tag, scope:'裝備中', layer:layer.name, source, itemId:item.id, slot })));
        else tagCoreList(def.tags).forEach(tag => entries.push({ tag, scope:'裝備中', layer:'固有標籤', source, itemId:item.id, slot }));
        tagCoreList(def.grantAffinityTags || def.grantTags).forEach(tag => entries.push({ tag, scope:'裝備中', layer:'授予流派', source, itemId:item.id, slot }));
    });
    if (owner.skills && typeof DB !== 'undefined' && DB.skills) owner.skills.forEach(id => {
        let sk = DB.skills[id];
        tagCoreList(sk && sk.grantAffinityTags).forEach(tag => entries.push({ tag, scope:'技能流派', layer:'技能授予', source:`skill:${id}` }));
    });
    return createTagSnapshot(entries);
}

// 資格快照：角色／天賦／持有／任務。刻意不讀 owner.eq，避免「穿裝備＝取得技能／任務資格」。
function characterQualificationTagSnapshot(owner, options) {
    owner = owner || (typeof player !== 'undefined' ? player : null);
    options = Object.assign({ includeInventory:true, includeState:true }, options || {});
    if (!owner) return createTagSnapshot([]);
    let entries = [];
    playerQualificationTags(owner).forEach(tag => entries.push({
        tag, scope:tag.startsWith('精通:') || tag.startsWith('修習:') ? '天賦' : '角色',
        layer:tag.startsWith('系譜:') ? '系譜' : '資格', source:tag.startsWith('精通:') ? `mastery:${owner.mastery}` : 'character'
    }));
    if (options.includeInventory && owner.inv && typeof DB !== 'undefined' && DB.items) owner.inv.forEach((item, index) => {
        let def = item && DB.items[item.id]; if (!def) return;
        let source = `inventory:${item.uid || index}:${item.id}`, amount = item.cnt || 1;
        entries.push({ tag:`持有:${item.id}`, scope:'持有', layer:'物品', source, itemId:item.id, amount });
        tagCoreList(def.holdQualificationTags || def.holdTags).forEach(tag => entries.push({ tag, scope:'持有', layer:'持有資格', source, itemId:item.id, amount }));
        if (def.prideTier && ['pass','dom','scroll'].includes(def.prideKind)) entries.push({ tag:`傲慢通行:${def.prideTier}`, scope:'持有', layer:'通行資格', source, itemId:item.id });
    });

    if (options.includeState) {
        if (owner.classicMode) entries.push({ tag:'模式:經典', scope:'狀態', layer:'模式', source:'state:classic' });
        if (owner.demonTempleOpen) entries.push({ tag:'任務:魔族神殿開放', scope:'任務', layer:'世界進度', source:'quest:demon-temple' });
        if (owner.prideBeatJenis) entries.push({ tag:'進度:擊敗潔尼斯女王', scope:'任務', layer:'世界進度', source:'progress:jenis' });
        if ((owner.flameAffinity || 0) >= 1000) entries.push({ tag:'友好:炎魔1000', scope:'任務', layer:'友好度', source:'affinity:balrog' });
    }
    return createTagSnapshot(entries);
}

// 完整檢視只供 UI／除錯；正式消費者必須明確選 affinity 或 qualification，不可混用。
function characterTagSnapshot(owner, options) {
    let affinity = characterAffinityTagSnapshot(owner), qualification = characterQualificationTagSnapshot(owner, options);
    return createTagSnapshot([...affinity.entries, ...qualification.entries]);
}
function characterRuntimeTags(owner) { return characterAffinityTagSnapshot(owner).tags; }
function characterHasTag(owner, tag, filter) { return characterQualificationTagSnapshot(owner).has(tag, filter); }

const TAG_SKILL_REQ_FIELDS = Object.freeze({
    reqRoy:'royal', reqK:'knight', reqM:'mage', reqE:'elf',
    reqD:'dark', reqI:'illusion', reqDk:'dragon', reqW:'warrior'
});
function skillAccessTagRules(sk, skId) {
    if (!sk) return [];
    // 新技能的資格入口；一旦有 qualificationRules，就不再讀 reqK/reqM 等舊欄位。
    let explicit = Array.isArray(sk.qualificationRules) ? sk.qualificationRules : (Array.isArray(sk.accessTagRules) ? sk.accessTagRules : null);
    if (explicit) return explicit.map((rule, i) => Object.assign({ priority:10, level:1, source:`qualification:${i}` }, rule));
    let single = sk.qualificationRule || sk.accessTagRule;   // accessTagRule＝v3.9.32 相容別名
    if (single) return [Object.assign({ priority:10, level:1, source:'qualification' }, single)];

    // 舊技能相容轉接：把職業需求欄位轉成同一種 Tag 規則，再交由核心判定。
    let rules = [];
    Object.entries(TAG_SKILL_REQ_FIELDS).forEach(([field, cls]) => {
        if (sk[field] !== undefined) rules.push({ all:[classLineageTag(cls)], level:sk[field], priority:10, source:`legacy:${field}` });
    });
    if (sk.reqM !== undefined) {
        if (sk.tier === 1 || sk.tier === 2) rules.push({ all:['修習:黑妖基礎奧術'], level:sk.tier === 1 ? 12 : 24, priority:20, source:'bridge:dark-arcane' });
        if (sk.tier === 1) rules.push({ all:['修習:戰士基礎奧術'], level:15, priority:20, source:'bridge:warrior-arcane' });
        if (sk.tier === 1 || sk.tier === 2) rules.push({ all:['修習:王族基礎奧術'], level:sk.tier === 1 ? 10 : 20, priority:20, source:'bridge:royal-arcane' });
        if (sk.tier >= 3 && sk.tier <= 5) rules.push({ all:['精通:k_royal_magic'], level:sk.reqM, priority:20, source:'mastery:royal-magic' });
        if (skId && typeof MAGIC_MASTERY_SKILLS !== 'undefined' && MAGIC_MASTERY_SKILLS.includes(skId)) {
            rules.push({ all:['精通:e_magic'], level:sk.reqM, priority:20, source:'mastery:elf-magic' });
        }
    }
    return rules;
}
function skillAccessTagStatus(owner, sk, skId) {
    let snapshot = characterQualificationTagSnapshot(owner, { includeInventory:false }), tags = snapshot.tags, rules = skillAccessTagRules(sk, skId);
    let matched = rules.filter(rule => tagRuleMatch(tags, rule).matched);
    if (!matched.length) return { allowed:false, level:undefined, tags, rules, matchedRule:null };
    let priority = Math.min(...matched.map(rule => Number.isFinite(+rule.priority) ? +rule.priority : 10));
    let best = matched.filter(rule => (Number.isFinite(+rule.priority) ? +rule.priority : 10) === priority)
        .sort((a,b) => (+a.level || 1) - (+b.level || 1))[0];
    return { allowed:true, level:Math.max(1, +best.level || 1), tags, rules, matchedRule:best };
}
// 技能流派相性只回報加成是否相符，不參與「是否能學／是否能施放」。
function skillSynergyTagStatus(owner, sk) {
    let rules = Array.isArray(sk && sk.synergyTagRules) ? sk.synergyTagRules : ((sk && sk.synergyTagRule) ? [sk.synergyTagRule] : []);
    let snapshot = characterAffinityTagSnapshot(owner);
    return { matched:!rules.length || rules.every(rule => snapshot.match(rule).matched), tags:snapshot.tags, rules };
}
