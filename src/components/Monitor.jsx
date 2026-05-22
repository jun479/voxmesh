import React from 'react';
import { Play, Square, Download, FileVideo } from 'lucide-react';

const Monitor = ({ canvasRef, isPlaying, isExporting, onPlayPause, onExport }) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-[#262626] shadow-2xl flex items-center justify-center">
                <canvas ref={canvasRef} width="1280" height="720" className="w-full h-full object-contain"></canvas>
                {!isPlaying && !isExporting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                        <span className="text-white/30 font-bold tracking-widest">VOXMESH ENGINE</span>
                    </div>
                )}
            </div>
            
            <div className="flex gap-2 justify-center">
                <button onClick={onPlayPause} disabled={isExporting} className="p-4 rounded-xl bg-[#1A1A1A] hover:bg-[#262626] border border-[#333] transition-all">
                    {isPlaying ? <Square size={24} className="text-red-500" /> : <Play size={24} className="text-white" />}
                </button>
                <button onClick={onExport} disabled={isExporting || isPlaying} className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-2">
                    {isExporting ? <span className="animate-pulse">내보내는 중...</span> : <><Download size={24} /> Export</>}
                </button>
            </div>
        </div>
    );
};
export default Monitor;
