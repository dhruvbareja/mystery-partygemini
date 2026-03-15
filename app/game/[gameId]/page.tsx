'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GameData, Player } from '@/types';

import AlliancePanel from '@/components/AlliancePanel';
import AlibiPanel from '@/components/AlibiPanel';
import GlassPanel from '@/components/GlassPanel';

export default function GameLobby() {
  const params = useParams();
  const router = useRouter();
  const game_id = String(params?.gameId || '');

  const [game, setGame] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [showSecrets, setShowSecrets] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [newAllianceName, setNewAllianceName] = useState('');
  const [alibiText, setAlibiText] = useState('');
  const [submittingAlibi, setSubmittingAlibi] = useState(false);
  const [alliances, setAlliances] = useState<any[]>([]);
  const [aiEvents, setAiEvents] = useState<any[]>([]);

  useEffect(() => {
    console.log('LOBBY STATE', {
      loading,
      game,
      players,
      playerId,
    });
  }, [loading, game, players, playerId]);

  useEffect(() => {
    if (!game_id) return;

    loadGameData();
  }, [game_id]);

  useEffect(() => {
    if (!game_id) return;
    const savedPlayerId = localStorage.getItem(`player_${game_id}`);
    if (savedPlayerId) {
      setPlayerId(savedPlayerId);
    }
  }, [game_id]);

  useEffect(() => {
    if (!game) return;
    if (!playerId) return;

    // Only redirect when phase actually moves past lobby
    if (game.phase && game.phase !== 'lobby') {
      router.replace(`/player/${game_id}`);
    }
  }, [game?.phase, playerId]);

  const loadGameData = async () => {
    setError('');
    try {
      if (!game_id) {
        setError('Invalid game id');
        return;
      }

      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', game_id)
        .maybeSingle();

      if (gameError || !gameData) {
        console.error('Game fetch failed', gameError);
        setError('Game not found');
        return;
      }

      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', game_id);

      if (playersError) {
        console.warn('Players fetch failed (non-fatal)', playersError);
      }

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

      // Fetch AI/system events from logs + system messages
      const { data: logs } = await supabase
        .from('game_logs')
        .select('*')
        .eq('game_id', game_id)
        .order('created_at', { ascending: false });

      const { data: systemMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('game_id', game_id)
        .eq('is_system_message', true)
        .order('created_at', { ascending: false });

      const combinedEvents = [
        ...(logs || []),
        ...(systemMessages || [])
      ].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAiEvents(combinedEvents);

      setGame(gameData);
      setPlayers(playersData ?? []);
      // Only turn off loading on first load to prevent realtime spinner loops
      if (loading) {
        setLoading(false);
      }
      // If game already started and player exists, auto-redirect
      if (gameData?.phase && gameData.phase !== 'lobby') {
        const savedPlayerId = localStorage.getItem(`player_${game_id}`);
        if (savedPlayerId) {
          router.replace(`/player/${game_id}`);
        }
      }
    } catch (err) {
      console.error('Fatal load error', err);
      setError('Failed to load game');
    }
  };

  // REALTIME UPDATES (players + game state)
  useEffect(() => {
    if (!game_id) return;

    const channel = supabase
      .channel(`lobby-${game_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${game_id}`,
        },
        () => {
          loadGameData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${game_id}`,
        },
        () => {
          loadGameData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game_id]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setJoining(true);

    if (!game_id) {
      setError('Invalid game ID');
      setJoining(false);
      return;
    }

    try {
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game_id,
          playerName: playerName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join game');
      }

      const { playerId: newPlayerId } = await response.json();
      localStorage.setItem(`player_${game_id}`, newPlayerId);
      setPlayerId(newPlayerId);
      setJoining(false);
    } catch (err: any) {
      setError(err.message);
      setJoining(false);
    }
  };

  const toggleReady = async () => {
    if (!playerId) return;

    const player = players.find(p => p.id === playerId);
    await supabase
      .from('players')
      .update({ is_ready: !player?.is_ready })
      .eq('id', playerId);
    await loadGameData();
  };

  const handleSubmitAlibi = async () => {
    if (!playerId || !alibiText.trim()) return;

    try {
      setSubmittingAlibi(true);

      const response = await fetch('/api/game/alibi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game_id,
          playerId,
          alibi: alibiText.trim(),
          round: game?.current_round || 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit alibi');
      }

      setAlibiText('');
    } catch (err: any) {
      console.error('Alibi submit error', err);
      setError(err.message);
    } finally {
      setSubmittingAlibi(false);
    }
  };

  const handleCreateAlliance = async () => {
    if (!playerId || !newAllianceName.trim()) return;

    try {
      const res = await fetch('/api/game/alliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create',
          gameId: game_id,
          playerId,
          name: newAllianceName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Alliance creation failed');
        return;
      }

      setNewAllianceName('');
      await loadGameData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinAlliance = async (allianceId: string) => {
    if (!playerId) return;

    try {
      const res = await fetch('/api/game/alliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'join',
          gameId: game_id,
          allianceId,
          playerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Join failed');
        return;
      }

      await loadGameData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mystery-card text-center max-w-md"
        >
          <h2 className="font-display text-3xl font-bold mb-4 text-blood">Game Not Found</h2>
          <p className="text-parchment/70 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!game) return null;

  const nonHostPlayers = players.filter(p => !p.is_host);
  const currentPlayer = players.find(p => p.id === playerId);
  const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.is_ready);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f16] via-[#151521] to-[#1c1c2b] text-gray-200 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-3 tracking-wide text-gold drop-shadow-lg">
            {game.name}
          </h1>
          <p className="text-lg text-gray-400 mb-3">Game Code</p>
          <div className="inline-flex items-center gap-3 bg-[#1f1f2e] border border-gold/30 px-6 py-3 rounded-xl shadow-lg">
            <span className="text-2xl font-bold tracking-widest text-gold">
              {game_id}
            </span>
            <Clock size={18} className="text-gray-400" />
          </div>

          <div className="mt-5 inline-block bg-yellow-900/20 border border-yellow-600/40 px-4 py-2 rounded-lg text-sm text-yellow-400">
            Waiting for players to gather in the mansion...
          </div>
        </div>

        {!playerId ? (
          // Join Form
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1f1f2e] border border-gray-700 rounded-2xl p-8 max-w-md mx-auto shadow-2xl"
          >
            <h2 className="font-display text-3xl font-semibold mb-6 text-center">Join the Mystery</h2>
            
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-parchment/80 mb-2">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="input-mystery"
                  maxLength={20}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-blood/20 border border-blood/50 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={joining || !playerName.trim()}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {joining ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader className="animate-spin" size={20} />
                    Joining...
                  </span>
                ) : (
                  'Join Game'
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          // Lobby View
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#1f1f2e] border border-gray-700 rounded-2xl p-6 mb-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                  <Users size={24} />
                  Players ({nonHostPlayers.length})
                </h2>
                
                {currentPlayer && (
                  <button
                    onClick={toggleReady}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      currentPlayer.is_ready
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-parchment/20 hover:bg-parchment/30'
                    }`}
                  >
                    {currentPlayer.is_ready ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle size={18} />
                        Ready!
                      </span>
                    ) : (
                      'Ready Up'
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nonHostPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      player.is_ready
                        ? 'bg-green-900/20 border-green-600/50'
                        : 'bg-ink/30 border-gold/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{player.avatar}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{player.name}</p>

                        <p className="text-sm text-parchment/60">
                          {player.is_ready ? (
                            <span className="text-green-400">✓ Ready</span>
                          ) : (
                            'Not ready'
                          )}
                        </p>

                        {/* Public Alibi Display */}
                        {(player as any).alibi && (
                          <div className="mt-2 bg-blue-900/20 border border-blue-500/30 rounded-lg p-2 text-xs text-blue-300">
                            🕰 <span className="font-semibold">Alibi:</span> {(player as any).alibi}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-[#1f1f2e] border border-gray-700 rounded-2xl p-6 text-center shadow-xl"
            >
              <h3 className="font-display text-2xl font-semibold mb-3">About This Mystery</h3>
              <p className="text-parchment/70 mb-4">{game.theme}</p>
              <div className="inline-block bg-ink/40 px-6 py-3 rounded-lg">
                <p className="text-sm text-parchment/60 mb-1">Waiting for host to start...</p>
                {allReady && (
                  <p className="text-green-400 font-semibold">All players ready!</p>
                )}
              </div>
            </motion.div>

            {/* AI SURVEILLANCE FEED */}
            <GlassPanel title="🧠 AI Surveillance Feed" glow>
              <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
                {aiEvents.length === 0 && (
                  <div className="text-gray-500 text-sm">
                    No AI activity yet...
                  </div>
                )}

                {aiEvents.map((event: any, index: number) => (
                  <div
                    key={event.id || index}
                    className="bg-black/30 border border-gold/20 rounded-lg p-3 text-xs space-y-1"
                  >
                    <div className="text-gold text-[10px] uppercase tracking-wide">
                      {event.type || (event.is_system_message ? 'system_event' : 'log')}
                    </div>

                    <div className="text-gray-300 break-words">
                      {event.content || event.details}
                    </div>

                    <div className="text-[10px] text-gray-500">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {game.phase !== 'lobby' && playerId && (
              <div className="mt-10 space-y-8">

                {/* TOP GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* CHARACTER CARD */}
                  <div className="bg-gradient-to-br from-[#1b1b2a] to-[#12121a] border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-5 relative">

                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-purple-400">
                        🎭 Character Profile
                      </h3>

                      <button
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="text-xs bg-purple-900/30 border border-purple-500/40 px-3 py-1 rounded-lg hover:bg-purple-900/50 transition"
                      >
                        {showSecrets ? 'Hide Secrets' : 'Reveal Secrets'}
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-[#222233] border border-purple-500/40 flex items-center justify-center text-3xl shadow-lg">
                        {currentPlayer?.avatar || '🎭'}
                      </div>

                      <div>
                        <p className="text-xl font-semibold">
                          {currentPlayer?.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          Round {game.current_round || 1}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-300 space-y-3">
                      <div>
                        <p className="text-purple-300 font-medium text-sm">
                          Public Persona
                        </p>
                        <p className="text-gray-400 text-xs">
                          Your visible background and personality.
                        </p>
                      </div>

                      {showSecrets && (
                        <div className="bg-purple-900/20 border border-purple-600/40 rounded-xl p-3 animate-pulse">
                          <p className="text-xs text-purple-300 font-semibold">
                            🔒 Hidden Secrets
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
                            Your true motives and private truths appear here.
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-purple-300 font-medium text-sm">
                          🤝 Relationship Hints
                        </p>
                        <p className="text-xs text-gray-400">
                          Suspicious ties and hidden tensions will appear here.
                        </p>
                      </div>
                    </div>
                  </div>

                <div className="mb-4 flex gap-2">
                  <input
                    value={newAllianceName}
                    onChange={(e) => setNewAllianceName(e.target.value)}
                    placeholder="Create alliance name..."
                    className="flex-1 bg-[#1f1f2e] border border-purple-500/30 rounded-xl px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleCreateAlliance}
                    className="bg-purple-600 hover:bg-purple-500 transition px-4 rounded-xl text-sm"
                  >
                    Create
                  </button>
                </div>
                <AlliancePanel
                  alliances={alliances}
                  players={players}
                  currentPlayer={currentPlayer}
                  currentRound={game.current_round || 1}
                  onCreateAlliance={handleCreateAlliance}
                  onJoinAlliance={handleJoinAlliance}
                />

                  {/* ALIBI PANEL */}
                  <div className="bg-gradient-to-br from-[#1b1b2a] to-[#12121a] border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-blue-400">
                      🕰 Declare Your Alibi
                    </h3>

                    <textarea
                      value={alibiText}
                      onChange={(e) => setAlibiText(e.target.value)}
                      placeholder="Where were you during the murder?"
                      className="w-full bg-[#1f1f2e] border border-blue-500/30 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      onClick={handleSubmitAlibi}
                      disabled={submittingAlibi || !alibiText.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-xl py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {submittingAlibi ? 'Submitting...' : 'Submit Alibi'}
                    </button>
                  </div>
                </div>

                {/* VOTING MODAL TRIGGER */}
                {game.phase === 'voting' && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowVoteModal(true)}
                      className="bg-red-600 hover:bg-red-500 transition px-6 py-3 rounded-xl font-semibold shadow-lg"
                    >
                      🗳 Open Voting Panel
                    </button>
                  </div>
                )}

                {/* VOTING MODAL */}
                {showVoteModal && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-[#161622] border border-red-600/40 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5">

                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-red-400">
                          Cast Your Vote
                        </h3>
                        <button
                          onClick={() => setShowVoteModal(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {players
                          .filter(p => !p.is_host && p.id !== playerId)
                          .map(p => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedVote(p.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                                selectedVote === p.id
                                  ? 'bg-red-900/30 border-red-500'
                                  : 'bg-[#1f1f2e] border-red-500/30 hover:bg-red-900/20'
                              }`}
                            >
                              <span className="text-2xl">
                                {p.avatar || '🎭'}
                              </span>
                              <span className="font-semibold">{p.name}</span>
                            </button>
                          ))}
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedVote || !playerId) return;

                          try {
                            const res = await fetch('/api/game/vote', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                gameId: game_id,
                                voterId: playerId,
                                accusedId: selectedVote,
                                round: game.current_round || 1,
                              }),
                            });

                            const data = await res.json();

                            if (!res.ok) {
                              alert(data.error || 'Vote failed');
                              return;
                            }

                            // Close modal and refresh state
                            setShowVoteModal(false);
                            setSelectedVote(null);
                            await loadGameData();
                          } catch (err) {
                            console.error('Vote error:', err);
                            alert('Vote submission failed');
                          }
                        }}
                        disabled={!selectedVote}
                        className="w-full bg-red-600 hover:bg-red-500 transition rounded-xl py-2 font-semibold disabled:opacity-50"
                      >
                        Confirm Vote
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {playerId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 text-parchment/50 text-sm"
          >
            <p>Share this code with your friends: <span className="font-bold text-gold">{game_id}</span></p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
