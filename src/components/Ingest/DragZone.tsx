'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { decodeBuffer, detectLanguageByContent, checkIsBilingual } from '@/utils/subtitleCore';
import JSZip from 'jszip';
import { UploadCloud, Folder, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  angle: number;
  speed: number;
}

const ParticleCanvas: React.FC<{ mode: 'idle' | 'hover' | 'dragging' | 'parsing' }> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);

    // Initialize particles
    const particleCount = mode === 'parsing' ? 60 : 35;
    const particles: Particle[] = [];
    
    const createParticle = (isInitial = false): Particle => {
      const pSize = Math.random() * 2.2 + 0.8;
      let px = Math.random() * width;
      let py = Math.random() * height;
      
      if (!isInitial && (mode === 'hover' || mode === 'dragging' || mode === 'parsing')) {
        // Spawn at outer border of canvas
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { px = 0; py = Math.random() * height; } // left
        else if (side === 1) { px = width; py = Math.random() * height; } // right
        else if (side === 2) { px = Math.random() * width; py = 0; } // top
        else { px = Math.random() * width; py = height; } // bottom
      }
      
      let color = 'rgba(255, 255, 255, ';
      if (mode === 'hover' || mode === 'parsing') {
        color = 'rgba(168, 85, 247, '; // Neon Purple
      } else if (mode === 'dragging') {
        color = 'rgba(16, 185, 129, '; // Neon Emerald
      }

      return {
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * (mode === 'parsing' ? 1.5 : 0.6),
        vy: (Math.random() - 0.5) * (mode === 'parsing' ? 1.5 : 0.6),
        size: pSize,
        alpha: Math.random() * 0.4 + 0.15,
        color,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.2 + 0.8,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(true));
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (mode === 'idle') {
          // Slow random drift
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        } else if (mode === 'hover' || mode === 'dragging') {
          // Gravitational pull to center
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 25) {
            particles[i] = createParticle(false);
            continue;
          }

          const force = 0.03 + (mode === 'dragging' ? 0.03 : 0.015);
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;

          p.vx *= 0.94;
          p.vy *= 0.94;

          p.x += p.vx;
          p.y += p.vy;
        } else if (mode === 'parsing') {
          // Spiral inwards
          const dx = p.x - cx;
          const dy = p.y - cy;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 15) {
            particles[i] = createParticle(false);
            continue;
          }

          let angle = Math.atan2(dy, dx);
          dist -= p.speed * 1.8;
          angle += 0.06;

          p.x = cx + Math.cos(angle) * dist;
          p.y = cy + Math.sin(angle) * dist;
          
          p.alpha = Math.min(0.7, dist / (width / 2.5));
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0" 
    />
  );
};

