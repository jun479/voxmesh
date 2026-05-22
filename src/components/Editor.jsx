import React from 'react';

const Editor = ({ script, setScript }) => {
    return (
        <div className="flex-1 flex flex-col bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
            <div className="p-3 bg-[#1A1A1A] border-b border-[#262626]">
                <h2 className="text-xs font-bold text-[#666]">SCRIPT EDITOR</h2>
            </div>
            <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="여기에 대사를 입력하세요..."
                className="w-full flex-1 bg-transparent p-4 text-[#E0E0E0] outline-none resize-none font-['Malgun_Gothic'] text-lg leading-relaxed"
            />
        </div>
    );
};
export default Editor;
