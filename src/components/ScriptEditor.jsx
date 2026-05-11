import React, { useRef, useEffect, useState } from 'react';
import { Type, ShieldCheck, Film, Music, Search } from 'lucide-react';
import { normalize, getChosung } from '../utils/core';

export default function ScriptEditor({ script, setScript, files, matchedTokens, currentIndex }) {
    const textareaRef = useRef(null);
    const highlightRef = useRef(null);
    const [recommendations, setRecommendations] = useState([]);

    // 초성 검색 엔진 탑재
    useEffect(() => {
        const lastWord = script.split(/\s+/).pop() || "";
        if (!lastWord) { setRecommendations([]); return; }
        const searchKey = normalize(lastWord);
        const searchChosung = getChosung(searchKey);
        const matches = [];
        
        const searchInMap = (map, type) => {
            for (const [key, val] of map.entries()) {
                if (key.includes(searchKey) || getChosung(key).includes(searchChosung)) {
                    matches.push({ ...val, type });
                }
                if (matches.length > 30) break;
            }
        };
        
        searchInMap(files.scripts, '대사');
        searchInMap(files.video, 'video');
        searchInMap(files.audio, 'audio');
        setRecommendations(matches);
    }, [script, files]);

    const applyRecommendation = (name) => {
        const words = script.split(/\s+/); 
        words.pop();
        setScript([...words, name].join(" ") + " ");
        textareaRef.current?.focus();
    };

    const handleScroll = (e) => {
        if (highlightRef.current) highlightRef.current.scrollTop = e.target.scrollTop;
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#141414] rounded-xl border border-[#1F1F1F] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#1F1F1F] flex items-center justify-between bg-[#0F0F0F]">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#666666] flex items-center gap-2">
                    <Type size={12} /> Script Editor
                </h3>
                <div className="flex gap-3 text-[10px] font-bold text-[#666666]">
                    <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-[#B4A7D6]"/> 대사</span>
                    <span className="flex items-center gap-1"><Film size={12} className="text-[#A2C4C9]"/> 영상</span>
                    <span className="flex items-center gap-1"><Music size={12} className="text-[#A4C2F4]"/> 음성</span>
                </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden">
                <div ref={highlightRef} className="absolute inset-0 p-8 whitespace-pre-wrap break-words font-['Malgun_Gothic'] text-[22px] leading-[1.8] pointer-events-none tracking-tight">
                    {matchedTokens.map((t, i) => (
                        <span key={i} className={`${t.source === 'script' ? 'text-[#B4A7D6]' : t.source === 'video' ? 'text-[#A2C4C9]' : t.source === 'audio' ? 'text-[#A4C2F4]' : 'text-[#444]'} ${i === currentIndex ? 'underline decoration-2 underline-offset-8 text-white' : ''}`}>
                            {t.text}
                        </span>
                    ))}
                </div>
                <textarea
                    ref={textareaRef}
                    className="w-full h-full p-8 bg-transparent outline-none resize-none font-['Malgun_Gothic'] text-[22px] leading-[1.8] text-transparent caret-white font-medium"
                    placeholder="여기에 대사를 입력하십시오..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    onScroll={handleScroll}
                />
            </div>
            
            <div className="p-4 bg-[#0F0F0F] border-t border-[#1F1F1F] overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {recommendations.length === 0 && <span className="text-[10px] text-[#444] italic">추천 파일이 여기에 표시됩니다.</span>}
                    {recommendations.map((rec, i) => (
                        <button key={i} onClick={() => applyRecommendation(rec.name)} className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#262626] text-[11px] font-bold hover:border-white text-zinc-300 hover:text-white transition-all flex items-center gap-2">
                            {rec.type === '대사' ? <ShieldCheck size={12} className="text-[#B4A7D6]" /> : <Search size={12} />}
                            {rec.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}