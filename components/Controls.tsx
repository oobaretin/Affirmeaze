
import React, { useState } from 'react';
import { ProjectState, FontStyle, AnimationType, AnimationSpeed } from '../types';
import { DEFAULT_GRADIENTS, FONTS } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface ControlsProps {
  state: ProjectState;
  setState: React.Dispatch<React.SetStateAction<ProjectState>>;
  onPreview: () => void;
  onRecord: () => void;
  onDownload: () => void;
  lastRecordedUrl: string | null;
  isRecording: boolean;
  recordingProgress: number;
}

const AI_CATEGORIES = [
  { 
    id: 'joy', 
    label: 'Joy & Happiness', 
    icon: '☀️', 
    prompt: 'cultivating pure joy, happiness, and lightheartedness',
    presets: ["Choose joy.", "Happiness flows through me.", "I am light and free."]
  },
  { 
    id: 'confidence', 
    label: 'Confidence & Self-Esteem', 
    icon: '✨', 
    prompt: 'building unshakeable confidence, self-worth, and belief in oneself',
    presets: ["I am capable.", "My voice is powerful.", "I believe in myself."]
  },
  { 
    id: 'peace', 
    label: 'Peace & Serenity', 
    icon: '🕊️', 
    prompt: 'finding deep inner peace, serenity, and emotional tranquility',
    presets: ["Breathe.", "You are safe here.", "Peace is within me."]
  },
  { 
    id: 'motivation', 
    label: 'Motivation & Drive', 
    icon: '🚀', 
    prompt: 'finding high motivation, drive, and the inner strength to pursue goals',
    presets: ["Stay driven.", "I am capable of greatness.", "Today is for progress."]
  }
];

const IMAGE_PRESETS = [
  { id: 'img_clouds', label: 'Clouds', icon: '☁️', prompt: 'Soft fluffy pastel clouds in a minimal dreamlike sky' },
  { id: 'img_sun', label: 'Sunshine', icon: '☀️', prompt: 'Warm golden hour sunlight rays in a bright minimal room' },
  { id: 'img_sea', label: 'Sea', icon: '🌊', prompt: 'Calm ocean ripples with soft morning light' },
  { id: 'img_falls', label: 'Waterfall', icon: '💧', prompt: 'Serene distant waterfall in a soft mist nature landscape' },
  { id: 'img_mount', label: 'Mountains', icon: '🏔️', prompt: 'Minimal foggy mountain silhouettes at dawn' },
  { id: 'img_nature', label: 'Nature', icon: '🍃', prompt: 'Soft focus green leaves with beautiful bokeh' },
];

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-medium text-gray-700 hover:text-indigo-600 transition-colors"
      >
        <span>{title}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {isOpen && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
};

