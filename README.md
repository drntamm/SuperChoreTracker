# 🌟 Super Chore Tracker

A vibrant, playful, and kid-friendly chore tracker designed to make daily routines fun and rewarding! Now with **parental authentication** and **cross-device cloud sync**.

## ✨ Features

### Original Features

- **Morning & Evening Routines**: Toggle between sun and moon modes to stay focused on the current time of day.
- **Multi-User Support**: Switch between different children to track personal progress.
- **Weekly Stats**: View progress with colorful daily completion percentages.
- **Custom Chores**: Easily add or delete chores on the fly.
- **Smart Templates**: Weekly chores (like unicycles on Thursdays or laundry on Saturdays) appear automatically.
- **Offline First**: All data is saved locally in your browser's storage.

### NEW: Enhanced Parental Controls & Cloud Sync
- 🔐 **Parental Authentication** – Email/password login and signup for account-based security
- ☁️ **Cross-Device Sync** – Access and update chores from any device
- 💾 **Automatic Cloud Persistence** – Changes sync automatically every 5 seconds
- 📱 **Offline Support** – Full functionality offline with local caching
- 🔄 **Smart Sync** – Seamlessly merges local and cloud data

## 🚀 Getting Started

### Local Development

To run the app locally:

1. Clone or download this repository.
2. Open terminal and run:
   ```bash
   npm start
   ```
3. Open the browser to the URL shown (typically `http://localhost:3000`)

### Using the App

#### First Time Users
- The app prompts for parental account creation
- Sign up with email and password (or choose "offline mode")
- Start tracking chores!

#### Cross-Device Sync
- Once logged in, data automatically syncs to the cloud
- Open on another device with the same account to see synchronized data
- Works offline – changes sync when connection is restored

#### Offline Mode
- Skip authentication to use the app locally only
- Data stored in browser's local storage
- PIN protection for parental settings still available

## 📁 Project Structure

```
SuperChoreTracker/
├── index.html          # Main HTML with auth modal
├── main.js             # App logic with cloud sync layer
├── style.css           # Vibrant styling
├── package.json        # Dependencies
├── vercel.json         # Vercel deployment config
├── api/
│   ├── auth.js         # Authentication endpoints (signup/login/verify)
│   └── sync.js         # Cloud data sync endpoints
└── README.md           # This file
```

## 🔧 Cloud Infrastructure

The app uses **Vercel Functions** for serverless backend:

- **`/api/auth`** – Handles signup, login, and token verification
- **`/api/sync`** – Stores/retrieves chore data for authenticated users

### Authentication Flow
1. User enters email + password
2. `/api/auth` verifies credentials and returns token
3. Token stored in `localStorage`
4. All data requests use token for authorization
5. `/api/sync` retrieves/saves user's chore data

## 🛠️ Built With

- **Frontend**: HTML5, CSS3 (Flexbox, Grid, Animations), Vanilla JavaScript (ES6+)
- **Backend**: Vercel Functions (Node.js)
- **Storage**: Browser LocalStorage (client), In-memory (server MVP)
- **Deployment**: Vercel

## 📚 API Reference

### Authentication (`/api/auth`)

**POST** - Signup
```json
{
  "action": "signup",
  "email": "parent@example.com",
  "password": "securePassword123"
}
```

**POST** - Login
```json
{
  "action": "login",
  "email": "parent@example.com",
  "password": "securePassword123"
}
```

### Data Sync (`/api/sync`)

**GET** - Retrieve chore data
```
Authorization: Bearer <token>
```

**POST** - Save/Update chore data
```json
{
  "users": ["Child 1", "Child 2"],
  "history": { /* chore history by date */ },
  "children": ["Child 1", "Child 2"]
}
```

## 🚢 Deployment on Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Vercel automatically builds and deploys
4. API routes work immediately
5. Static files served with optimal caching

```bash
# Or deploy directly via CLI:
vercel --prod
```

## 🔐 Security Notes

**Current MVP:**
- Tokens are base64 encoded (for quick MVP)
- Passwords hashed with SHA256 + salt
- No rate limiting
- In-memory storage

**For Production, implement:**
- JWT with proper cryptographic signing
- bcrypt/argon2 for password hashing
- Rate limiting on auth endpoints
- Persistent database (MongoDB, PostgreSQL, Supabase)
- HTTPS/TLS enforcement
- CSRF protection
- Input validation & sanitization
- Refresh token rotation

## 🧪 Testing

- ✅ Signup and login locally
- ✅ Data persists across page reloads
- ✅ Cloud sync between devices (test locally with multiple browser tabs)
- ✅ Offline mode works without internet
- ✅ Chore completion syncs to cloud
- ✅ Child names sync across devices

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank login screen | Check browser console; try offline mode |
| Data not syncing | Verify internet connection; check auth token |
| API errors | Ensure `/api` routes are properly deployed |
| PIN not working | PIN is local-only; reset via settings |

## 📦 Deployment

## 📄 License

MIT License

---
Made with ❤️ for organized families and happy mornings/evenings.
