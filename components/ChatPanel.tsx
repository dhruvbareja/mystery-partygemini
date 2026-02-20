'use client';

import { Player, Message, GameData } from '@/types';

interface Props {
  game: GameData;
  player: Player;
  players: Player[];
  messages: Message[];
  selectedDM: string | null;
  setSelectedDM: (id: string | null) => void;
  messageInput: string;
  setMessageInput: (v: string) => void;
  sendMessage: (e: React.FormEvent) => void;
  phase: string;
}

export default function ChatPanel({
  game,
  player,
  players,
  messages,
  selectedDM,
  setSelectedDM,
  messageInput,
  setMessageInput,
  sendMessage,
  phase
}: Props) {

  const displayMessages = selectedDM
    ? messages.filter(
        m =>
          (m.sender_id === player.id && m.recipient_id === selectedDM) ||
          (m.sender_id === selectedDM && m.recipient_id === player.id)
      )
    : messages.filter(m => m.recipient_id === null);

  return (
    <div className="space-y-4">

      {/* DM Selector */}
      <div className="flex gap-2 flex-wrap text-sm">
        <button
          onClick={() => setSelectedDM(null)}
          className={!selectedDM ? "font-bold underline" : ""}
        >
          🌐 Global
        </button>

        {players
          .filter(p => p.id !== player.id && !p.is_host)
          .map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedDM(p.id)}
              className={selectedDM === p.id ? "font-bold underline" : ""}
            >
              🤝 {p.name}
            </button>
          ))}
      </div>

      {/* Intro prompt */}
      {phase === 'intro_round' && !selectedDM && (
        <div className="bg-yellow-900 p-3 rounded text-sm">
          ✍️ Introduce your character. Where were you during the murder?
        </div>
      )}

      {/* Messages */}
      <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-900 p-3 rounded">
        {displayMessages.map(msg => {
          const sender = players.find(p => p.id === msg.sender_id);
          const isOwn = msg.sender_id === player.id;
          const isSystem = msg.is_system_message;

          if (isSystem)
            return (
              <div key={msg.id} className="text-yellow-400 text-sm">
                ⚡ {msg.content}
              </div>
            );

          return (
            <div
              key={msg.id}
              className={`p-2 rounded max-w-xs ${
                isOwn
                  ? "bg-blue-700 ml-auto text-right"
                  : "bg-gray-700"
              }`}
            >
              <div className="text-xs text-gray-300">
                {isOwn ? "You" : sender?.name}
              </div>
              <div>{msg.content}</div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800"
          placeholder={
            selectedDM
              ? "Alliance message..."
              : "Type your message..."
          }
        />
        <button className="bg-purple-600 px-4 rounded">
          Send
        </button>
      </form>
    </div>
  );
}