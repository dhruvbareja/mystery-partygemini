'use client';

interface Props {
  players: any[];
  currentPlayer: any;
  currentRound: number;
  onEditAlibi?: () => void;
}

export default function AlibiPanel({
  players = [],
  currentPlayer,
  currentRound,
  onEditAlibi
}: Props) {

  const nonHostPlayers = players.filter(p => !p.is_host);

  return (
    <div className="bg-gradient-to-br from-[#1f1f2e] to-[#2a2a3d] border border-gray-700 rounded-2xl p-6 shadow-xl space-y-5">

      <h3 className="text-lg font-bold text-yellow-400">
        🕵️ Alibis
      </h3>

      {nonHostPlayers.length === 0 && (
        <p className="text-sm text-gray-500">
          No alibis declared yet.
        </p>
      )}

      {nonHostPlayers.map(p => (
        <div
          key={p.id}
          className={`p-4 rounded-xl border ${
            p.id === currentPlayer?.id
              ? 'bg-blue-900/20 border-blue-600/40'
              : 'bg-gray-800 border-gray-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">
              {p.name}
            </span>

            {p.id === currentPlayer?.id && onEditAlibi && (
              <button
                onClick={onEditAlibi}
                className="text-xs bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded-lg transition"
              >
                Edit
              </button>
            )}
          </div>

          <div className="text-xs text-gray-400 mb-1">
            {p.claimed_alibi || 'No alibi declared.'}
          </div>

          <div className="text-[10px] text-gray-500">
            Round {currentRound}
          </div>
        </div>
      ))}
    </div>
  );
}