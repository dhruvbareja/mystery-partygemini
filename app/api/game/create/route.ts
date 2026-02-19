import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateMysteryGame } from '@/lib/ai-generator';
import { generateGameCode } from '@/lib/game-utils';
import { getAvatarForIndex } from '@/lib/avatars';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
   let body: any = {};

  try {
    body = await request.json();
  } catch {
    // 🔥 Dev shortcut: auto-fill test data if no body provided
    body = {
      gameName: 'Test Mystery',
      playerNames: ['Alice', 'Bob', 'Charlie', 'David'],
      locations: ['Library', 'Kitchen', 'Garden'],
      theme: 'Classic Manor Murder',
      customNotes: ''
    };
    console.log('Using DEV fallback body:', body);
  }
    const { gameName, playerNames, locations, theme, customNotes } = body;

    /* ------------------------------------------------ */
    /* Validation                                       */
    /* ------------------------------------------------ */

    if (!gameName || !playerNames || !locations || !theme) {
      console.log('Missing fields, but continuing in DEV mode');
    }

    if (playerNames.length < 3) {
      return NextResponse.json(
        { error: 'Need at least 3 players' },
        { status: 400 }
      );
    }

    /* ------------------------------------------------ */
    /* Generate mystery (Ollama)                        */
    /* ------------------------------------------------ */

    console.log('Generating mystery with AI...');
    console.log('INPUT:', { gameName, playerNames, locations, theme, customNotes });

    const mysteryData = await generateMysteryGame({
      gameName,
      playerNames,
      locations,
      theme,
      customNotes,
    });
    console.log('RAW MYSTERY DATA:', mysteryData);

    /* ------------------------------------------------ */
    /* SAFETY: sanitize ALL AI output                   */
    /* ------------------------------------------------ */

    const safeCharacters = mysteryData?.characters ?? [];
    const safeClues = mysteryData?.clues ?? [];
    const safeLocations = mysteryData?.locations ?? [];
    const safeTwists = mysteryData?.twists ?? [];

    if (!mysteryData?.story || !mysteryData?.victim || !mysteryData?.killer) {
      console.error('AI returned incomplete data. Using fallback values.', mysteryData);

      mysteryData.story ||= 'A mysterious incident has occurred.';
      mysteryData.victim ||= 'Unknown Victim';
      mysteryData.killer ||= 'Unknown Killer';
    }

    if (!Array.isArray(safeLocations)) {
      console.error('Locations is not an array:', safeLocations);
      return NextResponse.json(
        { error: 'AI returned invalid locations format' },
        { status: 500 }
      );
    }

    const game_id = generateGameCode();
    const hostId = nanoid();

    /* ------------------------------------------------ */
    /* Create game                                      */
    /* ------------------------------------------------ */

    const { error: gameError } = await supabase
      .from('games')
      .insert({
        id: game_id,
        name: gameName,
        host_id: hostId,
        phase: 'lobby',
        story: mysteryData?.story ?? '',
        victim: mysteryData?.victim ?? '',
        killer: mysteryData?.killer ?? '',
        locations: safeLocations,
        theme,
        revealed_clues: [],
        twists: safeTwists,
        ending_text: mysteryData?.endingText ?? '',
        current_round: 0,
        max_rounds: 6,
        settings: {
          timerEnabled: true,
          roundDuration: 300,
        },
      });

    if (gameError) {
      console.error('GAME INSERT ERROR FULL:', JSON.stringify(gameError, null, 2));
      return NextResponse.json(
        { error: 'Failed to create game', details: gameError },
        { status: 500 }
      );
    }

    /* ------------------------------------------------ */
    /* Create roles (FIXED VERSION)                     */
    /* ------------------------------------------------ */

    const rolesData = safeCharacters.map((char: any, index: number) => ({
      id: nanoid(),
      game_id: game_id,
      name: char?.name ?? `Player ${index + 1}`,
      role: char?.role ?? 'Student',
      secrets: Array.isArray(char?.secrets) ? char.secrets : [],   // 🔥 FIX
      motive: char?.motive ?? null,
      alibi: char?.alibi ?? '',
      personality: char?.personality ?? '',
      is_killer: char?.name === mysteryData?.killer,
      avatar: getAvatarForIndex(index),
    }));

    if (rolesData.length) {
      const { error: rolesError } = await supabase
        .from('roles')
        .insert(rolesData);

      if (rolesError) {
        console.error('ROLES INSERT ERROR FULL:', JSON.stringify(rolesError, null, 2));
      }
    }

    /* ------------------------------------------------ */
    /* Create clues (FIXED VERSION)                     */
    /* ------------------------------------------------ */

    const cluesData = safeClues.map((clue: any) => ({
      id: nanoid(),
      game_id: game_id,
      text: clue?.text ?? '',
      location: clue?.location ?? '',
      revealed: false,
    }));

    if (cluesData.length) {
      const { error: cluesError } = await supabase
        .from('clues')
        .insert(cluesData);

      if (cluesError) {
        console.error('CLUES INSERT ERROR FULL:', JSON.stringify(cluesError, null, 2));
      }
    }

    /* ------------------------------------------------ */
    /* Create host player                               */
    /* ------------------------------------------------ */

    const { error: hostError } = await supabase
      .from('players')
      .insert({
        id: hostId,
        game_id: game_id,
        name: 'Game Master',
        avatar: '🎭',
        is_host: true,
        is_ready: true,
        is_alive: true,
        suspicion_level: 0,
      });

    if (hostError) {
      console.error('HOST INSERT ERROR FULL:', JSON.stringify(hostError, null, 2));
    }

    /* ------------------------------------------------ */
    /* Success                                          */
    /* ------------------------------------------------ */

    return NextResponse.json({
      game_id,
      hostId,
      success: true,
    });

  } catch (error: any) {
    console.error('API Error:', error);

    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}