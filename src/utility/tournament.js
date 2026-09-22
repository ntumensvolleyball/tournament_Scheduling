const WEEKDAYS = [
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" }
];

const TOURNAMENT_PREVIEW_NAME = "Tournament";
const BRACKET_SIZES = [2, 4, 8, 16, 32, 64];
const TAG_SEPARATOR = /[,，\s]+/;

function normalizeText(value) {
    return String(value || "").trim();
}

function normalizeTag(tag) {
    return normalizeText(tag).replace(/\s+/g, " ");
}

function parseTags(value) {
    return [...new Set(String(value || "")
        .split(TAG_SEPARATOR)
        .map(normalizeTag)
        .filter(Boolean))];
}

function getSelectedDays(container) {
    return Array.from(container.querySelectorAll("input[type='checkbox']:checked"))
        .map(input => Number(input.value))
        .sort((a, b) => a - b);
}

function formatDays(days) {
    return (Array.isArray(days) && days.length > 0 ? days : WEEKDAYS.map(day => day.value)).join(",");
}

function getTeamList() {
    return Object.values(fetchTeams()).sort((teamA, teamB) =>
        teamA.teamID.localeCompare(teamB.teamID)
    );
}

function getTeam(teamID) {
    return fetchTeams()[teamID] || null;
}

function createTeam(teamID, teamName, tags, availableDays, games = []) {
    return {
        teamID,
        games,
        tags,
        availableDays,
        teamName: teamName || teamID
    };
}

function saveTeam(team) {
    const teams = fetchTeams();
    teams[team.teamID] = team;
    saveTeams(teams);
}

function renameTeamReferences(originalTeamID, newTeamID) {
    const matches = fetchMatches();
    let updated = false;
    matches.forEach(match => {
        if (match.teamAID === originalTeamID) {
            match.teamAID = newTeamID;
            updated = true;
        }
        if (match.teamBID === originalTeamID) {
            match.teamBID = newTeamID;
            updated = true;
        }
    });
    const tournaments = fetchTournaments();
    Object.values(tournaments).forEach(tournament => {
        if (tournament.teamIds) tournament.teamIds = tournament.teamIds.map(id => id === originalTeamID ? newTeamID : id);
    });
    matches.forEach(match => {
        if (match.winner === originalTeamID) match.winner = newTeamID;
        if (match.loser === originalTeamID) match.loser = newTeamID;
    });
    saveTournaments(tournaments);
    if (updated) saveMatches(matches);
}

function deleteTeam(teamID) {
    const teams = fetchTeams();
    delete teams[teamID];
    saveTeams(teams);
}

function getAllTags() {
    const tags = new Set();
    getTeamList().forEach(team => {
        (team.tags || []).forEach(tag => tags.add(tag));
    });
    return [...tags].sort((a, b) => a.localeCompare(b));
}

function teamHasWinnerTag(team, winnerTag) {
    const normalizedWinnerTag = normalizeTag(winnerTag).toLowerCase();
    return (team.tags || []).some(tag => {
        const normalizedTag = normalizeTag(tag).toLowerCase();
        return normalizedTag === normalizedWinnerTag ||
            normalizedTag === `winner:${normalizedWinnerTag}` ||
            normalizedTag === `winner of:${normalizedWinnerTag}`;
    });
}

function teamMatchesFilters(team, filters) {
    const teamTags = new Set((team.tags || []).map(tag => normalizeTag(tag).toLowerCase()));
    const includesTags = filters.includeTags.every(tag => teamTags.has(normalizeTag(tag).toLowerCase()));
    const includesWinnerTags = filters.winnerTags.every(tag => teamHasWinnerTag(team, tag));
    return includesTags && includesWinnerTags;
}

function createMatchRecord(id, teamAID, teamBID, group, tournamentID, round = null) {
    return {
        id,
        teamAID,
        teamBID,
        set1: [0, 0],
        set2: [0, 0],
        set3: [0, 0],
        winner: null,
        loser: null,
        status: false,
        nextMatch: null,
        loserNextMatch: null,
        tournamentID,
        group,
        round,
        availableDays: teamAID && teamBID ? calculateMatchAvailableDays(teamAID, teamBID) : [],
        official: "",
        date: null,
        locked: false
    };
}

function getNextMatchIDAllocator() {
    const highestExistingMatchID = fetchMatches().reduce((highestID, match) =>
        Math.max(highestID, Number(match.id) || 0), 0);
    let nextID = Math.max(Number(fetchGameIDCounter()) || 0, highestExistingMatchID) + 1;
    return () => nextID++;
}

