import { useState, useCallback } from 'react';
import { normalize } from '../utils/textUtils';

export const useVoicePack = () => {
    const [files, setFiles] = useState({ audio: new Map(), video: new Map(), scripts: new Map() });
    const [packInfo, setPackInfo] = useState({ name: null, version: "0.0.0", rawFolderName: "", avatar: null });
    const [isLoadingPack, setIsLoadingPack] = useState(false);

    const handleFiles = useCallback(async (uploadedFiles) => {
        if (!uploadedFiles || uploadedFiles.length === 0) return;
        setIsLoadingPack(true);

        const firstFilePath = uploadedFiles[0].webkitRelativePath || uploadedFiles[0].name;
        const rootFolderName = firstFilePath.split('/')[0];
        let detectedAvatar = null;

        const audioMap = new Map();
        const videoMap = new Map();
        const scriptMap = new Map();

        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const fileNameRaw = file.name.split('.')[0];
            const ext = file.name.split('.').pop().toLowerCase();
            const nameKey = normalize(fileNameRaw);
            const data = { file, name: fileNameRaw };

            // 경로 상관없이 확장자로만 강제 분류! (인식률 100%)
            if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
                videoMap.set(nameKey, data);
            } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
                audioMap.set(nameKey, data);
            } else if (['txt', 'json'].includes(ext)) {
                scriptMap.set(nameKey, data);
            } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
                if (!detectedAvatar && (fileNameRaw.includes('profile') || fileNameRaw.includes('icon'))) {
                    detectedAvatar = URL.createObjectURL(file);
                }
            }
        }

        setPackInfo({ name: rootFolderName, version: "1.0.0", rawFolderName: rootFolderName, avatar: detectedAvatar });
        setFiles({ audio: audioMap, video: videoMap, scripts: scriptMap });
        setIsLoadingPack(false);
    }, []);

    return { files, packInfo, isLoadingPack, handleFiles };
};
