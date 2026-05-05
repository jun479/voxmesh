import React, { useEffect, useMemo, useRef, useState } from 'react';

const normalizeKey = (value = '') => value.replace(/\s+/g, '').toLowerCase().trim();
const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'm4v']);
const AUDIO_EXT = new Set(['wav', 'mp3', 'ogg', 'm4a', 'aac', 'flac', 'webm']);
const SUPPORTED_EXT = new Set([...VIDEO_EXT, ...AUDIO_EXT]);

// Added: Levenshtein-based fuzzy scoring for smart matching.
const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
  }
  return dp[m][n];
};

function App() {
  const [pack, setPack] = useState({ audio: new Map(), video: new Map(), name: '' });
  const [script, setScript] = useState('');
  const [aspect, setAspect] = useState('16:9');
  const [playing, setPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('Load a voice pack to start.');
  const [loading, setLoading] = useState(false);
  const [loadingPct, setLoadingPct] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [warning, setWarning] = useState('');
  const [recentPackInfo, setRecentPackInfo] = useState(null);

  const canvasRef = useRef(null);
  const textRef = useRef(null);
  const audioCtxRef = useRef(null);
  const engineRef = useRef(null);
  const mediaCacheRef = useRef(new Map());
  const audioBufferCacheRef = useRef(new Map());

  const lines = useMemo(() => script.split('\n').map((s) => s.trim()).filter(Boolean), [script]);
  const keySet = useMemo(() => [...pack.audio.keys(), ...pack.video.keys()], [pack]);

  const entries = useMemo(() => lines.map((line, idx) => {
    const key = normalizeKey(line);
    const exactVideo = pack.video.get(key);
    const exactAudio = pack.audio.get(key);
    const exact = exactVideo || exactAudio;
    let suggestion = null;
    let score = 0;
    if (!exact && keySet.length && key) {
      for (const k of keySet) {
        const dist = levenshtein(key, k);
        const sim = 1 - dist / Math.max(key.length, k.length, 1);
        if (sim > score) { score = sim; suggestion = k; }
      }
    }
    const similar = !exact && score >= 0.62;
    return { idx, line, key, exactVideo, exactAudio, exact, score, suggestion, state: exact ? 'exact' : similar ? 'similar' : 'none' };
  }), [lines, pack, keySet]);

  const timeline = useMemo(() => entries.map((item) => ({ ...item, duration: item.exact?.duration || item.exactVideo?.duration || item.exactAudio?.duration || 1.2 })), [entries]);
  const totalDuration = useMemo(() => timeline.reduce((a, b) => a + b.duration, 0), [timeline]);

  useEffect(() => {
    const loadRecent = async () => {
      const db = await openDB();
      const tx = db.transaction('packs', 'readonly');
      const req = tx.objectStore('packs').get('last-pack');
      req.onsuccess = () => setRecentPackInfo(req.result || null);
    };
    loadRecent().catch(() => {});
  }, []);

  useEffect(() => {
    if (currentLine >= 0) textRef.current?.querySelector(`[data-line='${currentLine}']`)?.scrollIntoView({ block: 'nearest' });
  }, [currentLine]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const [w, h] = aspect === '16:9' ? [1280, 720] : [720, 1280]; c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, w, h);
  }, [aspect]);

  const openDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open('voxmesh-db', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('packs', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
  });

  const savePackMetadata = async (audioMap, videoMap, name, manifest = null) => {
    const db = await openDB();
    const tx = db.transaction('packs', 'readwrite');
    tx.objectStore('packs').put({ id: 'last-pack', name, updatedAt: Date.now(), counts: { audio: audioMap.size, video: videoMap.size }, manifest });
  };

  const clearCaches = () => {
    mediaCacheRef.current.forEach((m) => m.remove?.());
    mediaCacheRef.current.clear();
    audioBufferCacheRef.current.clear();
  };

  const preloadAudioBuffer = async (asset, ctx) => {
    const key = asset.key;
    if (audioBufferCacheRef.current.has(key)) return audioBufferCacheRef.current.get(key);
    const arr = await asset.file.arrayBuffer();
    const buf = await ctx.decodeAudioData(arr.slice(0));
    audioBufferCacheRef.current.set(key, buf);
    return buf;
  };

  const getVideoElement = (asset) => {
    if (mediaCacheRef.current.has(asset.key)) return mediaCacheRef.current.get(asset.key);
    const v = document.createElement('video');
    v.src = asset.url; v.preload = 'auto'; v.crossOrigin = 'anonymous'; v.playsInline = true; v.muted = true;
    mediaCacheRef.current.set(asset.key, v);
    return v;
  };

  const buildPackFromFiles = async (files, name = 'Local Pack') => {
    setLoading(true); setLoadingPct(1); setWarning('');
    clearCaches();
    const audio = new Map(); const video = new Map(); let unsupported = 0; let manifest = null;
    for (let i = 0; i < files.length; i++) {
      const file = files[i]; const path = (file.webkitRelativePath || file.name).toLowerCase();
      const ext = file.name.split('.').pop()?.toLowerCase(); const base = normalizeKey(file.name.replace(/\.[^.]+$/, ''));
      if (file.name.toLowerCase() === 'manifest.json') { manifest = await file.text().catch(() => null); continue; }
      if (!SUPPORTED_EXT.has(ext)) { unsupported++; continue; }
      const asset = { key: base, label: file.name.replace(/\.[^.]+$/, ''), file, url: URL.createObjectURL(file), duration: 1.2 };
      if (path.includes('/audio/') || AUDIO_EXT.has(ext)) audio.set(base, asset);
      if (path.includes('/video/') || VIDEO_EXT.has(ext)) video.set(base, asset);
      setLoadingPct(Math.round(((i + 1) / files.length) * 100));
      if (i % 8 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    const preloadCtx = new (window.AudioContext || window.webkitAudioContext)();
    for (const a of audio.values()) {
      const buf = await preloadAudioBuffer(a, preloadCtx);
      a.duration = buf.duration || 1.2;
    }
    for (const v of video.values()) {
      const el = getVideoElement(v);
      await new Promise((r) => { el.onloadedmetadata = r; el.onerror = r; });
      v.duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 1.2;
    }
    preloadCtx.close();

    setPack({ audio, video, name });
    await savePackMetadata(audio, video, name, manifest).catch(() => {});
    setRecentPackInfo({ name, counts: { audio: audio.size, video: video.size }, updatedAt: Date.now() });
    setStatus(`Loaded ${name}: ${audio.size} audio, ${video.size} video.`);
    if (unsupported) setWarning(`${unsupported} unsupported files were ignored.`);
    setLoading(false); setLoadingPct(100);
  };

  const drawSubtitle = (ctx, text) => {
    const c = canvasRef.current; const y = c.height - 56;
    ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 7;
    ctx.strokeStyle = '#000'; ctx.strokeText(text, c.width / 2, y); ctx.fillStyle = '#fff'; ctx.fillText(text, c.width / 2, y);
  };
  const drawContainVideo = (ctx, media) => {
    const c = canvasRef.current; const vw = media.videoWidth || 1; const vh = media.videoHeight || 1;
    const ratio = vw / vh; const cr = c.width / c.height; let dw = c.width, dh = c.height, dx = 0, dy = 0;
    if (ratio > cr) { dh = c.width / ratio; dy = (c.height - dh) / 2; } else { dw = c.height * ratio; dx = (c.width - dw) / 2; }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(media, dx, dy, dw, dh);
  };

  // Added: gapless scheduler with absolute AudioContext times.
  const playFrom = async (startIndex = 0) => {
    if (!timeline.length || loading || exporting) return;
    stopEngine();
    const ctx = canvasRef.current.getContext('2d');
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    const startAt = audioCtx.currentTime + 0.08;
    const state = { stop: false, audioCtx, startAt, startIndex, stopAt: startAt + timeline.slice(startIndex).reduce((a, b) => a + b.duration, 0), sources: [] };
    engineRef.current = state; setPlaying(true);

    let cursor = startAt;
    for (let i = startIndex; i < timeline.length; i++) {
      const item = timeline[i];
      const audioClip = item.exactAudio || pack.audio.get(item.key);
      if (audioClip) {
        const b = audioBufferCacheRef.current.get(audioClip.key) || await preloadAudioBuffer(audioClip, audioCtx);
        const src = audioCtx.createBufferSource(); const gain = audioCtx.createGain(); gain.gain.value = 0.96;
        src.buffer = b; src.connect(gain); gain.connect(audioCtx.destination); src.start(cursor); state.sources.push(src);
      }
      cursor += item.duration;
    }

    const tick = async () => {
      if (!engineRef.current || engineRef.current.stop) return;
      const elapsed = Math.max(0, audioCtx.currentTime - startAt);
      setCurrentTime(elapsed);
      let acc = 0; let activeIdx = -1;
      for (let i = startIndex; i < timeline.length; i++) {
        const d = timeline[i].duration; if (elapsed >= acc && elapsed < acc + d) { activeIdx = i; break; } acc += d;
      }
      setCurrentLine(activeIdx);
      if (activeIdx >= 0) {
        const item = timeline[activeIdx];
        if (item.exactVideo) {
          const v = getVideoElement(item.exactVideo);
          const localStart = Math.max(0, elapsed - acc);
          if (Math.abs(v.currentTime - localStart) > 0.2) v.currentTime = localStart;
          await v.play().catch(() => {});
          drawContainVideo(ctx, v);
        } else { ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height); }
        drawSubtitle(ctx, item.line);
      }
      if (audioCtx.currentTime >= state.stopAt) { stopEngine(true); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const stopEngine = (ended = false) => {
    const e = engineRef.current; if (!e) return;
    e.stop = true; e.sources.forEach((s) => { try { s.stop(); } catch {} });
    audioCtxRef.current?.close?.(); engineRef.current = null; audioCtxRef.current = null;
    if (ended) { setCurrentLine(-1); setCurrentTime(0); }
    setPlaying(false);
  };

  const exportWebm = async () => {
    if (!timeline.length || exporting) return;
    setExporting(true);
    const stream = canvasRef.current.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType: mime });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((resolve) => rec.onstop = resolve);
    rec.start(250);
    await playFrom(0);
    await new Promise((r) => setTimeout(r, (totalDuration + 0.35) * 1000)); // Added: duration-safe stop.
    stopEngine(true);
    rec.stop();
    await done;
    const blob = new Blob(chunks, { type: mime });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'meme_video.webm'; a.click();
    setExporting(false);
  };

  const encodeWav = (buffer) => { /* unchanged */
    const ch = buffer.numberOfChannels, len = buffer.length * ch * 2 + 44, out = new ArrayBuffer(len), v = new DataView(out);
    const write = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    write(0, 'RIFF'); v.setUint32(4, 36 + buffer.length * ch * 2, true); write(8, 'WAVEfmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, buffer.sampleRate, true); v.setUint32(28, buffer.sampleRate * ch * 2, true);
    v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); write(36, 'data'); v.setUint32(40, buffer.length * ch * 2, true);
    let o = 44; for (let i = 0; i < buffer.length; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
    return new Blob([out], { type: 'audio/wav' });
  };

  const renderOfflineMix = async () => {
    const ac = new OfflineAudioContext(2, 48000 * Math.ceil(totalDuration + 1), 48000); let offset = 0;
    for (const item of timeline) {
      const clip = item.exactAudio || pack.audio.get(item.key);
      if (clip) { const arr = await clip.file.arrayBuffer(); const buf = await ac.decodeAudioData(arr.slice(0)); const src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); src.start(offset); }
      offset += item.duration;
    }
    return ac.startRendering();
  };

  const exportWav = async () => {
    const rendered = await renderOfflineMix();
    const blob = encodeWav(rendered); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'meme_audio.wav'; a.click();
  };

  const exportMp3 = async () => {
    try {
      const rendered = await renderOfflineMix();
      const lamejs = await import('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js'); // optional advanced path
      const left = rendered.getChannelData(0); const right = rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : left;
      const to16 = (f32) => Int16Array.from(f32.map((s) => Math.max(-1, Math.min(1, s)) * 32767));
      const mp3enc = new lamejs.Mp3Encoder(2, rendered.sampleRate, 128); const block = 1152; const mp3Data = [];
      const l = to16(left), r = to16(right);
      for (let i = 0; i < l.length; i += block) mp3Data.push(mp3enc.encodeBuffer(l.subarray(i, i + block), r.subarray(i, i + block)));
      mp3Data.push(mp3enc.flush());
      const blob = new Blob(mp3Data, { type: 'audio/mp3' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'meme_audio.mp3'; a.click();
    } catch {
      setWarning('MP3 encoder could not be loaded. Please retry online.');
    }
  };

  return <div className="app"><div className="left">
    <canvas ref={canvasRef} className="preview" />
    <div className="controls">
      <button disabled={loading || exporting} onClick={() => (playing ? stopEngine() : playFrom(currentLine > 0 ? currentLine : 0))}>{playing ? '⏸ Pause' : '▶ Play'}</button>
      <div className="ratio"><button className={aspect === '16:9' ? 'on' : ''} onClick={() => setAspect('16:9')}>16:9</button><button className={aspect === '9:16' ? 'on' : ''} onClick={() => setAspect('9:16')}>9:16</button></div>
      <button disabled={loading || exporting} onClick={exportWebm}>{exporting ? 'Exporting...' : 'Export WEBM'}</button>
      <button disabled={loading || exporting} onClick={exportMp3}>Export MP3</button>
      <button disabled={loading || exporting} onClick={exportWav}>Export WAV</button>
    </div>
    <div className="timeline">{timeline.map((t, i) => <div key={i} className="timeline-wrap" draggable onDragStart={(e) => e.dataTransfer.setData('idx', i)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const from = Number(e.dataTransfer.getData('idx')); const next = [...lines]; const [mv] = next.splice(from, 1); next.splice(i, 0, mv); setScript(next.join('\n')); }}><button className={`block ${i === currentLine ? 'active' : ''}`} style={{ flex: `${Math.max(1, t.duration)}` }} onClick={() => { setCurrentLine(i); if (playing) playFrom(i); }}>{t.line}</button><small>{t.duration.toFixed(2)}s</small></div>)}</div>
    <div className="status">{status} · {currentTime.toFixed(2)}s/{totalDuration.toFixed(2)}s {loading ? ` · Loading ${loadingPct}%` : ''}</div>
    {warning ? <div className="warn">{warning}</div> : null}
  </div>
  <div className="right">
    <label className={`drop ${dragOver ? 'drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={async (e) => { e.preventDefault(); setDragOver(false); await buildPackFromFiles(Array.from(e.dataTransfer.files)); }}>
      <input disabled={loading || exporting} type="file" webkitdirectory="" multiple onChange={(e) => buildPackFromFiles(Array.from(e.target.files || []))} />
      <b>Load voice pack folder</b><small>Drag & drop or click (audio/, video/, manifest.json)</small>
      {recentPackInfo ? <small>Previous pack: {recentPackInfo.name} ({recentPackInfo.counts?.audio || 0} audio / {recentPackInfo.counts?.video || 0} video)</small> : null}
    </label>
    <textarea disabled={loading || exporting} value={script} onChange={(e) => setScript(e.target.value)} placeholder="Each line = one clip" />
    <div className="matches" ref={textRef}>{entries.map((e, i) => <div key={i} data-line={i} className={`line ${e.state} ${i === currentLine ? 'playing' : ''}`}>{e.line}{e.state === 'similar' && e.suggestion ? <em> → {e.suggestion} ({Math.round(e.score * 100)}%)</em> : null}</div>)}</div>
  </div></div>;
}

export default App;
