// Shared tournament storage. Values are JSON strings in localStorage.
function fetchMatches() { return fetchStoredJSON("matches", []); }
function fetchTeams() { return fetchStoredJSON("teams", {}); }
function fetchTournaments() { return fetchStoredJSON("tournament", {}); }
function fetchOfficialStats() { return fetchStoredJSON("officialStats", {}); }
function fetchGameIDCounter() { return Number(localStorage.getItem("gameIDCounter") || 0); }
function saveTeams(teams) { localStorage.setItem("teams", JSON.stringify(teams)); }
function saveTournaments(tournaments) { localStorage.setItem("tournament", JSON.stringify(tournaments)); }
function saveOfficialStats(stats) { localStorage.setItem("officialStats", JSON.stringify(stats)); }
function saveGameIDCounter(counter) { localStorage.setItem("gameIDCounter", JSON.stringify(counter)); }
function wipeEverything() { localStorage.clear(); }
function generateGameID() {
    const id = Math.max(fetchGameIDCounter(), ...fetchMatches().map(match => Number(match.id) || 0)) + 1;
    saveGameIDCounter(id);
    return id;
}
function calculateMatchAvailableDays(teamAID, teamBID) {
    const teams = fetchTeams();
    const daysA = teams[teamAID]?.availableDays || [1, 2, 3, 4, 5];
    const daysB = teams[teamBID]?.availableDays || [1, 2, 3, 4, 5];
    return daysA.filter(day => daysB.includes(day));
}

// Recompute linked bracket slots until results stabilize, including score corrections.
function saveMatches(matches) {
    const storedMatches = fetchMatches();
    const byID = new Map(matches.map(match => [match.id, match]));
    const incoming = new Map();
    matches.forEach(source => {
        [[source.nextMatch, "winner"], [source.loserNextMatch, "loser"]].forEach(([id, result]) => {
            if (!byID.has(id)) return;
            if (!incoming.has(id)) incoming.set(id, []);
            incoming.get(id).push({ source, result });
        });
    });
    for (let pass = 0; pass <= matches.length; pass++) {
        const before = JSON.stringify(matches);
        matches.forEach(match => {
            updateMatchStatus(match);
            updateMatchWinner(match);
        });
        incoming.forEach((sources, id) => {
            const target = byID.get(id);
            sources.forEach(({ source, result }, index) => {
                if (index > 1) return;
                const slotKey = result === "winner" ? "nextMatchSlot" : "loserNextMatchSlot";
                const slot = source[slotKey] || (index === 0 ? "teamAID" : "teamBID");
                source[slotKey] = slot;
                const teamID = source.status ? source[result] : null;
                if (target[slot] !== teamID) {
                    target[slot] = teamID;
                    target.set1 = [0, 0]; target.set2 = [0, 0]; target.set3 = [0, 0];
                    target.winner = null; target.loser = null; target.status = false;
                }
            });
        });
        // Clear participants fed by a match that was deleted.
        storedMatches.filter(old => !byID.has(old.id)).forEach(old => {
            [[old.nextMatch, old.winner], [old.loserNextMatch, old.loser]].forEach(([id, teamID]) => {
                const target = byID.get(id);
                if (!target || !teamID) return;
                ["teamAID", "teamBID"].forEach(slot => {
                    if (target[slot] === teamID && !(incoming.get(id) || []).some(({source, result}) => source[result] === teamID)) {
                        target[slot] = null;
                        target.set1 = [0, 0]; target.set2 = [0, 0]; target.set3 = [0, 0];
                    }
                });
            });
        });
        if (before === JSON.stringify(matches)) break;
    }
    const teams = fetchTeams();
    Object.values(teams).forEach(team => { team.games = []; });
    matches.forEach(match => {
        match.availableDays = calculateMatchAvailableDays(match.teamAID, match.teamBID);
        new Set([match.teamAID, match.teamBID]).forEach(id => {
            if (teams[id]) teams[id].games.push(match.id);
        });
    });
    saveTeams(teams);
    localStorage.setItem("matches", JSON.stringify(matches));
    recalculateOfficialStats(matches);
}
function createGames(teamAID, teamBID, group = "", date = "") {
    return { id: generateGameID(), teamAID, teamBID, group, date,
        set1: [0, 0], set2: [0, 0], set3: [0, 0], winner: null, loser: null,
        status: false, nextMatch: null, loserNextMatch: null, official: "", locked: false,
        availableDays: calculateMatchAvailableDays(teamAID, teamBID) };
}

function fetchStoredJSON(key, fallbackValue) {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) {
        localStorage.setItem(key, JSON.stringify(fallbackValue));
        return fallbackValue;
    }
    try {
        return JSON.parse(storedValue);
    } catch (error) {
        console.error(`Error parsing ${key} JSON:`, error);
        return fallbackValue;
    }
}


