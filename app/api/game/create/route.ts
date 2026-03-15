import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
    /* Create Game                      */
    /* -------------------------------- */

    const { error: gameError } = await supabase.from('games').insert({
      id: gameId,
      name: gameName,
      host_id: hostId,
      phase: 'lobby',
      story: `A mysterious murder has taken place in ${locations.join(', ')}.`,
      victim: 'Unknown Victim',
      killer: '',
      locations,
      theme,
      revealed_clues: [],
      twists: [],
      ending_text: '',
      current_round: 0,
      settings: { tension: 0 }
    })

    if (gameError) {
      console.error(gameError)
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      )
    }

    /* -------------------------------- */
    /* Create Roles                     */
    /* -------------------------------- */

    const roleInserts = playerNames.map((name: string) => ({
      id: crypto.randomUUID(),
      game_id: gameId,
      name,
      role: `${name} has a mysterious connection to the victim.`,
      secrets: [`${name} is hiding something.`],
      motive: `${name} may have had a reason to act.`,
      alibi: '',
      personality: 'Complex',
      is_killer: false,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`
    }))

    const { error: roleError } = await supabase.from('roles').insert(roleInserts)

    if (roleError) {
      console.error(roleError)
      await supabase.from('games').delete().eq('id', gameId)
      return NextResponse.json(
        { error: 'Failed to create roles. Game not created.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ game_id: gameId, hostId })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}