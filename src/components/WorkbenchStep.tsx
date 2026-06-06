'use client';

import React, { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { SequenceList } from '@/components/Workbench/SequenceList';
import { TimelineControls } from '@/components/Workbench/TimelineControls';
import { ExportDropdown } from '@/hooks/useExport';
import { ChevronLeft, Eye, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WorkbenchStep: React.FC = () => {
  const { 
    processedSubs, 
    customFilename, 
    restartSystem, 
    setWorkflowStep,
    setProcessedSubs,
    addLog
  } = useStudioStore();

  // #1 — Back navigation confirmation
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const handleBack = () => {
    if (processedSubs && processedSubs.length > 0) {
      setShowBackConfirm(true);
    } else {
      setWorkflowStep(1);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-white/5 bg-[#0a0a0d] gap-4 z-50 flex-shrink-0">
        <div className="flex items-center gap-4 text-left">
          <div className="relative">
            <button 
              className="p-2 hover:bg-white/5 border border-white/10 rounded-xl transition duration-200"
              onClick={handleBack}
              title="返回上传配对页面"
            >
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </button>

            {/* #1 — Inline back confirm */}
            <AnimatePresence>
              {showBackConfirm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 z-50 bg-[#18181c] border border-white/10 rounded-2xl p-4 w-64 shadow-2xl"
                >
                  <p className="text-xs text-white/70 leading-relaxed mb-3">
                    返回将<span className="text-rose-400 font-bold"> 清除当前对齐数据</span>，确认？
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition"
                      onClick={() => setShowBackConfirm(false)}
                    >
                      取消
                    </button>
                    <button
                      className="flex-1 py-1.5 text-xs font-bold bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg transition"
                      onClick={() => { setShowBackConfirm(false); setProcessedSubs(null); setWorkflowStep(1); }}
                    >
                      确认返回
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">时间轴工作台</h2>
            <p className="text-[10px] text-accent-gold font-mono mt-0.5">
              {processedSubs?.length || 0} 行字幕对齐就绪 | {customFilename}
            </p>
          </div>
        </div>

        {/* Timeline Slider and controls in header */}
        <div className="flex items-center gap-4 flex-wrap">
          <TimelineControls />

          {/* #16 — Shared export dropdown */}
          <ExportDropdown variant="ghost" />

          <div className="w-[1px] h-6 bg-white/10 hidden md:block" />

          {/* Preview scene */}
          <button 
            className="py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5"
            onClick={() => setWorkflowStep(3)}
          >
            <Eye className="w-3.5 h-3.5 text-accent-gold" />
            放映厅预览
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split stage */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 p-6 min-h-0 overflow-hidden flex flex-col items-center">
          <div className="max-w-5xl w-full flex-1 min-h-0 flex flex-col overflow-hidden">
            <SequenceList />
          </div>
        </div>
      </div>

      {/* Click-outside overlay to close back confirm */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-10" onClick={() => setShowBackConfirm(false)} />
      )}
    </div>
  );
};
