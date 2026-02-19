import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    // -----------------------
    // CREATE ALLIANCE
    // -----------------------
    if (type === 'create') {
      const { gameId, playerId, name } = body;

      if (!gameId || !playerId || !name) {
        return NextResponse.json(
          { error: 'Missing fields' },
          { status: 400 }
        );
      }

      const allianceId = nanoid();

      const { error } = await supabase
        .from('alliances')
        .insert({
          id: allianceId,
          game_id: gameId,
          name,
          created_by: playerId,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Add creator as first member
      await supabase.from('alliance_members').insert({
        alliance_id: allianceId,
        player_id: playerId,
      });

      return NextResponse.json({ allianceId });
    }

    // -----------------------
    // JOIN ALLIANCE
    // -----------------------
    if (type === 'join') {
      const { allianceId, playerId } = body;

      await supabase.from('alliance_members').insert({
        alliance_id: allianceId,
        player_id: playerId,
      });

      return NextResponse.json({ success: true });
    }

    // -----------------------
    // SEND MESSAGE
    // -----------------------
    if (type === 'message') {
      const { allianceId, senderId, content } = body;

      await supabase.from('alliance_messages').insert({
        alliance_id: allianceId,
        sender_id: senderId,
        content,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}