const Controls: React.FC<ControlsProps> = ({ state, setState, onPreview, onRecord, onDownload, lastRecordedUrl, isRecording, recordingProgress }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [imgPrompt, setImgPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(AI_CATEGORIES[0]);

  const handleAIGenerateText = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a NEW, UNIQUE 3-line calming wellness affirmation for the category of ${selectedCategory.prompt}. 
        Make it different from standard ones. 
        Format strictly as 3 lines separated by newlines. 
        Line 1: 1-3 words. Line 2: 4-7 words. Line 3: 4-7 words.
        Return ONLY the text.`,
      });
      const lines = response.text?.split('\n').filter(l => l.trim().length > 0).slice(0, 3);
      if (lines?.length === 3) setState(prev => ({ ...prev, lines: lines.map(l => l.trim()) }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || imgPrompt;
    if (!finalPrompt.trim()) return;
    setIsGeneratingImg(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A professional minimalist wellness background, ${finalPrompt}, high quality, cinematic lighting, vertical 9:16` }] },
        config: { imageConfig: { aspectRatio: "9:16" } },
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setState(prev => ({
            ...prev,
            background: { id: Math.random().toString(), type: 'image', value: `data:image/png;base64,${part.inlineData.data}`, name: 'AI Image' }
          }));
          break;
        }
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong with image generation.");
    } finally {
      setIsGeneratingImg(false);
      setImgPrompt('');
    }
  };

  const handleLineChange = (i: number, val: string) => {
    const newLines = [...state.lines];
    newLines[i] = val;
    setState(prev => ({ ...prev, lines: newLines }));
  };

  const handleCategorySelect = (cat: typeof AI_CATEGORIES[0]) => {
    setSelectedCategory(cat);
    setState(prev => ({ ...prev, lines: cat.presets }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-h-[85vh] overflow-y-auto">
      
      <Section title="✨ AI Image Backgrounds" defaultOpen>
        <div className="space-y-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Fast Generation (Free Tier Friendly)</p>
          <div className="grid grid-cols-3 gap-2">
            {IMAGE_PRESETS.map((p) => (
              <button
                key={p.id}
                disabled={isGeneratingImg || isRecording}
                onClick={() => handleGenerateImage(p.prompt)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-gray-50 hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-[10px] font-medium text-gray-500">{p.label}</span>
              </button>
            ))}
          </div>
          <div className="relative pt-2">
            <input
              type="text"
              value={imgPrompt}
              onChange={(e) => setImgPrompt(e.target.value)}
              placeholder="Custom scene (e.g. 'misty lake at dawn')..."
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={() => handleGenerateImage()}
              disabled={isGeneratingImg || !imgPrompt.trim()}
              className="absolute right-2 top-4 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:bg-gray-200"
            >
              {isGeneratingImg ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '✨'}
            </button>
          </div>
        </div>
      </Section>

      <Section title="✨ AI Text Magic">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {AI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${selectedCategory.id === cat.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleAIGenerateText}
            disabled={isGenerating || isRecording}
            className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${isGenerating ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'}`}
          >
            {isGenerating ? 'Generating...' : '✨ Rewrite with AI'}
          </button>
        </div>
      </Section>

      <Section title="📝 Edit Affirmation">
        <div className="space-y-3">
          {state.lines.map((line, i) => (
            <input
              key={i}
              type="text"
              value={line}
              onChange={(e) => handleLineChange(i, e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border rounded-lg text-sm"
            />
          ))}
        </div>
      </Section>

      <Section title="🖼️ Background Styles">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {DEFAULT_GRADIENTS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setState(p => ({ ...p, background: bg }))}
                className={`h-12 rounded-lg border-2 ${state.background.id === bg.id ? 'border-indigo-400' : 'border-transparent'}`}
                style={{ background: bg.value }}
              />
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-500 flex justify-between">Overlay Opacity <span>{state.overlayOpacity}%</span></label>
            <input type="range" min="0" max="70" value={state.overlayOpacity} onChange={e => setState(p => ({ ...p, overlayOpacity: parseInt(e.target.value) }))} className="w-full accent-indigo-400" />
            <label className="text-xs text-gray-500 flex justify-between">Blur <span>{state.blur}px</span></label>
            <input type="range" min="0" max="20" value={state.blur} onChange={e => setState(p => ({ ...p, blur: parseInt(e.target.value) }))} className="w-full accent-indigo-400" />
          </div>
        </div>
      </Section>

      <Section title="✨ Animation">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {['Soft Fade', 'Gentle Rise', 'Breathe', 'Minimal'].map(type => (
              <button
                key={type}
                onClick={() => setState(p => ({ ...p, animation: { ...p.animation, type: type as AnimationType } }))}
                className={`py-1.5 text-xs rounded border ${state.animation.type === type ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 p-1 rounded">
            {['Slow', 'Medium', 'Fast'].map(speed => (
              <button
                key={speed}
                onClick={() => setState(p => ({ ...p, animation: { ...p.animation, speed: speed as AnimationSpeed } }))}
                className={`flex-1 py-1 text-[10px] font-bold rounded ${state.animation.speed === speed ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
              >
                {speed}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 flex justify-between">Hold Duration <span>{state.animation.holdDuration}s</span></label>
            <input type="range" min="2" max="5" step="0.5" value={state.animation.holdDuration} onChange={e => setState(p => ({ ...p, animation: { ...p.animation, holdDuration: parseFloat(e.target.value) }}))} className="w-full accent-indigo-400" />
          </div>
        </div>
      </Section>

      <Section title="✍️ Typography">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FONTS) as FontStyle[]).map(style => (
              <button
                key={style}
                onClick={() => setState(p => ({ ...p, typography: { ...p.typography, fontFamily: FONTS[style] }}))}
                className={`py-1.5 text-xs rounded border ${state.typography.fontFamily === FONTS[style] ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
              >
                {style}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block">Font Size <span>{state.typography.fontSize}px</span></label>
              <input type="range" min="40" max="140" value={state.typography.fontSize} onChange={e => setState(p => ({ ...p, typography: { ...p.typography, fontSize: parseInt(e.target.value) }}))} className="w-full accent-indigo-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block">Letter Spacing <span>{state.typography.letterSpacing}px</span></label>
              <input type="range" min="-5" max="20" value={state.typography.letterSpacing} onChange={e => setState(p => ({ ...p, typography: { ...p.typography, letterSpacing: parseInt(e.target.value) }}))} className="w-full accent-indigo-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block">Line Height <span>{state.typography.lineSpacing}x</span></label>
              <input type="range" min="1" max="4" step="0.1" value={state.typography.lineSpacing} onChange={e => setState(p => ({ ...p, typography: { ...p.typography, lineSpacing: parseFloat(e.target.value) }}))} className="w-full accent-indigo-400" />
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block">Vertical Position <span>{state.typography.verticalOffset}px</span></label>
                <input 
                  type="range" 
                  min="-600" 
                  max="600" 
                  value={state.typography.verticalOffset} 
                  onChange={e => setState(p => ({ 
                    ...p, 
                    typography: { ...p.typography, verticalOffset: parseInt(e.target.value) } 
                  }))} 
                  className="w-full accent-indigo-400" 
                />
              </div>
              <div className="w-12">
                <label className="text-xs text-gray-500 block">Color</label>
                <input type="color" value={state.typography.color} onChange={e => setState(p => ({ ...p, typography: { ...p.typography, color: e.target.value }}))} className="w-full h-8 cursor-pointer rounded border-none bg-transparent" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="🎬 Export & Record" defaultOpen>
        <div className="space-y-3 pt-2">
          {isRecording && (
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{ width: `${recordingProgress}%` }}></div>
            </div>
          )}
          
          {lastRecordedUrl && !isRecording && (
            <button 
              onClick={onDownload} 
              className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 shadow-md shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-2 mb-2 animate-bounce-subtle"
            >
              📥 DOWNLOAD LAST RECORDED REEL
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onPreview} 
              disabled={isRecording || isGenerating || isGeneratingImg} 
              className="py-3.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 disabled:opacity-50 transition-colors"
            >
              ▶ Preview
            </button>
            <button 
              onClick={onRecord} 
              disabled={isRecording || isGenerating || isGeneratingImg} 
              className={`py-3.5 font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isRecording ? 'bg-red-500 text-white shadow-red-100' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
            >
              {isRecording ? '🔴 Recording' : '🎥 Record'}
            </button>
          </div>
          
          <p className="text-[10px] text-gray-400 text-center italic">
            Videos are exported in 1080x1920 Instagram Reel format.
          </p>
        </div>
      </Section>
    </div>
  );
};

export default Controls;
