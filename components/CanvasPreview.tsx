
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ProjectState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface CanvasPreviewProps {
  state: ProjectState;
  isRecording: boolean;
  onRecordingComplete?: () => void;
  playbackTime: number; // 0 to Total Duration
}

export interface CanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

const CanvasPreview = forwardRef<CanvasRef, CanvasPreviewProps>(({ state, isRecording, playbackTime }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stickerImageRef = useRef<HTMLImageElement | null>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  // Handle Video Background
  useEffect(() => {
    if (state.background.type === 'video') {
      const video = document.createElement('video');
      video.src = state.background.value;
      video.loop = true;
      video.muted = true;
      video.play().catch(e => console.log("Video play failed", e));
      videoRef.current = video;
    } else {
      videoRef.current = null;
    }
  }, [state.background]);

  // Handle Sticker Image
  useEffect(() => {
    if (state.sticker) {
      const img = new Image();
      img.src = state.sticker;
      img.onload = () => {
        stickerImageRef.current = img;
      };
      stickerImageRef.current = img;
    } else {
      stickerImageRef.current = null;
    }
  }, [state.sticker]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // 1. Draw Background
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      if (state.background.type === 'gradient') {
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        // Simple parsing for the 2-color linear-gradient constants
        const colors = state.background.value.match(/#[A-Za-z0-9]+/g);
        if (colors && colors.length >= 2) {
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else if (state.background.type === 'image') {
        const img = new Image();
        img.src = state.background.value;
        if (img.complete) {
          const scale = Math.max(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
          const x = (CANVAS_WIDTH / 2) - (img.width / 2) * scale;
          const y = (CANVAS_HEIGHT / 2) - (img.height / 2) * scale;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
      } else if (state.background.type === 'video' && videoRef.current) {
        const video = videoRef.current;
        if (video.videoWidth > 0) {
          const scale = Math.max(CANVAS_WIDTH / video.videoWidth, CANVAS_HEIGHT / video.videoHeight);
          const x = (CANVAS_WIDTH / 2) - (video.videoWidth / 2) * scale;
          const y = (CANVAS_HEIGHT / 2) - (video.videoHeight / 2) * scale;
          ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
        }
      }

      // 2. Effects
      if (state.blur > 0 || state.brightness !== 100) {
        let filterStr = '';
        if (state.blur > 0) filterStr += `blur(${state.blur}px) `;
        if (state.brightness !== 100) filterStr += `brightness(${state.brightness}%) `;
        ctx.filter = filterStr.trim();
      }
      
      if (state.overlayOpacity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${state.overlayOpacity / 100})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      ctx.filter = 'none';

      // 3. Draw Sticker/Logo (Watermark style)
      if (stickerImageRef.current && stickerImageRef.current.complete) {
        const img = stickerImageRef.current;
        const targetWidth = 200; // Small logo/sticker size
        const targetHeight = (img.height / img.width) * targetWidth;
        const padding = 60;
        
        ctx.save();
        ctx.globalAlpha = state.stickerOpacity / 100;
        ctx.drawImage(
          img, 
          (CANVAS_WIDTH / 2) - (targetWidth / 2), 
          CANVAS_HEIGHT - targetHeight - padding, 
          targetWidth, 
          targetHeight
        );
        ctx.restore();
      }

      // 4. Draw Text
      const lineGap = state.typography.fontSize * state.typography.lineSpacing;
      const totalHeight = (state.lines.length - 1) * lineGap;
      const startY = (CANVAS_HEIGHT / 2) - (totalHeight / 2) + state.typography.verticalOffset;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const italicPrefix = state.typography.italic ? 'italic ' : '';
      const boldPrefix = state.typography.bold ? 'bold ' : '';
      ctx.font = `${italicPrefix}${boldPrefix}${state.typography.fontSize}px ${state.typography.fontFamily}`;
      
      // Modern Canvas letterSpacing support
      if ('letterSpacing' in ctx) {
        (ctx as any).letterSpacing = `${state.typography.letterSpacing}px`;
      }

      ctx.fillStyle = state.typography.color;
      
      if (state.typography.shadow > 0) {
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = state.typography.shadow * 5;
        ctx.shadowOffsetX = state.typography.shadow;
        ctx.shadowOffsetY = state.typography.shadow;
      } else {
        ctx.shadowColor = 'transparent';
      }

      state.lines.forEach((line, index) => {
        const lineY = startY + index * lineGap;
        const lineDuration = state.animation.holdDuration;
        const fadeDuration = state.animation.speed === 'Slow' ? 1.5 : state.animation.speed === 'Medium' ? 1.0 : 0.5;
        
        const relativeTime = playbackTime - (index * (lineDuration / 2)); 
        let opacity = 0;
        let translateY = 0;
        let scale = 1;

        if (state.animation.type === 'Minimal') {
          opacity = playbackTime > index * (lineDuration / 2) ? 1 : 0;
        } else if (state.animation.type === 'Soft Fade') {
          opacity = Math.min(1, Math.max(0, relativeTime / fadeDuration));
        } else if (state.animation.type === 'Gentle Rise') {
          opacity = Math.min(1, Math.max(0, relativeTime / fadeDuration));
          translateY = (1 - opacity) * 30; 
        } else if (state.animation.type === 'Breathe') {
          opacity = Math.min(1, Math.max(0, relativeTime / fadeDuration));
          const pulseSpeed = 2000;
          scale = 1 + Math.sin(Date.now() / pulseSpeed) * 0.02;
        }

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(CANVAS_WIDTH / 2, lineY + translateY);
        ctx.scale(scale, scale);
        ctx.fillText(line, 0, 0);
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [state, playbackTime]);

  return (
    <div className="canvas-container w-full relative group">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full object-contain bg-gray-50"
      />
      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          RECORDING...
        </div>
      )}
      {!isRecording && playbackTime === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
           <span className="text-white bg-black/40 px-4 py-2 rounded-full text-sm">Preview Screen</span>
        </div>
      )}
    </div>
  );
});

CanvasPreview.displayName = 'CanvasPreview';

export default CanvasPreview;
