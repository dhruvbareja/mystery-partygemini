import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    let lastError = "";

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Write a two-word mystery.");
        return NextResponse.json({ status: `SUCCESS! API key works. It accepted the model: ${modelName}`, response: result.response.text() });
      } catch (err: any) {
        lastError = err.message;
      }
    }
    return NextResponse.json({ error: "Google API rejected ALL models.", details: lastError }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: "Fatal Code Crash!", details: error.message }, { status: 500 });
  }
}
