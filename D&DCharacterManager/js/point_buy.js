(() => {
    const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
    const MAX_POINTS = 27;
    const COST_BY_SCORE = {8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9};
    const errorArea = document.getElementById("error-area");
    const pointsUsedEl = document.getElementById("points-used");
    const state = {
        scores: {str:8, dex:8, con:8, int:8, wis:8, cha:8},
        bonuses: {str: 0, dex:0, con:0, int:0, wis:0, cha:0}
    };
    const STORAGE_KEY = "ddcm_point_buy_state";
    const selectSkillsBtn = document.getElementById("select-skills");

    function savePointBuyState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            scores: state.scores,
            bonuses: state.bonuses
        }));
    }

    function loadPointBuyState() {
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

    function clearError() {
        const errorTitle = document.getElementById("error-title");
        const errorMessage = document.getElementById("error-message");

        errorMessage.textContent = "";
        errorArea.classList.remove("has-error");
    }

    function setError(message) {
        const errorTitle = document.getElementById("error-title");
        const errorMessage = document.getElementById("error-message");

        errorMessage.textContent = message;
        errorArea.classList.add("has-error");
    }

    function getCostForScore(score) {
        return COST_BY_SCORE[score];
    }

    function getTotalPointsUsed() {
        let total = 0;

        for (const ability of ABILITIES) {
            total += getCostForScore(state.scores[ability]);
        }

        return total;
    }

    function getTotalScore(ability) {
        return state.scores[ability] + state.bonuses[ability];
    }

    function getModifierFromTotal(totalScore) {
        return Math.floor((totalScore - 10) / 2);
    }

    function getBonusCounts() {
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

        return {ones, twos};
    }

    function isBonusSelectionComplete() {
        const { ones, twos } = getBonusCounts();

        return (twos === 1 && ones === 1) || (twos === 0 && ones === 3);
    }

    function canProceedToSkills() {
        return getTotalPointsUsed() >= 26 && isBonusSelectionComplete();
    }

    function updateSelectSkillsButton() {
        if (!selectSkillsBtn) {
            return;
        }
        selectSkillsBtn.disabled = !canProceedToSkills();
    }

    function canIncreaseBonus(ability) {
        const current = state.bonuses[ability];

        if (current >= 2) {
            return {ok: false, error: "The Maximum Background Bonus is 2"};
        }

        const proposed = current + 1;
        const {ones, twos} = getBonusCounts();

        if (twos === 0 && ones === 3 && proposed >= 1) {
            return {ok: false, error: "You already have Background Bonus in three Abilities"};
        }

        if (twos === 1) {
            if (proposed === 1 && current === 0 && ones === 1) {
                return {ok: false, error: "You may have only have Background Bonus to two Abilities if one of the Background Bonus is 2"};
            }

            if (proposed === 2 && current === 1 && twos === 1) {
                return {ok: false, error: "You may have only have one Background Bonus of 2"};
            }
        }

        return {ok: true};
    }

    function renderAbilityRow(ability) {
        const scoreEl = document.querySelector(`[data-ability="${ability}"][data-field="score"]`);
        const bonusEl = document.querySelector(`[data-ability="${ability}"][data-field="bonus"]`);
        const totalEl = document.querySelector(`[data-ability="${ability}"][data-field="total"]`);
        const modEl = document.querySelector(`[data-ability="${ability}"][data-field="mod"]`);
        const costEl = document.querySelector(`[data-ability="${ability}"][data-field="cost"]`);
        
        scoreEl.textContent = String(state.scores[ability]);
        bonusEl.textContent = String(state.bonuses[ability]);

        const total = getTotalScore(ability)

        totalEl.textContent = String(total);

        const mod = getModifierFromTotal(total);
        modEl.textContent = String(mod);

        const cost = getCostForScore(state.scores[ability]);
        costEl.textContent = String(cost);
    }

    function renderAll() {
        for (const ability of ABILITIES) {
            renderAbilityRow(ability);
        }

        const totalUsed = getTotalPointsUsed();
        pointsUsedEl.textContent = String(totalUsed);

        savePointBuyState(state);
        updateSelectSkillsButton();
    }

    function handleScoreUp(ability) {
        const current = state.scores[ability];

        if (current >= 15) {
            setError("The Maximum Ability Score is 15");
            return;
        }

        const increaseCost = current >= 13 ? 2:1;
        const usedBefore = getTotalPointsUsed();

        if (usedBefore + increaseCost > MAX_POINTS) {
            setError("You do not have sufficient amount of Points left");
            return;
        }

        state.scores[ability] = current + 1;
    }

    function handleScoreDown(ability) {
        const current = state.scores[ability];

        if (current <= 8) {
            setError("The Minimum Ability Score is 8");
            return;
        }

        state.scores[ability] = current - 1;
    }

    function handleBonusUp(ability) {
        const check = canIncreaseBonus(ability);

        if (!check.ok) {
            if (check.error) {
                setError(check.error);
            }
            return;
        }

        state.bonuses[ability] += 1;
    }

    function handleBonusDown(ability) {
        const current = state.bonuses[ability];

        if (current <= 0) {
            setError("The Minimum Background Bonus is 0");
            return;
        }

        state.bonuses[ability] = current - 1;
    }

    function handleTableClick(event) {
        const btn = event.target.closest("button");

        if (!btn) {
            return;
        }

        const action = btn.dataset.action;
        const ability = btn.dataset.ability;

        if (!action || !ability) {
            return;
        }

        clearError();

        if (action === "score-up") {
            handleScoreUp(ability);
        } else if (action === "score-down") {
            handleScoreDown(ability);
        } else if (action === "bonus-up") {
            handleBonusUp(ability);
        } else if (action === "bonus-down") {
            handleBonusDown(ability);
        }

        renderAll();
    }

    function resetScores() {
        for (const ability of ABILITIES) {
            state.scores[ability] = 8;
        }

        clearError();
        renderAll();
    }

    function resetBonuses() {
        for (const ability of ABILITIES) {
            state.bonuses[ability] = 0;
        }

        clearError();
        renderAll();
    }

    function init() {
        const table = document.querySelector(".pointbuy-table");

        table.addEventListener("click", handleTableClick);

        const resetScoresBtn = document.getElementById("reset-scores");

        resetScoresBtn.addEventListener("click", resetScores);

        const resetBonusesBtn = document.getElementById("reset-bonuses");

        resetBonusesBtn.addEventListener("click", resetBonuses);

        const saved = loadPointBuyState();
        if (saved && saved.scores && saved.bonuses) {
            state.scores = saved.scores;
            state.bonuses = saved.bonuses;
        }

        const subtitleEl = document.getElementById("class-subtitle");
        if (subtitleEl && window.DDCM && window.DDCM.buildClassSubtitle) {
            subtitleEl.textContent = window.DDCM.buildClassSubtitle();
        }

        if (selectSkillsBtn) {
            selectSkillsBtn.addEventListener("click", () => {
                if (!canProceedToSkills()) {
                    return;
                }

                localStorage.setItem("ddcm_last_ability_source", "point_buy");
                window.location.href = "skills.html";
            });
        }

        savePointBuyState(state);
        renderAll();
    }

    init();
})();