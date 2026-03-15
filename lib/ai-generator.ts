// Define the types directly here to avoid import errors
export interface AIGenerationInput {
  gameName?: string;
  playerNames: string[];
  locations: string[];
  theme: string;
  customNotes?: string;
}

export interface AIGenerationOutput {
  story: string;
  victim: string;
  killer: string;
  characters: {
    name: string;
    role: string;
    personality: string;
    motive: string;
    alibi: string;
    secrets: string[];
  }[];
  locations: string[];
  clues: {
    text: string;
    location: string;
  }[];
  timeline: string[];
  twists: string[];
  evidence: string[];
  endingText: string;
}

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateMysteryGame(
  input: AIGenerationInput
): Promise<AIGenerationOutput> {

  // We are now using the powerful gemini-2.5-flash model your key supports
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json", // This strictly enforces JSON output
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          story: { type: SchemaType.STRING, description: "A gripping 2-paragraph setup of the murder." },
          victim: { type: SchemaType.STRING },
          killer: { type: SchemaType.STRING, description: "MUST be one of the provided players." },
          characters: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                role: { type: SchemaType.STRING },
                personality: { type: SchemaType.STRING },
                motive: { type: SchemaType.STRING },
                alibi: { type: SchemaType.STRING },
                secrets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
              },
              // Forcing Gemini to generate these exact fields prevents DB errors
              required: ["name", "role", "personality", "motive", "alibi", "secrets"]
            }
          },
          locations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          clues: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                text: { type: SchemaType.STRING },
                location: { type: SchemaType.STRING }
              },
              required: ["text", "location"]
            }
          },
          timeline: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          twists: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          evidence: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          endingText: { type: SchemaType.STRING }
        },
        required: ["story", "victim", "killer", "characters", "locations", "clues", "timeline", "twists", "evidence", "endingText"]
      }
    }
  });

  const prompt = `
  You are a master mystery writer. Create a logical, engaging murder mystery game.
  
  Players: ${input.playerNames.join(", ")}
  Locations: ${input.locations.join(", ")}
  Theme: ${input.theme}
  Notes: ${input.customNotes ?? "None"}

  RULES:
  1. The "killer" MUST be exactly one of the players listed above.
  2. Every character needs a distinct motive, alibi, personality, and at least 2 dark secrets.
  3. Clues must logically point towards the killer's timeline, with a few red herrings pointing to innocent characters.
  4. Ensure clues are placed ONLY in the provided locations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Because we used responseSchema, this will parse flawlessly without regex hacks
    const parsed = JSON.parse(text);

    return {
      story: parsed.story,
      victim: parsed.victim,
      killer: parsed.killer,
      characters: parsed.characters,
      locations: parsed.locations,
      clues: parsed.clues,
      timeline: parsed.timeline,
      twists: parsed.twists,
      evidence: parsed.evidence || [],
      endingText: parsed.endingText
    };
  } catch (error) {
    // If it fails, this will log the exact reason to your Next.js terminal
    console.error("GEMINI API ERROR:", error);
    throw new Error('AI failed to generate the mystery.');
  }
}