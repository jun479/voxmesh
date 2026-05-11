import React from 'react';
import { Play, Pause, Captions, CaptionsOff } from 'lucide-react';

export default function Controls({ isPlaying, setIsPlaying, currentIndex, total, showSubtitles, setShowSubtitles, isExporting, handleExport }) {
    return (
        <div className="h-32 bg-[#141414] rounded-xl border border-[#1F1F1F] p-6 flex items-center gap-8 shadow-xl">
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full border border-[#333333] text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-lg shrink-0">
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <div className="flex-1 space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#666666]">
                    <span>Timeline Sequence</span>
                    <span className="font-mono text-zinc-400">{total > 0 ? currentIndex + 1 : 0} / {total}</span>
                </div>
                <div className="h-[2px] bg-[#262626] relative">
                    <div 
                        className="absolute h-full bg-white transition-all shadow-[0_0_8px_white]" 
                        style={{ width: `${total > 0 ? ((currentIndex + 1) / total) * 100 : 0}%` }} 
                    />
                </div>
            </div>
            <div className="flex gap-4 items-center">
                <button onClick={() => setShowSubtitles(!showSubtitles)} title="Toggle Subtitles" className={`p-3 rounded-full border transition-all ${showSubtitles ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-transparent text-[#666666] border-[#333333] hover:text-white'}`}>
                    {showSubtitles ? <Captions size={22} /> : <CaptionsOff size={22} />}
                </button>
                <button onClick={handleExport} disabled={isExporting} className="px-8 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50">
                    {isExporting ? 'Exporting...' : '내보내기'}
                </button>
            </div>
        </div>
    );
}