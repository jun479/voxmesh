import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useVoicePack } from './hooks/useVoicePack';
import { useExport } from './hooks/useExport';
import { normalize, getChosung, drawFrame } from './utils/core';

// Components (코드 길이상 하위 컴포넌트는 App 내부에 배치하거나 분리 가능)
import Header from './components/Header';
import PreviewPanel from './components/PreviewPanel';
import Controls from './components/Controls';
import VoicePackInfo from './components/VoicePackInfo';
import ScriptEditor from './components/ScriptEditor';

export default function App() {
    const { files, isLoadingPack, loadingProgress, packInfo, handleFiles } = useVoicePack();
    const [script, setScript] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [showSubtitles, setShowSubtitles] = useState(true);
    
    const canvasRef = useRef(null);
    const { isExporting, handleExport } = useExport(canvasRef, packInfo);

    // 엔진 매칭 로직 (단순화를 위해 App에 유지)
    const allFileKeys = useMemo(() => [...new Set([...files.scripts.keys(), ...files.video.keys(), ...files.audio.keys()])].sort((a,b) => b.length - a.length), [files]);
    
    const matchedTokens = useMemo(() => {
        let remaining = script; const tokens = [];
        while (remaining.length > 0) {
            let found = false;
            for (const key of allFileKeys) {
                if (normalize(remaining).startsWith(key)) {
                    const originalMatch = remaining.substring(0, remaining.toLowerCase().indexOf(key) + key.length);
                    const actualText = remaining.substring(0, originalMatch.length);
                    let source = "none", clip = null;
                    if (files.scripts.has(key)) { source = "script"; clip = files.scripts.get(key); }
                    else if (files.video.has(key)) { source = "video"; clip = files.video.get(key); }
                    else if (files.audio.has(key)) { source = "audio"; clip = files.audio.get(key); }
                    tokens.push({ text: actualText, source, clip });
                    remaining = remaining.substring(actualText.length);
                    found = true; break;
                }
            }
            if (!found) { tokens.push({ text: remaining[0], source: "none" }); remaining = remaining.substring(1); }
        }
        return tokens;
    }, [script, allFileKeys, files]);

    // 일반 프리뷰 재생 로직 (Lazy Loading)
    useEffect(() => {
        if (isPlaying && !isExporting && currentIndex < matchedTokens.length) {
            if (currentIndex === -1) { setCurrentIndex(0); return; }
            const token = matchedTokens[currentIndex];
            if (token.source === "none" || !token.clip?.file) {
                const timeout = setTimeout(() => setCurrentIndex(p => p + 1), 100);
                return () => clearTimeout(timeout);
            }
            const isVideo = token.source !== "audio";
            const media = document.createElement(isVideo ? 'video' : 'audio');
            const objectUrl = URL.createObjectURL(token.clip.file);
            media.src = objectUrl;

            media.onloadedmetadata = () => {
                media.play();
                const loop = () => {
                    drawFrame(canvasRef.current.getContext('2d'), media, isVideo, token.text, canvasRef.current, showSubtitles);
                    if (!media.paused && !media.ended) requestAnimationFrame(loop);
                };
                loop();
            };
            media.onended = () => { URL.revokeObjectURL(objectUrl); setCurrentIndex(p => p + 1); };
        } else if (currentIndex >= matchedTokens.length && !isExporting) {
            setIsPlaying(false); setCurrentIndex(-1);
        }
    }, [isPlaying, isExporting, currentIndex, matchedTokens, showSubtitles]);

    return (
        <div className="flex h-screen bg-[#0A0A0A] text-[#E0E0E0] overflow-hidden p-6 gap-6 font-['Noto_Sans_KR']">
            <div className="w-[60%] flex flex-col gap-6">
                <Header aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} />
                <PreviewPanel canvasRef={canvasRef} aspectRatio={aspectRatio} isLoadingPack={isLoadingPack} loadingProgress={loadingProgress} />
                <Controls 
                    isPlaying={isPlaying} setIsPlaying={setIsPlaying} 
                    currentIndex={currentIndex} total={matchedTokens.length}
                    showSubtitles={showSubtitles} setShowSubtitles={setShowSubtitles}
                    isExporting={isExporting} 
                    handleExport={() => handleExport(matchedTokens, setCurrentIndex, setIsPlaying)}
                />
            </div>
            <div className="w-[40%] flex flex-col gap-6">
                <VoicePackInfo packInfo={packInfo} handleFiles={handleFiles} />
                <ScriptEditor script={script} setScript={setScript} files={files} matchedTokens={matchedTokens} currentIndex={currentIndex} />
            </div>
        </div>
    );
}
