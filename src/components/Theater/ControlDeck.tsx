'use client';

import React from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { Film, Moon, Trees } from 'lucide-react';

const PRESETS = [
  {
    id: 'netflix',
    name: 'Netflix 经典',
    desc: '白字轻阴影',
    styles: { zhFontSize: 22, enFontSize: 13, zhColor: '#FFFFFF', enColor: '#FFFFFF', zhOutline: '#000000', marginV: 25 }
  },
  {
    id: 'classic',
    name: '大银幕',
    desc: '黄白配加强描边',
    styles: { zhFontSize: 20, enFontSize: 12, zhColor: '#FFFFFF', enColor: '#B0B0B0', zhOutline: '#FF9C41', marginV: 20 }
  },
  {
    id: 'anime',
    name: '动漫/科幻',
    desc: '加深粗重描边',
    styles: { zhFontSize: 24, enFontSize: 14, zhColor: '#FFFFFF', enColor: '#FFFFFF', zhOutline: '#6D4438', marginV: 30 }
  }
];

export const ControlDeck: React.FC = () => {
  const { 
    theaterAspect, 
    setTheaterAspect, 
    sceneBackground, 
    setSceneBackground,
    activePreset, 
    setActivePreset, 
    customStyle, 
    setCustomStyle 
  } = useStudioStore();

  const handleApplyPreset = (preset: any) => {
    setActivePreset(preset.id);
    const updated = { ...customStyle, ...preset.styles };
    setCustomStyle(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_subtitle_styles_v4', JSON.stringify({
        preset: preset.id,
        style: updated,
        templates: []
      }));
    }
  };

  const aspectRatios = [
    { id: '4:3', label: '4:3', desc: '电视广播' },
    { id: '16:9', label: '16:9', desc: '高清电视' },
    { id: '2.39:1', label: '2.39:1', desc: '宽银幕' },
    { id: '1.9:1', label: 'IMAX', desc: 'IMAX画幅' }
  ];

  const scenes = [
    { 
      id: 'cinema', 
      label: '影视剧照',
      icon: <Film className="w-4 h-4 text-accent-gold" />
    },
    { 
      id: 'nature', 
      label: '自然环境',
      icon: <Trees className="w-4 h-4 text-emerald-400" />
    },
    { 
      id: 'night', 
      label: '城市夜间',
      icon: <Moon className="w-4 h-4 text-sky-400" />
    }
  ];

  return (
    <div className="bg-[#0c0c10] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-6 w-full justify-between items-center z-10">
      {/* Aspect Ratio Cards */}
      <div className="flex flex-col gap-2 text-left w-full md:w-auto">
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider pl-1">画幅比例 (ASPECT RATIO)</span>
        <div className="flex flex-wrap gap-2.5">
          {aspectRatios.map(ar => {
            const isActive = theaterAspect === ar.id;
            let boxW = 20;
            let boxH = 12;
            if (ar.id === '4:3') { boxW = 16; boxH = 12; }
            else if (ar.id === '16:9') { boxW = 21; boxH = 12; }
            else if (ar.id === '2.39:1') { boxW = 28; boxH = 11; }
            else if (ar.id === '1.9:1') { boxW = 23; boxH = 12; }

            return (
              <button
                key={ar.id}
                type="button"
                className={`py-2 px-4 rounded-xl border flex items-center gap-2.5 transition-all duration-300
                  ${isActive 
                    ? 'bg-accent-gold/10 border-accent-gold text-white shadow-[0_0_12px_rgba(242,169,0,0.15)]' 
                    : 'bg-white/[0.01] border-white/5 text-white/50 hover:border-white/10 hover:text-white/80'}`}
                onClick={() => setTheaterAspect(ar.id)}
              >
                <div 
                  className="border border-current rounded-sm opacity-80" 
                  style={{ width: `${boxW}px`, height: `${boxH}px` }}
                />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs font-semibold">{ar.label}</span>
                  <span className="text-[9px] opacity-60 mt-0.5">{ar.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden md:block w-[1px] h-10 bg-white/5 self-end mb-1" />

      {/* Background Cards */}
      <div className="flex flex-col gap-2 text-left w-full md:w-auto">
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider pl-1">模拟场景 (AMBIENT SCENE)</span>
        <div className="flex flex-wrap gap-2.5">
          {scenes.map(s => {
            const isActive = sceneBackground === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`py-2 px-4 rounded-xl border flex items-center gap-2.5 transition-all duration-300
                  ${isActive 
                    ? 'bg-accent-gold/10 border-accent-gold text-white shadow-[0_0_12px_rgba(242,169,0,0.15)]' 
                    : 'bg-white/[0.01] border-white/5 text-white/50 hover:border-white/10 hover:text-white/80'}`}
                onClick={() => setSceneBackground(s.id)}
              >
                {s.icon}
                <span className="text-xs font-semibold">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden md:block w-[1px] h-10 bg-white/5 self-end mb-1" />

      {/* Preset Pills */}
      <div className="flex flex-col gap-2 text-left w-full md:w-auto">
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider pl-1">字幕预设 (PRESETS)</span>
        <div className="flex flex-wrap gap-2.5">
          {PRESETS.map(p => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`py-2 px-3 rounded-xl border flex items-center gap-2 transition-all duration-300
                  ${isActive 
                    ? 'bg-accent-gold/10 border-accent-gold text-white shadow-[0_0_12px_rgba(242,169,0,0.15)]' 
                    : 'bg-white/[0.01] border-white/5 text-white/50 hover:border-white/10 hover:text-white/80'}`}
                onClick={() => handleApplyPreset(p)}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full border border-white/20" 
                  style={{ backgroundColor: p.styles.zhColor, borderColor: p.styles.zhOutline }} 
                />
                <span className="text-xs font-semibold tracking-wide">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
