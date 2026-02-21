'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="bg-[#141420] border border-gray-700 rounded-2xl p-4 shadow-2xl flex flex-col h-[650px]">

      {/* CHANNEL HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold tracking-wide text-purple-400">
          {selectedDM ? "🤝 Alliance Channel" : "🌐 Global Channel"}
        </div>

        {selectedDM && (
          <span className="text-xs text-green-400">
            Private DM
          </span>
        )}
      </div>

      {/* DM Selector */}
      <div className="flex gap-2 flex-wrap text-xs mb-3">
        <button
          onClick={() => setSelectedDM(null)}
          className={`px-3 py-1 rounded-full border transition ${
            !selectedDM
              ? 'bg-purple-700 border-purple-500 text-white'
              : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🌐 Global
        </button>

        {players
          .filter(p => p.id !== player.id && !p.is_host)
          .map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedDM(p.id)}
              className={`px-3 py-1 rounded-full border transition ${
                selectedDM === p.id
                  ? 'bg-green-700 border-green-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              🤝 {p.name}
            </button>
          ))}
      </div>

      {/* Intro Prompt */}
      {phase === 'intro_round' && !selectedDM && (
        <div className="bg-yellow-900/30 border border-yellow-600/40 p-3 rounded-lg text-sm text-yellow-300 mb-3 animate-pulse">
          ✍️ Introduce your character. Where were you during the murder?
        </div>
      )}

      {/* MESSAGE AREA */}
      <div className="flex-1 overflow-y-auto space-y-4 bg-[#101019] p-4 rounded-xl border border-gray-800">
        <AnimatePresence>
          {displayMessages.map(msg => {
            const sender = players.find(p => p.id === msg.sender_id);
            const isOwn = msg.sender_id === player.id;
            const isSystem = msg.is_system_message;

            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center text-yellow-400 text-xs tracking-wide bg-yellow-900/20 border border-yellow-600/30 rounded-lg py-2 shadow-[0_0_10px_rgba(255,215,0,0.3)]"
                >
                  ⚡ {msg.content}
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-sm">
                    {sender?.avatar || '🎭'}
                  </div>
                )}

                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow-lg ${
                    isOwn
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-none'
                      : selectedDM
                      ? 'bg-gradient-to-br from-green-700 to-green-600 text-white rounded-bl-none'
                      : 'bg-gray-700 text-gray-200 rounded-bl-none'
                  }`}
                >
                  {!isOwn && (
                    <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">
                      {sender?.name}
                    </div>
                  )}

                  <div>{msg.content}</div>

                  {selectedDM && (
                    <div className="text-[9px] mt-1 opacity-60">
                      Alliance DM
                    </div>
                  )}
                </div>

                {isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-sm">
                    {player.avatar || '🎭'}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* INPUT */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-4">
        <input
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          placeholder={
            selectedDM
              ? "Send alliance message..."
              : "Type your message..."
          }
        />
        <button className="bg-purple-600 hover:bg-purple-500 transition px-4 rounded-xl text-sm font-medium">
          Send
        </button>
      </form>
    </div>
  );
}