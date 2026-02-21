'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function RoleCard({ role, player }: any) {
  const [showSecrets, setShowSecrets] = useState(false);

  if (!role) return null;

  return (
    <div className="bg-gradient-to-br from-[#1f1f2e] to-[#2a2a3d] border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
          {player?.avatar || '🎭'}
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-gold">
            {role.name}
          </h2>
          <p className="text-sm text-gray-400">{role.role}</p>
        </div>
      </div>

      {/* Suspicion Meter */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Suspicion Level</span>
          <span>{player?.suspicion_level || 0}/100</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-red-600"
            style={{ width: `${player?.suspicion_level || 0}%` }}
          />
        </div>
      </div>

      {/* Public Bio */}
      <div>
        <h3 className="font-semibold text-gray-300 mb-1">🧍 Public Bio</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {role.personality || 'No public details available.'}
        </p>
      </div>

      {/* Motive */}
      <div>
        <h3 className="font-semibold text-gray-300 mb-1">💔 Motive</h3>
        <p className="text-sm text-gray-400">
          {role.motive || 'Unknown'}
        </p>
      </div>

      {/* Relationship Hints Placeholder */}
      <div>
        <h3 className="font-semibold text-gray-300 mb-1">🔗 Relationship Hints</h3>
        <p className="text-sm text-gray-500 italic">
          Alliances and rivalries will appear here as the game unfolds.
        </p>
      </div>

      {/* Hidden Secrets Toggle */}
      {role.secrets?.length > 0 && (
        <div>
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition"
          >
            {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
            {showSecrets ? 'Hide Secrets' : 'Reveal Hidden Secrets'}
          </button>

          {showSecrets && (
            <div className="mt-3 bg-red-900/20 border border-red-700/40 p-3 rounded-lg space-y-2">
              {role.secrets.map((s: string, i: number) => (
                <div key={i} className="text-sm text-red-300">
                  🔒 {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}