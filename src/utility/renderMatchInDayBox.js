// For match selection Popup
const selectedMatchHerees = new Map();
// For date dragging 
let selectedMatchHere = null;
function createDayDiv(day, isOtherMonth, dateStr) {
    const date = new Date(dateStr);
    const dayDiv = document.createElement('div');
    dayDiv.className = `calendar-day${isOtherMonth ? ' other-month sort-hidden' : ' sort-hidden'}`;
    if (dateStr === '2005-04-01'){
        dayDiv.innerHTML = `
            <div class="calendar-date">${day}</div>
            <p> Andrew Kuo's Birthday 🎉</p>
            <p> Site Made by Andrew Kuo</p>
            <div class="calendar-matches"></div>
        `;
    }else{
        dayDiv.innerHTML = `
            <div class="calendar-date sort-hidden" id="${dateStr}">${day}</div>
            <div class="day-date indexpage-hidden sort-hidden">${formatDate(date)}</div>
            <div class="calendar-matches sort-hidden"></div>
        `;
    }
    
    dayDiv.style.cursor = 'pointer';
    dayDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    dayDiv.addEventListener('drop', (e) => {
        e.preventDefault();
        const matches = fetchMatches();
        const matchIndex = matches.findIndex(m => m.id === selectedMatchHere.id);
        matches[matchIndex].date = dateStr;
        saveMatches(matches);
        renderCalendar();
    });
    return dayDiv;
}


function createMatchDiv(match, dayDiv, matchesContainer, dateStr){
    const matchDiv = document.createElement('div');
    matchDiv.className = 'calendar-match sort-hidden';
    if (match.newbie) matchDiv.classList.add('newbie-cup');
    if (match.locked === undefined) {
        match.locked = false; // Initialize if undefined
    }
    // Long press to lock/unlock the match
    let longPressTimer;
    // Support both mouse and touch long-press to lock/unlock
    matchDiv.addEventListener('mousedown', () => {
        if (!matchDiv.classList.contains('dragging')) {
            longPressTimer = setTimeout(() => {
                match.locked = !match.locked;
                const matches = fetchMatches();
                const existingMatchIndex = matches.findIndex(m => m.id === match.id);
                matches[existingMatchIndex] = { ...match };
                saveMatches(matches);
                renderCalendar();
            }, 600);
        }
    });
    matchDiv.addEventListener('mouseup', () => clearTimeout(longPressTimer));
    matchDiv.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
    matchDiv.addEventListener('mouseup', () => clearTimeout(longPressTimer));
    matchDiv.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
    matchDiv.addEventListener('dragenter', (e) => {
        e.preventDefault();
        matchDiv.classList.add('dragging');
    });
    // Add lock icon if match is locked
    // Parse the first two characters of team IDs
    const teamAFirst2 = match.teamAID ? match.teamAID.substring(0, 2) : '';
    const teamBFirst2 = match.teamBID ? match.teamBID.substring(0, 2) : '';
    const teamAFirst3 = match.teamAID ? match.teamAID.substring(0, 3) : '';
    if(window.innerWidth <= 768) {
        if (teamAFirst2 === teamBFirst2) {
            matchDiv.textContent = `${teamAFirst3}`;
        } else {
            matchDiv.textContent = `${teamAFirst2} ${teamBFirst2}`;
        }
        if (match.locked) {
            matchDiv.style.border = '2px solid black';
        }
    }else if (match.teamAID === match.teamBID) {
        matchDiv.textContent = match.teamAID;
        matchDiv.style.background = '#888888'; // Highlight in dark grey for same team matches
    }else if (match.locked) {
        matchDiv.textContent = `🔒${match.group}: ${match.teamAID} vs ${match.teamBID} - ${match.official || 'No Official'}`;
        matchDiv.draggable = false; // Disable dragging
    } else {
        matchDiv.draggable = true;
        matchDiv.textContent = `${match.group}: ${match.teamAID} vs ${match.teamBID} - ${match.official || 'No Official'}`;
        matchDiv.addEventListener('dragstart', () => {
            clearTimeout(longPressTimer);
            selectedMatchHere = match;
            matchDiv.classList.add('dragging');
        });
        matchDiv.addEventListener('dragend', () => {
            matchDiv.classList.remove('dragging');
            renderCalendar();
        });
    }
    if (match.set1[0] !== 0 || match.set1[1] !== 0) {
        if (match.status) {
            matchDiv.classList.add('finished');
            matchDiv.classList.remove('unfinished');
        } else {
            matchDiv.classList.add('unfinished');
            matchDiv.classList.remove('finished');
        }
    }
    
    matchesContainer.appendChild(matchDiv);
    // Show the popup
    showMatchinfo(matchDiv, match);
    
}

