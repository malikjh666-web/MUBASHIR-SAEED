
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, encode, decodeAudioData, createPcmBlob } from '../utils/audio-utils';
import { IconClose, IconMicrophone } from './Icons';

interface VoiceAssistantProps {
  onClose: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const aiRef = useRef<GoogleGenAI | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsActive(false);
  }, []);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60 + (isAiThinking ? 5 : 0);

      const avg = dataArray.reduce((a, b) => a + b) / bufferLength;
      const pulseSize = (avg / 255) * 50;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 + (avg / 255)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      const bars = 80;
      for (let i = 0; i < bars; i++) {
        const rads = (Math.PI * 2) / bars;
        const barHeight = (dataArray[i % bufferLength] / 255) * 80;
        const x = centerX + Math.cos(rads * i) * radius;
        const y = centerY + Math.sin(rads * i) * radius;
        const xEnd = centerX + Math.cos(rads * i) * (radius + barHeight);
        const yEnd = centerY + Math.sin(rads * i) * (radius + barHeight);

        ctx.strokeStyle = `hsla(${210 + (i / bars) * 60}, 100%, 60%, 0.8)`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
      }
    };
    render();
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      aiRef.current = ai;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputAudioContext, output: outputAudioContext };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const analyser = inputAudioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      drawVisualizer();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            source.connect(analyser); 
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(e => {
                console.error("Live session failed:", e);
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + ' ' + message.serverContent?.outputTranscription?.text);
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsAiThinking(true);
              const ctx = audioContextRef.current?.output;
              if (ctx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsAiThinking(false);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setTranscription('');
              setIsAiThinking(false);
            }
          },
          onerror: (e: any) => {
            const errStr = JSON.stringify(e);
            if (errStr.includes("PERMISSION_DENIED")) {
               setError('Authorization Error: Please select a valid paid-tier API Key.');
               (window as any).aistudio.openSelectKey();
            } else {
               setError('An error occurred during the session.');
            }
            cleanup();
          },
          onclose: () => cleanup(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a helpful, conversational AI assistant. Respond naturally and concisely.',
          outputAudioTranscription: {},
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      if (err.message?.includes("PERMISSION_DENIED") || err.status === 403) {
        setError("Permission Denied: Use a paid-tier API Key.");
        await (window as any).aistudio.openSelectKey();
      } else {
        setError(err.message || 'Access denied.');
      }
    }
  };

  useEffect(() => {
    startSession();
    return cleanup;
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px]"></div>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-3 rounded-full glass hover:bg-white/20 transition-all z-[110]"
      >
        <IconClose className="w-8 h-8" />
      </button>

      <div className="relative flex flex-col items-center z-[101] w-full max-w-lg px-6">
        <div className="relative mb-12 flex items-center justify-center">
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={400} 
            className="w-80 h-80"
          />
          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${isAiThinking ? 'scale-110' : 'scale-100'}`}>
            <div className="w-32 h-32 rounded-full bg-white shadow-[0_0_50px_rgba(255,255,255,0.4)] flex items-center justify-center">
              <div className={`w-28 h-28 rounded-full border-4 border-blue-100 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-white`}>
                <div className={`w-12 h-12 bg-blue-500 rounded-full ${isActive ? 'animate-pulse' : ''}`}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            {error ? 'Authorization Required' : isAiThinking ? 'AI is speaking...' : isActive ? 'Listening to you...' : 'Starting Live Talk...'}
          </h2>
          
          <div className="h-24 px-4 overflow-y-auto scrollbar-hide">
            <p className="text-blue-200 text-lg italic opacity-80 leading-relaxed font-light">
              {error || transcription || "Listening for your voice..."}
            </p>
          </div>
        </div>

        {error && (
            <button 
                onClick={() => { setError(null); startSession(); }}
                className="mt-8 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-500/20"
            >
                Retry Neural Link
            </button>
        )}

        <div className="mt-12 w-full flex justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
                <button 
                    onClick={cleanup}
                    className="p-6 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:scale-110 active:scale-95"
                >
                    <IconClose className="w-8 h-8" />
                </button>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">End Talk</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
