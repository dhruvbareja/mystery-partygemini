'use client';

import { Player } from '@/types';

export default function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="bg-gray-900 p-3 rounded flex justify-between">
      <div>
        <div className="font-bold">{player.name}</div>
        <div className="text-xs text-gray-400">
          Suspicion: {player.suspicion_level}
        </div>
      </div>

      <div>
        {player.is_alive ? "🟢 Alive" : "💀 Dead"}
      </div>
    </div>
  );
}