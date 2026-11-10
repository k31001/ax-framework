# SSD 컨트롤러 SoC AX 전략 영상

SSD 컨트롤러 SoC를 설계·검증하는 팀의 AI Transformation(AX) 전략과, 그 전략을 소개하는 약 3분짜리 모션그래픽 영상의 소스다. 영상은 [Remotion](https://www.remotion.dev)으로 만든다.

## 문서

| 파일 | 내용 |
|---|---|
| `docs/01-strategy.md` | 전략 제안서 |
| `docs/02-storyboard.md` | 영상 대본·스토리보드 |
| `docs/research/` | 도메인별 리서치 4건 (출처 URL과 확인 수준 표기) |

## 실행

```bash
npm install
npm run dev              # Remotion Studio 미리보기
npx remotion render      # MP4 렌더
```

## 폰트

`public/fonts/` 에 들어 있는 폰트는 둘 다 SIL Open Font License 1.1이다.

- Pretendard (한글·영문 본문)
- JetBrains Mono (코드·기술 표기)
