# 📜 Available Scripts

## Development

### `npm run dev`
Starts the development server on http://localhost:3000

**Features:**
- Hot reload (changes appear instantly)
- Fast refresh (preserves component state)
- Detailed error messages
- Source maps for debugging

**Use this for:**
- Local development
- Testing changes
- Debugging

---

## Production

### `npm run build`
Creates an optimized production build

**What it does:**
- Compiles TypeScript to JavaScript
- Bundles all code
- Minifies CSS and JS
- Optimizes images
- Generates static pages where possible

**Output:**
- Creates `.next/` directory with production files
- Shows build size analysis
- Warns about large bundles

### `npm run start`
Runs the production build locally

**Requirements:**
- Must run `npm run build` first
- Uses port 3000 by default

**Use this for:**
- Testing production build locally
- Performance testing
- Pre-deployment verification

---

## Code Quality

### `npm run lint`
Runs ESLint to check code quality

**Checks for:**
- React best practices
- Next.js optimizations
- Common bugs
- Code style issues

**To auto-fix issues:**
```bash
npm run lint -- --fix
```

---

## Custom Scripts You Can Add

### Type Checking
Add to `package.json`:
```json
"scripts": {
  "type-check": "tsc --noEmit"
}
```

Run: `npm run type-check`

### Format Code
Install Prettier:
```bash
npm install -D prettier
```

Add to `package.json`:
```json
"scripts": {
  "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
}
```

Run: `npm run format`

### Database Migrations
For Supabase schema updates:
```json
"scripts": {
  "db:reset": "supabase db reset",
  "db:push": "supabase db push"
}
```

### Testing
Install Jest and React Testing Library:
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

Add to `package.json`:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

---

## Environment-Specific Commands

### Development with Specific Port
```bash
PORT=3001 npm run dev
```

### Build with Verbose Output
```bash
npm run build -- --debug
```

### Production Mode Debugging
```bash
NODE_ENV=production npm run start
```

---

## Deployment Scripts

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Build for Docker
```bash
docker build -t mystery-party .
docker run -p 3000:3000 mystery-party
```

---

## Troubleshooting Scripts

### Clear Cache and Reinstall
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Check for Outdated Packages
```bash
npm outdated
```

### Update All Packages (Careful!)
```bash
npm update
```

### Audit Security Issues
```bash
npm audit
npm audit fix
```

---

## Performance Analysis

### Bundle Analysis
Install analyzer:
```bash
npm install -D @next/bundle-analyzer
```

Add to `next.config.js`:
```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

Run analysis:
```bash
ANALYZE=true npm run build
```

---

## Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm install` | Install dependencies | First time setup, after pulling code |
| `npm run dev` | Start dev server | While developing |
| `npm run build` | Create production build | Before deploying |
| `npm run start` | Run production build | Testing production locally |
| `npm run lint` | Check code quality | Before committing code |

---

## Pro Tips

### Speed Up Development
```bash
# Skip type checking in dev (faster startup)
npm run dev -- --turbo
```

### Check Build Size
After `npm run build`, look for output like:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    142 B          87.4 kB
├ ○ /create                              142 B          87.4 kB
└ ○ /game/[game_id]                       142 B          87.4 kB
```

Keep First Load JS under 100 kB for best performance.

### Monitor Memory Usage
```bash
node --inspect ./node_modules/.bin/next dev
```

Then open Chrome DevTools to profile memory.

---

**Need help? Check README.md for full documentation!**
