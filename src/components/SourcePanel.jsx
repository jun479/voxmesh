import React, { useState } from 'react';
import { FolderOpen } from 'lucide-react';

export default function SourcePanel({ packInfo, handleFiles }) {
    const [isDragging, setIsDragging] = useState(false);

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length) handleFiles(dropped);
    };

    return (
        <div className="p-6 bg-[#141414] rounded-xl border border-[#1F1F1F] space-y-4 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">Source Package</span>
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center overflow-hidden shrink-0">
                    {packInfo.avatar
                        ? <img src={packInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        : <span className="text-xl text-[#333]">?</span>
                    }
                </div>
                <div className="flex-1 overflow-hidden">
                    <h4 className="text-xl italic text-white font-serif truncate">
                        {packInfo.name && packInfo.name !== "Unknown"
                            ? `${packInfo.name} 코어`
                            : packInfo.rawFolderName || "미등록 노드"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${packInfo.name && packInfo.name !== "Unknown" ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-bold uppercase text-[#666666]">
                            v{packInfo.version} — {packInfo.name && packInfo.name !== "Unknown" ? "상태 양호" : "미등록 음성팩"}
                        </span>
                    </div>
                </div>
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={`relative px-6 py-3 rounded-full border flex items-center gap-2 cursor-pointer transition-all
                        ${isDragging ? 'scale-105 border-white/40 bg-white/20' : 'border-[#333] bg-[#1A1A1A] hover:border-white/30'}`}
                >
                    <FolderOpen size={16} className={isDragging ? 'text-white' : 'text-[#666666]'} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {isDragging ? 'Drop' : 'Load'}
                    </span>
                    <input
                        type="file"
                        webkitdirectory="true"
                        directory=""
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFiles(Array.from(e.target.files))}
                    />
                </div>
            </div>
        </div>
    );
}
