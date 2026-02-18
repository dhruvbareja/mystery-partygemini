# 🔧 Gemini API Troubleshooting Guide

## 🎯 Quick Test - Use This First!

**NEW: Built-in Test Page**

1. Start your dev server: `npm run dev`
2. Visit: http://localhost:3000/test-gemini
3. Click "Test Gemini API"
4. See which models work for you!

This will automatically:
- ✅ Check if your API key is valid
- ✅ List all available models
- ✅ Test each model to find what works
- ✅ Give you clear recommendations

---

## Common Issues & Solutions

### 1. "API key not valid" Error

**Error message:**
```

```

**Solutions:**
1. Check your API key is correct in `.env.local`:
   ```env
   GEMINI_API_KEY=AIzaSyD...
   ```
2. Make sure the key starts with `AIza`
3. No spaces before or after the key
4. Restart your dev server after adding the key:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```
5. Try creating a new API key at https://aistudio.google.com/app/apikey

---

### 2. "Model not found" Error

**Error message:**
```
models/gemini-2.0-flash-exp is not found
```

**Solution:**
This is already fixed in the latest version! The code now uses `gemini-1.5-flash` which is the stable model.

Make sure your `lib/ai-generator.ts` has:
```typescript
model: "gemini-1.5-flash"
```

NOT:
```typescript
model: "gemini-2.0-flash-exp"  // Wrong!
```

---

### 3. "Rate limit exceeded" Error

**Error message:**
```

