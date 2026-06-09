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
  const { isDragging, setIsDragging, processFiles, addLog } = useStudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Parsing states
  const [isParsing, setIsParsing] = useState(false);
  const [parsingFiles, setParsingFiles] = useState<{ name: string; size: number; status: 'reading' | 'analyzing' | 'success' }[]>([]);
  const [isZoneActive, setIsZoneActive] = useState(false);

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
      <div className="w-full max-w-4xl p-8 relative flex flex-col items-center justify-center min-h-[400px]">
        {/* Holographic scanner layout */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/[0.02] to-transparent rounded-[40px] pointer-events-none -z-20" />
        <ParticleCanvas mode="parsing" />
        
        {/* Scanning laser beam effect */}
        <motion.div 
          animate={{ y: [-150, 150, -150] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_12px_rgba(168,85,247,0.8)] pointer-events-none z-10"
        />

        <div className="flex flex-col items-center gap-8 w-full z-10 text-center">
          {/* Holographic scanner lens */}
          <div className="relative w-36 h-36 rounded-full border border-violet-500/20 flex items-center justify-center flex-shrink-0 bg-white/[0.005] shadow-[0_0_30px_rgba(168,85,247,0.05)]">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border border-dashed border-violet-400/40 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border border-dotted border-violet-500/30 rounded-full"
            />
            <UploadCloud className="w-12 h-12 text-violet-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          </div>

          {/* Details / File list */}
          <div className="flex flex-col gap-4 w-full max-w-md">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white tracking-wider font-mono uppercase flex items-center justify-center gap-2">
                HOLOGRAPHIC SCANNING
                <span className="flex gap-1 ml-1">
                  <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                  <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                  <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                </span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1 font-mono uppercase tracking-[0.1em]">
                indexing subtitle sync structures
              </p>
            </div>
            
            <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/[0.03]">
              <AnimatePresence>
                {parsingFiles.map((pf, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl text-xs font-mono gap-3"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-violet-400/50 flex-shrink-0" />
                      <span className="text-white/70 truncate">{pf.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 font-bold text-xs tracking-wider">
                      {pf.status === 'reading' && <span className="text-white/40 animate-pulse">READING</span>}
                      {pf.status === 'analyzing' && <span className="text-violet-400 animate-pulse">ANALYZING</span>}
                      {pf.status === 'success' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />READY</span>}
                    </div>
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
      {/* Complete redesign - Gaseous Holographic Lens, no outer box cards */}
      <motion.div 
        onClick={() => fileInputRef.current?.click()}
        animate={isDragging 
          ? { scale: 0.985 } 
          : isZoneActive
            ? { scale: 1.01 }
            : { scale: 1 }
        }
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-80 h-80 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none z-10"
      >
        <ParticleCanvas mode={isDragging ? 'dragging' : (isZoneActive ? 'hover' : 'idle')} />
        {/* Subtle color wash toned down for Windows Chrome color cast issues */}
        <div className="absolute inset-[-20px] bg-gradient-to-tr from-violet-600/[0.004] via-fuchsia-600/[0.002] to-transparent rounded-full filter blur-3xl opacity-25 group-hover/outer:opacity-50 transition-opacity duration-500 -z-20" />

        {/* Bauhaus-inspired geometric composition（包豪斯风格几何构图）: 
            强调干净的原色线条、圆形与直线的精确相交、功能性构图，而非过度装饰的虚线旋转环。
            保留缓慢的机械式旋转以体现专业、精确的“镜头”感，同时增加不对称的动态元素。
        */}
        {/* Central bold circle + precise cross (Bauhaus primary elements) */}
        <div className={`absolute inset-[18%] rounded-full border-2 transition-all duration-300
          ${isDragging ? 'border-emerald-500/60' : isZoneActive ? 'border-violet-400/70' : 'border-white/15'}`} />
        
        {/* Horizontal and vertical construction lines */}
        <div className={`absolute left-[15%] right-[15%] top-1/2 h-px -translate-y-1/2 transition-all duration-300
          ${isDragging ? 'bg-emerald-500/50' : isZoneActive ? 'bg-violet-400/60' : 'bg-white/10'}`} />
        <div className={`absolute top-[15%] bottom-[15%] left-1/2 w-px -translate-x-1/2 transition-all duration-300
          ${isDragging ? 'bg-emerald-500/50' : isZoneActive ? 'bg-violet-400/60' : 'bg-white/10'}`} />

        {/* Slow rotating geometric accent (small triangle + arc for dynamic Bauhaus asymmetry) */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: isDragging ? 8 : (isZoneActive ? 18 : 32), repeat: Infinity, ease: "linear" }}
          className="absolute inset-[22%] pointer-events-none"
        >
          {/* Small triangle accent */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] transition-colors
            ${isDragging ? 'border-b-emerald-500/70' : isZoneActive ? 'border-b-violet-400/80' : 'border-b-white/20'}`} />
          {/* Subtle arc */}
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            <path 
              d="M 20 80 A 30 30 0 0 1 80 80" 
              fill="none" 
              stroke={isDragging ? "#10b981" : isZoneActive ? "#a855f7" : "#ffffff"} 
              strokeWidth="1.5" 
              strokeOpacity={isDragging ? "0.5" : isZoneActive ? "0.6" : "0.15"} 
            />
          </svg>
        </motion.div>

        {/* Subtle outer construction frame (Bauhaus rectangle influence) */}
        <div className={`absolute -inset-[6px] border transition-colors duration-300
          ${isDragging ? 'border-emerald-500/20' : isZoneActive ? 'border-violet-500/25' : 'border-white/5'}`} />

        {/* Enhanced hover interaction for Bauhaus elements: precise "snap" alignment feel */}
        <motion.div 
          animate={isZoneActive ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute inset-0 pointer-events-none"
        />

        {/* 
          Custom cinematic Ingest Lens icon (no generic AI cloud)
          - aperture（光圈）: 多叶片结构，模拟真实相机/投影机镜头，增加电影感。
          - dual-track waveform（双轨波形）: 两条波浪线代表双语字幕（中英轨），这是本工具的核心身份。
          这个 SVG 比 <UploadCloud> 更有领域特征（domain-specific），避免 AI 模板感。
        */}
        {isDragging ? (
          <div className="flex flex-col items-center gap-3 z-20">
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            >
              {/* Custom aperture + waveform lens for drag state */}
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="drop-shadow-[0_0_12px_rgba(16,185,129,0.65)]">
                <circle cx="26" cy="26" r="23" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.6"/>
                <g stroke="#10b981" strokeWidth="1.25" strokeOpacity="0.9">
                  <path d="M26 9 L26 17" />
                  <path d="M26 35 L26 43" />
                  <path d="M9 26 L17 26" />
                  <path d="M35 26 L43 26" />
                  <path d="M13.5 13.5 L19 19" />
                  <path d="M33 33 L38.5 38.5" />
                  <path d="M38.5 13.5 L33 19" />
                  <path d="M19 33 L13.5 38.5" />
                </g>
                {/* Subtle dual waveform inside for dual-track subtitle identity */}
                <path d="M18 26 Q21 22 24 26 Q27 30 30 26" stroke="#34d399" strokeWidth="1.1" fill="none" strokeOpacity="0.85"/>
                <path d="M18 29 Q21 25 24 29 Q27 33 30 29" stroke="#34d399" strokeWidth="0.9" fill="none" strokeOpacity="0.6"/>
              </svg>
            </motion.div>
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-emerald-400 font-bold">RELEASE TO INGEST</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 z-20">
            {/* Custom premium Ingest Lens icon - aperture + dual subtitle tracks */}
            <div className="relative">
              <svg 
                width="56" height="56" 
                viewBox="0 0 56 56" 
                fill="none" 
                className={`transition-all duration-300 ${isZoneActive ? 'text-violet-400 drop-shadow-[0_0_14px_rgba(168,85,247,0.55)]' : 'text-neutral-400/70'}`}
              >
                {/* Outer aperture ring */}
                <circle cx="28" cy="28" r="25" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.55" />
                
                {/* Blade / aperture segments for cinematic lens personality */}
                <g stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.75">
                  <path d="M28 5.5 L28 13" />
                  <path d="M28 43 L28 50.5" />
                  <path d="M5.5 28 L13 28" />
                  <path d="M43 28 L50.5 28" />
                  <path d="M10 10 L16.5 16.5" />
                  <path d="M39.5 39.5 L46 46" />
                  <path d="M46 10 L39.5 16.5" />
                  <path d="M16.5 39.5 L10 46" />
                </g>
                
                {/* Inner dual-track waveform (core identity: bilingual subtitle) */}
                <path 
                  d="M19 28 Q23 24 27 28 Q31 32 35 28" 
                  stroke="currentColor" 
                  strokeWidth="1.6" 
                  strokeOpacity="0.9"
                  fill="none" 
                />
                <path 
                  d="M19 31.5 Q23 27.5 27 31.5 Q31 35.5 35 31.5" 
                  stroke="currentColor" 
                  strokeWidth="1.1" 
                  strokeOpacity="0.55"
                  fill="none" 
                />
                
                {/* Subtle center highlight for lens glass */}
                <circle cx="28" cy="28" r="6" fill="currentColor" fillOpacity="0.08" />
              </svg>
            </div>
            
            <div className="flex flex-col gap-1.5 items-center px-2 text-center">
              <span className="text-[13px] font-mono font-bold tracking-[0.22em] text-white/95">INGEST LENS</span>
              <span className="text-[10px] text-neutral-500 tracking-[0.08em] uppercase font-sans">DROP FILES INTO THE LENS</span>
            </div>
            
            {/* Refined format indicators - more integrated, less generic */}
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] text-neutral-600">
              <span className="px-1.5 py-px border border-white/10 rounded">SRT</span>
              <span className="text-white/20">·</span>
              <span className="px-1.5 py-px border border-white/10 rounded">ASS</span>
              <span className="text-white/20">·</span>
              <span className="px-1.5 py-px border border-white/10 rounded">ZIP</span>
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
