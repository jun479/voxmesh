import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Download, FolderOpen, Film, Music, Type, Loader2, CheckCircle, AlertCircle, ShieldCheck, Search, Captions, CaptionsOff, Monitor, Smartphone, Github } from 'lucide-react';

/**
 * voxmesh: Dark Editorial Edition v1.3
 * Clip-Based Voice Synthesizer
 */

const normalize = (str) => str.replace(/\s+/g, '').toLowerCase();

// 한글 초성 배열
const CHO_SUNG = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

// 문자열에서 초성만 추출하는 함수
const getChosung = (str) => {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032; // 0xAC00 (가)
    if (code > -1 && code < 11172) {
      result += CHO_SUNG[Math.floor(code / 588)];
    } else {
      result += str.charAt(i); // 한글이 아니거나 이미 초성이면 그대로 유지
    }
  }
  return result;
};

// 음성팩 DB
const VOICE_PACK_DATABASE = {
  "심영": "1.0.0",
  "김두한": "1.0.2",
  "조병욱": "1.0.0",
  "상하이조": "1.1.0",
  "이정재": "1.0.5",
};

const App = () => {
  const [files, setFiles] = useState({ audio: new Map(), video: new Map(), scripts: new Map() });
  const [script, setScript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isExporting, setIsExporting] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  
  const isExportingRef = useRef(false);

  const [isLoadingPack, setIsLoadingPack] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [packInfo, setPackInfo] = useState({ name: null, version: "0.0.0", rawFolderName: "", avatar: null }); 
  const [recommendations, setRecommendations] = useState([]);
  
  // 드래그 앤 드롭 상태 감지기 추가
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  // 폴더 업로드 처리 로직 (로컬 아바타 스캔 기능 추가)
  const handleFolderUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;

    setIsLoadingPack(true);
    setLoadingProgress(0);

    const firstFilePath = uploadedFiles[0].webkitRelativePath;
    const rootFolderName = firstFilePath.split('/')[0];
    
    let detectedName = "Unknown";
    let detectedVersion = "0.0.0";
    let detectedAvatar = null;

    Object.keys(VOICE_PACK_DATABASE).forEach(key => {
      if (rootFolderName.includes(key)) detectedName = key;
    });

    const versionMatch = rootFolderName.match(/(\d+\.\d+\.\d+)/);
    if (versionMatch) detectedVersion = versionMatch[0];

    const audioMap = new Map();
    const videoMap = new Map();
    const scriptMap = new Map();
    const total = uploadedFiles.length;

    for (let i = 0; i < total; i++) {
      const file = uploadedFiles[i];
      const pathLower = file.webkitRelativePath.toLowerCase();
      const originalName = file.name;
      const fileNameWithoutExt = originalName.split('.')[0];
      const ext = originalName.split('.').pop().toLowerCase();
      const nameKey = normalize(fileNameWithoutExt);
      
      const url = URL.createObjectURL(file);
      const data = { url, name: fileNameWithoutExt, folder: "" };

      // 로컬 이미지 아바타 스캔 (profile, icon 등의 이름 우선 적용)
      if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        if (!detectedAvatar || originalName.toLowerCase().includes('profile') || originalName.toLowerCase().includes('icon')) {
          detectedAvatar = url;
        }
      }

      if (pathLower.includes('/대사/')) {
        data.folder = "대사";
        scriptMap.set(nameKey, data);
      } else if (pathLower.includes('/video/')) {
        data.folder = "video";
        videoMap.set(nameKey, data);
      } else if (pathLower.includes('/audio/')) {
        data.folder = "audio";
        audioMap.set(nameKey, data);
      }

      setLoadingProgress(Math.round(((i + 1) / total) * 100));
      if (i % 30 === 0) await new Promise(r => setTimeout(r, 0));
    }

    setPackInfo({ name: detectedName, version: detectedVersion, rawFolderName: rootFolderName, avatar: detectedAvatar });
    setFiles({ audio: audioMap, video: videoMap, scripts: scriptMap });
    setIsLoadingPack(false);
  };

  // 파일 키 배열 최적화
  const allFileKeys = useMemo(() => {
    const keys = [
      ...Array.from(files.scripts.keys()),
      ...Array.from(files.video.keys()),
      ...Array.from(files.audio.keys())
    ];
    return [...new Set(keys)].sort((a, b) => b.length - a.length);
  }, [files]);

  // 그리디 토크나이저
  const matchedTokens = useMemo(() => {
    let remaining = script;
    const tokens = [];
    while (remaining.length > 0) {
      let found = false;
      for (const key of allFileKeys) {
        if (normalize(remaining).startsWith(key)) {
          const originalText = remaining.substring(0, remaining.toLowerCase().indexOf(key) + key.length);
          const actualText = remaining.substring(0, originalText.length);
          
          let source = "none";
          let clip = null;
          if (files.scripts.has(key)) { source = "script"; clip = files.scripts.get(key); }
          else if (files.video.has(key)) { source = "video"; clip = files.video.get(key); }
          else if (files.audio.has(key)) { source = "audio"; clip = files.audio.get(key); }

          tokens.push({ text: actualText, source, clip });
          remaining = remaining.substring(actualText.length);
          found = true;
          break;
        }
      }
      if (!found) {
        tokens.push({ text: remaining[0], source: "none" });
        remaining = remaining.substring(1);
      }
    }
    return tokens;
  }, [script, allFileKeys, files]);

  // 초성 검색 및 추천 기능
  useEffect(() => {
    const lastWord = normalize(script.split(/\s+/).pop() || "");
    if (!lastWord || lastWord.length < 1) {
      setRecommendations([]);
      return;
    }

    const isChosungSearch = /^[ㄱ-ㅎ]+$/.test(lastWord); 
    const matches = [];

    const searchInMap = (map, type) => {
      for (const [key, val] of map.entries()) {
        const isMatch = isChosungSearch 
          ? getChosung(key).includes(lastWord)
          : key.includes(lastWord);            

        if (isMatch) matches.push({ ...val, type });
        if (matches.length > 30) break; 
      }
    };

    searchInMap(files.scripts, '대사');
    searchInMap(files.video, 'video');
    searchInMap(files.audio, 'audio');
    
    setRecommendations(matches.slice(0, 30));
  }, [script, files]);

  const applyRecommendation = (name) => {
    const words = script.split(/\s+/);
    words.pop();
    const newScript = [...words, name].join(" ") + " ";
    setScript(newScript);
    textareaRef.current?.focus();
  };

  // 재생 로직
  useEffect(() => {
    if (isExportingRef.current) return; 

    if (isPlaying && currentIndex < matchedTokens.length) {
      if (currentIndex === -1) { setCurrentIndex(0); return; }
      const token = matchedTokens[currentIndex];
      if (token.source === "none" || !token.clip) {
        const timeout = setTimeout(() => setCurrentIndex(prev => prev + 1), 100);
        return () => clearTimeout(timeout);
      }
      const isVideo = token.source !== "audio";
      const media = document.createElement(isVideo ? 'video' : 'audio');
      media.src = token.clip.url;
      media.onloadedmetadata = () => {
        media.play();
        renderToCanvas(media, isVideo, token.text);
      };
      media.onended = () => setCurrentIndex(prev => prev + 1);
    } else if (currentIndex >= matchedTokens.length) {
      setIsPlaying(false);
      setCurrentIndex(-1);
    }
  }, [isPlaying, currentIndex]);

  // 캔버스 렌더링
  const renderToCanvas = (media, isVideo, label) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const draw = () => {
      if (media.paused || media.ended) return;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (isVideo) {
        const vRatio = media.videoWidth / media.videoHeight;
        const cRatio = canvas.width / canvas.height;
        let nw, nh, nx, ny;
        if (vRatio > cRatio) { nw = canvas.width; nh = canvas.width / vRatio; nx = 0; ny = (canvas.height - nh) / 2; }
        else { nh = canvas.height; nw = canvas.height * vRatio; nx = (canvas.width - nw) / 2; ny = 0; }
        ctx.drawImage(media, nx, ny, nw, nh);
      }
      if (showSubtitles) {
        ctx.font = '700 36px "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.fillText(label, canvas.width / 2, canvas.height - 60);
      }
      requestRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const handleExport = async () => {
    if (matchedTokens.length === 0) return;
    
    setIsExporting(true);
    isExportingRef.current = true;
    setIsPlaying(true);

    const canvas = canvasRef.current;
    const canvasStream = canvas.captureStream(30);

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioDest = audioCtx.createMediaStreamDestination();

    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
    const chunks = [];

    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const recordingPromise = new Promise(resolve => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voxmesh_${packInfo.name || 'export'}.webm`;
        a.click();
        URL.revokeObjectURL(url); 
        resolve();
      };
    });

    recorder.start();

    for (let i = 0; i < matchedTokens.length; i++) {
      setCurrentIndex(i); 
      const token = matchedTokens[i];

      if (token.source === "none" || !token.clip) {
        await new Promise(r => setTimeout(r, 100)); 
        continue;
      }

      await new Promise(resolve => {
        const isVideo = token.source !== "audio";
        const media = document.createElement(isVideo ? 'video' : 'audio');
        media.crossOrigin = "anonymous";
        media.src = token.clip.url;

        const sourceNode = audioCtx.createMediaElementSource(media);
        sourceNode.connect(audioDest); 
        sourceNode.connect(audioCtx.destination); 

        media.onloadedmetadata = () => {
          media.play();
          renderToCanvas(media, isVideo, token.text);
        };

        media.onended = () => {
          sourceNode.disconnect(); 
          media.remove(); 
          resolve(); 
        };

        media.onerror = () => {
          sourceNode.disconnect();
          resolve();
        };
      });
    }

    recorder.stop();
    await recordingPromise; 

    if (audioCtx.state !== 'closed') {
      audioCtx.close();
    }

    setCurrentIndex(-1);
    setIsPlaying(false);
    setIsExporting(false);
    isExportingRef.current = false;
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#E0E0E0] overflow-hidden antialiased p-6 gap-6 font-['Noto_Sans_KR',_sans-serif]">
      {/* 커스텀 스크롤바 CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0F0F0F; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555555; }
        
        .tooltip .tooltip-text {
          visibility: hidden;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .tooltip:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
      
      {/* LEFT: MONITORING GRID */}
      <div className="w-[60%] flex flex-col gap-6">
        {/* BRAND HEADER */}
        <div className="flex justify-between items-end pb-2 border-b border-[#1F1F1F]">
          <div className="space-y-1">
            <h1 className="text-4xl italic tracking-tight leading-none text-white font-serif">voxmesh</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#666666]">Clip-Based Voice Synthesizer</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 디스코드 링크 버튼 (툴팁 적용) */}
            <div className="relative flex items-center tooltip">
              <a
                href="https://discord.gg/dTGMxUSUrk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-[36px] w-[36px] bg-[#141414] border border-[#1F1F1F] rounded-full text-[#666666] hover:text-[#5865F2] hover:bg-[#262626] transition-all shadow-inner"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                </svg>
              </a>
              <span className="tooltip-text absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-3 py-1.5 bg-[#262626] text-white text-[10px] font-bold rounded-lg shadow-xl z-50 pointer-events-none border border-[#333333]">
                여기에서 공식 음성팩을 찾아보세요
              </span>
            </div>

            {/* 깃허브 링크 버튼 (툴팁 적용) */}
            <div className="relative flex items-center tooltip">
              <a
                href="https://github.com/jun479/voxmesh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-[36px] w-[36px] bg-[#141414] border border-[#1F1F1F] rounded-full text-[#666666] hover:text-white hover:bg-[#262626] transition-all shadow-inner"
              >
                <Github size={18} />
              </a>
              <span className="tooltip-text absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-3 py-1.5 bg-[#262626] text-white text-[10px] font-bold rounded-lg shadow-xl z-50 pointer-events-none border border-[#333333]">
                깃허브
              </span>
            </div>

            {/* 세그먼티드 컨트롤 비율 조절기 */}
            <div className="flex bg-[#141414] border border-[#1F1F1F] rounded-lg p-1 shadow-inner">
              <button 
                onClick={() => setAspectRatio('16:9')} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${aspectRatio === '16:9' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#666666] hover:text-zinc-300'}`}
                title="16:9 Ratio"
              >
                <Monitor size={14} />
                <span>16:9</span>
              </button>
              <button 
                onClick={() => setAspectRatio('9:16')} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${aspectRatio === '9:16' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#666666] hover:text-zinc-300'}`}
                title="9:16 Ratio"
              >
                <Smartphone size={14} />
                <span>9:16</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN VIEWER */}
        <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl border border-[#1F1F1F] flex items-center justify-center">
          <canvas ref={canvasRef} width={aspectRatio === '16:9' ? 1280 : 720} height={aspectRatio === '16:9' ? 720 : 1280} className="max-w-full max-h-full object-contain" />
          
          {isLoadingPack && (
            <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-center">
              <Loader2 className="animate-spin text-white mb-4" size={32} strokeWidth={1.5} />
              <h2 className="text-2xl italic mb-2 text-white font-serif">Analyzing Library</h2>
              <p className="text-xs text-[#666666] uppercase tracking-widest">{loadingProgress}% Synchronized</p>
            </div>
          )}

          {!isPlaying && currentIndex === -1 && !isLoadingPack && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <Film size={60} strokeWidth={1} className="text-white" />
            </div>
          )}
        </div>

        {/* MASTER CONTROL */}
        <div className="h-32 bg-[#141414] rounded-xl border border-[#1F1F1F] p-6 flex items-center gap-8 shadow-xl">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full border border-[#333333] text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500 shadow-lg"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          
          <div className="flex-1 space-y-4">
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#666666]">
               <span>Timeline Sequence</span>
               <span className="font-mono text-zinc-400">{currentIndex + 1} / {matchedTokens.length}</span>
             </div>
             <div className="h-[2px] bg-[#262626] relative">
               <div className="absolute h-full bg-white transition-all duration-700 shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ width: `${((currentIndex + 1) / matchedTokens.length) * 100}%` }} />
             </div>
          </div>

          <div className="flex gap-4 h-full py-2 items-center">
            {/* 자막 아이콘 버튼 */}
            <button 
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`p-3 rounded-full border transition-all ${showSubtitles ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-transparent text-[#666666] border-[#333333] hover:text-white'}`}
              title="Toggle Subtitles"
            >
              {showSubtitles ? <Captions size={22} /> : <CaptionsOff size={22} />}
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="px-8 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isExporting ? '내보내는 중...' : '내보내기'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: EDITORIAL CONSOLE */}
      <div className="w-[40%] flex flex-col gap-6">
        {/* PACK INFO CARD */}
        <div className="p-6 bg-[#141414] rounded-xl border border-[#1F1F1F] space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">Source Package</span>
            
            {/* ✨ 드래그 앤 드롭이 적용된 글래스모피즘 버튼 */}
            <label 
              className={`cursor-pointer group relative flex items-center justify-center min-w-[110px] px-4 py-2 rounded-full backdrop-blur-md border shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden ${
                isDragging 
                  ? 'bg-blue-500/20 border-blue-400 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                  : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:from-white/20 hover:border-white/20 active:scale-95'
              }`}
            >
              {/* 유리 표면 빛 반사 효과 (드래그 중에는 숨김) */}
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full transition-transform duration-700 ${isDragging ? 'hidden' : 'group-hover:translate-x-full'}`} />
              
              {/* 내부 콘텐츠 (드래그 시 텍스트 변경) */}
              <div className="pointer-events-none relative z-10 flex items-center gap-2">
                <FolderOpen size={14} className={`transition-colors ${isDragging ? 'text-blue-400' : 'text-zinc-300 group-hover:text-white'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isDragging ? 'text-blue-400' : 'text-zinc-300 group-hover:text-white'}`}>
                  {isDragging ? 'Drop Here' : 'Load Pack'}
                </span>
              </div>

              {/* 투명한 드롭존 영역 (화면엔 안 보이지만 드래그 이벤트를 낚아챔) */}
              <input 
                type="file" 
                webkitdirectory="" 
                directory="" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                onChange={(e) => {
                  setIsDragging(false);
                  handleFolderUpload(e);
                }} 
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDrop={() => setIsDragging(false)}
              />
            </label>
          </div>

          {!packInfo.rawFolderName ? (
            <p className="text-xs text-[#666666] leading-relaxed">준비된 음성팩 폴더를 업로드하여 voxmesh 프로세싱을 시작하십시오.</p>
          ) : (
            <div className="flex items-center gap-4">
              {/* 로컬 스캔 아바타 표시 영역 */}
              <div className="w-14 h-14 rounded-full bg-[#1F1F1F] flex items-center justify-center overflow-hidden shrink-0 border border-[#333333] shadow-inner">
                {packInfo.avatar ? (
                  <img src={packInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#666666] font-bold text-xl">?</span>
                )}
              </div>
              
              <div className="space-y-2 flex-1">
                <div>
                  <h4 className="text-xl italic text-white font-serif">{packInfo.name === "Unknown" ? packInfo.rawFolderName : `${packInfo.name} 코어`}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${packInfo.name === "Unknown" || packInfo.version !== VOICE_PACK_DATABASE[packInfo.name] ? 'bg-[#FF4D4D]' : 'bg-[#00E676]'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-[#666666]">
                      버전 {packInfo.version} — {packInfo.name === "Unknown" ? "미등록 음성팩" : (packInfo.version === VOICE_PACK_DATABASE[packInfo.name] ? "최신 버전입니다" : "업데이트가 필요합니다")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 pt-2 border-t border-[#262626] text-[9px] font-bold uppercase text-[#666666]">
                  <span>Script: {files.scripts.size}</span>
                  <span>Video: {files.video.size}</span>
                  <span>Audio: {files.audio.size}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* EDITOR AREA */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#141414] rounded-xl border border-[#1F1F1F] overflow-hidden shadow-xl">
          {/* 에디터 헤더 & 컬러 범례 */}
          <div className="p-4 border-b border-[#1F1F1F] flex items-center justify-between bg-[#0F0F0F]">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666] flex items-center gap-2">
              <Type size={12} /> Script Editor
            </h3>
            <div className="flex gap-3 text-[10px] font-bold text-[#666666]">
              <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-[#B4A7D6]"/> 대사</span>
              <span className="flex items-center gap-1"><Film size={12} className="text-[#A2C4C9]"/> 영상</span>
              <span className="flex items-center gap-1"><Music size={12} className="text-[#A4C2F4]"/> 음성</span>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden group">
            {/* Syntax Highlighting Layer */}
            <div 
              ref={highlightRef}
              className="absolute inset-0 p-8 pointer-events-none whitespace-pre-wrap break-words font-['Malgun_Gothic',_sans-serif] text-[22px] leading-[1.8] transition-opacity font-medium tracking-tight"
            >
              {matchedTokens.map((t, i) => (
                <span 
                  key={i} 
                  className={`relative ${
                    t.source === 'script' ? 'text-[#B4A7D6]' : 
                    t.source === 'video' ? 'text-[#A2C4C9]' : 
                    t.source === 'audio' ? 'text-[#A4C2F4]' : 'text-[#444444]'
                  } ${i === currentIndex ? 'underline decoration-2 underline-offset-8 text-white' : ''}`}
                >
                  {t.text}
                </span>
              ))}
            </div>

            {/* Input Layer */}
            <textarea
              ref={textareaRef}
              className="w-full h-full p-8 bg-transparent outline-none resize-none font-['Malgun_Gothic',_sans-serif] text-[22px] leading-[1.8] text-transparent caret-white selection:bg-[#333333] font-medium tracking-tight"
              placeholder="여기에 대사를 입력하십시오..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              onScroll={(e) => { if (highlightRef.current) highlightRef.current.scrollTop = e.target.scrollTop; }}
            />
          </div>

          {/* RECOMMENDATION BAR (가로 스크롤 적용) */}
          <div className="p-4 bg-[#0F0F0F] border-t border-[#1F1F1F] overflow-x-auto whitespace-nowrap custom-scrollbar pb-3">
            <div className="flex gap-2">
              {recommendations.length === 0 && <span className="text-[10px] text-[#444444] py-1 px-2">추천 파일이 여기에 표시됩니다.</span>}
              {recommendations.map((rec, i) => (
                <button
                  key={i}
                  onClick={() => applyRecommendation(rec.name)}
                  className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#262626] text-[11px] font-bold text-zinc-300 hover:border-white hover:text-white transition-all flex items-center gap-2"
                >
                  {rec.type === '대사' ? <ShieldCheck size={12} className="text-[#B4A7D6]" /> : <Search size={12} />}
                  {rec.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
