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
  // 宽银幕特殊处理：2.39:1 和 1.9:1 需要 letterbox + TV 遮罩
  const isWideAspect = theaterAspect === '2.39:1' || theaterAspect === '1.9:1';

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
            fontFamily: style.zhFontFamily || 'system-ui, "PingFang SC", "Noto Sans SC", sans-serif',
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
                fontFamily: style.zhFontFamily || 'system-ui, "PingFang SC", "Noto Sans SC", sans-serif'
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
                fontWeight: 400,
                fontStyle: lyricItalic ? 'italic' : 'normal',
                textShadow: getOutlineShadow('#000000'),
                lineHeight: 1.25,
                fontFamily: style.enFontFamily || 'Helvetica Neue, Arial, sans-serif'
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
      // 普通字幕
      const parts = (activeSub.text || '').split('\n');
      const zhText = parts[0] || '';
      const enText = parts[1] || '';
      
      topElement = (
        <div className="flex flex-col items-center">
          {zhText && (
            <div 
              style={{
                fontSize: `${zhSizeCqh}cqh`,
                color: style.zhColor,
                fontWeight: 600,
                textShadow: getOutlineShadow(style.zhOutline),
                lineHeight: 1.25,
                fontFamily: style.zhFontFamily || 'system-ui, "PingFang SC", "Noto Sans SC", sans-serif'
              }}
            >
              {zhText}
            </div>
          )}
          {enText && (
            <div 
              className="mt-0.5"
              style={{
                fontSize: `${enSizeCqh}cqh`,
                color: style.enColor,
                fontWeight: 400,
                textShadow: getOutlineShadow(style.enOutline),
                lineHeight: 1.2,
                fontFamily: style.enFontFamily || 'Helvetica Neue, Arial, sans-serif'
              }}
            >
              {enText}
            </div>
          )}
        </div>
      );
    }
  }

  // Backdrop 渲染
  const getBackdropStyle = () => {
    if (backdrop.type === 'tmdb' && backdrop.backdropUrl) {
      return {
        backgroundImage: `url(${backdrop.backdropUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    if (backdrop.type === 'preset') {
      return {
        backgroundImage: `url(/scene_${backdrop.name}.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {
      backgroundColor: backdrop.type === 'solid' ? backdrop.color : '#0c0c10'
    };
  };

  const backdropStyle = getBackdropStyle();

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
      {/* 背景层 */}
      <div 
        className="absolute inset-0"
        style={backdropStyle}
      />

      {/* TV 遮罩层（模拟家庭观影环境） */}
      <div className="relative w-full h-full flex items-center justify-center z-10">
        <div 
          className={`relative overflow-hidden ${isWideAspect ? 'w-[92%] h-[82%]' : 'w-[88%] h-[88%]'}`}
          style={{
            aspectRatio: theaterAspect === '2.39:1' ? '2.39/1' : 
                        theaterAspect === '1.9:1' ? '1.9/1' : 
                        theaterAspect === '16:9' ? '16/9' : '4/3',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {/* 内容区域 */}
          <div className="absolute inset-0 flex flex-col justify-end items-center pb-[8%] px-8">
            {topElement && (
              <div className="mb-auto pt-[15%]">
                {topElement}
              </div>
            )}
            {bottomElement && (
              <div className="mt-auto pb-[8%]">
                {bottomElement}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 引导线 */}
      {guides.show && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="v9-canvas-guide-line" style={{ top: '33%' }} />
          <div className="v9-canvas-guide-line" style={{ top: '66%' }} />
        </div>
      )}
    </div>
  );
};