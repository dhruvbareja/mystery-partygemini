'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Eye, EyeOff, Users, MapPin,
  ScrollText, Vote as VoteIcon, Skull, Search
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { GameData, Player, Message, Clue } from '@/types';
import { PHASE_LABELS, getPhaseDescription } from '@/lib/game-utils';

export default function PlayerView() {
  const params = useParams();
  const router = useRouter();
  const game_id = params.game_id as string;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [game, setGame] = useState<GameData | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [role, setRole] = useState<any | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clues, setClues] = useState<Clue[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<'chat' | 'role' | 'clues' | 'players'>('chat');

  const [messageInput, setMessageInput] = useState('');
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [accusedPlayer, setAccusedPlayer] = useState('');

  /* -------------------------------------------------- */
  /* INIT */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (!game_id) return;

    const playerId = localStorage.getItem(`player_${game_id}`);

    if (!playerId) {
      router.push(`/game/${game_id}`);
      return;
    }

    loadGameData(playerId);

    // ✅ FIX: realtime cleanup to avoid memory leaks
    const cleanup = setupRealtimeSubscriptions(playerId);
    return cleanup;
  }, [game_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* -------------------------------------------------- */
  /* LOAD DATA */
  /* -------------------------------------------------- */

  const loadGameData = async (playerId: string) => {
    try {
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('id', game_id)
        .single();

      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', game_id);

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('game_id', game_id)
        .or(`recipient_id.is.null,recipient_id.eq.${playerId},sender_id.eq.${playerId}`)
        .order('created_at', { ascending: true });

      const { data: cluesData } = await supabase
        .from('clues')
        .select('*')
        .eq('game_id', game_id)
        .eq('revealed', true);

      setGame(gameData);
      setPlayer(playerData);
      setPlayers(playersData || []);
      setMessages(messagesData || []);
      setClues(cluesData || []);

      // role
      if (playerData?.role_id) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('*')
          .eq('id', playerData.role_id)
          .single();

        setRole(roleData);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  /* -------------------------------------------------- */
  /* REALTIME */
  /* -------------------------------------------------- */

  const setupRealtimeSubscriptions = (playerId: string) => {
    const channel = supabase
      .channel(`player-${playerId}`)

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${game_id}` },
        () => loadGameData(playerId)
      )

      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `game_id=eq.${game_id}` },
        () => loadGameData(playerId)
      )

      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clues', filter: `game_id=eq.${game_id}` },
        () => loadGameData(playerId)
      )

      .subscribe();

    // ✅ FIX: cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  };

  /* -------------------------------------------------- */
  /* ACTIONS */
  /* -------------------------------------------------- */

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !player) return;

    await supabase.from('messages').insert({
      game_id: game_id,
      sender_id: player.id,
      recipient_id: selectedDM,
      content: messageInput.trim(),
      is_system_message: false,
    });

    setMessageInput('');
  };

  const submitAccusation = async () => {
    if (!accusedPlayer || !player) return;

    await supabase.from('votes').insert({
      game_id: game_id,
      voter_id: player.id,
      accused_id: accusedPlayer,
      round: game?.current_round || 1,
    });

    setAccusedPlayer('');
  };

  /* -------------------------------------------------- */
  /* GUARDS */
  /* -------------------------------------------------- */

  if (loading) return <div className="spinner" />;
  if (!game || !player) return <div>Game not found</div>;

  const otherPlayers = players.filter(p => p.id !== player.id && !p.is_host);

  const displayMessages = selectedDM
    ? messages.filter(
        m =>
          (m.sender_id === player.id && m.recipient_id === selectedDM) ||
          (m.sender_id === selectedDM && m.recipient_id === player.id)
      )
    : messages.filter(m => m.recipient_id === null);

  /* -------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------- */

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">{game.name}</h1>
      <p>{PHASE_LABELS[game.phase]}</p>

      {/* ---------------- CHAT ---------------- */}
      {activeTab === 'chat' && (
        <>
          <div className="space-y-2">
            {displayMessages.map(msg => {
              const isOwn = msg.sender_id === player.id;
              const isSystem = msg.is_system_message;

              if (isSystem)
                return <div key={msg.id}>⚡ {msg.content}</div>;

              return (
                <div key={msg.id}>
                  <b>{isOwn ? 'You' : 'Player'}:</b> {msg.content}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage}>
            <input
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              className="border p-2"
            />
            <button>Send</button>
          </form>
        </>
      )}

      {/* ---------------- ROLE ---------------- */}
      {activeTab === 'role' && role && (
        <div>
          <h2>{role.name}</h2>
          <p>{role.role}</p>

          {/* ✅ FIX: safe optional chaining */}
          {role.secrets?.map((s: string, i: number) => (
            <p key={i}>🔒 {s}</p>
          ))}
        </div>
      )}
    </div>
  );
}