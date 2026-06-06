'use client';

import React, { useRef, useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { decodeBuffer, detectLanguageByContent, checkIsBilingual } from '@/utils/subtitleCore';
import JSZip from 'jszip';
import { UploadCloud, Folder, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DragZone: React.FC = () => {
  const { isDragging, setIsDragging, processFiles, addLog } = useStudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0); // #14 — counter to prevent child-element flicker

  // Parsing states
  const [isParsing, setIsParsing] = useState(false);
  const [parsingFiles, setParsingFiles] = useState<{ name: string; size: number; status: 'reading' | 'analyzing' | 'success' }[]>([]);

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

  const processZipFile = async (zipFile: File, detectedFiles: any[]) => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const promises: Promise<void>[] = [];

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && (zipEntry.name.endsWith('.srt') || zipEntry.name.endsWith('.ass'))) {
          const promise = zipEntry.async('arraybuffer').then((buffer) => {
            const decoded = decodeBuffer(buffer);
            const isBilingual = checkIsBilingual(decoded.text);
            const lang = isBilingual ? 'bilingual' : detectLanguageByContent(decoded.text);
            
            detectedFiles.push({
              id: `zip_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
              name: zipEntry.name.split('/').pop() || zipEntry.name,
              text: decoded.text,
              lang,
              isBilingual,
              isCommentary: /(commentary|comment|director|解说|导轨)/i.test(zipEntry.name),
              size: decoded.text.length
            });
          });
          promises.push(promise);
        }
      });

      await Promise.all(promises);
    } catch (e: any) {
      addLog(`解压缩包 ${zipFile.name} 失败: ${e.message}`, "error");
    }
  };

  const handleFilesProcess = async (filesList: File[]) => {
    const validFiles = filesList.filter(file => {
      const nameLower = file.name.toLowerCase();
      return nameLower.endsWith('.zip') || nameLower.endsWith('.srt') || nameLower.endsWith('.ass');
    });

    if (validFiles.length === 0) return;

    // Show visual ingest scanning phase
    setIsParsing(true);
    setParsingFiles(validFiles.map(f => ({ name: f.name, size: f.size, status: 'reading' })));

    const detectedFiles: any[] = [];

    for (const file of validFiles) {
      const nameLower = file.name.toLowerCase();
      if (nameLower.endsWith('.zip')) {
        await processZipFile(file, detectedFiles);
      } else {
        try {
          const text = await readAndDecodeFile(file);
          const isBilingual = checkIsBilingual(text);
          const lang = isBilingual ? 'bilingual' : detectLanguageByContent(text);
          
          detectedFiles.push({
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
            name: file.name,
            text,
            lang,
            isBilingual,
            isCommentary: /(commentary|comment|director|解说|导轨)/i.test(file.name),
            size: text.length
          });
        } catch (e: any) {
          addLog(`读取文件 ${file.name} 失败: ${e.message}`, "error");
        }
      }
    }

    if (detectedFiles.length > 0) {
      // 1. reading phase
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // 2. analyzing phase
      setParsingFiles(validFiles.map(f => ({ name: f.name, size: f.size, status: 'analyzing' })));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 3. success phase
      setParsingFiles(validFiles.map(f => ({ name: f.name, size: f.size, status: 'success' })));
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Complete Ingestion
      setIsParsing(false);
      processFiles(detectedFiles);
    } else {
      setIsParsing(false);
      addLog("未在选中的文件或文件夹中检测到任何有效字幕！", "error");
    }
  };

  // #14 — Use counter to avoid flickering when hovering over child elements
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    
    const filesArray: File[] = [];
    if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) filesArray.push(file);
        }
      }
    } else {
      const filesList = e.dataTransfer.files;
      for (let i = 0; i < filesList.length; i++) {
        filesArray.push(filesList[i]);
      }
    }
    
    if (filesArray.length > 0) {
      await handleFilesProcess(filesArray);
    }
  };

  if (isParsing) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="w-full max-w-4xl rounded-3xl p-8 md:p-12 bg-white/[0.01] backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col items-center gap-8 min-h-[350px] justify-center text-left relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent-gold/5 rounded-full blur-[80px] -z-10" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 w-full z-10">
          {/* Breathing Scanner */}
          <div className="relative w-32 h-32 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-accent-gold rounded-full blur-[20px]"
            />
            <UploadCloud className="w-10 h-10 text-white/80" />
          </div>

          {/* Details / File list */}
          <div className="flex-1 flex flex-col gap-4 w-full">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                解析与重构中
                <span className="flex gap-1 ml-1">
                  <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-accent-gold rounded-full" />
                  <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} className="w-1.5 h-1.5 bg-accent-gold rounded-full" />
                  <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }} className="w-1.5 h-1.5 bg-accent-gold rounded-full" />
                </span>
              </h3>
              <p className="text-sm text-white/50 mt-1">
                引擎正在分析时间轴特征并建立数据索引
              </p>
            </div>
            
            <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto pr-2">
              <AnimatePresence>
                {parsingFiles.map((pf, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl text-sm gap-3 border-l-2 border-transparent"
                    style={{ borderLeftColor: pf.status === 'success' ? '#f2a900' : 'transparent' }}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-white/40 flex-shrink-0" />
                      <span className="text-white/80 font-medium truncate">{pf.name}</span>
                      <span className="text-xs text-white/30 font-mono">{(pf.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 font-medium text-xs">
                      {pf.status === 'reading' && <span className="text-white/50">读取...</span>}
                      {pf.status === 'analyzing' && <span className="text-white/80">分析...</span>}
                      {pf.status === 'success' && <span className="text-accent-gold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />就绪</span>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div 
      className="w-full flex flex-col items-center group"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <motion.div 
        animate={isDragging ? { scale: 0.98, borderColor: 'rgba(242,169,0,0.5)', backgroundColor: 'rgba(242,169,0,0.03)' } : { scale: 1, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.01)' }}
        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.02)' }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-full max-w-4xl rounded-3xl py-8 px-6 md:py-10 md:px-12 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 cursor-pointer overflow-hidden border"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/[0.01] rounded-full blur-[60px] pointer-events-none -z-10 group-hover:bg-white/[0.02] transition-all duration-500" />

        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#060608]/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-4 z-50 pointer-events-none border border-accent-gold/20"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="p-6 bg-accent-gold/10 rounded-full shadow-[0_0_30px_rgba(242,169,0,0.15)]"
            >
              <UploadCloud className="w-14 h-14 text-accent-gold" />
            </motion.div>
            <span className="text-lg font-bold text-accent-gold tracking-widest">RELEASE TO INGEST</span>
          </motion.div>
        )}

        {/* Center Upload Icon */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="p-5 bg-white/[0.02] rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 flex-shrink-0"
        >
          <UploadCloud className="w-12 h-12 md:w-14 md:h-14 text-white/50 group-hover:text-white transition-colors duration-300" />
        </motion.div>

        {/* Texts */}
        <div className="text-center md:text-left z-10 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Drag & Drop Assets
          </h3>
          <p className="text-sm md:text-base text-white/50 mt-2 leading-relaxed max-w-lg mx-auto md:mx-0 whitespace-nowrap overflow-hidden text-ellipsis">
            拖拽包含字幕或 ZIP 压缩包至此建立媒体索引
          </p>
        </div>

        {/* Bottom Horizontal Bar Details */}
        <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 gap-6 text-sm text-white/40 font-mono">
          <span>.SRT</span>
          <span className="w-1 h-1 bg-white/20 rounded-full self-center" />
          <span>.ASS</span>
          <span className="w-1 h-1 bg-white/20 rounded-full self-center" />
          <span>.ZIP</span>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 w-full sm:w-auto px-4 z-10">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto px-10 py-4 bg-white text-black font-bold text-base rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.1)] transition-colors duration-200"
          onClick={() => fileInputRef.current?.click()}
        >
          浏览文件 / ZIP
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto px-10 py-4 bg-white/[0.02] border border-white/10 text-white font-medium text-base rounded-full transition-colors duration-200 backdrop-blur-md"
          onClick={() => folderInputRef.current?.click()}
        >
          扫描文件夹
        </motion.button>
      </div>

      <input 
        ref={fileInputRef} 
        type="file" 
        multiple 
        accept=".srt,.ass,.zip" 
        className="hidden" 
        onChange={(e) => handleFilesProcess(Array.from(e.target.files || []))} 
      />
      <input 
        ref={folderInputRef} 
        type="file" 
        // @ts-ignore
        webkitdirectory="true" 
        directory="true" 
        className="hidden" 
        onChange={(e) => handleFilesProcess(Array.from(e.target.files || []))} 
      />
    </div>
  );
};
