"use server";

import { generateMysteryGame } from '@/lib/ai-generator';

export async function runGeminiTest() {
  try {
    console.log("Starting Server Action Gemini Test...");
    
    // DIAGNOSTIC CHECK: Verify the API key is actually loaded into the server
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ CRITICAL ERROR: GEMINI_API_KEY is missing!");
      return { 
        success: false, 
        error: "GEMINI_API_KEY is missing! Make sure it is in your .env.local file and you restarted the server." 
      };
    }
    console.log("✅ API Key detected, attempting to contact Gemini...");

    // Call the generator directly
    const result = await generateMysteryGame({
      gameName: "Mansion of Shadows",
      playerNames: ["Alice", "Bob", "Charlie", "David"],
      locations: ["Library", "Kitchen", "Conservatory", "Garden"],
      theme: "1920s classic murder mystery",
      customNotes: "Make the twists extra dramatic."
    });

    console.log("✅ Gemini generation successful!");
    
    // Return data directly as a JavaScript object (No JSON stringifying needed!)
    return { success: true, data: result };
    
  } catch (error: any) {
    console.error("❌ Test Action Error:", error);
    return { success: false, error: error?.message || "Unknown error occurred inside ai-generator.ts" };
  }
}