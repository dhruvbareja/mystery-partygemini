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

    // ── Fetch game ──
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, current_round, max_rounds, phase, host_id')
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

    // ── Prevent duplicate vote ──
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

    // ── Insert vote ──
    const { error: insertError } = await supabase
      .from('votes')
      .insert({
        game_id: gameId,
        voter_id: voterId,
        accused_id: accusedId,
        round: game.current_round
      })

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to cast vote' },
        { status: 500 }
      )
    }

    // ─────────────────────────────────────────────
    // TONE-AWARE SUSPICION SPIKE
    // ─────────────────────────────────────────────
    const tone =
      game.current_round >= 3
        ? 'dire'
        : game.current_round >= 2
        ? 'tense'
        : 'calm'

    const prefix =
      tone === 'dire' ? '🔴' :
      tone === 'tense' ? '🟠' :
      '🟡'

    const baseSuspicionPerVote =
      tone === 'dire' ? 8 :
      tone === 'tense' ? 6 :
      5

    const { data: accused } = await supabase
      .from('players')
      .select('suspicion_level, name')
      .eq('id', accusedId)
      .single()

    if (accused) {
      const updatedSuspicion =
        (accused.suspicion_level || 0) + baseSuspicionPerVote

      await supabase
        .from('players')
        .update({ suspicion_level: updatedSuspicion })
        .eq('id', accusedId)

      await supabase.from('game_logs').insert({
        game_id: gameId,
        type: 'vote_cast',
        player_id: accusedId,
        details: `${accused.name} received a vote in Round ${game.current_round}. Suspicion +${baseSuspicionPerVote}. Tone: ${tone}.`
      })
    }

    // ─────────────────────────────────────────────
    // ALLIANCE BETRAYAL DETECTION
    // ─────────────────────────────────────────────
    const { data: voterAlliance } = await supabase
      .from('alliance_members')
      .select('alliance_id')
      .eq('player_id', voterId)
      .maybeSingle()

    const { data: accusedAlliance } = await supabase
      .from('alliance_members')
      .select('alliance_id')
      .eq('player_id', accusedId)
      .maybeSingle()

    const isBetrayal =
      voterAlliance &&
      accusedAlliance &&
      voterAlliance.alliance_id === accusedAlliance.alliance_id

    if (isBetrayal) {
      const betrayalSpike =
        tone === 'dire' ? 20 :
        tone === 'tense' ? 15 :
        12

      // Extra spike on accused
      const { data: accusedFresh } = await supabase
        .from('players')
        .select('suspicion_level')
        .eq('id', accusedId)
        .single()

      if (accusedFresh) {
        await supabase
          .from('players')
          .update({
            suspicion_level:
              (accusedFresh.suspicion_level || 0) + betrayalSpike
          })
          .eq('id', accusedId)
      }

      // Minor rebound on betrayer
      const { data: betrayer } = await supabase
        .from('players')
        .select('suspicion_level')
        .eq('id', voterId)
        .single()

      if (betrayer) {
        await supabase
          .from('players')
          .update({
            suspicion_level:
              (betrayer.suspicion_level || 0) + 5
          })
          .eq('id', voterId)
      }

      await supabase.from('game_logs').insert({
        game_id: gameId,
        type: 'alliance_betrayal',
        player_id: accusedId,
        details: `Alliance betrayal vote detected. Accused +${betrayalSpike}. Betrayer +5.`
      })

      await supabase.from('messages').insert({
        game_id: gameId,
        sender_id: game.host_id,
        recipient_id: null,
        content: `${prefix} A vote fractures an alliance. Trust is no longer stable.`,
        is_system_message: true
      })
    } else {
      const voteMessages: Record<string, string> = {
        dire: `${prefix} Another name enters the reckoning. The pressure is unbearable.`,
        tense: `${prefix} A vote has been cast. The atmosphere thickens.`,
        calm: `🗳 A vote has been cast. The atmosphere grows heavier...`
      }

      await supabase.from('messages').insert({
        game_id: gameId,
        sender_id: game.host_id,
        recipient_id: null,
        content: voteMessages[tone],
        is_system_message: true
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vote route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}