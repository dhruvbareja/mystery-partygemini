'use client';

import { GameData, Player } from '@/types';
import type { Vote } from '@/types';

interface Props {
  game: GameData;
  player: Player;
  players: Player[];
  votes: Vote[];
  accusedPlayer: string;
  setAccusedPlayer: (v: string) => void;
  submitAccusation: () => void;
}

export default function VotePanel({
  game,
  player,
  players,
  votes,
  accusedPlayer,
  setAccusedPlayer,
  submitAccusation
}: Props) {

  return (
    <div className="bg-red-900 p-4 rounded space-y-3">

      <h3 className="font-bold">🗳 Cast Your Vote</h3>

      <select
        value={accusedPlayer}
        onChange={e => setAccusedPlayer(e.target.value)}
        className="bg-gray-800 p-2 rounded w-full"
      >
        <option value="">Select player</option>
        {players
          .filter(p => !p.is_host && p.id !== player.id)
          .map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </select>

      <button
        onClick={submitAccusation}
        className="bg-red-600 px-4 py-2 rounded w-full"
      >
        Submit Vote
      </button>

      <div className="text-sm mt-3">
        {votes
          .filter(v => v.round === game.current_round)
          .map(v => {
            const accused = players.find(p => p.id === v.accused_id);
            return (
              <div key={v.id}>
                🔴 Vote against {accused?.name}
              </div>
            );
          })}
      </div>
    </div>
  );
}