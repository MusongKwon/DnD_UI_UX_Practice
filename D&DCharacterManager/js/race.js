(() => {
    const STORAGE_RACE = "ddcm_selected_race";
    const STORAGE_SUBRACE = "ddcm_selected_subrace";

    const SUBRACES = {
        Dragonborn: [
            "Black Dragonborn",
            "Blue Dragonborn",
            "Brass Dragonborn",
            "Bronze Dragonborn",
            "Copper Dragonborn",
            "Gold Dragonborn",
            "Green Dragonborn",
            "Red Dragonborn",
            "Silver Dragonborn",
            "White Dragonborn"
        ],
        Elf: ["Drow", "High Elf", "Wood Elf"],
        Gnome: ["Forest Gnome", "Rock Gnome"],
        Goliath: [
            "Cloud Goliath",
            "Fire Goliath",
            "Frost Goliath",
            "Hill Goliath",
            "Stone Goliath",
            "Storm Goliath"
        ],
        Tiefling: ["Abyssal Tiefling", "Chthonic Tiefling", "Infernal Tiefling"]
    };

    const raceGrid = document.getElementById("race-grid");
    const subraceSection = document.getElementById("subrace-section");
    const subraceTitle = document.getElementById("subrace-title");
    const subraceGrid = document.getElementById("subrace-grid");
    const nextBtn = document.getElementById("next");

    let selectedRace = null;
    let selectedSubrace = null;

    function saveState() {
        if (selectedRace) {
            localStorage.setItem(STORAGE_RACE, selectedRace);
        } else {
            localStorage.removeItem(STORAGE_RACE);
        }

        if (selectedSubrace) {
            localStorage.setItem(STORAGE_SUBRACE, selectedSubrace);
        } else {
            localStorage.removeItem(STORAGE_SUBRACE);
        }
    }

    function loadState() {
        selectedRace = localStorage.getItem(STORAGE_RACE);
        selectedSubrace = localStorage.getItem(STORAGE_SUBRACE);
    }

    function clearRaceUI() {
        const tiles = raceGrid.querySelectorAll(".class-tile[data-race]");
        for (const tile of tiles) {
            tile.classList.remove("is-selected");
            tile.setAttribute("aria-pressed", "false");
        }
    }

    function markSelectedRaceUI() {
        if (!selectedRace) {
            return;
        }

        const tile = raceGrid.querySelector(`.class-tile[data-race="${selectedRace}"]`);
        if (!tile) {
            return;
        }

        tile.classList.add("is-selected");
        tile.setAttribute("aria-pressed", "true");
    }

    function clearSubraceUI() {
        const tiles = subraceGrid.querySelectorAll(".class-tile[data-subrace]");
        for (const tile of tiles) {
            tile.classList.remove("is-selected");
            tile.setAttribute("aria-pressed", "false");
        }
    }

    function markSelectedSubraceUI() {
        if (!selectedSubrace) {
            return;
        }

        const tile = subraceGrid.querySelector(`.class-tile[data-subrace="${selectedSubrace}"]`);
        if (!tile) {
            return;
        }

        tile.classList.add("is-selected");
        tile.setAttribute("aria-pressed", "true");
    }

    function raceHasSubraces(raceName) {
        return Array.isArray(SUBRACES[raceName]) && SUBRACES[raceName].length > 0;
    }

    function subraceGridClassForRace(raceName) {
        if (raceName === "Dragonborn") return "subrace-dragonborn"; // 2x5
        if (raceName === "Goliath") return "subrace-goliath";       // 2x3
        if (raceName === "Gnome") return "subrace-gnome";           // 1x2
        if (raceName === "Elf") return "subrace-elf";               // 1x3
        if (raceName === "Tiefling") return "subrace-tiefling";     // 1x3
        return "";
    }

    function renderSubraceGrid() {
        subraceGrid.innerHTML = "";
        subraceGrid.className = "class-grid dynamic-grid subrace-grid";

        if (!selectedRace || !raceHasSubraces(selectedRace)) {
            subraceSection.hidden = true;
            return;
        }

        if (selectedRace === "Dragonborn") setGridCols(subraceGrid, 5);
        else if (selectedRace === "Goliath") setGridCols(subraceGrid, 3);
        else if (selectedRace === "Gnome") setGridCols(subraceGrid, 2);
        else if (selectedRace === "Elf") setGridCols(subraceGrid, 3);
        else if (selectedRace === "Tiefling") setGridCols(subraceGrid, 3);

        subraceSection.hidden = false;
        subraceTitle.textContent = `Choose Your ${selectedRace} Subrace`;

        const extraClass = subraceGridClassForRace(selectedRace);
        if (extraClass) {
            subraceGrid.classList.add(extraClass);
        }

        const list = SUBRACES[selectedRace];

        for (const name of list) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "class-tile";
            btn.dataset.subrace = name;
            btn.setAttribute("aria-pressed", "false");

            const inner = document.createElement("div");
            inner.className = "class-name";
            inner.textContent = name;

            btn.appendChild(inner);
            subraceGrid.appendChild(btn);
        }

        clearSubraceUI();
        markSelectedSubraceUI();
    }

    function canProceed() {
        if (!selectedRace) {
            return false;
        }

        if (!raceHasSubraces(selectedRace)) {
            return true;
        }

        return Boolean(selectedSubrace);
    }

    function handleRaceClick(event) {
        const tile = event.target.closest(".class-tile[data-race]");
        if (!tile) {
            return;
        }

        const raceName = tile.dataset.race;

        if (selectedRace === raceName) {
            selectedRace = null;
            selectedSubrace = null;
            clearRaceUI();
            renderSubraceGrid();
            saveState();
            return;
        }

        selectedRace = raceName;
        selectedSubrace = null;
        clearRaceUI();
        markSelectedRaceUI();
        renderSubraceGrid();
        saveState();
    }

    function handleSubraceClick(event) {
        const tile = event.target.closest(".class-tile[data-subrace]");
        if (!tile) {
            return;
        }

        const subName = tile.dataset.subrace;

        if (selectedSubrace === subName) {
            selectedSubrace = null;
            clearSubraceUI();
            saveState();
            return;
        }

        selectedSubrace = subName;
        clearSubraceUI();
        markSelectedSubraceUI();
        saveState();
    }

    function handleNextClick() {
        if (!canProceed()) {
            return;
        }

        window.location.href = "starting_class.html";
    }

    function setGridCols(el, cols) {
        el.style.setProperty("--cols", String(cols));
    }

    function init() {
        loadState();

        setGridCols(raceGrid, 5);
        clearRaceUI();
        markSelectedRaceUI();
        renderSubraceGrid();

        raceGrid.addEventListener("click", handleRaceClick);
        subraceGrid.addEventListener("click", handleSubraceClick);
        nextBtn.addEventListener("click", handleNextClick);
    }

    init();
})();
