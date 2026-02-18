'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Trash2, Sparkles, AlertCircle } from 'lucide-react';

export default function CreateGame() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [gameName, setGameName] = useState('');
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [locations, setLocations] = useState(['', '', '']);
  const [theme, setTheme] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const addPlayer = () => {
    if (playerNames.length < 10) {
      setPlayerNames([...playerNames, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 3) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index: number, value: string) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  const addLocation = () => {
    if (locations.length < 8) {
      setLocations([...locations, '']);
    }
  };

  const removeLocation = (index: number) => {
    if (locations.length > 2) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index: number, value: string) => {
    const updated = [...locations];
    updated[index] = value;
    setLocations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      const validPlayers = playerNames.filter(n => n.trim());
      const validLocations = locations.filter(l => l.trim());

      if (!gameName.trim()) {
        throw new Error('Please enter a game name');
      }
      if (validPlayers.length < 3) {
        throw new Error('Need at least 3 players');
      }
      if (validLocations.length < 2) {
        throw new Error('Need at least 2 locations');
      }
      if (!theme.trim()) {
        throw new Error('Please enter a theme');
      }

      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameName: gameName.trim(),
          playerNames: validPlayers,
          locations: validLocations,
          theme: theme.trim(),
          customNotes: customNotes.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create game');
      }

      const { game_id, hostId } = await response.json();
      
      // Store host ID in localStorage
      localStorage.setItem(`host_${game_id}`, hostId);
      
      // Redirect to host dashboard
      router.push(`/host/${game_id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/')}
            className="text-parchment/60 hover:text-parchment mb-4 flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 glow-text">
            Create Your Mystery
          </h1>
          <p className="text-parchment/70 text-lg">
            Tell us about your game, and our AI will craft a unique murder mystery
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Game Name */}
          <div className="mystery-card">
            <label className="block font-display text-xl font-semibold mb-3 text-gold">
              Game Name
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="The Manor Murder Mystery"
              className="input-mystery"
              maxLength={50}
            />
          </div>

          {/* Players */}
          <div className="mystery-card">
            <label className="block font-display text-xl font-semibold mb-3 text-gold">
              Players ({playerNames.filter(n => n.trim()).length})
            </label>
            <p className="text-parchment/60 text-sm mb-4">
              Enter the names of people who will play (3-10 players)
            </p>
            <div className="space-y-3">
              {playerNames.map((name, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updatePlayer(index, e.target.value)}
                    placeholder={`Player ${index + 1} name`}
                    className="input-mystery flex-1"
                  />
                  {playerNames.length > 3 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="p-2 text-blood hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {playerNames.length < 10 && (
              <button
                type="button"
                onClick={addPlayer}
                className="mt-4 btn-secondary flex items-center gap-2 w-full justify-center"
              >
                <Plus size={18} />
                Add Player
              </button>
            )}
          </div>

          {/* Locations */}
          <div className="mystery-card">
            <label className="block font-display text-xl font-semibold mb-3 text-gold">
              Locations ({locations.filter(l => l.trim()).length})
            </label>
            <p className="text-parchment/60 text-sm mb-4">
              Where does your mystery take place? (2-8 locations)
            </p>
            <div className="space-y-3">
              {locations.map((location, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => updateLocation(index, e.target.value)}
                    placeholder={`e.g., Library, Kitchen, Garden`}
                    className="input-mystery flex-1"
                  />
                  {locations.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeLocation(index)}
                      className="p-2 text-blood hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {locations.length < 8 && (
              <button
                type="button"
                onClick={addLocation}
                className="mt-4 btn-secondary flex items-center gap-2 w-full justify-center"
              >
                <Plus size={18} />
                Add Location
              </button>
            )}
          </div>

          {/* Theme */}
          <div className="mystery-card">
            <label className="block font-display text-xl font-semibold mb-3 text-gold">
              Theme / Vibe
            </label>
            <p className="text-parchment/60 text-sm mb-4">
              What's the setting and tone?
            </p>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g., 1920s mansion, college dorm, space station, dark comedy"
              className="input-mystery"
            />
          </div>

          {/* Custom Notes */}
          <div className="mystery-card">
            <label className="block font-display text-xl font-semibold mb-3 text-gold">
              Additional Notes (Optional)
            </label>
            <p className="text-parchment/60 text-sm mb-4">
              Any specific drama, relationships, or plot points you want included?
            </p>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g., Alice and Bob are ex-lovers, Charlie owes money to Dana..."
              className="input-mystery min-h-[100px] resize-y"
              maxLength={500}
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mystery-card bg-blood/20 border-blood/50"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
                <p className="text-red-200">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <span className="flex items-center gap-3 justify-center">
                <div className="spinner w-6 h-6" />
                Generating Mystery...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <Sparkles size={24} />
                Generate Game
              </span>
            )}
          </motion.button>

          <p className="text-center text-parchment/50 text-sm">
            This will take 10-20 seconds as AI generates your custom mystery
          </p>
        </motion.form>
      </div>
    </div>
  );
}
