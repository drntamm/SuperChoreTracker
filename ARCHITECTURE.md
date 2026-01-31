# Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
├─────────────────────────────────────────────────────────────┤
│  index.html                                                 │
│  ├── Auth Modal (login/signup forms)                        │
│  ├── Main App UI (chores, stats, settings)                  │
│  └── PIN Keypad (parental control)                          │
│                                                              │
│  main.js                                                    │
│  ├── CloudSync class (auth + sync)                          │
│  ├── App state (users, history, currentUser)               │
│  └── Event handlers & render functions                      │
│                                                              │
│  localStorage                                               │
│  ├── auth_token (JWT/base64)                               │
│  ├── chore_history (JSON)                                   │
│  ├── chore_users (array)                                    │
│  └── sync_enabled (boolean)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
                    (HTTPS API Calls)
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL FUNCTIONS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /api/auth.js                                               │
│  ├── POST /api/auth → signup                               │
│  ├── POST /api/auth → login                                │
│  └── POST /api/auth → verify-token                         │
│                                                              │
│  /api/sync.js                                               │
│  ├── GET  /api/sync → fetch user data                      │
│  └── POST /api/sync → save user data                       │
│                                                              │
│  In-memory Data Store (per server instance)                │
│  └── users: { email → {password, children, data} }         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
                     (for production:)
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Future)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MongoDB / PostgreSQL / Supabase                            │
│  ├── users collection                                       │
│  ├── chores collection                                      │
│  └── sync_logs collection                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Sequences

### Signup Flow

```
User Fills Form
    ↓
validateEmail() + validatePassword()
    ↓
CloudSync.signup(email, password)
    ↓
POST /api/auth { action: "signup", email, password }
    ↓
API validates & creates user
    ↓
Returns token (base64 email)
    ↓
localStorage.setItem('auth_token', token)
    ↓
CloudSync.syncFromCloud() [fetch empty data]
    ↓
init() → renders app
```

### Chore Completion Flow

```
Child checks off chore
    ↓
toggleChore(choreId)
    ↓
history[currentUser][today][mode].find() → toggle.completed
    ↓
saveAll() [localStorage]
    ↓
renderChores() [update UI]
    ↓
CloudSync.syncToCloud() [rate-limited, 5s]
    ↓
POST /api/sync { users, history, children }
    ↓
API stores in memory
    ↓
✓ Synced to cloud
```

### Cross-Device Sync Flow

```
Device 1: User completes chore
    ├─ toggleChore() → saveAll()
    └─ CloudSync.syncToCloud() → POST /api/sync
         ↓
      Server updates user's data
         ↓
Device 2: User opens app
    ├─ Page load
    ├─ CloudSync.syncFromCloud() → GET /api/sync
    └─ Receives updated data
         ↓
      history = updated data
      renderChores() → shows latest state
```

### Offline Mode Flow

```
User: "Use offline mode" click
    ↓
hideAuthModal()
    ↓
authToken = null
    ↓
syncEnabled = false
    ↓
init() [loads from localStorage only]
    ↓
App runs fully locally
    ↓
Changes saved to localStorage only
    ↓
No network requests made
```

## State Management

### Local State (Browser)

```javascript
{
  users: ["Child 1", "Child 2"],
  currentUser: "Child 1",
  currentMode: "morning",
  authToken: "base64encodedtoken",
  syncEnabled: true,
  history: {
    "Child 1": {
      "2025-01-31": {
        morning: [{id, text, completed, isCustom}],
        evening: [{id, text, completed, isCustom}]
      },
      "2025-02-01": { ... }
    },
    "Child 2": { ... }
  },
  parentalPin: "1234" // optional, local-only
}
```

### Cloud State (Server Memory - MVP)

```javascript
{
  "parent@email.com": {
    hashedPassword: "sha256hash...",
    createdAt: "2025-01-31T...",
    children: ["Child 1", "Child 2"],
    data: {
      users: ["Child 1", "Child 2"],
      history: { /* same structure as above */ }
    },
    updatedAt: "2025-01-31T..."
  }
}
```

## Rate Limiting & Throttling

### Auto-Sync Throttling
```javascript
const SYNC_INTERVAL = 5000; // 5 seconds
let lastSyncTime = 0;

CloudSync.syncToCloud() {
  if (Date.now() - lastSyncTime < SYNC_INTERVAL) return;
  // ... do sync
  lastSyncTime = Date.now();
}
```

**Why?** Prevents excessive API calls on rapid chore updates

### Browser Storage Limits
- localStorage: ~5-10MB per domain
- IndexedDB: ~50MB+
- Quota error handling: Alert user if storage full

## Error Handling Strategy

### Network Errors
```javascript
try {
  await CloudSync.syncToCloud()
} catch (error) {
  console.warn('Sync failed (offline mode active)', error)
  // Continue working with local data
  // Retry on next scheduled sync
}
```

### Auth Errors
```javascript
if (response.status === 401) {
  // Token invalid/expired
  logout()
  showAuthModal()
}
```

### Data Integrity
```javascript
// Validate data structure before applying
if (data.data && data.data.users && Array.isArray(data.data.users)) {
  users = data.data.users
}
```

## Security Layers (MVP → Production)

### MVP (Current)
```
Email/Password → SHA256(password + "salt") → Token (base64 email)
```

### Production (Recommended)
```
Email/Password 
  → bcrypt(password) 
  → JWT (signed with secret)
  → Secure HTTP-only cookie / localStorage
  → Rate limiting
  → 2FA (optional)
```

## Performance Optimizations

### Implemented
- ✅ Throttled cloud sync (5s intervals)
- ✅ Local-first with cloud backup
- ✅ Lazy rendering (only visible chores)
- ✅ CSS animations use `transform` (GPU accelerated)

### Future
- [ ] Service Worker for offline caching
- [ ] Compression of history data
- [ ] Delta sync (only changed data)
- [ ] Indexed queries for faster searches
- [ ] Image optimization for mobile

## Scaling Considerations

### Current (Vercel + In-Memory)
- **Bottleneck:** Server memory (limited per instance)
- **Users supported:** ~100-500 concurrent per region
- **Data retention:** Lost on server restart

### Production Scalability
1. **Add Database**
   - MongoDB Atlas / PostgreSQL
   - Data persists across restarts
   - Enables horizontal scaling

2. **Enable Caching**
   - Redis layer for frequent queries
   - Reduces database load

3. **Implement CDN**
   - Vercel auto-caches static files
   - Consider edge functions for APIs

4. **Database Optimization**
   - Indexes on frequently queried fields
   - Archival for old data
   - Regular backups

## Monitoring & Observability

### Log Aggregation
```javascript
// Add to /api/auth.js and /api/sync.js
console.log(`[${new Date().toISOString()}] ${email} login attempt`)
```

### Metrics to Track
- Signup/Login success rate
- Sync latency (API response time)
- Storage quota usage
- Error rates by endpoint
- Active users per day

### Recommended Tools
- **Logs:** Vercel built-in + Datadog
- **Metrics:** Vercel Analytics + Prometheus
- **Errors:** Sentry or LogRocket
- **Monitoring:** UptimeRobot

---

## Future Architecture Evolution

```
MVP (Today)
  └─→ Production v1 (Database)
       └─→ v2 (Real-time sync with WebSocket)
            └─→ v3 (Offline-first with Service Worker)
                 └─→ v4 (Mobile app with Firebase)
```

Each phase adds capability without breaking existing users.
