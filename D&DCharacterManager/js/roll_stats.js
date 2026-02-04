(() => {
    const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
    const rollBtn = document.getElementById("roll-btn");
    const rollCountEl = document.getElementById("roll-count");
    const diceEls = [
        document.getElementById("die-0"),
        document.getElementById("die-1"),
        document.getElementById("die-2"),
        document.getElementById("die-3")
    ];
    const POOL_POS_BY_ROLL_INDEX = [6, 1, 8, 3, 10, 5];
    const state = {
        rolls: [],
        poolUsedBy: {},
        assignedPoolIndex: {
            str: null, dex: null, con: null, int: null, wis: null, cha: null
        },
        bonuses: {
            str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0
        },
        selectedPoolIndex: null,
        selectedAbility: null,
        rolling: false
    };
    const STORAGE_KEY = "ddcm_roll_stats_state";
    const selectSkillsBtn = document.getElementById("select-skills");

    function saveRollStatsState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            rolls: state.rolls,
            poolUsedBy: state.poolUsedBy,
            assignedPoolIndex: state.assignedPoolIndex,
            bonuses: state.bonuses
        }));
    }

    function loadRollStatsState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = randInt(0, i);
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function clearDiceUI() {
        for (const el of diceEls) {
            el.textContent = "—";
            el.classList.remove("dropped");
        }
    }

    function setRollCountUI() {
        rollCountEl.textContent = `Rolls: ${state.rolls.length}/6`;
    }

    function modifierFromTotal(total) {
        return Math.floor((total - 10) / 2);
    }

    function getAssignedBase(ability) {
        const poolIndex = state.assignedPoolIndex[ability];
        if (poolIndex === null) {
            return null;
        }
        return state.rolls[poolIndex];
    }

    function renderAbility(ability) {
        const numberEl = document.querySelector(`[data-ability="${ability}"][data-field="number"]`);
        const modEl = document.querySelector(`[data-ability="${ability}"][data-field="mod"]`);
        const undoBtn = document.querySelector(`.btn-undo[data-ability="${ability}"]`);

        const base = getAssignedBase(ability);
        const bonus = state.bonuses[ability];

        if (base === null) {
            numberEl.textContent = "—";
            modEl.textContent = "";
            undoBtn.hidden = true;
            return;
        }

        const total = base + bonus;
        const mod = modifierFromTotal(total);

        numberEl.textContent = String(total);
        modEl.textContent = `Mod: ${mod >= 0 ? "+" : ""}${mod}`;
        undoBtn.hidden = false;
    }

    function renderAllAbilities() {
        for (const ability of ABILITIES) {
            renderAbility(ability);
        }
    }

    function clearSelectionsUI() {
        const poolButtons = document.querySelectorAll(".pool-number");
        for (const btn of poolButtons) {
            btn.classList.remove("is-selected");
        }

        const abilityTiles = document.querySelectorAll(".ability-tile");
        for (const tile of abilityTiles) {
            tile.classList.remove("is-selected");
        }
    }

    function setSelectedPool(indexOrNull) {
        state.selectedPoolIndex = indexOrNull;
        clearSelectionsUI();

        if (indexOrNull !== null) {
            const btn = document.querySelector(`.pool-number[data-pool-index="${indexOrNull}"]`);
            if (btn) {
                btn.classList.add("is-selected");
            }
        }

        if (state.selectedAbility !== null) {
            const tile = document.querySelector(`.ability-tile[data-ability="${state.selectedAbility}"]`);
            if (tile) {
                tile.classList.add("is-selected");
            }
        }
    }

    function setSelectedAbility(abilityOrNull) {
        state.selectedAbility = abilityOrNull;
        clearSelectionsUI();

        if (state.selectedPoolIndex !== null) {
            const btn = document.querySelector(`.pool-number[data-pool-index="${state.selectedPoolIndex}"]`);
            if (btn) {
                btn.classList.add("is-selected");
            }
        }

        if (abilityOrNull !== null) {
            const tile = document.querySelector(`.ability-tile[data-ability="${abilityOrNull}"]`);
            if (tile) {
                tile.classList.add("is-selected");
            }
        }
    }

    function assignPoolToAbility(poolIndex, ability) {
        if (state.poolUsedBy[poolIndex]) {
            return;
        }

        if (state.assignedPoolIndex[ability] !== null) {
            return;
        }

        state.poolUsedBy[poolIndex] = ability;
        state.assignedPoolIndex[ability] = poolIndex;

        saveRollStatsState(state);

        const btn = document.querySelector(`.pool-number[data-pool-index="${poolIndex}"]`);
        if (btn) {
            btn.classList.add("is-used");
        }

        renderAbility(ability);
        setSelectedPool(null);
        setSelectedAbility(null);
        updateSelectSkillsButton();
    }

    function undoAbility(ability) {
        const poolIndex = state.assignedPoolIndex[ability];
        if (poolIndex === null) {
            return;
        }

        delete state.poolUsedBy[poolIndex];
        state.assignedPoolIndex[ability] = null;

        saveRollStatsState(state);
        
        const btn = document.querySelector(`.pool-number[data-pool-index="${poolIndex}"]`);
        if (btn) {
            btn.classList.remove("is-used");
        }

        renderAbility(ability);
        setSelectedPool(null);
        setSelectedAbility(null);
        updateSelectSkillsButton();
    }

    function bonusCounts() {
        let ones = 0;
        let twos = 0;

        for (const ability of ABILITIES) {
            if (state.bonuses[ability] === 1) {
                ones += 1;
            }
            if (state.bonuses[ability] === 2) {
                twos += 1;
            }
        }

        return { ones, twos };
    }

    function isBonusStateValid() {
        const { ones, twos } = bonusCounts();

        if (twos > 1) {
            return false;
        }

        if (ones > 3) {
            return false;
        }

        if (twos === 1 && ones > 1) {
            return false;
        }

        if (ones === 3 && twos !== 0) {
            return false;
        }

        return true;
    }

    function isBonusSelectionComplete() {
        const { ones, twos } = bonusCounts();

        return (twos === 1 && ones === 1) || (twos === 0 && ones === 3);
    }

    function allAbilitiesAssigned() {
        for (const ability of ABILITIES) {
            if (state.assignedPoolIndex[ability] === null) {
                return false;
            }
        }
        return true;
    }

    function canProceedToSkills() {
        return allAbilitiesAssigned() && isBonusSelectionComplete();
    }

    function updateSelectSkillsButton() {
        if (!selectSkillsBtn) {
            return;
        }
        selectSkillsBtn.disabled = !canProceedToSkills();
    }

    function enforceBonusOptionDisabling() {
        const { ones, twos } = bonusCounts();

        const selects = document.querySelectorAll(".ability-bonus");
        for (const sel of selects) {
            const ability = sel.dataset.ability;

            const optDefault = sel.querySelector('option[value="0"]');
            const opt2 = sel.querySelector('option[value="2"]');
            const opt1 = sel.querySelector('option[value="1"]');

            optDefault.disabled = false;

            opt2.disabled = false;
            opt1.disabled = false;

            if (ones === 3) {
                if (state.bonuses[ability] === 0) {
                    opt1.disabled = true;
                    opt2.disabled = true;
                } else {
                    opt2.disabled = true;
                }
            }

            if (twos === 1) {
                if (state.bonuses[ability] !== 2) {
                    opt2.disabled = true;
                }

                if (ones === 1) {
                    if (state.bonuses[ability] === 0) {
                        opt1.disabled = true;
                        opt2.disabled = true;
                    }
                }
            }
        }
    }

    function handleBonusChange(event) {
        const sel = event.target.closest(".ability-bonus");
        if (!sel) {
            return;
        }

        const ability = sel.dataset.ability;
        const prev = state.bonuses[ability];
        const next = Number(sel.value);

        state.bonuses[ability] = next;

        if (!isBonusStateValid()) {
            state.bonuses[ability] = prev;
            sel.value = String(prev);
            enforceBonusOptionDisabling();
            renderAbility(ability);
            return;
        }

        saveRollStatsState(state);
        
        enforceBonusOptionDisabling();
        renderAbility(ability);
        updateSelectSkillsButton();
    }

    function syncBonusDropdownsFromState() {
        const selects = document.querySelectorAll(".ability-bonus");

        for (const sel of selects) {
            const ability = sel.dataset.ability;

            sel.value = String(state.bonuses[ability] ?? 0);
        }
    }

    function renderPool() {
        for (let i = 0; i < 6; i += 1) {
            const pos = POOL_POS_BY_ROLL_INDEX[i];
            const cell = document.querySelector(`.pool-cell[data-pool-pos="${pos}"]`);

            cell.textContent = "";

            if (i < state.rolls.length) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "pool-number";
                btn.dataset.poolIndex = String(i);
                btn.textContent = String(state.rolls[i]);

                if (state.poolUsedBy[i]) {
                    btn.classList.add("is-used");
                }

                cell.appendChild(btn);
            }
        }

        for (let pos = 0; pos < 12; pos += 1) {
            const isUsedPos = POOL_POS_BY_ROLL_INDEX.includes(pos);
            if (!isUsedPos) {
                const cell = document.querySelector(`.pool-cell[data-pool-pos="${pos}"]`);
                cell.textContent = "";
            }
        }
    }

    function handlePoolClick(event) {
        const btn = event.target.closest(".pool-number");
        if (!btn) {
            return;
        }

        const poolIndex = Number(btn.dataset.poolIndex);

        if (state.poolUsedBy[poolIndex]) {
            return;
        }

        if (state.selectedPoolIndex === poolIndex) {
            setSelectedPool(null);
            return;
        }

        setSelectedPool(poolIndex);

        if (state.selectedAbility !== null) {
            assignPoolToAbility(poolIndex, state.selectedAbility);
        }
    }

    function handleAbilityClick(event) {
        const tile = event.target.closest(".ability-tile");
        if (!tile) {
            return;
        }

        const ability = tile.dataset.ability;

        if (state.selectedAbility === ability) {
            setSelectedAbility(null);
            return;
        }

        setSelectedAbility(ability);

        if (state.selectedPoolIndex !== null) {
            assignPoolToAbility(state.selectedPoolIndex, ability);
        }
    }

    function handleUndoClick(event) {
        const btn = event.target.closest(".btn-undo");
        if (!btn) {
            return;
        }

        const ability = btn.dataset.ability;
        undoAbility(ability);
    }

    function dropLowestIndex(values) {
        let minVal = values[0];
        let minIdx = 0;

        for (let i = 1; i < values.length; i += 1) {
            if (values[i] < minVal) {
                minVal = values[i];
                minIdx = i;
            }
        }

        return minIdx;
    }

    function setDiceValues(values) {
        for (let i = 0; i < 4; i += 1) {
            diceEls[i].textContent = String(values[i]);
        }
    }

    function rollAnimation() {
        if (state.rolling) {
            return;
        }

        if (state.rolls.length >= 6) {
            return;
        }

        state.rolling = true;
        rollBtn.disabled = true;

        clearDiceUI();

        let finalValues = [1, 1, 1, 1];

        const intervalMs = 100;
        const durationMs = 1250;
        const ticks = durationMs / intervalMs;

        let tickCount = 0;

        const intervalId = setInterval(() => {
            tickCount += 1;

            const values = [
                randInt(1, 6),
                randInt(1, 6),
                randInt(1, 6),
                randInt(1, 6)
            ];

            shuffle(values);

            setDiceValues(values);
            finalValues = values;

            if (tickCount >= ticks) {
                clearInterval(intervalId);

                setTimeout(() => {
                    const dropIdx = dropLowestIndex(finalValues);
                    diceEls[dropIdx].classList.add("dropped");

                    const sum =
                        finalValues.reduce((acc, v, idx) => {
                            if (idx === dropIdx) {
                                return acc;
                            }
                            return acc + v;
                        }, 0);

                    state.rolls.push(sum);
                    saveRollStatsState(state);

                    setRollCountUI();
                    renderPool();

                    state.rolling = false;

                    if (state.rolls.length < 6) {
                        rollBtn.disabled = false;
                    }
                }, 500);
            }
        }, intervalMs);
    }

    function init() {
        const saved = loadRollStatsState();
        if (saved) {
            state.rolls = Array.isArray(saved.rolls) ? saved.rolls : [];
            state.poolUsedBy = saved.poolUsedBy || {};
            state.assignedPoolIndex = saved.assignedPoolIndex || state.assignedPoolIndex;
            state.bonuses = saved.bonuses || state.bonuses;
        }

        const subtitleEl = document.getElementById("class-subtitle");
        if (subtitleEl && window.DDCM && window.DDCM.buildClassSubtitle) {
            subtitleEl.textContent = window.DDCM.buildClassSubtitle();
        }

        updateSelectSkillsButton();
        if (selectSkillsBtn) {
            selectSkillsBtn.addEventListener("click", () => {
                if (!canProceedToSkills()) {
                    return;
                }

                localStorage.setItem("ddcm_last_ability_source", "roll_stats");
                window.location.href = "skills.html";
            });
        }

        syncBonusDropdownsFromState();
        setRollCountUI();
        clearDiceUI();
        renderPool();
        renderAllAbilities();
        enforceBonusOptionDisabling();

        rollBtn.addEventListener("click", rollAnimation);

        const poolGrid = document.getElementById("pool-grid");
        poolGrid.addEventListener("click", handlePoolClick);

        const abilityAssign = document.querySelector(".ability-assign");
        abilityAssign.addEventListener("click", handleAbilityClick);
        abilityAssign.addEventListener("click", handleUndoClick);

        const selects = document.querySelectorAll(".ability-bonus");
        for (const sel of selects) {
            sel.addEventListener("change", handleBonusChange);
        }
    }

    init();
})();
