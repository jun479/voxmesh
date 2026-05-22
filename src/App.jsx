import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useVoicePack } from './hooks/useVoicePack';
import { useExport } from './hooks/useExport';
import { normalize } from './utils/textUtils';

import Monitor from './components/Monitor';
import SourcePanel from './components/SourcePanel';
import Editor from './components/Editor';

const App = () => {
    const { files, packInfo, isLoadingPack, loadingProgress, handleFiles } = useVoicePack();
    const [script, setScript] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const canvasRef = useRef(null);

    // TODO: useMemo를 활용한 matchedTokens 계산 로직 (이전 답변 참조)
    const matchedTokens = []; 
    
    // TODO: renderToCanvas 함수 로직 (이전 답변 참조)
    const renderToCanvas = useCallback(() => {}, []);

    const { isExporting, handleExport } = useExport(canvasRef, matchedTokens, packInfo.name, renderToCanvas);

    return (
        <div className="flex h-screen bg-[#0A0A0A] text-[#E0E0E0] p-6 gap-6">
            {/* 좌측: 소스 패널 및 에디터 */}
            <div className="w-1/3 flex flex-col gap-6">
                <SourcePanel 
                    onFilesSelected={handleFiles} 
                    isLoading={isLoadingPack} 
                    progress={loadingProgress} 
                    packInfo={packInfo} 
                />
                <Editor script={script} setScript={setScript} />
            </div>

            {/* 우측: 프리뷰 모니터 */}
            <div className="flex-1 flex flex-col">
                <Monitor 
                    canvasRef={canvasRef} 
                    isPlaying={isPlaying} 
                    isExporting={isExporting} 
                    onPlayPause={() => setIsPlaying(!isPlaying)} 
                    onExport={() => handleExport(() => {})} 
                />
            </div>
        </div>
    );
};

export default App;
