import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json(
        { error: 'Missing gameId' },
        { status: 400 }
      )
    }

    /* ---------------- CLEAR TABLES ---------------- */

    await supabase.from('votes').delete().eq('game_id', gameId)
    await supabase.from('alliances').delete().eq('game_id', gameId)
    await supabase.from('clues').delete().eq('game_id', gameId)
    await supabase.from('messages').delete().eq('game_id', gameId)

    /* ---------------- RESET PLAYERS ---------------- */

    await supabase
      .from('players')
      .update({
        suspicion_level: 0,
        role_id: null
      })
      .eq('game_id', gameId)

    /* ---------------- RESET GAME ---------------- */

    await supabase
      .from('games')
      .update({
        phase: 'lobby',
        current_round: 0,
        settings: { tension: 0 }
      })
      .eq('id', gameId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Internal error' },
      { status: 500 }
    )
  }
}