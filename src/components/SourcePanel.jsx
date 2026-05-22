import React, { useRef, useState } from 'react';

const SourcePanel = ({ onFilesSelected, isLoading, packInfo }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) onFilesSelected(Array.from(e.dataTransfer.files));
    };

    const isUnknown = packInfo.name === "Unknown" || !packInfo.name;

    return (
        <div className="p-6 bg-[#141414] rounded-xl border border-[#1F1F1F] space-y-4 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">Source Package</span>
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center overflow-hidden shrink-0 text-xl text-[#333]">
                    {packInfo.avatar ? <img src={packInfo.avatar} alt="avatar" className="w-full h-full object-cover" /> : '?'}
                </div>
                <div className="flex-1 overflow-hidden">
                    <h4 className="text-xl italic text-white font-serif truncate">
                        {isUnknown ? (packInfo.rawFolderName || "미등록 노드") : `${packInfo.name} 코어`}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isUnknown ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-[10px] font-bold uppercase text-[#666666]">
                            v{packInfo.version} — {isUnknown ? '미등록 음성팩' : '정식 상태 양호'}
                        </span>
                    </div>
                </div>
                
                {/* Glassmorphism DropZone */}
                <label 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative glass-btn px-6 py-3 rounded-full flex items-center gap-2 cursor-pointer transition-transform duration-300 ${isDragging ? 'scale-105 border-white/40 bg-white/20' : ''}`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#666666] pointer-events-none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest pointer-events-none">
                        {isLoading ? "Wait" : isDragging ? "Drop" : "Load"}
                    </span>
                    <input type="file" webkitdirectory="true" directory="true" multiple ref={fileInputRef} onChange={(e) => onFilesSelected(Array.from(e.target.files))} className="absolute inset-0 opacity-0 cursor-pointer hidden" />
                </label>
            </div>
        </div>
    );
};

export default SourcePanel;
