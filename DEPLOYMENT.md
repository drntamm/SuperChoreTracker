# Deployment & Setup Guide

## Quick Start (Local Testing)

```bash
# Install dependencies (optional)
npm install

# Start development server
npm start

# App opens at http://localhost:3000 (or port shown)
```

## Testing Cloud Features Locally

Since `/api` routes won't work in local `serve`, you can:

1. **Test Offline Mode** – Click "use offline mode" to bypass auth
2. **Test Multiple Devices** – Open app in multiple browser tabs/windows
3. **Test Full Stack** – Deploy to Vercel first (see below)

## Deploy to Vercel

### Option 1: GitHub Integration (Recommended)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" → Import GitHub repo
4. Select your repository
5. Click "Deploy"

**That's it!** Vercel automatically:
- Builds API routes from `/api` folder
- Serves static files
- Configures CORS and routing

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# URL appears in terminal
```

## Environment Variables (Future)

Create `.env.local` for local development:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
```

In Vercel dashboard:
1. Project Settings → Environment Variables
2. Add same variables
3. Redeploy

## Testing Checklist

- [ ] Open app on desktop/mobile
- [ ] Sign up with test email
- [ ] Add/complete some chores
- [ ] Open on second device → see same data
- [ ] Go offline → app still works
- [ ] Go back online → data syncs
- [ ] Check browser console for errors
- [ ] Check Vercel logs for API errors

## Troubleshooting

### App shows login but API errors

**Check:**
1. Vercel deployment logs: `vercel logs --prod`
2. Browser network tab → `/api/auth` requests
3. `/api` routes are in `vercel.json`

### Data not persisting in cloud

**Check:**
1. Token is being saved in localStorage
2. Auth succeeds (no error messages)
3. Network tab shows successful POST to `/api/sync`
4. Check Vercel function logs

### "Offline mode" works but cloud doesn't

1. Verify `/api` folder exists
2. Ensure `vercel.json` routes are correct
3. Check that `/api/*.js` files are in repo
4. Redeploy: `vercel --prod --force`

## Production Considerations

### Before going live, add:

- [ ] Real database (not in-memory)
- [ ] JWT implementation
- [ ] bcrypt password hashing
- [ ] Rate limiting
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel Analytics)
- [ ] Email verification
- [ ] Password reset flow
- [ ] Data backup

### Database Options

| Option | Pros | Cons |
|--------|------|------|
| **MongoDB Atlas** | Easy, free tier | NoSQL learning curve |
| **PostgreSQL** | Reliable, powerful | More setup |
| **Supabase** | Firebase alternative | Limited free tier |
| **Firebase** | Real-time sync | Vendor lock-in |

### Example: Adding MongoDB

```bash
npm install mongoose
```

Then update `/api/auth.js` and `/api/sync.js` to use MongoDB instead of in-memory store.

## Monitoring & Logs

### View Vercel Logs

```bash
# Real-time logs
vercel logs --follow

# Production logs
vercel logs --prod
```

### Monitor Function Usage

In Vercel Dashboard:
- Settings → Usage
- See API calls, bandwidth, execution time

## Next Steps

1. ✅ Test locally with offline mode
2. ✅ Deploy to Vercel
3. ⬜ Add database
4. ⬜ Implement proper authentication
5. ⬜ Set up monitoring
6. ⬜ Launch!

---

For questions, check [Vercel Docs](https://vercel.com/docs) or [serverless.com](https://serverless.com)
