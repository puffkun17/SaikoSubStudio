'use client';

import React, { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { SubRow } from '@/types/subtitleTypes';
import JSZip from 'jszip';

interface ExportDropdownProps {
  variant?: 'gold' | 'ghost';
}

function msToSrtTime(ms: number): string {
  const date = new Date(ms);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const mss = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss},${mss}`;
}

function subsToSrt(subs: SubRow[]): string {
  return subs
    .map((sub, i) => {
      const [start, end] = sub.ts.split(' --> ').map(t => {
        // assume already in good format or convert
        return t.trim();
      });
      return `${i + 1}\n${start} --> ${end}\n${sub.text}\n`;
    })
    .join('\n');
}

function subsToAss(subs: SubRow[], style: any): string {
  const header = `[Script Info]
Title: SubStudio Export
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style?.zhFont || 'Arial'},${style?.zhFontSize || 48},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = subs.map(sub => {
    const [start, end] = sub.ts.split(' --> ');
    const text = sub.text.replace(/\n/g, '\\N');
    return `Dialogue: 0,${start.replace(',', '.')},${end.replace(',', '.')},Default,,0,0,0,,${text}`;
  }).join('\n');

  return header + events;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({ variant = 'ghost' }) => {
  const [open, setOpen] = useState(false);
  const { processedSubs, customFilename, addLog, customStyle } = useStudioStore();

  const filename = customFilename || 'subtitles';

  const handleExport = async (format: 'srt' | 'ass' | 'both') => {
    if (!processedSubs || processedSubs.length === 0) {
      addLog('No subtitles to export', 'error');
      setOpen(false);
      return;
    }

    try {
      if (format === 'srt') {
        const content = subsToSrt(processedSubs);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.srt`;
        a.click();
        URL.revokeObjectURL(url);
        addLog('Exported as SRT', 'success');
      } else if (format === 'ass') {
        const content = subsToAss(processedSubs, customStyle);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.ass`;
        a.click();
        URL.revokeObjectURL(url);
        addLog('Exported as ASS', 'success');
      } else if (format === 'both') {
        const zip = new JSZip();
        zip.file(`${filename}.srt`, subsToSrt(processedSubs));
        zip.file(`${filename}.ass`, subsToAss(processedSubs, customStyle));
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        addLog('Exported as ZIP (SRT + ASS)', 'success');
      }
    } catch (e) {
      addLog('Export failed', 'error');
      console.error(e);
    }
    setOpen(false);
  };

  const baseClass = variant === 'gold' 
    ? 'px-4 py-2 rounded-xl bg-amber-400 text-black font-medium text-sm flex items-center gap-2 hover:bg-amber-300 transition'
    : 'px-3 py-1.5 rounded-lg border border-white/20 text-xs hover:bg-white/5 flex items-center gap-2';

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={baseClass}
        aria-haspopup="true"
      >
        Export
        <span className="text-[10px]">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-[#111113] shadow-xl z-[100] overflow-hidden text-sm">
          <button 
            onClick={() => handleExport('srt')} 
            className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex items-center gap-2"
          >
            Export SRT
          </button>
          <button 
            onClick={() => handleExport('ass')} 
            className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex items-center gap-2 border-t border-white/10"
          >
            Export ASS (styled)
          </button>
          <button 
            onClick={() => handleExport('both')} 
            className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex items-center gap-2 border-t border-white/10 text-amber-400"
          >
            Export ZIP (both)
          </button>
        </div>
      )}
    </div>
  );
};
