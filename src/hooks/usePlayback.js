import { useEffect } from 'react';
import { drawFrame } from '../utils/core';

/**
 * 🎬 usePlayback.js
 * 캔버스 프리뷰 재생을 담당하는 코어 엔진.
 * 메모리 누수 방지(Lazy Loading) 및 프레임 렌더링(requestAnimationFrame)을 관리함.
 */
export const usePlayback = ({
    isPlaying,
    setIsPlaying,
    isExporting,
    currentIndex,
    setCurrentIndex,
    matchedTokens,
    canvasRef,
    showSubtitles
}) => {
    useEffect(() => {
        // 내보내기(Export) 중이 아닐 때만 일반 프리뷰 재생 로직 실행
        if (isPlaying && !isExporting && currentIndex < matchedTokens.length) {
            if (currentIndex === -1) { 
                setCurrentIndex(0); 
                return; 
            }
            
            const token = matchedTokens[currentIndex];
            
            // 빈 공간이나 매칭 안된 텍스트는 0.1초 딜레이만 주고 스킵
            if (token.source === "none" || !token.clip?.file) {
                const timeout = setTimeout(() => setCurrentIndex(p => p + 1), 100);
                return () => clearTimeout(timeout);
            }

            const isVideo = token.source !== "audio";
            const media = document.createElement(isVideo ? 'video' : 'audio');
            
            // 🚨 핵심 최적화: 재생할 때만 메모리 땡겨옴 (Lazy Loading)
            const objectUrl = URL.createObjectURL(token.clip.file);
            media.src = objectUrl;

            media.onloadedmetadata = () => {
                media.play();
                
                // 캔버스 렌더링 루프
                const loop = () => {
                    if (canvasRef.current) {
                        drawFrame(
                            canvasRef.current.getContext('2d'), 
                            media, 
                            isVideo, 
                            token.text, 
                            canvasRef.current, 
                            showSubtitles
                        );
                    }
                    if (!media.paused && !media.ended) {
                        requestAnimationFrame(loop);
                    }
                };
                loop();
            };

            media.onended = () => { 
                // 🚨 핵심 최적화: 재생 끝나면 얄짤없이 메모리 파기! 램 점유율 초기화!
                URL.revokeObjectURL(objectUrl); 
                setCurrentIndex(p => p + 1); 
            };

            // 컴포넌트 언마운트나 중간에 정지할 때를 대비한 안전장치(Cleanup)
            return () => {
                media.pause();
                media.removeAttribute('src');
                media.load();
                URL.revokeObjectURL(objectUrl);
            };

        } else if (currentIndex >= matchedTokens.length && !isExporting) {
            // 끝까지 재생 다 했으면 정지 상태로 초기화
            setIsPlaying(false); 
            setCurrentIndex(-1);
        }
    }, [isPlaying, isExporting, currentIndex, matchedTokens, showSubtitles, canvasRef, setIsPlaying, setCurrentIndex]);
};