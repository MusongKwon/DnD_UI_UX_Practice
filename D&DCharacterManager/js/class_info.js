(() => {
    const STORAGE_KEY = "ddcm_selected_class";

    const CLASS_PRIMARY = {
        Barbarian: "Strength",
        Bard: "Charisma",
        Cleric: "Wisdom",
        Druid: "Wisdom",
        Fighter: "Strength or Dexterity",
        Monk: "Dexterity and Wisdom",
        Paladin: "Strength and Charisma",
        Ranger: "Dexterity and Wisdom",
        Rogue: "Dexterity",
        Sorcerer: "Charisma",
        Warlock: "Charisma",
        Wizard: "Intelligence"
    };

    function getSelectedClass() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function buildSubtitle() {
        const chosenClass = getSelectedClass();

        if (!chosenClass || !CLASS_PRIMARY[chosenClass]) {
            return "Constitution is essential for everybody!";
        }

        const attrs = CLASS_PRIMARY[chosenClass];
        const verb = attrs.includes(" and ") ? "are" : "is";
        return `You are a ${chosenClass}. Your primary attributes ${verb} ${attrs}.`;
    }

    window.DDCM = window.DDCM || {};
    window.DDCM.buildClassSubtitle = buildSubtitle;
})();
