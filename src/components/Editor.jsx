import React, { useRef } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { normalize, getChosung, splitMatchLine } from '../utils/textUtils';

const Editor = ({ script, setScript, files, currentIndex, isPlaying }) => {
    const highlightRef = useRef(null);
    const textareaRef = useRef(null);

    const handleScroll = (e) => {
        if (highlightRef.current) highlightRef.current.scrollTop = e.target.scrollTop;
    };

    // 1. 하이라이트 매칭 엔진 (음절 분리 지원)
    const lines = script.split('\n');
    let matchedCount = 0;

    const renderHighlight = () => {
        return lines.map((line, lineIndex) => {
            const isActive = isPlaying && lineIndex === currentIndex;
            const segments = splitMatchLine(line, files.audio, files.video);

            // 줄 전체가 매칭인지 판단 (통계용)
            const hasMatch = segments.some(s => s.type !== 'none');
            if (hasMatch) matchedCount++;

            return (
                <React.Fragment key={lineIndex}>
                    {segments.map((seg, si) => {
                        let colorClass = 'text-zinc-600';
                        if (seg.type === 'video') colorClass = 'text-[#a2c4c9]';
                        else if (seg.type === 'audio') colorClass = 'text-[#a4c2f4]';
                        const activeClass = isActive ? 'underline decoration-2 underline-offset-4 text-white' : '';
                        return (
                            <span key={si} className={`${colorClass} ${activeClass}`}>
                                {seg.text || (si === 0 ? ' ' : '')}
                            </span>
                        );
                    })}
                    <br />
                </React.Fragment>
            );
        });
    };

    // 2. 실시간 추천 엔진 — 현재 줄(마지막 줄 or 커서 줄) 기준
    const currentLineRaw = (() => {
        // textarea 커서 없이도 동작: 마지막 입력 중인 줄을 사용
        const lastNewline = script.lastIndexOf('\n');
        return script.slice(lastNewline + 1);
    })();
    const searchKey = normalize(currentLineRaw);
    const searchChosung = getChosung(searchKey);
    const recommendations = [];

    if (searchKey.length > 0) {
        const checkMap = (map, type) => {
            if (!map) return;
            for (const [key, val] of map.entries()) {
                if (recommendations.length >= 15) break;
                if (
                    key.startsWith(searchKey) ||       // 앞부분 일치 (입력 중)
                    key.includes(searchKey) ||          // 포함
                    getChosung(key).includes(searchChosung) // 초성 검색
                ) {
                    // 중복 방지
                    if (!recommendations.find(r => r.name === val.name)) {
                        recommendations.push({ name: val.name, type });
                    }
                }
            }
        };
        checkMap(files.video, 'video');
        checkMap(files.audio, 'audio');
    }

    const applyRecommendation = (name) => {
        // 현재 마지막 줄을 추천어로 교체 + 줄바꿈 추가
        const lastNewlineIdx = script.lastIndexOf('\n');
        const before = lastNewlineIdx >= 0 ? script.slice(0, lastNewlineIdx + 1) : '';
        const newScript = before + name + '\n';
        setScript(newScript);
        if (textareaRef.current) {
            textareaRef.current.focus();
            // 커서를 맨 끝으로
            setTimeout(() => {
                textareaRef.current.selectionStart = newScript.length;
                textareaRef.current.selectionEnd = newScript.length;
            }, 0);
        }
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
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-600]"></span> 미매칭</span>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <div
                    ref={highlightRef}
                    className="absolute inset-0 p-8 whitespace-pre-wrap break-words malgun text-[22px] leading-[1.8] pointer-events-none tracking-tight overflow-y-auto text-transparent"
                >
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

            {/* 추천 바 */}
            <div className="p-4 bg-[#0F0F0F] border-t border-[#1F1F1F] overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {recommendations.length === 0 && (
                        <span className="text-[10px] text-[#444] italic">
                            추천 파일이 여기에 표시됩니다. (총 {lines.length}줄 중 {matchedCount}줄 매칭)
                        </span>
                    )}
                    {recommendations.map((rec, i) => (
                        <button
                            key={i}
                            onClick={() => applyRecommendation(rec.name)}
                            className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#262626] text-[11px] font-bold hover:border-white transition-all flex items-center gap-2 text-[#E0E0E0]"
                        >
                            {rec.type === 'audio'
                                ? <ShieldCheck size={12} className="text-[#a4c2f4]" />
                                : <Search size={12} className="text-[#a2c4c9]" />
                            }
                            {rec.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Editor;
