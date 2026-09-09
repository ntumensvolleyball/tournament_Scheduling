// Fetch Data

function fetchMatches() {
    
    let matchesJSON = localStorage.getItem("matches");
    if (!matchesJSON) {
        console.log("No matches found.");
        localStorage.setItem("matches", "[]");
        console.log("Initialized empty matches.");
        return [];
    }
    try {
        return JSON.parse(matchesJSON);
    } catch (error) {
        console.error("Error parsing matches JSON:", error);
        return [];
    }
}

function fetchTeams(){
    let teamsJSON = localStorage.getItem("teams");
    if (!teamsJSON) {
        console.log("No teams found.");
        saveTeams({});
        teamsJSON = localStorage.getItem("teams");
    }
    try {
        return JSON.parse(teamsJSON);
    } catch (error) {
        console.error("Error parsing teams JSON:", error);
        return {};
    }
}

function fetchNewbieTeams(){
    let teamsJSON = localStorage.getItem("newbieTeams");
    if (!teamsJSON) {
        console.log("No teams found.");
        saveNewbieTeams({});
        teamsJSON = localStorage.getItem("newbieTeams");
    }
    try {
        return JSON.parse(teamsJSON);
    } catch (error) {
        console.error("Error parsing teams JSON:", error);
        return {};
    }
}

function fetchTeamData(){// for input
    let teamDataJSON = localStorage.getItem("teamData");
    if (!teamDataJSON) {
        console.log("No teamData found.");
        saveTeamData({});
        teamDataJSON = localStorage.getItem("teamData");
    }try {
        return JSON.parse(teamDataJSON);
    } catch (error) {
        console.error("Error parsing teamData JSON:", error);
        return {};
    }
}

function fetchBrackets(){
    const brackets = JSON.parse(localStorage.getItem('brackets')) || {};
    return brackets;
}

function fetchOfficialStats() {
    const officialStats = JSON.parse(localStorage.getItem('officialStats')) || {};
    return officialStats;
}

function fetchGamesStarted(){
    const hasGamesStarted = localStorage.getItem('gamesStarted') || false;
    return hasGamesStarted;
}

function fetchNewbieStarted(){
    const hasNewbieStarted = localStorage.getItem('newbieStarted') || false;
    return hasNewbieStarted;
}

function fetchGameIDCounter(){
    const gameIDCounter = localStorage.getItem('gameIDCounter') || 0;
    if (gameIDCounter === null) {
        localStorage.setItem("gameIDCounter", JSON.stringify(0));
        return 0;
    }
    return gameIDCounter;
}

function fetchFirstClick(firstClickKey){
    const isFirstClick = localStorage.getItem(firstClickKey) || false;
    return isFirstClick;
}

function fetchCustomTeams(){
    return fetchStoredJSON("customTeams", {});
}

function fetchCustomMatches(){
    return fetchStoredJSON("customMatches", []);
}

function fetchCustomTournaments(){
    return fetchStoredJSON("customTournaments", {});
}

function fetchCustomGameIDCounter(){
    return Number(localStorage.getItem("customGameIDCounter") || 0);
}
// Save data

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

function saveMatches(matches) {
    try {
        const matchesJSON = JSON.stringify(matches);
        localStorage.setItem("matches", matchesJSON);
    } catch (error) {
        console.error("Error saving matches:", error);
    }
}

function saveTeams(teams){
    try {
        const teamsJSON = JSON.stringify(teams);
        localStorage.setItem("teams", teamsJSON);
    } catch (error) {
        console.error("Error saving teams:", error);
    }
}

function saveNewbieTeams(teams){
    try {
        const teamsJSON = JSON.stringify(teams);
        localStorage.setItem("newbieTeams", teamsJSON);
    } catch (error) {
        console.error("Error saving teams:", error);
    }
}

function saveTeamData(teamData){
    try {
        const teamDataJSON = JSON.stringify(teamData);
        localStorage.setItem("teamData", teamDataJSON);
    } catch (error) {
        console.error("Error saving teamData:", error);
    }
}

