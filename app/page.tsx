'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Users, Sparkles, Search, Vote } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-blood/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-gold/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-4xl"
      >
        <motion.h1
          className="font-display text-6xl md:text-8xl font-bold mb-6 glow-text"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Mystery Party
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl mb-4 text-parchment/80 font-body italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Where every friend is a suspect
        </motion.p>

        <motion.p
          className="text-lg mb-12 text-parchment/60 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Create custom AI-generated murder mysteries for your friend group.
          No preparation needed. Just gather your suspects and let the games begin.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={() => router.push('/create')}
            className="btn-primary text-lg px-8 py-4"
          >
            <span className="flex items-center gap-2 justify-center">
              <Sparkles size={20} />
              Create New Game
            </span>
          </button>
          
          <button
            onClick={() => {
              const code = prompt('Enter game code:');
              if (code) router.push(`/game/${code.toUpperCase()}`);
            }}
            className="btn-secondary text-lg px-8 py-4"
          >
            Join Existing Game
          </button>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[
            {
              icon: <Sparkles className="w-8 h-8" />,
              title: 'AI-Generated Stories',
              description: 'Unique mysteries created for your group every time'
            },
            {
              icon: <Search className="w-8 h-8" />,
              title: 'Interactive Investigation',
              description: 'Search for clues, interrogate suspects, uncover secrets'
            },
            {
              icon: <Vote className="w-8 h-8" />,
              title: 'Real-Time Multiplayer',
              description: 'Play together from any device, no app needed'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="mystery-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.1 }}
            >
              <div className="text-gold mb-4">{feature.icon}</div>
              <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-parchment/70 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="absolute bottom-8 text-center text-parchment/40 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <p>Best played with 4-8 friends • Takes 30-45 minutes</p>
      </motion.div>
    </div>
  );
}
