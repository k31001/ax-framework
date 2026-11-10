# 영상 제작 안내 (씬 제작자용)
디자인은 "설계도(Blueprint)" 안이다. 기준 스틸은 `design/a/s3.png`, `s5-4.png`, `s6.png`.

## 파일과 소유
| 경로 | 내용 | 고칠 수 있는가 |
|---|---|---|
| `content.ts`, `timeline.ts` | 모든 문구와 등장 시점(`at`, 초), 씬 순서와 길이 | 아니오. 문제는 보고만 |
| `theme.ts`, `anim.ts`, `components/`, `stage/`, `Main.tsx`, `../Root.tsx` | 공통 | 아니오. 필요한 변경은 요청 |
| `scenes/S1.tsx` … `S9.tsx`, `scenes/S5_1.tsx` … `S5_7.tsx` | 씬 | 맡은 씬만 |
| `scenes/<씬>/` (예: `scenes/s5_4/`) | 그 씬만 쓰는 부품·그림 | 새로 만들어 쓴다 |

S1~S4, S6~S9는 임시 씬(`DraftScene`)이다. 파일을 통째로 다시 만들되 export 이름(`S1` …)은 유지한다. S5-1~S5-7은 `StageScene`이 다 그리므로 씬 파일에서 `PlaceholderIllustration`만 자기 그림으로 바꾼다.
## 규칙
- 문구는 `content.ts`에서만 가져온다. 씬 코드에 한글 문구를 쓰지 않는다(영문 장식 라벨 `STEP 01` 등은 예외).
- 색·글자 크기·선 굵기는 `theme.ts`의 `color`, `size`, `stroke`, `sans()`, `mono()`만 쓴다. 읽는 글자는 `size.small`(30px) 이상.
- 움직임은 `useCurrentFrame()`에서만 계산한다. CSS transition/animation, spring, `Math.random()`은 쓰지 않는다.
- 씬은 `<Sheet id="S3">`로 감싼다. 바탕과 테두리는 그대로 있고, 내용물만 첫 10프레임에 나타나 마지막 8프레임에 사라진다.
- 중요한 요소는 `safe`(x 96~1824, y 72~1008) 안에 둔다. 등장은 12~18프레임, 시차는 3~4프레임.
## anim 도구 (`anim.ts`)
```tsx
const frame = useCurrentFrame();
const p = progress(frame, f(beat.at));                // f(초)→프레임. 14프레임 동안 0→1, 감속(ease.out)
const q = progress(frame, 30, DUR.move, ease.inOut);  // 자리에서 자리로 옮길 때
<div style={{ ...sans(size.head, 700), ...enter(frame, f(c.at)) }} />   // 등장: 투명도 + 12px 이동
<div style={enterExit(frame, f(a.at), f(b.at) - DUR.exit)} />           // 나왔다가 사라짐
<path d={d} pathLength={1} {...draw(progress(frame, 40, DUR.draw))} />  // 선이 그려짐
<Trace pts={[[100, 200], [400, 200], [400, 320]]} at={40} arrow />      // 직각 연결선(스스로 그려짐)
rows.map((row, i) => enter(frame, stagger(f(at), i)))                   // 시차 등장
```
그 밖: `sub`(진행값의 일부 구간), `lerp`, `countUp`, `pulse`, `drawDashed`, `enterSvg`(`<g>`용), `pointOnTrace`(노드가 trace를 따라 이동).
공통 부품(`components/`): `Sheet`, `Trace`·`Via`·`Pad`·`DimLine`, `Caption`, `Title`, `Stat`, `Source`, `Appear`, `StageTrack`, `RequirementCard`, 아이콘.
## StageScene의 그림 (S5-1 ~ S5-7)
```tsx
export const S5_4: React.FC = () => <StageScene stage={S5[3]} Illustration={MyIllustration} />;
const MyIllustration: Illustration = ({ width, height, beats, frames, card }) => { … };
```
그림은 (0,0)~(width,height) 안에 그린다. 프레임은 씬 시작 기준이다. `IllustrationProps`(`stage/StageScene.tsx`):
- `width`, `height`, `origin`(그림 자리의 화면 좌표), `stage`, `card`(요구사항 카드의 `rect`와 기록 슬롯 7칸의 중심)
- `beats[]`: `kind`, `text`, `frame`(등장), `index`(흐름도 번호), `rect`(항목의 사각형. 문제는 마름모이고 깃발은 `flag`)
- `frames`: `before`, `flowStart`, `problem`, `resolved`, `record`, `principle`, `note`, `closing`, `end`
- `rect`·`flag`·`card`는 그림 자리의 왼쪽 위를 (0,0)으로 한 좌표다. 흐름도 항목이나 카드로 선을 이을 수 있다.
- 항목은 `frame`부터 16프레임 동안 자리 잡는다. "현재" 한 줄은 `frames.flowStart`까지 흐름도 자리(그림 자리 밖)에 크게 떠 있다.
- 배치는 `stage/layout.ts`에 있다. 진행 표시의 닫히는 고리(S5-7)와 폐루프 점선(S5-4)은 StageScene이 그린다.

| 단계 | 그림 자리 (x, y, 폭×높이) | 위치 |
|---|---|---|
| S5-1 | 784, 392, 1040×616 | 오른쪽 넓게 |
| S5-2 | 1144, 392, 680×616 | 오른쪽 |
| S5-3 | 1248, 392, 576×616 | 오른쪽 (원칙 띠는 왼쪽 아래에만 놓인다) |
| S5-4 | 804, 392, 1020×120 | 흐름도 위쪽 띠, 깃발 오른쪽 (승인 스틸의 점 묶음·파형 자리) |
| S5-5 | 812, 400, 1012×280 | 흐름도 위쪽 띠, 깃발 오른쪽 |
| S5-6 | 1162, 392, 662×616 | 오른쪽 |
| S5-7 | 1288, 392, 536×616 | 오른쪽 |
## 확인
```bash
npx tsc --noEmit -p .
npx remotion still S5-4 out/check/s54.png --frame=500 --scale=0.5 --log=error --bundle-cache=false  # 한 프레임
npx remotion render S5-4 out/check/s54.mp4 --scale=0.5 --log=error --bundle-cache=false             # 씬 하나
```
`--bundle-cache=false`를 빼면 여러 명이 동시에 렌더할 때 번들 캐시가 충돌해 실패한다. 미리보기는 `npm run dev`.
