import { AIGenerationInput, AIGenerationOutput } from '@/types';

export async function generateMysteryGame(
  input: AIGenerationInput
): Promise<AIGenerationOutput> {

  const prompt = `
You are an API that outputs ONLY valid JSON.
Return EXACT JSON only.

{
  "story": "",
  "victim": "",
  "killer": "",
  "characters": [],
  "locations": [],
  "clues": [],
  "timeline": [],
  "twists": [],
  "evidence": [],
  "endingText": ""
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
      model: 'qwen2.5:1.5b',
      prompt,
      stream: false
    }),
    signal: controller.signal
  });

  if (!response.ok) {
    throw new Error('Ollama request failed');
  }

  const data = await response.json();

  const match = data.response?.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Model did not return JSON');
  }

  return JSON.parse(match[0]);
}