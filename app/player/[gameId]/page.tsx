'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { GameData, Player, Message, Clue, Vote, PlayerRole } from '@/types';
import { PHASE_LABELS, getPhaseDescription } from '@/lib/game-utils';

// ✨ All our premium components imported!
import RoleDossier from '@/components/RoleDossier';
import ChatPanel from '@/components/ChatPanel';
import PlayerFaceCard from '@/components/PlayerFaceCard';

export default function PlayerView() {
  const params = useParams();
  const router = useRouter();
  const game_id = params.gameId as string;

  const [game, setGame] = useState<GameData | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [role, setRole] = useState<PlayerRole | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clues, setClues] = useState<Clue[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'role' | 'clues' | 'players'>('chat');
  const [accusedPlayer, setAccusedPlayer] = useState('');
  const [objectiveStatus, setObjectiveStatus] = useState<'idle' | 'verifying' | 'completed'>('idle');

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

  const submitVote = async () => {
    if (!accusedPlayer || !player || !game) return;

    await supabase.from('votes').insert({
      game_id: game_id,
      voter_id: player.id,
      accused_id: accusedPlayer,
      round: game.current_round,
    });

    setAccusedPlayer('');
    loadGameData(player.id); // Refresh to show they voted
  };

  const handleVerifyObjective = async () => {
    if (!player || !role || !game) return;
    setObjectiveStatus('verifying');

    await supabase.from('messages').insert({
      game_id: game_id,
      sender_id: player.id,
      recipient_id: null,
      content: `🔍 ${player.name} has submitted their Secret Objective for AI Verification. Analyzing communication logs...`,
      is_system_message: true,
    });

    try {
      await fetch('/api/game/verify-objective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game_id,
          playerId: player.id,
          playerName: player.name,
          objective: role.objective
        })
      });
      setObjectiveStatus('completed');
    } catch (err) {
      console.error("Verification failed:", err);
      setObjectiveStatus('idle');
    }
  };

  /* -------------------------------------------------- */
  /* GUARDS & COMPUTED */
  /* -------------------------------------------------- */

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-indigo-400 font-mono uppercase tracking-widest text-sm">Loading Identity...</div>;
  if (!game || !player) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-red-500 font-mono uppercase tracking-widest text-sm">Game not found</div>;

  const hasVotedThisRound = votes.some(v => v.voter_id === player.id && v.round === game.current_round);

  /* -------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 font-sans selection:bg-indigo-500/30 p-4 md:p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="border-b border-white/10 pb-4">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{game.name}</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-400 mt-2">
            {PHASE_LABELS[game.phase]} <span className="text-gray-600 mx-2">|</span> Round {game.current_round}
          </p>
        </div>

        {/* DYNAMIC MISSION BRIEFING */}
        {game.phase !== 'lobby' && (
          <div className="bg-[#111118]/80 backdrop-blur-xl border border-indigo-500/30 p-5 rounded-2xl shadow-lg">
            <h2 className="text-indigo-400 font-black uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
              🚨 Active Directive
            </h2>
            <div className="text-gray-300 text-sm leading-relaxed">
              {game.phase === 'role_reveal' && <p>Read your <b>DOSSIER</b> tab carefully. Memorize your backstory, alibi, and your <b>Secret Objective</b>. Trust no one.</p>}
              {game.phase === 'intro_round' && <p>Open <b>COMMS</b>. Introduce your character to the group and publicly state your alibi. Lying is authorized.</p>}
              {game.phase === 'investigation' && <p>Interrogate the other players in <b>COMMS</b>. Tag prime suspects in your <b>NOTEBOOK</b>. Check the <b>CLUES</b> tab for evidence.</p>}
              {game.phase === 'voting' && <p className="text-red-400 font-bold">CRITICAL: Time is up! Review the evidence and cast your official accusation below.</p>}
              {game.phase === 'reveal' && <p>The Host is revealing the truth. Stand by.</p>}
            </div>

            {/* VOTING UI */}
            {game.phase === 'voting' && !hasVotedThisRound && (
              <div className="mt-5 p-5 bg-red-950/20 border border-red-900/50 rounded-xl">
                <h3 className="text-red-400 font-black text-xs uppercase tracking-widest mb-3">Lock In Accusation</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    className="bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 flex-1 outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
                    value={accusedPlayer}
                    onChange={(e) => setAccusedPlayer(e.target.value)}
                  >
                    <option value="">Select prime suspect...</option>
                    {players.filter(p => !p.is_host && p.id !== player.id).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={submitVote}
                    disabled={!accusedPlayer}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg"
                  >
                    Accuse
                  </button>
                </div>
              </div>
            )}
            {game.phase === 'voting' && hasVotedThisRound && (
              <div className="mt-4 p-4 bg-green-950/30 border border-green-900/50 text-green-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                ✅ Accusation locked and transmitted.
              </div>
            )}
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {[
            { id: 'chat', label: 'Comms' },
            { id: 'role', label: 'Dossier' },
            { id: 'clues', label: 'Evidence' },
            { id: 'players', label: 'Notebook' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`snap-center px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---------------- SECURE COMMS (CHAT) ---------------- */}
        {activeTab === 'chat' && (
          <ChatPanel
            messages={messages}
            players={players}
            currentPlayer={player}
            clues={clues}
            gamePhase={game.phase}
            onSendMessage={async (content, recipientId) => {
              await supabase.from('messages').insert({
                game_id: game_id,
                sender_id: player.id,
                recipient_id: recipientId,
                content: content,
                is_system_message: false,
              });
            }}
          />
        )}

        {/* ---------------- ROLE DOSSIER ---------------- */}
        {activeTab === 'role' && role && (
          <RoleDossier 
            role={role} 
            objectiveStatus={objectiveStatus}
            onVerifyObjective={handleVerifyObjective}
          />
        )}

        {/* ---------------- EVIDENCE (CLUES) ---------------- */}
        {activeTab === 'clues' && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {clues.length === 0 && (
              <div className="col-span-full py-12 text-center bg-black/20 border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-gray-500 font-medium text-sm">No evidence has been discovered yet.</p>
              </div>
            )}
            {clues.map(c => (
              <div key={c.id} className="bg-[#111118]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col hover:border-indigo-500/30 transition-colors">
                <span className="text-[10px] font-black text-indigo-400 mb-3 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                  📍 {c.location}
                </span>
                <p className="text-sm text-gray-300 leading-relaxed font-serif bg-black/40 p-4 rounded-2xl">{c.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* ✨ NEW: DETECTIVE NOTEBOOK (PLAYERS) ---------------- */}
        {activeTab === 'players' && (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {players.filter(p => !p.is_host).map(p => (
              <PlayerFaceCard 
                key={p.id}
                playerId={p.id}
                name={p.name}
                avatar={p.avatar}
                isAlive={p.is_alive}
                isHostView={false} 
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}