```

**What it means:**
You've hit the rate limit (15 requests per minute or 1,500 per day)

**Solutions:**
1. **Wait 1 minute** - The limit resets every minute
2. For testing, reduce generation attempts
3. If you need more, enable billing in Google Cloud (still very cheap)

**Free tier limits:**
- 15 requests per minute
- 1,500 requests per day

---

### 4. "Failed to fetch" Error

**Error message:**
```
Error fetching from generativelanguage.googleapis.com
```

**Solutions:**
1. **Check internet connection**
2. **Try again** - Temporary network issue
3. **Firewall/VPN** - Make sure your network allows Google API access
4. **Try a different network** - Test on mobile hotspot

---

### 5. JSON Parsing Error

**Error message:**
```
Failed to parse JSON response
```

**What happened:**
Sometimes the AI returns text that's not pure JSON.

**Solutions:**
1. **Try again** - Usually works on retry
2. The code has error handling for this
3. Check terminal for the actual response
4. If persistent, the AI might need a clearer prompt

---

### 6. Empty Response

**Error message:**
```
No content generated
```

**Solutions:**
1. **Try again** - Temporary AI issue
2. Check your prompt isn't too complex
3. Reduce number of players (try 4-5)
4. Simplify the theme
5. Remove custom notes temporarily

---

### 7. Environment Variable Not Found

**Error message:**
```
Cannot read properties of undefined (reading 'getGenerativeModel')
```

**This means:**
The `GEMINI_API_KEY` is not being loaded.

**Solutions:**
1. Make sure file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
2. File must be in project root (same folder as `package.json`)
3. Restart dev server after creating `.env.local`
4. Check file contents:
   ```bash
   cat .env.local
   ```
   Should show:
   ```
   GEMINI_API_KEY=AIza...
   ```

---

### 8. CORS Error in Browser

**Error message:**
```
CORS policy: No 'Access-Control-Allow-Origin' header
```

**This means:**
You're trying to call Gemini from the browser (client-side).

**Solution:**
This shouldn't happen! The Gemini API is called from Next.js API routes (server-side).

If you see this:
1. Make sure you're using the API endpoint in `/app/api/game/create/route.ts`
2. Don't call Gemini directly from React components
3. The code is already set up correctly

---

### 9. Slow Generation (30+ seconds)

**What's happening:**
First generation might be slower as AI initializes.

**Normal timing:**
- First generation: 10-20 seconds
- Subsequent generations: 5-15 seconds

**If it's taking 30+ seconds:**
1. Check your internet speed
2. Try again (might be temporary AI load)
3. Simplify your prompt (fewer players, simpler theme)
4. Check Gemini status: https://status.cloud.google.com/

---

### 10. API Key Not Working After Creation

**Issue:**
Just created key but getting "not valid" errors.

**Solutions:**
1. **Wait 1 minute** - New keys take ~30-60 seconds to activate
2. **Try a different browser** to create the key
3. **Create a new key** in Google AI Studio
4. **Check Google Cloud Console** - Make sure the project is active

---

## Verification Steps

### Test Your Setup

1. **Check environment variable:**
   ```bash
   # In project root
   cat .env.local
   ```
   Should show your key (starts with `AIza`)

2. **Test API key manually:**
   Visit Google AI Studio and try the test playground:
   https://aistudio.google.com/

3. **Check Next.js is reading env vars:**
   Add to your API route temporarily:
   ```typescript
   console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
   console.log('First 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10));
   ```

4. **Verify model name:**
   Open `lib/ai-generator.ts` and confirm:
   ```typescript
   model: "gemini-1.5-flash"  // Should be this
   ```

---

## Debug Mode

### Enable Detailed Logging

Edit `lib/ai-generator.ts` and add logging:

```typescript
export async function generateMysteryGame(input: AIGenerationInput) {
  console.log('🎮 Starting generation...');
  console.log('📝 Input:', JSON.stringify(input, null, 2));
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      // ...
    });
    
    console.log('✅ Model initialized');
    
    const result = await model.generateContent(prompt);
    console.log('✅ Content generated');
    
    const text = response.text();
    console.log('📄 Response length:', text.length);
    console.log('📄 First 100 chars:', text.substring(0, 100));
    
    // ... rest of code
  } catch (error) {
    console.error('❌ Full error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}
```

Then check your terminal for detailed logs.

---

## Getting Help

### Before Asking for Help

Provide this information:
1. **Error message** (full text from terminal)
2. **Your setup:**
   - Operating system (Mac/Windows/Linux)
   - Node.js version: `node --version`
   - npm version: `npm --version`
3. **What you tried:**
   - List the solutions you attempted
   - Any error messages that changed
4. **Environment:**
   - Are you using the correct `.env.local` file?
   - Did you restart the dev server?

### Check These First

- [ ] API key starts with `AIza`
- [ ] API key is in `.env.local` (not `.env`)
- [ ] Dev server was restarted after adding key
- [ ] Using `gemini-1.5-flash` model (not 2.0)
- [ ] Internet connection is working
- [ ] Tried creating a new API key
- [ ] Waited 1 minute after creating key

---

## Alternative: Test with Sample Data

If you keep having issues, you can temporarily use mock data to test the rest of the app:

Edit `app/api/game/create/route.ts`:

```typescript
// Temporarily comment out the real AI call
// const mysteryData = await generateMysteryGame({...});

// Use mock data instead
const mysteryData = {
  story: "A murder occurred at a mysterious mansion...",
  victim: "The Butler",
  killer: playerNames[0],
  characters: playerNames.map((name, i) => ({
    name,
    role: "Guest",
    secrets: ["Secret 1", "Secret 2"],
    motive: i === 0 ? "Revenge" : null,
    alibi: "Was in the library",
    personality: "Mysterious",
    isKiller: i === 0
  })),
  locations,
  clues: [
    { text: "A knife was found", location: locations[0] }
  ],
  timeline: ["8pm - Victim last seen", "9pm - Body discovered"],
  twists: ["The killer had an accomplice"],
  evidence: ["Fingerprints on weapon"],
  endingText: "The truth is revealed..."
};
```

This lets you test the game without the AI while you debug the Gemini issue.

---

## Still Having Issues?

1. **Google AI Studio Status**: https://status.cloud.google.com/
2. **Gemini Documentation**: https://ai.google.dev/docs
3. **Check the logs** in your terminal carefully
4. **Try the mock data** approach above to isolate the issue

Remember: 99% of issues are either:
- Wrong API key format
- Key not in `.env.local`
- Forgot to restart dev server
- Model name wrong

Good luck! 🍀
