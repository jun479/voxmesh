import React, { useRef } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { normalize, getChosung } from '../utils/textUtils';

const Editor = ({ script, setScript, files, currentIndex, isPlaying }) => {
    const highlightRef = useRef(null);
    const textareaRef = useRef(null);

    const handleScroll = (e) => {
        if (highlightRef.current) highlightRef.current.scrollTop = e.target.scrollTop;
    };

    // 1. 하이라이트 매칭 엔진
    const lines = script.split('\n');
    let matchedCount = 0;

    const renderHighlight = () => {
        return lines.map((line, index) => {
            const key = normalize(line);
            let type = "none";
            if (files.video && files.video.has(key)) type = "video";
            else if (files.audio && files.audio.has(key)) type = "audio";

            let colorClass = "text-zinc-600";
            if (type === "video") { colorClass = "text-[#a2c4c9]"; matchedCount++; }
            else if (type === "audio") { colorClass = "text-[#a4c2f4]"; matchedCount++; }

            const isActive = isPlaying && index === currentIndex;
            const finalClass = `${colorClass} ${isActive ? 'underline decoration-2 underline-offset-4 text-white' : ''}`;

            return (
                <React.Fragment key={index}>
                    <span className={finalClass}>{line || ' '}</span>
                    <br />
                </React.Fragment>
            );
        });
    };

    // 2. 실시간 단어 추천 엔진
    const lastWord = script.split(/\s+/).pop() || "";
    const searchKey = normalize(lastWord);
    const searchChosung = getChosung(searchKey);
    const recommendations = [];

    if (searchKey.length > 0) {
        const checkMap = (map, type) => {
            if (!map) return;
            for (const [key, val] of map.entries()) {
                if (key.includes(searchKey) || getChosung(key).includes(searchChosung)) {
                    recommendations.push({ name: val.name, type });
                }
                if (recommendations.length > 15) break; 
            }
        };
        checkMap(files.video, 'video');
        checkMap(files.audio, 'audio');
    }

    const applyRecommendation = (name) => {
        const words = script.trimEnd().split(/\s+/);
        words.pop(); // 치고 있던 단어 날리기
        // 추천어 적용 후 엔터(줄바꿈)를 넣어주면 라인 매칭 시스템에서 매우 편해집니다.
        const newScript = (words.length > 0 ? words.join(' ') + '\n' : '') + name + '\n';
        setScript(newScript);
        if (textareaRef.current) textareaRef.current.focus();
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#141414] rounded-xl border border-[#1F1F1F] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#1F1F1F] flex items-center justify-between bg-[#0F0F0F] select-none">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#666666] flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
                    Script Editor
                </h3>
                <div className="flex gap-4 text-[10px] font-bold text-[#666666]">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#a2c4c9]"></span> 영상</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#a4c2f4]"></span> 음성</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span> 미매칭</span>
                </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden">
                <div ref={highlightRef} className="absolute inset-0 p-8 whitespace-pre-wrap break-words malgun text-[22px] leading-[1.8] pointer-events-none tracking-tight overflow-y-auto text-transparent">
                    {renderHighlight()}
                </div>
                <textarea 
                    ref={textareaRef}
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    onScroll={handleScroll}
                    className="w-full h-full p-8 bg-transparent outline-none resize-none malgun text-[22px] leading-[1.8] text-transparent caret-white font-medium absolute inset-0 overflow-y-auto" 
                    placeholder="여기에 대사를 입력하십시오..."
                ></textarea>
            </div>

            {/* 추천 바 UI 원본 복구 */}
            <div className="p-4 bg-[#0F0F0F] border-t border-[#1F1F1F] overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {recommendations.length === 0 && <span className="text-[10px] text-[#444] italic">추천 파일이 여기에 표시됩니다. (총 {lines.length}줄 중 {matchedCount}줄 매칭)</span>}
                    {recommendations.map((rec, i) => (
                        <button key={i} onClick={() => applyRecommendation(rec.name)} className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#262626] text-[11px] font-bold hover:border-white transition-all flex items-center gap-2 text-[#E0E0E0]">
                            {rec.type === 'audio' ? <ShieldCheck size={12} className="text-[#a4c2f4]" /> : <Search size={12} className="text-[#a2c4c9]" />}
                            {rec.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Editor;
