# Voxmesh
<img width="1343" height="851" alt="image" src="https://github.com/user-attachments/assets/3ce766bd-8dcb-4144-ac8f-970ac2248616" />


> [!IMPORTANT]
> Voxmesh는 AI TTS 프로젝트가 아닙니다.
>
> 기존 밈 대사 클립을 조합하여 영상을 생성하는 로컬 기반 웹 툴입니다.

텍스트를 입력하면 대사와 일치하는 음성/영상 클립을 자동으로 조합하여 재생하고 내보낼 수 있습니다.

---

# Features

* [x] 로컬 Voice Pack 기반 재생
* [x] 줄 단위 대사 입력
* [x] 자동 음성/영상 매칭
* [x] Canvas 기반 미리보기
* [x] WebM Export
* [x] 자막 렌더링
* [x] 16:9 / 9:16 비율 지원
* [x] Lazy Loading 메모리 최적화
* [ ] 다중 음성팩 관리
* [ ] 버전 자동 업데이트 감지
* [ ] Native MP4 Export
* [ ] 타임라인 에디터

---

# Voice Pack Structure

> [!TIP]
> 폴더 이름에 버전을 포함하는 것을 권장합니다.
>
> 예시:
>
> `심영 v1.0.3`

```text
심영 v1.0.3/
├ audio/
│ ├ 여기가백병원이요.wav
│ ├ 의사양반.wav
│ └ 내가고자라니.wav
│
└ video/
  ├ 여기가백병원이요.webm
  └ 의사양반.webm
```

---

# Usage

## 1. Voice Pack 업로드

> [!NOTE]
> Voice Pack은 서버에 업로드되지 않습니다.
>
> 모든 파일은 브라우저 내부에서만 처리됩니다.

지원 방식:

* Drag & Drop
* Folder Select
* `webkitdirectory`

---

## 2. 대사 입력

엔터 기준으로 줄이 구분됩니다.

예시:

```text
여기가 백병원이요?
의사양반
내가 고자라니
```

---

## 3. 재생 및 내보내기

* ▶ Play
* ⏸ Pause
* 📼 Export

버튼을 통해 결과를 생성할 수 있습니다.

---

# Matching System

| 상태         | 설명     |
| ---------- | ------ |
| 🟢 Exact   | 완전히 일치 |
| 🟡 Partial | 일부 유사  |
| 🔴 None    | 음성 없음  |

---

# Export

> [!WARNING]
> Chrome / Edge 브라우저는 기본적으로 MP4 인코딩을 지원하지 않습니다.
>
> 기본 Export 형식은 `.webm` 입니다.

지원:

* WebM
* WAV
* MP3 (예정)

---

# Memory Optimization

> [!TIP]
> Voxmesh는 대용량 음성팩 대응을 위해 Lazy Loading 방식을 사용합니다.

사용 기술:

* `URL.createObjectURL()`
* `URL.revokeObjectURL()`
* Lazy Loading
* Dynamic Media Allocation

---

# Version System

Voice Pack 이름 기반 버전 비교를 지원할 예정입니다.

예시:

```text
심영 v0.1.0
```

GitHub 최신 버전:

```text
심영 v1.0.3
```

결과:

```text
⚠ 업데이트 필요
```

또는:

```text
✔ 최신 버전입니다
```

---

# Technical Stack

* React
* Vite
* JavaScript
* HTML5 Canvas
* MediaRecorder API
* Web Audio API

---

# Notes

> [!NOTE]
> $`\color{red}\text{이 프로젝트는 밈 제작 도구입니다.}`$

> [!NOTE]
> $`\color{orange}\text{저작권이 있는 음성/영상 클립 사용 시 주의하세요.}`$

> [!TIP]
> $`\color{lime}\text{모든 처리는 로컬 브라우저 내부에서만 수행됩니다.}`$

---

# Roadmap

* [ ] Multi Pack Manager
* [ ] Version Auto Check
* [ ] Native MP4 Rendering
* [ ] Timeline Editor
* [ ] Drag Clip System
* [ ] Subtitle Style Editor
* [ ] Waveform Preview
* [ ] GPU Rendering

---

# License

MIT License

---

# Disclaimer

사용되는 음성 및 영상 클립의 저작권은 원 저작권자에게 있습니다.

Voxmesh는 사용자 로컬 환경에서만 파일을 처리하며 서버 업로드 기능을 제공하지 않습니다.
