import { useState, useCallback } from 'react';

export const useExport = (canvasRef, matchedTokens, packName, renderToCanvas) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = useCallback(async (setCurrentIndex) => {
        if (!canvasRef.current || matchedTokens.length === 0 || isExporting) return;
        setIsExporting(true);

        try {
            const canvas = canvasRef.current;
            
            // 1. 비디오 스트림 캡처 (초당 30프레임)
            const canvasStream = canvas.captureStream(30);
            
            // 2. 오디오 컨텍스트 및 합선망(Destination) 생성
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // [중요] 브라우저 오디오 자동재생 차단 방어
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume(); 
            }
            const audioDest = audioCtx.createMediaStreamDestination();

            // 3. 비디오 트랙과 오디오 트랙 병합
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioDest.stream.getAudioTracks()
            ]);

            // 4. [중요] 브라우저별 코덱 호환성 체크 (Safari 대응)
            let options = { mimeType: 'video/webm' };
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                options = { mimeType: 'video/webm;codecs=vp9' }; // Chrome 최적화
            } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                options = { mimeType: 'video/mp4' }; // Safari 호환
            } else {
                options = {}; // 브라우저 기본값 위임
            }

            const recorder = new MediaRecorder(combinedStream, options);
            const chunks = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

            // 5. 녹화 완료(stop) 시 파일을 다운로드하는 프로미스 설정
            const recordingComplete = new Promise((resolve) => {
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    
                    // 확장자 자동 지정
                    const ext = options.mimeType?.includes('mp4') ? 'mp4' : 'webm';
                    a.download = `voxmesh_${packName || 'export'}.${ext}`;
                    a.click();
                    
                    URL.revokeObjectURL(url);
                    audioCtx.close();
                    resolve();
                };
            });

            // 녹화 큐사인!
            recorder.start();

            // 6. 대본 순차 재생 및 렌더링 엔진 가동
            for (let i = 0; i < matchedTokens.length; i++) {
                setCurrentIndex(i); // UI 타임라인 업데이트
                const token = matchedTokens[i];

                // 매칭 안 된 텍스트는 0.1초 대기 후 스킵
                if (token.source === "none" || !token.clip?.file) {
                    await new Promise(r => setTimeout(r, 100));
                    continue;
                }

                await new Promise((resolve) => {
                    const isVideo = token.source !== "audio";
                    const media = document.createElement(isVideo ? 'video' : 'audio');
                    const objectUrl = URL.createObjectURL(token.clip.file);
                    
                    media.src = objectUrl;
                    // [중요] 로컬 파일은 crossOrigin="anonymous"를 쓰면 안 됩니다. (제거됨)

                    // 미디어를 오디오 컨텍스트에 연결 (녹음기 1가닥, 스피커 1가닥)
                    const sourceNode = audioCtx.createMediaElementSource(media);
                    sourceNode.connect(audioDest);
                    sourceNode.connect(audioCtx.destination); 

                    media.onloadedmetadata = () => {
                        media.play().catch(e => console.error("재생 실패:", e));
                        renderToCanvas(media, isVideo, token.text);
                    };

                    media.onended = () => {
                        sourceNode.disconnect();
                        URL.revokeObjectURL(objectUrl); // 메모리 해제
                        resolve();
                    };

                    media.onerror = () => {
                        console.error(`파일 로드 에러: ${token.text}`);
                        resolve(); // 에러가 나도 엔진이 멈추지 않게 다음으로 패스
                    };
                });
            }

            // 마지막 영상/자막이 잘리지 않도록 0.5초 대기 후 녹화 종료
            setTimeout(() => recorder.stop(), 500);
            await recordingComplete;

        } catch (error) {
            console.error("Export Error:", error);
            alert(`내보내기 중 오류가 발생했습니다.\n(원인: ${error.message})`);
        } finally {
            // 모든 작업이 끝나면 상태 초기화
            setIsExporting(false);
            setCurrentIndex(-1);
        }
    }, [canvasRef, matchedTokens, isExporting, packName, renderToCanvas]);

    return { isExporting, handleExport };
};
