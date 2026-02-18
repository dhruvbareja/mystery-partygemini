# 🤖 Getting Your FREE Google Gemini API Key

Google Gemini 2.0 Flash is **completely FREE** with generous limits - perfect for this game!

## Why Gemini Over OpenAI?

✅ **FREE** - No credit card required
✅ **Generous limits** - 1,500 requests/day (100+ games)
✅ **Fast** - Gemini 2.0 Flash is optimized for speed
✅ **High quality** - Creates amazing murder mysteries
✅ **No surprise bills** - Won't charge you unexpectedly

## Step-by-Step Guide

### 1. Go to Google AI Studio
Visit: https://aistudio.google.com/app/apikey

### 2. Sign In
- Use your Google account
- No payment info needed!

### 3. Create API Key
- Click **"Get API key"** or **"Create API key"**
- Select **"Create API key in new project"**
- Or select an existing Google Cloud project if you have one

### 4. Copy Your Key
- Your key will look like: `AIzaSyD...` (about 39 characters)
- Copy the entire key
- Keep it secret! Don't share it publicly

### 5. Add to Your App
Create `.env.local` file:
```env
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Rate Limits (Free Tier)

**Gemini 1.5 Flash:**
- ✅ 15 requests per minute
- ✅ 1 million tokens per minute
- ✅ 1,500 requests per day

**This means you can:**
- Generate 1,500 murder mystery games per day
- Plenty for testing and production use
- No credit card required!

## Testing Your Key

After adding the key to `.env.local`:

```bash
npm run dev
```

Then:
1. Go to http://localhost:3000
2. Click "Create New Game"
3. Fill in the form
4. Click "Generate Game"

If it works in 10-20 seconds, you're all set! 🎉

## Troubleshooting

### "API key not valid"
- Make sure you copied the full key
- Check for extra spaces before/after the key
- Try creating a new key

### "API key not found"
- Make sure `.env.local` exists in the root directory
- Check the file name is exactly `.env.local` (not `.env.local.txt`)
- Restart the dev server after adding the key

### "Resource exhausted"
You hit the rate limit. Solutions:
- Wait a few minutes (resets every minute)
- You get 1,500 requests per day
- For production, consider upgrading (still very cheap)

### "Failed to generate"
- Check your internet connection
- Try again (sometimes AI needs a retry)
- Check the terminal for detailed error messages

## Upgrading to Paid (Optional)

If you need more than 1,500 games/day:

1. Enable billing in Google Cloud Console
2. Very affordable: ~$0.0001 per request
3. Still way cheaper than OpenAI
4. Pay only for what you use

## Security Best Practices

### ✅ DO:
- Keep your API key in `.env.local`
- Add `.env.local` to `.gitignore` (already done)
- Use environment variables in Vercel/Netlify

### ❌ DON'T:
- Commit API keys to GitHub
- Share keys publicly
- Use the same key for multiple projects
- Hardcode keys in your code

## API Key Management

### Rotating Keys
If you think your key is compromised:
1. Go to Google AI Studio
2. Delete the old key
3. Create a new key
4. Update `.env.local` and redeploy

### Multiple Environments
For dev vs. production:

**Development** (`.env.local`):
```env
GEMINI_API_KEY=AIza_dev_key_here
```

**Production** (Vercel/Netlify):
Add as environment variable in dashboard

## Monitoring Usage

Check your usage:
1. Go to https://aistudio.google.com/
2. View your API calls
3. See tokens used
4. Monitor rate limits

You can see:
- Requests per day
- Tokens used
- Error rates
- Response times

## Comparing: Gemini vs OpenAI

| Feature | Gemini 1.5 Flash | OpenAI GPT-4 |
|---------|------------------|--------------|
| **Cost** | FREE (1,500/day) | ~$0.20/game |
| **Speed** | Very fast (~5-10s) | Fast (~10-15s) |
| **Quality** | Excellent | Excellent |
| **Setup** | No credit card | Requires payment |
| **Best for** | This project! | Enterprise |

## FAQ

**Q: Do I need a credit card?**
A: No! Completely free, no payment info needed.

**Q: Will I be charged?**
A: Not unless you explicitly enable billing in Google Cloud.

**Q: Is 1,500 requests enough?**
A: Yes! That's 1,500 murder mystery games per day. Way more than you'll need.

**Q: Can I use this in production?**
A: Absolutely! The free tier is perfect for production use.

**Q: How do I upgrade if needed?**
A: Enable billing in Google Cloud Console. Very affordable rates.

**Q: Is my key secure?**
A: Yes, as long as you keep it in `.env.local` and don't commit it to Git.

**Q: Can I have multiple keys?**
A: Yes! Create different keys for dev/staging/production.

**Q: What if I hit the rate limit?**
A: Wait a minute (15 requests/min limit) or upgrade to paid tier.

## Quick Reference

**Get your key:** https://aistudio.google.com/app/apikey

**Check usage:** https://aistudio.google.com/

**Documentation:** https://ai.google.dev/docs

**Rate limits:** 1,500 requests/day (free)

**Cost:** $0 (FREE tier is very generous)

---

**You're all set! Now go create some murder mysteries! 🕵️‍♀️**
