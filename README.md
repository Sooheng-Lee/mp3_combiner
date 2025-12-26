# 🎵 MP3 Combiner

여러 개의 음성 파일을 하나로 합치는 웹 애플리케이션입니다.

![MP3 Combiner Screenshot](docs/screenshot.png)

## ✨ 주요 기능

### 📁 파일 업로드
- **다중 파일 업로드**: 여러 파일을 한 번에 선택하거나 드래그 앤 드롭으로 업로드
- **지원 형식**: MP3, WAV, OGG, M4A, FLAC
- **파일 제한**: 최대 20개 파일, 개별 50MB, 총 200MB

### 📋 파일 관리
- 드래그로 파일 순서 변경
- 개별 파일 미리듣기
- 개별/전체 파일 삭제

### 🔗 파일 병합
- 클라이언트 사이드 처리 (서버 업로드 없음)
- 출력 형식 선택: MP3, WAV
- 품질 설정: 128kbps, 192kbps, 320kbps
- 파일 간 간격(무음) 설정: 0~5초

### 🎧 결과물 재생 및 다운로드
- 웹 브라우저에서 바로 재생
- 재생/일시정지, 시크바, 볼륨 조절
- 원클릭 다운로드

## 🚀 시작하기

### 방법 1: 로컬에서 직접 실행

1. 프로젝트를 다운로드하거나 클론합니다:
   ```bash
   git clone https://github.com/your-username/mp3-combiner.git
   cd mp3-combiner
   ```

2. `index.html` 파일을 웹 브라우저에서 엽니다:
   - 파일 탐색기에서 `index.html`을 더블클릭
   - 또는 브라우저 주소창에 파일 경로 입력: `file:///path/to/mp3-combiner/index.html`

### 방법 2: 로컬 서버로 실행 (권장)

Python이 설치되어 있다면:
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

Node.js가 설치되어 있다면:
```bash
npx serve
```

브라우저에서 `http://localhost:8080` 접속

## 📖 사용 방법

### 1단계: 파일 업로드
- 드롭존을 클릭하여 파일 선택 대화상자를 열거나
- 파일을 드래그하여 드롭존에 놓습니다

### 2단계: 파일 정렬 및 옵션 설정
- 파일 목록에서 드래그하여 원하는 순서로 정렬
- 개별 파일 옆 🔊 버튼으로 미리듣기
- 출력 형식, 품질, 파일 간 간격 설정

### 3단계: 파일 병합
- "🔗 파일 합치기" 버튼 클릭
- 진행률을 확인하며 완료될 때까지 대기

### 4단계: 결과 확인 및 다운로드
- 병합된 파일을 재생하여 확인
- "📥 다운로드" 버튼으로 파일 저장
- "🔄 새로 시작"으로 처음부터 다시 시작

## 🛠 기술 스택

- **HTML5**: 마크업
- **CSS3**: 스타일링 (Flexbox, Grid, CSS Variables)
- **JavaScript (ES6+)**: 애플리케이션 로직
- **Web Audio API**: 오디오 처리 및 병합
- **SortableJS**: 드래그 앤 드롭 정렬

## 📁 프로젝트 구조

```
mp3_combiner/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css           # 스타일시트
├── js/
│   ├── app.js              # 메인 애플리케이션 로직
│   └── audio-processor.js  # 오디오 처리 모듈
├── docs/
│   └── PRD.md              # 제품 요구사항 문서
├── README.md               # 이 파일
└── .gitignore              # Git 제외 파일 목록
```

## 🌐 브라우저 지원

| 브라우저 | 지원 버전 |
|---------|----------|
| Chrome | 최신 버전 |
| Firefox | 최신 버전 |
| Safari | 최신 버전 |
| Edge | 최신 버전 |

## ⚠️ 알려진 제한사항

- 대용량 파일 처리 시 브라우저 메모리 제한이 있을 수 있습니다
- MP3 인코딩은 lamejs 라이브러리가 필요합니다 (미설치 시 WAV로 출력)
- 모바일 브라우저에서 자동 재생이 제한될 수 있습니다

## 🔒 개인정보 보호

- 모든 처리는 브라우저에서 로컬로 수행됩니다
- 파일이 서버에 업로드되지 않습니다
- 인터넷 연결 없이도 사용 가능합니다

## 📄 라이선스

MIT License

## 🤝 기여하기

1. 이 저장소를 Fork 합니다
2. 새 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📞 문의

문제가 발생하거나 제안사항이 있으시면 [Issues](https://github.com/your-username/mp3-combiner/issues)에 등록해 주세요.
