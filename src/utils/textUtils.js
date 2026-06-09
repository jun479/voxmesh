export const normalize = (str) => str.replace(/\s+/g, '').toLowerCase();

export const getChosung = (str) => {
    const chosen = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
    let result = "";
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i) - 44032;
        if (code > -1 && code < 11172) result += chosen[Math.floor(code / 588)];
        else result += str[i];
    }
    return result;
};

export const VOICE_PACK_DATABASE = {};

export const drawFrame = () => {
    console.log("drawFrame placeholder");
};

/**
 * DP 방식으로 한 줄을 음성팩 파일명 단위로 분리 매칭.
 * 반환: [{ text: string, type: 'video'|'audio'|'none' }, ...]
 */
export const splitMatchLine = (line, audioFiles, videoFiles) => {
    const key = normalize(line);
    if (!key) return [{ text: line, type: 'none', clip: null }];

    // 1순위: exact match
    if (videoFiles?.has(key)) return [{ text: line, type: 'video', clip: videoFiles.get(key) }];
    if (audioFiles?.has(key)) return [{ text: line, type: 'audio', clip: audioFiles.get(key) }];

    // 2순위: DP 음절 분리
    const chars = [...key];
    const n = chars.length;
    // dp[i] = 0~i-1 까지 커버하는 세그먼트 배열 (null = 아직 미도달)
    const dp = Array(n + 1).fill(null);
    dp[0] = [];

    for (let i = 0; i < n; i++) {
        if (dp[i] === null) continue;
        for (let j = i + 1; j <= n; j++) {
            const sub = chars.slice(i, j).join('');
            let type = null;
            let clip = null;
            if (videoFiles?.has(sub)) { type = 'video'; clip = videoFiles.get(sub); }
            else if (audioFiles?.has(sub)) { type = 'audio'; clip = audioFiles.get(sub); }

            if (type !== null && dp[j] === null) {
                dp[j] = [...dp[i], { text: sub, type, clip }];
            }
        }
        // 매칭 안 되는 음절은 none으로 한 칸 전진
        if (dp[i + 1] === null) {
            const prevNone = dp[i].length > 0 && dp[i][dp[i].length - 1].type === 'none';
            if (prevNone) {
                // 마지막 none 세그먼트에 글자 합치기
                const prev = [...dp[i]];
                prev[prev.length - 1] = { ...prev[prev.length - 1], text: prev[prev.length - 1].text + chars[i] };
                dp[i + 1] = prev;
            } else {
                dp[i + 1] = [...dp[i], { text: chars[i], type: 'none', clip: null }];
            }
        }
    }

    return dp[n] || [{ text: line, type: 'none', clip: null }];
};
