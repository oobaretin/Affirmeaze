
import { ProjectState, BackgroundSource, FontStyle } from './types';

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export const DEFAULT_GRADIENTS: BackgroundSource[] = [
  { id: 'sky', type: 'gradient', value: 'linear-gradient(to bottom, #E0F7FA, #B2EBF2)', name: 'Soft Sky' },
  { id: 'beige', type: 'gradient', value: 'linear-gradient(to bottom, #F5F5DC, #EEE8AA)', name: 'Gentle Beige' },
  { id: 'sage', type: 'gradient', value: 'linear-gradient(to bottom, #C5E1A5, #9DC183)', name: 'Sage Calm' },
  { id: 'cream', type: 'gradient', value: 'linear-gradient(to bottom, #FFF8DC, #FAEBD7)', name: 'Cream Dream' },
  { id: 'lavender', type: 'gradient', value: 'linear-gradient(to bottom, #E8EAF6, #C5CAE9)', name: 'Peaceful Lavender' },
  { id: 'sunset', type: 'gradient', value: 'linear-gradient(to bottom, #FFE0B2, #FFCCBC)', name: 'Warm Sunset' },
];

export const FONTS: Record<FontStyle, string> = {
  Serif: "'Lora', serif",
  Sans: "'Nunito', sans-serif",
  Script: "'Dancing Script', cursive",
  Modern: "'Poppins', sans-serif",
};

export const INITIAL_STATE: ProjectState = {
  lines: [
    "Breathe.",
    "You are allowed to rest.",
    "You are doing enough."
  ],
  background: DEFAULT_GRADIENTS[1],
  typography: {
    fontFamily: FONTS.Serif,
    fontSize: 70,
    italic: true,
    bold: false,
    color: '#4A4A4A',
    shadow: 2,
    letterSpacing: 0,
    lineSpacing: 1.5,
    verticalOffset: 0,
  },
  animation: {
    type: 'Soft Fade',
    speed: 'Slow',
    holdDuration: 3,
  },
  overlayOpacity: 0,
  blur: 0,
  brightness: 100,
  sticker: null,
  stickerOpacity: 80,
};
