import { useState } from 'react';
import { normalize, VOICE_PACK_DATABASE } from '../utils/core';

export const useVoicePack = () => {
    const [files, setFiles] = useState({ audio: new Map(), video: new Map(), scripts: new Map() });
    const [isLoadingPack, setIsLoadingPack] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [packInfo, setPackInfo] = useState({ name: null, version: "0.0.0", rawFolderName: "", avatar: null });

    const handleFiles = async (uploadedFiles) => {
        if (uploadedFiles.length === 0) return;
        setIsLoadingPack(true); setLoadingProgress(0);

        const firstPath = uploadedFiles[0].webkitRelativePath || uploadedFiles[0].name;
        const rootFolderName = firstPath.split('/')[0];
        
        let detectedName = "Unknown", detectedVersion = "0.0.0", detectedAvatar = null;
        Object.keys(VOICE_PACK_DATABASE).forEach(key => { if (rootFolderName.includes(key)) detectedName = key; });
        const vMatch = rootFolderName.match(/(\d+\.\d+\.\d+)/);
        if (vMatch) detectedVersion = vMatch[0];

        const audioMap = new Map(), videoMap = new Map(), scriptMap = new Map();
        const total = uploadedFiles.length;

        for (let i = 0; i < total; i++) {
            const file = uploadedFiles[i];
            const pathLower = (file.webkitRelativePath || "").toLowerCase();
            const fileNameRaw = file.name.split('.')[0];
            const ext = file.name.split('.').pop().toLowerCase();
            const nameKey = normalize(fileNameRaw);

            if (['png', 'jpg', 'jpeg'].includes(ext) && (pathLower.split('/').length <= 2 || fileNameRaw === 'profile')) {
                detectedAvatar = URL.createObjectURL(file); // 아바타만 예외 허용
            }

            const data = { file, name: fileNameRaw }; // Lazy Loading을 위해 file 원본 저장
            if (pathLower.includes('/대사/')) scriptMap.set(nameKey, { ...data, folder: '대사' });
            else if (pathLower.includes('/video/')) videoMap.set(nameKey, { ...data, folder: 'video' });
            else if (pathLower.includes('/audio/')) audioMap.set(nameKey, { ...data, folder: 'audio' });

            setLoadingProgress(Math.round(((i + 1) / total) * 100));
            if (i % 100 === 0) await new Promise(r => setTimeout(r, 0)); // 메인 스레드 락다운 방지
        }

        setPackInfo({ name: detectedName, version: detectedVersion, rawFolderName: rootFolderName, avatar: detectedAvatar });
        setFiles({ audio: audioMap, video: videoMap, scripts: scriptMap });
        setIsLoadingPack(false);
    };

    return { files, isLoadingPack, loadingProgress, packInfo, handleFiles };
};
