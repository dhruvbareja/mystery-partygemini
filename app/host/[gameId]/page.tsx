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

import GlassPanel from '@/components/GlassPanel';
import SectionHeader from '@/components/SectionHeader';

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
  const [alliances, setAlliances] = useState<any[]>([]);
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

    // Fetch alliances
    const { data: allianceData } = await supabase
      .from('alliances')
      .select('*')
      .eq('game_id', game_id);

    const { data: allianceMembers } = await supabase
      .from('alliance_members')
      .select('*');

    if (allianceData) {
      const enriched = allianceData.map(a => ({
        ...a,
        members: allianceMembers
          ?.filter(m => m.alliance_id === a.id)
          .map(m => m.player_id) || [],
      }));
      setAlliances(enriched);
    }

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alliances', filter: `game_id=eq.${game_id}` },
        loadGameData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alliance_members' },
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

    const hostId = localStorage.getItem(`host_${game_id}`);
    if (!hostId) return;

    try {
      const res = await fetch('/api/game/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game_id,
          hostId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Advance failed:', data.error);
        return;
      }

      console.log('Advanced to:', data.nextPhase, 'Round:', data.nextRound);
    } catch (err) {
      console.error('Advance error:', err);
    }
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

  return (
  <div className="min-h-screen bg-gradient-to-br from-[#0c0c14] via-[#12121c] to-[#1a1a28] text-gray-200 p-8">

    {/* TOP BAR */}
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold tracking-wide text-yellow-400">
          {game.name}
        </h1>
        <div className="mt-3 space-y-2">
          <div className="flex gap-3 text-xs uppercase tracking-wider text-gray-400">
            {['lobby','role_reveal','intro_round','investigation','voting','reveal'].map((phase) => (
              <div
                key={phase}
                className={`px-2 py-1 rounded-md ${
                  game.phase === phase
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {phase.replace('_',' ')}
              </div>
            ))}
          </div>

          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-red-600 transition-all duration-700"
              style={{
                width: `${
                  (['lobby','role_reveal','intro_round','investigation','voting','reveal']
                    .indexOf(game.phase) + 1) /
                  6 * 100
                }%`
              }}
            />
          </div>

          <div className="text-xs text-gray-500">
            Round {game.current_round}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {game.phase === 'lobby' ? (
          <button onClick={startGame} className="btn-primary">
            <Play size={16} /> Start Game
          </button>
        ) : (
          <>
            <button onClick={advancePhase} className="btn-primary">
              <Play size={16} /> Next Phase
            </button>
            <button onClick={pauseGame} className="btn-secondary">
              <Pause size={16} /> Pause
            </button>
          </>
        )}
      </div>
    </div>

    {/* MAIN GRID */}
    <div className="grid grid-cols-12 gap-6">

      {/* LEFT COLUMN — PLAYER ROSTER */}
      <GlassPanel className="col-span-3 space-y-4" hover>
        <SectionHeader>Player Roster</SectionHeader>

        {players.filter(p => !p.is_host).map(p => {
          const suspicion = p.suspicion_level ?? 0
          const suspicionPercent = Math.min(suspicion, 100)
          const isHigh = suspicionPercent >= 70

          return (
            <div
              key={p.id}
              className={`glass-panel glass-panel-hover p-4 rounded-xl space-y-2 transition-all ${
                isHigh ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(255,0,0,0.4)] animate-pulse' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-[10px] text-gray-400">
                  {p.role_id ? 'Active' : 'Waiting'}
                </div>
              </div>

              {/* Suspicion Bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    suspicionPercent >= 70
                      ? 'bg-gradient-to-r from-red-500 to-red-700'
                      : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600'
                  }`}
                  style={{ width: `${suspicionPercent}%` }}
                />
              </div>

              <div className="text-[10px] text-gray-500">
                Suspicion: {suspicion}
              </div>
            </div>
          )
        })}
      </GlassPanel>

      {/* CENTER COLUMN — LIVE DISCUSSION */}
      <GlassPanel className="col-span-6 flex flex-col" hover>
        <SectionHeader>Current Discussions</SectionHeader>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {[...messages]
            .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 30)
            .map(msg => {
              const sender = players.find(p => p.id === msg.sender_id);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`border-l-4 pl-3 py-2 rounded-md ${
                    msg.is_system_message
                      ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                      : 'border-gray-600 bg-gray-900'
                  }`}
                >
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className="font-semibold text-gray-200">
                      {sender?.name || 'System'}
                    </span>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm mt-1">{msg.content}</div>
                </motion.div>
              );
            })}
        </div>
      </GlassPanel>

      {/* RIGHT COLUMN — CONTROL PANELS */}
      <div className="col-span-3 space-y-6">

        {/* STORY SNAPSHOT */}
        <GlassPanel hover>
          <SectionHeader>Story Overview</SectionHeader>
          <p className="text-sm text-gray-400">{game.story}</p>
        </GlassPanel>

        {/* AI Narrative Feed */}
        <GlassPanel hover glow severity="gold">
          <SectionHeader>AI Narrative Feed</SectionHeader>
          <div className="max-h-56 overflow-y-auto space-y-3 text-xs">
            {[...messages]
              .filter(m => m.is_system_message)
              .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 20)
              .map(m => {

                let severity: 'gold' | 'red' | 'blue' = 'gold'

                if (m.content?.toLowerCase().includes('inconsisten') ||
                    m.content?.toLowerCase().includes('contradict') ||
                    m.content?.toLowerCase().includes('suspicion')) {
                  severity = 'red'
                }

                if (m.content?.toLowerCase().includes('alliance')) {
                  severity = 'blue'
                }

                const severityStyles = {
                  gold: 'bg-yellow-500/10 border-yellow-500/40',
                  red: 'bg-red-500/10 border-red-500/40',
                  blue: 'bg-blue-500/10 border-blue-500/40'
                }

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border ${severityStyles[severity]} backdrop-blur-md transition-all duration-300`}
                  >
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span className="uppercase tracking-wider">
                        {severity === 'red' && 'Contradiction Alert'}
                        {severity === 'gold' && 'AI Injection'}
                        {severity === 'blue' && 'Alliance Event'}
                      </span>
                      <span>
                        {new Date(m.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-gray-200">
                      {m.content}
                    </div>
                  </div>
                )
              })}
          </div>
        </GlassPanel>



        

        {/* ALLIANCES OVERVIEW */}
        <GlassPanel hover>
          <SectionHeader>Alliances</SectionHeader>
          <div className="text-xs text-gray-400 space-y-3">

            {alliances.length === 0 && (
              <div>No active alliances</div>
            )}

            {alliances.map(a => {
              const memberPlayers = players.filter(p => a.members.includes(p.id));

              return (
                <div
                  key={a.id}
                  className="bg-gray-900 p-3 rounded-lg border border-purple-500/30 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="text-purple-400 font-semibold">
                      {a.name}
                    </div>
                    <div className="text-[10px] text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                      {memberPlayers.length} members
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {memberPlayers.map(m => (
                      <div
                        key={m.id}
                        className="px-2 py-1 bg-purple-800/40 rounded text-[10px]"
                      >
                        {m.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        {/* CLUES */}
        <GlassPanel hover>
          <SectionHeader>Clues</SectionHeader>
          {clues.map(c => (
            <div
              key={c.id}
              className="glass-panel glass-panel-hover p-2 rounded-lg text-xs mb-2 flex justify-between"
            >
              <span>{c.location}</span>
              {!c.revealed && (
                <button
                  onClick={() => revealClue(c.id)}
                  className="text-yellow-400 text-xs"
                >
                  Reveal
                </button>
              )}
            </div>
          ))}
        </GlassPanel>

        {/* VOTES */}
        <GlassPanel hover>
          <SectionHeader>Votes</SectionHeader>
          {votes.length === 0 && (
            <div className="text-xs text-gray-500">No votes yet</div>
          )}
          {votes.map(v => {
            const voter = players.find(p => p.id === v.voter_id);
            const accused = players.find(p => p.id === v.accused_id);
            return (
              <div key={v.id} className="text-xs mb-1">
                {voter?.name} → {accused?.name}
              </div>
            );
          })}
        </GlassPanel>

        {/* HOST CONTROLS */}
        <GlassPanel hover>
          <SectionHeader>Host Controls</SectionHeader>

          <div className="space-y-2 text-xs">
            <button
              className="w-full bg-gray-800 hover:bg-gray-700 p-2 rounded-md"
              onClick={() => supabase.from('messages').insert({
                game_id: game_id,
                sender_id: game.host_id,
                recipient_id: null,
                content: '⚠ All alibis have been revealed.',
                is_system_message: true
              })}
            >
              Force Reveal Alibis
            </button>

            <button
              className="w-full bg-gray-800 hover:bg-gray-700 p-2 rounded-md"
              onClick={() =>
                players.forEach(p =>
                  supabase
                    .from('players')
                    .update({ suspicion_level: (p.suspicion_level || 0) + 10 })
                    .eq('id', p.id)
                )
              }
            >
              Force Suspicion Spike
            </button>

            <button
              className="w-full bg-gray-800 hover:bg-gray-700 p-2 rounded-md"
              onClick={() =>
                supabase.from('games').update({ phase: 'voting' }).eq('id', game_id)
              }
            >
              Lock Voting
            </button>

            <button
              className="w-full bg-red-900 hover:bg-red-800 p-2 rounded-md"
              onClick={() =>
                supabase.from('games').update({ phase: 'reveal' }).eq('id', game_id)
              }
            >
              End Round Early
            </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  </div>
);
}