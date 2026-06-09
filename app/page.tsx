'use client';

import React, { useEffect } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { IngestStep } from '@/components/IngestStep';
import { WorkbenchStep } from '@/components/WorkbenchStep';
import { TheaterStep } from '@/components/TheaterStep';

export default function Home() {
  const { workflowStep, initializeLibrary, logs } = useStudioStore();

  useEffect(() => {
    initializeLibrary();
  }, [initializeLibrary]);

  return (
    <main className="flex-1 w-full h-full bg-[#050507] text-white overflow-hidden flex flex-col font-sans relative">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-glow/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-accent-glow/10 blur-[150px]" />
      </div>

      {/* Main step container */}
      <div className="flex-1 w-full h-full flex flex-col z-10 overflow-hidden">
        {workflowStep === 1 && <IngestStep />}
        {workflowStep === 2 && <WorkbenchStep />}
        {workflowStep === 3 && <TheaterStep />}
      </div>

      {/* Global Toast Logs System (Sonner Style Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-[2200] flex flex-col items-end justify-end gap-3 pointer-events-none">
        {logs.map((l, idx) => (
          <div 
            key={l.id} 
            className={`px-4 py-3 rounded-xl border backdrop-blur-xl text-sm font-semibold tracking-wide shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-400 pointer-events-auto flex items-center min-w-[280px] max-w-md break-words
              ${l.type === 'success' ? 'bg-[#061c12]/95 border-emerald-500/20 text-emerald-400' : 
                l.type === 'error' ? 'bg-[#1f0a0a]/95 border-rose-500/20 text-rose-400' : 
                'bg-[#121216]/95 border-white/10 text-white/90'}
              ${l.fade ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
              hover:-translate-y-1 origin-bottom`}
          >
            {l.type === 'success' && <span className="mr-2.5 text-emerald-500">✓</span>}
            {l.type === 'error' && <span className="mr-2.5 text-rose-500">✕</span>}
            {l.type === 'info' && <span className="mr-2.5 text-accent-gold">ℹ</span>}
            <span className="flex-1">{l.msg}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
