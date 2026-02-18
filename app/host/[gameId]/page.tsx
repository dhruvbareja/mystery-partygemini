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
  const game_id = params.game_id as string;

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
    const { data: gameData } = await supabase.from('games').select('*').eq('id', game_id).single();
    const { data: playersData } = await supabase.from('players').select('*').eq('game_id', game_id);
    const { data: cluesData } = await supabase.from('clues').select('*').eq('game_id', game_id);
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('game_id', game_id)
      .order('created_at', { ascending: false });

    const { data: votesData } = await supabase.from('votes').select('*').eq('game_id', game_id);

    setGame(gameData);
    setPlayers(playersData || []);
    setClues(cluesData || []);
    setMessages(messagesData || []);
    setVotes(votesData || []);
    setLoading(false);
  };

  const setupRealtime = () => {
    supabase
      .channel(`game-${game_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: '*' }, loadGameData)
      .subscribe();
  };

  /* ---------------- HOST ACTIONS ---------------- */

  const startGame = async () => {
    if (!game) return;

    const nonHostPlayers = players.filter(p => !p.is_host);

    const { data: roles } = await supabase.from('roles').select('*').eq('game_id', game_id);

    if (roles && roles.length === nonHostPlayers.length) {
      for (let i = 0; i < roles.length; i++) {
        await supabase.from('players').update({ role_id: roles[i].id }).eq('id', nonHostPlayers[i].id);
      }
    }

    await supabase
      .from('games')
      .update({ phase: 'role_reveal', started_at: new Date().toISOString() })
      .eq('id', game_id);

    loadGameData();
  };

  const advancePhase = async () => {
    if (!game) return;

    const phases: GamePhase[] = [
      'lobby',
      'role_reveal',
      'intro_round',
      'investigation',
      'clue_drop',
      'accusations',
      'voting',
      'reveal',
      'finished'
    ];

    const next = phases[phases.indexOf(game.phase) + 1] || 'finished';

    await supabase.from('games').update({ phase: next }).eq('id', game_id);
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

      {/* Clues */}
      <div className="space-y-2">
        {unrevealedClues.map(c => (
          <button key={c.id} onClick={() => revealClue(c.id)} className="btn-primary w-full">
            Reveal clue at {c.location}
          </button>
        ))}
      </div>
    </div>
  );
}