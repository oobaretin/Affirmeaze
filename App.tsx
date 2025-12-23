
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { INITIAL_STATE, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { ProjectState } from './types';
import CanvasPreview, { CanvasRef } from './components/CanvasPreview';
import Controls from './components/Controls';

const App: React.FC = () => {
  const [state, setState] = useState<ProjectState>(INITIAL_STATE);
  const [isRecording, setIsRecording] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [lastRecordedUrl, setLastRecordedUrl] = useState<string | null>(null);
  const [recordedExtension, setRecordedExtension] = useState<string>('webm');
  const [isSharingSupported, setIsSharingSupported] = useState(false);
  
  const canvasRef = useRef<CanvasRef>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Check if Web Share API is available
    if (navigator.share && navigator.canShare) {
      setIsSharingSupported(true);
    }
  }, []);

  const runPreview = useCallback(() => {
    if (isRecording) return;
    setPlaybackTime(0);
    setLastRecordedUrl(null);

    const totalDuration = state.animation.holdDuration * state.lines.length;
    let startTime = Date.now();
    
    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed <= totalDuration) {
        setPlaybackTime(elapsed);
        requestAnimationFrame(tick);
      } else {
        setPlaybackTime(0);
      }
    };
    tick();
  }, [state, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleRecord = useCallback(async () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    setIsRecording(true);
    setPlaybackTime(0);
    setLastRecordedUrl(null);
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=h264') 
      ? 'video/mp4;codecs=h264' 
      : 'video/webm;codecs=vp9';
    
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    setRecordedExtension(extension);

    // Setup Canvas Stream
    const canvasStream = canvas.captureStream(30);
    
    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 8000000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setLastRecordedUrl(url);
      setIsRecording(false);
      setRecordingProgress(0);
      
      // Auto-download
      const a = document.createElement('a');
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      a.href = url;
      a.download = `affirmeaze-reel-${timestamp}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100);

    const totalDuration = state.animation.holdDuration * state.lines.length;
    let startTime = Date.now();
    
    const recordTick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed <= totalDuration) {
        setPlaybackTime(elapsed);
        setRecordingProgress((elapsed / totalDuration) * 100);
        requestAnimationFrame(recordTick);
      } else {
        stopRecording();
      }
    };
    recordTick();
  }, [state, stopRecording]);

  const downloadManual = useCallback(() => {
    if (lastRecordedUrl) {
      const a = document.createElement('a');
      a.href = lastRecordedUrl;
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      a.download = `affirmeaze-reel-${timestamp}.${recordedExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [lastRecordedUrl, recordedExtension]);

  const handleShare = async () => {
    if (!lastRecordedUrl) return;
    try {
      const response = await fetch(lastRecordedUrl);
      const blob = await response.blob();
      const file = new File([blob], `affirmeaze-reel.${recordedExtension}`, { type: blob.type });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My AffirmEaze Reel',
          text: 'Created with AffirmEaze ✨',
        });
      } else {
        alert("Sharing files is not supported in this browser.");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h1 className="text-xl font-medium tracking-tight text-gray-800">AffirmEaze</h1>
          </div>
          <div className="hidden md:flex gap-4 text-sm text-gray-400 italic">
            "Simple. Beautiful. Meaningful."
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 xl:col-span-4 order-2 lg:order-1">
            <Controls 
              state={state} 
              setState={setState} 
              onPreview={runPreview} 
              onRecord={handleRecord}
              onDownload={downloadManual}
              lastRecordedUrl={lastRecordedUrl}
              isRecording={isRecording}
              recordingProgress={recordingProgress}
            />
          </div>

          <div className="lg:col-span-7 xl:col-span-8 order-1 lg:order-2 lg:sticky lg:top-24">
             <div className="flex flex-col items-center">
                <div className="w-full max-w-[400px]">
                  <CanvasPreview 
                    ref={canvasRef} 
                    state={state} 
                    isRecording={isRecording}
                    playbackTime={playbackTime}
                  />
                  
                  {lastRecordedUrl && !isRecording && (
                    <div className="mt-6 p-5 bg-green-50 border border-green-100 rounded-2xl flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                      <div className="text-green-700 font-medium text-sm flex items-center gap-2">
                        <span className="text-xl">✨</span> Your reel is ready!
                      </div>
                      <p className="text-xs text-green-600 text-center px-2 leading-relaxed">
                        The video has been prepared. If it didn't auto-download, use the button in the controls panel or below.
                      </p>
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={downloadManual}
                          className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          📥 Download
                        </button>
                        {isSharingSupported && (
                          <button 
                            onClick={handleShare}
                            className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            📤 Share
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-center">
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider font-medium">
                      Standard Reel: {CANVAS_WIDTH}x{CANVAS_HEIGHT}
                    </span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <section className="mt-20 border-t border-gray-100 pt-12">
          <h2 className="text-2xl font-semibold mb-8 text-center text-gray-700">Instagram Creator Tips ✨</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">📸</div>
              <h3 className="font-semibold mb-2">Optimal Posting</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Reels are best when they are 10-15s long. Use our duration slider to hit that sweet spot for the Instagram algorithm.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">🏷️</div>
              <h3 className="font-semibold mb-2">Hashtags</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Boost your reach with: #AffirmEaze #Wellness #Mindfulness #SelfCare #Affirmations #Healing #MentalHealth.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">⏰</div>
              <h3 className="font-semibold mb-2">Best Times</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Post between 6-9 AM for morning motivation or 7-10 PM for an evening wind-down to maximize engagement.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-12 text-center text-gray-400 text-xs pb-8">
        © 2024 AffirmEaze Wellness Tools. All rights reserved. 🤍
      </footer>
    </div>
  );
};

export default App;
