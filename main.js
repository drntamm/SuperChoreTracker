// ========== AUTHENTICATION & CLOUD SYNC LAYER ==========
console.log('main.js loaded');

let authToken = localStorage.getItem('auth_token') || null;
let syncEnabled = true; // Always enabled in offline mode
let lastSyncTime = 0;
const SYNC_INTERVAL = 5000; // Auto-sync every 5 seconds

class CloudSync {
  static async login(email, password) {
    try {
      // Offline-only login - store credentials locally
      if (!email || !password) {
        throw new Error('Email and password required');
      }
      
      const token = btoa(`${email}:${password}`);
      authToken = token;
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_email', email);
      localStorage.setItem('sync_enabled', 'true');
      syncEnabled = true;
      
      console.log('Offline login successful');
      return { token, message: 'Login successful (offline mode)' };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async signup(email, password) {
    try {
      // Offline-only signup - store credentials locally
      if (!email || !password) {
        throw new Error('Email and password required');
      }
      
      const token = btoa(`${email}:${password}`);
      authToken = token;
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_email', email);
      localStorage.setItem('sync_enabled', 'true');
      syncEnabled = true;
      
      console.log('Offline signup successful');
      return { token, message: 'Account created (offline mode)' };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  static async syncToCloud() {
    if (!authToken || !syncEnabled) return;

    const now = Date.now();
    if (now - lastSyncTime < SYNC_INTERVAL) return; // Rate limit

    try {
      lastSyncTime = now;
      // In offline mode, just save to localStorage
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('history', JSON.stringify(history));
      console.log('Data saved to offline storage');
    } catch (error) {
      console.warn('Offline storage error:', error);
    }
  }

  static async syncFromCloud() {
    if (!authToken || !syncEnabled) return;

    try {
      // In offline mode, load from localStorage
      const savedUsers = localStorage.getItem('users');
      const savedHistory = localStorage.getItem('history');
      
      if (savedUsers) {
        Object.assign(users, JSON.parse(savedUsers));
      }
      if (savedHistory) {
        history.splice(0, history.length, ...JSON.parse(savedHistory));
      }
      
      console.log('Data loaded from offline storage');
    } catch (error) {
      console.warn('Offline storage error:', error);
    }
  }

  static logout() {
    authToken = null;
    syncEnabled = false;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('sync_enabled');
  }
}

// ========== ORIGINAL CHORE TRACKER CODE ==========

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

// Auth Modal Elements
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authTabs = document.querySelectorAll('.auth-tab');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const offlineModeLink = document.getElementById('offline-mode-link');

// ========== AUTHENTICATION FLOW ==========

function showAuthModal() {
    authModal.classList.remove('hidden');
}

function hideAuthModal() {
    authModal.classList.add('hidden');
}

// Auth tab switching
authTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = tab.dataset.mode;

        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        loginForm.classList.toggle('active', mode === 'login');
        signupForm.classList.toggle('active', mode === 'signup');

        authError.textContent = '';
        authForm.reset();
    });
});

// Handle auth form submission
console.log('Setting up auth form listener on:', authForm);
if (!authForm) console.error('authForm is null!');
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Auth form submitted');
    authError.textContent = '';

    const isLogin = loginForm.classList.contains('active');
    console.log('Is login:', isLogin);

    if (isLogin) {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            authError.textContent = 'Email and password required';
            return;
        }

        try {
            authError.textContent = 'Logging in...';
            console.log('Attempting login with:', { email });
            await CloudSync.login(email, password);
            console.log('Login successful');
            hideAuthModal();
            await CloudSync.syncFromCloud();
            init();
            authForm.reset();
        } catch (error) {
            console.error('Login exception:', error);
            authError.textContent = error.message;
        }
    } else {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;

        if (!email || !password || !confirm) {
            authError.textContent = 'All fields required';
            return;
        }

        if (password !== confirm) {
            authError.textContent = 'Passwords do not match';
            return;
        }

        if (password.length < 6) {
            authError.textContent = 'Password must be at least 6 characters';
            return;
        }

        try {
            authError.textContent = 'Creating account...';
            console.log('Attempting signup with:', { email });
            await CloudSync.signup(email, password);
            console.log('Signup successful');
            hideAuthModal();
            init();
            authForm.reset();
        } catch (error) {
            console.error('Signup exception:', error);
            authError.textContent = error.message;
        }
    }
});

// Offline mode link
offlineModeLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideAuthModal();
    init();
});

// Logout button
logoutBtn.addEventListener('click', () => {
    if (confirm('Logout and clear cloud sync?')) {
        CloudSync.logout();
        hideAuthModal();
        showAuthModal();
    }
});

// Show logout button only when authenticated
function updateLogoutBtn() {
    logoutBtn.style.display = authToken ? 'flex' : 'none';
}

// ========== INITIALIZATION & SYNC ==========

