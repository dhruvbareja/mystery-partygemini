'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GameData, Player } from '@/types';

import AlliancePanel from '@/components/AlliancePanel';
import AlibiPanel from '@/components/AlibiPanel';

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

            {game.phase !== 'lobby' && playerId && (
              <div className="mt-10 space-y-8">

                {/* CHARACTER + ROUND HEADER */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* CHARACTER CARD */}
                  <div className="bg-gradient-to-br from-[#1a1a25] to-[#12121a] border border-purple-600/40 rounded-2xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-purple-400">
                      🎭 Your Character
                    </h3>

                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-[#222233] border border-purple-500/40 flex items-center justify-center text-3xl">
                        {currentPlayer?.avatar || '🎭'}
                      </div>

                      <div>
                        <p className="text-xl font-semibold">{currentPlayer?.name}</p>
                        <p className="text-sm text-gray-400">
                          Round {game.current_round || 1}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-300 space-y-2">
                      <p>
                        <span className="text-purple-300 font-medium">
                          Public Bio:
                        </span>
                        <br />
                        Your public persona will be revealed here.
                      </p>

                      <details className="mt-3 bg-purple-900/20 border border-purple-600/30 rounded-lg p-3">
                        <summary className="cursor-pointer text-purple-300 font-semibold text-sm">
                          🔒 Hidden Secrets
                        </summary>
                        <p className="text-xs mt-2 text-gray-300">
                          Your secret motives and truths appear here.
                        </p>
                      </details>

                      <div className="mt-3">
                        <p className="text-purple-300 font-medium text-sm">
                          🤝 Relationship Hints
                        </p>
                        <p className="text-xs text-gray-400">
                          Suspicious ties and hidden tensions will surface here.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ALLIANCES */}
                  <AlliancePanel
                    alliances={[]}
                    players={players}
                    currentPlayer={currentPlayer}
                    currentRound={game.current_round || 1}
                  />

                  {/* ALIBI DECLARATION */}
                  <div className="bg-gradient-to-br from-[#1a1a25] to-[#12121a] border border-blue-600/40 rounded-2xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-blue-400">
                      🕰 Declare Your Alibi
                    </h3>

                    <textarea
                      placeholder="Where were you during the murder?"
                      className="w-full bg-[#1f1f2e] border border-blue-600/30 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-xl py-2 text-sm font-semibold">
                      Submit Alibi
                    </button>
                  </div>
                </div>

                {/* VOTING PANEL */}
                {game.phase === 'voting' && (
                  <div className="bg-gradient-to-br from-[#1a1a25] to-[#12121a] border border-red-600/40 rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-lg font-bold text-red-400 mb-4">
                      🗳 Cast Your Vote
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {players
                        .filter(p => !p.is_host)
                        .map(p => (
                          <button
                            key={p.id}
                            className="bg-[#1f1f2e] border border-red-600/30 hover:bg-red-900/20 rounded-xl p-4 text-left transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {p.avatar || '🎭'}
                              </div>
                              <div>
                                <p className="font-semibold">{p.name}</p>
                                <p className="text-xs text-gray-400">
                                  Vote to accuse
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
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
