import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getRandomAvatar } from '@/lib/avatars';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { game_id, playerName } = body;

    if (!game_id || !playerName) {
      return NextResponse.json(
        { error: 'Missing game ID or player name' },
        { status: 400 }
      );
    }

    // Check if game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', game_id.toUpperCase())
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check if game has already started
    if (game.phase !== 'lobby') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      );
    }

    // Check if player name already exists in this game
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)
      .eq('name', playerName.trim())
      .single();

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'A player with this name already exists in this game' },
        { status: 400 }
      );
    }

    // Get available roles
    const { data: roles } = await supabase
      .from('roles')
      .select('*')
      .eq('game_id', game.id);

    const { data: players } = await supabase
      .from('players')
      .select('role_id')
      .eq('game_id', game.id);

    const assignedRoleIds = players?.map(p => p.role_id).filter(Boolean) || [];
    const availableRole = roles?.find(r => !assignedRoleIds.includes(r.id));

    if (!availableRole) {
      return NextResponse.json(
        { error: 'No available roles left' },
        { status: 400 }
      );
    }

    // Create player
    const playerId = nanoid();
    const { error: playerError } = await supabase
      .from('players')
      .insert({
        id: playerId,
        game_id: game.id,
        name: playerName.trim(),
        avatar: getRandomAvatar(),
        role_id: null, // Assigned when game starts
        is_host: false,
        is_ready: false,
        is_alive: true,
        suspicion_level: 0,
      });

    if (playerError) {
      console.error('Player creation error:', playerError);
      return NextResponse.json(
        { error: 'Failed to join game' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      playerId,
      game_id: game.id,
      success: true,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