function downloadJSON(jsonString, fileName = "data.json") {
    try {
        // 將字串解析為 JSON 格式
        const jsonObject = jsonString;

        // 將 JSON 物件轉換為字串，並設定縮排
        const formattedJSON = JSON.stringify(jsonObject, null, 2);

        // 創建一個 Blob 物件
        const blob = new Blob([formattedJSON], { type: "application/json" });

        // 創建一個臨時的超連結
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;

        // 觸發下載
        document.body.appendChild(link);
        link.click();

        // 清理資源
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        console.log("JSON 文件已成功下載！");
    } catch (error) {
        console.error("無法解析 JSON 字串:", error);
        alert("提供的字串無法解析為 JSON 格式，請檢查格式是否正確。");
    }
}


function matchSetsWonLoss(game, teamID) {
    const sets = [
        game.set1 || [0, 0],
        game.set2 || [0, 0],
        game.set3 || [0, 0]
    ];
    let setsWon = 0;
    let setsLost = 0;

    sets.forEach(set => {
        const [scoreA, scoreB] = set;
        if ((teamID === game.teamAID && scoreA > scoreB) || (teamID === game.teamBID && scoreB > scoreA)) {
            setsWon++;
        } else if (scoreA !== 0 && scoreB !== 0 && ((teamID === game.teamAID && scoreA < scoreB) || (teamID === game.teamBID && scoreB < scoreA))){
            setsLost++;
        }
    });

    return [setsWon, setsLost]; // Fixed typo
}

function convertChineseNumberToArabic(num) {
    const mapping = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5 };
    return mapping[num] || num;
}


function ratioWonLoss(setsWon, setsLost) {
    //console.log('W/L', setsWon, setsLost);
    if (setsWon === 0 && setsLost === 0) return 0;
    if (setsLost === 0) return 100;
    return (setsWon)/(setsLost);
}


function matchScoreWonLoss(game, teamID) {
    const sets = [
        game.set1 || [0, 0],
        game.set2 || [0, 0],
        game.set3 || [0, 0]
    ];
    let scoreWon = 0;
    let scoreLost = 0;

    sets.forEach(set => {
        const [scoreA, scoreB] = set;
        if (teamID === game.teamAID) {
            scoreWon += scoreA;
            scoreLost += scoreB;
        } else if (teamID === game.teamBID) {
            scoreWon += scoreB;
            scoreLost += scoreA;
        }
    });

    return [scoreWon, scoreLost];
}


function calculateAvailableDays(unavailableDays) {
    const allDays = [1, 2, 3, 4, 5];
    return allDays.filter(day => !unavailableDays.includes(Number(day)));
}

// Add this new function to calculate intersection of available days

function recalculateOfficialStats(matches) {
    const officialStats = {};
    
    // Count officials from all matches
    matches.forEach(match => {
        if (match.official) {
            if (!officialStats[match.official]) {
                officialStats[match.official] = {count: 0};
            }
            officialStats[match.official].count = (officialStats[match.official].count || 0) + 1;
        }
    });
    const allOfficialStats = fetchOfficialStats()
    // Save updated stats
    // Update count for each official while preserving availableDays if already set
    // Remove officials from allOfficialStats that are not in officialStats
    for (let official in allOfficialStats) {
        if (!officialStats.hasOwnProperty(official)) {
            delete allOfficialStats[official];
        }
    }
    for (let official in officialStats) {
        if (allOfficialStats.hasOwnProperty(official)) {
            allOfficialStats[official].count = officialStats[official].count;
        } else {
            allOfficialStats[official] = { count: officialStats[official].count };
        }
    }
    saveOfficialStats(allOfficialStats);
    return officialStats;
}


function updateMatchStatus(match) {
    // Check for special case where two teams are the same name
    if(match.teamAID === match.teamBID && match.teamAID !== null) match.status = true;
    else {
        // Check if all sets have valid scores
        const hasAllScores = 
            (match.set1[0] !== 0 || match.set1[1] !== 0) &&  // At least one team scored in set 1
            (match.set2[0] !== 0 || match.set2[1] !== 0);    // At least one team scored in set 2
        
        // For set 3, we only check if it's needed (when each team won one set)
        const needsSet3 = 
            ((match.set1[0] > match.set1[1] && match.set2[0] < match.set2[1]) ||
            (match.set1[0] < match.set1[1] && match.set2[0] > match.set2[1]));
        
        const set3Valid = !needsSet3 || (match.set3[0] !== 0 || match.set3[1] !== 0);

        // Update status if all required sets have scores
        match.status = hasAllScores && set3Valid;
    }
    return match;
}

function updateMatchWinner(match){
    match.winner = null;
    match.loser = null;
    // Calculate sets won by each team
    let teamASets = 0;
    let teamBSets = 0;
    
    // Count sets won
    if (match.set1[0] > match.set1[1]) teamASets++;
    else if (match.set1[1] > match.set1[0]) teamBSets++;
    
    if (match.set2[0] > match.set2[1]) teamASets++;
    else if (match.set2[1] > match.set2[0]) teamBSets++;
    
    if (match.set3[0] > match.set3[1]) teamASets++;
    else if (match.set3[1] > match.set3[0]) teamBSets++;
    
    // Update current match winner
    match.winner = (match.teamAID == match.teamBID && match.teamAID !== null) ? match.teamAID : (teamASets < 2 && teamBSets < 2) ? null : (teamASets >= 2) ? match.teamAID : match.teamBID;
    match.loser = (match.teamAID == match.teamBID && match.teamAID !== null) ? match.teamAID : (teamASets < 2 && teamBSets < 2) ? null : (teamASets >= 2) ? match.teamBID : match.teamAID;
    return match;
}
// save Matches main function

