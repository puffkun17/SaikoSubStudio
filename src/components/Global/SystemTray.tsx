'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStudioStore } from '@/store/useStudioStore';

// ─── Icons ───────────────────────────────────────────────────────────────────

const HomeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="18" height="18" x="3" y="4" rx="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
  </svg>
);

const StudioIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>
  </svg>
);

// ─── Route configuration ──────────────────────────────────────────────────────

// Standalone SubStudio: only root route. No multi-tool nav (sports/studio were from full NAS portal).
const NAV_ITEMS: { href: string; label: string; Icon: React.FC }[] = [];

const CRUMB_MAP: Record<string, string> = {
  '/': 'SubStudio',
};

// ─── Tray ─────────────────────────────────────────────────────────────────────

export const SystemTray = () => {
  const pathname = usePathname();
  const [time, setTime] = useState('');
  const [scale, setScale] = useState(1.0);
  const [mounted, setMounted] = useState(false);
  const { workflowStep, restartSystem, tasks } = useStudioStore();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetHref: string) => {
    // In standalone SubStudio (root = the tool), only confirm if leaving mid-workflow
    if (!isHome && tasks.length > 0 && workflowStep > 1) {
      const confirmLeave = window.confirm('离开此页面将丢失当前的字幕任务信息，确定要离开吗？');
      if (!confirmLeave) {
        e.preventDefault();
      } else {
        restartSystem();
      }
    }
  };

  // Sync scale from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedScale = localStorage.getItem('nexus_site_scale');
    if (savedScale) {
      const parsed = parseFloat(savedScale);
      if (!isNaN(parsed)) {
        setScale(parsed);
        document.documentElement.style.setProperty('--site-scale', String(parsed));
      }
    } else {
      // Auto-detect resolution (defaults to 1.5, downgrade for lower res)
      if (typeof window !== 'undefined') {
        const w = window.screen.width;
        const h = window.screen.height;
        const dpr = window.devicePixelRatio || 1;
        
        let defaultScale = 1.5;
        if (w < 1600 || h < 900) {
          defaultScale = 1.0;
        } else if (w < 2560 && dpr < 2) {
          defaultScale = 1.2;
        }
        
        setScale(defaultScale);
        localStorage.setItem('nexus_site_scale', String(defaultScale));
        document.documentElement.style.setProperty('--site-scale', String(defaultScale));
      }
    }
  }, []);

  const cycleScale = () => {
    const nextScales: Record<number, number> = { 1.0: 1.2, 1.2: 1.35, 1.35: 1.5, 1.5: 1.0 };
    const next = nextScales[scale] || 1.0;
    setScale(next);
    localStorage.setItem('nexus_site_scale', String(next));
    document.documentElement.style.setProperty('--site-scale', String(next));
  };

  // L-2 fix: setInterval (1s) instead of rAF — no need to re-render 60×/s for a clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isHome = pathname === '/';
  const crumb  = CRUMB_MAP[pathname] ?? 'SubStudio';

  return (
    <nav
      aria-label="System tray"
      className="fixed top-0 w-full z-50 h-[56px] flex items-center px-5 md:px-7
        bg-[#030305]/40 backdrop-blur-md border-b border-white/[0.06]
        justify-between transition-colors duration-300"
    >
      {/* ── Left: breadcrumb navigation ──────────────────────────────── */}
      <div className="flex items-center gap-2 text-[12px] font-mono tracking-tight min-w-0">
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, '/')}
          className={`flex items-center gap-1.5 transition-colors duration-150 shrink-0
            ${isHome ? 'text-white/90' : 'text-white/40 hover:text-white/80'}`}
          aria-label="Go to Basement Hub"
        >
          <HomeIcon />
          <span>nexus://basement</span>
        </Link>

        {!isHome && (
          <>
            <span className="text-white/15 select-none">/</span>
            <span className="text-emerald-400 font-semibold truncate">
              {crumb}
            </span>
          </>
        )}
      </div>

      {/* ── Center: app nav tabs ─────────────────────────────────────── */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1.5
        bg-white/[0.015] p-1 rounded-full border border-white/[0.08] backdrop-blur-md">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => handleNavClick(e, href)}
              className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-[12px] font-medium
                transition-all duration-150 border
                ${isActive
                  ? 'text-white bg-white/[0.06] border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.5)]'
                  : 'text-white/40 border-transparent hover:text-white/80 hover:bg-white/[0.03]'}`}
            >
              <span className={`transition-colors duration-150 ${isActive ? 'text-emerald-400' : 'text-current'}`}>
                <Icon />
              </span>
              <span>{label.toLowerCase()}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Right: scale selector & clock ─────────────────────────────── */}
      <div className="flex items-center gap-4 shrink-0">
        {mounted && (
          <button
            onClick={cycleScale}
            className="px-2.5 py-1 rounded-lg glass-btn-ar text-[11px] font-mono text-neutral-400 hover:text-neutral-200 cursor-pointer select-none flex items-center gap-1"
            title="调节网页整体缩放 (适配 4K 显示器)"
          >
            <span className="text-[10px] opacity-50 uppercase font-bold tracking-wider">A±</span>
            <span className="font-bold text-violet-400">{Math.round(scale * 100)}%</span>
          </button>
        )}
        <span
          className="text-[11px] font-mono text-white/30 tabular-nums tracking-wider"
          aria-label="Current time"
        >
          {time}
        </span>
      </div>
    </nav>
  );
};
