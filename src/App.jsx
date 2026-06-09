import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useVoicePack } from './hooks/useVoicePack';
import { useExport } from './hooks/useExport';
import { normalize, splitMatchLine } from './utils/textUtils';

import Monitor from './components/Monitor';
import SourcePanel from './components/SourcePanel';
import Editor from './components/Editor';

const App = () => {
    const { files, packInfo, isLoadingPack, handleFiles } = useVoicePack();
    const [script, setScript] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [currentRatio, setCurrentRatio] = useState("16:9");
    const [currentIndex, setCurrentIndex] = useState(-1);
    
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const lines = script.split('\n');

    // 라인 단위 매칭 토큰 생성 (음절 분리 매칭 지원)
    const matchedTokens = useMemo(() => {
        return lines.flatMap(line => {
            const segments = splitMatchLine(line, files.audio, files.video);
            return segments.map(seg => ({
                text: line,        // 자막은 원본 줄 전체
                source: seg.type,  // 'video' | 'audio' | 'none'
                clip: seg.clip,
                segText: seg.text  // 실제 재생할 세그먼트 텍스트
            }));
        });
    }, [lines, files]);

    // 캔버스 실시간 렌더링 루프
    const renderToCanvas = useCallback((media, isVideo, text) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const draw = () => {
            if (media.paused || media.ended) return;
            
            ctx.fillStyle = 'black'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (isVideo) {
                const vRatio = media.videoWidth / media.videoHeight;
                const cRatio = canvas.width / canvas.height;
                let nw, nh, nx, ny;
                if (vRatio > cRatio) { nw = canvas.width; nh = canvas.width / vRatio; nx = 0; ny = (canvas.height - nh) / 2; }
                else { nh = canvas.height; nw = canvas.height * vRatio; nx = (canvas.width - nw) / 2; ny = 0; }
                ctx.drawImage(media, nx, ny, nw, nh);
            }
            
            if (showSubtitles && text) {
                ctx.font = '700 36px "Malgun Gothic", sans-serif';
                ctx.textAlign = 'center'; ctx.fillStyle = 'white';
                ctx.shadowBlur = 10; ctx.shadowColor = 'black';
                ctx.fillText(text, canvas.width / 2, canvas.height - 60);
                ctx.shadowBlur = 0;
            }
            requestRef.current = requestAnimationFrame(draw);
        };
        draw();
    }, [showSubtitles]);

    const { isExporting, handleExport } = useExport(canvasRef, matchedTokens, packInfo.name, renderToCanvas);

    // 🚀 핵심 재생 모터 🚀
    useEffect(() => {
        let isCancelled = false;

        const playSequence = async () => {
            if (!isPlaying || isExporting) return;

            if (currentIndex >= matchedTokens.length) {
                setIsPlaying(false);
                setCurrentIndex(-1);
                return;
            }

            if (currentIndex === -1) {
                setCurrentIndex(0);
                return;
            }

            const token = matchedTokens[currentIndex];

            if (token.source === "none" || !token.clip?.file) {
                await new Promise(r => setTimeout(r, 100));
                if (!isCancelled) setCurrentIndex(prev => prev + 1);
                return;
            }

            const isVideo = token.source !== "audio";
            const media = document.createElement(isVideo ? 'video' : 'audio');
            const objectUrl = URL.createObjectURL(token.clip.file);
            media.src = objectUrl;

            await new Promise((resolve) => {
                media.onloadedmetadata = () => {
                    media.play().catch(console.warn);
                    renderToCanvas(media, isVideo, token.text);
                };
                media.onended = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve();
                };
                media.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve();
                };
            });

            if (!isCancelled) setCurrentIndex(prev => prev + 1);
        };

        playSequence();

        return () => {
            isCancelled = true;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, isExporting, currentIndex, matchedTokens, renderToCanvas]);

    return (
        <div className="overflow-hidden p-6 font-['Noto_Sans_KR'] selection:bg-zinc-800 bg-[#0A0A0A] text-[#E0E0E0] h-screen box-border">
            <div className="flex h-[calc(100vh-3rem)] gap-6">
                <Monitor 
                    canvasRef={canvasRef}
                    isPlaying={isPlaying}
                    isExporting={isExporting}
                    showSubtitles={showSubtitles}
                    currentRatio={currentRatio}
                    onRatioChange={setCurrentRatio}
                    onPlayPause={() => setIsPlaying(!isPlaying)}
                    onExport={() => handleExport(setCurrentIndex)}
                    onToggleSubtitles={() => setShowSubtitles(!showSubtitles)}
                    currentIndex={currentIndex}
                    totalLines={script.trim() ? lines.length : 0}
                    progressPercent={script.trim() ? ((currentIndex + 1) / lines.length) * 100 : 0}
                />
                <div className="w-[40%] flex flex-col gap-6">
                    <SourcePanel 
                        onFilesSelected={handleFiles} 
                        isLoading={isLoadingPack} 
                        packInfo={packInfo} 
                    />
                    <Editor 
                        script={script} 
                        setScript={setScript} 
                        files={files} 
                        currentIndex={currentIndex} 
                        isPlaying={isPlaying} 
                    />
                </div>
            </div>
        </div>
    );
};

export default App;
