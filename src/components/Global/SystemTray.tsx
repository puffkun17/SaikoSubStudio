'use client';

import React from 'react';

export const SystemTray = () => {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 w-full z-50 h-14 flex items-center px-5 md:px-6 bg-[#070709]/95 backdrop-blur-md border-b border-white/[0.06]"
    >
      <div className="flex items-center">
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">
          SaikoSubStudio
        </span>
      </div>
      <div className="ml-auto text-[11px] font-mono text-white/25 tabular-nums">
        {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </nav>
  );
};
