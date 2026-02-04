(() => {
    const STORAGE_KEYS = {
        selectedRace: "ddcm_selected_race",
        selectedSubrace: "ddcm_selected_subrace",
        selectedClass: "ddcm_selected_class",
        selectedBackground: "ddcm_selected_background",
        lastAbilitySource: "ddcm_last_ability_source",
        pointBuyState: "ddcm_point_buy_state",
        rollStatsState: "ddcm_roll_stats_state",
        skillsState: "ddcm_skills_state"
    };

    const PROF_BONUS = 2;
    const MAX_EXPERTISE = 2;

    const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];

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

    const BACKGROUND_EXTRA_ANY = new Set(["Charlatan", "Noble", "Scribe"]);

    const ELF_BONUS_SKILLS = new Set(["Insight", "Perception", "Survival"]);

    const CLASS_RULES = {
        Barbarian: { choose: 2, skills: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"] },
        Bard: { choose: 3, skills: "ANY" },
        Cleric: { choose: 2, skills: ["History", "Insight", "Medicine", "Persuasion", "Religion"] },
        Druid: { choose: 2, skills: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"] },
        Fighter: { choose: 2, skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Persuasion", "Perception", "Survival"] },
        Monk: { choose: 2, skills: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"] },
        Paladin: { choose: 2, skills: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"] },
        Ranger: { choose: 3, skills: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
        Rogue: { choose: 4, skills: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Persuasion", "Sleight of Hand", "Stealth"] },
        Sorcerer: { choose: 2, skills: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"] },
        Warlock: { choose: 2, skills: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"] },
        Wizard: { choose: 2, skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Nature", "Religion"] }
    };

    const state = {
        chosenRace: null,
        chosenSubrace: null,
        chosenClass: null,
        chosenBackground: null,

        lockedSkills: new Set(),
        selectedSkills: new Set(),
        selectedOptional: new Set(),
        expertiseSkills: new Set(),

        totalChoices: 0,
        extraAnyChoices: 0,
        raceAnyChoices: 0,
        raceRestrictedChoices: 0,

        abilityTotals: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        abilityMods: { str: null, dex: null, con: null, int: null, wis: null, cha: null }
    };

    function safeParse(json) {
        try {
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    function modifierFromTotal(total) {
        return Math.floor((total - 10) / 2);
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
            const base = Number(scores[k] ?? scores[k.toUpperCase()] ?? scores[k[0].toUpperCase() + k.slice(1)] ?? 0);
            const bonus = Number(bonuses[k] ?? bonuses[k.toUpperCase()] ?? bonuses[k[0].toUpperCase() + k.slice(1)] ?? 0);
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

    function loadAndApplyAbilitySource() {
        const source = localStorage.getItem(STORAGE_KEYS.lastAbilitySource) || "point_buy";

        const backLink = document.getElementById("back");
        if (backLink) {
            backLink.href = source === "roll_stats" ? "roll_stats.html" : "point_buy.html";
        }

        const totals =
            source === "roll_stats"
                ? loadAbilityTotalsFromRollStats()
                : loadAbilityTotalsFromPointBuy();

        if (!totals) {
            return;
        }

        for (const a of ABILITIES) {
            state.abilityTotals[a] = totals[a];
            state.abilityMods[a] = totals[a] === null ? null : modifierFromTotal(totals[a]);
        }
    }

    function setAbilityTileUI(ability) {
        const scoreEl = document.getElementById(`score-${ability}`);
        const modEl = document.getElementById(`mod-${ability}`);

        const total = state.abilityTotals[ability];
        const mod = state.abilityMods[ability];

        scoreEl.textContent = total === null ? "—" : String(total);

        if (mod === null) {
            modEl.textContent = "";
        } else {
            modEl.textContent = `Mod: ${mod >= 0 ? "+" : ""}${mod}`;
        }
    }

    function renderAbilityTiles() {
        for (const a of ABILITIES) {
            setAbilityTileUI(a);
        }
    }

    function joinWithOr(items) {
        if (!items || items.length === 0) {
            return "";
        }
        if (items.length === 1) {
            return items[0];
        }
        if (items.length === 2) {
            return `${items[0]} or ${items[1]}`;
        }
        return `${items.slice(0, -1).join(", ")}, or ${items[items.length - 1]}`;
    }

    function joinWithAnd(items) {
        if (!items || items.length === 0) {
            return "";
        }
        if (items.length === 1) {
            return items[0];
        }
        if (items.length === 2) {
            return `${items[0]} and ${items[1]}`;
        }
        return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
    }

    function backgroundArticle(backgroundName) {
        const useAn = new Set(["Acolyte", "Artisan", "Entertainer", "Outlander", "Urchin"]);
        return useAn.has(backgroundName) ? "an" : "a";
    }

    function raceArticle(raceName) {
        return raceName === "Elf" ? "an" : "a";
    }

    function buildSubtitle() {
        const chosenClass = state.chosenClass || "Unknown class";
        const chosenRace = state.chosenRace || "Unknown race";
        const chosenSubrace = state.chosenSubrace || null;
        const chosenBackground = state.chosenBackground || "Unknown background";

        const classRule = CLASS_RULES[chosenClass];
        const classChoose = classRule ? classRule.choose : 0;

        let classSkillText = "";
        if (classRule) {
            if (classRule.skills === "ANY") {
                classSkillText = "any skills";
            } else {
                classSkillText = joinWithOr(classRule.skills);
            }
        }

        const line1 = `You are a ${chosenClass}. You may select ${classChoose} skills from ${classSkillText}.`;

        let line2 = "";

        if (chosenRace === "Elf" && chosenSubrace) {
            line2 = `You are a ${chosenSubrace}. You may select 1 skill from Insight, Perception, or Survival.`;
        } else {
            let raceDetail = `You are a ${chosenRace}`;
            if (chosenSubrace) {
                raceDetail += ` (${chosenSubrace})`;
            }
            raceDetail += ".";

            if (chosenRace === "Human") {
                raceDetail += " You may select any 1 additional skill.";
            } else if (chosenRace === "Elf") {
                raceDetail += " You may select 1 skill from Insight, Perception, or Survival.";
            }

            line2 = raceDetail;
        }

        const bgSkills = BACKGROUND_SKILLS[chosenBackground] || [];
        const bgSkillsText = joinWithAnd(bgSkills);
        const aOrAnBg = backgroundArticle(chosenBackground);

        let line3 = `You were ${aOrAnBg} ${chosenBackground}. You are already proficient at ${bgSkillsText}.`;

        if (BACKGROUND_EXTRA_ANY.has(chosenBackground)) {
            line3 += " You may also select any 3 additional skills.";
        }

        return `${line1}\n${line2}\n${line3}`;
    }

    function getClassAllowedSkills() {
        if (!state.chosenClass || !CLASS_RULES[state.chosenClass]) {
            return new Set();
        }

        const rule = CLASS_RULES[state.chosenClass];
        if (rule.skills === "ANY") {
            return new Set(SKILLS.map((s) => s.name));
        }

        return new Set(rule.skills);
    }

    function computeChoiceCounts() {
        const classRule = CLASS_RULES[state.chosenClass];
        const classChoose = classRule ? classRule.choose : 0;

        const bgExtraAny = BACKGROUND_EXTRA_ANY.has(state.chosenBackground) ? 3 : 0;

        let raceAny = 0;
        let raceRestricted = 0;

        if (state.chosenRace === "Human") {
            raceAny = 1;
        }
        if (state.chosenRace === "Elf") {
            raceRestricted = 1;
        }

        state.extraAnyChoices = bgExtraAny;
        state.raceAnyChoices = raceAny;
        state.raceRestrictedChoices = raceRestricted;

        state.totalChoices = classChoose + bgExtraAny + raceAny + raceRestricted;
    }

    function loadSkillsState() {
        const raw = localStorage.getItem(STORAGE_KEYS.skillsState);
        const saved = raw ? safeParse(raw) : null;

        if (!saved) {
            return;
        }

        if (Array.isArray(saved.selectedOptional)) {
            state.selectedOptional = new Set(saved.selectedOptional);
        }

        if (Array.isArray(saved.expertiseSkills)) {
            state.expertiseSkills = new Set(saved.expertiseSkills);
        }
    }

    function saveSkillsState() {
        localStorage.setItem(STORAGE_KEYS.skillsState, JSON.stringify({
            selectedOptional: Array.from(state.selectedOptional),
            expertiseSkills: Array.from(state.expertiseSkills)
        }));
    }


    function rebuildSelectedSkills() {
        state.selectedSkills = new Set([...state.lockedSkills, ...state.selectedOptional]);
    }

    function isRogue() {
        return state.chosenClass === "Rogue";
    }

    function sanitizeExpertise() {
        if (!isRogue()) {
            state.expertiseSkills = new Set();
            return;
        }

        const cleaned = [];
        for (const s of state.expertiseSkills) {
            if (state.selectedSkills.has(s)) {
                cleaned.push(s);
            }
        }

        state.expertiseSkills = new Set(cleaned.slice(0, MAX_EXPERTISE));
    }

    function skillTotalModifier(skillName, abilityKey) {
        const base = Number.isFinite(state.abilityMods[abilityKey]) ? state.abilityMods[abilityKey] : 0;

        let total = base;

        if (state.selectedSkills.has(skillName)) {
            total += PROF_BONUS;
        }

        if (state.expertiseSkills.has(skillName)) {
            total += PROF_BONUS;
        }

        return total;
    }

    function getOptionalUsedCount() {
        return state.selectedOptional.size;
    }

    function countOutsideClassSelected(classAllowed) {
        let outside = 0;
        for (const s of state.selectedOptional) {
            if (!classAllowed.has(s)) {
                outside += 1;
            }
        }
        return outside;
    }

    function countOutsideClassElfSelected(classAllowed) {
        let count = 0;
        for (const s of state.selectedOptional) {
            if (!classAllowed.has(s) && ELF_BONUS_SKILLS.has(s)) {
                count += 1;
            }
        }
        return count;
    }

    function countOutsideClassNonElfSelected(classAllowed) {
        let count = 0;
        for (const s of state.selectedOptional) {
            if (!classAllowed.has(s) && !ELF_BONUS_SKILLS.has(s)) {
                count += 1;
            }
        }
        return count;
    }

    function usedAnyOutsideCount(classAllowed) {
        const elfOutside = countOutsideClassElfSelected(classAllowed);
        const nonElfOutside = countOutsideClassNonElfSelected(classAllowed);
        const elfFree = state.raceRestrictedChoices; // usually 0 or 1
        const elfOverflow = Math.max(0, elfOutside - elfFree);

        return nonElfOutside + elfOverflow;
    }

    function canSelectSkill(skillName, classAllowed) {
        if (state.lockedSkills.has(skillName)) {
            return false;
        }

        if (state.selectedOptional.has(skillName)) {
            return true;
        }

        if (getOptionalUsedCount() >= state.totalChoices) {
            return false;
        }

        if (classAllowed.has(skillName)) {
            return true;
        }

        const anyOutsideAllowance = state.extraAnyChoices + state.raceAnyChoices;
        const elfFree = state.raceRestrictedChoices;

        const usedAny = usedAnyOutsideCount(classAllowed);
        const usedElfOutside = countOutsideClassElfSelected(classAllowed);

        const isElfSkill = ELF_BONUS_SKILLS.has(skillName);

        if (isElfSkill && elfFree > 0 && usedElfOutside < elfFree) {
            return true;
        }

        return usedAny < anyOutsideAllowance;
    }

    function shouldGreyOutSkill(skillName, classAllowed) {
        if (state.lockedSkills.has(skillName)) {
            return false;
        }

        if (state.selectedOptional.has(skillName)) {
            return false;
        }

        if (getOptionalUsedCount() >= state.totalChoices) {
            return true;
        }

        if (classAllowed.has(skillName)) {
            return false;
        }

        const anyOutsideAllowance = state.extraAnyChoices + state.raceAnyChoices;
        const elfFree = state.raceRestrictedChoices;

        const usedAny = usedAnyOutsideCount(classAllowed);
        const usedElfOutside = countOutsideClassElfSelected(classAllowed);

        const isElfSkill = ELF_BONUS_SKILLS.has(skillName);

        if (isElfSkill && elfFree > 0 && usedElfOutside < elfFree) {
            return false;
        }

        return usedAny >= anyOutsideAllowance;
    }


    function formatSkillLine(skillName, abilityKey) {
        const mod = skillTotalModifier(skillName, abilityKey);
        const sign = mod >= 0 ? "+" : "";
        return `${skillName} ${sign}${mod}`;
    }


    function renderSkillsUI() {
        const classAllowed = getClassAllowedSkills();

        const choicesText = document.getElementById("choices-text");
        const used = getOptionalUsedCount();
        const total = state.totalChoices;
        choicesText.textContent = `Selections: ${used}/${total}`;

        const subtitle = document.getElementById("skills-subtitle");
        subtitle.textContent = buildSubtitle();

        const finishBtn = document.getElementById("finish");
        const expertiseComplete = !isRogue() || state.expertiseSkills.size === MAX_EXPERTISE;
        finishBtn.disabled = !(used === total && expertiseComplete);

        if (finishBtn) {
            finishBtn.addEventListener("click", () => {
                if (finishBtn.disabled) {
                    return;
                }
                window.location.href = "character_details.html";
            });
        }

        const lists = document.querySelectorAll(".skill-list[data-skill-ability]");
        for (const list of lists) {
            list.textContent = "";
        }

        for (const skill of SKILLS) {
            const list = document.querySelector(`.skill-list[data-skill-ability="${skill.ability}"]`);
            if (!list) {
                continue;
            }

            const item = document.createElement("div");
            item.className = "skill-item";
            item.dataset.skill = skill.name;

            const isLocked = state.lockedSkills.has(skill.name);
            const isChecked = state.selectedSkills.has(skill.name);

            item.dataset.locked = isLocked ? "true" : "false";

            const isDisabledByRules = !canSelectSkill(skill.name, classAllowed) && !isChecked;
            const shouldGrey = shouldGreyOutSkill(skill.name, classAllowed) && !isChecked;

            if (shouldGrey || isDisabledByRules) {
                item.classList.add("is-disabled");
            }

            const mainRow = document.createElement("div");
            mainRow.className = "skill-main-row";

            const input = document.createElement("input");
            input.type = "checkbox";
            input.className = "skill-check";
            input.dataset.skill = skill.name;
            input.checked = isChecked;

            if (!isLocked && isDisabledByRules) {
                input.disabled = true;
            }

            const label = document.createElement("label");
            label.className = "skill-label";
            label.textContent = formatSkillLine(skill.name, skill.ability);

            mainRow.appendChild(input);
            mainRow.appendChild(label);
            item.appendChild(mainRow);

            if (isRogue() && isChecked) {
                const expertiseSelected = state.expertiseSkills.has(skill.name);
                const canShowOtherExpertise = state.expertiseSkills.size < MAX_EXPERTISE;

                if (expertiseSelected || canShowOtherExpertise) {
                    const exRow = document.createElement("div");
                    exRow.className = "skill-expertise-row";
                    exRow.dataset.skill = skill.name;

                    const exInput = document.createElement("input");
                    exInput.type = "checkbox";
                    exInput.className = "expertise-check";
                    exInput.dataset.skill = skill.name;
                    exInput.checked = expertiseSelected;

                    const exLabel = document.createElement("label");
                    exLabel.className = "expertise-label";
                    exLabel.textContent = "Expert?";

                    exRow.appendChild(exInput);
                    exRow.appendChild(exLabel);
                    item.appendChild(exRow);
                }
            }

            list.appendChild(item)
        }
    }

    function handleSkillClick(event) {
        const item = event.target.closest(".skill-item");
        if (!item) {
            return;
        }

        const skillName = item.dataset.skill;
        const isLocked = item.dataset.locked === "true";
        const input = item.querySelector(".skill-check");

        if (!skillName || !input) {
            return;
        }

        if (isLocked) {
            event.preventDefault();
            event.stopPropagation();
            input.checked = true;
            return;
        }

        const classAllowed = getClassAllowedSkills();

        if (state.selectedOptional.has(skillName)) {
            state.selectedOptional.delete(skillName);
            state.expertiseSkills.delete(skillName);

            rebuildSelectedSkills();
            sanitizeExpertise();
            saveSkillsState();
            renderSkillsUI();
            return;
        }

        if (!canSelectSkill(skillName, classAllowed)) {
            event.preventDefault();
            input.checked = false;
            return;
        }

        state.selectedOptional.add(skillName);
        rebuildSelectedSkills();
        saveSkillsState();
        renderSkillsUI();
    }

    function handleExpertiseClick(event) {
        const exRow = event.target.closest(".skill-expertise-row");
        if (!exRow) {
            return;
        }

        const skillName = exRow.dataset.skill;
        if (!skillName) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (!isRogue() || !state.selectedSkills.has(skillName)) {
            return;
        }

        if (state.expertiseSkills.has(skillName)) {
            state.expertiseSkills.delete(skillName);
        } else {
            if (state.expertiseSkills.size >= MAX_EXPERTISE) {
                return;
            }
            state.expertiseSkills.add(skillName);
        }

        saveSkillsState();
        renderSkillsUI();
    }


    function initLockedBackgroundSkills() {
        state.lockedSkills = new Set(BACKGROUND_SKILLS[state.chosenBackground] || []);
    }

    function sanitizeSavedOptionalSkills() {
        const allSkillNames = new Set(SKILLS.map((s) => s.name));
        const cleaned = [];

        for (const s of state.selectedOptional) {
            if (!allSkillNames.has(s)) {
                continue;
            }

            if (state.lockedSkills.has(s)) {
                continue;
            }

            cleaned.push(s);
        }

        state.selectedOptional = new Set(cleaned);
        rebuildSelectedSkills();

        const classAllowed = getClassAllowedSkills();

        while (state.selectedOptional.size > state.totalChoices) {
            const first = state.selectedOptional.values().next().value;
            state.selectedOptional.delete(first);
        }

        const anyOutsideAllowance = state.extraAnyChoices + state.raceAnyChoices;
        const elfFree = state.raceRestrictedChoices;

        while (usedAnyOutsideCount(classAllowed) > anyOutsideAllowance) {
            let removed = false;

            for (const s of state.selectedOptional) {
                if (!classAllowed.has(s) && !ELF_BONUS_SKILLS.has(s)) {
                    state.selectedOptional.delete(s);
                    removed = true;
                    break;
                }
            }

            if (removed) {
                continue;
            }

            const elfOutside = countOutsideClassElfSelected(classAllowed);
            if (elfOutside > elfFree) {
                for (const s of state.selectedOptional) {
                    if (!classAllowed.has(s) && ELF_BONUS_SKILLS.has(s)) {
                        state.selectedOptional.delete(s);
                        removed = true;
                        break;
                    }
                }
            }

            if (!removed) {
                break;
            }
        }

        rebuildSelectedSkills();
        saveSkillsState();
    }

    function init() {
        state.chosenClass = localStorage.getItem(STORAGE_KEYS.selectedClass);
        state.chosenBackground = localStorage.getItem(STORAGE_KEYS.selectedBackground);
        state.chosenRace = localStorage.getItem(STORAGE_KEYS.selectedRace);
        state.chosenSubrace = localStorage.getItem(STORAGE_KEYS.selectedSubrace);

        computeChoiceCounts();
        initLockedBackgroundSkills();

        loadSkillsState();
        rebuildSelectedSkills();

        sanitizeSavedOptionalSkills();
        sanitizeExpertise();

        loadAndApplyAbilitySource();
        renderAbilityTiles();

        const root = document.querySelector(".skills-abilities");
        root.addEventListener("click", handleExpertiseClick, true);
        root.addEventListener("click", handleSkillClick, true);

        renderSkillsUI();
    }

    init();
})();
