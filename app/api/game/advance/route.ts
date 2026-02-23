import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Hybrid Round Engine
// Host-controlled phase progression
// Includes alibi contradiction detection + suspicion escalation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId, hostId } = body

    if (!gameId || !hostId) {
      return NextResponse.json(
        { error: 'Missing gameId or hostId' },
        { status: 400 }
      )
    }

    // Validate game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    if (game.host_id !== hostId) {
      return NextResponse.json(
        { error: 'Only host can advance game' },
        { status: 403 }
      )
    }

    const phases = ['intro', 'investigation', 'accusation', 'voting', 'reveal'] as const

    const currentIndex = phases.indexOf(game.phase as any)
    let nextPhase = phases[currentIndex + 1]
    let nextRound = game.current_round

    if (!nextPhase) {
      nextRound = game.current_round + 1
      nextPhase = 'intro'
    }

    /* -------------------------------------------------- */
    /* SUSPICION DECAY ENGINE (New Round Reset Pressure) */
    /* -------------------------------------------------- */

    if (nextRound > game.current_round) {
      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, suspicion_level')
        .eq('game_id', gameId)

      if (allPlayers) {
        for (const p of allPlayers) {
          const reduced = Math.max(0, (p.suspicion_level || 0) - 5)

          await supabase
            .from('players')
            .update({ suspicion_level: reduced })
            .eq('id', p.id)
        }

        await supabase.from('game_logs').insert({
          game_id: gameId,
          type: 'suspicion_decay',
          player_id: null,
          details: `New round began. Suspicion slightly cooled across the room.`
        })
      }
    }

    /* -------------------------------------------------- */
    /* ALIBI CONTRADICTION ENGINE (Intro → Investigation) */
    /* -------------------------------------------------- */

    if (game.phase === 'intro' && nextPhase === 'investigation') {
      const { data: alibis } = await supabase
        .from('alibis')
        .select('*')
        .eq('game_id', gameId)
        .eq('round', game.current_round)

      const { data: players } = await supabase
        .from('players')
        .select('id, role_id, suspicion_level, name')
        .eq('game_id', gameId)

      const { data: roles } = await supabase
        .from('roles')
        .select('id, true_location')
        .eq('game_id', gameId)

      const { data: existingClues } = await supabase
        .from('clues')
        .select('text')
        .eq('game_id', gameId)

      if (alibis && players && roles) {
        const contradictionResults: {
          playerId: string
          playerName: string
          previous: number
          updated: number
        }[] = []

        for (const entry of alibis) {
          const player = players.find(p => p.id === entry.player_id)
          if (!player) continue

          const role = roles.find(r => r.id === player.role_id)
          if (!role) continue

          const trueLocation = role.true_location?.toLowerCase().trim()
          const claimed = entry.claimed_location?.toLowerCase().trim()

          if (!trueLocation || !claimed) continue

          let suspicionDelta = 0

          if (claimed !== trueLocation) {
            suspicionDelta += 15
          }

          // Escalate further if existing clues mention the true location
          if (existingClues && existingClues.length > 0) {
            const relatedClue = existingClues.find(c =>
              c.text?.toLowerCase().includes(trueLocation || '')
            )

            if (relatedClue) {
              suspicionDelta += 10
            }
          }

          if (suspicionDelta > 0) {
            const previousSuspicion = player.suspicion_level ?? 0
            const updatedSuspicion = previousSuspicion + suspicionDelta

            await supabase
              .from('players')
              .update({ suspicion_level: updatedSuspicion })
              .eq('id', player.id)

            contradictionResults.push({
              playerId: player.id,
              playerName: player.name,
              previous: previousSuspicion,
              updated: updatedSuspicion
            })
          }
        }

        if (contradictionResults.length > 0) {
          await supabase.from('game_logs').insert({
            game_id: gameId,
            type: 'contradiction_detected',
            player_id: null,
            details: JSON.stringify(contradictionResults)
          })

          await supabase.from('messages').insert({
            game_id: gameId,
            sender_id: hostId,
            recipient_id: null,
            content: `⚡ AI Analysis: Inconsistencies detected. Suspicion levels have shifted across the room...`,
            is_system_message: true
          })

          await supabase.from('clues').insert({
            id: crypto.randomUUID(),
            game_id: gameId,
            text: `🔎 Forensic timeline analysis suggests certain alibis conflict with known movement patterns.`,
            location: 'System',
            revealed: false
          })
        }
      }
    }

    /* -------------------------------------------------- */
    /* VOTING RESOLUTION ENGINE (Voting → Reveal) */
    /* -------------------------------------------------- */

    if (game.phase === 'voting' && nextPhase === 'reveal') {
      const { data: votes } = await supabase
        .from('votes')
        .select('*')
        .eq('game_id', gameId)
        .eq('round', game.current_round)

      if (votes && votes.length > 0) {
        const voteCount: Record<string, number> = {}

        for (const vote of votes) {
          voteCount[vote.accused_id] =
            (voteCount[vote.accused_id] || 0) + 1
        }

        const sorted = Object.entries(voteCount).sort(
          (a, b) => b[1] - a[1]
        )

        const [topPlayerId, totalVotes] = sorted[0]

        const { data: accused } = await supabase
          .from('players')
          .select('suspicion_level')
          .eq('id', topPlayerId)
          .single()

        if (accused) {
          const newSuspicion = (accused.suspicion_level || 0) + 20

          await supabase
            .from('players')
            .update({ suspicion_level: newSuspicion })
            .eq('id', topPlayerId)

          await supabase.from('game_logs').insert({
            game_id: gameId,
            type: 'voting_spike',
            player_id: topPlayerId,
            details: `Player received ${totalVotes} votes. Suspicion +20.`
          })

          await supabase.from('messages').insert({
            game_id: gameId,
            sender_id: hostId,
            recipient_id: null,
            content: `🗳 Voting concluded. A suspect has emerged under intense scrutiny...`,
            is_system_message: true
          })
        }
      }
    }

    /* -------------------------------------------------- */
    /* UPDATE GAME STATE */
    /* -------------------------------------------------- */

    const { error: updateError } = await supabase
      .from('games')
      .update({
        phase: nextPhase,
        current_round: nextRound
      })
      .eq('id', gameId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to advance phase' },
        { status: 500 }
      )
    }

    await supabase.from('messages').insert({
      game_id: gameId,
      sender_id: hostId,
      recipient_id: null,
      content: `📢 Phase changed to ${nextPhase.toUpperCase()} — Round ${nextRound}`,
      is_system_message: true
    })

    return NextResponse.json({
      success: true,
      nextPhase,
      nextRound
    })
  } catch (error: any) {
    console.error('Advance route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}