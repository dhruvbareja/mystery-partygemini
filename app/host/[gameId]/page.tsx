'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Eye,
  Zap,
  AlertTriangle,
  Users,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { GameData, Player, Clue, Message, Vote, GamePhase } from '@/types';
import { PHASE_LABELS } from '@/lib/game-utils';

export default function HostDashboard() {
  const params = useParams();
  const router = useRouter();
  const game_id = params.gameId as string;

  const [game, setGame] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [clues, setClues] = useState<Clue[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    if (!game_id) return;

    const hostId = localStorage.getItem(`host_${game_id}`);

    if (!hostId) {
      router.push(`/game/${game_id}`);
      return;
    }

    loadGameData();
    setupRealtime();
  }, [game_id]);

  const loadGameData = async () => {
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', game_id)
      .maybeSingle();

    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game_id);

    const { data: cluesData } = await supabase
      .from('clues')
      .select('*')
      .eq('game_id', game_id);

    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('game_id', game_id)
      .order('created_at', { ascending: false });

    const { data: votesData } = await supabase
      .from('votes')
      .select('*')
      .eq('game_id', game_id);

    setGame(gameData ?? null);
    setPlayers(playersData || []);
    setClues(cluesData || []);
    setMessages(messagesData || []);
    setVotes(votesData || []);
    setLoading(false);
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel(`game-${game_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${game_id}` },
        loadGameData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${game_id}` },
        loadGameData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `game_id=eq.${game_id}` },
        loadGameData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clues', filter: `game_id=eq.${game_id}` },
        loadGameData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes', filter: `game_id=eq.${game_id}` },
        loadGameData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  /* ---------------- HOST ACTIONS ---------------- */

  const startGame = async () => {
    if (!game) return;

    // Fetch roles
    const { data: roles } = await supabase
      .from('roles')
      .select('*')
      .eq('game_id', game_id);

    // Fetch non-host players
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game_id)
      .eq('is_host', false);

    if (!roles || !playersData) {
      console.error("Missing roles or players");
      return;
    }

    if (playersData.length !== roles.length) {
      console.warn("Players and roles mismatch");
    }

    console.log("Assigning roles:", roles.length, "Players:", playersData.length);

    // Shuffle roles before assigning
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);

    for (let i = 0; i < playersData.length; i++) {
      const roleId = shuffledRoles[i]?.id;

      if (!roleId) {
        console.warn("Not enough roles for players");
        break;
      }

      const { error } = await supabase
        .from('players')
        .update({ role_id: roleId })
        .eq('id', playersData[i].id);

      if (error) {
        console.error("Role assignment error:", error);
      }
    }

    // Move to role reveal phase
    await supabase
      .from('games')
      .update({
        phase: 'role_reveal',
        started_at: new Date().toISOString()
      })
      .eq('id', game_id);

    await supabase.from('messages').insert({
      game_id: game_id,
      sender_id: game.host_id,
      recipient_id: null,
      content: '🎭 The game has begun! Introduce your character and state where you were during the murder.',
      is_system_message: true
    });

    loadGameData();
  };

  const advancePhase = async () => {
    if (!game) return;

    const phases: GamePhase[] = [
      'lobby',
      'role_reveal',
      'intro_round',
      'clue_drop',
      'investigation',
      'accusations',
      'voting',
      'reveal',
      'finished'
    ];

    const nextIndex = phases.indexOf(game.phase) + 1;
    const next = phases[nextIndex] || 'finished';

    const newRound =
      next === 'intro_round' || next === 'investigation'
        ? game.current_round + 1
        : game.current_round;

    await supabase
      .from('games')
      .update({
        phase: next,
        current_round: newRound
      })
      .eq('id', game_id);
  };

  const pauseGame = async () => {
    await supabase.from('games').update({ phase: 'paused' }).eq('id', game_id);
  };

  const revealClue = async (clueId: string) => {
    await supabase.from('clues').update({ revealed: true }).eq('id', clueId);
  };

  const triggerTwist = async () => {
    if (!game?.twists?.length) return;

    const twist = game.twists[Math.floor(Math.random() * game.twists.length)];

    await supabase.from('messages').insert({
      game_id: game_id,
      sender_id: game.host_id,
      recipient_id: null,
      content: `⚡ TWIST: ${twist}`,
      is_system_message: true
    });
  };

  const peekSecret = async () => {
    const { data } = await supabase.from('roles').select('*').eq('game_id', game_id);
    if (!data?.length) return;

    const r = data[Math.floor(Math.random() * data.length)];

    await supabase.from('messages').insert({
      game_id: game_id,
      sender_id: game!.host_id,
      recipient_id: null,
      content: `👁 Secret leaked: ${r.name} → ${r.secrets?.[0]}`,
      is_system_message: true
    });
  };

  const copyJoinLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/game/${game_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ---------------- UI ---------------- */

  if (loading) return <div className="p-10">Loading...</div>;
  if (!game) return <div className="p-10">Game not found</div>;

  const nonHostPlayers = players.filter(p => !p.is_host);
  const unrevealedClues = clues.filter(c => !c.revealed);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{game.name}</h1>

        <button onClick={copyJoinLink} className="btn-secondary flex gap-2">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Share Link'}
        </button>
      </div>

      {/* PLAYERS PANEL */}
      <div className="bg-gray-900 p-4 rounded">
        <h2 className="text-lg font-bold mb-2">👥 Players</h2>
        {nonHostPlayers.length === 0 && (
          <div className="text-sm text-gray-400">No players joined yet</div>
        )}
        {nonHostPlayers.map(p => (
          <div key={p.id} className="flex justify-between text-sm py-1">
            <span>{p.name}</span>
            <span>
              {p.role_id ? "🎭 Assigned" : "⏳ Waiting"}
            </span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {game.phase === 'lobby' ? (
          <button onClick={startGame} className="btn-primary">
            <Play size={16} /> Start
          </button>
        ) : (
          <>
            <button onClick={advancePhase} className="btn-primary">
              <Play size={16} /> Next
            </button>

            <button onClick={pauseGame} className="btn-secondary">
              <Pause size={16} /> Pause
            </button>

            <button onClick={peekSecret} className="btn-secondary">
              <Eye size={16} /> Peek
            </button>

            <button onClick={triggerTwist} className="btn-secondary">
              <AlertTriangle size={16} /> Twist
            </button>
          </>
        )}
      </motion.div>

      {/* STORY PANEL */}
      <div className="bg-gray-900 p-4 rounded space-y-2">
        <h2 className="text-xl font-bold">🕯 Story Overview</h2>
        <p>{game.story}</p>

        <div className="text-sm mt-2 space-y-1">
          <p><b>Victim:</b> {game.victim}</p>
          <p><b>Killer:</b> {game.killer}</p>
          <p><b>Current Round:</b> {game.current_round}</p>
          <p><b>Phase:</b> {PHASE_LABELS[game.phase]}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-2">
        {messages.slice(0, 10).map(msg => {
          const sender = players.find(p => p.id === msg.sender_id);

          return (
            <div key={msg.id} className="text-sm bg-gray-800 p-2 rounded">
              <b>{sender?.name || 'System'}:</b> {msg.content}
            </div>
          );
        })}
      </div>

      {/* ALL CLUES */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold">🧩 Clues</h2>

        {clues.map(c => (
          <div key={c.id} className="bg-gray-800 p-2 rounded flex justify-between items-center">
            <span>
              {c.revealed ? "✅" : "❌"} {c.location}
            </span>

            {!c.revealed && (
              <button
                onClick={() => revealClue(c.id)}
                className="btn-primary"
              >
                Reveal
              </button>
            )}
          </div>
        ))}
      </div>

      {/* VOTES */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold">🗳 Votes</h2>

        {votes.length === 0 && (
          <div className="text-sm text-gray-400">No votes yet</div>
        )}

        {votes.map(v => {
          const voter = players.find(p => p.id === v.voter_id);
          const accused = players.find(p => p.id === v.accused_id);

          return (
            <div key={v.id} className="bg-gray-800 p-2 rounded text-sm">
              {voter?.name || 'Unknown'} → {accused?.name || 'Unknown'}
            </div>
          );
        })}
      </div>
    </div>
  );
}