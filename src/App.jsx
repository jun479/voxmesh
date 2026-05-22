import React, { useState, useRef, useCallback } from 'react';
import { useVoicePack } from './hooks/useVoicePack';
import { useExport } from './hooks/useExport';

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
    const lines = script.split('\n');

    // 캔버스 렌더링 로직 (비율 적용 포함)
    const renderToCanvas = useCallback((media, isVideo, text) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
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
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'black';
            ctx.fillText(text, canvas.width / 2, canvas.height - 60);
            ctx.shadowBlur = 0;
        }
    }, [showSubtitles]);

    const { isExporting, handleExport } = useExport(canvasRef, /* matchedTokens 파싱 로직 훅에서 처리 */, packInfo.name, renderToCanvas);

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
