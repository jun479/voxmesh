import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Download, FolderOpen, Film, Music, Type, Loader2 } from 'lucide-react';

// 유틸리티: 문자열 정규화 (공백 제거 및 소문자화)
const normalize = (str) => str.replace(/\s+/g, '').toLowerCase();

const App = () => {
  const [files, setFiles] = useState({ audio: new Map(), video: new Map() });
  const [script, setScript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isExporting, setIsExporting] = useState(false);
  
  // 로딩 상태 추가
  const [isLoadingPack, setIsLoadingPack] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const requestRef = useRef(null);

  // 폴더 업로드 처리 (로딩 프로그레스 적용)
  const handleFolderUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;

    setIsLoadingPack(true);
    setLoadingProgress(0);

    const audioMap = new Map();
    const videoMap = new Map();
    const total = uploadedFiles.length;

    // 루프를 돌며 비동기로 처리 (UI 업데이트 허용)
    for (let i = 0; i < total; i++) {
      const file = uploadedFiles[i];
      const path = file.webkitRelativePath.toLowerCase();
      const name = normalize(file.name.split('.')[0]);
      const url = URL.createObjectURL(file);
      const data = { url, name: file.name.split('.')[0], blob: file };

      if (path.includes('/audio/')) audioMap.set(name, data);
      else if (path.includes('/video/')) videoMap.set(name, data);

      // 프로그레스 업데이트
      const progress = Math.round(((i + 1) / total) * 100);
      setLoadingProgress(progress);

      // 대량의 파일 처리 시 UI가 얼지 않도록 비동기 틱 추가
      if (i % 5 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // 완료 전 살짝 대기 (사용자 시각적 경험용)
    await new Promise(r => setTimeout(r, 400));
    
    setFiles({ audio: audioMap, video: videoMap });
    setIsLoadingPack(false);
    setLoadingProgress(0);
  };

  // 대본 라인별 매칭 상태 계산
  const lines = useMemo(() => script.split('\n').filter(l => l.trim() !== ""), [script]);

  const getMatchStatus = (line) => {
    const key = normalize(line);
    if (files.video.has(key) || files.audio.has(key)) return 'exact';
    const allKeys = [...files.audio.keys(), ...files.video.keys()];
    if (allKeys.some(k => k.includes(key))) return 'partial';
    return 'none';
  };

  // 재생 로직
  useEffect(() => {
    if (isPlaying && currentIndex < lines.length) {
      if (currentIndex === -1) {
        setCurrentIndex(0);
        return;
      }
      playClip(currentIndex);
    } else if (currentIndex >= lines.length) {
      setIsPlaying(false);
      setCurrentIndex(-1);
    }
  }, [isPlaying, currentIndex]);

  const playClip = (index) => {
    const text = lines[index];
    const key = normalize(text);
    const clip = files.video.get(key) || files.audio.get(key);

    if (!clip) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 500);
      return;
    }

    const isVideo = files.video.has(key);
    const media = document.createElement(isVideo ? 'video' : 'audio');
    media.src = clip.url;
    
    media.onloadedmetadata = () => {
      media.play();
      renderToCanvas(media, isVideo, clip.name);
    };

    media.onended = () => {
      setCurrentIndex(prev => prev + 1);
    };
  };

  const renderToCanvas = (media, isVideo, label) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const draw = () => {
      if (media.paused || media.ended) return;

      ctx.fillStyle = isVideo ? '#000' : '#1e3a8a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isVideo) {
        const vRatio = media.videoWidth / media.videoHeight;
        const cRatio = canvas.width / canvas.height;
        let nw, nh, nx, ny;
        if (vRatio > cRatio) {
          nw = canvas.width;
          nh = canvas.width / vRatio;
          nx = 0;
          ny = (canvas.height - nh) / 2;
        } else {
          nh = canvas.height;
          nw = canvas.height * vRatio;
          nx = (canvas.width - nw) / 2;
          ny = 0;
        }
        ctx.drawImage(media, nx, ny, nw, nh);
      }

      ctx.font = 'bold 40px Sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      ctx.strokeText(label, canvas.width / 2, canvas.height - 50);
      ctx.fillStyle = 'white';
      ctx.fillText(label, canvas.width / 2, canvas.height - 50);

      requestRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const handleExport = async () => {
    if (lines.length === 0) return;
    setIsExporting(true);
    
    const canvas = canvasRef.current;
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zorius_meme.webm';
      a.click();
      setIsExporting(false);
    };

    recorder.start();
    setIsPlaying(true);
    setCurrentIndex(0);

    const checkEnd = setInterval(() => {
      if (currentIndex >= lines.length - 1) {
        setTimeout(() => {
          recorder.stop();
          clearInterval(checkEnd);
        }, 1000);
      }
    }, 500);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* 왼쪽: 프리뷰 영역 */}
      <div className="w-7/12 flex flex-col border-r border-zinc-800 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Film className="text-blue-500" /> Meme Video Maker
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setAspectRatio('16:9')}
              className={`px-3 py-1 text-xs rounded ${aspectRatio === '16:9' ? 'bg-blue-600' : 'bg-zinc-800'}`}
            >16:9</button>
            <button 
              onClick={() => setAspectRatio('9:16')}
              className={`px-3 py-1 text-xs rounded ${aspectRatio === '9:16' ? 'bg-blue-600' : 'bg-zinc-800'}`}
            >9:16</button>
          </div>
        </div>

        <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
          <canvas 
            ref={canvasRef}
            width={aspectRatio === '16:9' ? 1280 : 720}
            height={aspectRatio === '16:9' ? 720 : 1280}
            className="max-w-full max-h-full object-contain"
          />
          
          {/* 로딩 오버레이 */}
          {isLoadingPack && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 transition-opacity duration-300">
              <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
              <h2 className="text-lg font-bold mb-6">Loading Voice Pack...</h2>
              <div className="w-full max-w-md h-3 bg-zinc-800 rounded-full overflow-hidden mb-2 shadow-inner">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="text-blue-400 font-mono font-bold text-xl">{loadingProgress}%</span>
            </div>
          )}

          {!isPlaying && currentIndex === -1 && !isLoadingPack && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <Film size={48} className="text-zinc-500 mb-2" />
              <p className="text-zinc-400">보이스 팩을 로드하고 재생을 시작하세요</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={files.audio.size === 0 && files.video.size === 0 || isLoadingPack}
            className="p-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 rounded-full transition-all"
          >
            {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
          </button>
          
          <div className="flex-1">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${((currentIndex + 1) / lines.length) * 100}%` }}
              />
            </div>
            <p className="text-[10px] mt-2 text-zinc-500 uppercase tracking-widest">Timeline Progress</p>
          </div>

          <button 
            onClick={handleExport}
            disabled={isExporting || lines.length === 0 || isLoadingPack}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 rounded-lg font-bold transition-all"
          >
            <Download size={18} /> {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* 오른쪽: 편집 영역 */}
      <div className="w-5/12 flex flex-col p-6 bg-zinc-900/50">
        <div className="mb-6 space-y-4">
          <label className={`group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-xl bg-zinc-900 transition-all ${isLoadingPack ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FolderOpen className={`group-hover:text-blue-500 mb-2 ${isLoadingPack ? 'text-zinc-700' : 'text-zinc-500'}`} />
              <p className="text-sm text-zinc-400">Voice Pack 폴더 선택</p>
              <p className="text-xs text-zinc-600 mt-1">audio/ video/ 폴더가 포함되어야 함</p>
            </div>
            <input 
              type="file" 
              webkitdirectory="" 
              directory="" 
              className="hidden" 
              onChange={handleFolderUpload} 
              disabled={isLoadingPack}
            />
          </label>
          
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Music size={14} /> Audio: <span className="text-white font-bold">{files.audio.size}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Film size={14} /> Video: <span className="text-white font-bold">{files.video.size}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-bold text-zinc-500 mb-2 flex items-center gap-2">
            <Type size={16} /> SCRIPT EDITOR
          </h3>
          <div className="flex-1 bg-zinc-950 rounded-xl p-4 overflow-y-auto border border-zinc-800 focus-within:border-blue-500/50 transition-all">
            <textarea
              className="w-full h-full bg-transparent outline-none resize-none font-mono text-lg leading-relaxed"
              placeholder="여기에 대사를 입력하세요..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              disabled={isLoadingPack}
            />
          </div>
          
          {/* 하단 실시간 매칭 상태바 */}
          <div className="mt-4 grid grid-cols-1 gap-2 overflow-y-auto max-h-40 p-2 bg-black/30 rounded-lg">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  getMatchStatus(line) === 'exact' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                  getMatchStatus(line) === 'partial' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                <span className={`truncate ${i === currentIndex ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
