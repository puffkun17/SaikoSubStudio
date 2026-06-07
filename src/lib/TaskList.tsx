'use client';

import React, { useRef, useState } from 'react';
import { useStudioStore, TaskPair, Subfile } from '@/store/useStudioStore';
import { Play, Plus, X } from 'lucide-react';
import { parseSrt, decodeBuffer, detectLanguageByContent, checkIsBilingual, StyleSettings } from '@/utils/subtitleCore';
import { motion, AnimatePresence } from 'framer-motion';
import { TrackSelect } from '@/components/Ingest/TrackSelect';

const getLangBadge = (lang?: string) => {
  switch(lang) {
    case 'zh-CN': return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/40 whitespace-nowrap shadow-[0_0_8px_rgba(59,130,246,0.5)] [text-shadow:0_0_4px_rgba(59,130,246,0.8)]">简</span>;
    case 'zh-TW': return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/40 whitespace-nowrap shadow-[0_0_8px_rgba(168,85,247,0.5)] [text-shadow:0_0_4px_rgba(168,85,247,0.8)]">繁</span>;
    case 'en': return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/40 whitespace-nowrap shadow-[0_0_8px_rgba(34,197,94,0.5)] [text-shadow:0_0_4px_rgba(34,197,94,0.8)]">英</span>;
    case 'bilingual': return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-accent-gold/10 text-accent-gold border border-accent-gold/40 whitespace-nowrap shadow-[0_0_8px_rgba(242,169,0,0.5)] [text-shadow:0_0_4px_rgba(242,169,0,0.8)]">双语</span>;
    case 'commentary': return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/40 whitespace-nowrap shadow-[0_0_8px_rgba(244,63,94,0.5)] [text-shadow:0_0_4px_rgba(244,63,94,0.8)]">导</span>;
    case 'zh': return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/40 whitespace-nowrap shadow-[0_0_8px_rgba(59,130,246,0.5)] [text-shadow:0_0_4px_rgba(59,130,246,0.8)]">中</span>;
    default: return null;
  }
};

const truncateMiddle = (text: string, maxLength: number = 45) => {
  if (!text || text.length <= maxLength) return text;
  const charsToShow = maxLength - 3;
  const frontChars = Math.ceil(charsToShow * 0.5);
  const backChars = Math.floor(charsToShow * 0.5);
  return text.substring(0, frontChars) + '...' + text.substring(text.length - backChars);
};

