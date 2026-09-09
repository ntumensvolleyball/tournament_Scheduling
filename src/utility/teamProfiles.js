const TEAM_PROFILE_SELECTORS = {
    tableBody: "team-table-body",
    matchModalOverlay: "modal-overlay",
    matchModal: "match-modal",
    matchContent: "match-content",
    batchNameOverlay: "batch-input-overlay",
    batchNameModal: "batch-input-modal",
    batchNameInput: "batch-input-area"
};

const TEAM_PROFILE_MODES = {
    regular: {
        isNewbie: false,
        fetchTeams: fetchTeams,
        saveTeams: saveTeams,
        availabilityPopup: "batch-popup",
        availabilityOverlay: "batch-popup-overlay",
        availabilityInput: "batchInput",
        availabilityButton: "processBatchInput",
        availabilityResult: "processResult",
        openAvailabilityFunction: "openBatchInputAvailableDays",
        calculatePreliminaryScoreOnLoad: true,
        showPreliminaryData: true,
        showMatches: true
    },
    newbie: {
        isNewbie: true,
        fetchTeams: fetchNewbieTeams,
        saveTeams: saveNewbieTeams,
        availabilityPopup: "batch-popup-newbie",
        availabilityOverlay: "batch-popup-overlay-newbie",
        availabilityInput: "batchInputNewbie",
        availabilityButton: "processBatchInputNewbie",
        availabilityResult: "processResultNewbie",
        openAvailabilityFunction: "openBatchInputAvailableDaysNewbie",
        calculatePreliminaryScoreOnLoad: true,
        showPreliminaryData: false,
        showMatches: false
    }
};

function getTeamProfileMode(modeName) {
    return TEAM_PROFILE_MODES[modeName] || TEAM_PROFILE_MODES.regular;
}

function getElement(id) {
    return document.getElementById(id);
}

function setVisible(id, isVisible) {
    const element = getElement(id);
    if (element) {
        element.style.display = isVisible ? "block" : "none";
    }
}

function parseNumberList(value) {
    return value
        .split(",")
        .map(item => Number(item.trim()))
        .filter(item => !Number.isNaN(item));
}

function createTeamCell(value, editable = false, style = "") {
    const editableAttr = editable ? ' contenteditable="true"' : "";
    const styleAttr = style ? ` style="${style}"` : "";
    return `<td${editableAttr}${styleAttr}>${value ?? ""}</td>`;
}

function createActionCell(buttonClass, label, action) {
    return `<td><button class="${buttonClass}" onclick="${action}">${label}</button></td>`;
}

function getTeamRows(config, teams) {
    let currentGroup = "";
    const rows = [];

    Object.entries(teams).forEach(([teamID, team]) => {
        if (config.showPreliminaryData && team.preliminaryGroup !== currentGroup && currentGroup !== "") {
            rows.push('<tr><td colspan="8" style="height:10px;"></td></tr>');
        }

        currentGroup = team.preliminaryGroup;
        const cells = [
            createTeamCell(teamID, true)
        ];

        if (config.showPreliminaryData) {
            const rankColor = isPreliminaryMatchesFinished(teamID) ? "background-color:limegreen;" : "";
            cells.push(
                createTeamCell(team.preliminaryGroup),
                createTeamCell(getTeamRank(team), false, rankColor),
                createTeamCell(team.preliminaryScore),
                createTeamCell(team.availableDays, true),
                createTeamCell(team.teamName || "N/A", true)
            );
        } else {
            cells.push(
                createTeamCell(team.availableDays, true),
                createTeamCell(team.teamName || "N/A", true)
            );
        }

        cells.push(createActionCell("edit-btn", "Save", `saveChanges('${teamID}', this)`));

        if (config.showMatches) {
            cells.push(createActionCell("match-btn", "Matches", `showMatches('${teamID}')`));
        }

        rows.push(`<tr>${cells.join("")}</tr>`);
    });

    return rows;
}

