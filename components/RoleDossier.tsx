'use client';

import { motion } from 'framer-motion';
import { UserCircle, Lock, Skull, ShieldAlert, CheckCircle, Circle, Loader } from 'lucide-react';
import { PlayerRole } from '@/types';

interface Props {
  role: PlayerRole;
  objectiveStatus?: 'idle' | 'verifying' | 'completed';
  onVerifyObjective?: () => void;
}

export default function RoleDossier({ 
  role, 
  objectiveStatus = 'idle', 
  onVerifyObjective 
}: Props) {
  
  return (
    <div className="bg-[#111118] border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
      {/* Background watermarks */}
      <div className="absolute top-10 right-10 opacity-[0.03] rotate-12 pointer-events-none">
        <ShieldAlert size={200} />
      </div>
      
      {role.is_killer && (
        <motion.div 
          initial={{ opacity: 0, scale: 2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="absolute top-6 right-6 border-4 border-red-600/30 text-red-600/30 font-black text-2xl md:text-3xl tracking-widest uppercase px-4 py-1 rotate-12 rounded pointer-events-none"
        >
          CLASSIFIED
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-8 border-b border-white/10 pb-6 relative z-10">
        <p className="text-indigo-500 font-mono text-xs uppercase tracking-widest mb-2">Subject File // {role.id.split('-')[0]}</p>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">{role.name}</h2>
        <p className="text-lg font-medium text-gray-400">{role.role}</p>
      </div>

      <div className="space-y-8 relative z-10">
        
        {/* Profile & Backstory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <UserCircle size={14}/> Background Intel
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed font-serif bg-black/40 p-5 rounded-2xl border border-white/5 h-full">
              {role.backstory || "No background data available."}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <UserCircle size={14}/> Psychological Profile
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed font-serif bg-black/40 p-5 rounded-2xl border border-white/5 h-full">
              {role.personality || "No personality data on record."}
            </p>
          </section>
        </div>

        {/* Actionable Secret Objective */}
        <section>
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Lock size={14}/> Primary Directive (Side-Quest)
          </h3>
          <div className={`p-5 rounded-2xl border transition-all duration-500 ${
            objectiveStatus === 'completed'
              ? 'bg-green-950/20 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
              : 'bg-indigo-500/10 border-indigo-500/20'
          }`}>
            <p className={`text-sm leading-relaxed font-medium mb-4 transition-colors ${
              objectiveStatus === 'completed' ? 'text-green-300' : 'text-indigo-200'
            }`}>
              {role.objective || "Survive the night."}
            </p>
            
            <button 
              onClick={onVerifyObjective}
              disabled={objectiveStatus !== 'idle'}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
                objectiveStatus === 'completed' 
                  ? 'bg-green-600/20 text-green-400 border border-green-500/50 cursor-not-allowed' 
                  : objectiveStatus === 'verifying'
                  ? 'bg-indigo-600/50 text-indigo-300 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {objectiveStatus === 'verifying' ? (
                <Loader className="animate-spin" size={16} />
              ) : objectiveStatus === 'completed' ? (
                <CheckCircle size={16} />
              ) : (
                <Circle size={16} />
              )}
              
              {objectiveStatus === 'verifying' 
                ? 'AI Analyzing Comms...' 
                : objectiveStatus === 'completed' 
                ? 'Awaiting Host Approval' 
                : 'Submit for AI Verification'}
            </button>
          </div>
        </section>

        {/* Motive & Alibi Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Motive Summary</h3>
            <p className="text-sm text-gray-300 leading-relaxed font-serif bg-black/40 p-5 rounded-2xl border border-white/5 h-full">
              {role.motive}
            </p>
          </section>
          <section>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Registered Alibi</h3>
            <p className="text-sm text-gray-300 leading-relaxed font-serif bg-black/40 p-5 rounded-2xl border border-white/5 h-full">
              {role.alibi}
            </p>
          </section>
        </div>

        {/* Undisclosed Secrets */}
        <section>
          <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Skull size={14}/> Undisclosed Secrets
          </h3>
          <div className="bg-red-950/10 border border-red-900/30 p-5 md:p-6 rounded-2xl">
            <p className="text-xs text-red-500/70 uppercase tracking-widest mb-4 font-bold">
              Warning: Protect these at all costs
            </p>
            <ul className="space-y-4">
              {role.secrets?.map((s: string, i: number) => (
                <li key={i} className="text-sm text-gray-300 flex items-start group">
                  <span className="mr-3 text-red-500/50 mt-0.5 font-mono group-hover:text-red-400 transition-colors">[{i+1}]</span> 
                  <span className="leading-relaxed font-serif group-hover:text-white transition-colors">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        
      </div>
    </div>
  );
}