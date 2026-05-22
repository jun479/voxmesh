import React, { useState, useMemo, useRef } from 'react';
import Monitor from './components/Monitor';
import SourcePanel from './components/SourcePanel';
import Editor from './components/Editor';
import { useVoicePack } from './hooks/useVoicePack';
import { useExport } from './hooks/useExport';
import { normalize, levenshtein, drawFrame } from './utils/textUtils';

const VIDEO_EXT = new Set(['.mp4', '.m4v', '.webm']);
const AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg']);

export default function App() {
    const [script, setScript] = useState('');
    const [aspect, setAspect] = useState('16:9');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [showSubtitles, setShowSubtitles] = useState(true);

    const canvasRef = useRef(null);
    const { files, isLoadingPack, loadingProgress, packInfo, handleFiles } = useVoicePack();
    const { isExporting, handleExport } = useExport(canvasRef, packInfo);

    const keySet = useMemo(() => [...files.audio.keys(), ...files.video.keys(), ...files.scripts.keys()], [files]);

    const matchedTokens = useMemo(() => {
        return script.split(/(\s+)/).map((token) => {
            if (/^\s+$/.test(token)) return { text: token, source: 'space', clip: null };
            const key = normalize(token);
            if (files.scripts.has(key)) return { text: token, source: 'script', clip: files.scripts.get(key) };
            if (files.video.has(key))   return { text: token, source: 'video',  clip: files.video.get(key) };
            if (files.audio.has(key))   return { text: token, source: 'audio',  clip: files.audio.get(key) };

            // 퍼지 매칭
            let best = null, bestScore = 0;
            for (const k of keySet) {
                const dist = levenshtein(key, k);
                const sim = 1 - dist / Math.max(key.length, k.length, 1);
                if (sim > bestScore) { bestScore = sim; best = k; }
            }
            if (bestScore >= 0.62 && best) {
                const clip = files.scripts.get(best) || files.video.get(best) || files.audio.get(best);
                return { text: token, source: 'fuzzy', clip };
            }
            return { text: token, source: 'none', clip: null };
        });
    }, [script, files, keySet]);

    // 재생 로직
    const playNext = (index) => {
        if (!isPlaying || index >= matchedTokens.length) {
            setIsPlaying(false); setCurrentIndex(-1); return;
        }
        const token = matchedTokens[index];
        setCurrentIndex(index);
        if (token.source === 'none' || token.source === 'space' || !token.clip?.file) {
            setTimeout(() => playNext(index + 1), token.source === 'space' ? 0 : 100);
            return;
        }
        const isVideo = token.source !== 'audio';
        const media = document.createElement(isVideo ? 'video' : 'audio');
        const url = URL.createObjectURL(token.clip.file);
        media.src = url;
        media.onloadedmetadata = () => {
            media.play();
            const loop = () => {
                if (canvasRef.current)
                    drawFrame(canvasRef.current.getContext('2d'), media, isVideo, token.text, canvasRef.current, showSubtitles);
                if (!media.paused && !media.ended) requestAnimationFrame(loop);
            };
            loop();
        };
        media.onended = () => { URL.revokeObjectURL(url); playNext(index + 1); };
    };

    const handlePlay = () => {
        if (isPlaying) { setIsPlaying(false); setCurrentIndex(-1); return; }
        setIsPlaying(true);
        playNext(0);
    };

    return (
        <div className="app">
            {/* 좌측: 미리보기 + 컨트롤 */}
            <div className="left">
                <Monitor
                    canvasRef={canvasRef}
                    aspectRatio={aspect}
                    isLoadingPack={isLoadingPack}
                    loadingProgress={loadingProgress}
                    isPlaying={isPlaying}
                    currentIndex={currentIndex}
                />

                <div className="controls">
                    <button onClick={handlePlay}>{isPlaying ? '정지' : '재생'}</button>
                    <button
                        onClick={() => handleExport(matchedTokens, setCurrentIndex, setIsPlaying)}
                        disabled={isExporting}
                    >
                        {isExporting ? '내보내는 중...' : '내보내기'}
                    </button>
                    <button onClick={() => setShowSubtitles(v => !v)}>
                        자막 {showSubtitles ? 'ON' : 'OFF'}
                    </button>
                    <div className="ratio">
                        {['16:9', '9:16', '1:1'].map(r => (
                            <button key={r} className={aspect === r ? 'on' : ''} onClick={() => setAspect(r)}>{r}</button>
                        ))}
                    </div>
                </div>

                <SourcePanel packInfo={packInfo} handleFiles={handleFiles} />
            </div>

            {/* 우측: 에디터 */}
            <div className="right">
                <Editor
                    script={script}
                    setScript={setScript}
                    files={files}
                    matchedTokens={matchedTokens}
                    currentIndex={currentIndex}
                />
            </div>
        </div>
    );
}
