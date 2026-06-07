'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  count?: number;
  lang?: string;
}

interface TrackSelectProps {
  value: string;
  options: Option[];
  onChange: (id: string) => void;
  placeholder?: string;
  countLabel?: number | null;
}

const getLangBadgeMini = (lang?: string) => {
  if (!lang) return null;
  const map: Record<string, { label: string; color: string }> = {
    'zh-CN': { label: '简', color: 'text-blue-400 bg-blue-500/10 border border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.5)] [text-shadow:0_0_4px_rgba(59,130,246,0.8)]' },
    'zh-TW': { label: '繁', color: 'text-purple-400 bg-purple-500/10 border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.5)] [text-shadow:0_0_4px_rgba(168,85,247,0.8)]' },
    'zh': { label: '中', color: 'text-blue-400 bg-blue-500/10 border border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.5)] [text-shadow:0_0_4px_rgba(59,130,246,0.8)]' },
    'en': { label: '英', color: 'text-green-400 bg-green-500/10 border border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.5)] [text-shadow:0_0_4px_rgba(34,197,94,0.8)]' },
    'bilingual': { label: '双', color: 'text-amber-400 bg-amber-500/10 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.5)] [text-shadow:0_0_4px_rgba(245,158,11,0.8)]' },
    'commentary': { label: '导', color: 'text-rose-400 bg-rose-500/10 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.5)] [text-shadow:0_0_4px_rgba(244,63,94,0.8)]' },
  };
  const entry = map[lang];
  if (!entry) return null;
  return (
    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${entry.color} flex-shrink-0`}>
      {entry.label}
    </span>
  );
};

const truncateMiddle = (text: string, maxLength: number = 52) => {
  if (!text || text.length <= maxLength) return text;
  const charsToShow = maxLength - 3;
  const frontChars = Math.ceil(charsToShow * 0.55);
  const backChars = Math.floor(charsToShow * 0.45);
  return text.substring(0, frontChars) + '…' + text.substring(text.length - backChars);
};

export const TrackSelect: React.FC<TrackSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = '-- 未绑定 --',
  countLabel
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value) || null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        className={`w-full flex items-center gap-2 bg-white/[0.03] border rounded-lg py-2 px-3 text-xs outline-none transition-all duration-200 cursor-pointer font-mono text-left
          ${open ? 'border-accent-gold/50 bg-white/[0.06]' : 'border-white/5 hover:border-white/15 text-white'}`}
        onClick={() => setOpen(!open)}
      >
        <span className="flex-1 min-w-0 truncate text-white/80">
          {selectedOption ? (
            <span className="flex items-center gap-1.5">
              {getLangBadgeMini(selectedOption.lang)}
              <span className="truncate">{truncateMiddle(selectedOption.name)}</span>
            </span>
          ) : (
            <span className="text-white/30">{placeholder}</span>
          )}
        </span>
        {countLabel != null && (
          <span className="text-accent-gold text-[10px] font-mono flex-shrink-0">{countLabel}L</span>
        )}
        <ChevronDown className={`w-3 h-3 text-white/30 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-[200] bg-[#111115] border border-white/10 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-h-52 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {/* Unbound option */}
          <button
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition text-left
              ${!value ? 'text-white/60 bg-white/[0.02]' : 'text-white/30'}`}
            onClick={() => { onChange(''); setOpen(false); }}
          >
            {!value && <Check className="w-3 h-3 text-accent-gold flex-shrink-0" />}
            <span className={!value ? 'pl-0' : 'pl-[18px]'}>-- 未绑定 --</span>
          </button>

          {/* File options */}
          {options.map(opt => {
            const isSelected = value === opt.id;
            return (
              <button
                key={opt.id}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition text-left border-t border-white/[0.04]
                  ${isSelected ? 'bg-accent-gold/[0.04] text-white' : 'text-white/70'}`}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                title={opt.name}
              >
                {isSelected
                  ? <Check className="w-3 h-3 text-accent-gold flex-shrink-0" />
                  : <span className="w-3 flex-shrink-0" />
                }
                {getLangBadgeMini(opt.lang)}
                <span className="flex-1 truncate font-mono text-[11px]">{truncateMiddle(opt.name)}</span>
                {opt.count != null && (
                  <span className="text-white/30 text-[10px] flex-shrink-0 font-mono">{opt.count}行</span>
                )}
              </button>
            );
          })}

          {options.length === 0 && (
            <div className="px-3 py-4 text-[11px] text-white/30 text-center">
              暂无已上传的字幕文件
            </div>
          )}
        </div>
      )}
    </div>
  );
};
