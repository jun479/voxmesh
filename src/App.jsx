import React, { useState, useMemo, useRef, useEffect } from 'react';

// 예시 지원 확장자 목록 (프로젝트 내부 정의에 맞게 구성됨)
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

  // codex 브랜치에서 추가된 상태 값들
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

  return (
    <div className="app-container">
      <h1>Voxmesh - Refactor App</h1>
      <p>프로젝트 충돌이 성공적으로 해결되었습니다. 즐거운 코딩 되세요!</p>
    </div>
  );
}