function populateTeamProfileTable(config) {
    const tableBody = getElement(TEAM_PROFILE_SELECTORS.tableBody);
    if (!tableBody) return;

    const teams = config.fetchTeams();
    tableBody.innerHTML = getTeamRows(config, teams).join("");
}

function saveTeamProfileRow(config, oldTeamID, button) {
    const row = button.parentElement.parentElement;
    const newTeamID = row.cells[0].innerText.trim();

    if (newTeamID !== oldTeamID) {
        updateTeamID(oldTeamID, newTeamID, config.isNewbie);
    }

    const teams = config.fetchTeams();
    const currentID = newTeamID;
    if (!teams[currentID]) return;

    if (config.showPreliminaryData) {
        teams[currentID].availableDays = parseNumberList(row.cells[4].innerText);
        teams[currentID].teamName = row.cells[5].innerText.trim();
    } else {
        teams[currentID].availableDays = parseNumberList(row.cells[1].innerText);
        teams[currentID].teamName = row.cells[2].innerText.trim();
    }

    config.saveTeams(teams);
    saveMatches(fetchMatches());
    alert("Changes saved for " + currentID);
    window.location.reload();
}

function groupMatchesByGroup(matches) {
    return matches.reduce((groups, match) => {
        const group = match.group || "Unknown Group";
        if (!groups[group]) groups[group] = [];
        groups[group].push(match);
        return groups;
    }, {});
}

function renderTeamMatches(teamID) {
    const matches = fetchMatches();
    const teamMatches = matches.filter(match =>
        match.teamAID !== match.teamBID && (match.teamAID === teamID || match.teamBID === teamID)
    );
    const matchContent = getElement(TEAM_PROFILE_SELECTORS.matchContent);
    if (!matchContent) return;

    const groups = groupMatchesByGroup(teamMatches);
    matchContent.innerHTML = Object.entries(groups).map(([groupName, groupMatches]) => {
        const matchRows = groupMatches.map(match => {
            const date = match.date ? match.date : "No Date";
            return `<p>(${date}) ${match.teamAID} vs ${match.teamBID} - Score: ${match.set1.join(":")} | ${match.set2.join(":")} | ${match.set3.join(":")}</p>`;
        }).join("");
        return `<h3>${groupName}</h3>${matchRows}`;
    }).join("");

    setVisible(TEAM_PROFILE_SELECTORS.matchModalOverlay, true);
    setVisible(TEAM_PROFILE_SELECTORS.matchModal, true);
}

function closeTeamProfileMatchModal() {
    setVisible(TEAM_PROFILE_SELECTORS.matchModalOverlay, false);
    setVisible(TEAM_PROFILE_SELECTORS.matchModal, false);
}

function openTeamProfileBatchNameModal() {
    setVisible(TEAM_PROFILE_SELECTORS.batchNameOverlay, true);
    setVisible(TEAM_PROFILE_SELECTORS.batchNameModal, true);
}

function closeTeamProfileBatchNameModal() {
    setVisible(TEAM_PROFILE_SELECTORS.batchNameOverlay, false);
    setVisible(TEAM_PROFILE_SELECTORS.batchNameModal, false);
}

function saveTeamNamesFromBatchInput(config) {
    const teams = config.fetchTeams();
    const input = getElement(TEAM_PROFILE_SELECTORS.batchNameInput);
    if (!input) return;

    input.value.trim().split("\n").forEach(line => {
        const [id, name] = line.split(/\s+/);
        if (teams[id]) {
            teams[id].teamName = name;
        }
    });

    config.saveTeams(teams);
    closeTeamProfileBatchNameModal();
    populateTeamProfileTable(config);
}

function openAvailabilityPopup(config) {
    setVisible(config.availabilityOverlay, true);
    setVisible(config.availabilityPopup, true);
}

function closeAvailabilityPopup(config) {
    setVisible(config.availabilityOverlay, false);
    setVisible(config.availabilityPopup, false);
}