function loadPayPerMatch() {
    const pay = localStorage.getItem('payPerMatch') || '250';
    document.getElementById('pay-per-match').value = pay;
}

// Save pay per match to localStorage

function savePayPerMatch() {
    const pay = document.getElementById('pay-per-match').value.trim();
    localStorage.setItem('payPerMatch', pay);
    alert('Pay per match saved.');
    location.reload(); // Reload to update current payment
}


// Match creation

function getAdjustmentData(officialData) {
    // Handle legacy data (single number) vs new data (history array)
    let history = officialData.adjustmentHistory || [];
    
    // If there is a legacy 'adjustment' number but no history, migrate it
    if (officialData.adjustment !== undefined && officialData.adjustment !== 0 && history.length === 0) {
        history.push({
            amount: parseInt(officialData.adjustment),
            note: "Legacy Adjustment",
            date: new Date().toLocaleDateString()
        });
    }

    const total = history.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
    return { history, total };
}

// Compatibility boundary only: translate backups from the former multi-format app.
// New application code reads and writes only the keys listed here.
const STORAGE_KEYS = ["teams", "tournament", "matches", "gameIDCounter", "officialStats", "payPerMatch"];
function normalizeTournamentBackup(data) {
    const read = (key, fallback) => data[key] == null ? fallback :
        (typeof data[key] === "string" ? JSON.parse(data[key]) : data[key]);
    const legacy = "customTeams" in data || "customTournaments" in data || "customMatches" in data || "teamData" in data || "brackets" in data;
    const teams = read(legacy ? "customTeams" : "teams", {});
    const tournaments = read(legacy ? "customTournaments" : "tournament", {});
    const sharedMatches = read("matches", []);
    const selected = legacy ? [...read("customMatches", []), ...sharedMatches.filter(match => match.custom)] : sharedMatches;
    if (!teams || Array.isArray(teams) || typeof teams !== "object" ||
        !tournaments || Array.isArray(tournaments) || typeof tournaments !== "object" || !Array.isArray(selected)) {
        throw new Error("Invalid tournament backup");
    }
    const matches = [...new Map(selected.map(match => {
        const { custom, newbie, preliminary, ...record } = match;
        return [record.id, record];
    })).values()];
    Object.values(teams).forEach(team => { team.games = matches.filter(match =>
        match.teamAID === team.teamID || match.teamBID === team.teamID).map(match => match.id); });
    return {
        teams: JSON.stringify(teams), tournament: JSON.stringify(tournaments), matches: JSON.stringify(matches),
        gameIDCounter: JSON.stringify(Math.max(Number(read("gameIDCounter", 0)) || 0, ...matches.map(match => Number(match.id) || 0))),
        officialStats: JSON.stringify(read("officialStats", {})),
        payPerMatch: String(data.payPerMatch ?? "250")
    };
}
function exportTournamentBackup() {
    return Object.fromEntries(STORAGE_KEYS.filter(key => localStorage.getItem(key) !== null)
        .map(key => [key, localStorage.getItem(key)]));
}
function importTournamentBackup(data) {
    if (!data || typeof data !== "object" || Array.isArray(data) ||
        !("teams" in data || "customTeams" in data || "tournament" in data || "customTournaments" in data || "teamData" in data || "brackets" in data)) {
        throw new Error("Invalid tournament backup");
    }
    const normalized = normalizeTournamentBackup(data);
    Object.entries(normalized).forEach(([key, value]) => localStorage.setItem(key, value));
    saveMatches(fetchMatches());
    ["customTeams", "customTournaments", "customMatches", "customGameIDCounter", "newbieTeams",
        "newbieStarted", "teamData", "brackets", "gamesStarted"].forEach(key => localStorage.removeItem(key));
}
function migrateTournamentStorage() {
    if (localStorage.getItem("customTeams") === null && localStorage.getItem("customTournaments") === null &&
        localStorage.getItem("customMatches") === null && localStorage.getItem("teamData") === null &&
        localStorage.getItem("brackets") === null) return;
    const data = Object.fromEntries(Array.from({ length: localStorage.length }, (_, i) => {
        const key = localStorage.key(i);
        return [key, localStorage.getItem(key)];
    }));
    importTournamentBackup(data);
    ["customTeams", "customTournaments", "customMatches", "customGameIDCounter", "newbieTeams",
        "newbieStarted", "teamData", "brackets", "gamesStarted"].forEach(key => localStorage.removeItem(key));
    Object.keys(data).filter(key => /FirstClick$/.test(key)).forEach(key => localStorage.removeItem(key));
}
migrateTournamentStorage();
