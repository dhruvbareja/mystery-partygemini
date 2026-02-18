# 🚀 Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Step 1: Prepare Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (choose a region close to your users)
3. Wait for the project to finish setting up (~2 minutes)

### Step 2: Set Up Database

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New Query"**
3. Open the `supabase-schema.sql` file from this project
4. Copy ALL the contents
5. Paste into the SQL Editor
6. Click **RUN** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### Step 3: Get Supabase Credentials

1. Go to **Settings** → **API** in the left sidebar
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 4: Get Google Gemini API Key (FREE!)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Get API key"** or **"Create API key"**
3. Select **"Create API key in new project"**
4. Copy the key (starts with `AIza...`)
5. **That's it!** No credit card needed - free tier is very generous
   - 15 requests per minute
   - 1 million tokens per minute
   - 1,500 requests per day
   - Perfect for a murder mystery game!

### Step 5: Deploy to Vercel

1. Push this code to GitHub (or GitLab/Bitbucket)
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **"New Project"**
4. Import your GitHub repository
5. In **Environment Variables**, add these three:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
GEMINI_API_KEY=AIza...
```

6. Click **Deploy**
7. Wait 2-3 minutes
8. Done! Your game is live 🎉

### Step 6: Test Your Deployment

1. Visit your Vercel URL (like `mystery-party.vercel.app`)
2. Click **"Create New Game"**
3. Fill in game details
4. Click **"Generate Game"**
5. If successful, you'll be redirected to the host dashboard
6. Share the game code with friends!

---

## Alternative: Deploy to Netlify

### Step 1-4: Same as Vercel

Follow Steps 1-4 above to set up Supabase and get your API keys.

### Step 5: Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click **"Add new site"** → **"Import an existing project"**
4. Connect to GitHub and select your repository
5. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. Add environment variables (same 3 as Vercel)
7. Click **Deploy**
8. Wait 2-3 minutes
9. Your site is live!

---

## Self-Hosting (VPS/Server)

### Requirements
- Ubuntu 20.04+ or similar
- Node.js 18+
- Nginx (recommended)
- Domain name with SSL

### Steps

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/mystery-party.git
cd mystery-party
npm install
```

2. **Set Environment Variables**
```bash
nano .env.local
# Add your three environment variables
# Save and exit
```

3. **Build**
```bash
npm run build
```

4. **Run with PM2**
```bash
npm install -g pm2
pm2 start npm --name "mystery-party" -- start
pm2 save
pm2 startup
```

5. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. **Get SSL Certificate**
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  mystery-party:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
```

### Deploy
```bash
docker-compose up -d
```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGc...` |
| `GEMINI_API_KEY` | Google Gemini API key (FREE!) | `AIza...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | `http://localhost:3000` |

---

## Post-Deployment Checklist

- [ ] Test game creation
- [ ] Test player joining
- [ ] Test real-time messaging
- [ ] Test clue reveals
- [ ] Test voting system
- [ ] Verify mobile responsiveness
- [ ] Check Supabase realtime connection
- [ ] Monitor OpenAI API usage
- [ ] Set up error tracking (optional: Sentry)
- [ ] Configure custom domain (optional)

---

## Costs Estimate

### Free Tier (Perfect for most users!)
- **Supabase**: Free (500MB database, 2GB bandwidth/month)
- **Vercel/Netlify**: Free (100GB bandwidth/month)
- **Google Gemini**: **FREE!** (1,500 requests/day - enough for 100+ games)
- **Total**: $0/month! 🎉

### Production (1000 games/month)
- **Supabase**: Free tier still works
- **Vercel/Netlify**: Free tier sufficient
- **Google Gemini**: Still FREE (well within limits)
- **Total**: $0/month! 🎉

---

## Troubleshooting Common Deploy Issues

### Build Fails
```
Error: Cannot find module 'xyz'
```
**Solution**: Run `npm install` and commit `package-lock.json`

### Environment Variables Not Working
```
Error: Missing environment variable
```
**Solution**: 
- Check spelling (they're case-sensitive!)
- Redeploy after adding new variables
- Don't use quotes around values in Vercel/Netlify

### Supabase Connection Issues
```
Error: Failed to fetch
```
**Solution**:
- Verify your Supabase URL is correct
- Check if you're using the **anon/public** key (not service role key)
- Ensure Supabase project is active

### Gemini API Errors
```
Error: API key not valid
```
**Solution**: 
- Get a new key from Google AI Studio
- Make sure you copied the full key (starts with `AIza`)
- Check the key is active in your Google Cloud Console

```
Error: Resource exhausted
```
**Solution**: You've hit the free rate limit. Wait a few minutes or upgrade to paid tier (still very cheap).

### Real-time Not Working
**Solution**:
- Go to Supabase Dashboard → Database → Replication
- Ensure all tables are enabled for Realtime
- Run the schema SQL again to enable publications

---

## Monitoring

### Supabase Dashboard
- Check **Database** → **Tables** to see data
- Monitor **API** → **Logs** for errors
- View **Auth** → **Users** if you add auth later

### Vercel Dashboard
- Check **Functions** tab for API route logs
- Monitor **Analytics** for traffic
- View **Deployments** for build logs

### Google AI Studio Usage
- Go to [Google AI Studio](https://aistudio.google.com/)
- Check your API usage and quotas
- Monitor requests per day
- Very generous free tier!

---

## Need Help?

- Check the main README.md for troubleshooting
- Review Supabase docs: https://supabase.com/docs
- Review Vercel docs: https://vercel.com/docs
- Open a GitHub issue

---

**Happy deploying! 🚀**
