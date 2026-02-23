import { AIGenerationInput, AIGenerationOutput } from '@/types';

export async function generateMysteryGame(
  input: AIGenerationInput
): Promise<AIGenerationOutput> {

  const prompt = `
You are a JSON API generator.

IMPORTANT RULES:
- Output ONLY valid raw JSON.
- Do NOT use markdown.
- Do NOT wrap in \`\`\`json.
- Do NOT explain anything.
- No trailing commas.
- Ensure all arrays are valid JSON arrays.

Return STRICTLY this JSON format:

{
  "story": "string",
  "victim": "string",
  "killer": "string",
  "characters": [
    {
      "name": "string",
      "role": "string",
      "secrets": ["string"],
      "motive": "string",
      "true_location": "string",
      "public_alibi": "string",
      "personality": "string"
    }
  ],
  "locations": ["string"],
  "clues": [
    {
      "text": "string",
      "location": "string"
    }
  ],
  "timeline": ["string"],
  "twists": ["string"],
  "evidence": ["string"],
  "endingText": "string"
}

Players: ${input.playerNames.join(", ")}
Locations: ${input.locations.join(", ")}
Theme: ${input.theme}
Notes: ${input.customNotes ?? ""}
`;

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 120000); // 2 minutes

  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'phi3:mini',
      prompt,
      temperature: 0.4,
      top_p: 0.9,
      stream: false
    }),
    signal: controller.signal
  });

  if (!response.ok) {
    throw new Error('Ollama request failed');
  }

  const data = await response.json();
  console.log("OLLAMA RAW:", data?.response);

  let raw = data?.response ?? '';

  if (!raw) {
    console.error('Empty AI response');
    return {
      story: 'A mysterious murder has occurred.',
      victim: 'Unknown Victim',
      killer: input.playerNames[0] || '',
      characters: [],
      locations: input.locations,
      clues: [],
      timeline: [],
      twists: [],
      evidence: [],
      endingText: 'The mystery is solved.'
    };
  }

  // Aggressive cleanup
  raw = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/\n/g, ' ')
    .trim();

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1) {
    console.error('Model did not return valid JSON block:', raw);
    return {
      story: 'A mysterious murder has occurred.',
      victim: 'Unknown Victim',
      killer: input.playerNames[0] || '',
      characters: [],
      locations: input.locations,
      clues: [],
      timeline: [],
      twists: [],
      evidence: [],
      endingText: 'The mystery is solved.'
    };
  }

  const jsonString = raw.slice(start, end + 1);

  let parsed: any = {};

  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error('Invalid JSON from model:', jsonString);
    return {
      story: 'A mysterious murder has occurred.',
      victim: 'Unknown Victim',
      killer: input.playerNames[0] || '',
      characters: [],
      locations: input.locations,
      clues: [],
      timeline: [],
      twists: [],
      evidence: [],
      endingText: 'The mystery is solved.'
    };
  }

  return {
    story: parsed.story || 'A mysterious murder has occurred.',
    victim: parsed.victim || 'Unknown Victim',
    killer: parsed.killer || input.playerNames[0] || '',
    characters: Array.isArray(parsed.characters) ? parsed.characters : [],
    locations: Array.isArray(parsed.locations) && parsed.locations.length
      ? parsed.locations
      : input.locations,
    clues: Array.isArray(parsed.clues) ? parsed.clues : [],
    timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
    twists: Array.isArray(parsed.twists) ? parsed.twists : [],
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
    endingText: parsed.endingText || 'The mystery is solved.'
  };
}