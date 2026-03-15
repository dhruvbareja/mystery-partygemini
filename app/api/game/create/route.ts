import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateMysteryGame } from '@/lib/ai-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameName, playerNames, locations, theme, customNotes } = body

    if (!gameName || !playerNames || !locations || !theme) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const hostId = crypto.randomUUID()

    /* -------------------------------- */
    /* 1. Generate AI Mystery           */
    /* -------------------------------- */
    console.log(`Generating mystery for game: ${gameName}...`);
    
    const aiData = await generateMysteryGame({
      gameName,
      playerNames,
      locations,
      theme,
      customNotes
    });

    console.log("AI Generation complete! Saving to database...");

    /* -------------------------------- */
    /* 2. Create Game Record            */
    /* -------------------------------- */

    const { error: gameError } = await supabase.from('games').insert({
      id: gameId,
      name: gameName,
      host_id: hostId,
      phase: 'lobby',
      story: aiData.story,
      victim: aiData.victim,
      killer: aiData.killer,
      locations,
      theme,
      revealed_clues: [],
      twists: aiData.twists,
      ending_text: aiData.endingText,
      current_round: 0,
      settings: { timerEnabled: false, roundDuration: 15 }
    })

    if (gameError) {
      console.error("Game Insert Error:", gameError)
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      )
    }

    /* -------------------------------- */
    /* 3. Create Player Roles           */
    /* -------------------------------- */

    const roleInserts = playerNames.map((name: string) => {
      // Match the requested player name to the AI generated character
      const character = aiData.characters.find(c => c.name.toLowerCase() === name.toLowerCase()) || {
        role: "Mystery Guest",
        personality: "Mysterious",
        motive: "Unknown",
        alibi: "Unverified",
        secrets: ["Hiding something."],
        backstory: "A stranger to most.",
        objective: "Survive the night."
      };

      return {
        id: crypto.randomUUID(),
        game_id: gameId,
        name,
        role: character.role,
        personality: character.personality,
        motive: character.motive,
        alibi: character.alibi,
        secrets: character.secrets,
        backstory: character.backstory, // ✨ Saving the new backstory field
        objective: character.objective, // ✨ Saving the new objective field
        is_killer: name.toLowerCase() === aiData.killer.toLowerCase(),
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`
      };
    })

    const { error: roleError } = await supabase.from('roles').insert(roleInserts)

    if (roleError) {
      console.error("Role Insert Error:", roleError)
      // Rollback game creation if roles fail
      await supabase.from('games').delete().eq('id', gameId)
      return NextResponse.json(
        { error: 'Failed to create roles. Game not created.' },
        { status: 500 }
      )
    }

    /* -------------------------------- */
    /* 4. Create Clues                  */
    /* -------------------------------- */
    
    if (aiData.clues && aiData.clues.length > 0) {
      const clueInserts = aiData.clues.map(c => ({
        id: crypto.randomUUID(),
        game_id: gameId,
        text: `${c.text} (Significance: ${c.significance})`,
        location: c.location,
        revealed: false
      }))

      const { error: cluesError } = await supabase.from('clues').insert(clueInserts)
      
      if (cluesError) {
        console.error("Clues Insert Error (Non-Fatal):", cluesError)
      }
    }

    /* -------------------------------- */
    /* Success Response                 */
    /* -------------------------------- */
    
    return NextResponse.json({ game_id: gameId, hostId })

  } catch (error: any) {
    console.error("API Route Error:", error)
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}