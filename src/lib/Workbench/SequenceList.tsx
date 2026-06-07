'use client';

import React, { useEffect, useRef } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { isLyricText } from '@/utils/subtitleCore';
import { ChevronDown } from 'lucide-react';

export const SequenceList: React.FC = () => {
  const { processedSubs, previewIndex, setPreviewIndex, setJumpLineVal, showAllSubs, setShowAllSubs } = useStudioStore();
  const listRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef<number>(-1);

  // #15 — Auto-scroll active row without scrolling the entire page wrapper
  useEffect(() => {
    if (previewIndex === prevIndexRef.current) return;
    prevIndexRef.current = previewIndex;
    const el = document.getElementById(`wb-row-${previewIndex}`);
    const container = listRef.current;
    if (el && container) {
      // Calculate position to center the element within the scroll container
      // offsetTop of element is relative to its closest positioned ancestor (which might be the scrolling container if it's relative)
      // Actually, if listRef has no position relative, offsetTop is to the body.
      // A safer calculation:
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollTop = container.scrollTop + (elRect.top - containerRect.top) - (containerRect.height / 2) + (elRect.height / 2);
      
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }, [previewIndex]);

  const handleRowClick = (sub: any) => {
    setPreviewIndex(sub.index - 1);
    setJumpLineVal(String(sub.index));
  };

  const total = processedSubs?.length ?? 0;
  const LIMIT = 80;
  const visibleSubs = processedSubs
    ? (showAllSubs ? processedSubs : processedSubs.slice(0, LIMIT))
    : [];
  const hasMore = !showAllSubs && total > LIMIT;

  return (
    <div className="flex-1 overflow-hidden bg-black/30 border border-white/5 rounded-2xl flex flex-col">
      {/* #3 — Row count header */}
      {total > 0 && (
        <div className="flex items-center justify-between px-8 py-2.5 border-b border-white/5 flex-shrink-0">
          <span className="text-[10px] font-mono text-white/30 tracking-widest">
            {showAllSubs ? `全部 ${total} 行` : `显示 ${Math.min(LIMIT, total)} / ${total} 行`}
          </span>
          {!showAllSubs && hasMore && (
            <button
              onClick={() => setShowAllSubs(true)}
              className="flex items-center gap-1 text-[10px] text-accent-gold/70 hover:text-accent-gold transition font-medium"
            >
              <ChevronDown className="w-3 h-3" />
              展开全部
            </button>
          )}
        </div>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto">
        {visibleSubs.length > 0 ? (
          <div className="flex flex-col">
            {visibleSubs.map((sub) => {
              const isActive = previewIndex === (sub.index - 1);
              const zhText = sub.text.split('\n')[0] || '';
              const enText = sub.text.split('\n')[1] || '';
              const isLyric = isLyricText(sub.text);

              return (
                <div
                  key={sub.index}
                  id={`wb-row-${sub.index - 1}`}
                  onClick={() => handleRowClick(sub)}
                  className={`flex gap-6 py-4 px-8 border-b border-white/[0.02] transition-all duration-300 cursor-pointer text-left
                    ${isActive ? 'bg-white/[0.05] border-l-2 border-l-accent-gold' : 'bg-transparent hover:bg-white/[0.01] border-l-2 border-l-transparent'}
                    ${isLyric && !isActive ? 'border-l-2 border-l-accent-gold/30 bg-accent-gold/[0.02]' : ''}`}
                >
                  <div className="w-40 font-mono text-xs text-accent-gold/80 self-center tracking-wider flex items-center gap-2">
                    {isLyric && <span className="text-[10px] animate-pulse">🎵</span>}
                    {sub.ts.replace(' --> ', ' - ')}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>
                      {zhText.replace(/\\N/g, ' ')}
                    </div>
                    {enText && (
                      <div className="text-xs text-accent-gold/70 mt-0.5 font-light">
                        {enText.replace(/\\N/g, ' ')}
                      </div>
                    )}
                  </div>
                  <div className={`w-12 font-mono text-[10px] text-right self-center ${isActive ? 'text-accent-gold font-bold' : 'text-white/30'}`}>
                    #{sub.index}
                  </div>
                </div>
              );
            })}

            {/* #3 — Show more footer */}
            {hasMore && (
              <button
                onClick={() => setShowAllSubs(true)}
                className="flex items-center justify-center gap-2 py-4 text-xs text-white/30 hover:text-white/60 transition border-t border-white/5"
              >
                <ChevronDown className="w-4 h-4" />
                还有 {total - LIMIT} 行未展示，点击加载全部
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/20 text-xs py-20">
            无字幕对齐数据
          </div>
        )}
      </div>
    </div>
  );
};
