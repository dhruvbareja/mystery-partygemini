'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Wand2, 
  Users, 
  MapPin, 
  Settings2, 
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function CreateGame() {
  const router = useRouter();

  const [gameName, setGameName] = useState('');
  const [theme, setTheme] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  
  const [players, setPlayers] = useState<string[]>(['', '', '', '']);
  const [locations, setLocations] = useState<string[]>(['Library', 'Kitchen', 'Conservatory', 'Garden']);
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  // Animated loading messages to keep users entertained while Gemini works
  const loadingMessages = [
    "Initializing AI Director...",
    "Generating victim profile...",
    "Weaving web of lies and alibis...",
    "Hiding clues in the locations...",
    "Assigning dark secrets...",
    "Finalizing the murder plot..."
  ];

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const addPlayer = () => setPlayers([...players, '']);
  const removePlayer = (index: number) => {
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
  };

  const handleLocationChange = (index: number, value: string) => {
    const newLocs = [...locations];
    newLocs[index] = value;
    setLocations(newLocs);
  };

  const addLocation = () => setLocations([...locations, '']);
  const removeLocation = (index: number) => {
    const newLocs = [...locations];
    newLocs.splice(index, 1);
    setLocations(newLocs);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Cycle through loading messages
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length);
    }, 2500);

    const validPlayers = players.filter(p => p.trim());
    const validLocations = locations.filter(l => l.trim());

    if (validPlayers.length < 3) {
      setError('You need at least 3 players to start a murder mystery.');
      setLoading(false);
      clearInterval(interval);
      return;
    }

    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameName,
          theme,
          customNotes,
          playerNames: validPlayers,
          locations: validLocations,
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) throw new Error(data.error || 'Failed to create game');

      // Save Host ID and redirect
      localStorage.setItem(`host_${data.game_id}`, data.hostId);
      router.push(`/host/${data.game_id}`);

    } catch (err: any) {
      clearInterval(interval);
      setError(err.message);
      setLoading(false);
    }
  };

  /* -------------------------------------------------- */
  /* UI RENDERING */
  /* -------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 font-sans selection:bg-indigo-500/30 py-10 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4 text-indigo-400"
          >
            <Sparkles size={28} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Configure Protocol</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Set the parameters for your mystery. Our AI Director will generate a unique web of lies, backstories, and clues.</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-950/50 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3 shadow-lg">
            <X size={20} className="text-red-400" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleCreate} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: Game Details */}
            <div className="space-y-6">
              
              {/* Core Settings Panel */}
              <div className="bg-[#111118]/80 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Settings2 size={16} /> Core Settings
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Operation Name</label>
                    <input
                      required
                      value={gameName}
                      onChange={e => setGameName(e.target.value)}
                      placeholder="e.g. Midnight at the Manor"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Theme / Setting</label>
                    <input
                      required
                      value={theme}
                      onChange={e => setTheme(e.target.value)}
                      placeholder="e.g. 1920s Gatsby Party, Sci-Fi Space Station"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Prompts Panel */}
              <div className="bg-[#111118]/80 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <BookOpen size={16} /> AI Director Notes
                </h2>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom Instructions (Optional)</label>
                  <textarea
                    value={customNotes}
                    onChange={e => setCustomNotes(e.target.value)}
                    placeholder="e.g. 'Make John a cowardly alien in disguise' or 'Include a twist about a hidden will.'"
                    rows={4}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Lists */}
            <div className="space-y-6">
              
              {/* Locations Panel */}
              <div className="bg-[#111118]/80 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={16} /> Crime Scenes
                  </h2>
                  <button type="button" onClick={addLocation} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Plus size={14} /> Add
                  </button>
                </div>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {locations.map((loc, i) => (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        key={`loc-${i}`} className="flex gap-2"
                      >
                        <input
                          required
                          value={loc}
                          onChange={e => handleLocationChange(i, e.target.value)}
                          placeholder={`Location ${i + 1}`}
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        {locations.length > 2 && (
                          <button type="button" onClick={() => removeLocation(i)} className="p-2.5 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-red-400 transition-colors">
                            <X size={16} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Suspects Panel */}
              <div className="bg-[#111118]/80 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl flex-1">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} /> Suspect Roster
                  </h2>
                  <button type="button" onClick={addPlayer} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Plus size={14} /> Add
                  </button>
                </div>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {players.map((player, i) => (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        key={`player-${i}`} className="flex gap-2"
                      >
                        <input
                          required
                          value={player}
                          onChange={e => handlePlayerChange(i, e.target.value)}
                          placeholder={`Player ${i + 1} Name`}
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        {players.length > 3 && (
                          <button type="button" onClick={() => removePlayer(i)} className="p-2.5 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-red-400 transition-colors">
                            <X size={16} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </div>

          {/* Submit Button & Loading State */}
          <div className="mt-10">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="w-full bg-indigo-950/40 border border-indigo-500/50 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
              >
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <Wand2 className="absolute inset-0 m-auto text-indigo-300 w-5 h-5 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-indigo-300 font-bold uppercase tracking-widest text-sm mb-1 animate-pulse">
                    Generating Mystery
                  </p>
                  <p className="text-gray-400 text-xs font-mono">
                    {loadingMessages[loadingStep]}
                  </p>
                </div>
              </motion.div>
            ) : (
              <button
                type="submit"
                className="w-full group relative bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg py-5 px-8 rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] overflow-hidden flex items-center justify-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundSize: '200% auto', animation: 'gradient 3s linear infinite' }} />
                <Wand2 size={24} className="relative z-10" />
                <span className="relative z-10 uppercase tracking-widest">Generate Game</span>
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}