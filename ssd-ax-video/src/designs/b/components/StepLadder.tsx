import type { CSSProperties, FC } from "react";
import {
  COLOR,
  RULE,
  SIZE,
  WEIGHT,
  pad2,
  sans,
  topForBaseline,
} from "../theme";

// 단의 재질. 흐름도와 같은 약속을 쓴다: 테두리=사람의 일, 청록 면=에이전트, 주홍 면=핵심.
export type StepTone = "outline" | "teal" | "vermilion";

const toneStyle: Record<StepTone, CSSProperties> = {
  outline: {
    border: `${RULE.mid}px solid ${COLOR.ink}`,
    backgroundColor: COLOR.paper,
    color: COLOR.ink,
  },
  teal: { backgroundColor: COLOR.teal, color: COLOR.paper },
  vermilion: { backgroundColor: COLOR.vermilion, color: COLOR.paper },
};

type StepLadderProps = {
  labels: readonly string[];
  tones: readonly StepTone[];
  /** "현재" 표시가 붙는 단 */
  nowIndex: number;
  nowLabel: string;
  /** 각 단의 왼쪽 x. 마지막 값은 계단의 오른쪽 끝이다(단 수 + 1개). */
  edges: readonly number[];
  /** 계단 바닥의 y */
  bottom: number;
  /** 첫 단의 높이 */
  baseHeight: number;
  /** 한 단 오를 때마다 더해지는 높이 */
  rise: number;
};

const NUMERAL = 132;
const NOW_TAB_H = 62;

// 오른쪽으로 올라가는 계단. 단마다 큰 번호가 디딤판 위에 서고, 이름은 단 안에 놓인다.
// 영상에서는 단이 아래에서 밀고 올라와 멈추고, 번호가 디딤판 뒤에서 올라온다.
export const StepLadder: FC<StepLadderProps> = ({
  labels,
  tones,
  nowIndex,
  nowLabel,
  edges,
  bottom,
  baseHeight,
  rise,
}) => {
  return (
    <>
      {labels.map((label, i) => {
        const h = baseHeight + rise * i;
        const left = edges[i];
        const stepW = edges[i + 1] - left;
        const top = bottom - h;
        const tone = tones[i] ?? "outline";
        return (
          <div key={label}>
            {/* 디딤판 위에 서는 번호 */}
            <div
              style={{
                position: "absolute",
                left: left + 22,
                top: topForBaseline(top - 16, NUMERAL),
                ...sans(NUMERAL, WEIGHT.thin, { lineHeight: 1 }),
                color: COLOR.ink,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {pad2(i + 1)}
            </div>
            {/* "현재" 표시: 디딤판에 붙은 먹색 꼬리표 */}
            {i === nowIndex ? (
              <div
                style={{
                  position: "absolute",
                  left: left + 176,
                  top: top - NOW_TAB_H,
                  height: NOW_TAB_H,
                  padding: "0 20px",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: COLOR.ink,
                  color: COLOR.paper,
                  ...sans(SIZE.body, WEIGHT.heavy, { lineHeight: 1 }),
                }}
              >
                {nowLabel}
              </div>
            ) : null}
            {/* 단 */}
            <div
              style={{
                position: "absolute",
                left,
                top,
                width: stepW,
                height: h,
                boxSizing: "border-box",
                padding: "30px 32px",
                ...toneStyle[tone],
                ...sans(SIZE.lead + 4, WEIGHT.heavy, {
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                }),
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </>
  );
};
