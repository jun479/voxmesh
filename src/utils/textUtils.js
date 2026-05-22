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

export const VOICE_PACK_DATABASE = {
    "심영": "1.0.0", "김두한": "1.0.2", "조병욱": "1.0.0", "상하이조": "1.1.0", "이정재": "1.0.5"
};

export const levenshtein = (a, b) => {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    return dp[m][n];
};

// Canvas 프레임 렌더러
export const drawFrame = (ctx, media, isVideo, label, canvas, showSubtitles) => {
    if (media.paused || media.ended) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (isVideo) {
        const vRatio = media.videoWidth / media.videoHeight;
        const cRatio = canvas.width / canvas.height;
        let nw, nh, nx, ny;
        if (vRatio > cRatio) { nw = canvas.width; nh = canvas.width / vRatio; nx = 0; ny = (canvas.height - nh) / 2; }
        else { nh = canvas.height; nw = canvas.height * vRatio; nx = (canvas.width - nw) / 2; ny = 0; }
        ctx.drawImage(media, nx, ny, nw, nh);
    }
    if (showSubtitles) {
        ctx.font = '700 36px "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'black';
        ctx.fillText(label, canvas.width / 2, canvas.height - 60);
    }
};
