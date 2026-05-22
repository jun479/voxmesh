import React from 'react';
import { Loader2, Film } from 'lucide-react';

export default function Monitor({ canvasRef, aspectRatio, isLoadingPack, loadingProgress, isPlaying, currentIndex }) {
    return (
        <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl border border-[#1F1F1F] flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={aspectRatio === '16:9' ? 1280 : 720}
                height={aspectRatio === '16:9' ? 720 : 1280}
                className="max-w-full max-h-full object-contain"
            />

            {isLoadingPack && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-white mb-4" size={32} />
                    <p className="text-xs uppercase tracking-widest text-[#666666]">{loadingProgress}% Synchronized</p>
                </div>
            )}

            {!isPlaying && currentIndex === -1 && !isLoadingPack && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <Film size={60} strokeWidth={1} className="text-white" />
                </div>
            )}
        </div>
    );
}
