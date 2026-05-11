import { useState } from 'react';
import { drawFrame } from '../utils/core';

export const useExport = (canvasRef, packInfo) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (matchedTokens, setCurrentIndex, setIsPlaying) => {
        if (matchedTokens.length === 0 || isExporting) return;
        setIsExporting(true); setIsPlaying(true);
        
        const canvas = canvasRef.current;
        const canvasStream = canvas.captureStream(30);
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const audioDest = audioCtx.createMediaStreamDestination();
        
        const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioDest.stream.getAudioTracks()]);
        const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' });
        
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `voxmesh_${packInfo.name || 'video'}.webm`; a.click();
            setIsExporting(false); setIsPlaying(false); setCurrentIndex(-1);
            audioCtx.close();
        };

        recorder.start();

        for (let i = 0; i < matchedTokens.length; i++) {
            setCurrentIndex(i);
            const token = matchedTokens[i];
            if (token.source === "none" || !token.clip || !token.clip.file) {
                await new Promise(r => setTimeout(r, 100)); continue;
            }
            
            await new Promise((resolve) => {
                const isVideo = token.source !== "audio";
                const media = document.createElement(isVideo ? 'video' : 'audio');
                
                const objectUrl = URL.createObjectURL(token.clip.file);
                media.src = objectUrl; media.crossOrigin = "anonymous";
                
                const sourceNode = audioCtx.createMediaElementSource(media);
                sourceNode.connect(audioDest); sourceNode.connect(audioCtx.destination);

                media.onloadedmetadata = () => { 
                    media.play();
                    const loop = () => {
                        drawFrame(canvas.getContext('2d'), media, isVideo, token.text, canvas, true);
                        if (!media.paused && !media.ended) requestAnimationFrame(loop);
                    };
                    loop();
                };
                media.onended = () => {
                    sourceNode.disconnect();
                    URL.revokeObjectURL(objectUrl); // 즉각 파기
                    resolve();
                };
                media.onerror = resolve;
            });
        }
        setTimeout(() => recorder.stop(), 500);
    };

    return { isExporting, handleExport };
};
