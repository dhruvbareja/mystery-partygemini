import { NextResponse } from 'next/server';

// Force Next.js to NEVER cache this page
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
    }

    // Bypass the SDK and ask Google directly for the list of allowed models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    // If Google rejects the request entirely (e.g., invalid key)
    if (!response.ok) {
      return NextResponse.json({ 
        status: "FAILED",
        reason: "Google rejected your API key completely.",
        google_raw_error: data
      }, { status: response.status });
    }

    // Extract just the model names to make it easy to read
    const availableModels = data.models?.map((m: any) => m.name) || [];

    return NextResponse.json({ 
      status: "SUCCESS! Connected to Google.",
      message: "Here are the models this specific API key has access to:",
      total_models_found: availableModels.length,
      allowed_models: availableModels,
      full_raw_data: data
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Network Crash!", details: error.message }, { status: 500 });
  }
}