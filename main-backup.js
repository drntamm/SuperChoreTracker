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
let parentalPin = localStorage.getItem('chore_pin') || null;

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
const settingsToggle = document.getElementById('settings-toggle');
const settingsView = document.getElementById('settings-view');
const closeSettings = document.getElementById('close-settings');
const userMgmtList = document.getElementById('user-management-list');
const addUserBtn = document.getElementById('add-user-btn');
const securityView = document.getElementById('security-view');
const closeSecurity = document.getElementById('close-security');
const securityTitle = document.getElementById('security-title');
const securityMsg = document.getElementById('security-msg');
const pinDisplay = document.getElementById('pin-display');
const keypad = document.getElementById('keypad');
const dateDisplay = document.getElementById('current-date');

// Initialize
function init() {
    // Migrate old history format if needed (if history was simple object, now it's keyed by user)
    // Most logic already handles history[currentUser], but we ensure users array and history keys match
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
        if (parentalPin) localStorage.setItem('chore_pin', parentalPin);
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

// User Management Actions
settingsToggle.onclick = () => {
    requireParentalControl(() => {
        renderSettings();
        settingsView.classList.remove('hidden');
    });
};

closeSettings.onclick = () => settingsView.classList.add('hidden');

function renderSettings() {
    userMgmtList.innerHTML = '';
    users.forEach((user, index) => {
        const div = document.createElement('div');
        div.className = 'user-edit-row';
        div.innerHTML = `
            <input type="text" value="${user}" onchange="renameUser(${index}, this.value)">
            <button class="small-delete-btn" onclick="deleteUser(${index})">🗑️</button>
        `;
        userMgmtList.appendChild(div);
    });

    // Add PIN management option
    const pinDiv = document.createElement('div');
    pinDiv.className = 'user-edit-row';
    pinDiv.style.marginTop = '20px';
    pinDiv.innerHTML = `
        <button class="add-user-btn" onclick="setupNewPin()" style="border-style: solid; background: #F1F5F9; color: var(--text-main); border-color: #E2E8F0;">
            ${parentalPin ? 'Change PIN' : 'Set Parental PIN'}
        </button>
    `;
    userMgmtList.appendChild(pinDiv);
}

function setupNewPin() {
    settingsView.classList.add('hidden');
    startPinWorkflow('SET');
}

function renameUser(index, newName) {
    const oldName = users[index];
    newName = newName.trim();
    if (!newName || newName === oldName) {
        renderSettings(); // Reset to current name if empty or same
        return;
    }

    if (users.includes(newName)) {
        alert("Name already exists!");
        renderSettings();
        return;
    }

    // Update users array
    users[index] = newName;

    // Migrate history
    if (history[oldName]) {
        history[newName] = history[oldName];
        delete history[oldName];
    }

    // Update current user if renamed
    if (currentUser === oldName) {
        currentUser = newName;
    }

    saveAll();
    renderUserSelector();
    renderChores();
    renderSettings();
}

function deleteUser(index) {
    if (users.length <= 1) {
        alert("You must have at least one child!");
        return;
    }

    const userName = users[index];
    if (confirm(`Delete data for ${userName}? This cannot be undone.`)) {
        users.splice(index, 1);
        delete history[userName];

        if (currentUser === userName) {
            currentUser = users[0];
        }

        saveAll();
        renderUserSelector();
        renderChores();
        renderSettings();
    }
}

addUserBtn.onclick = () => {
    const newName = `New Child ${users.length + 1}`;
    users.push(newName);
    saveAll();
    renderUserSelector();
    renderSettings();
};

// Security Logic
let currentPinBuffer = '';
let securityCallback = null;
let securityMode = 'VERIFY'; // 'VERIFY' or 'SET'

function requireParentalControl(callback) {
    if (!parentalPin) {
        // No PIN set yet, but we should probably advise setting one
        callback();
        return;
    }
    securityCallback = callback;
    startPinWorkflow('VERIFY');
}

function startPinWorkflow(mode) {
    securityMode = mode;
    currentPinBuffer = '';
    securityTitle.textContent = mode === 'SET' ? 'Set Parental PIN' : 'Parental Control';
    securityMsg.textContent = mode === 'SET' ? 'Create a 4-digit PIN' : 'Enter PIN to continue';
    updatePinDisplay();
    securityView.classList.remove('hidden');
}

function updatePinDisplay() {
    const dots = pinDisplay.querySelectorAll('span');
    dots.forEach((dot, i) => {
        dot.classList.toggle('filled', i < currentPinBuffer.length);
    });
}

keypad.onclick = (e) => {
    if (!e.target.classList.contains('key')) return;
    const val = e.target.textContent;

    if (val === 'C') {
        currentPinBuffer = '';
    } else if (val === '✕') {
        currentPinBuffer = currentPinBuffer.slice(0, -1);
    } else if (currentPinBuffer.length < 4) {
        currentPinBuffer += val;
    }

    updatePinDisplay();

    if (currentPinBuffer.length === 4) {
        setTimeout(handlePinComplete, 250);
    }
};

function handlePinComplete() {
    if (securityMode === 'SET') {
        parentalPin = currentPinBuffer;
        saveAll();
        alert("PIN saved successfully!");
        securityView.classList.add('hidden');
    } else {
        if (currentPinBuffer === parentalPin) {
            securityView.classList.add('hidden');
            if (securityCallback) securityCallback();
        } else {
            alert("Incorrect PIN!");
            currentPinBuffer = '';
            updatePinDisplay();
        }
    }
}

closeSecurity.onclick = () => {
    securityView.classList.add('hidden');
    securityCallback = null;
};

// Event Listeners
morningBtn.onclick = () => switchMode('morning');
eveningBtn.onclick = () => switchMode('evening');
addBtn.onclick = addChore;
choreInput.onkeypress = (e) => { if (e.key === 'Enter') addChore(); };
resetBtn.onclick = () => {
    requireParentalControl(() => {
        if (confirm('Reset today\'s chores for ' + currentUser + '?')) {
            const today = getTodayDate();
            history[currentUser][today][currentMode].forEach(c => c.completed = false);
            saveAll();
            renderChores();
        }
    });
};

init();