export const TaskList: React.FC = () => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { 
    tasks, 
    selectedTaskId, 
    selectTask, 
    bindTrack, 
    removeFileFromTask, 
    deleteTask, 
    uploadedFiles,
    customFilename,
    setCustomFilename,
    isProcessing,
    runSubtitleMerge,
    showAssHint,
    setShowAssHint,
    foundAssStyle,
    setCustomStyle,
    setActivePreset,
    addLog,
    lang,
    alignmentMode,
    setAlignmentMode
  } = useStudioStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const readAndDecodeFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const decoded = decodeBuffer(reader.result as ArrayBuffer);
          resolve(decoded.text);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFilesProcess = async (filesList: File[]) => {
    if (filesList.length === 0) return;
    const detectedFiles: Subfile[] = [];
    const { processFiles, addLog } = useStudioStore.getState();

    for (const file of filesList) {
      const nameLower = file.name.toLowerCase();
      if (nameLower.endsWith('.srt') || nameLower.endsWith('.ass')) {
        try {
          const text = await readAndDecodeFile(file);
          const isBilingual = checkIsBilingual(text);
          const langDetect = isBilingual ? 'bilingual' : detectLanguageByContent(text);
          
          detectedFiles.push({
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
            name: file.name,
            text,
            lang: langDetect,
            isBilingual,
            isCommentary: /(commentary|comment|director|解说|导轨)/i.test(file.name),
            size: text.length
          });
        } catch (error: unknown) {
          addLog(`读取文件 ${file.name} 失败: ${(error as Error).message}`, "error");
        }
      }
    }

    if (detectedFiles.length > 0) {
      processFiles(detectedFiles);
    }
  };

  const getSubTitleCount = (file: Subfile | null | undefined) => {
    if (!file || !file.text) return 0;
    try {
      if (file.text.includes('[Events]') && file.text.includes('Dialogue:')) {
        return file.text.split('\n').filter((l: string) => l.trim().startsWith('Dialogue:')).length;
      }
      return parseSrt(file.text).length;
    } catch (e) {
      return 0;
    }
  };

  const getProcessBtnText = (task: TaskPair) => {
    if (task.isBilingualSingle) {
      return '加载原生双语 (Load Native)';
    }
    const hasZh = !!task.zh;
    const hasEn = !!task.en;
    if (hasZh && hasEn) {
      return '合并双语轴 (Bilingual Merge)';
    } else {
      return '加载单轨时间轴 (Load Single)';
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-white/[0.01] border border-white/5 p-6 rounded-3xl h-full overflow-hidden backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
        <h3 className="text-base font-bold text-white tracking-wide">
          待处理任务 <span className="text-white/40 font-mono ml-2">{tasks.length}</span>
        </h3>
        <button 
          className="px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-full border border-white/5 text-white text-xs flex items-center gap-1.5 font-medium transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="w-3.5 h-3.5 text-accent-gold" />
          关联文件
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-1">
        <AnimatePresence>
          {tasks.map(task => {
            const isSelected = selectedTaskId === task.id;
            const isPaired = task.zh && task.en;
            
            const zhCount = getSubTitleCount(task.zh);
            const enCount = getSubTitleCount(task.en);
            let diffBadge = null;
            if (task.zh && task.en) {
              const max = Math.max(zhCount, enCount);
              const diffRatio = max > 0 ? Math.abs(zhCount - enCount) / max : 0;
              if (diffRatio <= 0.05) {
                diffBadge = <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] rounded flex-shrink-0 tracking-wide font-medium">● 完美对齐</span>;
              } else if (diffRatio <= 0.15) {
                diffBadge = <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] rounded flex-shrink-0 tracking-wide font-medium">▲ 行数微差</span>;
              } else {
                diffBadge = <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] rounded flex-shrink-0 tracking-wide font-medium">■ 轨道不匹配</span>;
              }
            }
            
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                key={task.id}
                className={`transition-colors duration-300 cursor-pointer flex flex-col border-b border-white/[0.03] last:border-0
                  ${isSelected ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
                onClick={() => selectTask(task.id)}
              >
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden group/title">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPaired ? 'bg-accent-gold' : 'bg-white/20'}`} />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <span className="block text-sm font-bold text-white truncate whitespace-nowrap pr-1" title={task.title}>
                          {task.title}
                        </span>
                      </div>
                      {diffBadge}
                    </div>
                    {/* #13 — Two-step delete confirmation */}
                    {pendingDeleteId === task.id ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          className="text-[10px] font-bold px-2 py-1 rounded-md bg-rose-500 text-white hover:bg-rose-600 transition"
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); setPendingDeleteId(null); }}
                        >
                          确认
                        </button>
                        <button
                          className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/5 text-white/50 hover:bg-white/10 transition"
                          onClick={(e) => { e.stopPropagation(); setPendingDeleteId(null); }}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="text-rose-400/40 hover:text-rose-400 transition flex-shrink-0 p-1.5 rounded-full hover:bg-rose-500/10 active:scale-95"
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(task.id); }}
                        title="删除任务"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sub-files preview */}
                  <div className="pl-4 border-l-2 border-white/5 flex flex-col gap-2 text-xs text-white/50 font-mono">
                    <div className="flex justify-between items-center gap-3 min-w-0 group/file1">
                      <span className="text-[10px] font-sans font-bold flex-shrink-0 w-6 text-left text-white/50">主轨</span>
                      <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                        {task.zh && getLangBadge(task.zh.lang)}
                        <span className="block truncate text-white/60 whitespace-nowrap" title={task.zh ? task.zh.name : '未上传'}>{task.zh ? truncateMiddle(task.zh.name, 45) : '未上传'}</span>
                      </div>
                      {task.zh && <span className="text-white/30 flex-shrink-0">{zhCount} lines</span>}
                    </div>
                    <div className="flex justify-between items-center gap-3 min-w-0 group/file2">
                      <span className="text-[10px] font-sans font-bold flex-shrink-0 w-6 text-left text-white/50">次轨</span>
                      <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                        {task.en && getLangBadge(task.en.lang)}
                        <span className="block truncate text-white/60 whitespace-nowrap" title={task.en ? task.en.name : '未上传'}>{task.en ? truncateMiddle(task.en.name, 45) : '未上传'}</span>
                      </div>
                      {task.en && <span className="text-white/30 flex-shrink-0">{enCount} lines</span>}
                    </div>
                  </div>
                </div>

                {/* Integrated Control Panel when selected */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="p-5 bg-black/20 flex flex-col gap-5 text-sm text-left">
                        <div className="flex flex-col gap-3">
                          {/* Chinese binding */}
                          <div className="flex items-center gap-3">
                            <span className="w-8 text-[11px] font-bold text-left flex-shrink-0 text-white/50">主轨</span>
                            <TrackSelect
                              value={task.zh?.id || ''}
                              options={uploadedFiles.map(f => ({ id: f.id, name: f.name, count: getSubTitleCount(f), lang: f.lang }))}
                              onChange={(id) => bindTrack(task.id, 'zh', id)}
                              countLabel={task.zh ? getSubTitleCount(task.zh) : null}
                            />
                          </div>

                          {/* Track Bindings or Bilingual Hint */}
                        {!task.isBilingualSingle ? (
                          <>
                            {/* English binding */}
                            <div className="flex items-center gap-3">
                              <span className="w-8 text-[11px] font-bold text-left flex-shrink-0 text-white/50">次轨</span>
                              <TrackSelect
                                value={task.en?.id || ''}
                                options={uploadedFiles.map(f => ({ id: f.id, name: f.name, count: getSubTitleCount(f), lang: f.lang }))}
                                onChange={(id) => bindTrack(task.id, 'en', id)}
                                countLabel={task.en ? getSubTitleCount(task.en) : null}
                              />
                            </div>

                            {/* Commentary binding */}
                            <div className="flex items-center gap-3">
                              <span className="w-8 text-[11px] font-bold text-left flex-shrink-0 text-white/50">评论</span>
                              <TrackSelect
                                value={task.commentary?.id || ''}
                                options={uploadedFiles.map(f => ({ id: f.id, name: f.name, count: getSubTitleCount(f), lang: f.lang }))}
                                onChange={(id) => bindTrack(task.id, 'commentary', id)}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center py-3 bg-white/[0.02] border border-white/5 rounded-lg">
                            <span className="text-xs text-white/70 font-medium">系统已检测到原生双语，无需挂载外轨</span>
                          </div>
                        )}
                      </div>

                        {/* Output name */}
                        <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                          <label className="text-xs font-medium text-white/70">输出字幕文件名</label>
                          <input 
                            type="text" 
                            className="bg-white/[0.03] border border-white/5 hover:border-white/15 focus:border-accent-gold/50 rounded-lg py-2 px-3 text-white text-sm outline-none transition-all duration-200"
                            value={customFilename}
                            onChange={e => setCustomFilename(e.target.value)}
                            placeholder="自动使用媒体文件名..."
                          />
                        </div>

                        {/* Alignment Mode Selection */}
                        {!task.isBilingualSingle && (
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-white/70">
                              算法引擎 (Alignment Engine)
                            </label>
                            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-white/[0.02] border border-white/5">
                              <button
                                className={`py-2 rounded-md text-[11px] font-bold tracking-wide transition-all duration-200 ${alignmentMode === 'standard' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                                onClick={() => setAlignmentMode('standard')}
                              >
                                智能对齐 (Smart Align)
                              </button>
                              <button
                                className={`py-2 rounded-md text-[11px] font-bold tracking-wide transition-all duration-200 ${alignmentMode === 'industrial' ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20 shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                                onClick={() => setAlignmentMode('industrial')}
                              >
                                深度序列对齐 (Deep Sequence)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ASS style extraction hint */}
                        {showAssHint && foundAssStyle && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-accent-gold/5 border border-accent-gold/20 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div className="text-xs text-white/80">
                              <span className="text-accent-gold font-bold">检测到 ASS 格式样式：</span>
                              中文 {foundAssStyle.zhFontSize} / 英文 {foundAssStyle.enFontSize}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                className="px-3 py-1.5 bg-accent-gold text-black font-bold text-xs rounded-md hover:bg-accent-gold/90 transition"
                                onClick={() => {
                                  setCustomStyle(foundAssStyle as StyleSettings);
                                  setActivePreset('custom');
                                  setShowAssHint(false);
                                  addLog("已应用 ASS 文件自带的字体参数", 'success');
                                }}
                              >
                                应用
                              </button>
                              <button 
                                className="px-3 py-1.5 bg-white/5 text-white/80 text-xs rounded-md hover:bg-white/10 transition"
                                onClick={() => setShowAssHint(false)}
                              >
                                忽略
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {/* Action button */}
                        <button
                          className={`w-full py-3.5 rounded-xl font-bold text-center text-sm transition-all flex items-center justify-center gap-2 mt-2
                            ${(!task.zh && !task.en) || isProcessing 
                              ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                              : 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:scale-[1.01]'}`}
                          disabled={(!task.zh && !task.en) || isProcessing}
                          onClick={runSubtitleMerge}
                        >
                          <Play className={`w-4 h-4 ${(!task.zh && !task.en) || isProcessing ? 'fill-white/30' : 'fill-black'}`} />
                          {isProcessing ? '正在对齐...' : getProcessBtnText(task)}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <input 
        ref={fileInputRef}
        type="file" 
        multiple 
        accept=".srt,.ass" 
        className="hidden" 
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleFilesProcess(files);
        }} 
      />
    </div>
  );
};
