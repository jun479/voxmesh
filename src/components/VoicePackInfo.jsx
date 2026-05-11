import React, { useState } from 'react';
import { FolderOpen } from 'lucide-react';

export default function VoicePackInfo({ packInfo, handleFiles }) {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div className="p-6 bg-[#141414] rounded-xl border border-[#1F1F1F] space-y-4 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">Source Package</span>
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center overflow-hidden shrink-0">
                    {packInfo.avatar ? <img src={packInfo.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-xl text-[#333]">?</span>}
                </div>
                <div className="flex-1 overflow-hidden">
                    <h4 className="text-xl italic text-white font-serif truncate">
                        {packInfo.name === "Unknown" ? (packInfo.rawFolderName || "미등록 노드") : `${packInfo.name} 코어`}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${packInfo.name === "Unknown" || packInfo.version !== "1.0.0" /* 실제 DB체크 필요 */ ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="text-[10px] font-bold uppercase text-[#666666]">
                            v{packInfo.version} — {packInfo.name === "Unknown" ? "미등록 음성팩" : "상태 양호"}
                        </span>
                    </div>
                </div>
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); /* 드롭 로직 */ }}
                    className={`relative glass-btn px-6 py-3 rounded-full flex items-center gap-2 cursor-pointer ${isDragging ? 'scale-105 border-white/40 bg-white/20' : ''}`}
                >
                    <FolderOpen size={16} className={isDragging ? 'text-white' : 'text-[#666666]'} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{isDragging ? 'Drop' : 'Load'}</span>
                    <input type="file" webkitdirectory="true" directory="" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFiles(Array.from(e.target.files))} />
                </div>
            </div>
        </div>
    );
}
