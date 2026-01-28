// Helper to check if it's Thursday/Saturday
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function getDayIndex() { return new Date().getDay(); }
function getTodayDate() { return new Date().toISOString().split('T')[0]; }

// Default Configuration
const DEFAULT_USERS = ['Child 1', 'Child 2'];
const CHORE_TEMPLATES = {
    morning: [
        { id: 1, text: '🦷 Brush Teeth' },
        { id: 2, text: '🛏️ Make Bed' },
        { id: 3, text: '🥣 Eat Breakfast' },
        { id: 16, text: '🙏 Prayer' },
        { id: 11, text: '🚲 Grab Unicycle', day: 4 }, // Thursday
        { id: 12, text: '🪖 Grab Helmet', day: 4 },   // Thursday
        { id: 13, text: '🧺 Sort Laundry', day: 6 }, // Saturday
        { id: 14, text: '🧹 Clean Room', day: 6 },            // Saturday
        { id: 15, text: '👕 Pick Outfits', day: 6 }    // Saturday
    ],
    evening: [
        { id: 4, text: '👕 Put on PJs' },
        { id: 5, text: '📚 Read a Book' },
        { id: 17, text: '🙏 Prayer' },
        { id: 6, text: '🎒 Pack Backpack' },
        { id: 7, text: '📝 Check Homework' },
        { id: 8, text: '✍️ Parent Signatures' },
        { id: 9, text: '🍽️ Load Dishwasher' },
        { id: 10, text: '🧹 Vacuum Floor' }
    ]
};

// Application State
let users, currentUser, history;

try {
    users = JSON.parse(localStorage.getItem('chore_users')) || DEFAULT_USERS;
} catch (e) {
    console.error("Failed to load users from localStorage:", e);
    users = DEFAULT_USERS;
}

currentUser = localStorage.getItem('chore_current_user') || users[0];
currentMode = 'morning';

try {
    history = JSON.parse(localStorage.getItem('chore_history')) || {};
} catch (e) {
    console.error("Failed to load history from localStorage:", e);
    history = {};
}

// DOM Elements
const userSelect = document.getElementById('user-select');
const choreList = document.getElementById('chore-list');
const morningBtn = document.getElementById('morning-mode');
const eveningBtn = document.getElementById('evening-mode');
const appTitle = document.getElementById('app-title');
const appSubtitle = document.getElementById('app-subtitle');
const choreInput = document.getElementById('chore-input');
const addBtn = document.getElementById('add-btn');
const progressInfo = document.getElementById('progress-info');
const resetBtn = document.getElementById('reset-btn');
const statsToggle = document.getElementById('stats-toggle');
const statsView = document.getElementById('stats-view');
const closeStats = document.getElementById('close-stats');
const statsGrid = document.getElementById('stats-grid');
const dateDisplay = document.getElementById('current-date');

// Initialize
function init() {
    renderUserSelector();
    updateDateDisplay();
    loadCurrentDayState();
    renderChores();
    updateTheme();
}

function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('en-US', options);
}

function renderUserSelector() {
    userSelect.innerHTML = users.map(u => `<option value="${u}" ${u === currentUser ? 'selected' : ''}>${u}</option>`).join('');
}

function loadCurrentDayState() {
    const today = getTodayDate();
    if (!history[currentUser]) history[currentUser] = {};
    if (!history[currentUser][today]) {
        // Create new daily entry if it doesn't exist
        const morning = CHORE_TEMPLATES.morning
            .filter(c => !c.day || c.day === getDayIndex())
            .map(c => ({ ...c, completed: false, isCustom: false }));

        const evening = CHORE_TEMPLATES.evening.map(c => ({ ...c, completed: false, isCustom: false }));

        history[currentUser][today] = { morning, evening };
        saveAll();
    }
}

