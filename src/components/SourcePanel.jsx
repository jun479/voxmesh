import React, { useRef } from 'react';
import { Upload, FolderOpen } from 'lucide-react';

const SourcePanel = ({ onFilesSelected, isLoading, progress, packInfo }) => {
    const fileInputRef = useRef(null);

    return (
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-4 flex flex-col h-full">
            <h2 className="text-sm font-bold text-[#888] mb-4 flex items-center gap-2">
                <FolderOpen size={16} /> DATA SOURCE
            </h2>
            
            <input 
                type="file" 
                webkitdirectory="true" 
                directory="true" 
                multiple 
                ref={fileInputRef} 
                onChange={(e) => onFilesSelected(e.target.files)} 
                className="hidden" 
            />
            
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full py-8 border-2 border-dashed border-[#333] hover:border-[#666] rounded-xl flex flex-col items-center justify-center gap-2 transition-all bg-[#0A0A0A]"
            >
                <Upload size={32} className={isLoading ? "animate-bounce text-[#666]" : "text-[#444]"} />
                <span className="text-sm font-bold text-[#666]">
                    {isLoading ? `로딩 중... ${progress}%` : "음성팩 폴더 업로드"}
                </span>
            </button>

            {packInfo.name && (
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                    <p className="text-blue-400 font-bold text-sm">✓ {packInfo.name} 팩 인식됨 (v{packInfo.version})</p>
                </div>
            )}
        </div>
    );
};
export default SourcePanel;
