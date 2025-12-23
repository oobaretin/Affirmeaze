
export type BackgroundType = 'gradient' | 'image' | 'video';

export interface BackgroundSource {
  id: string;
  type: BackgroundType;
  value: string; // CSS gradient or Object URL
  name?: string;
  thumbnail?: string;
}

export type FontStyle = 'Serif' | 'Sans' | 'Script' | 'Modern';

export interface TypographySettings {
  fontFamily: string;
  fontSize: number;
  italic: boolean;
  bold: boolean;
  color: string;
  shadow: number;
  letterSpacing: number;
  lineSpacing: number;
  verticalOffset: number;
}

export type AnimationType = 'Soft Fade' | 'Gentle Rise' | 'Breathe' | 'Minimal';
export type AnimationSpeed = 'Slow' | 'Medium' | 'Fast';

export interface AnimationSettings {
  type: AnimationType;
  speed: AnimationSpeed;
  holdDuration: number; // seconds per line
}

export interface ProjectState {
  lines: string[];
  background: BackgroundSource;
  typography: TypographySettings;
  animation: AnimationSettings;
  overlayOpacity: number;
  blur: number;
  brightness: number;
  sticker: string | null;
  stickerOpacity: number;
}
