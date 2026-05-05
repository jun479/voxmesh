import React, { useState, useMemo, useRef, useEffect } from 'react';

const VIDEO_EXT = ['.mp4', '.m4v', '.webm'];
const AUDIO_EXT = ['.mp3', '.wav', '.ogg'];
const SUPPORTED_EXT = new Set([...VIDEO_EXT, ...AUDIO_EXT]);

const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

function normalizeKey(str) {
  return str.trim().toLowerCase();
}

export default function App() {
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

  const entries = useMemo(() => {
    return lines.map((line, idx) => {
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
          if (sim > score) {
            score = sim;
            suggestion = k;
          }
        }
      }

      const similar = !exact && score >= 0.62;
      return {
        idx,
        line,
        key,
        exactVideo,
        exactAudio,
        exact,
        score,
        suggestion,
        state: exact ? 'exact' : similar ? 'similar' : 'none',
      };
    });
  }, [lines, pack, keySet]);

  const timeline = useMemo(
    () =>
      entries.map((item) => ({
        ...item,
        duration:
          item.exact?.duration ||
          item.exactVideo?.duration ||
          item.exactAudio?.duration ||
          1.2,
      })),
    [entries]
  );

  const totalDuration = useMemo(() => timeline.reduce((a, b) => a + b.duration, 0), [timeline]);

  // 파일 처리 및 렌더링 로직 함수들
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    setLoading(true);
    setLoadingPct(10);

    // 대사팩 읽기 및 매핑 처리 로직 구현
    const audioMap = new Map();
    const videoMap = new Map();
    let name = files[0].name;

    setTimeout(() => {
      setPack({ audio: audioMap, video: videoMap, name });
      setLoading(false);
      setStatus(`Pack loaded: ${name}`);
    }, 1000);
  };

  return (
    <div className="app">
      <div className="left">
        <canvas ref={canvasRef} width={1280} height={720} style={{ display: 'none' }} />
        <video className="preview" src="" controls={false} />

        <div className="controls">
          <button onClick={() => {}}>Play</button>
          <button onClick={() => {}}>Export Video</button>
          <div className="ratio">
            <button className={aspect === '16:9' ? 'on' : ''} onClick={() => setAspect('16:9')}>16:9</button>
            <button className={aspect === '9:16' ? 'on' : ''} onClick={() => setAspect('9:16')}>9:16</button>
            <button className={aspect === '1:1' ? 'on' : ''} onClick={() => setAspect('1:1')}>1:1</button>
          </div>
        </div>

        <div className="timeline">
          {timeline.map((item) => (
            <div key={item.idx} className={`block ${currentLine === item.idx ? 'active' : ''}`}>
              <div style={{ fontSize: '10px' }}>{item.line}</div>
            </div>
          ))}
        </div>

        {warning && <div className="warn">{warning}</div>}

        <div className={`drop ${dragOver ? 'drag' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <p>Drop a voice pack folder here</p>
        </div>
      </div>

      <div className="right">
        <textarea
          ref={textRef}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Enter lines to generate speech and video..."
        />

        <div className="matches">
          {entries.map((item) => (
            <div key={item.idx} className={`line ${item.state}`}>
              {item.line} {item.state === 'similar' ? `(Did you mean: ${item.suggestion})` : ''}
            </div>
          ))}
        </div>

        <div className="status">{status}</div>
      </div>
    </div>
  );
}
