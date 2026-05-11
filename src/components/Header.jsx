import React from 'react';
import { Monitor, Smartphone, Github } from 'lucide-react';

export default function Header({ aspectRatio, setAspectRatio }) {
    return (
        <div className="flex justify-between items-end pb-2 border-b border-[#1F1F1F]">
            <div className="space-y-1">
                <h1 className="text-4xl italic tracking-tight leading-none text-white font-serif">voxmesh</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#666666]">Clip-Based Voice Synthesizer</p>
            </div>
            <div className="flex items-center gap-4">
                <a href="[https://discord.gg/dTGMxUSUrk](https://discord.gg/dTGMxUSUrk)" target="_blank" rel="noreferrer" title="여기에서 공식 음성팩을 찾아보세요" className="p-2.5 rounded-full border border-[#1F1F1F] hover:bg-[#5865F2] hover:text-white transition-all text-[#666666]">
                    <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.06,72.06,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.39,80.21a105.73,105.73,0,0,0,32.22,16.15,77.7,77.7,0,0,0,7.37-12,67.65,67.65,0,0,1-11.9-5.69c.3-.22.59-.45.88-.68a74.87,74.87,0,0,0,65.8,0c.29.23.58.46.88.68a67.46,67.46,0,0,1-11.9,5.69,77,77,0,0,0,7.37,12,105.27,105.27,0,0,0,32.27-16.14C129.58,52.87,125.1,29.15,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.07-12.73,11.44-12.73S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.07-12.73,11.44-12.73S96.25,46,96.14,53,91.09,65.69,84.69,65.69Z"/>
                    </svg>
                </a>
                <a href="[https://github.com/jun479/voxmesh](https://github.com/jun479/voxmesh)" target="_blank" rel="noreferrer" title="깃허브" className="p-2.5 rounded-full border border-[#1F1F1F] hover:bg-white hover:text-black transition-all text-[#666666]">
                    <Github size={18} />
                </a>
                <div className="flex bg-[#141414] border border-[#1F1F1F] rounded-lg p-1 shadow-inner">
                    <button onClick={() => setAspectRatio('16:9')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${aspectRatio === '16:9' ? 'bg-[#262626] text-white' : 'text-[#666666] hover:text-zinc-300'}`}>
                        <Monitor size={14} /> 16:9
                    </button>
                    <button onClick={() => setAspectRatio('9:16')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${aspectRatio === '9:16' ? 'bg-[#262626] text-white' : 'text-[#666666] hover:text-zinc-300'}`}>
                        <Smartphone size={14} /> 9:16
                    </button>
                </div>
            </div>
        </div>
    );
}