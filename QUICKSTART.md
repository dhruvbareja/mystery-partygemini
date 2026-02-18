# ⚡ Quick Start Checklist

Get your murder mystery game running in 5 minutes!

## ✅ Step-by-Step Setup

### 1️⃣ Install Dependencies (1 minute)
```bash
cd mystery-party
npm install
```

### 2️⃣ Set Up Supabase Database (2 minutes)
1. Go to https://supabase.com
2. Create new project (free tier is fine)
3. Go to **SQL Editor**
4. Copy all contents from `supabase-schema.sql`
5. Paste and click **RUN**
6. Go to **Settings → API** and copy:
   - Project URL
   - anon public key

### 3️⃣ Get Google Gemini API Key (1 minute) - **FREE!**
1. Go to https://aistudio.google.com/app/apikey
2. Click **"Get API key"** or **"Create API key"**
3. Select **"Create API key in new project"**
4. Copy the key (starts with `AIza...`)
5. **No credit card required! Generous free tier!**

### 4️⃣ Configure Environment Variables (30 seconds)
Create `.env.local` file in project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
GEMINI_API_KEY=AIza...
```

### 5️⃣ Run the App (30 seconds)
```bash
npm run dev
```

Open http://localhost:3000

## 🎮 Test Your Setup

### Test 1: Create Game
1. Click "Create New Game"
2. Enter:
   - Name: "Test Mystery"
   - Players: Alice, Bob, Charlie, Dana
   - Locations: Library, Kitchen, Garden
   - Theme: "1920s mansion"
3. Click "Generate Game"
4. Should redirect to Host Dashboard in ~15 seconds

### Test 2: Join Game
1. Open http://localhost:3000 in a new incognito/private window
2. Click "Join Existing Game"
3. Enter the game code from Test 1
4. Enter name: "Alice"
5. Click "Join Game"
6. Should see lobby with other players

### Test 3: Start Game
1. In Host Dashboard, click "Start Game"
2. In Alice's window, should see role reveal
3. Try sending messages in chat
4. Messages should appear in real-time

## ✅ Success Indicators

- ✅ Home page loads with "Mystery Party" title
- ✅ Create page has form fields
- ✅ AI generates mystery in 10-20 seconds
- ✅ Host dashboard shows game controls
- ✅ Players can join with code
- ✅ Chat messages appear in real-time
- ✅ Host can reveal clues

## ❌ Common Issues

### "Missing environment variable"
➡️ Check `.env.local` file exists and has all 3 variables

### "Failed to create game"
➡️ Check Gemini API key is correct and active

### "Game not found"
➡️ Check Supabase schema is created (run SQL file)

### Real-time updates not working
➡️ Check Supabase Realtime is enabled (it should be by default)

### AI generation takes too long
➡️ Normal for first generation, should be faster after

## 📱 Mobile Testing

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On your phone, go to `http://YOUR_IP:3000`
3. Join a game and test mobile experience

## 🚀 Ready to Deploy?

See `DEPLOYMENT.md` for detailed deployment instructions to Vercel, Netlify, or your own server.

## 🎯 Quick Tips

- **Best player count**: 4-8 players
- **Game duration**: 30-45 minutes
- **Theme examples**: 
  - "Dark academia university scandal"
  - "Space station malfunction"
  - "Hollywood awards show disaster"
  - "Medieval castle intrigue"

## 💡 Pro Tips for Testing

1. Open 3-4 browser windows (use different browsers/incognito)
2. Join same game with different player names
3. Test group chat and DMs
4. Try revealing clues from host dashboard
5. Test accusation and voting phases

## 🆘 Still Having Issues?

1. Check all console logs for errors
2. Verify Supabase tables exist (go to Database → Tables)
3. Test Supabase connection directly in SQL editor
4. Check OpenAI usage dashboard for API calls
5. Review main README.md for detailed troubleshooting

---

**Your mystery party awaits! 🕵️‍♀️**