function showPopup(dateStr) {
    const matches = fetchMatches();
    document.getElementById("popup-overlay").style.display = 'block';
    document.getElementById("popup").style.display = 'block';
    document.getElementById('popup-content').innerHTML = `
    <div style="max-height: 80vh; overflow-y: auto; gap: 15px; display: flex; flex-direction: column;">
        <button id="close-popup" class="close-popup-button" style="position: absolute; top: 4px; right: 4px; font-size: 24px; background: transparent; border: none; cursor: pointer;">&times;</button>
        <div class='search-container'>
            <input type="text" id="match-search" class="match-search" placeholder="Search matches...">
            <button class="action-btn" id="add-holiday-btn">Add Holiday</button>
        </div>
        <div id="match-list" class = 'scrollable-matches'>
            <!-- Matches will be inserted here -->
        </div>
        
        <div id="selected-matches" class = 'scrollable-matches'>
            <!-- Selected matches will appear here -->
        </div>

        <button id="save-match" class="btn-primary">Save</button>
    </div>
    `;
    const matchList = document.getElementById("match-list");
    
    
    renderFilteredUndatedMatches(dateStr, '');

    // Close button
    document.getElementById("close-popup").addEventListener("click", () => {
        document.getElementById("popup-overlay").style.display = 'none';
        document.getElementById("popup").style.display = 'none';
        // Remove fade effect from header
        const header = document.getElementById("sticky-header");
        if (header) header.classList.remove("popup-fade");
    });

    // Close the popup by clicking outside the popup
    document.getElementById("popup-overlay").addEventListener("click", () => {
        selectedMatchHerees.clear();
        document.getElementById("popup-overlay").style.display = 'none';
        document.getElementById("popup").style.display = 'none';
    })

    // Save btn
    document.getElementById('save-match').addEventListener('click' ,() => {
        selectedMatchHerees.forEach((assignment, key) => {
            const matchIndex = matches.findIndex(m => 
            m.id === assignment.match.id
        );

        if (matchIndex !== -1) {
            matches[matchIndex].date = assignment.date;
            console.log('savedMatchDate', matches[matchIndex].date);
        }
        });
        selectedMatchHerees.clear();
        saveMatches(matches);
        renderCalendar();
        document.getElementById("popup-overlay").style.display = 'none';
        document.getElementById("popup").style.display = 'none';
    });
    document.querySelector('.match-search').addEventListener('input', (event) => {
        const searchText = event.target.value.toLowerCase();
        renderFilteredUndatedMatches(dateStr, searchText);
    });
    document.getElementById('add-holiday-btn').addEventListener('click', () => {
        document.getElementById("holiday-popup-overlay").style.display = 'block';
        document.getElementById("holiday-popup").style.display = 'block';
        document.getElementById('holiday-content').innerHTML = `
            <h2 class="popup-title">Add Holiday on ${dateStr}</h2>
            <div>
                <label for="holiday-name">Holiday Name:</label>
                <input style="width: 80%; border-radius: 5px;" type="text" id="holiday-name" placeholder="Enter holiday name">
            </div>
            <div class="popup-buttons">
                <button id="save-holiday" class="btn-primary">Save Holiday</button>
            </div>
        `;
        // Attach save handler after the element exists
        document.getElementById('save-holiday').addEventListener('click', () => {
            const holidayNameElem = document.getElementById('holiday-name');
            const holidayName = holidayNameElem ? holidayNameElem.value.trim() : '';
            if (holidayName) {
                const matches = fetchMatches();
                const holiday = createGames(holidayName, holidayName, "", null, false, dateStr);
                saveMatches([...matches, holiday]);
                console.log(fetchMatches());
                document.getElementById("holiday-popup-overlay").style.display = 'none';
                document.getElementById("holiday-popup").style.display = 'none';
                document.getElementById("popup-overlay").style.display = 'none';
                document.getElementById("popup").style.display = 'none';
                renderCalendar();
            } else {
                alert('Please enter a holiday name.');
            }
        });
    });
    // Close popupup
    document.getElementById("holiday-popup-overlay").addEventListener("click", () => {
        document.getElementById("holiday-popup-overlay").style.display = 'none';
        document.getElementById("holiday-popup").style.display = 'none';
    });
}