// Initialize
function init() {
    renderUserSelector();
    updateDateDisplay();
    loadCurrentDayState();
    renderChores();
    updateTheme();
    updateLogoutBtn();

    // Start periodic cloud sync
    if (syncEnabled) {
        setInterval(() => CloudSync.syncToCloud(), SYNC_INTERVAL);
    }
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
        CloudSync.syncToCloud();
    }
}

function deleteChore(id) {
    const today = getTodayDate();
    history[currentUser][today][currentMode] = history[currentUser][today][currentMode].filter(c => c.id !== id);
    saveAll();
    renderChores();
    CloudSync.syncToCloud();
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
        CloudSync.syncToCloud();
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
        renderSettings();
        return;
    }

    if (users.includes(newName)) {
        alert("Name already exists!");
        renderSettings();
        return;
    }

    users[index] = newName;

    if (history[oldName]) {
        history[newName] = history[oldName];
        delete history[oldName];
    }

    if (currentUser === oldName) {
        currentUser = newName;
    }

    saveAll();
    CloudSync.syncToCloud();
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
        CloudSync.syncToCloud();
        renderUserSelector();
        renderChores();
        renderSettings();
    }
}

addUserBtn.onclick = () => {
    const newName = `New Child ${users.length + 1}`;
    users.push(newName);
    saveAll();
    CloudSync.syncToCloud();
    renderUserSelector();
    renderSettings();
};

// Security Logic
let currentPinBuffer = '';
let securityCallback = null;
let securityMode = 'VERIFY';

function requireParentalControl(callback) {
    if (!parentalPin) {
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
            CloudSync.syncToCloud();
        }
    });
};

// ========== STARTUP LOGIC ==========

// Check if authenticated, otherwise show login
if (authToken && syncEnabled) {
    // Try to sync from cloud on startup
    CloudSync.syncFromCloud().then(() => {
        init();
    }).catch(() => {
        // If sync fails, clear token and show auth modal
        authToken = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('sync_enabled');
        showAuthModal();
    });
} else {
    // Show auth modal
    showAuthModal();
}

dashboardToggle.onclick = () => {
    dashboardView.classList.remove('hidden');
    renderDashboard();
};

closeDashboard.onclick = () => {
    dashboardView.classList.add('hidden');
};

profileToggle.onclick = () => {
    profileView.classList.remove('hidden');
    renderProfile();
};

closeProfile.onclick = () => {
    profileView.classList.add('hidden');
};

saveProfileBtn.onclick = () => {
    parentProfile.name = document.getElementById('parent-name').value;
    parentProfile.phone = document.getElementById('parent-phone').value;
    parentProfile.familyName = document.getElementById('family-name').value;
    parentProfile.timezone = document.getElementById('parent-timezone').value;
    
    saveAll();
    CloudSync.syncToCloud();
    alert('Profile saved successfully!');
};

function renderProfile() {
    document.getElementById('parent-name').value = parentProfile.name || '';
    document.getElementById('parent-email').value = parentProfile.email || '';
    document.getElementById('parent-phone').value = parentProfile.phone || '';
    document.getElementById('family-name').value = parentProfile.familyName || '';
    document.getElementById('parent-timezone').value = parentProfile.timezone || 'America/New_York';
}

function renderDashboard() {
    const allStats = {};
    
    users.forEach(user => {
        allStats[user] = calculateStreaks(user);
    });
    
    const currentStats = allStats[currentUser];
    
    document.getElementById('streak-value').textContent = currentStats.currentStreak + ' days';
    document.getElementById('week-completion').textContent = currentStats.weeklyCompletion + '%';
    document.getElementById('best-streak').textContent = currentStats.bestStreak + ' days';
    document.getElementById('total-tasks').textContent = currentStats.totalTasks;
    
    renderPerformanceChart(currentUser);
    renderInsights(currentStats, currentUser);
    renderComparison(allStats);
}

function calculateStreaks(user) {
    const userHistory = history[user] || {};
    const dates = Object.keys(userHistory).sort();
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    
    const today = getTodayDate();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }
    
    dates.forEach(date => {
        const dayData = userHistory[date];
        const morningChores = dayData.morning || [];
        const eveningChores = dayData.evening || [];
        const allChores = [...morningChores, ...eveningChores];
        
        const completed = allChores.filter(c => c.completed).length;
        const total = allChores.length;
        
        totalTasks += total;
        completedTasks += completed;
        
        if (total > 0 && completed === total) {
            tempStreak++;
            if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    });
    
    let consecutiveDays = 0;
    for (let i = last7Days.length - 1; i >= 0; i--) {
        const date = last7Days[i];
        if (userHistory[date]) {
            const dayData = userHistory[date];
            const allChores = [...(dayData.morning || []), ...(dayData.evening || [])];
            const completed = allChores.filter(c => c.completed).length;
            const total = allChores.length;
            
            if (total > 0 && completed === total) {
                consecutiveDays++;
            } else {
                break;
            }
        } else {
            break;
        }
    }
    currentStreak = consecutiveDays;
    
    let weekCompleted = 0;
    let weekTotal = 0;
    last7Days.forEach(date => {
        if (userHistory[date]) {
            const dayData = userHistory[date];
            const allChores = [...(dayData.morning || []), ...(dayData.evening || [])];
            weekCompleted += allChores.filter(c => c.completed).length;
            weekTotal += allChores.length;
        }
    });
    
    const weeklyCompletion = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
    
    return {
        currentStreak,
        bestStreak,
        weeklyCompletion,
        totalTasks
    };
}

