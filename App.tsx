
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, MessageRole, Attachment, GeneratedFile, MessagePart } from './types';
import { sendMultimodalMessage, generateSpeech, generateImage, generateVideo } from './services/geminiService';
import { fileToBase64, decode, decodeAudioData } from './utils/audio-utils';
import { 
  IconPaperClip, 
  IconSend, 
  IconMicrophone, 
  IconClose, 
  IconBot,
  IconTrash,
  IconImage,
  IconVideo,
  IconMusic,
  IconDocument,
  IconCamera,
  IconCopy,
  IconCheck,
  IconSpeakerWave,
  IconReply,
  IconDownload
} from './components/Icons';
import VoiceAssistant from './components/VoiceAssistant';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('assistant_auth') === 'true';
  });
  const [user, setUser] = useState<{ username: string; email: string } | null>(() => {
    const saved = localStorage.getItem('assistant_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      parts: [{ text: "Welcome to the future of AI. I'm Assistant. How can I help you today?" }],
      timestamp: Date.now(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [attachmentFilter, setAttachmentFilter] = useState('*/*');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [loadingText, setLoadingText] = useState("Thinking...");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleLogin = async (userData: { username: string; email: string }) => {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
    
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('assistant_auth', 'true');
    localStorage.setItem('assistant_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsAdminMode(false);
    localStorage.removeItem('assistant_auth');
    localStorage.removeItem('assistant_user');
  };

  const updateAdminStats = () => {
    if (!user) return;
    const savedUsers = localStorage.getItem('assistant_db_users');
    if (savedUsers) {
      let users = JSON.parse(savedUsers);
      const idx = users.findIndex((u: any) => u.username === user.username);
      if (idx >= 0) {
        users[idx].messageCount += 1;
        localStorage.setItem('assistant_db_users', JSON.stringify(users));
      }
    }
  };

  const handleError = async (err: any) => {
    console.error("Neural Error:", err);
    const errStr = JSON.stringify(err);
    const is403 = errStr.includes("PERMISSION_DENIED") || 
                  err.status === 403 || 
                  err.code === 403 ||
                  (err.error && (err.error.code === 403 || err.error.status === "PERMISSION_DENIED"));

    if (is403) {
      setErrorBanner("Permission Denied: Paid-tier API Key Required. Please select a valid key.");
      await (window as any).aistudio.openSelectKey();
      setTimeout(() => setErrorBanner(null), 8000);
      return true;
    }
    return false;
  };

  const handleDownloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadImage = (base64: string, name: string = "generated-art.png") => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (msg: ChatMessage) => {
    const textToCopy = msg.parts
      .map(part => part.text || '')
      .filter(text => text !== '')
      .join('\n');
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleRead = async (msg: ChatMessage) => {
    const textToRead = msg.parts
      .map(part => part.text || '')
      .join(' ');
    
    if (!textToRead.trim() || readingId) return;

    initAudio();
    setReadingId(msg.id);
    try {
      const base64 = await generateSpeech(textToRead);
      const audioBuffer = await decodeAudioData(
        decode(base64),
        audioContextRef.current!,
        24000,
        1
      );
      
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current!.destination);
      source.onended = () => setReadingId(null);
      source.start();
    } catch (error) {
      handleError(error);
      setReadingId(null);
    }
  };

  const triggerFilePicker = (filter: string) => {
    setAttachmentFilter(filter);
    setIsAttachmentMenuOpen(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const triggerCamera = () => {
    setIsAttachmentMenuOpen(false);
    setTimeout(() => {
      cameraInputRef.current?.click();
    }, 0);
  };

  const processFiles = async (files: File[]) => {
    const newAttachments: Attachment[] = [];
    for (const file of files) {
      let type: Attachment['type'] = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const base64 = await fileToBase64(file);
      const previewUrl = type === 'image' ? URL.createObjectURL(file) : '';

      newAttachments.push({
        id: uuidv4(),
        file,
        previewUrl,
        type,
        base64
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    await processFiles(files);
    if (e.target) e.target.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await processFiles(files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter(a => a.id !== id);
    });
  };

  const handleSend = async () => {
    if (!inputText.trim() && attachments.length === 0) return;
    if (isLoading) return;

    setIsLoading(true);
    setLoadingText("Thinking...");
    const userParts: MessagePart[] = [];
    
    let promptWithReply = inputText.trim();
    if (replyingTo) {
      const quotedText = replyingTo.parts.map(p => p.text).join(' ');
      promptWithReply = `[Replying to context: "${quotedText.slice(0, 100)}..."]\n\n${promptWithReply}`;
    }

    if (inputText.trim()) {
      userParts.push({ text: promptWithReply });
    }
    
    attachments.forEach(att => {
      if (att.base64) {
        userParts.push({
          inlineData: {
            mimeType: att.file.type,
            data: att.base64
          }
        });
      }
    });

    const newUserMessage: ChatMessage = {
      id: uuidv4(),
      role: MessageRole.USER,
      parts: userParts,
      timestamp: Date.now(),
    };

    let currentHistory = [...messages, newUserMessage];
    setMessages(currentHistory);
    setInputText('');
    setAttachments([]);
    setReplyingTo(null);

    try {
      const response = await sendMultimodalMessage(currentHistory);
      
      const modelParts: MessagePart[] = [];
      const toolResponses: MessagePart[] = [];

      if (response.text) {
        modelParts.push({ text: response.text });
      }

      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'create_file') {
            const { fileName, content } = fc.args as any;
            modelParts.push({ 
              fileGenerated: { fileName, content } 
            });
            toolResponses.push({
              functionResponse: {
                id: fc.id,
                name: fc.name,
                response: { success: true, fileName }
              }
            });
          } else if (fc.name === 'generate_image') {
            setLoadingText("Generating Vision...");
            const { prompt, aspectRatio } = fc.args as any;
            try {
              const imageData = await generateImage(prompt, aspectRatio);
              modelParts.push({
                inlineData: {
                  mimeType: 'image/png',
                  data: imageData
                }
              });
              toolResponses.push({
                functionResponse: {
                  id: fc.id,
                  name: fc.name,
                  response: { success: true, message: "Image generated successfully" }
                }
              });
            } catch (imgErr) {
              await handleError(imgErr);
              toolResponses.push({
                functionResponse: {
                  id: fc.id,
                  name: fc.name,
                  response: { success: false, error: "Image generation failed" }
                }
              });
            }
          } else if (fc.name === 'generate_video') {
            setLoadingText("Preparing Video Engine...");
            const { prompt, aspectRatio, resolution } = fc.args as any;
            try {
              const videoUrl = await generateVideo(prompt, aspectRatio, resolution, (status) => {
                setLoadingText(status);
              });
              modelParts.push({
                text: `[Video Result]`,
                videoUrl: videoUrl
              });
              toolResponses.push({
                functionResponse: {
                  id: fc.id,
                  name: fc.name,
                  response: { success: true, message: "Video generated successfully" }
                }
              });
            } catch (vidErr: any) {
                await handleError(vidErr);
                toolResponses.push({
                  functionResponse: {
                    id: fc.id,
                    name: fc.name,
                    response: { success: false, error: "Video generation failed" }
                  }
                });
            }
          }
        }
      }

      const modelMessage: ChatMessage = {
        id: uuidv4(),
        role: MessageRole.MODEL,
        parts: modelParts,
        timestamp: Date.now(),
      };

      currentHistory = [...currentHistory, modelMessage];
      setMessages(currentHistory);
      updateAdminStats(); // Track successful message

      if (toolResponses.length > 0) {
        setLoadingText("Confirming turn...");
        const toolMessage: ChatMessage = {
          id: uuidv4(),
          role: MessageRole.TOOL,
          parts: toolResponses,
          timestamp: Date.now(),
        };
        const updatedHistory = [...currentHistory, toolMessage];
        const finalResponse = await sendMultimodalMessage(updatedHistory);
        if (finalResponse.text) {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            role: MessageRole.MODEL,
            parts: [{ text: finalResponse.text }],
            timestamp: Date.now(),
          }]);
        }
      }

    } catch (error) {
      const handled = await handleError(error);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: MessageRole.MODEL,
        parts: [{ text: handled ? "Permission error detected. Please select a valid paid-tier API key from the dialog." : "My neural link is flickering. Please try sending that again." }],
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
      setLoadingText("Thinking...");
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col glass rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/40">
        
        {/* Permission Error Banner */}
        {errorBanner && (
          <div className="absolute top-0 left-0 w-full bg-rose-600 text-white py-3 px-8 z-[100] animate-in slide-in-from-top-full duration-500 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 p-1 rounded-lg">⚠️</span>
              <p className="text-sm font-bold tracking-tight">{errorBanner}</p>
            </div>
            <button onClick={() => setErrorBanner(null)} className="text-white/60 hover:text-white transition-colors">
              <IconClose className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Admin Hub Overlay */}
        {isAdminMode && <AdminPanel onClose={() => setIsAdminMode(false)} />}

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-white/20 z-10 bg-white/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-blue-500/10 border border-slate-100 group overflow-hidden">
              <IconBot className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Assistant Hub</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Active: {user?.username}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user?.username.toLowerCase() === 'admin' && (
              <button 
                onClick={() => setIsAdminMode(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Admin Panel
              </button>
            )}
            <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Disconnect"
            >
                <IconTrash className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Chat Content */}
        <main 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
        >
          {messages.filter(m => m.role !== MessageRole.TOOL).map((msg) => (
            <div 
              key={msg.id}
              className={`flex items-start gap-4 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                msg.role === MessageRole.USER 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white border border-slate-100'
              }`}>
                {msg.role === MessageRole.USER ? <span className="text-xs font-black">YOU</span> : <IconBot className="w-9 h-9" />}
              </div>
              <div className={`max-w-[75%] space-y-2 ${msg.role === MessageRole.USER ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-5 py-3.5 rounded-3xl shadow-sm text-[15px] leading-relaxed group relative ${
                  msg.role === MessageRole.USER 
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-tr-none shadow-indigo-200' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-white shadow-xl'
                }`}>
                  {msg.parts.map((part, i) => (
                    <div key={i} className="space-y-4">
                      {part.text && part.text !== '[Video Result]' && <p className="whitespace-pre-wrap">{part.text}</p>}
                      
                      {part.fileGenerated && (
                        <div className="mt-2 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4 group/file">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm group-hover/file:scale-110 transition-transform">
                              <IconDocument className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">File Generated</div>
                              <div className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{part.fileGenerated.fileName}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDownloadFile(part.fileGenerated!)}
                            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-90"
                            title="Download File"
                          >
                            <IconDownload className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {part.videoUrl && (
                        <div className="mt-2 group/video relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-black aspect-video max-h-96">
                          <video 
                            src={part.videoUrl} 
                            controls 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute top-3 left-3 bg-blue-600 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-bold uppercase tracking-widest border border-white/10 shadow-lg">
                            Veo Cinematic
                          </div>
                          <a 
                            href={part.videoUrl} 
                            download="ai-cinematic.mp4"
                            className="absolute bottom-3 right-3 p-2.5 bg-white text-slate-800 rounded-xl opacity-0 group-hover/video:opacity-100 transition-opacity shadow-xl hover:bg-blue-50 flex items-center gap-2"
                          >
                            <IconDownload className="w-5 h-5" />
                            <span className="text-xs font-bold pr-1">Save MP4</span>
                          </a>
                        </div>
                      )}

                      {part.inlineData && (
                        <div className="relative group/media rounded-2xl overflow-hidden border border-slate-100 shadow-md bg-slate-50">
                          {part.inlineData.mimeType.startsWith('image/') ? (
                            <>
                              <img 
                                src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                                alt="Vision input" 
                                className="max-h-96 w-full object-cover hover:scale-[1.02] transition-transform cursor-zoom-in"
                              />
                              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-bold uppercase tracking-widest border border-white/10">
                                AI Image
                              </div>
                              <button 
                                onClick={() => handleDownloadImage(part.inlineData!.data)}
                                className="absolute bottom-3 right-3 p-2.5 bg-white text-slate-800 rounded-xl opacity-0 group-hover/media:opacity-100 transition-opacity shadow-xl hover:bg-blue-50"
                                title="Download high-res"
                              >
                                <IconDownload className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <div className="p-4 bg-slate-800 text-white flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <IconPaperClip className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium uppercase tracking-wider">{part.inlineData.mimeType.split('/')[1]} attached</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className={`flex items-center gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleCopy(msg)}
                      className="p-1 rounded-md text-slate-300 hover:text-indigo-500 hover:bg-slate-100 transition-all"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleRead(msg)}
                      className={`p-1 rounded-md text-slate-300 hover:text-blue-500 hover:bg-slate-100 transition-all ${readingId === msg.id ? 'text-blue-500 animate-pulse' : ''}`}
                      title="Read aloud"
                    >
                      <IconSpeakerWave className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 rounded-md text-slate-300 hover:text-emerald-500 hover:bg-slate-100 transition-all"
                      title="Reply"
                    >
                      <IconReply className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center border border-slate-100 animate-pulse">
                <IconBot className="w-9 h-9 opacity-50" />
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse max-w-[200px] truncate">{loadingText}</span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Input Dock */}
        <footer className="p-6 bg-white border-t border-slate-100 relative">
          
          {/* Reply Preview */}
          {replyingTo && (
            <div className="mb-4 bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-1 bg-blue-500 rounded-full h-full min-h-[2rem]"></div>
              <div className="flex-1 overflow-hidden">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                  Replying to {replyingTo.role === MessageRole.MODEL ? 'Assistant' : 'You'}
                </div>
                <p className="text-xs text-slate-500 truncate italic">
                  {replyingTo.parts.map(p => p.text).join(' ')}
                </p>
              </div>
              <button 
                onClick={() => setReplyingTo(null)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-6 mb-2">
              {attachments.map((att) => (
                <div key={att.id} className="relative group flex-shrink-0 animate-in fade-in zoom-in duration-300">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
                    {att.type === 'image' ? (
                      <img src={att.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center p-3 text-center">
                        <IconPaperClip className="w-8 h-8 text-blue-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate w-full">{att.file.name.split('.').pop()}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 transition-all hover:rotate-90"
                  >
                    <IconClose className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attachment Menu Popover */}
          {isAttachmentMenuOpen && (
            <div 
              ref={menuRef}
              className="absolute bottom-[100%] left-6 mb-4 bg-white border border-slate-200 p-2 rounded-[2rem] shadow-2xl flex gap-2 animate-in slide-in-from-bottom-4 duration-300 z-50"
            >
              {[
                { label: 'Photos', icon: IconImage, filter: 'image/*', color: 'bg-rose-500' },
                { label: 'Videos', icon: IconVideo, filter: 'video/*', color: 'bg-purple-500' },
                { label: 'Audio', icon: IconMusic, filter: 'audio/*', color: 'bg-blue-500' },
                { label: 'Files', icon: IconDocument, filter: '*/*', color: 'bg-slate-700' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => triggerFilePicker(opt.filter)}
                  className="flex flex-col items-center gap-1.5 p-3 px-4 hover:bg-slate-50 rounded-[1.5rem] transition-all group"
                >
                  <div className={`w-12 h-12 ${opt.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <opt.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-50 p-2.5 pl-4 rounded-[2rem] shadow-inner border border-slate-100 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                className={`p-3 rounded-2xl transition-all ${isAttachmentMenuOpen ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg' : 'text-slate-400 hover:text-blue-600 hover:bg-white'}`}
                title="Attachment options"
              >
                <IconPaperClip className="w-6 h-6" />
              </button>
              
              <button 
                onClick={triggerCamera}
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl transition-all"
                title="Capture Photo/Video"
              >
                <IconCamera className="w-6 h-6" />
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept={attachmentFilter}
              multiple 
              className="hidden" 
            />

            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleFileUpload} 
              accept="image/*,video/*"
              capture="environment"
              className="hidden" 
            />

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message Assistant..."
              className="flex-1 bg-transparent py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none font-medium"
            />
            
            <div className="flex items-center gap-1.5 pr-1">
              <button 
                onClick={() => { initAudio(); setIsVoiceMode(true); }}
                className="p-3 text-blue-600 hover:bg-white rounded-2xl transition-all relative group"
                title="Live Talk"
              >
                <IconMicrophone className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              </button>
              
              <button 
                onClick={handleSend}
                disabled={isLoading || (!inputText.trim() && attachments.length === 0)}
                className={`p-3.5 rounded-[1.25rem] transition-all flex items-center justify-center shadow-lg ${
                  isLoading || (!inputText.trim() && attachments.length === 0)
                  ? 'bg-slate-200 text-slate-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 active:scale-95'
                }`}
              >
                <IconSend className="w-6 h-6" />
              </button>
            </div>
          </div>
        </footer>

        {isVoiceMode && (
          <VoiceAssistant onClose={() => setIsVoiceMode(false)} />
        )}
      </div>
    </div>
  );
};

export default App;
