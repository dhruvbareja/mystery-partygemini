'use client';

import { motion } from 'framer-motion';

interface Alliance {
  id: string;
  name?: string;
  members: string[];
  trust_level?: number;
  round_created?: number;
  is_public?: boolean;
}

interface Props {
  alliances: Alliance[];
  players: any[];
  currentPlayer: any;
  currentRound: number;
  onCreateAlliance?: () => void;
  onJoinAlliance?: (allianceId: string) => void;
}

export default function AlliancePanel({
  alliances = [],
  players = [],
  currentPlayer,
  currentRound,
  onCreateAlliance,
  onJoinAlliance
}: Props) {

  const getPlayer = (id: string) =>
    players.find(p => p.id === id);

  const getPlayerName = (id: string) =>
    getPlayer(id)?.name || 'Unknown';

  return (
    <div className="bg-gradient-to-br from-[#1f1f2e] to-[#2a2a3d] border border-gray-700 rounded-2xl p-6 shadow-xl space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-purple-400 tracking-wide">
          🤝 Alliance Network
        </h3>

        {onCreateAlliance && (
          <button
            onClick={onCreateAlliance}
            className="text-xs bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded-lg transition"
          >
            ➕ Propose
          </button>
        )}
      </div>

      {alliances.length === 0 && (
        <p className="text-sm text-gray-500">
          No alliances formed yet.
        </p>
      )}

      {/* Alliance Visual Blocks */}
      <div className="space-y-6">
        {alliances.map((alliance) => {
          const isMember = alliance.members.includes(currentPlayer?.id);

          return (
            <motion.div
              key={alliance.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`relative p-5 rounded-2xl border ${
                isMember
                  ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                  : 'bg-gray-800 border-gray-700'
              }`}
            >

              {/* Alliance Name */}
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-semibold text-purple-300">
                  {alliance.name || `Alliance #${alliance.id.slice(0,4)}`}
                </div>
                <div className="text-[9px] px-2 py-[2px] rounded-full border border-purple-500/40 text-purple-300 bg-purple-900/20">
                  {alliance.is_public ? 'Public' : 'Private'}
                </div>
              </div>

              {/* Member Connection Layout */}
              <div className="flex items-center justify-center gap-6 relative">

                {alliance.members.map((memberId, index) => {
                  const player = getPlayer(memberId);

                  return (
                    <div key={memberId} className="flex items-center relative">

                      {/* Player Node */}
                      <motion.div
                        whileHover={{ scale: 1.08 }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center text-lg border border-purple-400 shadow-md">
                          {player?.avatar || '🎭'}
                        </div>
                        <div className="text-[10px] mt-1 text-gray-300">
                          {getPlayerName(memberId)}
                        </div>
                      </motion.div>

                      {/* Animated Link */}
                      {index < alliance.members.length - 1 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: 40 }}
                          transition={{ duration: 0.5 }}
                          className="h-[2px] bg-gradient-to-r from-purple-400 to-pink-500 mx-2"
                        />
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Round Info */}
              {alliance.round_created && (
                <div className="text-[10px] text-gray-500 mt-3 text-center">
                  Formed in Round {alliance.round_created}
                </div>
              )}

              {/* Trust Meter */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>Trust Level</span>
                  <span>{alliance.trust_level || 50}%</span>
                </div>

                <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${alliance.trust_level || 50}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
              </div>

              {/* Join Button */}
              {!isMember && onJoinAlliance && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => onJoinAlliance(alliance.id)}
                    className="text-xs bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded-lg transition"
                  >
                    Join Alliance
                  </button>
                </div>
              )}

              {/* Membership Tag */}
              {isMember && (
                <div className="text-xs text-purple-300 mt-3 text-center bg-purple-900/30 border border-purple-500/40 rounded-lg py-1">
                  🔒 You are part of this alliance
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}