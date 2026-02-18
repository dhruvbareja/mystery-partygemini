# 🕵️ Mystery Party - AI Murder Mystery Game

A real-time multiplayer murder mystery party game powered by AI. Create custom mysteries for your friend group with zero preparation needed.

## 🎮 Features

- **AI-Generated Stories**: Unique murder mysteries created for your specific group
- **Real-Time Multiplayer**: Play together from any device via web browser
- **Host Dashboard**: Powerful game master controls to manage the mystery
- **Private Messaging**: Send DMs to interrogate suspects privately
- **Dynamic Clues**: Host reveals clues progressively throughout the game
- **Voting System**: Players vote on who they think the killer is
- **Mobile-First Design**: Looks great on phones, tablets, and desktops
- **No Installation**: Just share a game code and start playing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Google AI Studio API key (FREE with generous limits!)

### 1. Clone & Install

```bash
cd mystery-party
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to Settings → API
3. Copy your:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/Public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

4. Go to SQL Editor in Supabase
5. Copy the entire contents of `supabase-schema.sql`
6. Paste and run it to create all tables

### 3. Configure Environment

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini (FREE!)
GEMINI_API_KEY=your-gemini-api-key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Play

### For the Host (Game Master)

1. Click **"Create New Game"**
2. Enter:
   - Game name
   - Player names (3-10 players)
   - Locations for the mystery
   - Theme/vibe (e.g., "1920s mansion murder")
   - Optional drama notes
3. Click **"Generate Game"** (takes 10-20 seconds)
4. Share the game code with your friends
5. Once all players join, click **"Start Game"**
6. Use the Host Dashboard to:
   - Reveal clues at strategic moments
   - Monitor player conversations
   - Track suspicion levels
   - Advance through game phases
   - Trigger plot twists

### For Players

1. Enter the game code on the home page
2. Enter your name to join
3. Mark yourself as ready
4. Once the game starts:
   - Read your secret role
   - Chat with other players (group chat)
   - Send private DMs to interrogate suspects
   - Search locations for clues
   - Make accusations
   - Vote for who you think the killer is
5. The killer's goal: Stay hidden
6. Everyone else's goal: Find the killer

## 🎯 Game Phases

The game automatically progresses through these phases:

1. **Lobby** - Players join and ready up
2. **Role Reveal** - Each player receives their secret role
3. **Intro Round** - Players introduce themselves
4. **Investigation** - Free discussion and DM phase
5. **Clue Drop** - Host reveals evidence
6. **Accusations** - Players state their cases
7. **Voting** - Everyone votes for the killer
8. **Reveal** - The truth is revealed!

## 🏗️ Project Structure

```
mystery-party/
├── app/
│   ├── api/
│   │   └── game/
│   │       ├── create/route.ts    # AI generation & game creation
│   │       └── join/route.ts      # Player join logic
│   ├── create/page.tsx            # Game creation form
│   ├── game/[game_Id]/page.tsx     # Join & lobby page
│   ├── host/[game_Id]/page.tsx     # Host dashboard
│   ├── player/[game_Id]/page.tsx   # Player gameplay view
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page
├── components/                     # Reusable components
├── lib/
│   ├── supabase.ts                # Supabase client
│   ├── ai-generator.ts            # OpenAI mystery generation
│   ├── avatars.ts                 # Avatar utilities
│   └── game-utils.ts              # Game helper functions
├── types/
│   └── index.ts                   # TypeScript types
├── public/                        # Static assets
├── supabase-schema.sql            # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🗄️ Database Schema

The app uses these Supabase tables:

- **games** - Game state and settings
- **players** - Player info and status
- **roles** - Character details for each player
- **clues** - Mystery clues and evidence
- **messages** - Chat messages (group and DMs)
- **votes** - Player accusations and votes
- **game_logs** - Activity tracking for host

All tables have real-time subscriptions enabled for live updates.

## 🎨 Customization

### Themes

Edit `tailwind.config.js` to customize colors:

```js
colors: {
  blood: '#8B0000',    // Danger/killer color
  ink: '#0f0a1e',      // Dark background
  parchment: '#f4f1e8', // Light text
  gold: '#d4af37',     // Accent color
}
```

### AI Prompts

Edit `lib/ai-generator.ts` to customize story generation style:

```typescript
const prompt = `You are a creative murder mystery writer...`
```

### Game Phases

Modify phase durations in `lib/game-utils.ts`:

```typescript
export const PHASE_DURATIONS: Record<GamePhase, number> = {
  intro_round: 120,      // 2 minutes
  investigation: 300,    // 5 minutes
  // ...
}
```

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Netlify

1. Push code to GitHub
2. Import project on [netlify.com](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables
6. Deploy!

## 🔧 Troubleshooting

**AI generation fails:**
- Check your OpenAI API key is correct
- Ensure you have API credits
- Try reducing the number of players/locations

**Real-time updates not working:**
- Verify Supabase Realtime is enabled for all tables
- Check that Row Level Security policies allow reads

**Players can't join:**
- Make sure the game is still in 'lobby' phase
- Verify the game code is correct (case-insensitive)

**Host dashboard not accessible:**
- Host ID is stored in localStorage
- Clear browser storage if having issues

## 🎯 Best Practices

- **Player Count**: 4-8 players works best
- **Theme**: Be specific! "College party gone wrong" > "mystery"
- **Locations**: 3-6 locations is ideal
- **Custom Notes**: Add relationship drama for better stories
- **Pacing**: Don't rush phases - let players investigate
- **Clue Reveals**: Space them out for maximum drama

## 📱 Mobile Support

The entire game is mobile-optimized:
- Responsive design for all screen sizes
- Touch-friendly controls
- Optimized chat interface
- No installation required

## 🛡️ Security Notes

**For Production:**

1. Update Supabase RLS policies for proper access control
2. Add rate limiting to API routes
3. Validate all user inputs server-side
4. Use environment variables for all secrets
5. Enable CORS restrictions
6. Add authentication if needed

## 🤝 Contributing

Want to improve Mystery Party?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own projects!

## 🎭 Credits

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Real-time database
- [Google Gemini 1.5 Flash](https://ai.google.dev/) - AI story generation (FREE tier!)
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations

## 🐛 Known Issues

- Large player counts (10+) may cause slower AI generation
- Some mobile browsers may have issues with real-time updates
- Game state is not persisted if Supabase connection drops

## 🔮 Future Enhancements

- [ ] Voice chat integration
- [ ] Custom character creator
- [ ] Multiple game modes (comedy, horror, sci-fi)
- [ ] Replay system with analytics
- [ ] Tournament mode
- [ ] Mobile app versions
- [ ] Spectator mode
- [ ] AI-generated character images
- [ ] Sound effects and music
- [ ] Timer warnings and notifications

## 💬 Support

Having issues? Want to share feedback?

- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

---

**Enjoy your mystery party! 🕵️‍♀️🔪**
