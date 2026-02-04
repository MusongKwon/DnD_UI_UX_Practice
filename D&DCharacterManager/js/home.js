(() => {
    const KEYS_TO_CLEAR = [
        "ddcm_selected_race",
        "ddcm_selected_subrace",
        "ddcm_selected_class",
        "ddcm_selected_background",
        "ddcm_point_buy_state",
        "ddcm_roll_stats_state",
        "ddcm_skills_state",
        "ddcm_last_ability_source",
        "ddcm_equipped_armor",
        "ddcm_equipped_shield"
    ];

    function clearAllAppState() {
        for (const key of KEYS_TO_CLEAR) {
            localStorage.removeItem(key);
        }
    }

    function init() {
        const createBtn = document.getElementById("create-new-character");

        if (!createBtn) {
            return;
        }

        createBtn.addEventListener("click", () => {
            clearAllAppState();
        });
    }

    init();
})();