function attachGamesToTeams(matches) {
    const teams = fetchTeams();
    matches.forEach(match => {
        [match.teamAID, match.teamBID].forEach(teamID => {
            if (!teamID || !teams[teamID]) return;
            if (!Array.isArray(teams[teamID].games)) teams[teamID].games = [];
            if (!teams[teamID].games.includes(match.id)) teams[teamID].games.push(match.id);
        });
    });
    saveTeams(teams);
}

function getTournamentID(name) {
    return normalizeText(name)
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
        .replace(/^-+|-+$/g, "") || `${Date.now()}`;
}

function isPowerOfTwo(value) {
    return value > 0 && (value & (value - 1)) === 0;
}

function getEliminationRounds(size) {
    return Math.log2(size);
}

function createEliminationStage(name, size) {
    if (!isPowerOfTwo(size)) {
        throw new Error("Elimination bracket size must be a power of two.");
    }
    const rounds = getEliminationRounds(size);
    return {
        type: "elimination",
        name,
        size,
        slots: Array(size).fill(null),
        rounds
    };
}

function createRobinStage(name, teamCount, repeatCount) {
    if (!Number.isInteger(teamCount) || teamCount < 2) {
        throw new Error("Robin round size must be an integer of at least 2 teams.");
    }
    if (!Number.isInteger(repeatCount) || repeatCount < 1) {
        throw new Error("Robin count must be an integer of at least 1.");
    }
    return {
        type: "robin",
        name,
        teamCount,
        repeatCount,
        teams: []
    };
}

function createRoundRobinPairs(teamIDs, repeatCount) {
    const pairs = [];
    for (let repeatIndex = 1; repeatIndex <= repeatCount; repeatIndex++) {
        for (let i = 0; i < teamIDs.length; i++) {
            for (let j = i + 1; j < teamIDs.length; j++) {
                pairs.push({
                    teamAID: teamIDs[i],
                    teamBID: teamIDs[j],
                    round: repeatIndex
                });
            }
        }
    }
    return pairs;
}

function buildEliminationTournament(stage) {
    if (stage.slots.some(slot => !slot)) {
        throw new Error("Fill every first-round bracket slot before saving.");
    }

    const tournamentID = getTournamentID(stage.name);
    const rounds = [];
    const matches = [];
    const nextMatchID = getNextMatchIDAllocator();

    for (let roundIndex = 1; roundIndex <= stage.rounds; roundIndex++) {
        const matchCount = stage.size / Math.pow(2, roundIndex);
        const roundMatches = [];
        for (let matchIndex = 0; matchIndex < matchCount; matchIndex++) {
            const slotIndex = matchIndex * 2;
            const teamAID = roundIndex === 1 ? stage.slots[slotIndex] : null;
            const teamBID = roundIndex === 1 ? stage.slots[slotIndex + 1] : null;
            const match = createMatchRecord(nextMatchID(), teamAID, teamBID, `${stage.name}-Round${roundIndex}`, tournamentID, roundIndex);
            roundMatches.push(match);
            matches.push(match);
        }
        if (stage.rounds > 1 && roundIndex === stage.rounds) {
            const placementMatch = createMatchRecord(nextMatchID(), null, null, `${stage.name}-Round${roundIndex}`, tournamentID, roundIndex);
            roundMatches.push(placementMatch);
            matches.push(placementMatch);
        }
        rounds.push(roundMatches);
    }

    for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex++) {
        rounds[roundIndex].forEach((match, matchIndex) => {
            match.nextMatch = rounds[roundIndex + 1][Math.floor(matchIndex / 2)].id;
            match.nextMatchSlot = matchIndex % 2 === 0 ? "teamAID" : "teamBID";
        });
        if (roundIndex === rounds.length - 2 && rounds[roundIndex + 1][1]) {
            rounds[roundIndex].forEach((match, matchIndex) => {
                match.loserNextMatch = rounds[roundIndex + 1][1].id;
                match.loserNextMatchSlot = matchIndex % 2 === 0 ? "teamAID" : "teamBID";
            });
        }
    }

    return {
        tournamentID,
        tournament: {
            id: tournamentID,
            name: stage.name,
            type: "elimination",
            size: stage.size,
            rounds: stage.rounds,
            matchIds: matches.map(match => match.id),
            roundMatchIds: rounds.map(round => round.map(match => match.id)),
            createdAt: new Date().toISOString()
        },
        matches
    };
}

