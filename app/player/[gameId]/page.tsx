'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { GameData, Player, Message, Clue, Vote, PlayerRole } from '@/types';
import { PHASE_LABELS, getPhaseDescription } from '@/lib/game-utils';

export default function PlayerView() {
  const params = useParams();
  const router = useRouter();
  const game_id = params.gameId as string;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [game, setGame] = useState<GameData | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  
  // ✨ FIX: Typed properly to prevent red lines
  const [role, setRole] = useState<PlayerRole | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clues, setClues] = useState<Clue[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'chat' | 'role' | 'clues' | 'players'>('chat');

  const [messageInput, setMessageInput] = useState('');
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
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
      const { data: gameData } = await supabase.from('games').select('*').eq('id', game_id).single();
      const { data: playerData } = await supabase.from('players').select('*').eq('id', playerId).single();
      const { data: playersData } = await supabase.from('players').select('*').eq('game_id', game_id);
      
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('game_id', game_id)
        .or(`recipient_id.is.null,recipient_id.eq.${playerId},sender_id.eq.${playerId}`)
        .order('created_at', { ascending: true });

      const { data: cluesData } = await supabase.from('clues').select('*').eq('game_id', game_id).eq('revealed', true);
      const { data: votesData } = await supabase.from('votes').select('*').eq('game_id', game_id);

      setGame(gameData);
      setPlayer(playerData);
      setPlayers(playersData || []);
      setMessages(messagesData || []);
      setClues(cluesData || []);
      setVotes(votesData || []);

      if (playerData?.role_id) {
        const { data: roleData } = await supabase.from('roles').select('*').eq('id', playerData.role_id).single();
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${game_id}` }, () => loadGameData(playerId))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `game_id=eq.${game_id}` }, () => loadGameData(playerId))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clues', filter: `game_id=eq.${game_id}` }, () => loadGameData(playerId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roles', filter: `game_id=eq.${game_id}` }, () => loadGameData(playerId))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  /* -------------------------------------------------- */
  /* GUARDS */
  /* -------------------------------------------------- */

  if (loading) return <div className="p-8 text-center text-gray-400">Loading your character...</div>;
  if (!game || !player) return <div className="p-8 text-center text-red-500">Game not found</div>;

  const displayMessages = selectedDM
    ? messages.filter(m => (m.sender_id === player.id && m.recipient_id === selectedDM) || (m.sender_id === selectedDM && m.recipient_id === player.id))
    : messages.filter(m => m.recipient_id === null);

  /* -------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------- */

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">

      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-white">{game.name}</h1>
        <p className="text-sm font-medium text-purple-400 mt-1">
          {PHASE_LABELS[game.phase]} — Round {game.current_round}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {getPhaseDescription(game.phase)}
        </p>
      </div>

      {game.phase !== 'lobby' && (
        <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg text-sm text-gray-200 shadow-inner">
          <strong className="text-purple-400 mb-1 block">The Story So Far:</strong> 
          <span className="whitespace-pre-wrap leading-relaxed">{game.story}</span>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-800">
        {['chat','role','clues','players'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
              activeTab === tab 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ---------------- CHAT ---------------- */}
      {activeTab === 'chat' && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg h-[500px] flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayMessages.map(msg => {
              const isOwn = msg.sender_id === player.id;
              const isSystem = msg.is_system_message;

              if (isSystem) return <div key={msg.id} className="text-center text-xs text-purple-400 my-2 bg-purple-900/10 py-1 rounded">⚡ {msg.content}</div>;

              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${isOwn ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                    <div className="text-xs opacity-50 mb-1 font-bold">
                      {isOwn ? 'You' : players.find(p => p.id === msg.sender_id)?.name || 'Unknown'}
                    </div>
                    <div className="text-sm">{msg.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 bg-gray-950 border-t border-gray-800 flex gap-2">
            <input
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold transition-colors">
              Send
            </button>
          </form>
        </div>
      )}

      {/* ---------------- ROLE (UPGRADED UI) ---------------- */}
      {activeTab === 'role' && role && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h2 className="text-3xl font-black text-white mb-1">{role.name}</h2>
            <p className="text-lg font-semibold text-purple-400">{role.role}</p>
          </div>

          {/* ✨ NEW: Backstory Section */}
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-300 border-b border-gray-700 pb-2 mb-3">Your Backstory</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{role.backstory || "You are a mysterious figure."}</p>
          </div>

          {/* ✨ NEW: Objective Section */}
          <div className="bg-indigo-900/30 border border-indigo-500/30 p-5 rounded-lg shadow-sm">
            <h3 className="font-bold text-indigo-400 border-b border-indigo-500/30 pb-2 mb-3">🎯 Tonight's Secret Objective</h3>
            <p className="text-sm text-indigo-200 leading-relaxed font-medium">{role.objective || "Survive the night."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-300 border-b border-gray-700 pb-2 mb-3">Your Personality</h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{role.personality}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-300 border-b border-gray-700 pb-2 mb-3">Your Alibi</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{role.alibi}</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-300 border-b border-gray-700 pb-2 mb-3">Your Motive</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{role.motive}</p>
          </div>

          <div className="bg-red-950/30 border border-red-900/50 p-5 rounded-lg shadow-sm">
            <h3 className="font-bold text-red-400 border-b border-red-900/50 pb-2 mb-3">Your Dark Secrets</h3>
            <ul className="space-y-3">
              {role.secrets?.map((s: string, i: number) => (
                <li key={i} className="text-sm text-gray-300 flex items-start">
                  <span className="mr-2">🔒</span> 
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ---------------- CLUES ---------------- */}
      {activeTab === 'clues' && (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {clues.length === 0 && <p className="text-gray-500 italic p-4 col-span-full">No clues have been revealed to you yet.</p>}
          {clues.map(c => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-sm flex flex-col">
              <span className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                📍 {c.location}
              </span>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- PLAYERS ---------------- */}
      {activeTab === 'players' && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {players.filter(p => !p.is_host).map(p => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 p-4 rounded-lg text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gray-700 mx-auto mb-2 flex items-center justify-center text-xl">
                {p.avatar || '👤'}
              </div>
              <p className="font-bold text-sm text-gray-200">{p.name}</p>
              {p.is_alive ? (
                <span className="text-xs text-green-400">Alive</span>
              ) : (
                <span className="text-xs text-red-500 font-bold">Deceased</span>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}