import { NextResponse } from 'next/server';
import { generateMysteryGame } from '@/lib/ai-generator';

export const dynamic = 'force-dynamic'; // Prevents Next.js from caching the result

export async function GET() {
  try {
    console.log("Starting Gemini generation test...");
    
    // Call the generator with dummy data
    const result = await generateMysteryGame({
      gameName: "Mansion of Shadows",
      playerNames: ["Alice", "Bob", "Charlie", "David"],
      locations: ["Library", "Kitchen", "Conservatory", "Garden"],
      theme: "1920s classic murder mystery",
      customNotes: "Make the twists extra dramatic."
    });

    console.log("Gemini generation successful!");
    
    // Return the perfectly formatted JSON
    return NextResponse.json({ success: true, data: result });
    
  } catch (error: any) {
    console.error("Test API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error occurred" }, 
      { status: 500 }
    );
  }
}