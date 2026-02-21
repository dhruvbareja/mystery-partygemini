'use client';

interface Alliance {
  id: string;
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
}

export default function AlliancePanel({
  alliances = [],
  players = [],
  currentPlayer,
  currentRound,
  onCreateAlliance
}: Props) {

  const getPlayerName = (id: string) =>
    players.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="bg-gradient-to-br from-[#1f1f2e] to-[#2a2a3d] border border-gray-700 rounded-2xl p-6 shadow-xl space-y-5">

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-purple-400">
          🤝 Alliances
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

      {alliances.map(alliance => {
        const isMember = alliance.members.includes(currentPlayer?.id);

        return (
          <div
            key={alliance.id}
            className={`p-4 rounded-xl border ${
              isMember
                ? 'bg-green-900/20 border-green-600/40'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="text-sm font-medium mb-2">
              {alliance.members.map(getPlayerName).join(' + ')}
            </div>

            {alliance.round_created && (
              <div className="text-[10px] text-gray-500 mb-2">
                Created in Round {alliance.round_created}
              </div>
            )}

            {/* Trust Meter */}
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                style={{
                  width: `${alliance.trust_level || 50}%`
                }}
              />
            </div>

            {isMember && (
              <div className="text-xs text-green-400 mt-2">
                You are part of this alliance
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}