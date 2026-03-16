'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Globe, User, ShieldAlert, Paperclip, Search, X } from 'lucide-react';
import { Message, Player, Clue } from '@/types';

interface ChatPanelProps {
  messages: Message[];
  players: Player[];
  currentPlayer: Player;
  clues: Clue[];
  gamePhase: string;
  onSendMessage: (content: string, recipientId: string | null) => Promise<void>;
}

export default function ChatPanel({
  messages,
  players,
  currentPlayer,
  clues,
  gamePhase,
  onSendMessage
}: ChatPanelProps) {
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'global' | 'whispers'>('global');
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showEvidenceMenu, setShowEvidenceMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab, selectedDM]);

  // Filter messages based on active tab
  const displayMessages = activeTab === 'whispers' && selectedDM
    ? messages.filter(m => 
        (m.sender_id === currentPlayer.id && m.recipient_id === selectedDM) || 
        (m.sender_id === selectedDM && m.recipient_id === currentPlayer.id)
      )
    : messages.filter(m => m.recipient_id === null);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    const targetRecipient = activeTab === 'whispers' ? selectedDM : null;
    
    await onSendMessage(messageInput.trim(), targetRecipient);
    
    setMessageInput('');
    setIsSending(false);
  };

  const shareEvidence = async (clue: Clue) => {
    setShowEvidenceMenu(false);
    setIsSending(true);
    const targetRecipient = activeTab === 'whispers' ? selectedDM : null;
    
    const evidenceMessage = `🚨 EVIDENCE SHARED [${clue.location.toUpperCase()}]:\n"${clue.text}"`;
    await onSendMessage(evidenceMessage, targetRecipient);
    
    setIsSending(false);
  };

  const chatDisabled = gamePhase === 'voting' || gamePhase === 'reveal' || (activeTab === 'whispers' && !selectedDM);

  return (
    <div className="bg-[#111118] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
      
      {/* HEADER & TABS */}
      <div className="bg-black/40 border-b border-white/10 p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="text-indigo-400" size={18} />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Secure Comms Link</h2>
        </div>

        <div className="flex gap-2 bg-black/50 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'global' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Globe size={14} /> Global
          </button>
          <button
            onClick={() => setActiveTab('whispers')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'whispers' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <User size={14} /> Whispers
          </button>
        </div>
      </div>

      {/* WHISPER SELECTOR */}
      {activeTab === 'whispers' && (
        <div className="bg-black/30 border-b border-white/5 p-3 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2">
          {players.filter(p => !p.is_host && p.id !== currentPlayer.id).map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedDM(p.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDM === p.id 
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]' 
                  : 'bg-[#1f1f2e] text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-[10px]">
                {p.avatar || '👤'}
              </div>
              {p.name}
            </button>
          ))}
          {players.filter(p => !p.is_host).length <= 1 && (
             <span className="text-xs text-gray-500 italic p-2">No other operatives available.</span>
          )}
        </div>
      )}

      {/* MESSAGE FEED */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {displayMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 space-y-2">
            <Globe size={40} />
            <p className="text-xs font-bold uppercase tracking-widest">Comm Channel Empty</p>
          </div>
        ) : (
          displayMessages.map(msg => {
            const isOwn = msg.sender_id === currentPlayer.id;
            const isSystem = msg.is_system_message;
            const sender = players.find(p => p.id === msg.sender_id);
            const isEvidence = msg.content.includes('🚨 EVIDENCE SHARED');

            if (isSystem) {
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className="text-center my-4">
                  <span className="inline-block bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full whitespace-pre-wrap shadow-inner">
                    ⚡ {msg.content}
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, transformOrigin: isOwn ? 'right' : 'left' }} 
                animate={{ opacity: 1, scale: 1 }} 
                key={msg.id} 
                className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name */}
                  {!isOwn && (
                    <span className="text-[10px] text-gray-500 font-bold ml-1 mb-1 tracking-wider uppercase">
                      {sender?.name || 'Unknown'}
                    </span>
                  )}
                  
                  {/* Bubble */}
                  <div className={`p-4 rounded-2xl ${
                    isEvidence
                      ? 'bg-yellow-950/40 border border-yellow-500/50 text-yellow-200' 
                      : isOwn 
                      ? 'bg-indigo-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(79,70,229,0.3)]' 
                      : 'bg-[#1f1f2e] text-gray-200 rounded-bl-sm border border-white/5'
                  }`}>
                    <p className={`text-sm whitespace-pre-wrap ${isEvidence ? 'font-mono' : ''}`}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="bg-black/50 p-3 border-t border-white/5 relative">
        
        {/* Evidence Popover */}
        <AnimatePresence>
          {showEvidenceMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-[100%] left-4 right-4 mb-2 bg-[#1f1f2e] border border-white/10 rounded-2xl shadow-2xl p-4 z-20 max-h-[250px] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Search size={14}/> Share Discovered Evidence
                </h3>
                <button onClick={() => setShowEvidenceMenu(false)} className="text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              
              {clues.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-2 text-center">No evidence has been revealed to you yet.</p>
              ) : (
                <div className="space-y-2">
                  {clues.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => shareEvidence(c)}
                      className="w-full text-left bg-black/40 hover:bg-indigo-900/40 border border-white/5 hover:border-indigo-500/50 p-3 rounded-xl transition-all group"
                    >
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">📍 {c.location}</p>
                      <p className="text-xs text-gray-300 line-clamp-2 group-hover:text-white">{c.text}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {chatDisabled && (
           <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm flex items-center justify-center">
             <p className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
               <Lock size={14} /> 
               {gamePhase === 'voting' || gamePhase === 'reveal' ? 'Comms Locked' : 'Select an Operative'}
             </p>
           </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 relative z-0">
          <button
            type="button"
            onClick={() => setShowEvidenceMenu(!showEvidenceMenu)}
            disabled={chatDisabled}
            className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
              showEvidenceMenu 
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' 
                : 'bg-[#1f1f2e] border-white/10 text-gray-400 hover:text-white hover:border-white/30'
            }`}
            title="Share Evidence"
          >
            <Paperclip size={18} />
          </button>
          
          <input
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            placeholder={activeTab === 'global' ? "Transmit to everyone..." : "Whisper secretly..."}
            disabled={chatDisabled || isSending}
            className="flex-1 bg-[#1f1f2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
          />
          
          <button 
            type="submit"
            disabled={chatDisabled || isSending || !messageInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center"
          >
            <Send size={18} className={isSending ? 'animate-pulse' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
}