function saveOfficialStats(officialStats){
    try {
        const officialsJSON = JSON.stringify(officialStats);
        localStorage.setItem("officialStats", officialsJSON);
    } catch (error) {
        console.error("Error saving officials:", error);
    }
}

function saveBrackets(existingBrackets){
    localStorage.setItem('brackets', JSON.stringify(existingBrackets));
}

function saveGameIDCounter(gameIDCounter){
    try {
        const gameIDCounterJSON = JSON.stringify(gameIDCounter);
        localStorage.setItem("gameIDCounter", gameIDCounterJSON);
    } catch (error) {
        console.error("Error saving gameIDCounter:", error);
    }
}

function saveFirstClick(firstClickKey, state){
    localStorage.setItem(firstClickKey, state);
}

function saveCustomTeams(teams){
    localStorage.setItem("customTeams", JSON.stringify(teams));
}

function saveCustomMatches(matches){
    localStorage.setItem("customMatches", JSON.stringify(matches));
}

function saveCustomTournaments(tournaments){
    localStorage.setItem("customTournaments", JSON.stringify(tournaments));
}

function saveCustomGameIDCounter(gameIDCounter){
    localStorage.setItem("customGameIDCounter", JSON.stringify(gameIDCounter));
}

function generateCustomGameID() {
    const nextID = fetchCustomGameIDCounter() + 1;
    saveCustomGameIDCounter(nextID);
    return nextID;
}

// 標記比賽已開始
function markGamesStarted(state) {
    localStorage.setItem('gamesStarted', state);
}

function markNewbieStarted(state) {
    localStorage.setItem('newbieStarted', state);
}