export const DragZone: React.FC = () => {
  const { isDragging, setIsDragging, processFiles, addLog, searchTmdb } = useStudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Parsing states
  const [isParsing, setIsParsing] = useState(false);
  const [parsingFiles, setParsingFiles] = useState<{ name: string; size: number; status: 'reading' | 'analyzing' | 'success' }[]>([]);
  const [isZoneActive, setIsZoneActive] = useState(false);
  const [scanningLogs, setScanningLogs] = useState<string[]>([]); // for extended cool scanning log with scrolling info prompts

  const appendScanLog = (msg: string) => {
    setScanningLogs(prev => {
      const next = [...prev, msg];
      return next.length > 7 ? next.slice(-7) : next; // keep recent for scrolling effect
    });
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    setScanningLogs([]);

    const detectedFiles: any[] = [];

    // Extended scanning phases to give backend API time and create cool UX with scrolling info
    appendScanLog('INITIALIZING SUBTITLE PROJECTOR...');
    await sleep(450);

    appendScanLog('DETECTING FILE STRUCTURE...');
    await sleep(550);

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
      appendScanLog('ANALYZING SUBTITLE TRACKS...');
      setParsingFiles(validFiles.map(f => ({ name: f.name, size: f.size, status: 'analyzing' })));
      await sleep(650);

      // Preload TMDB metadata during scanning so that after transition the TMDB panel renders instantly
      appendScanLog('QUERYING CLOUD METADATA (TMDB)...');
      if (validFiles[0]) {
        const guess = validFiles[0].name.replace(/\.[^.]+$/, '').replace(/[._-]+/g, ' ').trim();
        if (guess.length > 2) {
          searchTmdb(guess);
        }
      }
      await sleep(900);

      appendScanLog('SYNCING DUAL-TRACK DATA...');
      await sleep(700);

      appendScanLog('RENDERING CINEMATIC PREVIEW...');
      setParsingFiles(validFiles.map(f => ({ name: f.name, size: f.size, status: 'success' })));
      await sleep(550);

      appendScanLog('FINALIZING INGEST...');
      await sleep(400);

      // Complete - now transition with preloaded data ready
      setIsParsing(false);
      setScanningLogs([]);
      processFiles(detectedFiles);
    } else {
      setIsParsing(false);
      setScanningLogs([]);
      addLog("未在选中的文件或文件夹中检测到任何有效字幕！", "error");
    }
  };

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
      <div className="w-full max-w-5xl mx-auto relative flex flex-col items-center justify-center min-h-[520px]">
        {/* Unified holographic interface background for consistent visual feel */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#a855f7_0%,transparent_70%)] opacity-[0.03] pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/[0.015] to-transparent pointer-events-none -z-10" />

        <ParticleCanvas mode="parsing" />

        {/* Advanced layered holographic core (replacing simple cloud + basic geo with sophisticated design) */}
        {/* References high-end holographic UIs: layered depth, independent motion, gradient glows, geometric precision for premium feel */}
        <div className="relative z-10 w-72 h-72 flex items-center justify-center mb-6">
          {/* Outer energy field - soft volumetric glow for depth */}
          <div className="absolute inset-0 bg-violet-500/10 rounded-full blur-3xl" />

          {/* Layer 1: Slow outer ring - energy field */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[1.5px] border-violet-500/25 rounded-full"
          />

          {/* Layer 2: Dashed mid ring - data orbit */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute inset-6 border border-dashed border-violet-400/40 rounded-full"
          />

          {/* Layer 3: Inner geometric accent for sophistication (Bauhaus-inspired precision + holo) */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute inset-12 border border-violet-500/15 rounded-full"
          />

          {/* Core orb with gradient for holo depth */}
          <div className="relative z-10 w-40 h-40 rounded-full bg-gradient-to-br from-violet-400/15 via-transparent to-emerald-400/10 flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.35)]">
            {/* Premium icon - advanced design instead of simple cloud */}
            {/* Clean geometric lens with film/subtitle elements, gradient core, multiple strokes for depth */}
            <svg width="68" height="68" viewBox="0 0 56 56" fill="none" 
              className="text-violet-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]">
              <circle cx="28" cy="28" r="25" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" />
              <rect x="8" y="20" width="40" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.75" fill="none" />
              {/* Subtitle tracks as clean lines */}
              <line x1="10" y1="16" x2="46" y2="16" stroke="#a855f7" strokeWidth="1.2" strokeOpacity="0.85" />
              <line x1="10" y1="40" x2="46" y2="40" stroke="#a855f7" strokeWidth="1.2" strokeOpacity="0.85" />
              {/* Inner focus with subtle fill for holo volume */}
              <circle cx="28" cy="28" r="7" fill="currentColor" fillOpacity="0.15" />
              <circle cx="28" cy="28" r="3.5" fill="currentColor" fillOpacity="0.3" />
            </svg>
          </div>

          {/* Dynamic scan beam - enhanced with gradient and shadow for premium volumetric feel */}
          <motion.div 
            animate={{ y: [-35, 35, -35], opacity: [0.35, 0.85, 0.35] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_16px_rgba(16,185,129,0.6)] pointer-events-none"
          />
        </div>

        {/* Unified info display - combined animation + Chinese prompts in one holographic interface for consistent visual/UX */}
        <div className="relative z-20 w-full max-w-lg text-center -mt-2">
          {/* Title as holo projection - integrated with the core visual */}
          <div className="mb-3">
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-[3px] font-mono uppercase flex items-center justify-center gap-2 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
              HOLOGRAPHIC SCANNING
              <span className="flex gap-1 ml-1">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.25 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.5 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
              </span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1 font-mono tracking-[1.5px] uppercase">
              indexing subtitle sync structures
            </p>
          </div>

          {/* File status as integrated holo readout */}
          <div className="flex flex-col gap-1.5 max-h-[90px] overflow-y-auto mb-3 text-xs font-mono">
            <AnimatePresence>
              {parsingFiles.map((pf, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex justify-between items-center px-3 py-1 bg-white/[0.015] border border-white/[0.03] rounded text-white/80"
                >
                  <span className="truncate pr-2">{pf.name}</span>
                  <span className="font-bold tracking-wider text-[10px] text-white/60">
                    {pf.status === 'reading' && 'READING'}
                    {pf.status === 'analyzing' && 'ANALYZING'}
                    {pf.status === 'success' && 'READY'}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Unified live scan log - now part of the central holographic experience */}
          <div className="w-full">
            <div className="text-[9px] font-mono tracking-[1.5px] text-emerald-400/60 mb-1 text-left pl-1">LIVE SCAN LOG</div>
            <div className="h-20 overflow-hidden border border-white/10 bg-black/60 rounded-xl p-2.5 text-xs font-mono text-emerald-400/90 flex flex-col justify-end gap-y-px shadow-inner">
              <AnimatePresence>
                {scanningLogs.map((log, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="leading-tight truncate"
                  >
                    &gt; {log}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full flex flex-col items-center group/outer py-6"
      onMouseEnter={() => setIsZoneActive(true)}
      onMouseLeave={() => setIsZoneActive(false)}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Borderless cinematic screen area（无边界但可感知的字幕放映区域）:
          Large open "projection frame" without hard circular border.
          Left/right film-strip perforations give clear perception of the drop zone.
          Very subtle inner lighting and top highlight make the screen feel "lit" and special
          without boxing the content. Perfect for subtitle/film theme.
      */}
      {/* Left film perforation strip（左侧胶片齿孔） - perceptible reel edge */}
      <div className="absolute left-0 top-0 bottom-0 w-5 z-30 pointer-events-none flex flex-col justify-around py-3">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="mx-auto w-2.5 h-[5px] bg-black/80 rounded-[1px]" />
        ))}
      </div>

      {/* Right film perforation strip */}
      <div className="absolute right-0 top-0 bottom-0 w-5 z-30 pointer-events-none flex flex-col justify-around py-3">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="mx-auto w-2.5 h-[5px] bg-black/80 rounded-[1px]" />
        ))}
      </div>

      {/* Main borderless screen - the perceptible drop target */}
      <motion.div 
        onClick={() => fileInputRef.current?.click()}
        animate={isDragging 
          ? { scale: 0.985, boxShadow: 'inset 0 0 90px rgba(0,0,0,0.95)' } 
          : isZoneActive
            ? { scale: 1.008, boxShadow: 'inset 0 0 70px rgba(0,0,0,0.85), 0 0 60px rgba(168,85,247,0.08)' }
            : { scale: 1, boxShadow: 'inset 0 0 80px rgba(0,0,0,0.9)' }
        }
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative w-full max-w-[920px] h-[310px] mx-auto bg-[#020203] flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none z-10"
      >
        <ParticleCanvas mode={isDragging ? 'dragging' : (isZoneActive ? 'hover' : 'idle')} />

        {/* Very subtle screen highlight for user perception without hard border */}
        <div className="absolute inset-x-8 top-5 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute inset-x-8 bottom-5 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* 
          Custom cinematic Ingest Lens icon (no generic AI cloud)
          - aperture（光圈）: 多叶片结构，模拟真实相机/投影机镜头，增加电影感。
          - dual-track waveform（双轨波形）: 两条波浪线代表双语字幕（中英轨），这是本工具的核心身份。
          这个 SVG 比 <UploadCloud> 更有领域特征（domain-specific），避免 AI 模板感。
        */}
        {isDragging ? (
          <div className="flex flex-col items-center gap-2 z-20">
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            >
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="drop-shadow-[0_0_14px_rgba(16,185,129,0.7)]">
                {/* Clean outer ring */}
                <circle cx="26" cy="26" r="23" stroke="#10b981" strokeWidth="2" strokeOpacity="0.7" />
                {/* Inner bold film base */}
                <rect x="12" y="22" width="28" height="8" rx="1" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.9" fill="none" />
                {/* Subtitle lines (two clean tracks) */}
                <line x1="14" y1="19" x2="38" y2="19" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.85" />
                <line x1="14" y1="33" x2="38" y2="33" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.85" />
                {/* Small center marker for "lens" focus */}
                <circle cx="26" cy="26" r="3" fill="#10b981" fillOpacity="0.4" />
              </svg>
            </motion.div>
            <span className="text-xs font-mono tracking-[0.2em] text-emerald-400 font-semibold">松手投射</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 z-20 text-center">
            <div className="relative">
              <svg width="64" height="64" viewBox="0 0 56 56" fill="none" 
                className={`transition-all duration-300 ${isZoneActive ? 'text-violet-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.65)]' : 'text-neutral-400/70'}`}>
                {/* Clean outer ring */}
                <circle cx="28" cy="28" r="25" stroke="currentColor" strokeWidth="1.8" strokeOpacity="0.6" />
                {/* Bold film base (horizontal rectangle for reel feel) */}
                <rect x="10" y="22" width="36" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.85" fill="none" />
                {/* Two clean subtitle track lines */}
                <line x1="12" y1="18" x2="44" y2="18" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.9" />
                <line x1="12" y1="38" x2="44" y2="38" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.9" />
                {/* Subtle center focus dot */}
                <circle cx="28" cy="28" r="4" fill="currentColor" fillOpacity="0.25" />
              </svg>
            </div>

            <div>
              <div className="text-lg font-mono font-semibold tracking-[2px] text-white/95">字幕画框</div>
              <div className="text-xs text-neutral-400 tracking-wide mt-1">拖入文件投射到画框</div>
            </div>

            <div className="flex gap-3 text-xs font-mono tracking-[1px] text-neutral-400 mt-2">
              <span>SRT</span><span className="text-white/20">·</span><span>ASS</span><span className="text-white/20">·</span><span>ZIP</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Refined action buttons — stronger cinematic glass, better hierarchy and breathing */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-9 w-full sm:w-auto px-4 z-20">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="group w-full sm:w-auto px-9 py-3.5 rounded-2xl text-sm font-mono uppercase tracking-[0.12em] font-semibold cursor-pointer transition-all duration-200 
            bg-white/[0.022] hover:bg-violet-500/5 border border-white/[0.055] hover:border-violet-500/30 
            text-white/90 hover:text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:shadow-[0_0_18px_rgba(168,85,247,0.12)] active:scale-[0.985]"
        >
          浏览文件 / ZIP
        </button>
        
        <button 
          onClick={() => folderInputRef.current?.click()}
          className="group w-full sm:w-auto px-9 py-3.5 rounded-2xl text-sm font-mono uppercase tracking-[0.12em] font-semibold cursor-pointer transition-all duration-200 
            bg-white/[0.01] hover:bg-white/[0.035] border border-white/[0.04] hover:border-white/15 
            text-neutral-400 hover:text-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:shadow-[0_0_14px_rgba(255,255,255,0.06)] active:scale-[0.985]"
        >
          扫描文件夹
        </button>
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