function buildRobinTournament(stage) {
    if (stage.teams.length !== stage.teamCount) {
        throw new Error(`Add exactly ${stage.teamCount} teams before saving this robin round.`);
    }

    const tournamentID = getTournamentID(stage.name);
    const nextMatchID = getNextMatchIDAllocator();
    const pairs = createRoundRobinPairs(stage.teams, stage.repeatCount);
    const matches = pairs.map(pair =>
        createMatchRecord(nextMatchID(), pair.teamAID, pair.teamBID, `${stage.name}-Robin${pair.round}`, tournamentID, pair.round)
    );

    return {
        tournamentID,
        tournament: {
            id: tournamentID,
            name: stage.name,
            type: "robin",
            teamCount: stage.teamCount,
            repeatCount: stage.repeatCount,
            teamIds: [...stage.teams],
            matchIds: matches.map(match => match.id),
            createdAt: new Date().toISOString()
        },
        matches
    };
}

function saveBuiltTournament(buildResult) {
    const existingMatches = fetchMatches();
    const tournaments = fetchTournaments();
    if (tournaments[buildResult.tournamentID]) {
        throw new Error("A tournament with this name already exists. Use a different name.");
    }
    saveMatches([...existingMatches, ...buildResult.matches]);
    saveGameIDCounter(Math.max(...buildResult.matches.map(match => match.id), Number(fetchGameIDCounter())));
    tournaments[buildResult.tournamentID] = buildResult.tournament;
    saveTournaments(tournaments);
    attachGamesToTeams(buildResult.matches);
}

function initializeTeamPage() {
    const form = document.getElementById("team-form");
    const dayContainer = document.getElementById("available-days");
    const tableBody = document.getElementById("teams-body");
    const clearButton = document.getElementById("clear-team-form");

    function renderDayCheckboxes() {
        dayContainer.innerHTML = WEEKDAYS.map(day => `
            <label class="checkbox-pill">
                <input type="checkbox" value="${day.value}" checked>
                ${day.label}
            </label>
        `).join("");
    }

    function resetForm({ keepTags = false } = {}) {
        const currentTags = document.getElementById("team-tags").value;
        form.reset();
        document.getElementById("original-team-id").value = "";
        if (keepTags) {
            document.getElementById("team-tags").value = currentTags;
        }
        dayContainer.querySelectorAll("input[type='checkbox']").forEach(input => input.checked = true);
    }

    function editTeam(teamID) {
        const team = getTeam(teamID);
        if (!team) return;
        document.getElementById("original-team-id").value = team.teamID;
        document.getElementById("team-id").value = team.teamID;
        document.getElementById("team-name").value = team.teamName || team.teamID;
        document.getElementById("team-tags").value = (team.tags || []).join(", ");
        const availableDays = team.availableDays || WEEKDAYS.map(day => day.value);
        dayContainer.querySelectorAll("input[type='checkbox']").forEach(input => {
            input.checked = availableDays.includes(Number(input.value));
        });
    }

    function renderTeams() {
        const teams = getTeamList();
        tableBody.innerHTML = teams.map(team => `
            <tr>
                <td>${team.teamID}</td>
                <td>${team.teamName || team.teamID}</td>
                <td>${(team.tags || []).map(tag => `<span class="tag-chip">${tag}</span>`).join("")}</td>
                <td>${formatDays(team.availableDays)}</td>
                <td>${(team.games || []).length}</td>
                <td>
                    <button class="edit-btn" data-action="edit" data-team-id="${team.teamID}">Edit</button>
                    <button class="delete-btn" data-action="delete" data-team-id="${team.teamID}">Delete</button>
                </td>
            </tr>
        `).join("");
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        const originalTeamID = normalizeText(document.getElementById("original-team-id").value);
        const teamID = normalizeText(document.getElementById("team-id").value);
        const teamName = normalizeText(document.getElementById("team-name").value);
        const tags = parseTags(document.getElementById("team-tags").value);
        const availableDays = getSelectedDays(dayContainer);
        if (!teamID) {
            alert("Team ID is required.");
            return;
        }
        if (availableDays.length === 0) {
            alert("Select at least one available day.");
            return;
        }

        const teams = fetchTeams();
        const existingGames = teams[originalTeamID]?.games || teams[teamID]?.games || [];
        if (originalTeamID && originalTeamID !== teamID) {
            if (teams[teamID]) {
                alert("A team with the new Team ID already exists.");
                return;
            }
            const updatedTeams = { ...teams };
            delete updatedTeams[originalTeamID];
            updatedTeams[teamID] = createTeam(teamID, teamName, tags, availableDays, existingGames);
            saveTeams(updatedTeams);
            renameTeamReferences(originalTeamID, teamID);
        } else if (!originalTeamID && teams[teamID]) {
            alert("A team with this Team ID already exists. Click Edit to update it.");
            return;
        } else {
            saveTeam(createTeam(teamID, teamName, tags, availableDays, existingGames));
        }

        saveMatches(fetchMatches());
        resetForm({ keepTags: true });
        renderTeams();
    });

    tableBody.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const teamID = button.dataset.teamId;
        if (button.dataset.action === "edit") {
            editTeam(teamID);
        } else if (button.dataset.action === "delete" && confirm(`Delete ${teamID}?`)) {
            const team = getTeam(teamID);
            if ((team?.games || []).length > 0) {
                alert("This team has saved games and cannot be deleted.");
                return;
            }
            deleteTeam(teamID);
            renderTeams();
        }
    });

    clearButton.addEventListener("click", resetForm);
    renderDayCheckboxes();
    renderTeams();
}

