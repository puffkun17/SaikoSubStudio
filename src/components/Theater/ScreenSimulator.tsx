'use client';

import React from 'react';
import { BackdropSlot, SubtitleDataSlot, StyleSettings } from '@/types/subtitleTypes';

const getOutlineShadow = (outlineColor: string) => {
  return `
    -1px -1px 0 ${outlineColor},  
     1px -1px 0 ${outlineColor},
    -1px  1px 0 ${outlineColor},
     1px  1px 0 ${outlineColor},
    -2px -2px 2px rgba(0,0,0,0.8),
     2px -2px 2px rgba(0,0,0,0.8),
    -2px  2px 2px rgba(0,0,0,0.8),
     2px  2px 2px rgba(0,0,0,0.8)
  `;
};

interface ScreenSimulatorProps {
  subtitle: SubtitleDataSlot;
  backdrop: BackdropSlot;
  style: StyleSettings;
  previewIndex: number;
  theaterAspect: string;
  guides: { show: boolean; temp: boolean };
  triggerTempGuides: () => void;
}

export const ScreenSimulator: React.FC<ScreenSimulatorProps> = ({
  subtitle,
  backdrop,
  style,
  previewIndex,
  theaterAspect,
  guides,
  triggerTempGuides
}) => {
  const activeSub = subtitle.status === 'ready' && subtitle.data ? subtitle.data[previewIndex] : null;
  
  const scale = style.globalScale || 1.0;
  const zhSizeCqh = (style.zhFontSize * scale / 288) * 100;
  const enSizeCqh = (style.enFontSize * scale / 288) * 100;
  const paddingBottomCqh = (style.marginV / 288) * 100;

  const {
    lyricFontSize = 16,
    lyricColor = '#E6E6FA',
    lyricItalic = true,
    lyricPosition = 'top'
  } = style;

  const lyricZhSizeCqh = (lyricFontSize * scale / 288) * 100;
  const lyricEnSizeCqh = (Math.max(10, lyricFontSize * 0.75) * scale / 288) * 100;
  const noteSizeCqh = (18 * scale / 288) * 100;

  // Detect what to render at Top and Bottom
  let topElement: React.ReactNode = null;
  let bottomElement: React.ReactNode = null;

  if (activeSub) {
    if (activeSub.type === 'note' || activeSub.type === 'commentary') {
      topElement = (
        <div 
          style={{
            fontSize: `${noteSizeCqh}cqh`,
            color: '#FFFFFF',
            fontWeight: 500,
            textShadow: getOutlineShadow('#000000'),
            lineHeight: 1.25,
            fontFamily: 'system-ui, sans-serif',
            whiteSpace: 'pre-wrap'
          }}
        >
          {activeSub.text || ''}
        </div>
      );
    } else if (activeSub.type === 'lyrics') {
      const parts = (activeSub.text || '').split('\n');
      const lyricZh = parts[0] || '';
      const lyricEn = parts[1] || '';
      const lyricEl = (
        <div className="flex flex-col items-center animate-fade-in">
          {lyricZh && (
            <div 
              style={{
                fontSize: `${lyricZhSizeCqh}cqh`,
                color: lyricColor,
                fontWeight: 600,
                fontStyle: lyricItalic ? 'italic' : 'normal',
                textShadow: getOutlineShadow('#000000'),
                lineHeight: 1.25,
                fontFamily: 'system-ui, sans-serif'
              }}
            >
              {lyricZh}
            </div>
          )}
          {lyricEn && (
            <div 
              className="mt-1"
              style={{
                fontSize: `${lyricEnSizeCqh}cqh`,
                color: lyricColor,
                fontWeight: 600,
                fontStyle: lyricItalic ? 'italic' : 'normal',
                textShadow: getOutlineShadow('#000000'),
                lineHeight: 1.2,
                transform: `scale(${style.enScale ? style.enScale / 100 : 0.9})`,
                fontFamily: 'Helvetica Neue, Arial, sans-serif'
              }}
            >
              {lyricEn}
            </div>
          )}
        </div>
      );

      if (lyricPosition === 'top') {
        topElement = lyricEl;
      } else {
        bottomElement = lyricEl;
      }
    } else {
      const parts = (activeSub.text || '').split('\n');
      const zh = parts[0] || '';
      const en = parts[1] || '';
      bottomElement = (
        <div className="flex flex-col items-center">
          {zh && (
            <div 
              style={{
                fontSize: `${zhSizeCqh}cqh`,
                color: style.zhColor,
                fontWeight: 700,
                textShadow: getOutlineShadow(style.zhOutline),
                lineHeight: 1.25,
                fontFamily: 'system-ui, sans-serif'
              }}
            >
              {zh}
            </div>
          )}
          {en && (
            <div 
              className="mt-1"
              style={{
                fontSize: `${enSizeCqh}cqh`,
                color: style.enColor,
                fontWeight: 600,
                textShadow: getOutlineShadow(style.enOutline || '#000000'),
                lineHeight: 1.2,
                transform: `scale(${style.enScale ? style.enScale / 100 : 0.9})`,
                fontFamily: 'Helvetica Neue, Arial, sans-serif'
              }}
            >
              {en}
            </div>
          )}
        </div>
      );
    }
  }

  const getBackdropStyle = () => {
    const bgSize = 'cover';
    
    switch (backdrop.type) {
      case 'solid':
        return { backgroundColor: backdrop.color };
      case 'preset':
        if (backdrop.name === 'nature') {
          return { backgroundImage: 'url("/scene_nature.png")', backgroundSize: bgSize, backgroundPosition: 'center' };
        }
        if (backdrop.name === 'night') {
          return { backgroundImage: 'url("/scene_night.png")', backgroundSize: bgSize, backgroundPosition: 'center' };
        }
        return { backgroundImage: 'url("/scene_portrait.png")', backgroundSize: bgSize, backgroundPosition: 'center' };
      case 'image':
        return { backgroundImage: `url(${backdrop.url})`, backgroundSize: bgSize, backgroundPosition: 'center' };
      case 'tmdb':
        return { backgroundImage: `url(${backdrop.backdropUrl})`, backgroundSize: bgSize, backgroundPosition: 'center' };
      default:
        return { backgroundColor: '#09090d' };
    }
  };

  const isCrt = theaterAspect === '4:3';
  const isScope = theaterAspect === '2.39:1' || theaterAspect === '1.9:1';
  const maskAspect = isCrt ? '1536/1288' : '1725/1058';
  const maskImg = isCrt ? '/tv-crt_v2.png' : '/tv-modern_v2.png';

  const screenPos = isCrt 
      ? { left: '10.8073%', top: '11.4907%', width: '78.3854%', height: '71.0404%' }
      : { left: '1.6812%', top: '3.8752%', width: '96.0000%', height: '90.3592%' };

  const innerAspect = theaterAspect === '16:9' ? '16/9' : 
                      theaterAspect === '4:3' ? '4/3' : 
                      theaterAspect === '1.9:1' ? '1.9/1' : '2.39/1';

  const getBlackBarCenterCqh = () => {
    const physAspect = isCrt ? (4/3) : (16/9);
    let movieAspectNum = 16/9;
    if (theaterAspect === '4:3') movieAspectNum = 4/3;
    else if (theaterAspect === '1.9:1') movieAspectNum = 1.9;
    else if (theaterAspect === '2.39:1') movieAspectNum = 2.39;

    if (movieAspectNum > physAspect) {
      const movieHeightPct = physAspect / movieAspectNum;
      const blackBarHeightPct = (1 - movieHeightPct) / 2;
      return (blackBarHeightPct / 2) * 100;
    }
    return 0;
  };

  const targetCqh = getBlackBarCenterCqh();
  const isMagnetic = targetCqh > 0 && Math.abs(paddingBottomCqh - targetCqh) < 1.0;

  return (
    <div 
      className="flex-1 flex justify-center items-center bg-[#050507] w-full h-full overflow-hidden p-6 md:p-12 relative"
      onMouseEnter={triggerTempGuides}
      onMouseMove={triggerTempGuides}
    >
      {/* 空间极光氛围呼吸光晕 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute top-[20%] left-[20%] w-[55%] h-[55%] rounded-full bg-aurora-glow-purple" />
        <div className="absolute bottom-[20%] right-[20%] w-[45%] h-[45%] rounded-full bg-aurora-glow-emerald" />
      </div>

      {/* Cinematic presentation: clean scope screen for 2.39:1 / 1.9:1, TV mask only for 4:3/16:9 */}
      {isScope ? (
        /* Pure cinematic scope presentation — the backdrop (剧照) is the star, not a TV bezel */
        <div className="relative flex justify-center items-center z-10" style={{ width: '100%', maxWidth: '1080px' }}>
          {/* Dark theater stage */}
          <div className="relative w-full" style={{ aspectRatio: innerAspect }}>
            {/* The actual projected still / backdrop fills the exact scope frame */}
            <div 
              className="absolute inset-0 overflow-hidden rounded-sm shadow-[0_0_120px_rgba(0,0,0,0.9)]"
              style={{
                backgroundColor: '#050507',
                ...getBackdropStyle()
              }}
            >
              {/* Subtle filmic vignette + projector softness for depth and readability */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,0,0,0)_35%,rgba(0,0,0,0.55)_72%,rgba(0,0,0,0.82)_100%)]" />
              {/* Very light film grain for texture (projected print feel) */}
              <div className="absolute inset-0 opacity-[0.035] mix-blend-screen" 
                   style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
            </div>

            {/* Subtitles and overlays live on top of the beautiful still */}
            {/* Idle / loading / error states */}
            {subtitle.status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 select-none">
                <span className="text-white/25 text-xs font-mono tracking-[3px] uppercase">投射画框 • 2.39:1</span>
              </div>
            )}
            {subtitle.status === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 select-none bg-black/50">
                <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-white/50 text-xs font-mono tracking-widest uppercase">Loading subtitles...</span>
              </div>
            )}
            {subtitle.status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 select-none bg-black/80">
                <span className="text-rose-400/80 text-xs font-mono tracking-widest uppercase mb-1">[ Data Error ]</span>
                <span className="text-white/40 text-[0.625rem] font-mono px-4 text-center max-w-xs">{subtitle.message}</span>
              </div>
            )}

            {/* Subtitle layers — strong shadows for any backdrop */}
            {topElement && (
              <div className="absolute left-[6%] right-[6%] flex flex-col items-center justify-start text-center pointer-events-none select-none z-40" style={{ top: `${paddingBottomCqh * 0.7}cqh` }}>
                {topElement}
              </div>
            )}
            {bottomElement && (
              <div className="absolute left-[6%] right-[6%] flex flex-col items-center justify-end text-center pointer-events-none select-none z-40" style={{ bottom: `${paddingBottomCqh}cqh` }}>
                {bottomElement}
              </div>
            )}

            {/* Subtle scope edge glow / projector spill */}
            <div className="absolute -inset-[1px] rounded-sm pointer-events-none z-10" 
                 style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), 0 0 80px rgba(168,85,247,0.06)' }} />
          </div>
        </div>
      ) : (
        /* Legacy TV / 16:9 framed treatment (kept for 4:3 and standard HD) */
        <div 
          className="relative flex justify-center items-center fade-in-up border border-white/[0.06] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] z-10"
          style={{ aspectRatio: maskAspect, maxWidth: '100%', maxHeight: '100%', height: '100%' }}
        >
          <img src={maskImg} className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20 drop-shadow-2xl" alt="Frame" />

          <div 
            className="absolute overflow-hidden z-10"
            style={{
              left: screenPos.left, top: screenPos.top, width: screenPos.width, height: screenPos.height,
              backgroundColor: '#000',
              ...getBackdropStyle()
            }}
          >
            {/* Inner aspect container — light overlay instead of solid dark that hid backdrops */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
              <div 
                className="relative overflow-hidden"
                style={{ 
                  aspectRatio: innerAspect, 
                  width: '100%', 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 100%)'
                }}
              />
            </div>

            {subtitle.status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 select-none">
                <span className="text-white/20 text-xs font-mono tracking-widest uppercase">[ Empty Canvas ]</span>
              </div>
            )}
            {subtitle.status === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 select-none bg-black/60 backdrop-blur-xs">
                <div className="w-6 h-6 border-2 border-accent-neon border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-white/40 text-xs font-mono tracking-widest uppercase">{subtitle.progress ? `Loading ${Math.round(subtitle.progress * 100)}%` : 'Loading Subtitles...'}</span>
              </div>
            )}
            {subtitle.status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 select-none bg-black/85">
                <span className="text-rose-500/80 text-xs font-mono tracking-widest uppercase mb-1">[ Data Error ]</span>
                <span className="text-white/40 text-[0.625rem] font-mono tracking-wide px-4 text-center max-w-xs break-words">{subtitle.message}</span>
              </div>
            )}

            {topElement && (
              <div className="absolute left-[5%] right-[5%] flex flex-col items-center justify-start text-center pointer-events-none select-none z-40 transition-all duration-200" style={{ top: `${paddingBottomCqh * 0.8}cqh` }}>
                {topElement}
              </div>
            )}
            {bottomElement && (
              <div className="absolute left-[5%] right-[5%] flex flex-col items-center justify-end text-center pointer-events-none select-none z-40 transition-all duration-200" style={{ bottom: `${paddingBottomCqh}cqh` }}>
                {bottomElement}
              </div>
            )}

            <div className="absolute left-0 right-0 z-40 transition-all duration-300 pointer-events-none flex items-center" style={{ bottom: `${paddingBottomCqh}cqh`, opacity: (guides.show || guides.temp) ? 1 : 0, borderBottom: `1px dashed ${isMagnetic ? '#10b981' : 'rgba(168,85,247,0.45)'}`, boxShadow: isMagnetic ? '0 0 10px #10b981, 0 0 4px #10b981' : 'none', transform: 'scaleY(0.5)', transformOrigin: 'bottom' }}>
              {isMagnetic && <div className="absolute right-4 -top-3.5 text-[0.5625rem] text-[#10b981]/90 font-mono tracking-[0.2em] uppercase bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.5)] scale-y-200">MAGNETIC ALIGNED</div>}
            </div>
            {targetCqh > 0 && (
              <div className="absolute left-0 right-0 z-30 transition-all duration-300 pointer-events-none" style={{ bottom: `${targetCqh}cqh`, opacity: (guides.show || guides.temp) && !isMagnetic ? 1 : 0, borderBottom: '1px solid rgba(255,255,255,0.08)', transform: 'scaleY(0.5)', transformOrigin: 'bottom' }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
