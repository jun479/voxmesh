import React, { useEffect, useMemo, useRef, useState } from 'react';

const normalizeKey = (value = '') => value.replace(/\s+/g, '').toLowerCase().trim();
const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'm4v']);
const AUDIO_EXT = new Set(['wav', 'mp3', 'ogg', 'm4a', 'aac', 'flac', 'webm']);

function App() {
  const [pack, setPack] = useState({ audio: new Map(), video: new Map(), name: '' });
  const [script, setScript] = useState('');
  const [aspect, setAspect] = useState('16:9');
  const [playing, setPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('Load a voice pack to start.');

  const canvasRef = useRef(null);
  const textRef = useRef(null);
  const timelineRef = useRef(null);
  const engineRef = useRef(null);

  const lines = useMemo(() => script.split('\n').map((s) => s.trim()).filter(Boolean), [script]);

  const entries = useMemo(() => {
    return lines.map((line, idx) => {
      const key = normalizeKey(line);
      const exactVideo = pack.video.get(key);
      const exactAudio = pack.audio.get(key);
      const exact = exactVideo || exactAudio;
      let partial = false;
      if (!exact && key) {
        partial = [...pack.audio.keys(), ...pack.video.keys()].some((k) => k.includes(key) || key.includes(k));
      }
      return { idx, line, key, exact, exactVideo, exactAudio, state: exact ? 'exact' : partial ? 'partial' : 'none' };
    });
  }, [lines, pack]);

  const timeline = useMemo(() => {
    return entries.map((item) => ({ ...item, duration: item.exact?.duration || 1.2 }));
  }, [entries]);

  const totalDuration = useMemo(() => timeline.reduce((a, b) => a + b.duration, 0), [timeline]);

  useEffect(() => {
    if (currentLine >= 0 && textRef.current) {
      const active = textRef.current.querySelector(`[data-line='${currentLine}']`);
      active?.scrollIntoView({ block: 'nearest' });
    }
  }, [currentLine]);

  const setCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const [w, h] = aspect === '16:9' ? [1280, 720] : [720, 1280];
    canvas.width = w;
    canvas.height = h;
  };

  useEffect(() => setCanvasSize(), [aspect]);

  useEffect(() => {
    setCanvasSize();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const savePackToDB = async (audioMap, videoMap, name) => {
    const openReq = indexedDB.open('voxmesh-db', 1);
    openReq.onupgradeneeded = () => openReq.result.createObjectStore('packs', { keyPath: 'id' });
    await new Promise((resolve, reject) => {
      openReq.onerror = () => reject(openReq.error);
      openReq.onsuccess = () => resolve();
    });
    const db = openReq.result;
    const tx = db.transaction('packs', 'readwrite');
    const store = tx.objectStore('packs');
    store.put({ id: 'last-pack', name, updatedAt: Date.now(), counts: { audio: audioMap.size, video: videoMap.size } });
  };

  const buildPackFromFiles = async (files, name = 'Local Pack') => {
    const audio = new Map();
    const video = new Map();
    for (const file of files) {
      const path = (file.webkitRelativePath || file.name).toLowerCase();
      const ext = file.name.split('.').pop()?.toLowerCase();
      const base = normalizeKey(file.name.replace(/\.[^.]+$/, ''));
      const asset = { key: base, label: file.name.replace(/\.[^.]+$/, ''), file, url: URL.createObjectURL(file), duration: 1.2 };
      if (path.includes('/audio/') || AUDIO_EXT.has(ext)) audio.set(base, asset);
      if (path.includes('/video/') || VIDEO_EXT.has(ext)) video.set(base, asset);
    }

    const metadata = async (asset, isVideo) => {
      const el = document.createElement(isVideo ? 'video' : 'audio');
      el.src = asset.url;
      await new Promise((r) => { el.onloadedmetadata = r; el.onerror = r; });
      asset.duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 1.2;
      el.remove();
    };

    await Promise.all([...audio.values()].map((a) => metadata(a, false)));
    await Promise.all([...video.values()].map((v) => metadata(v, true)));

    setPack({ audio, video, name });
    savePackToDB(audio, video, name).catch(() => {});
    setStatus(`Loaded ${name}: ${audio.size} audio, ${video.size} video clips.`);
  };

  const onInputFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    await buildPackFromFiles(files);
  };

  const drawSubtitle = (ctx, text) => {
    const c = canvasRef.current;
    const y = c.height - 52;
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'black';
    ctx.strokeText(text, c.width / 2, y);
    ctx.fillStyle = 'white';
    ctx.fillText(text, c.width / 2, y);
  };

  const drawContainVideo = (ctx, media) => {
    const c = canvasRef.current;
    const vw = media.videoWidth || 1;
    const vh = media.videoHeight || 1;
    const ratio = vw / vh;
    const cr = c.width / c.height;
    let dw = c.width, dh = c.height, dx = 0, dy = 0;
    if (ratio > cr) { dh = c.width / ratio; dy = (c.height - dh) / 2; }
    else { dw = c.height * ratio; dx = (c.width - dw) / 2; }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(media, dx, dy, dw, dh);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const stopEngine = () => {
    if (!engineRef.current) return;
    engineRef.current.stopped = true;
    engineRef.current.media?.pause?.();
    engineRef.current.audioCtx?.close?.();
    cancelAnimationFrame(engineRef.current.raf || 0);
    engineRef.current = null;
    setPlaying(false);
  };

  const decodeAudio = async (file, audioCtx) => {
    const arr = await file.arrayBuffer();
    return audioCtx.decodeAudioData(arr.slice(0));
  };

  const playFrom = async (startIndex = 0) => {
    if (!timeline.length) return;
    stopEngine();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const state = { stopped: false, audioCtx, raf: 0, media: null, mediaSrc: null };
    engineRef.current = state;
    setPlaying(true);

    let elapsed = timeline.slice(0, startIndex).reduce((a, b) => a + b.duration, 0);
    for (let i = startIndex; i < timeline.length; i++) {
      if (state.stopped) break;
      const item = timeline[i];
      setCurrentLine(i);
      const clip = item.exactVideo || item.exactAudio;
      if (!clip) {
        const t0 = performance.now();
        while (!state.stopped && performance.now() - t0 < 600) {
          ctx.fillStyle = '#7f1d1d'; ctx.fillRect(0, 0, canvas.width, canvas.height); drawSubtitle(ctx, item.line);
          setCurrentTime(elapsed + (performance.now() - t0) / 1000); await sleep(16);
        }
        elapsed += 0.6;
        continue;
      }

      if (item.exactVideo) {
        const video = document.createElement('video');
        video.src = clip.url; video.muted = true; video.playsInline = true;
        await new Promise((r) => { video.onloadedmetadata = r; video.onerror = r; });
        const decoded = pack.audio.get(item.key);
        if (decoded) {
          const buffer = await decodeAudio(decoded.file, audioCtx);
          const source = audioCtx.createBufferSource(); source.buffer = buffer; source.connect(audioCtx.destination); source.start();
        }
        state.media = video;
        await video.play().catch(() => {});
        const startAt = performance.now();
        while (!video.ended && !state.stopped) {
          drawContainVideo(ctx, video); drawSubtitle(ctx, item.line);
          setCurrentTime(elapsed + (performance.now() - startAt) / 1000);
          await sleep(16);
        }
        elapsed += clip.duration;
      } else {
        ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, canvas.width, canvas.height); drawSubtitle(ctx, item.line);
        const buffer = await decodeAudio(clip.file, audioCtx);
        const source = audioCtx.createBufferSource(); source.buffer = buffer;
        const gain = audioCtx.createGain(); gain.gain.value = 0.95; source.connect(gain); gain.connect(audioCtx.destination); source.start();
        const startAt = performance.now();
        while (!state.stopped && performance.now() - startAt < clip.duration * 1000) {
          ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, canvas.width, canvas.height); drawSubtitle(ctx, item.line);
          setCurrentTime(elapsed + (performance.now() - startAt) / 1000);
          await sleep(16);
        }
        elapsed += clip.duration;
      }
    }

    if (!state.stopped) {
      setPlaying(false); setCurrentLine(-1); setCurrentTime(0); state.audioCtx.close();
      engineRef.current = null;
    }
  };

  const encodeWav = (buffer) => {
    const ch = buffer.numberOfChannels;
    const len = buffer.length * ch * 2 + 44;
    const out = new ArrayBuffer(len);
    const v = new DataView(out);
    const write = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    write(0, 'RIFF'); v.setUint32(4, 36 + buffer.length * ch * 2, true); write(8, 'WAVEfmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, buffer.sampleRate, true);
    v.setUint32(28, buffer.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); write(36, 'data');
    v.setUint32(40, buffer.length * ch * 2, true);
    let o = 44;
    for (let i = 0; i < buffer.length; i++) for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2;
    }
    return new Blob([out], { type: 'audio/wav' });
  };

  const exportAudio = async (mode = 'wav') => {
    if (!timeline.length) return;
    const ac = new OfflineAudioContext(2, 48000 * Math.ceil(totalDuration + 1), 48000);
    let offset = 0;
    for (const item of timeline) {
      const clip = item.exactAudio || pack.audio.get(item.key);
      if (clip) {
        const arr = await clip.file.arrayBuffer();
        const buf = await ac.decodeAudioData(arr.slice(0));
        const src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); src.start(offset);
        offset += buf.duration;
      } else offset += item.duration;
    }
    const rendered = await ac.startRendering();
    const wavBlob = encodeWav(rendered);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url; a.download = mode === 'mp3' ? 'meme_audio.mp3' : 'meme_audio.wav'; a.click();
  };

  const exportMp4 = async () => {
    const stream = canvasRef.current.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm' });
    const chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.start();
    await playFrom(0);
    await sleep(300);
    rec.stop();
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'meme_video.mp4'; a.click();
    };
  };

  return (
    <div className="app">
      <div className="left">
        <canvas ref={canvasRef} className="preview" />
        <div className="controls">
          <button onClick={() => (playing ? stopEngine() : playFrom(currentLine > 0 ? currentLine : 0))}>{playing ? '⏸ Pause' : '▶ Play'}</button>
          <div className="ratio"><button className={aspect === '16:9' ? 'on' : ''} onClick={() => setAspect('16:9')}>16:9</button><button className={aspect === '9:16' ? 'on' : ''} onClick={() => setAspect('9:16')}>9:16</button></div>
          <button onClick={exportMp4}>Export MP4</button><button onClick={() => exportAudio('mp3')}>Export MP3</button><button onClick={() => exportAudio('wav')}>Export WAV</button>
        </div>
        <div className="timeline" ref={timelineRef}>
          {timeline.map((t, i) => <button key={i} className={`block ${i === currentLine ? 'active' : ''}`} style={{ flex: `${Math.max(1, t.duration)}` }} onClick={() => { setCurrentLine(i); if (playing) playFrom(i); }}>{t.line}</button>)}
        </div>
        <div className="status">{status} · {currentTime.toFixed(2)}s/{totalDuration.toFixed(2)}s</div>
      </div>

      <div className="right">
        <label className={`drop ${dragOver ? 'drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={async (e) => { e.preventDefault(); setDragOver(false); await onInputFiles(e.dataTransfer.files); }}>
          <input type="file" webkitdirectory="" multiple onChange={(e) => onInputFiles(e.target.files)} />
          <b>Load voice pack folder</b>
          <small>Drag & drop folder or click to select (audio/, video/)</small>
        </label>
        <textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="Each line = one clip" />
        <div className="matches" ref={textRef}>
          {entries.map((e, i) => <div key={i} data-line={i} className={`line ${e.state} ${i === currentLine ? 'playing' : ''}`}>{e.line}</div>)}
        </div>
      </div>
    </div>
  );
}

export default App;
