import { NextResponse } from 'next/server';

// Force Next.js to NEVER cache this page
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key in .env.local" }, { status: 400 });
    }

    // Bypass the Next.js SDK cache completely and do a raw network request to Google
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    // If Google rejects the request entirely
    if (!response.ok) {
      return NextResponse.json({ 
        status: "FAILED",
        reason: "Google rejected your API key completely.",
        google_raw_error: data
      }, { status: response.status });
    }

    // Extract just the model names
    const availableModels = data.models?.map((m: any) => m.name) || [];

    return NextResponse.json({ 
      status: "FRESH ROUTE SUCCESS! Connected to Google.",
      message: "Here are the models your API key has access to:",
      total_models_found: availableModels.length,
      allowed_models: availableModels
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Network Crash!", details: error.message }, { status: 500 });
  }
}