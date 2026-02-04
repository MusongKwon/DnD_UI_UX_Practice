(() => {
    const STORAGE_KEYS = {
        selectedClass: "ddcm_selected_class",
        selectedRace: "ddcm_selected_race",
        selectedSubrace: "ddcm_selected_subrace",

        lastAbilitySource: "ddcm_last_ability_source",
        pointBuyState: "ddcm_point_buy_state",
        rollStatsState: "ddcm_roll_stats_state",

        equippedArmor: "ddcm_equipped_armor",
        equippedShield: "ddcm_equipped_shield"
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

    const ARMORS = {
        light: [
            { id: "padded", name: "Padded Armor", baseAC: 11 },
            { id: "leather", name: "Leather Armor", baseAC: 11 },
            { id: "studded_leather", name: "Studded Leather Armor", baseAC: 12 }
        ],
        medium: [
            { id: "hide", name: "Hide Armor", baseAC: 12 },
            { id: "chain_shirt", name: "Chain Shirt", baseAC: 13 },
            { id: "scale_mail", name: "Scale Mail", baseAC: 14 },
            { id: "breastplate", name: "Breastplate", baseAC: 14 },
            { id: "half_plate", name: "Half Plate Armor", baseAC: 15 }
        ],
        heavy: [
            { id: "ring_mail", name: "Ring Mail", baseAC: 14, strReq: 0 },
            { id: "chain_mail", name: "Chain Mail", baseAC: 16, strReq: 13 },
            { id: "splint", name: "Splint Armor", baseAC: 17, strReq: 15 },
            { id: "plate", name: "Plate Armor", baseAC: 18, strReq: 15 }
        ]
    };

    function safeParse(json) {
        try {
            return JSON.parse(json);
        } catch {
            return null;
        }
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

    function loadAbilityTotals() {
        const source = localStorage.getItem(STORAGE_KEYS.lastAbilitySource) || "point_buy";
        if (source === "roll_stats") {
            return loadAbilityTotalsFromRollStats();
        }
        return loadAbilityTotalsFromPointBuy();
    }

    function armorLabelText(category, armor) {
        if (category === "light") {
            return `${armor.name} (AC ${armor.baseAC} + Dex)`;
        }

        if (category === "medium") {
            return `${armor.name} (AC ${armor.baseAC} + Dex, max +2)`;
        }

        if (category === "heavy") {
            if (armor.strReq && armor.strReq > 0) {
                return `${armor.name} (AC ${armor.baseAC}, Str ${armor.strReq})`;
            }
            return `${armor.name} (AC ${armor.baseAC})`;
        }

        return armor.name;
    }

    function renderArmorSection(root, title, category, options, strengthScore, selectedArmorId, armorLocked, onArmorChosen) {
        const section = document.createElement("section");
        section.className = "equipment-section";

        const h = document.createElement("div");
        h.className = "equipment-section-title";
        h.textContent = title;

        const box = document.createElement("div");
        box.className = "equipment-box";

        for (const armor of options) {
            const item = document.createElement("div");
            item.className = "equipment-item";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = "armor";
            input.value = armor.id;

            if (selectedArmorId === armor.id) {
                input.checked = true;
            }

            let disabled = false;

            if (armorLocked) {
                disabled = true;
            }

            if (!armorLocked && category === "heavy" && armor.strReq && armor.strReq > 0) {
                if (strengthScore !== null && strengthScore < armor.strReq) {
                    disabled = true;
                }
            }

            if (disabled) {
                item.classList.add("is-disabled");
                input.disabled = true;
            }

            const label = document.createElement("label");
            label.className = "equipment-label";
            label.textContent = armorLabelText(category, armor);

            item.appendChild(input);
            item.appendChild(label);
            box.appendChild(item);

            if (!disabled) {
                let wasChecked = false;

                input.addEventListener("mousedown", () => {
                    wasChecked = input.checked;
                });

                input.addEventListener("click", () => {
                    if (wasChecked) {
                        input.checked = false;
                    } else {
                        input.checked = true;
                        onArmorChosen();
                    }
                });

                label.addEventListener("mousedown", () => {
                    wasChecked = input.checked;
                });

                label.addEventListener("click", () => {
                    if (wasChecked) {
                        input.checked = false;
                    } else {
                        input.checked = true;
                        onArmorChosen();
                    }
                });
            }
        }

        section.appendChild(h);
        section.appendChild(box);
        root.appendChild(section);
    }

    function renderShieldSection(root, canUseShield, shieldLocked, onShieldChosen) {
        if (!canUseShield) {
            return;
        }

        const section = document.createElement("section");
        section.className = "equipment-section";

        const h = document.createElement("div");
        h.className = "equipment-section-title";
        h.textContent = "Shields";

        const box = document.createElement("div");
        box.className = "equipment-box";

        const item = document.createElement("div");
        item.className = "equipment-item";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "shield";
        input.value = "shield";

        if (shieldLocked) {
            item.classList.add("is-disabled");
            input.disabled = true;
            input.checked = false;
        }

        const label = document.createElement("label");
        label.className = "equipment-label";
        label.textContent = shieldLocked
            ? "Shield (+2 AC) — already equipped"
            : "Shield (+2 AC)";

        item.appendChild(input);
        item.appendChild(label);
        box.appendChild(item);

        if (!shieldLocked) {
            let wasChecked = false;

            input.addEventListener("mousedown", () => {
                wasChecked = input.checked;
            });

            input.addEventListener("click", () => {
                if (wasChecked) {
                    input.checked = false;
                } else {
                    input.checked = true;
                    onShieldChosen();
                }
            });

            label.addEventListener("mousedown", () => {
                wasChecked = input.checked;
            });

            label.addEventListener("click", () => {
                if (wasChecked) {
                    input.checked = false;
                } else {
                    input.checked = true;
                    onShieldChosen();
                }
            });
        }

        section.appendChild(h);
        section.appendChild(box);
        root.appendChild(section);
    }


    function init() {
        const root = document.getElementById("equipment-content");
        root.textContent = "";

        const chosenClass = localStorage.getItem(STORAGE_KEYS.selectedClass) || "";
        const prof = ARMOR_PROF[chosenClass] || { light: false, medium: false, heavy: false, shield: false };

        const totals = loadAbilityTotals();
        const strengthScore = totals && Number.isFinite(totals.str) ? totals.str : null;

        const savedArmor = localStorage.getItem(STORAGE_KEYS.equippedArmor) || "";
        const armorLocked = savedArmor.length > 0;
        const savedShield = localStorage.getItem(STORAGE_KEYS.equippedShield) === "true";

        const canShowAny =
            prof.light || prof.medium || prof.heavy || prof.shield;

        if (!canShowAny) {
            return;
        }

        const clearArmorSelection = () => {
            const armorInputs = document.querySelectorAll('input[name="armor"]');
            for (const el of armorInputs) {
                el.checked = false;
            }
        };

        const clearShieldSelection = () => {
            const shieldInputs = document.querySelectorAll('input[name="shield"]');
            for (const el of shieldInputs) {
                el.checked = false;
            }
        };

        const shieldLocked = savedShield;

        if (prof.light) {
            renderArmorSection(root, "Light Armor", "light", ARMORS.light, strengthScore, savedArmor, armorLocked, clearShieldSelection);
        }

        if (prof.medium) {
            renderArmorSection(root, "Medium Armor", "medium", ARMORS.medium, strengthScore, savedArmor, armorLocked, clearShieldSelection);
        }

        if (prof.heavy) {
            renderArmorSection(root, "Heavy Armor", "heavy", ARMORS.heavy, strengthScore, savedArmor, armorLocked, clearShieldSelection);
        }

        renderShieldSection(root, prof.shield, shieldLocked, clearArmorSelection);

        const equipBtn = document.getElementById("equip");
        equipBtn.addEventListener("click", () => {
            const checkedArmor = document.querySelector('input[name="armor"]:checked');
            const checkedShield = document.querySelector('input[name="shield"]:checked');

            let nextArmor = savedArmor;
            let nextShield = savedShield;

            if (checkedArmor && !armorLocked) {
                nextArmor = checkedArmor.value;
            } else if (checkedShield && !shieldLocked) {
                nextShield = true;
            } else {
                return;
            }

            localStorage.setItem(STORAGE_KEYS.equippedArmor, nextArmor);
            localStorage.setItem(STORAGE_KEYS.equippedShield, nextShield ? "true" : "false");

            window.location.href = "character_details.html";
        });
    }

    init();
})();