function createAvailabilityResult(className, content, isHtml = false) {
    const resultItem = document.createElement("div");
    resultItem.className = `result-item ${className}`;
    if (isHtml) {
        resultItem.innerHTML = content;
    } else {
        resultItem.textContent = content;
    }
    return resultItem;
}

function updateAvailabilityForTeamMatches(matches, teamId, isNewbie) {
    matches.forEach(match => {
        if (match.teamAID === teamId || match.teamBID === teamId) {
            match.availableDays = calculateMatchAvailableDays(match.teamAID, match.teamBID, isNewbie);
        }
    });
}

function processAvailabilityLine(config, teams, matches, line, index) {
    const cleanLine = line.trim().replace(/\s+/g, " ");
    if (!cleanLine) return null;

    const parts = cleanLine.split(/[\s\t]+/);
    if (parts.length < 3) {
        return createAvailabilityResult("error", `Invalid format in line ${index + 1}: ${cleanLine}`);
    }

    const [teamId, day1, day2] = parts;
    if (!teams[teamId]) {
        return createAvailabilityResult("error", `Team not found: ${teamId}`);
    }

    try {
        const unavailableDays = [
            Number(convertChineseNumberToArabic(day1)),
            Number(convertChineseNumberToArabic(day2))
        ];
        teams[teamId].availableDays = calculateAvailableDays(unavailableDays);
        updateAvailabilityForTeamMatches(matches, teamId, config.isNewbie);
        return createAvailabilityResult(
            "success",
            `<span>✓ ${teamId}</span><span>不可比賽日: ${day1}, ${day2}</span>`,
            true
        );
    } catch (error) {
        return createAvailabilityResult("error", `Error processing line ${index + 1}: ${cleanLine}`);
    }
}

function processAvailabilityBatch(config) {
    const teams = config.fetchTeams();
    const matches = fetchMatches();
    const input = getElement(config.availabilityInput);
    const resultDiv = getElement(config.availabilityResult);
    if (!input || !resultDiv) return;

    resultDiv.innerHTML = "";
    input.value.split("\n").forEach((line, index) => {
        const resultItem = processAvailabilityLine(config, teams, matches, line, index);
        if (resultItem) resultDiv.appendChild(resultItem);
    });

    config.saveTeams(teams);
    saveMatches(matches);
}

function installTeamProfileGlobals(config) {
    window.populateTable = () => populateTeamProfileTable(config);
    window.saveChanges = (oldTeamID, button) => saveTeamProfileRow(config, oldTeamID, button);
    window.showMatches = renderTeamMatches;
    window.closeModal = closeTeamProfileMatchModal;
    window.openBatchInputModal = openTeamProfileBatchNameModal;
    window.closeBatchInputModal = closeTeamProfileBatchNameModal;
    window.saveBatchInput = () => saveTeamNamesFromBatchInput(config);
    window[config.openAvailabilityFunction] = () => openAvailabilityPopup(config);
}

function bindTeamProfileEvents(config) {
    const batchNameOverlay = getElement(TEAM_PROFILE_SELECTORS.batchNameOverlay);
    if (batchNameOverlay) {
        batchNameOverlay.addEventListener("click", closeTeamProfileBatchNameModal);
    }

    const availabilityButton = getElement(config.availabilityButton);
    if (availabilityButton) {
        availabilityButton.addEventListener("click", () => processAvailabilityBatch(config));
    }

    const availabilityOverlay = getElement(config.availabilityOverlay);
    if (availabilityOverlay) {
        availabilityOverlay.addEventListener("click", () => closeAvailabilityPopup(config));
    }
}

function initializeTeamProfilePage(modeName) {
    const config = getTeamProfileMode(modeName);
    if (config.calculatePreliminaryScoreOnLoad) {
        calculatePreliminaryScore();
    }
    installTeamProfileGlobals(config);
    bindTeamProfileEvents(config);
    populateTeamProfileTable(config);
}
