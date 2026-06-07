'use client';

import React, { useState } from 'react';
import { useStudioStore, TmdbMetadata } from '@/store/useStudioStore';
import { Search, Film, Star, X, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TmdbPanel: React.FC = () => {
  const {
    tmdbData,
    tmdbManualOpen,
    setTmdbManualOpen,
    tmdbManualInput,
    setTmdbManualInput,
    tmdbSuggestions,
    selectedSuggestion,
    searchTmdb,
    selectTmdbSuggestion,
    isSearchingTmdb
  } = useStudioStore();

  const [pendingSuggestion, setPendingSuggestion] = useState<any>(null);

  const handleManualSearch = async () => {
    const searchStr = tmdbManualInput.title.trim();
    if (!searchStr) return;
    setPendingSuggestion(null);
    await useStudioStore.getState().searchTmdbManual(searchStr, tmdbManualInput.type, tmdbManualInput.year);
  };

  const handleConfirmSelection = async () => {
    if (!pendingSuggestion) return;
    await selectTmdbSuggestion(pendingSuggestion);
    setPendingSuggestion(null);
    setTmdbManualOpen(false);
  };

  const handleClose = () => {
    setPendingSuggestion(null);
    setTmdbManualOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 bg-white/[0.01] border border-white/5 p-6 rounded-3xl h-full relative overflow-hidden backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group">
      
      {/* Cinematic Poster Background Blur */}
      {tmdbData?.posterUrl && (
        <motion.div 
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 0.15 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center -z-10 filter blur-[15px] pointer-events-none"
          style={{ backgroundImage: `url(${tmdbData.posterUrl})` }}
        />
      )}
      
      <div className="flex justify-between items-center pb-4 border-b border-white/[0.05] z-10">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-white tracking-wide">
            元数据检索
          </h3>
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity flex items-center h-5" title="Powered by TMDB">
            <img src="/tmdb_logo_blue_square.svg" alt="Powered by TMDB" className="h-full w-auto object-contain" />
          </a>
        </div>
        <button
          className="px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-full border border-white/5 text-white/50 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          onClick={() => setTmdbManualOpen(true)}
        >
          <Search className="w-3.5 h-3.5" />
          检索
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 z-10">
        {tmdbData ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex flex-col gap-6 h-full pb-6"
          >
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {tmdbData.posterUrl ? (
                <img
                  src={tmdbData.posterUrl}
                  alt={tmdbData.title}
                  className="w-32 md:w-40 h-48 md:h-60 object-cover rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/10 flex-shrink-0 transition-transform hover:scale-[1.02]"
                />
              ) : (
                <div className="w-32 md:w-40 h-48 md:h-60 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-center text-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex-shrink-0">
                  <Film className="w-8 h-8" />
                </div>
              )}

              <div className="flex-1 flex flex-col gap-4 pt-2 text-left min-w-0">
                <div>
                  <h4 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">{tmdbData.title}</h4>
                  {tmdbData.originalTitle && (
                    <p className="text-sm text-white/40 mt-2 font-mono truncate">{tmdbData.originalTitle}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {tmdbData.year && (
                    <span className="px-2.5 py-1 bg-white/10 border border-white/5 shadow-inner rounded-md text-xs font-bold font-mono text-white tracking-widest">
                      {tmdbData.year}
                    </span>
                  )}
                  {tmdbData.voteAverage > 0 && (
                    <span className="px-2.5 py-1 bg-accent-gold/10 text-accent-gold border border-accent-gold/20 shadow-inner rounded-md text-xs font-bold font-mono flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-accent-gold" />
                      {tmdbData.voteAverage.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Tags or Extra info could go here */}
              </div>
            </div>

            <div className="bg-transparent mt-2 border-l-4 border-accent-gold/50 pl-5 py-2 text-base md:text-lg font-medium text-white/80 leading-relaxed font-sans">
              {tmdbData.overview || '暂无剧情简介...'}
            </div>

            {tmdbData.isAnime && (
              <div className="mt-4 px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-bold w-max shadow-inner">
                ✨ 已匹配动漫预设模板
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Database className="w-10 h-10 text-white/10 mb-4" />
            <span className="text-sm text-white/40">暂未匹配影视元数据<br/>处理列表中的任务将自动触发云端检索</span>
          </div>
        )}
      </div>

      {/* Manual Search Floating Modal */}
      <AnimatePresence>
        {tmdbManualOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[2000] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[#050507] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col gap-0 max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/5">
                <h4 className="text-base font-bold text-white tracking-wide">手动检索</h4>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-white/[0.03] border border-white/5 focus:bg-white/[0.05] focus:border-accent-gold/50 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none transition-all shadow-inner"
                      value={tmdbManualInput.title}
                      onChange={e => setTmdbManualInput({ ...tmdbManualInput, title: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                      placeholder="输入电影或剧集名称..."
                      autoFocus
                    />
                    <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                  
                  <div className="flex gap-3">
                    <select
                      className="bg-white/[0.03] border border-white/5 focus:border-accent-gold/50 rounded-xl py-3 px-4 text-white text-sm outline-none transition-all cursor-pointer shadow-inner flex-1"
                      value={tmdbManualInput.type}
                      onChange={e => setTmdbManualInput({ ...tmdbManualInput, type: e.target.value as any })}
                    >
                      <option value="movie">电影 (Movie)</option>
                      <option value="tv">剧集 (TV Show)</option>
                    </select>
                    <input
                      type="number"
                      className="w-1/3 bg-white/[0.03] border border-white/5 focus:border-accent-gold/50 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none transition-all shadow-inner placeholder:text-white/30"
                      value={tmdbManualInput.year}
                      onChange={e => setTmdbManualInput({ ...tmdbManualInput, year: e.target.value })}
                      placeholder="年份 (可选)"
                    />
                  </div>

                  {tmdbManualInput.type === 'tv' && (
                    <div className="flex gap-3">
                      <input
                        type="number" min="1"
                        className="flex-1 bg-white/[0.03] border border-white/5 focus:border-accent-gold/50 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none transition-all shadow-inner placeholder:text-white/30"
                        value={tmdbManualInput.season || ''}
                        onChange={e => setTmdbManualInput({ ...tmdbManualInput, season: e.target.value })}
                        placeholder="季 S01 (可选)"
                      />
                      <input
                        type="number" min="1"
                        className="flex-1 bg-white/[0.03] border border-white/5 focus:border-accent-gold/50 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none transition-all shadow-inner placeholder:text-white/30"
                        value={tmdbManualInput.episode || ''}
                        onChange={e => setTmdbManualInput({ ...tmdbManualInput, episode: e.target.value })}
                        placeholder="集 E01 (可选)"
                      />
                    </div>
                  )}

                  <button
                    className="w-full py-4 bg-white hover:bg-white/90 text-black font-bold text-sm rounded-xl transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:scale-[1.01] flex items-center justify-center gap-2"
                    onClick={handleManualSearch}
                    disabled={isSearchingTmdb}
                  >
                    {isSearchingTmdb ? (
                      <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {isSearchingTmdb ? '检索中...' : '开始检索'}
                  </button>
                </div>

                {/* Candidates List */}
                {tmdbSuggestions.length > 0 && (
                  <div className="flex flex-col gap-3 mt-4">
                    <span className="text-xs text-white/50 font-medium">候选结果 ({tmdbSuggestions.length})</span>
                    <div className="flex flex-col gap-2">
                      {tmdbSuggestions.map(s => {
                        const isChosen = pendingSuggestion?.id === s.id || (!pendingSuggestion && selectedSuggestion?.id === s.id);
                        const year = s.release_date ? s.release_date.slice(0, 4) : s.first_air_date ? s.first_air_date.slice(0, 4) : '';
                        const mediaType = s.media_type === 'movie' ? '电影' : '剧集';
                        const posterUrl = s.poster_path ? `https://image.tmdb.org/t/p/w92${s.poster_path}` : null;

                        return (
                          <div
                            key={s.id}
                            className={`w-full p-3 rounded-xl flex items-center gap-4 text-left transition-all border cursor-pointer
                              ${isChosen
                                ? 'bg-accent-gold/[0.05] border-accent-gold/50 shadow-[0_0_20px_rgba(242,169,0,0.1)]'
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                              }`}
                            onClick={() => setPendingSuggestion(s)}
                          >
                            <div className="flex-shrink-0 w-10 h-14 rounded-md overflow-hidden bg-black/50 border border-white/10">
                              {posterUrl ? (
                                <img src={posterUrl} alt={s.title || s.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                  <Film className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <span className={`text-sm font-bold truncate ${isChosen ? 'text-accent-gold' : 'text-white/90'}`}>
                                {s.title || s.name}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                {year && <span className="text-[10px] text-white/40 font-mono">{year}</span>}
                                <span className="text-[10px] font-medium text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
                                  {mediaType}
                                </span>
                                {s.vote_average > 0 && (
                                  <span className="text-[10px] text-accent-gold font-mono flex items-center gap-0.5">
                                    ★ {s.vote_average.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center px-6 py-5 border-t border-white/5 bg-black/20">
                <div className="text-sm text-white/50">
                  {pendingSuggestion ? (
                    <span className="text-white">已选择 <strong className="text-accent-gold">{pendingSuggestion.title || pendingSuggestion.name}</strong></span>
                  ) : (
                    '请选择匹配项'
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition text-sm font-bold"
                    onClick={handleClose}
                  >
                    取消
                  </button>
                  <button
                    className="px-6 py-2.5 bg-accent-gold hover:bg-accent-gold/90 text-black font-bold text-sm rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(242,169,0,0.2)]"
                    onClick={handleConfirmSelection}
                    disabled={!pendingSuggestion}
                  >
                    确认应用
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
