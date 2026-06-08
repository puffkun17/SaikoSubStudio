'use client';

import React, { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { ScreenSimulator } from '@/components/Theater/ScreenSimulator';
import { SimulatorBoundary } from '@/components/Theater/SimulatorBoundary';
import { ControlDeck } from '@/components/Theater/ControlDeck';
import { StyleSidebar } from '@/components/Settings/StyleSidebar';
import { ExportDropdown } from '@/hooks/useExport';
import { Save, ChevronLeft, Sliders } from 'lucide-react';
import { SubtitleDataSlot, BackdropSlot } from '@/types/subtitleTypes';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative bg-[#050507]">
      
      {/* Symmetrical Top Navbar */}
      <div className="flex justify-between items-center px-6 h-[52px] bg-[#030305]/40 backdrop-blur-md border-b border-white/[0.06] z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.03, y: -0.5 }}
              whileTap={{ scale: 0.97 }}
              className="p-2 glass-btn-ar rounded-lg flex items-center justify-center cursor-pointer text-neutral-400 hover:text-neutral-200"
              onClick={handleBack}
              title="返回工作台"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
          </div>
          
          <div className="flex items-center gap-2 text-base tracking-widest font-mono font-bold text-neutral-400 uppercase">
            <span>studio</span>
            <span>//</span>
            <span className="text-neutral-200 [text-shadow:0_0_8px_rgba(255,255,255,0.15)]">{isTemplateLab ? '模板实验室' : '放映厅模式'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Style sidebar toggle */}
          <motion.button 
            whileHover={{ scale: 1.02, y: -0.5 }}
            whileTap={{ scale: 0.98 }}
            className={`py-2 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer
              ${isSettingsOpen ? 'glass-btn-ar-active' : 'glass-btn-ar text-neutral-350 hover:text-white'}`}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title="样式配置选项"
          >
            <Sliders className="w-4 h-4" />
            样式参数
          </motion.button>

          {/* Save to library */}
          <motion.button 
            whileHover={{ scale: 1.02, y: -0.5 }}
            whileTap={{ scale: 0.98 }}
            className="py-2 px-4.5 glass-btn-ar text-neutral-200 font-bold text-sm uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            onClick={saveToLibrary}
          >
            <Save className="w-4 h-4 text-violet-400" />
            存入字幕库
          </motion.button>

          {/* Shared export dropdown */}
          <ExportDropdown variant="ghost" />
        </div>
      </div>

      {/* Top settings bar (ControlDeck) - Fully separated from preview */}
      <div className="w-full bg-[#030305]/60 backdrop-blur-sm border-b border-white/[0.06] py-2.5 px-6 z-45 flex-shrink-0 select-none">
        <ControlDeck />
      </div>

      {/* Simulator canvas and sidebar overlays */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <div className={`flex-1 flex flex-col min-w-0 relative pb-2 transition-all duration-300 ${isSettingsOpen ? 'lg:pr-[364px]' : 'pr-0'}`}>
          
          {/* Main simulator screen wrapped in defensive ErrorBoundary */}
          <div className="flex-1 min-h-0 bg-[#050507] z-10 relative">
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

          {/* Bottom compact timeline slider (Non-absolute, sits under preview cleanly) */}
          {processedSubs && processedSubs.length > 0 && (
            <div className="w-[96%] max-w-5xl mx-auto z-30 glass-panel-ar rounded-2xl p-4 flex flex-row items-center gap-5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5)] transition-all duration-300 mt-2 mb-4 flex-shrink-0">
              
              {/* Timeline Slider and Input indicator */}
              <div className="flex-1 h-12 rounded-xl px-4 bg-white/[0.02] border border-white/[0.06] flex items-center relative group/slider">
                <input 
                  type="range" 
                  min="0" 
                  max={processedSubs.length - 1} 
                  value={previewIndex} 
                  onChange={e => setPreviewIndex(parseInt(e.target.value, 10))}
                  className="w-full glass-slider-input cursor-pointer"
                />
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0 font-mono">
                <span className="text-sm text-neutral-400 uppercase tracking-widest font-bold">行</span>
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
                  className="bg-white/[0.03] border border-white/[0.08] text-violet-400 text-base rounded-lg py-1.5 px-3 w-20 outline-none focus:border-white/20 text-center font-bold font-mono"
                  placeholder="1"
                />
                <div className="w-[1px] h-4.5 bg-white/[0.08]" />
                <motion.span 
                  key={percentVal}
                  animate={{ scale: [1, 1.05, 1] }}
                  className="text-violet-400 text-sm font-mono font-bold w-16 text-right [text-shadow:0_0_8px_rgba(168,85,247,0.35)]"
                >
                  {percentVal}%
                </motion.span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Style Drawer */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-6 top-6 bottom-6 w-[340px] z-50 glass-panel-ar rounded-3xl overflow-hidden flex flex-col"
            >
              <StyleSidebar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
