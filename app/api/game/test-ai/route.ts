import { NextResponse } from 'next/server'
import { generateMysteryGame } from '@/lib/ai-generator'

export async function GET() {
  try {
    const result = await generateMysteryGame({
      playerNames: ["Arjun", "Kabir", "Sara"],
      locations: ["Study", "Garden", "Kitchen"],
      theme: "Bollywood Mansion Murder",
      customNotes: "High drama, betrayal"
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error("AI TEST ERROR:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}