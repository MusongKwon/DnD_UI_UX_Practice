(() => {
    const STORAGE_KEY = "ddcm_selected_background";

    let selectedBackground = null;

    function getTiles() {
        return Array.from(document.querySelectorAll(".class-tile[data-background]"));
    }

    function clearSelectedUI() {
        for (const tile of getTiles()) {
            tile.classList.remove("is-selected");
            tile.setAttribute("aria-pressed", "false");
        }
    }

    function selectTileByName(name) {
        clearSelectedUI();

        const tiles = getTiles();
        const match = tiles.find((tile) => tile.dataset.background === name);

        if (match) {
            match.classList.add("is-selected");
            match.setAttribute("aria-pressed", "true");
        }
    }

    function saveSelectedBackground(name) {
        localStorage.setItem(STORAGE_KEY, name);
    }

    function clearSavedBackground() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function loadSelectedBackground() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function handleGridClick(event) {
        const tile = event.target.closest(".class-tile[data-background]");
        if (!tile) {
            return;
        }

        const name = tile.dataset.background;

        if (selectedBackground === name) {
            selectedBackground = null;
            clearSelectedUI();
            clearSavedBackground();
            return;
        }

        selectedBackground = name;
        selectTileByName(name);
        saveSelectedBackground(name);
    }

    function handleNextClick() {
        if (!selectedBackground) {
            return;
        }

        window.location.href = "assign_ability_option.html";
    }

    function init() {
        const grid = document.querySelector(".background-grid");
        grid.addEventListener("click", handleGridClick);

        const nextBtn = document.getElementById("go-ability-options");
        nextBtn.addEventListener("click", handleNextClick);

        const saved = loadSelectedBackground();
        if (saved) {
            selectedBackground = saved;
            selectTileByName(saved);
        }
    }

    init();
})();
