import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

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
    backstory: string; // ✨ Extracted into its own field
    personality: string;
    motive: string;
    alibi: string;
    objective: string; // ✨ Extracted into its own field
    secrets: string[];
  }[];
  locations: string[];
  clues: {
    text: string;
    location: string;
    significance: string;
  }[];
  timeline: string[];
  twists: string[];
  evidence: string[];
  endingText: string;
}

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateMysteryGame(
  input: AIGenerationInput
): Promise<AIGenerationOutput> {

  // Using the powerful gemini-2.5-flash model
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json", // This strictly enforces JSON output
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          story: { type: SchemaType.STRING, description: "A gripping, highly detailed 3-paragraph setup of the murder and the world." },
          victim: { type: SchemaType.STRING, description: "Full name and brief description of the person murdered." },
          killer: { type: SchemaType.STRING, description: "MUST be exactly one of the provided players." },
          characters: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                role: { type: SchemaType.STRING },
                backstory: { type: SchemaType.STRING, description: "Their rich history and connection to the victim (1-2 paragraphs)." },
                personality: { type: SchemaType.STRING, description: "How they act, speak, and carry themselves." },
                motive: { type: SchemaType.STRING, description: "A dark, specific reason they would want the victim dead." },
                alibi: { type: SchemaType.STRING, description: "Where they claim they were. Must be detailed but slightly flawed." },
                objective: { type: SchemaType.STRING, description: "A secret side-quest or alliance they are trying to achieve tonight." },
                secrets: { 
                  type: SchemaType.ARRAY, 
                  items: { type: SchemaType.STRING },
                  description: "2 to 3 very dark secrets they are hiding."
                }
              },
              required: ["name", "role", "backstory", "personality", "motive", "alibi", "objective", "secrets"]
            }
          },
          locations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          clues: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                text: { type: SchemaType.STRING, description: "The physical clue found." },
                location: { type: SchemaType.STRING },
                significance: { type: SchemaType.STRING, description: "A sentence explaining why it is significant to the case." }
              },
              required: ["text", "location", "significance"]
            }
          },
          timeline: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          twists: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          evidence: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          endingText: { type: SchemaType.STRING, description: "The dramatic script to read at the end." }
        },
        required: ["story", "victim", "killer", "characters", "locations", "clues", "timeline", "twists", "evidence", "endingText"]
      }
    }
  });

  const prompt = `
  You are an elite, award-winning murder mystery writer. Create a deeply interwoven, logical, and thrilling party game.
  
  Players: ${input.playerNames.join(", ")}
  Locations: ${input.locations.join(", ")}
  Theme: ${input.theme}
  Notes: ${input.customNotes ?? "None"}

  WRITING RULES & MECHANICS:
  1. The "killer" MUST be exactly one of the players listed above. Do not invent a new character.
  2. WEB OF LIES: Every innocent character must still have a strong motive to kill the victim, and a flawed alibi. 
  3. DEEP LORE: Fill out the backstory, personality, and objective fields thoroughly for each character to create alliances and side-quests.
  4. CLUE LOGIC: Clues must logically point towards the killer's timeline, but include 2 or 3 "red herring" clues that point to the dirty secrets of the innocent characters.
  5. LOCATION STRICTNESS: Only place clues in the exact locations provided.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Gemini's Structured Outputs guarantees this will parse safely
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
    console.error("GEMINI API ERROR:", error);
    throw new Error('AI failed to generate the mystery.');
  }
}