(() => {
    const STORAGE_KEYS = {
        selectedClass: "ddcm_selected_class",
        selectedBackground: "ddcm_selected_background",
        selectedRace: "ddcm_selected_race",
        selectedSubrace: "ddcm_selected_subrace",

        lastAbilitySource: "ddcm_last_ability_source",
        pointBuyState: "ddcm_point_buy_state",
        rollStatsState: "ddcm_roll_stats_state",
        skillsState: "ddcm_skills_state",

        characterName: "ddcm_character_name",

        equippedArmor: "ddcm_equipped_armor",
        equippedShield: "ddcm_equipped_shield"
    };

    const PROF_BONUS = 2;

    const ABILITY_ORDER = [
        { key: "str", name: "Strength" },
        { key: "dex", name: "Dexterity" },
        { key: "con", name: "Constitution" },
        { key: "int", name: "Intelligence" },
        { key: "wis", name: "Wisdom" },
        { key: "cha", name: "Charisma" }
    ];

    const SKILLS = [
        { name: "Athletics", ability: "str" },

        { name: "Acrobatics", ability: "dex" },
        { name: "Sleight of Hand", ability: "dex" },
        { name: "Stealth", ability: "dex" },

        { name: "Arcana", ability: "int" },
        { name: "History", ability: "int" },
        { name: "Investigation", ability: "int" },
        { name: "Nature", ability: "int" },
        { name: "Religion", ability: "int" },

        { name: "Animal Handling", ability: "wis" },
        { name: "Insight", ability: "wis" },
        { name: "Medicine", ability: "wis" },
        { name: "Perception", ability: "wis" },
        { name: "Survival", ability: "wis" },

        { name: "Deception", ability: "cha" },
        { name: "Intimidation", ability: "cha" },
        { name: "Performance", ability: "cha" },
        { name: "Persuasion", ability: "cha" }
    ];

    const BACKGROUND_SKILLS = {
        Acolyte: ["Insight", "Religion"],
        Artisan: ["Investigation", "Persuasion"],
        Charlatan: ["Deception", "Sleight of Hand"],
        Criminal: ["Sleight of Hand", "Stealth"],
        Entertainer: ["Acrobatics", "Performance"],
        Farmer: ["Animal Handling", "Nature"],
        Guard: ["Athletics", "Perception"],
        Hermit: ["Medicine", "Religion"],
        Merchant: ["Animal Handling", "Persuasion"],
        Noble: ["History", "Persuasion"],
        Outlander: ["Stealth", "Survival"],
        Sage: ["Arcana", "History"],
        Sailor: ["Acrobatics", "Perception"],
        Scribe: ["Investigation", "Perception"],
        Soldier: ["Athletics", "Intimidation"],
        Urchin: ["Insight", "Stealth"]
    };

    const SAVING_THROW_PROF = {
        Barbarian: ["str", "con"],
        Bard: ["dex", "cha"],
        Cleric: ["wis", "cha"],
        Druid: ["int", "wis"],
        Fighter: ["str", "con"],
        Monk: ["str", "dex"],
        Paladin: ["wis", "cha"],
        Ranger: ["str", "dex"],
        Rogue: ["dex", "int"],
        Sorcerer: ["con", "cha"],
        Warlock: ["wis", "cha"],
        Wizard: ["int", "wis"]
    };

    const HIT_DIE_BASE = {
        Barbarian: 12,
        Fighter: 10,
        Paladin: 10,
        Ranger: 10,

        Bard: 8,
        Cleric: 8,
        Druid: 8,
        Monk: 8,
        Rogue: 8,
        Warlock: 8,

        Sorcerer: 6,
        Wizard: 6
    };

    const ARMOR_PROF = {
        Barbarian: { light: true, medium: true, heavy: false, shield: true },
        Bard: { light: true, medium: false, heavy: false, shield: false },
        Cleric: { light: true, medium: true, heavy: false, shield: true },
        Druid: { light: true, medium: false, heavy: false, shield: true },
        Fighter: { light: true, medium: true, heavy: true, shield: true },
        Monk: { light: false, medium: false, heavy: false, shield: false },
        Paladin: { light: true, medium: true, heavy: true, shield: true },
        Ranger: { light: true, medium: true, heavy: false, shield: true },
        Rogue: { light: true, medium: false, heavy: false, shield: false },
        Sorcerer: { light: false, medium: false, heavy: false, shield: false },
        Warlock: { light: true, medium: false, heavy: false, shield: false },
        Wizard: { light: false, medium: false, heavy: false, shield: false }
    };

    const ARMOR_DATA = [
        { id: "padded", cat: "light", base: 11, strReq: 0 },
        { id: "leather", cat: "light", base: 11, strReq: 0 },
        { id: "studded_leather", cat: "light", base: 12, strReq: 0 },

        { id: "hide", cat: "medium", base: 12, strReq: 0 },
        { id: "chain_shirt", cat: "medium", base: 13, strReq: 0 },
        { id: "scale_mail", cat: "medium", base: 14, strReq: 0 },
        { id: "breastplate", cat: "medium", base: 14, strReq: 0 },
        { id: "half_plate", cat: "medium", base: 15, strReq: 0 },

        { id: "ring_mail", cat: "heavy", base: 14, strReq: 0 },
        { id: "chain_mail", cat: "heavy", base: 16, strReq: 13 },
        { id: "splint", cat: "heavy", base: 17, strReq: 15 },
        { id: "plate", cat: "heavy", base: 18, strReq: 15 }
    ];

    function safeParse(json) {
        try {
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    function modFromScore(score) {
        return Math.floor((score - 10) / 2);
    }

    function signed(n) {
        const num = Number(n);
        if (!Number.isFinite(num)) {
            return "—";
        }
        return `${num >= 0 ? "+" : ""}${num}`;
    }

    function readChosenRaceDisplay(race, subrace) {
        if (subrace && String(subrace).trim().length > 0) {
            return subrace;
        }
        return race || "";
    }

    function computeSpeed(race, subrace) {
        if (race === "Goliath") {
            return 35;
        }
        if (subrace === "Wood Elf") {
            return 35;
        }
        return 30;
    }

    function loadAbilityTotalsFromPointBuy() {
        const raw = localStorage.getItem(STORAGE_KEYS.pointBuyState);
        const saved = raw ? safeParse(raw) : null;
        if (!saved) {
            return null;
        }

        const scores = saved.scores || {};
        const bonuses = saved.bonuses || {};

        const get = (k) => {
            const base = Number(scores[k] ?? scores[k.toUpperCase()] ?? 0);
            const bonus = Number(bonuses[k] ?? bonuses[k.toUpperCase()] ?? 0);
            if (!Number.isFinite(base) || !Number.isFinite(bonus)) {
                return null;
            }
            return base + bonus;
        };

        return {
            str: get("str"),
            dex: get("dex"),
            con: get("con"),
            int: get("int"),
            wis: get("wis"),
            cha: get("cha")
        };
    }

    function loadAbilityTotalsFromRollStats() {
        const raw = localStorage.getItem(STORAGE_KEYS.rollStatsState);
        const saved = raw ? safeParse(raw) : null;
        if (!saved) {
            return null;
        }

        const rolls = Array.isArray(saved.rolls) ? saved.rolls : [];
        const assigned = saved.assignedPoolIndex || {};
        const bonuses = saved.bonuses || {};

        const get = (k) => {
            const poolIndex = assigned[k];
            if (poolIndex === null || poolIndex === undefined) {
                return null;
            }

            const base = Number(rolls[poolIndex]);
            if (!Number.isFinite(base)) {
                return null;
            }

            const bonus = Number(bonuses[k] ?? 0);
            if (!Number.isFinite(bonus)) {
                return null;
            }

            return base + bonus;
        };

        return {
            str: get("str"),
            dex: get("dex"),
            con: get("con"),
            int: get("int"),
            wis: get("wis"),
            cha: get("cha")
        };
    }

    function loadAbilities() {
        const source = localStorage.getItem(STORAGE_KEYS.lastAbilitySource) || "point_buy";
        const totals = source === "roll_stats" ? loadAbilityTotalsFromRollStats() : loadAbilityTotalsFromPointBuy();

        if (!totals) {
            return { totals: null, mods: null };
        }

        const mods = {};
        for (const a of ABILITY_ORDER) {
            const score = totals[a.key];
            mods[a.key] = score === null ? null : modFromScore(score);
        }

        return { totals, mods };
    }

    function loadSkillsState() {
        const raw = localStorage.getItem(STORAGE_KEYS.skillsState);
        const saved = raw ? safeParse(raw) : null;

        const selectedOptional = new Set();
        const expertiseSkills = new Set();

        if (saved && Array.isArray(saved.selectedOptional)) {
            for (const s of saved.selectedOptional) {
                selectedOptional.add(s);
            }
        }

        if (saved && Array.isArray(saved.expertiseSkills)) {
            for (const s of saved.expertiseSkills) {
                expertiseSkills.add(s);
            }
        }

        return { selectedOptional, expertiseSkills };
    }

    function buildProficientSkills(background, selectedOptional) {
        const locked = new Set(BACKGROUND_SKILLS[background] || []);
        const all = new Set([...locked, ...selectedOptional]);
        return { locked, proficient: all };
    }

    function skillModifier(skillName, abilityKey, abilityMods, proficientSet, expertiseSet) {
        const base = Number.isFinite(abilityMods[abilityKey]) ? abilityMods[abilityKey] : 0;

        let total = base;

        if (proficientSet.has(skillName)) {
            total += PROF_BONUS;
        }

        if (expertiseSet.has(skillName)) {
            total += PROF_BONUS;
        }

        return total;
    }

    function armorDisplayName(armorId) {
        const map = {
            padded: "Padded Armor",
            leather: "Leather Armor",
            studded_leather: "Studded Leather Armor",
            hide: "Hide Armor",
            chain_shirt: "Chain Shirt",
            scale_mail: "Scale Mail",
            breastplate: "Breastplate",
            half_plate: "Half Plate Armor",
            ring_mail: "Ring Mail",
            chain_mail: "Chain Mail",
            splint: "Splint Armor",
            plate: "Plate Armor"
        };
        return map[armorId] || "";
    }

    function findArmor(armorId) {
        for (const a of ARMOR_DATA) {
            if (a.id === armorId) {
                return a;
            }
        }
        return null;
    }

    function validateEquippedGear(chosenClass, strengthScore) {
        const prof = ARMOR_PROF[chosenClass] || { light: false, medium: false, heavy: false, shield: false };

        const armorId = localStorage.getItem(STORAGE_KEYS.equippedArmor) || "";
        const shieldOn = localStorage.getItem(STORAGE_KEYS.equippedShield) === "true";

        if (armorId) {
            const armor = findArmor(armorId);
            const catAllowed = armor ? Boolean(prof[armor.cat]) : false;
            const strOk = armor && armor.strReq ? (strengthScore >= armor.strReq) : true;

            if (!armor || !catAllowed || !strOk) {
                localStorage.removeItem(STORAGE_KEYS.equippedArmor);
            }
        }

        if (shieldOn && !prof.shield) {
            localStorage.setItem(STORAGE_KEYS.equippedShield, "false");
        }
    }

    function renderAbilityTiles(totals, mods) {
        for (const a of ABILITY_ORDER) {
            const scoreEl = document.getElementById(`ability-score-${a.key}`);
            const modEl = document.getElementById(`ability-mod-${a.key}`);

            const score = totals ? totals[a.key] : null;
            const mod = mods ? mods[a.key] : null;

            scoreEl.textContent = score === null || score === undefined ? "—" : String(score);

            if (mod === null || mod === undefined) {
                modEl.textContent = "";
            } else {
                modEl.textContent = `Mod: ${signed(mod)}`;
            }
        }
    }

    function renderSavingThrows(chosenClass, abilityMods) {
        const root = document.getElementById("saving-throws");
        root.textContent = "";

        const profSet = new Set(SAVING_THROW_PROF[chosenClass] || []);

        for (const a of ABILITY_ORDER) {
            const base = Number.isFinite(abilityMods[a.key]) ? abilityMods[a.key] : 0;
            const total = profSet.has(a.key) ? base + PROF_BONUS : base;

            const line = document.createElement("div");
            line.className = "details-line";

            const name = document.createElement("div");
            name.className = "details-line-name";
            name.textContent = a.name;

            const value = document.createElement("div");
            value.className = "details-line-value";
            value.textContent = signed(total);

            line.appendChild(name);
            line.appendChild(value);
            root.appendChild(line);
        }
    }

    function renderSkills(abilityMods, proficientSet, expertiseSet) {
        const root = document.getElementById("skills-list");
        root.textContent = "";

        const enriched = SKILLS.map((s) => {
            const mod = skillModifier(s.name, s.ability, abilityMods, proficientSet, expertiseSet);
            return { ...s, mod };
        });

        enriched.sort((a, b) => {
            if (b.mod !== a.mod) {
                return b.mod - a.mod;
            }
            return a.name.localeCompare(b.name);
        });

        for (const s of enriched) {
            const line = document.createElement("div");
            line.className = "details-line";

            const name = document.createElement("div");
            name.className = "details-line-name";
            name.textContent = s.name;

            const value = document.createElement("div");
            value.className = "details-line-value";
            value.textContent = signed(s.mod);

            line.appendChild(name);
            line.appendChild(value);
            root.appendChild(line);

            if (s.name === "Perception") {
                const passive = document.createElement("div");
                passive.className = "details-line-passive";
                passive.textContent = `Passive Perception: ${10 + s.mod}`;
                root.appendChild(passive);
            }
        }
    }

    function renderRightTiles(chosenClass, race, subrace, totals, mods, armorId, shieldOn) {
        const dexMod = Number.isFinite(mods.dex) ? mods.dex : 0;
        const conMod = Number.isFinite(mods.con) ? mods.con : 0;
        const wisMod = Number.isFinite(mods.wis) ? mods.wis : 0;

        const initiative = dexMod;

        const speed = computeSpeed(race, subrace);

        let armorClass = 10 + dexMod;
        if (!armorId) {
            if (chosenClass === "Barbarian") {
                armorClass += conMod;
            }
            if (chosenClass === "Monk") {
                armorClass += wisMod;
            }
        } else {
            const armor = findArmor(armorId);
            if (armor) {
                if (armor.cat === "light") {
                    armorClass = armor.base + dexMod;
                } else if (armor.cat === "medium") {
                    armorClass = armor.base + Math.min(2, dexMod);
                } else if (armor.cat === "heavy") {
                    armorClass = armor.base;
                }
            }
        }

        if (shieldOn) {
            armorClass += 2;
        }
        document.getElementById("armor-class").textContent = String(armorClass);

        const baseHp = Number(HIT_DIE_BASE[chosenClass] ?? 0);
        let hp = baseHp + conMod;
        if (race === "Dwarf") {
            hp += 1;
        }

        document.getElementById("initiative").textContent = signed(initiative);
        document.getElementById("speed").textContent = `${speed} ft.`;
        document.getElementById("armor-class").textContent = String(armorClass);
        document.getElementById("hit-points").textContent = String(hp);
    }

    function renderEquipmentBody(armorId, shieldOn, onUnequipArmor, onUnequipShield) {
        const body = document.getElementById("equipments-body");
        if (!body) {
            return;
        }

        body.textContent = "";

        if (!armorId && !shieldOn) {
            const empty = document.createElement("div");
            empty.textContent = "No equipment equipped.";
            body.appendChild(empty);
            return;
        }

        if (armorId) {
            const row = document.createElement("div");
            row.className = "equipment-line";

            const text = document.createElement("div");
            text.className = "equipment-line-text";
            text.textContent = `Armor: ${armorDisplayName(armorId)}`;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-undo";
            btn.textContent = "Unequip";
            btn.addEventListener("click", onUnequipArmor);

            row.appendChild(text);
            row.appendChild(btn);
            body.appendChild(row);
        }

        if (shieldOn) {
            const row = document.createElement("div");
            row.className = "equipment-line";

            const text = document.createElement("div");
            text.className = "equipment-line-text";
            text.textContent = "Shield: Equipped";

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-undo";
            btn.textContent = "Unequip";
            btn.addEventListener("click", onUnequipShield);

            row.appendChild(text);
            row.appendChild(btn);
            body.appendChild(row);
        }
    }

    function initNameField() {
        const input = document.getElementById("character-name");

        const saved = localStorage.getItem(STORAGE_KEYS.characterName);
        if (saved) {
            input.value = saved;
        }

        input.addEventListener("input", () => {
            const val = input.value.trim();
            if (val.length === 0) {
                localStorage.removeItem(STORAGE_KEYS.characterName);
                return;
            }
            localStorage.setItem(STORAGE_KEYS.characterName, val);
        });
    }

    function init() {
        const chosenClass = localStorage.getItem(STORAGE_KEYS.selectedClass) || "";
        const chosenBackground = localStorage.getItem(STORAGE_KEYS.selectedBackground) || "";
        const chosenRace = localStorage.getItem(STORAGE_KEYS.selectedRace) || "";
        const chosenSubrace = localStorage.getItem(STORAGE_KEYS.selectedSubrace) || "";

        document.getElementById("class-level").value = chosenClass ? `${chosenClass} lvl. 1` : "";
        document.getElementById("background").value = chosenBackground || "";
        document.getElementById("race").value = readChosenRaceDisplay(chosenRace, chosenSubrace);

        initNameField();

        const { totals, mods } = loadAbilities();
        if (!totals || !mods) {
            renderAbilityTiles(null, null);
            return;
        }

        const strScore = Number.isFinite(totals.str) ? totals.str : 0;
        validateEquippedGear(chosenClass, strScore);

        let armorId = localStorage.getItem(STORAGE_KEYS.equippedArmor) || "";
        let shieldOn = localStorage.getItem(STORAGE_KEYS.equippedShield) === "true";

        function handleUnequipArmor() {
            localStorage.removeItem(STORAGE_KEYS.equippedArmor);

            armorId = localStorage.getItem(STORAGE_KEYS.equippedArmor) || "";
            shieldOn = localStorage.getItem(STORAGE_KEYS.equippedShield) === "true";

            renderEquipmentBody(armorId, shieldOn, handleUnequipArmor, handleUnequipShield);
            renderRightTiles(chosenClass, chosenRace, chosenSubrace, totals, mods, armorId, shieldOn);
        }

        function handleUnequipShield() {
            localStorage.setItem(STORAGE_KEYS.equippedShield, "false");

            armorId = localStorage.getItem(STORAGE_KEYS.equippedArmor) || "";
            shieldOn = false;

            renderEquipmentBody(armorId, shieldOn, handleUnequipArmor, handleUnequipShield);
            renderRightTiles(chosenClass, chosenRace, chosenSubrace, totals, mods, armorId, shieldOn);
        }

        renderEquipmentBody(armorId, shieldOn, handleUnequipArmor, handleUnequipShield);

        renderAbilityTiles(totals, mods);

        const { selectedOptional, expertiseSkills } = loadSkillsState();
        const { proficient } = buildProficientSkills(chosenBackground, selectedOptional);

        renderSavingThrows(chosenClass, mods);
        renderSkills(mods, proficient, expertiseSkills);
        renderRightTiles(chosenClass, chosenRace, chosenSubrace, totals, mods, armorId, shieldOn);

        const equipBtn = document.getElementById("equip");
        if (equipBtn) {
            equipBtn.addEventListener("click", () => {
                window.location.href = "equipment.html";
            });
        }
    }

    init();
})();
