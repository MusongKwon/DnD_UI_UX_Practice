(() => {
    const STORAGE_KEY = "ddcm_selected_class";

    let selectedClass = null;

    function getTiles() {
        return Array.from(document.querySelectorAll(".class-tile"));
    }

    function clearSelectedUI() {
        for (const tile of getTiles()) {
            tile.classList.remove("is-selected");
            tile.setAttribute("aria-pressed", "false");
        }
    }

    function selectTileByClassName(className) {
        clearSelectedUI();

        const tiles = getTiles();

        const match = tiles.find((tile) => tile.dataset.class === className);

        if (match) {
            match.classList.add("is-selected");
            match.setAttribute("aria-pressed", "true");
        }
    }

    function saveSelectedClass(className) {
        localStorage.setItem(STORAGE_KEY, className);
    }

    function clearSavedClass() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function loadSelectedClass() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function handleGridClick(event) {
        const tile = event.target.closest(".class-tile");

        if (!tile) {
            return;
        }

        const className = tile.dataset.class;

        if (selectedClass === className) {
            selectedClass = null;
            clearSelectedUI();
            clearSavedClass();
            return;
        }

        selectedClass = className;
        selectTileByClassName(className);
        saveSelectedClass(className);
    }

    function handleAssignClick() {
        if (!selectedClass) {
            return;
        }

        window.location.href = "background.html";
    }

    function init() {
        const grid = document.querySelector(".class-grid");

        grid.addEventListener("click", handleGridClick);

        const assignBtn = document.getElementById("background");
        assignBtn.addEventListener("click", handleAssignClick);

        const saved = loadSelectedClass();
        if (saved) {
            selectedClass = saved;
            selectTileByClassName(saved);
        }
    }

    init();
})();
