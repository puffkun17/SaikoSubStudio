'use client';

import React, { useState } from 'react';
import { useStudioStore, LibraryItem } from '@/store/useStudioStore';
import { DragZone } from '@/components/Ingest/DragZone';
import { TaskList } from '@/components/Ingest/TaskList';
import { TmdbPanel } from '@/components/Ingest/TmdbPanel';
import { Database, Trash2, Calendar, FolderHeart, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const IngestStep: React.FC = () => {
  const { 
    tasks, 
    libraryList, 
    loadFromLibrary, 
    deleteFromLibrary, 
    setWorkflowStep,
    setProcessedSubs,
    processedSubs
  } = useStudioStore();

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <div className="flex-1 w-full h-full flex flex-col p-6 md:p-10 2xl:p-16 overflow-y-auto relative bg-[#060608] z-0">
      {/* Cinematic ambient lights - Strict Gold Only */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#f2a900]/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#f2a900]/[0.02] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Step Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12 z-20">
        <div className="flex flex-col gap-1.5 text-left">
          <h1 className="text-3xl md:text-4xl 2xl:text-5xl font-bold tracking-tight text-white flex items-center flex-wrap">
            SUBSTUDIOX
            <span className="text-xs md:text-sm text-accent-gold bg-accent-gold/10 border border-accent-gold/20 px-2.5 py-1 rounded-md ml-4 font-mono font-bold uppercase tracking-wider">
              V1.0 PRO
            </span>
          </h1>
          <p className="text-sm text-white/50 font-medium">
            Professional Dual-Track Subtitle Ingestion & Styling Station
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <button 
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-full text-sm font-bold transition duration-200 text-white/80 hover:text-white backdrop-blur-md flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            onClick={() => setIsLibraryOpen(true)}
          >
            <Clock className="w-4 h-4 text-accent-gold" />
            历史存档字幕
            {libraryList.length > 0 && (
              <span className="bg-accent-gold/20 text-accent-gold px-2 py-0.5 rounded-full text-xs ml-1">{libraryList.length}</span>
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
            className="flex-1 flex flex-col gap-12 max-w-5xl mx-auto w-full items-center justify-center py-10 md:py-16"
          >
            <DragZone />

            {/* Library list removed from main view */}
          </motion.div>
        ) : (
          /* Bento Grid when files are loaded */
          <motion.div 
            key="bento-grid"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 25, staggerChildren: 0.1 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 overflow-hidden min-h-0 relative"
          >
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5 h-full overflow-hidden flex flex-col min-h-[400px] z-10"
            >
              <TmdbPanel />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-7 h-full overflow-hidden flex flex-col min-h-[500px] z-10"
            >
              <TaskList />
            </motion.div>
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
              className="bg-[#050507] border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col gap-0 max-h-[85vh] overflow-hidden"
            >
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-accent-gold" />
                  <h4 className="text-base font-bold text-white tracking-wide">历史存档字幕</h4>
                </div>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition"
                  onClick={() => setIsLibraryOpen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {libraryList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {libraryList.map((item) => {
                      const isBilingual = item.subs.some(s => s.text.includes('\n'));
                      return (
                        <motion.div 
                          key={item.id}
                          whileHover={{ y: -2 }}
                          className="relative overflow-hidden p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl cursor-pointer flex gap-5 transition-all duration-300 items-center justify-between group shadow-lg"
                          onClick={() => {
                            loadFromLibrary(item);
                            setIsLibraryOpen(false);
                          }}
                        >
                          {item.backdrop && (
                            <div 
                              className="absolute inset-0 bg-cover bg-center opacity-[0.05] group-hover:opacity-[0.1] transition-opacity -z-10 filter blur-[8px] scale-110"
                              style={{ backgroundImage: `url(${item.backdrop})` }}
                            />
                          )}

                          <div className="min-w-0 flex-1 pl-2 border-l-2 border-transparent group-hover:border-accent-gold transition-colors duration-300">
                            <h4 className="text-base font-bold text-white/90 group-hover:text-white truncate transition-colors pl-3">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary font-mono pl-3">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-white/40" />
                                {item.date}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span className="text-white/60 font-sans font-medium">
                                {isBilingual ? '双语轨' : '单轨'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 z-10">
                            <span className="text-white/50 font-mono text-xs">
                              {item.subs.length} 行
                            </span>
                            <button 
                              className="text-white/20 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
                              onClick={(e) => { e.stopPropagation(); deleteFromLibrary(item.id); }}
                            >
                              <Trash2 className="w-4 h-4 md:w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-white/30">
                    <Database className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-medium text-sm">暂无存档的字幕项目</p>
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
