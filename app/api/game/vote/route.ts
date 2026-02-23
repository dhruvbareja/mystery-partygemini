

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId, voterId, accusedId } = body

    if (!gameId || !voterId || !accusedId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch current game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, current_round, phase, host_id')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    if (game.phase !== 'voting') {
      return NextResponse.json(
        { error: 'Voting is not active' },
        { status: 400 }
      )
    }

    if (voterId === accusedId) {
      return NextResponse.json(
        { error: 'You cannot vote for yourself' },
        { status: 400 }
      )
    }

    // Prevent duplicate voting
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('game_id', gameId)
      .eq('voter_id', voterId)
      .eq('round', game.current_round)
      .maybeSingle()

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted this round' },
        { status: 400 }
      )
    }

    // Insert vote
    const { error: insertError } = await supabase
      .from('votes')
      .insert({
        game_id: gameId,
        voter_id: voterId,
        accused_id: accusedId,
        round: game.current_round,
      })

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to cast vote' },
        { status: 500 }
      )
    }

    // Minor suspicion increase immediately (+5)
    const { data: accused } = await supabase
      .from('players')
      .select('suspicion_level')
      .eq('id', accusedId)
      .single()

    if (accused) {
      const newSuspicion = (accused.suspicion_level || 0) + 5

      await supabase
        .from('players')
        .update({ suspicion_level: newSuspicion })
        .eq('id', accusedId)

      await supabase.from('game_logs').insert({
        game_id: gameId,
        type: 'vote_cast',
        player_id: accusedId,
        details: `Received a vote in Round ${game.current_round}. Suspicion +5.`
      })
    }

    // Narrative injection
    await supabase.from('messages').insert({
      game_id: gameId,
      sender_id: game.host_id,
      recipient_id: null,
      content: `🗳 A vote has been cast. The atmosphere grows heavier...`,
      is_system_message: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vote route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}