function renderFilteredUndatedMatches(dateStr, searchText){
    const matchList = document.getElementById("match-list");
    matchList.innerHTML = ``; // Clear previous matches
    const matches = fetchMatches();
    const keywords = searchText.toLowerCase().trim().split(/\s+/); // Split by spaces
    
    // Get date info for filtering
    const date = new Date(dateStr);
    const dow = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const currentWeekStart = new Date(date);
    currentWeekStart.setDate(currentWeekStart.getDate() - dow);
    currentWeekStart.setHours(0,0,0,0); // optional: normalize to midnight
    const monday = new Date(currentWeekStart);
    monday.setDate(currentWeekStart.getDate() + 1);
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const currentWeekMatches = matches.filter(m => {
        if (!m.date) return false;
        const matchDate = new Date(m.date);
        matchDate.setHours(12, 0, 0, 0); // normalize to avoid timezone issues
        return matchDate >= monday && matchDate <= friday;
    });
    const currentWeekTeams = new Set(currentWeekMatches.map(cm => cm.teamAID).concat(currentWeekMatches.map(cm => cm.teamBID)).flat());
    
    // undated match
    const undatedMatches = matches.filter(match => {
        const key = `${match.id}`;
        return !match.date && !selectedMatchHerees.has(key);
    });
    const filteredUndatedMatches = undatedMatches.filter(m => 
        ((m.teamAID !== m.teamBID) || (m.teamAID === null && m.teamBID === null)) &&
        keywords.every(keyword => 
            (m.teamAID || '').toLowerCase().includes(keyword) || 
            (m.teamBID || '').toLowerCase().includes(keyword)
        )
    );
    
    // Calculate available/unavailable matches before rendering separator
    const filteredUndatedMatchesAvailable = filteredUndatedMatches.filter(m => m.availableDays.includes(dow) && !currentWeekTeams.has(m.teamAID) && !currentWeekTeams.has(m.teamBID));
    const availableIds = new Set(filteredUndatedMatchesAvailable.map(m => m.id));
    const filteredUndatedMatchesUnavailable = filteredUndatedMatches.filter(m => !availableIds.has(m.id));

    // add separator
    const starter = document.createElement("div");
    starter.textContent = `Undated Matches (${filteredUndatedMatchesAvailable.length} + ${filteredUndatedMatchesUnavailable.length})`;
    starter.classList.add("match-item-separator");
    matchList.appendChild(starter);
    filteredUndatedMatchesAvailable.forEach(match => {
        const matchDiv = document.createElement("div");
        matchDiv.textContent = `${match.group}: ${match.teamAID} vs ${match.teamBID}`;
        matchDiv.classList.add("match-item");
        if (match.newbie) matchDiv.classList.add('newbie-cup');
        // Add click event to select match
        matchDiv.addEventListener("click", () => addMatchToSelection(match, dateStr));
        matchList.appendChild(matchDiv);
    });
    filteredUndatedMatchesUnavailable.forEach(match => {
        const matchDiv = document.createElement("div");
        matchDiv.textContent = `${match.group}: ${match.teamAID} vs ${match.teamBID} (Unavailable)`;
        matchDiv.classList.add("match-item");
        matchDiv.style.opacity = '0.5'; // Dim the unavailable matches
        if (match.newbie) matchDiv.classList.add('newbie-cup');
        // Add click event to select match
        matchDiv.addEventListener("click", () => addMatchToSelection(match, dateStr));
        matchList.appendChild(matchDiv);
    });
    // add seperator
    const separator = document.createElement("div");
    separator.textContent = "Dated Matches";
    separator.classList.add("match-item-separator");
    matchList.appendChild(separator);

    // now append dated match
    const datedMatches = matches.filter(match => {
        const key = `${match.id}`;
        return match.date && !selectedMatchHerees.has(key);
    });
    const filteredDatedMatches = datedMatches.filter(m => 
        (m.teamAID !== m.teamBID) &&
        keywords.every(keyword => 
            (m.teamAID || '').toLowerCase().includes(keyword) || 
            (m.teamBID || '').toLowerCase().includes(keyword)
        )
    );
    const filteredDatedMatchesAvailable = filteredDatedMatches.filter(m => (m.availableDays.includes(dow)));
    const filteredDatedMatchesUnavailable = filteredDatedMatches.filter(m => (!m.availableDays.includes(dow)));
    filteredDatedMatchesAvailable.forEach(match => {
        const matchDiv = document.createElement("div");
        matchDiv.textContent = `${match.group}: ${match.teamAID} vs ${match.teamBID}`;
        matchDiv.classList.add("match-item-dated");
        if (match.newbie) matchDiv.classList.add('match-item-dated-newbie');
        // Add click event to select match
        matchDiv.addEventListener("click", () => addMatchToSelection(match, dateStr));
        matchList.appendChild(matchDiv);
    });
    filteredDatedMatchesUnavailable.forEach(match => {
        const matchDiv = document.createElement("div");
        matchDiv.textContent = `${match.group}: ${match.teamAID} vs ${match.teamBID} (Unavailable)`;
        matchDiv.classList.add("match-item-dated");
        matchDiv.style.opacity = '0.5'; // Dim the unavailable matches
        if (match.newbie) matchDiv.classList.add('match-item-dated-newbie');
        // Add click event to select match
        matchDiv.addEventListener("click", () => addMatchToSelection(match, dateStr));
        matchList.appendChild(matchDiv);
    });
}

function addMatchToSelection(match, dateStr) {
    match.date = dateStr; // Set the date
    const key = `${match.id}`;
    selectedMatchHerees.set(key, {
        match: match,
        date: dateStr
    });
    renderFilteredUndatedMatches(dateStr, '');
    renderSelectedMatches();
}

function renderSelectedMatches() {
    const selectedList = document.getElementById("selected-matches");
    selectedList.innerHTML = "";
    selectedMatchHerees.forEach((assignment, key) => {
        const div = document.createElement("div");
        div.textContent = `${assignment.match.teamAID} vs ${assignment.match.teamBID} on ${assignment.match.date}`;
        selectedList.appendChild(div);
    });
}

 function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric'
    });
}