import React from 'react';

const Monitor = ({ 
    canvasRef, isPlaying, isExporting, showSubtitles, 
    currentRatio, onRatioChange, onPlayPause, onExport, onToggleSubtitles,
    currentIndex, totalLines, progressPercent
}) => {
    return (
        <div className="w-[60%] flex flex-col gap-6">
            {/* HEADER */}
            <div className="flex justify-between items-end pb-2 border-b border-[#1F1F1F]">
                <div className="space-y-1">
                    <h1 className="text-4xl italic tracking-tight leading-none text-white font-serif select-none">voxmesh</h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#666666] select-none">Clip-Based Voice Synthesizer</p>
                </div>
                <div className="flex items-center gap-4">
                    <a href="https://discord.gg/dTGMxUSUrk" target="_blank" rel="noreferrer" className="p-2.5 rounded-full border border-[#1F1F1F] hover:bg-[#5865F2] hover:text-white transition-all text-[#666666]">
                        <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.06,72.06,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.39,80.21a105.73,105.73,0,0,0,32.22,16.15,77.7,77.7,0,0,0,7.37-12,67.65,67.65,0,0,1-11.9-5.69c.3-.22.59-.45.88-.68a74.87,74.87,0,0,0,65.8,0c.29.23.58.46.88.68a67.46,67.46,0,0,1-11.9,5.69,77,77,0,0,0,7.37,12,105.27,105.27,0,0,0,32.27-16.14C129.58,52.87,125.1,29.15,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.07-12.73,11.44-12.73S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.07-12.73,11.44-12.73S96.25,46,96.14,53,91.09,65.69,84.69,65.69Z"/></svg>
                    </a>
                    <a href="https://github.com/jun479/voxmesh" target="_blank" rel="noreferrer" className="p-2.5 rounded-full border border-[#1F1F1F] hover:bg-white hover:text-black transition-all text-[#666666]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                    </a>
                    {/* Ratio Toggle */}
                    <div className="flex bg-[#141414] border border-[#1F1F1F] rounded-lg p-1 shadow-inner">
                        <button onClick={() => onRatioChange("16:9")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${currentRatio === "16:9" ? "bg-[#262626] text-white" : "text-[#666666]"}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg> 16:9
                        </button>
                        <button onClick={() => onRatioChange("9:16")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${currentRatio === "9:16" ? "bg-[#262626] text-white" : "text-[#666666]"}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg> 9:16
                        </button>
                    </div>
                </div>
            </div>

            {/* CANVAS SCREEN */}
            <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl border border-[#1F1F1F] flex items-center justify-center">
                <canvas ref={canvasRef} width={currentRatio === "16:9" ? 1280 : 720} height={currentRatio === "16:9" ? 720 : 1280} className="max-w-full max-h-full object-contain transition-all duration-300"></canvas>
            </div>

            {/* BOTTOM MASTER CONTROLS */}
            <div className="h-32 bg-[#141414] rounded-xl border border-[#1F1F1F] p-6 flex items-center gap-8 shadow-xl">
                <button onClick={onPlayPause} disabled={isExporting} className="w-16 h-16 rounded-full border border-[#333333] text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-lg shrink-0">
                    {isPlaying ? 
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> : 
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    }
                </button>
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#666666]">
                        <span>Timeline Engine</span>
                        <span className="font-mono text-zinc-400">{currentIndex >= 0 ? currentIndex + 1 : 0} / {totalLines}</span>
                    </div>
                    <div className="h-[2px] bg-[#262626] relative">
                        <div className="absolute h-full bg-white transition-all duration-100 shadow-[0_0_8px_white]" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <button onClick={onToggleSubtitles} className={`p-3 rounded-full border transition-all ${showSubtitles ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-transparent text-[#666666] border-[#333333]'}`}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><path d="M7 15h4M15 15h2M7 11h2M13 11h4"></path></svg>
                    </button>
                    <button onClick={onExport} disabled={isExporting || isPlaying} className={`px-8 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors ${isExporting ? 'opacity-50' : ''}`}>
                        {isExporting ? "녹화중..." : "내보내기"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Monitor;
