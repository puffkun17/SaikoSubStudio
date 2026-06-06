'use client';

import React, { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { ScreenSimulator } from '@/components/Theater/ScreenSimulator';
import { SimulatorBoundary } from '@/components/Theater/SimulatorBoundary';
import { ControlDeck } from '@/components/Theater/ControlDeck';
import { StyleSidebar } from '@/components/Settings/StyleSidebar';
import { ExportDropdown } from '@/hooks/useExport';
import { Save, Sliders, ChevronLeft } from 'lucide-react';
import { SubtitleDataSlot, BackdropSlot } from '@/types/subtitleTypes';

export const TheaterStep: React.FC = () => {
  const {
    processedSubs,
    previewIndex,
    setPreviewIndex,
    isTemplateLab,
    restartSystem,
    setWorkflowStep,
    isSettingsOpen,
    setIsSettingsOpen,
    saveToLibrary,
    customStyle,
    sceneBackground,
    tmdbBackdrop,
    theaterAspect,
    showGuides,
    tempShowGuides,
    triggerTempGuides,
  } = useStudioStore();

  const percentVal = processedSubs && processedSubs.length > 1
    ? ((previewIndex / (processedSubs.length - 1)) * 100).toFixed(1)
    : '0.0';

  const handleBack = () => {
    if (isTemplateLab) {
      restartSystem();
    } else {
      setWorkflowStep(2);
    }
  };

  // Convert processedSubs to SubtitleDataSlot
  const subtitleSlot: SubtitleDataSlot = processedSubs
    ? { status: 'ready', data: processedSubs }
    : { status: 'idle' };

  // Convert background to BackdropSlot
  let backdropSlot: BackdropSlot;
  if (sceneBackground === 'cinema' && tmdbBackdrop) {
    backdropSlot = { type: 'tmdb', backdropUrl: tmdbBackdrop };
  } else if (sceneBackground === 'cinema' || sceneBackground === 'nature' || sceneBackground === 'night') {
    backdropSlot = { type: 'preset', name: sceneBackground };
  } else {
    backdropSlot = { type: 'solid', color: '#0c0c10' };
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative bg-surface-0">
      {/* Premium Independent Top Navbar with fixed height and symmetrical alignment */}
      <div className="flex justify-between items-center px-6 h-[52px] bg-surface-1/95 backdrop-blur-md border-b border-white/5 z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              className="p-2 hover:bg-white/5 border border-white/10 rounded-xl transition duration-200 text-white/70 hover:text-white flex items-center justify-center"
              onClick={handleBack}
              title="返回工作台"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-sm md:text-base tracking-widest font-bold text-white/40">
            <span>NEXUS STUDIO</span>
            <span>/</span>
            <span className="text-white/80">{isTemplateLab ? '模板实验室' : '放映厅预览'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save to library */}
          <button 
            className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-xs md:text-sm rounded-lg transition md:py-2 md:px-4 duration-200 flex items-center gap-1.5"
            onClick={saveToLibrary}
          >
            <Save className="w-3.5 h-3.5 text-accent-gold" />
            存入字幕库
          </button>

          {/* Style side toggle */}
          <button 
            className={`py-1.5 px-3 border text-xs md:text-sm font-bold rounded-lg transition md:py-2 md:px-4 duration-200 flex items-center gap-1.5
              ${isSettingsOpen 
                ? 'bg-accent-gold/10 border-accent-gold text-white' 
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'}`}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Sliders className="w-3.5 h-3.5" />
            样式参数
          </button>

          {/* Shared export dropdown */}
          <ExportDropdown variant="gold" />
        </div>
      </div>

      {/* Simulator canvas and side configuration overlay panels */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Main simulator screen wrapped in defensive ErrorBoundary */}
          <div className="flex-1 min-h-0 bg-surface-0">
            <SimulatorBoundary>
              <ScreenSimulator 
                subtitle={subtitleSlot}
                backdrop={backdropSlot}
                style={customStyle}
                previewIndex={previewIndex}
                theaterAspect={theaterAspect}
                guides={{ show: showGuides, temp: tempShowGuides }}
                triggerTempGuides={triggerTempGuides}
              />
            </SimulatorBoundary>
          </div>

          {/* Floating Slider dashboard below canvas screen */}
          {processedSubs && processedSubs.length > 0 && (
            <div className="bg-surface-2/80 backdrop-blur border-y border-white/5 px-6 py-2 z-10 w-full select-none flex-shrink-0">
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 flex items-center">
                  <input 
                    type="range" 
                    min="0" 
                    max={processedSubs.length - 1} 
                    value={previewIndex} 
                    onChange={e => setPreviewIndex(parseInt(e.target.value, 10))}
                    className="v9-timeline-dial-slider w-full"
                  />
                </div>
                
                <div className="v9-dial-gauge flex items-center gap-2 flex-shrink-0">
                  <span className="v9-dial-gauge-label text-xs md:text-sm">Line</span>
                  <input 
                    type="number"
                    min="1"
                    max={processedSubs.length}
                    value={previewIndex + 1}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setPreviewIndex(Math.max(0, Math.min(val - 1, processedSubs.length - 1)));
                      }
                    }}
                    className="v9-dial-gauge-input no-spin text-sm md:text-base w-12"
                    placeholder="1"
                  />
                  <div className="w-[1px] h-3 bg-white/20" />
                  <span className="v9-dial-gauge-value text-[#f2a900] text-sm md:text-base font-bold">{percentVal}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom ratios and scene settings deck */}
          <div className="p-6 bg-surface-0 flex-shrink-0">
            <ControlDeck />
          </div>
        </div>

        {/* Side Settings overlay Sidebar if toggled */}
        {isSettingsOpen && (
          <div className="pl-4 pr-8 py-6 shrink-0 h-full bg-surface-0">
            <div className="w-72 flex flex-col bg-surface-2 border border-white/10 rounded-2xl shrink-0 h-full overflow-y-auto shadow-2xl [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <StyleSidebar />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