function renderChores() {
    const today = getTodayDate();
    const dayData = history[currentUser][today];
    const currentChores = dayData[currentMode];

    choreList.innerHTML = '';
    currentChores.forEach(chore => {
        const li = document.createElement('li');
        li.className = `chore-item ${chore.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="checkbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <span class="chore-text">${chore.text}</span>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteChore(${chore.id})">×</button>
        `;
        li.onclick = () => toggleChore(chore.id);
        choreList.appendChild(li);
    });
    updateProgress();
}

function toggleChore(id) {
    const today = getTodayDate();
    const chore = history[currentUser][today][currentMode].find(c => c.id === id);
    if (chore) {
        chore.completed = !chore.completed;
        saveAll();
        renderChores();
    }
}

function deleteChore(id) {
    const today = getTodayDate();
    history[currentUser][today][currentMode] = history[currentUser][today][currentMode].filter(c => c.id !== id);
    saveAll();
    renderChores();
}

function addChore() {
    const text = choreInput.value.trim();
    if (text) {
        const today = getTodayDate();
        history[currentUser][today][currentMode].push({
            id: Date.now(),
            text: text,
            completed: false,
            isCustom: true
        });
        choreInput.value = '';
        saveAll();
        renderChores();
    }
}

function saveAll() {
    try {
        localStorage.setItem('chore_history', JSON.stringify(history));
        localStorage.setItem('chore_users', JSON.stringify(users));
        localStorage.setItem('chore_current_user', currentUser);
    } catch (e) {
        console.error("Failed to save to localStorage:", e);
        // Fallback for full storage or other issues
        if (e.name === 'QuotaExceededError') {
            alert("Storage is full! Please clear some chores or browser data.");
        }
    }
}

function updateProgress() {
    const today = getTodayDate();
    const list = history[currentUser][today][currentMode];
    const completed = list.filter(c => c.completed).length;
    progressInfo.textContent = `${completed} / ${list.length} Done`;
}

function switchMode(newMode) {
    currentMode = newMode;
    morningBtn.classList.toggle('active', currentMode === 'morning');
    eveningBtn.classList.toggle('active', currentMode === 'evening');
    document.body.classList.toggle('evening', currentMode === 'evening');

    appTitle.textContent = currentMode === 'morning' ? 'Morning Routine' : 'Evening Routine';
    appSubtitle.textContent = currentMode === 'morning' ? 'Start your day with a win!' : 'Relax it is bedtime.';
    renderChores();
}

function updateTheme() {
    document.body.classList.toggle('evening', currentMode === 'evening');
}

// User Switching
userSelect.onchange = (e) => {
    currentUser = e.target.value;
    loadCurrentDayState();
    renderChores();
    saveAll();
};

// Weekly Stats
statsToggle.onclick = () => {
    renderStats();
    statsView.classList.remove('hidden');
};

closeStats.onclick = () => statsView.classList.add('hidden');

function renderStats() {
    statsGrid.innerHTML = '';
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    last7Days.forEach(date => {
        const dayName = days[new Date(date).getDay()];
        const dayData = (history[currentUser] && history[currentUser][date]);
        let percent = 0;
        if (dayData) {
            const total = dayData.morning.length + dayData.evening.length;
            const done = dayData.morning.filter(c => c.completed).length + dayData.evening.filter(c => c.completed).length;
            percent = total > 0 ? Math.round((done / total) * 100) : 0;
        }

        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <span class="stat-day">${dayName}</span>
            <span class="stat-value">${percent}%</span>
        `;
        statsGrid.appendChild(card);
    });
}

// Event Listeners
morningBtn.onclick = () => switchMode('morning');
eveningBtn.onclick = () => switchMode('evening');
addBtn.onclick = addChore;
choreInput.onkeypress = (e) => { if (e.key === 'Enter') addChore(); };
resetBtn.onclick = () => {
    if (confirm('Reset today\'s chores for ' + currentUser + '?')) {
        const today = getTodayDate();
        history[currentUser][today][currentMode].forEach(c => c.completed = false);
        saveAll();
        renderChores();
    }
};

init();
