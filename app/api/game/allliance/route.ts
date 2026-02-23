import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    // =========================================
    // CREATE ALLIANCE
    // =========================================
    if (type === 'create') {
      const { gameId, playerId, name } = body

      if (!gameId || !playerId || !name) {
        return NextResponse.json(
          { error: 'Missing fields' },
          { status: 400 }
        )
      }

      // Prevent player from creating multiple alliances
      const { data: existingMembership } = await supabase
        .from('alliance_members')
        .select('*')
        .eq('player_id', playerId)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: 'Player already in an alliance' },
          { status: 400 }
        )
      }

      const allianceId = nanoid()

      const { error } = await supabase
        .from('alliances')
        .insert({
          id: allianceId,
          game_id: gameId,
          name,
          created_by: playerId,
        })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      // Add creator as first member
      await supabase.from('alliance_members').insert({
        alliance_id: allianceId,
        player_id: playerId,
      })

      // Optional: system narrative message
      await supabase.from('messages').insert({
        game_id: gameId,
        sender_id: playerId,
        recipient_id: null,
        content: `🤝 A secret alliance has formed.`,
        is_system_message: true,
      })

      return NextResponse.json({
        success: true,
        allianceId,
      })
    }

    // =========================================
    // JOIN ALLIANCE
    // =========================================
    if (type === 'join') {
      const { allianceId, playerId } = body

      if (!allianceId || !playerId) {
        return NextResponse.json(
          { error: 'Missing fields' },
          { status: 400 }
        )
      }

      // Prevent duplicate joins
      const { data: existing } = await supabase
        .from('alliance_members')
        .select('*')
        .eq('alliance_id', allianceId)
        .eq('player_id', playerId)
        .single()

      if (existing) {
        return NextResponse.json({ success: true })
      }

      const { error } = await supabase
        .from('alliance_members')
        .insert({
          alliance_id: allianceId,
          player_id: playerId,
        })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    // =========================================
    // SEND ALLIANCE MESSAGE
    // =========================================
    if (type === 'message') {
      const { allianceId, senderId, content } = body

      if (!allianceId || !senderId || !content) {
        return NextResponse.json(
          { error: 'Missing fields' },
          { status: 400 }
        )
      }

      // Validate sender is member
      const { data: membership } = await supabase
        .from('alliance_members')
        .select('*')
        .eq('alliance_id', allianceId)
        .eq('player_id', senderId)
        .single()

      if (!membership) {
        return NextResponse.json(
          { error: 'Not authorized for this alliance' },
          { status: 403 }
        )
      }

      const { error } = await supabase
        .from('alliance_messages')
        .insert({
          alliance_id: allianceId,
          sender_id: senderId,
          content,
        })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid type' },
      { status: 400 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}