function initializeTournamentPage() {
    const state = {
        includeTags: new Set(),
        winnerTags: new Set(),
        staged: null
    };

    const elements = {
        teamList: document.getElementById("team-list"),
        includeSearch: document.getElementById("tag-filter-search"),
        winnerSearch: document.getElementById("winner-filter-search"),
        includeOptions: document.getElementById("tag-filter-options"),
        winnerOptions: document.getElementById("winner-filter-options"),
        format: document.getElementById("tournament-format"),
        name: document.getElementById("tournament-name"),
        bracketSize: document.getElementById("bracket-size"),
        robinSize: document.getElementById("robin-size"),
        robinRepeats: document.getElementById("robin-repeats"),
        clearStage: document.getElementById("clear-stage"),
        save: document.getElementById("save-game-creation"),
        stage: document.getElementById("stage"),
        status: document.getElementById("builder-status")
    };

    function getFilters() {
        return {
            includeTags: [...state.includeTags],
            winnerTags: [...state.winnerTags]
        };
    }

    function renderTagOptions(container, searchValue, selectedSet) {
        const normalizedSearch = normalizeText(searchValue).toLowerCase();
        const tags = getAllTags().filter(tag => tag.toLowerCase().includes(normalizedSearch));
        container.innerHTML = tags.map(tag => `
            <label class="filter-option">
                <input type="checkbox" value="${tag}" ${selectedSet.has(tag) ? "checked" : ""}>
                ${tag}
            </label>
        `).join("");
    }

    function renderFilters() {
        renderTagOptions(elements.includeOptions, elements.includeSearch.value, state.includeTags);
        renderTagOptions(elements.winnerOptions, elements.winnerSearch.value, state.winnerTags);
    }

    function renderTeamList() {
        const filters = getFilters();
        const stagedTeams = state.staged?.type === "robin"
            ? new Set(state.staged.teams)
            : state.staged?.type === "elimination"
                ? new Set(state.staged.slots.filter(Boolean))
                : new Set();
        const teams = getTeamList()
            .filter(team => !stagedTeams.has(team.teamID))
            .filter(team => teamMatchesFilters(team, filters));
        elements.teamList.innerHTML = teams.map(team => `
            <div class="team-card" draggable="true" data-team-id="${team.teamID}">
                <strong>${team.teamID}</strong>
                <span>${team.teamName || team.teamID}</span>
                <div>${(team.tags || []).map(tag => `<span class="tag-chip">${tag}</span>`).join("")}</div>
            </div>
        `).join("");
    }

    function renderBracketStage() {
        const stage = state.staged;
        const firstRoundMatches = stage.size / 2;
        const firstRound = Array.from({ length: firstRoundMatches }, (_, matchIndex) => {
            const slotAIndex = matchIndex * 2;
            const slotBIndex = slotAIndex + 1;
            return `
                <div class="bracket-match">
                    ${renderTeamSlot(slotAIndex, stage.slots[slotAIndex])}
                    ${renderTeamSlot(slotBIndex, stage.slots[slotBIndex])}
                </div>
            `;
        }).join("");

        const laterRounds = Array.from({ length: stage.rounds - 1 }, (_, roundOffset) => {
            const roundNumber = roundOffset + 2;
            const matchCount = stage.size / Math.pow(2, roundNumber);
            const placementMatch = roundNumber === stage.rounds ? `
                <div class="bracket-match is-placeholder">
                    <div class="team-slot">Semifinal loser</div>
                    <div class="team-slot">Semifinal loser</div>
                </div>
            ` : "";
            return `
                <div class="round">
                    <h3>Round ${roundNumber}</h3>
                    ${Array.from({ length: matchCount }, () => `
                        <div class="bracket-match is-placeholder">
                            <div class="team-slot">Winner</div>
                            <div class="team-slot">Winner</div>
                        </div>
                    `).join("")}
                    ${placementMatch}
                </div>
            `;
        }).join("");

        elements.stage.innerHTML = `
            <div class="round">
                <h3>Round 1</h3>
                ${firstRound}
            </div>
            ${laterRounds}
        `;
    }

    function renderTeamSlot(slotIndex, teamID) {
        const label = teamID || `Drop team ${slotIndex + 1}`;
        return `<div class="team-slot ${teamID ? "is-filled" : ""}" data-slot-index="${slotIndex}">${label}</div>`;
    }

    function renderRobinStage() {
        const stage = state.staged;
        const pairs = createRoundRobinPairs(stage.teams, stage.repeatCount);
        elements.stage.innerHTML = `
            <div class="robin-roster" data-robin-dropzone="true">
                <h3>Teams in Robin (${stage.teams.length} / ${stage.teamCount})</h3>
                <div class="robin-team-list">
                    ${stage.teams.map(teamID => `<span class="robin-team" data-team-id="${teamID}">${teamID}<button data-remove-team="${teamID}">x</button></span>`).join("")}
                </div>
                <p class="drop-hint">Drop teams here</p>
            </div>
            <div class="robin-pairs">
                <h3>Generated Matches (${pairs.length})</h3>
                ${pairs.map(pair => `<div class="match-preview">Round ${pair.round}: ${pair.teamAID} vs ${pair.teamBID}</div>`).join("")}
            </div>
        `;
    }

    function renderStage() {
        if (!state.staged) {
            elements.stage.innerHTML = '<p class="empty-stage">Create a blank bracket or robin round to start dragging teams.</p>';
            return;
        }
        if (state.staged.type === "elimination") renderBracketStage();
        if (state.staged.type === "robin") renderRobinStage();
    }

    function refresh() {
        renderFilters();
        renderTeamList();
        renderStage();
    }

    function setStatus(message) {
        elements.status.textContent = message;
    }

    function setFormatVisibility() {
        const isElimination = elements.format.value === "elimination";
        document.getElementById("bracket-size-control").classList.toggle("is-hidden", !isElimination);
        document.getElementById("robin-size-control").classList.toggle("is-hidden", isElimination);
        document.getElementById("robin-repeat-control").classList.toggle("is-hidden", isElimination);
    }

    function getPreviewTournamentName() {
        return normalizeText(elements.name.value) || TOURNAMENT_PREVIEW_NAME;
    }

    function buildStageFromControls({ preserveAssignments = true, showAlerts = false } = {}) {
        const name = getPreviewTournamentName();
        try {
            if (elements.format.value === "elimination") {
                const stage = createEliminationStage(name, Number(elements.bracketSize.value));
                if (preserveAssignments && state.staged?.type === "elimination") {
                    stage.slots = stage.slots.map((slot, index) => state.staged.slots[index] || slot);
                }
                state.staged = stage;
            } else {
                const robinSize = Number(elements.robinSize.value);
                const repeatCount = Number(elements.robinRepeats.value);
                const stage = createRobinStage(name, robinSize, repeatCount);
                if (preserveAssignments && state.staged?.type === "robin") {
                    stage.teams = state.staged.teams.slice(0, stage.teamCount);
                }
                state.staged = stage;
            }
            setStatus("Game creation is staged. Nothing is saved yet.");
            renderTeamList();
            renderStage();
            return true;
        } catch (error) {
            state.staged = null;
            setStatus(error.message);
            renderStage();
            if (showAlerts) alert(error.message);
            return false;
        }
    }

    function syncStageFromControls(options) {
        setFormatVisibility();
        return buildStageFromControls(options);
    }

    function clearStageAssignments() {
        syncStageFromControls({ preserveAssignments: false });
        setStatus("Staged teams cleared.");
    }

    function updateStagedName() {
        if (!state.staged) return;
        state.staged.name = getPreviewTournamentName();
        renderStage();
    }

    function saveStage() {
        const name = normalizeText(elements.name.value);
        if (!name) {
            setStatus("Not saved: enter a tournament name.");
            elements.name.focus();
            return;
        }
        if (!syncStageFromControls()) return;
        try {
            const buildResult = state.staged.type === "elimination"
                ? buildEliminationTournament(state.staged)
                : buildRobinTournament(state.staged);
            saveBuiltTournament(buildResult);
            state.staged = null;
            refresh();
            setStatus(`Saved tournament "${name}" with ${buildResult.matches.length} matches. View it on the Brackets or Matches List page.`);
        } catch (error) {
            setStatus(`Not saved: ${error.message}`);
        }
    }

    function assignTeamToBracketSlot(teamID, slotIndex) {
        const duplicateIndex = state.staged.slots.indexOf(teamID);
        if (duplicateIndex !== -1) state.staged.slots[duplicateIndex] = null;
        state.staged.slots[slotIndex] = teamID;
        renderTeamList();
        renderStage();
    }

    function addTeamToRobin(teamID) {
        if (state.staged.teams.length >= state.staged.teamCount && !state.staged.teams.includes(teamID)) {
            alert(`This robin round is already full at ${state.staged.teamCount} teams.`);
            return;
        }
        if (!state.staged.teams.includes(teamID)) {
            state.staged.teams.push(teamID);
            renderTeamList();
            renderStage();
        }
    }

    elements.teamList.addEventListener("dragstart", event => {
        const card = event.target.closest(".team-card");
        if (!card) return;
        event.dataTransfer.setData("text/plain", card.dataset.teamId);
    });

    elements.stage.addEventListener("dragover", event => {
        if (event.target.closest(".team-slot") || event.target.closest("[data-robin-dropzone]")) {
            event.preventDefault();
        }
    });

    elements.stage.addEventListener("drop", event => {
        const teamID = event.dataTransfer.getData("text/plain");
        if (!teamID || !state.staged) return;
        const slot = event.target.closest(".team-slot");
        const robinDropzone = event.target.closest("[data-robin-dropzone]");
        if (state.staged.type === "elimination" && slot) {
            assignTeamToBracketSlot(teamID, Number(slot.dataset.slotIndex));
        } else if (state.staged.type === "robin" && robinDropzone) {
            addTeamToRobin(teamID);
        }
    });

    elements.stage.addEventListener("click", event => {
        const removeButton = event.target.closest("button[data-remove-team]");
        if (!removeButton || !state.staged || state.staged.type !== "robin") return;
        state.staged.teams = state.staged.teams.filter(teamID => teamID !== removeButton.dataset.removeTeam);
        renderTeamList();
        renderStage();
    });

    elements.includeSearch.addEventListener("input", renderFilters);
    elements.winnerSearch.addEventListener("input", renderFilters);
    elements.includeOptions.addEventListener("change", event => {
        if (event.target.matches("input[type='checkbox']")) {
            event.target.checked ? state.includeTags.add(event.target.value) : state.includeTags.delete(event.target.value);
            renderTeamList();
        }
    });
    elements.winnerOptions.addEventListener("change", event => {
        if (event.target.matches("input[type='checkbox']")) {
            event.target.checked ? state.winnerTags.add(event.target.value) : state.winnerTags.delete(event.target.value);
            renderTeamList();
        }
    });
    elements.format.addEventListener("change", () => syncStageFromControls({ preserveAssignments: false }));
    elements.bracketSize.addEventListener("change", () => syncStageFromControls());
    elements.robinSize.addEventListener("input", () => syncStageFromControls());
    elements.robinRepeats.addEventListener("input", () => syncStageFromControls());
    elements.name.addEventListener("input", updateStagedName);
    elements.clearStage.addEventListener("click", clearStageAssignments);
    elements.save.addEventListener("click", saveStage);

    BRACKET_SIZES.forEach(size => {
        const option = document.createElement("option");
        option.value = size;
        option.textContent = `${size} teams`;
        elements.bracketSize.appendChild(option);
    });

    setFormatVisibility();
    refresh();
    syncStageFromControls({ preserveAssignments: false });
}
