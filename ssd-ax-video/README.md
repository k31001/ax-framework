# SSD 컨트롤러 SoC AX 전략 영상

SSD 컨트롤러 SoC를 설계·검증하는 팀의 AI Transformation(AX) 전략과, 그 전략을 소개하는 4분 50초짜리 모션그래픽 영상(한국어 나레이션 포함)의 소스다. 영상은 [Remotion](https://www.remotion.dev)으로 만든다.

완성본은 `video/ssd-ax-strategy.mp4` 에 있다(1920×1080, 30fps, 나레이션·배경음악 포함).

## 문서

| 파일 | 내용 |
|---|---|
| `docs/01-strategy.md` | 전략 제안서 |
| `docs/02-storyboard.md` | 영상 대본·스토리보드 |
| `docs/03-workflow-case.md` | 요구사항 하나가 스펙에서 퀄까지 가는 사례 (영상 S4~S5의 원본) |
| `docs/04-narration.md` | 나레이션 대본과 만드는 법 |
| `docs/research/` | 도메인별 리서치 4건 (출처 URL과 확인 수준 표기) |

## 구조

| 경로 | 내용 |
|---|---|
| `src/video/content.ts` | 영상의 모든 문구와 등장 시점 |
| `src/video/timeline.ts` | 씬 순서와 길이 (15개 씬, 290초) |
| `src/video/narration.ts` | 문장별 나레이션 시작 시점 (`audio/retime.py` 가 만든다) |
| `src/video/theme.ts`, `anim.ts`, `components/` | 공통 테마, 애니메이션 도구, 공통 부품 |
| `src/video/stage/` | 사례 7단계(S5-1~S5-7)의 공통 씬 틀 |
| `src/video/scenes/` | 씬별 코드 |
| `src/video/README.md` | 씬을 고칠 때의 규칙과 확인 명령 |
| `audio/make_bgm.py` | 배경음악 합성 스크립트 (numpy) |
| `public/audio/bgm.mp3` | 배경음악 |
| `audio/narration.py`, `audio/retime.py` | 나레이션 합성(ElevenLabs), 나레이션 길이에 맞춘 시점 재배치 |
| `public/audio/narration/` | 문장별 나레이션 음성 |
| `design/`, `src/designs/` | 디자인 안 세 가지의 스틸과 코드. 영상은 A안(설계도)으로 만들었다 |

## 실행

```bash
npm install
npm run dev                                   # Remotion Studio 미리보기
npx remotion render Main out/main.mp4         # 전체 렌더
npx remotion render S5-4 out/s5-4.mp4         # 씬 하나만 렌더
npm run lint                                  # eslint + tsc
python3 audio/narration.py                    # 나레이션 음성 만들기 (ElevenLabs API 키 필요)
python3 audio/retime.py                       # 나레이션 길이에 맞춰 시점·씬 길이 재배치
python3 audio/make_bgm.py                     # 배경음악 다시 만들기
```

문구를 바꾸려면 `src/video/content.ts` 를, 씬 길이를 바꾸려면 `src/video/timeline.ts` 를 고친다. 씬 길이를 바꾸면 `audio/make_bgm.py` 위쪽의 구간 표도 함께 고쳐 음악을 다시 만들어야 한다.

## 폰트

`public/fonts/` 에 들어 있는 폰트는 둘 다 SIL Open Font License 1.1이다.

- Pretendard (한글·영문 본문)
- JetBrains Mono (코드·기술 표기)
