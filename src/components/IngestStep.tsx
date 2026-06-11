'use client';

import React, { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { DragZone } from '@/components/Ingest/DragZone';
import { TaskList } from '@/components/Ingest/TaskList';
import { TmdbPanel } from '@/components/Ingest/TmdbPanel';
import { Database, Trash2, Calendar, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const IngestStep: React.FC = () => {
  const { 
    tasks, 
    libraryList, 
    loadFromLibrary, 
    deleteFromLibrary, 
    setWorkflowStep,
    processedSubs
  } = useStudioStore();

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <div className="flex-1 w-full h-full flex flex-col p-3 md:p-4 lg:p-5 2xl:p-6 lg:overflow-hidden overflow-y-auto relative bg-[#050507] z-0">
      {/* Cinematic ambient lights - Violet Accent (toned down to reduce color cast on Windows Chrome) */}
      {/* 
        glow（环境光晕）: radial-gradient + 大 blur 值制造的柔和发光区域。
        用来模拟“空间中的光源”，增加景深（depth）和电影氛围。
        我们在这里把不透明度压得很低（0.018 / 0.01），因为多层 glow 在 Windows Chrome 上容易引起色差。
      */}
      <div className="absolute top-[-18%] left-[-8%] w-[50%] h-[50%] bg-violet-600/[0.012] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-6%] w-[40%] h-[40%] bg-violet-600/[0.006] rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Tech Grid System - heavily reduced to avoid moiré/visible texture on Windows Chrome + noise combo */}
      {/* 
        grid（背景网格）: 这里是用 CSS linear-gradient 模拟的极细格线（类似设计软件里的参考网格）。
        作用是增加“技术感”和结构感，而不是真正的 CSS Grid 布局。
        我们在 Windows Chrome 下大幅降低了不透明度，避免它和 film-grain 叠加产生明显底纹。
      */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_55%_45%_at_50%_38%,#000_80%,transparent_100%)] opacity-40 pointer-events-none -z-10" />
      
      {/* Hairline structural layout guides - reduced to avoid adding to visible texture on Windows */}
      <div className="absolute left-[5%] right-[5%] top-[14%] h-px bg-gradient-to-r from-transparent via-white/[0.015] to-transparent pointer-events-none -z-10" />
      <div className="absolute left-[5%] right-[5%] bottom-[12%] h-px bg-gradient-to-r from-transparent via-white/[0.015] to-transparent pointer-events-none -z-10" />

      {/* Micro-technical markings */}
      <div className="absolute top-4 left-6 text-[0.5625rem] font-mono text-neutral-600 tracking-[0.25em] select-none pointer-events-none uppercase">
        SYS_LOC.0x39F // BASEMENT_INIT
      </div>
      <div className="absolute top-4 right-6 text-[0.5625rem] font-mono text-neutral-600 tracking-[0.25em] select-none pointer-events-none uppercase">
        REF.NODE_CNST // EST_2026
      </div>

      {/* Animated drifting sparks (Lively Touch) */}
      <motion.div
        animate={{
          x: [0, -35, 20, 0],
          y: [0, 45, -15, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[30%] right-[15%] w-1.5 h-1.5 rounded-full bg-violet-500/20 blur-[1px] pointer-events-none -z-10"
      />
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -50, 25, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[20%] left-[25%] w-2 h-2 rounded-full bg-violet-500/10 blur-[1.5px] pointer-events-none -z-10"
      />

      {/* System Ticker / Monospace Eyebrow */}
      <div className="flex items-center gap-2 mb-2 select-none z-20 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
        <span className="text-[0.625rem] font-mono uppercase tracking-[0.3em] text-violet-400/70">
          阅片环境初始化 // 片源与字幕对齐绑定
        </span>
      </div>

      {/* Step Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-5 z-20 flex-shrink-0">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="text-h4 font-extrabold tracking-tighter text-white flex items-center flex-wrap [text-shadow:0_0_15px_rgba(255,255,255,0.15)] font-sans">
            substudio.
            <span className="text-[0.5625rem] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full ml-4 font-mono font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              v2.0.1
            </span>
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 font-mono uppercase tracking-wider text-neutral-400/80">
            professional dual-track subtitle ingestion & styling engine
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <button 
            className="px-5 py-2.5 glass-btn-ar rounded-full text-xs font-mono uppercase tracking-[0.1em] text-neutral-400 hover:text-white flex items-center gap-2 cursor-pointer border border-white/5 hover:border-violet-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all duration-300 group"
            onClick={() => setIsLibraryOpen(true)}
          >
            <Clock className="w-3.5 h-3.5 text-violet-400 group-hover:rotate-12 transition-transform" />
            历史存档字幕
            {libraryList.length > 0 && (
              <span className="bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full text-xs ml-1 font-bold">{libraryList.length}</span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tasks.length === 0 ? (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="flex-1 flex flex-col gap-8 max-w-5xl mx-auto w-full items-center justify-center py-8 md:py-12"
          >
            <DragZone />
          </motion.div>
        ) : (
          /* Task List when files are loaded - Split Grid Layout (2/3 TaskList, 1/3 TmdbPanel) */
          <motion.div 
            key="task-list-container"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="flex-1 desktop-panel-fit-hidden grid grid-cols-1 lg:grid-cols-3 gap-4 z-10 max-w-[1600px] mx-auto w-full relative"
          >
            {/* TMDB Panel Double-Bezel Wrapper */}
            <div className="lg:col-span-1 desktop-panel-fit-hidden min-w-0 p-1 bg-white/[0.01] border border-white/[0.04] rounded-[28px] shadow-2xl hover:border-violet-500/15 transition-colors duration-500">
              <TmdbPanel />
            </div>
            {/* TaskList Double-Bezel Wrapper */}
            <div className="lg:col-span-2 flex flex-col desktop-panel-fit-visible min-w-0 relative p-1 bg-white/[0.01] border border-white/[0.04] rounded-[28px] shadow-2xl hover:border-violet-500/15 transition-colors duration-500">
              <TaskList />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Library Modal */}
      <AnimatePresence>
        {isLibraryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[2000] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsLibraryOpen(false); }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass-panel-ar rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col gap-0 max-h-[85vh] overflow-hidden"
            >
              <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-violet-400" />
                  <h4 className="text-xl font-semibold text-white tracking-wide">历史存档字幕</h4>
                </div>
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                  onClick={() => setIsLibraryOpen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                {libraryList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {libraryList.map((item) => {
                      const isBilingual = item.subs.some(s => s.text.includes('\n'));
                      return (
                        <motion.div 
                          key={item.id}
                          whileHover={{ y: -1 }}
                          className="relative overflow-hidden p-7 bg-white/[0.018] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl cursor-pointer flex gap-6 transition-all duration-200 items-start justify-between group shadow-lg"
                          onClick={() => {
                            loadFromLibrary(item);
                            setIsLibraryOpen(false);
                          }}
                        >
                          {item.backdrop && (
                            <div 
                              className="absolute inset-0 bg-cover bg-center opacity-[0.06] group-hover:opacity-[0.12] transition-opacity -z-10 filter blur-[6px] scale-105"
                              style={{ backgroundImage: `url(${item.backdrop})` }}
                            />
                          )}

                          <div className="min-w-0 flex-1 border-l-2 border-transparent group-hover:border-violet-400 transition-colors duration-200 pl-4">
                            <h4 className="text-[15px] font-semibold text-white/95 group-hover:text-white leading-snug tracking-[-0.1px] line-clamp-2 transition-colors">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-3.5 mt-3 text-[12.5px] text-neutral-400 font-mono">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-white/35" />
                                {item.date}
                              </span>
                              <span className="w-px h-3 bg-white/15" />
                              <span className="font-medium text-white/70 tracking-normal">
                                {isBilingual ? '双语轨' : '单轨'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 z-10 pt-0.5">
                            <span className="text-white/80 font-mono text-sm font-semibold tabular-nums tracking-[-0.2px]">
                              {item.subs.length} 行
                            </span>
                            <button 
                              className="text-white/20 hover:text-rose-400 p-1.5 -mr-1.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); deleteFromLibrary(item.id); }}
                              title="删除存档"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-white/30">
                    <Database className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-medium text-sm tracking-wide">暂无存档的字幕项目</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
