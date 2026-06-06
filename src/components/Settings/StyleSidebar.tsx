'use client';

import React, { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { LayoutGrid, Eye, ChevronDown, ChevronUp, Save, Trash2 } from 'lucide-react';

const PRESET_COLORS = ['#FFFFFF', '#E0E0E0', '#B0B0B0', '#F2A900', '#FF9C41', '#FF4D4D', '#A8E6CF', '#A0C4FF', '#000000'];

const ColorPickerDropdown = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">{label}</span>
        <span className="text-[9px] font-mono text-white/50">{value}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRESET_COLORS.map(c => (
          <button 
            key={c}
            onClick={() => onChange(c)}
            className={`w-6 h-6 rounded-full border transition-transform ${value === c ? 'border-accent-gold scale-110 shadow-[0_0_8px_rgba(242,169,0,0.5)]' : 'border-white/20 hover:scale-110'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0 cursor-pointer" title="自定义颜色">
          <div className="absolute inset-0 bg-[conic-gradient(red,yellow,green,cyan,blue,magenta,red)] opacity-80" />
          <input 
            type="color" 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 m-0"
          />
        </div>
      </div>
    </div>
  );
};

export const StyleSidebar: React.FC = () => {
  const { 
    processedSubs,
    customStyle, 
    setCustomStyle, 
    activePreset, 
    setActivePreset, 
    showGuides, 
    setShowGuides, 
    triggerTempGuides,
    customTemplates,
    saveCustomTemplate,
    deleteCustomTemplate
  } = useStudioStore();

  // #7 — Inline template name input state
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [isLyricsExpanded, setIsLyricsExpanded] = useState(false);

  const hasLyrics = processedSubs?.some(sub => {
    if (!sub.text) return false;
    return /[♪♫♬♩🎵🎶]/.test(sub.text);
  });

  const handleApplyPreset = (preset: any) => {
    setActivePreset(preset.id);
    const updated = {
      ...customStyle,
      ...preset.styles
    };
    setCustomStyle(updated);
  };

  const handleRestore = () => {
    setActivePreset('classic');
    const defaultStyle = { 
      zhFontSize: 20, 
      enFontSize: 12, 
      zhColor: '#FFFFFF', 
      enColor: '#B0B0B0', 
      zhOutline: '#FF9C41', 
      enOutline: '#000000',
      marginV: 20,
      lyricFontSize: 16,
      lyricColor: '#E6E6FA',
      lyricItalic: true,
      lyricPosition: 'top' as const,
      enScale: 90,
      maxLenZh: 20,
      maxLenEn: 80,
      resolution: '1080p' as const,
      aspectRatio: '16:9' as const,
      globalScale: 1.0
    };
    setCustomStyle(defaultStyle);
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('nexus_subtitle_styles_v4') || '{}');
      localStorage.setItem('nexus_subtitle_styles_v4', JSON.stringify({ ...stored, preset: 'classic', style: defaultStyle }));
    }
  };

  const handleStyleChange = (key: string, value: any) => {
    setActivePreset('custom');
    const updated = {
      ...customStyle,
      [key]: value
    };
    setCustomStyle(updated);
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('nexus_subtitle_styles_v4') || '{}');
      localStorage.setItem('nexus_subtitle_styles_v4', JSON.stringify({ ...stored, preset: 'custom', style: updated }));
    }
  };

  const handleSaveTemplate = () => {
    if (!templateNameInput.trim()) return;
    saveCustomTemplate(templateNameInput.trim());
    setTemplateNameInput('');
    setShowTemplateSave(false);
  };

  return (
    <div className="flex flex-col gap-5 p-5 text-left w-full h-full">
      <div className="pb-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-accent-gold" />
          <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
            样式与模板 (STYLES)
          </h3>
        </div>
        {/* Compact guides toggle */}
        <div 
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
          onClick={() => setShowGuides(!showGuides)}
          title="总是显示定位辅助线"
        >
          <Eye className={`w-4 h-4 ${showGuides ? 'text-accent-gold' : 'text-white/40'}`} />
          <input 
            type="checkbox"
            checked={showGuides}
            readOnly
            className="w-3 h-3 rounded border-white/10 text-accent-gold bg-transparent focus:ring-accent-gold pointer-events-none"
          />
        </div>
      </div>

      {/* Templates & Presets (Moved to top) */}
      <div className="flex flex-col gap-3 border-b border-white/5 pb-5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">预设模板 (PRESETS)</span>
          {/* #7 — Inline save button */}
          <button 
            className="flex items-center gap-1 text-[10px] text-accent-gold/80 hover:text-accent-gold transition"
            onClick={() => {
              setTemplateNameInput(`自定义模板 ${customTemplates.length + 1}`);
              setShowTemplateSave(v => !v);
            }}
          >
            <Save className="w-3 h-3" /> 保存当前样式
          </button>
        </div>

        {/* #7 — Inline template name input (replaces window.prompt) */}
        {showTemplateSave && (
          <div className="flex gap-2 animate-in slide-in-from-top-1 duration-150">
            <input
              type="text"
              autoFocus
              value={templateNameInput}
              onChange={e => setTemplateNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTemplate(); if (e.key === 'Escape') setShowTemplateSave(false); }}
              className="flex-1 bg-white/[0.05] border border-accent-gold/30 focus:border-accent-gold/70 rounded-lg py-1.5 px-2.5 text-white text-[11px] outline-none"
              placeholder="模板名称..."
            />
            <button
              onClick={handleSaveTemplate}
              className="px-2.5 py-1.5 bg-accent-gold text-black text-[11px] font-bold rounded-lg hover:bg-accent-gold/90 transition flex-shrink-0"
            >
              保存
            </button>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={handleRestore}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition border ${activePreset === 'classic' ? 'bg-accent-gold/10 border-accent-gold/50 text-accent-gold' : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-white/80'}`}
          >
            默认经典样式 (Classic)
          </button>
          
          {customTemplates.map(tpl => (
            <div key={tpl.id} className="flex gap-1 items-center">
              <button 
                onClick={() => handleApplyPreset(tpl)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-xs font-semibold transition border ${activePreset === tpl.id ? 'bg-accent-gold/10 border-accent-gold/50 text-accent-gold' : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-white/80'}`}
              >
                {tpl.name}
              </button>
              <button 
                onClick={() => deleteCustomTemplate(tpl.id)}
                className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                title="删除模板"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Style Editors */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">参数微调 (TWEAK)</span>
        </div>
        
        {/* Font Sizes */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium text-white/80">
              <span>中文字号 (ZH Font Size)</span>
              <span className="font-mono text-accent-gold">{customStyle.zhFontSize}px</span>
            </div>
            <input 
              type="range" min="12" max="36" 
              value={customStyle.zhFontSize}
              onChange={e => handleStyleChange('zhFontSize', parseInt(e.target.value, 10))}
              className="v9-timeline-dial-slider"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium text-white/80">
              <span>英文字号 (EN Font Size)</span>
              <span className="font-mono text-accent-gold">{customStyle.enFontSize}px</span>
            </div>
            <input 
              type="range" min="8" max="24" 
              value={customStyle.enFontSize}
              onChange={e => handleStyleChange('enFontSize', parseInt(e.target.value, 10))}
              className="v9-timeline-dial-slider"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium text-white/80">
              <span>垂直边距 (Vertical Margin)</span>
              <span className="font-mono text-accent-gold">{customStyle.marginV}px</span>
            </div>
            <input 
              type="range" min="10" max="60" 
              value={customStyle.marginV}
              onChange={e => {
                handleStyleChange('marginV', parseInt(e.target.value, 10));
                triggerTempGuides();
              }}
              className="v9-timeline-dial-slider"
            />
          </div>
        </div>

        {/* Color pickers */}
        <div className="flex flex-col gap-4 mt-2 border-b border-white/5 pb-5">
          <ColorPickerDropdown label="中文/主字色" value={customStyle.zhColor} onChange={(c) => handleStyleChange('zhColor', c)} />
          <ColorPickerDropdown label="中文描边色" value={customStyle.zhOutline} onChange={(c) => handleStyleChange('zhOutline', c)} />
          <ColorPickerDropdown label="英文/次字色" value={customStyle.enColor} onChange={(c) => handleStyleChange('enColor', c)} />
          <ColorPickerDropdown label="英文描边色" value={customStyle.enOutline || '#000000'} onChange={(c) => handleStyleChange('enOutline', c)} />
          
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">画质分辨率</span>
            <select
              className="w-full h-9 bg-white/[0.03] border border-white/10 rounded-lg text-xs px-3 text-white outline-none focus:border-accent-gold/50 shadow-inner"
              value={customStyle.resolution || '1080p'}
              onChange={e => handleStyleChange('resolution', e.target.value)}
            >
              <option value="SD">标清 SD</option>
              <option value="1080p">全高清 1080p</option>
              <option value="4K">超高清 4K</option>
            </select>
          </div>
        </div>

        {/* Lyrics Styles (Foldable) */}
        <div className="flex flex-col gap-2 pb-5">
          <div 
            className="flex justify-between items-center cursor-pointer select-none group"
            onClick={() => setIsLyricsExpanded(!isLyricsExpanded)}
          >
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider flex items-center group-hover:text-white/80 transition">
              歌词样式 (LYRICS STYLE)
              {hasLyrics && <span className="text-accent-gold ml-1.5 text-[9px] bg-accent-gold/10 px-1 rounded">✓ 自动识别</span>}
            </span>
            <div className="p-1 rounded bg-white/5 group-hover:bg-white/10 transition">
              {isLyricsExpanded ? <ChevronUp className="w-3 h-3 text-white/50" /> : <ChevronDown className="w-3 h-3 text-white/50" />}
            </div>
          </div>
          
          {isLyricsExpanded && (
            <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
              {hasLyrics ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium text-white/80">
                      <span>歌词字号 (Lyric Font)</span>
                      <span className="font-mono text-accent-gold">{customStyle.lyricFontSize ?? 16}px</span>
                    </div>
                    <input 
                      type="range" min="10" max="30" 
                      value={customStyle.lyricFontSize ?? 16}
                      onChange={e => handleStyleChange('lyricFontSize', parseInt(e.target.value, 10))}
                      className="v9-timeline-dial-slider"
                    />
                  </div>

                  <ColorPickerDropdown label="歌词颜色" value={customStyle.lyricColor ?? '#E6E6FA'} onChange={(c) => handleStyleChange('lyricColor', c)} />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">歌词位置</span>
                      <select
                        className="w-full h-8 bg-white/[0.03] border border-white/10 rounded-lg text-xs px-2 text-white outline-none focus:border-accent-gold/50"
                        value={customStyle.lyricPosition ?? 'top'}
                        onChange={e => handleStyleChange('lyricPosition', e.target.value)}
                      >
                        <option value="top">顶部置顶</option>
                        <option value="bottom">底部置底</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">启用斜体</span>
                      <div 
                        className={`h-8 rounded-lg border flex items-center justify-center cursor-pointer transition ${customStyle.lyricItalic ?? true ? 'bg-accent-gold/10 border-accent-gold text-accent-gold' : 'bg-white/5 border-white/10 text-white/50'}`}
                        onClick={() => handleStyleChange('lyricItalic', !(customStyle.lyricItalic ?? true))}
                      >
                        <span className="text-xs font-bold italic">Italic</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-white/40 bg-white/[0.02] p-3 rounded-xl border border-white/5 leading-relaxed">
                  未检测到包含 ♪ ♫ 等音符标记的歌词轨道。
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