function renderPerformanceChart(user) {
    const chartContainer = document.getElementById('performance-chart');
    chartContainer.innerHTML = '';
    
    const userHistory = history[user] || {};
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last30Days.push(d.toISOString().split('T')[0]);
    }
    
    last30Days.forEach(date => {
        const dayData = userHistory[date];
        let percentage = 0;
        
        if (dayData) {
            const allChores = [...(dayData.morning || []), ...(dayData.evening || [])];
            const completed = allChores.filter(c => c.completed).length;
            const total = allChores.length;
            percentage = total > 0 ? (completed / total) * 100 : 0;
        }
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        
        const barFill = document.createElement('div');
        barFill.className = 'bar';
        barFill.style.height = percentage + '%';
        
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = new Date(date).getDate();
        
        bar.appendChild(barFill);
        bar.appendChild(label);
        chartContainer.appendChild(bar);
    });
}

function renderInsights(stats, user) {
    const insightsList = document.getElementById('insights-list');
    insightsList.innerHTML = '';
    
    const insights = generateInsights(stats, user);
    
    insights.forEach(insight => {
        const item = document.createElement('div');
        item.className = 'insight-item';
        item.innerHTML = '<span class="insight-icon">' + insight.icon + '</span><span class="insight-text">' + insight.text + '</span>';
        insightsList.appendChild(item);
    });
}

function generateInsights(stats, user) {
    const insights = [];
    
    if (stats.currentStreak >= 7) {
        insights.push({
            icon: '🔥',
            text: 'Amazing! ' + user + ' has a ' + stats.currentStreak + '-day streak!'
        });
    } else if (stats.currentStreak >= 3) {
        insights.push({
            icon: '⭐',
            text: 'Great job! ' + user + ' is on a ' + stats.currentStreak + '-day streak!'
        });
    } else if (stats.currentStreak === 0) {
        insights.push({
            icon: '💪',
            text: "Let's start a new streak today!"
        });
    }
    
    if (stats.weeklyCompletion >= 90) {
        insights.push({
            icon: '🏆',
            text: 'Excellent! ' + stats.weeklyCompletion + '% completion this week!'
        });
    } else if (stats.weeklyCompletion >= 70) {
        insights.push({
            icon: '👍',
            text: 'Good work! ' + stats.weeklyCompletion + '% completion this week.'
        });
    } else if (stats.weeklyCompletion < 50) {
        insights.push({
            icon: '📈',
            text: "Room for improvement. Let's aim higher this week!"
        });
    }
    
    if (stats.bestStreak > stats.currentStreak && stats.bestStreak >= 5) {
        insights.push({
            icon: '🎯',
            text: 'Personal best is ' + stats.bestStreak + ' days. Let\'s beat it!'
        });
    }
    
    const today = getTodayDate();
    const todayData = history[user]?.[today];
    if (todayData) {
        const morningChores = todayData.morning || [];
        const eveningChores = todayData.evening || [];
        const morningCompleted = morningChores.filter(c => c.completed).length;
        const eveningCompleted = eveningChores.filter(c => c.completed).length;
        
        if (morningChores.length > 0 && morningCompleted === morningChores.length) {
            insights.push({
                icon: '☀️',
                text: 'Morning routine completed! Great start to the day!'
            });
        }
        
        if (eveningChores.length > 0 && eveningCompleted === eveningChores.length) {
            insights.push({
                icon: '🌙',
                text: 'Evening routine completed! Sleep well!'
            });
        }
    }
    
    if (insights.length === 0) {
        insights.push({
            icon: '🌟',
            text: 'Keep up the great work!'
        });
    }
    
    return insights;
}

function renderComparison(allStats) {
    const comparisonGrid = document.getElementById('comparison-grid');
    comparisonGrid.innerHTML = '';
    
    users.forEach(user => {
        const stats = allStats[user];
        const card = document.createElement('div');
        card.className = 'comparison-card';
        
        const html = '<div class="comparison-name">' + user + '</div>' +
            '<div class="comparison-stats">' +
            '<div class="comparison-stat"><span class="stat-label">Streak</span><span class="stat-value">' + stats.currentStreak + ' days</span></div>' +
            '<div class="comparison-stat"><span class="stat-label">This Week</span><span class="stat-value">' + stats.weeklyCompletion + '%</span></div>' +
            '<div class="comparison-stat"><span class="stat-label">Best</span><span class="stat-value">' + stats.bestStreak + ' days</span></div>' +
            '</div>';
        
        card.innerHTML = html;
        comparisonGrid.appendChild(card);
    });
}
