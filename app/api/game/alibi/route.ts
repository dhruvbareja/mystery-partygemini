import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Player submits claimed alibi for a round
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId, playerId, claimedLocation, claimedStory, round } = body

    if (!gameId || !playerId || !claimedLocation || typeof round !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, phase')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Only allow alibi submission during intro or investigation phase
    if (!['intro', 'investigation'].includes(game.phase)) {
      return NextResponse.json(
        { error: 'Alibi submission not allowed in this phase' },
        { status: 400 }
      )
    }

    // Validate player exists
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, game_id, is_host, role_id, suspicion_level')
      .eq('id', playerId)
      .single()

    if (playerError || !player || player.game_id !== gameId) {
      return NextResponse.json(
        { error: 'Invalid player' },
        { status: 403 }
      )
    }

    if (player.is_host) {
      return NextResponse.json(
        { error: 'Host cannot submit alibi' },
        { status: 403 }
      )
    }

    // Upsert claimed alibi for this round
    const { error: upsertError } = await supabase
      .from('alibis')
      .upsert(
        {
          game_id: gameId,
          player_id: playerId,
          round,
          claimed_location: claimedLocation,
          claimed_story: claimedStory ?? null
        },
        {
          onConflict: 'game_id,player_id,round'
        }
      )

    if (upsertError) {
      console.error('Alibi upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to submit alibi' },
        { status: 500 }
      )
    }

    // 🔥 Suspicion Engine: Compare claimed location with true hidden location

    if (player.role_id) {
      const { data: role } = await supabase
        .from('roles')
        .select('true_location, motive')
        .eq('id', player.role_id)
        .single()

      let suspicionDelta = 0
      let contradictionType: 'lie' | 'truth' | 'neutral' = 'neutral'

      const trueLocation = role?.true_location?.toLowerCase()?.trim()
      const claimed = claimedLocation?.toLowerCase()?.trim()

      if (trueLocation && claimed) {
        if (claimed !== trueLocation) {
          suspicionDelta = 20
          contradictionType = 'lie'
        } else {
          suspicionDelta = -5
          contradictionType = 'truth'
        }
      }

      const previousSuspicion = player.suspicion_level || 0
      const newSuspicion = Math.max(0, previousSuspicion + suspicionDelta)

      await supabase
        .from('players')
        .update({ suspicion_level: newSuspicion })
        .eq('id', playerId)

      // Detailed structured log
      await supabase.from('game_logs').insert({
        game_id: gameId,
        type: 'alibi_analysis',
        player_id: playerId,
        details: JSON.stringify({
          round,
          contradictionType,
          previousSuspicion,
          newSuspicion,
          delta: suspicionDelta
        })
      })

      // AI-style escalation message (visible to everyone, but vague)
      if (contradictionType === 'lie') {
        await supabase.from('messages').insert({
          game_id: gameId,
          sender_id: playerId,
          recipient_id: null,
          content: `⚠ Subtle inconsistencies ripple through the room. Someone’s timeline may not add up...`,
          is_system_message: true
        })
      }

      if (contradictionType === 'truth') {
        await supabase.from('messages').insert({
          game_id: gameId,
          sender_id: playerId,
          recipient_id: null,
          content: `🧠 The alibi aligns… for now. But trust is fragile in this room.`,
          is_system_message: true
        })
      }
    }

    // Log submission as system message (visible to host dashboard)
    await supabase.from('messages').insert({
      game_id: gameId,
      sender_id: playerId,
      recipient_id: null,
      content: `📝 ${playerId} submitted an alibi for Round ${round}. The room grows tense...`,
      is_system_message: true
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Alibi route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}