function wipeEverything(){
    localStorage.clear();
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

// preliminary score calculation
function calculatePreliminaryScore() {
    //console.log('Starting preliminary score calculation');

    const matches = fetchMatches();
    const teams = fetchTeams();

    Object.values(teams).forEach((team) => {
        let gamesWon = 0;
        let setsTotalResult = [0, 0];
        let scoreTotalResult = [0, 0];

        team.preliminaryScore = 0;

        Object.values(matches).forEach(match => {
            if ( match.status === true && match.preliminary === true){
                const matchResult = matchSetsWonLoss(match, team.teamID); // Fixed function call
                const scoreResult = matchScoreWonLoss(match, team.teamID);

                if (matchResult[0] > matchResult[1]) gamesWon++;
                setsTotalResult[0] += matchResult[0];
                setsTotalResult[1] += matchResult[1];
                scoreTotalResult[0] += scoreResult[0];
                scoreTotalResult[1] += scoreResult[1];
            }
        });
        //console.log(team.teamID, 'gamesWon', gamesWon, setsTotalResult, scoreTotalResult, scoreTotalResult[0]/scoreTotalResult[1]);
        team.preliminaryScore = (gamesWon * 100000000 + ratioWonLoss(setsTotalResult[0], setsTotalResult[1]) * 10000 + ratioWonLoss(scoreTotalResult[0], scoreTotalResult[1]));
        //console.log(`Final preliminary score for ${team.teamID}: ${team.preliminaryScore}`);
    });

    saveTeams(teams);
}

function getTeamRank(team) {
    // first calculate team rank
    const teams = fetchTeams();
    const group = team.preliminaryGroup;
    // Filter teams that are in the same group
    const groupTeams = Object.entries(teams)
        .filter(([id, t]) => t.preliminaryGroup === group)
        // Sort by preliminaryScore descending
        .sort((a, b) => b[1].preliminaryScore - a[1].preliminaryScore);

    // Find the position (index) of the current team in that sorted array
    const index = groupTeams.findIndex(([id]) => id === team.teamID);

    // Return rank (1-based index)
    return index + 1;
}

function isPreliminaryMatchesFinished(teamID) {
    const matches = fetchMatches();
    for (const m of Object.values(matches)) {
        if (m.preliminary === undefined){
            
        }else if (m.preliminary === true && (m.teamAID === teamID || m.teamBID === teamID) && m.status === false) {
            return false;
        }
        
    }
    return true;
}
// day sorting
function calculateAvailableDays(unavailableDays) {
    const allDays = [1, 2, 3, 4, 5];
    return allDays.filter(day => !unavailableDays.includes(Number(day)));
}

// Add this new function to calculate intersection of available days
function calculateMatchAvailableDays(teamA, teamB, boolNewbie = false, boolCustom = false) {
    const teams = boolCustom ? fetchCustomTeams() : boolNewbie ? fetchNewbieTeams() : fetchTeams();
    // Check if both teams exist and have availableDays
    if (!teams[teamA] || !teams[teamB]) {
        if(!teams[teamA] && !teams[teamB]){
            return [1, 2, 3, 4, 5];  // Return all days if teams not found
        }else if(!teams[teamA]){
            return teams[teamB].availableDays || [1, 2, 3, 4, 5];
        }else if(!teams[teamB]){
            return teams[teamA].availableDays || [1, 2, 3, 4, 5];
        }
    }

    const teamADays = teams[teamA].availableDays || [1, 2, 3, 4, 5];
    const teamBDays = teams[teamB].availableDays || [1, 2, 3, 4, 5];
    
    //console.log(`TeamA (${teamA}) days:`, teamADays);
    //console.log(`TeamB (${teamB}) days:`, teamBDays);
    
    //const validTeamADays = Array.isArray(teamADays) ? teamADays : [];
    //const validTeamBDays = Array.isArray(teamBDays) ? teamBDays : [];
    return Object.values(teamADays).filter(day => Object.values(teamBDays).includes(day));
}
// save Matches sub functions
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
function saveMatches(matches){
    const teams = fetchTeams();
    const newbieTeams = fetchNewbieTeams();
    let updated = false
    do {
        const refMatches = fetchMatches();
        updated = false
        Object.values(matches).forEach((match, index) => {
            // Calculate scores and update status
            match = updateMatchStatus(match);
            // Store previous winner before updating
            const previousWinner = matches[index].winner;
            // Store previous loser before updating
            const previousloser = matches[index].loser;
            const previousTeamAID = matches[index].teamAID;
            const previousTeamBID = matches[index].teamBID;
            match = updateMatchWinner(match);
            match.availableDays = calculateMatchAvailableDays(match.teamAID, match.teamBID, match.newbie, match.custom);
            // update brackets
            console.log(matches[index].status);
            if (matches[index].status) {
                // Handle next match updates
                if (matches[index].nextMatch) {
                    const nextMatchId = matches[index].nextMatch;
                    const nextMatch = matches.find(m => m.id === nextMatchId);
                    console.log('nextMatch', nextMatch);
                    // If winner changed, update next match
                    if (previousWinner !== matches[index].winner) {
                        // Remove previous winner from next match and update teams' games array
                        if (nextMatch.teamAID === previousWinner) {
                            // Remove game from previous winner's games array
                            if (match.newbie) {
                                if (newbieTeams[previousWinner] && newbieTeams[previousWinner].games) {
                                    newbieTeams[previousWinner].games = newbieTeams[previousWinner].games.filter(id => id !== nextMatchId);
                                }
                            } else {
                                if (teams[previousWinner] && teams[previousWinner].games) {
                                    teams[previousWinner].games = teams[previousWinner].games.filter(id => id !== nextMatchId);
                                }
                            }
                            
                            // Add game to new winner's games array
                            if (teams[matches[index].winner] && !match.newbie) {
                                if (!teams[matches[index].winner].games) {
                                    teams[matches[index].winner].games = [];
                                }
                                if (!teams[matches[index].winner].games.includes(nextMatchId)) {
                                    teams[matches[index].winner].games.push(nextMatchId);
                                }
                            }else if (newbieTeams[matches[index].winner] && match.newbie){
                                if (!newbieTeams[matches[index].winner].games) {
                                    newbieTeams[matches[index].winner].games = [];
                                }
                                if (!newbieTeams[matches[index].winner].games.includes(nextMatchId)) {
                                    newbieTeams[matches[index].winner].games.push(nextMatchId);
                                }
                            }
                            
                            nextMatch.teamAID = matches[index].winner;
                            //console.log(`Updated teamA in match ${nextMatchId} from ${previousWinner} to ${matches[index].winner}`);
                        } else if (nextMatch.teamBID === previousWinner) {
                            // Remove game from previous winner's games array
                            if(match.newbie){
                                if (newbieTeams[previousWinner] && newbieTeams[previousWinner].games) {
                                    newbieTeams[previousWinner].games = newbieTeams[previousWinner].games.filter(id => id !== nextMatchId);
                                }
                            }else{
                                if (teams[previousWinner] && teams[previousWinner].games) {
                                    teams[previousWinner].games = teams[previousWinner].games.filter(id => id !== nextMatchId);
                                }
                            }
                            
                            
                            // Add game to new winner's games array
                            if (teams[matches[index].winner] && !match.newbie) {
                                if (!teams[matches[index].winner].games) {
                                    teams[matches[index].winner].games = [];
                                }
                                if (!teams[matches[index].winner].games.includes(nextMatchId)) {
                                    teams[matches[index].winner].games.push(nextMatchId);
                                }
                            }else if (newbieTeams[matches[index].winner] && match.newbie){
                                if (!newbieTeams[matches[index].winner].games) {
                                    newbieTeams[matches[index].winner].games = [];
                                }
                                if (!newbieTeams[matches[index].winner].games.includes(nextMatchId)) {
                                    newbieTeams[matches[index].winner].games.push(nextMatchId);
                                }
                            }
                            
                            nextMatch.teamBID = matches[index].winner;
                            //console.log(`Updated teamB in match ${nextMatchId} from ${previousWinner} to ${matches[index].winner}`);
                        } else {
                            // If previous winner not found, add to first empty slot
                            if (nextMatch.teamAID === null || nextMatch.teamAID === '' || nextMatch.teamAID === undefined) {
                                // Add game to new winner's games array
                                if (teams[matches[index].winner] && !match.newbie) {
                                    if (!teams[matches[index].winner].games) {
                                        teams[matches[index].winner].games = [];
                                    }
                                    if (!teams[matches[index].winner].games.includes(nextMatchId)) {
                                        teams[matches[index].winner].games.push(nextMatchId);
                                    }
                                }else if (newbieTeams[matches[index].winner] && match.newbie){
                                    if (!newbieTeams[matches[index].winner].games) {
                                        newbieTeams[matches[index].winner].games = [];
                                    }
                                    if (!newbieTeams[matches[index].winner].games.includes(nextMatchId)) {
                                        newbieTeams[matches[index].winner].games.push(nextMatchId);
                                    }
                                }
                                
                                nextMatch.teamAID = matches[index].winner;
                                //.log(`Added winner to teamA in match ${nextMatchId}: ${matches[index].winner}`);
                            } else if (nextMatch.teamBID === null || nextMatch.teamBID === '' || nextMatch.teamBID === undefined) {
                                // Add game to new winner's games array
                                if (teams[matches[index].winner] && !match.newbie) {
                                    if (!teams[matches[index].winner].games) {
                                        teams[matches[index].winner].games = [];
                                    }
                                    if (!teams[matches[index].winner].games.includes(nextMatchId)) {
                                        teams[matches[index].winner].games.push(nextMatchId);
                                    }
                                }else if (newbieTeams[matches[index].winner] && match.newbie){
                                    if (!newbieTeams[matches[index].winner].games) {
                                        newbieTeams[matches[index].winner].games = [];
                                    }
                                    if (!newbieTeams[matches[index].winner].games.includes(nextMatchId)) {
                                        newbieTeams[matches[index].winner].games.push(nextMatchId);
                                    }
                                }
                                
                                nextMatch.teamBID = matches[index].winner;
                                //console.log(`Added winner to teamB in match ${nextMatchId}: ${matches[index].winner}`);
                            }
                        }
                    }
                }

                if (matches[index].loserNextMatch) {
                    const nextMatchId = matches[index].loserNextMatch;
                    const nextMatch = matches.find(m => m.id === nextMatchId);
                    console.log('loserNextMatch', nextMatch);
                    // If loser changed, update next match
                    if (previousloser !== matches[index].loser) {
                        // Remove previous loser from next match and update teams' games array
                        if (nextMatch.teamAID === previousloser) {
                            // Remove game from previous loser's games array
                            if (teams[previousloser] && teams[previousloser].games && !match.newbie) {
                                teams[previousloser].games = teams[previousloser].games.filter(id => id !== nextMatchId);
                            } else if (newbieTeams[previousloser] && newbieTeams[previousloser].games && match.newbie) {
                                newbieTeams[previousloser].games = newbieTeams[previousloser].games.filter(id => id !== nextMatchId);
                            }

                            // Add game to new loser's games array
                            if (teams[matches[index].loser] && !match.newbie) {
                                if (!teams[matches[index].loser].games) {
                                    teams[matches[index].loser].games = [];
                                }
                                if (!teams[matches[index].loser].games.includes(nextMatchId)) {
                                    teams[matches[index].loser].games.push(nextMatchId);
                                }
                            }else if (newbieTeams[matches[index].loser] && match.newbie){
                                if (!newbieTeams[matches[index].loser].games) {
                                    newbieTeams[matches[index].loser].games = [];
                                }
                                if (!newbieTeams[matches[index].loser].games.includes(nextMatchId)) {
                                    newbieTeams[matches[index].loser].games.push(nextMatchId);
                                }
                            }
                            
                            nextMatch.teamAID = matches[index].loser;
                            //console.log(`Updated teamA in match ${nextMatchId} from ${previousloser} to ${matches[index].loser}`);
                        } else if (nextMatch.teamBID === previousloser) {
                            // Remove game from previous loser's games array
                            if (teams[previousloser] && teams[previousloser].games && !match.newbie) {
                                teams[previousloser].games = teams[previousloser].games.filter(id => id !== nextMatchId);
                            } else if (newbieTeams[previousloser] && newbieTeams[previousloser].games && match.newbie) {
                                newbieTeams[previousloser].games = newbieTeams[previousloser].games.filter(id => id !== nextMatchId);
                            }
                            
                            // Add game to new loser's games array
                            if (teams[matches[index].loser] && !match.newbie) {
                                if (!teams[matches[index].loser].games) {
                                    teams[matches[index].loser].games = [];
                                }
                                if (!teams[matches[index].loser].games.includes(nextMatchId)) {
                                    teams[matches[index].loser].games.push(nextMatchId);
                                }
                            } else if (newbieTeams[matches[index].loser] && match.newbie) {
                                if (!newbieTeams[matches[index].loser].games) {
                                    newbieTeams[matches[index].loser].games = [];
                                }
                                if (!newbieTeams[matches[index].loser].games.includes(nextMatchId)) {
                                    newbieTeams[matches[index].loser].games.push(nextMatchId);
                                }
                            }
                            
                            nextMatch.teamBID = matches[index].loser;
                            //console.log(`Updated teamB in match ${nextMatchId} from ${previousloser} to ${matches[index].loser}`);
                        } else {
                            // If previous loser not found, add to first empty slot
                            if (nextMatch.teamAID === null || nextMatch.teamAID === '' || nextMatch.teamAID === undefined) {
                                // Add game to new loser's games array
                                if (teams[matches[index].loser] && !match.newbie) {
                                    if (!teams[matches[index].loser].games) {
                                        teams[matches[index].loser].games = [];
                                    }
                                    if (!teams[matches[index].loser].games.includes(nextMatchId)) {
                                        teams[matches[index].loser].games.push(nextMatchId);
                                    }
                                } else if (newbieTeams[matches[index].loser] && match.newbie) {
                                    if (!newbieTeams[matches[index].loser].games) {
                                        newbieTeams[matches[index].loser].games = [];
                                    }
                                    if (!newbieTeams[matches[index].loser].games.includes(nextMatchId)) {
                                        newbieTeams[matches[index].loser].games.push(nextMatchId);
                                    }
                                }
                                
                                nextMatch.teamAID = matches[index].loser;
                                //.log(`Added loser to teamA in match ${nextMatchId}: ${matches[index].loser}`);
                            } else if (nextMatch.teamBID === null || nextMatch.teamBID === '' || nextMatch.teamBID === undefined) {
                                // Add game to new loser's games array
                                if (teams[matches[index].loser] && !match.newbie) {
                                    if (!teams[matches[index].loser].games) {
                                        teams[matches[index].loser].games = [];
                                    }
                                    if (!teams[matches[index].loser].games.includes(nextMatchId)) {
                                        teams[matches[index].loser].games.push(nextMatchId);
                                    }
                                } else if (newbieTeams[matches[index].loser] && match.newbie) {
                                    if (!newbieTeams[matches[index].loser].games) {
                                        newbieTeams[matches[index].loser].games = [];
                                    }
                                    if (!newbieTeams[matches[index].loser].games.includes(nextMatchId)) {
                                        newbieTeams[matches[index].loser].games.push(nextMatchId);
                                    }
                                }
                                
                                nextMatch.teamBID = matches[index].loser;
                                //console.log(`Added loser to teamB in match ${nextMatchId}: ${matches[index].loser}`);
                            }
                        }
                    }
                }
            } else {
                if (matches[index].nextMatch !== null) {
                    const nextMatchId = matches[index].nextMatch;
                    const nextMatch = matches.find(m => m.id === nextMatchId);
                    
                    if (nextMatch) {
                        if (nextMatch.teamAID === previousTeamAID || nextMatch.teamAID === previousTeamBID) {
                            // Remove game from previous winner's games array
                            if (teams[nextMatch.teamAID] && teams[nextMatch.teamAID].games && !match.newbie) {
                                teams[nextMatch.teamAID].games = teams[nextMatch.teamAID].games.filter(id => id !== nextMatchId);
                            } else if (newbieTeams[nextMatch.teamAID] && newbieTeams[nextMatch.teamAID].games && match.newbie) {
                                newbieTeams[nextMatch.teamAID].games = newbieTeams[nextMatch.teamAID].games.filter(id => id !== nextMatchId);
                            }

                            nextMatch.teamAID = null;
                            //console.log(`Removed ${previousWinner} from teamA in match ${nextMatchId}`);
                        } else if (nextMatch.teamBID === previousTeamAID || nextMatch.teamBID === previousTeamBID) {
                            // Remove game from previous winner's games array
                            if (teams[nextMatch.teamBID] && teams[nextMatch.teamBID].games && !match.newbie) {
                                teams[nextMatch.teamBID].games = teams[nextMatch.teamBID].games.filter(id => id !== nextMatchId);
                            } else if (newbieTeams[nextMatch.teamBID] && newbieTeams[nextMatch.teamBID].games && match.newbie) {
                                newbieTeams[nextMatch.teamBID].games = newbieTeams[nextMatch.teamBID].games.filter(id => id !== nextMatchId);
                            }
                            
                            nextMatch.teamBID = null;
                            //console.log(`Removed ${previousWinner} from teamB in match ${nextMatchId}`);
                        }
                    }
                }
            }
        });
        
        
        if (JSON.stringify(refMatches) !== JSON.stringify(matches)) updated = true;
        saveTeams(teams);
        saveNewbieTeams(newbieTeams);
        const matchesJSON = JSON.stringify(matches);
        localStorage.setItem("matches", matchesJSON);
        
    } while (updated === true);
    recalculateOfficialStats(matches);
}

function prepareTeamID(teamID) {
    // Trim the teamID for consistent comparisons.
    return teamID.trim();
}

function getTeamStorage(boolNewbie = false) {
    return boolNewbie
        ? { fetch: fetchNewbieTeams, save: saveNewbieTeams }
        : { fetch: fetchTeams, save: saveTeams };
}

function updateTeamID(originalTeamID, newTeamID, boolNewbie = false) {
    const teamStorage = getTeamStorage(boolNewbie);
    const teams = teamStorage.fetch();
    if (!(originalTeamID in teams)) {
        console.error(`Team "${originalTeamID}" not found.`);
        return;
    }
    if (newTeamID in teams) {
        console.error(`Team "${newTeamID}" already exists.`);
        return;
    }

    const newTeams = {};
    Object.keys(teams).forEach(key => {
        if (key === originalTeamID) {
            const teamRecord = teams[originalTeamID];
            teamRecord.teamID = newTeamID; // update team record if applicable
            newTeams[newTeamID] = teamRecord;
        } else {
            newTeams[key] = teams[key];
        }
    });
    teamStorage.save(newTeams);

    const teamData = fetchTeamData();
    for (const tier in teamData) {
        const teamList = teamData[tier].split('\n');
        const updatedList = teamList.map(name => {
            if (prepareTeamID(name) === prepareTeamID(originalTeamID)) {
                return newTeamID;
            }
            return name;
        });
        teamData[tier] = updatedList.join('\n');
    }
    console.log("teamData", teamData);
    saveTeamData(teamData);

    const matches = fetchMatches();
    matches.forEach(match => {
        if (match.teamAID === originalTeamID) {
            match.teamAID = newTeamID;
        }
        if (match.teamBID === originalTeamID) {
            match.teamBID = newTeamID;
        }
    });
    saveMatches(matches);

    console.log(`Team ID updated from "${originalTeamID}" to "${newTeamID}".`);
}


//officials
// Load pay per match from localStorage
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
function generateGameID() {
    // Retrieve the current gameIDCounter
    let gameIDCounter = fetchGameIDCounter();

    // If no gameIDCounter exists, initialize it to 1
    if (!gameIDCounter) {
        gameIDCounter = 1;
        console.log('set gameIDCounter to one')
    } else {
        // Convert the stored value to a number and increment it
        gameIDCounter = parseInt(gameIDCounter, 10) + 1;
    }

    // Save the updated gameIDCounter 
    saveGameIDCounter(gameIDCounter);

    // Return the current gameIDCounter
    return gameIDCounter;
}

function createGames(teamA, teamB, preliminary, group = null, boolNewbie=false, date="") {
    // Generate new game ID
    const gameId = generateGameID();
    
    // Create the match object
    const match = {
        id: gameId,
        teamAID: teamA,
        teamBID: teamB,
        set1: [0, 0],
        set2: [0, 0],
        set3: [0, 0],
        winner: null,
        status: false,
        nextMatch: null,
        preliminary: preliminary,
        group: group,
        newbie: boolNewbie, 
        availableDays: calculateMatchAvailableDays(teamA, teamB, boolNewbie),
        official: "",
        date: date
    };

    // Update teams' games arrays
    const teams = fetchTeams()
    
    // Update teamA's games array
    if (teams[teamA]) {
        if (!teams[teamA].games) {
            teams[teamA].games = [];
        }
        teams[teamA].games.push(gameId);
    }
    
    // Update teamB's games array
    if (teams[teamB]) {
        if (!teams[teamB].games) {
            teams[teamB].games = [];
        }
        teams[teamB].games.push(gameId);
    }
    
    // Save updated teams
    saveTeams(teams);

    return match;
}

// official recipt
// Helper to get total adjustment from history
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
