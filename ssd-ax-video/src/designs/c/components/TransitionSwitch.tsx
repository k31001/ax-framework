// "현재 → 전환 후"를 스위치 하나로 보여 준다.
// 눌린 궤도 위 왼쪽에 "현재"(흐린 글자), 오른쪽에 "전환 후"가 올라온 흰 손잡이로 놓인다.
// 영상에서는 손잡이가 왼쪽 칸에서 오른쪽 칸으로 미끄러지고 상태 점이 켜진다.

import { C, KR, R, SHADOW, T } from "../theme";
import { estimateWidth } from "../text";

export const SWITCH = {
  h: 124,
  pad: 8,
  beforeW: 330,
  thumbPadL: 36,
  thumbPadR: 44,
  dot: 18,
  dotGap: 20,
  radius: R.lg + 8,
} as const;

/** 손잡이(전환 후 칸)의 폭. */
export const thumbWidth = (after: string) =>
  Math.ceil(estimateWidth(after, T.strong, -0.02) * 1.03) + SWITCH.thumbPadL + SWITCH.dot + SWITCH.dotGap + SWITCH.thumbPadR;

/** 스위치 전체의 폭. */
export const switchWidth = (after: string) => SWITCH.pad * 2 + SWITCH.beforeW + thumbWidth(after);

export const TransitionSwitch: React.FC<{
  before: string;
  after: string;
  left: number;
  top: number;
}> = ({ before, after, left, top }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: switchWidth(after),
      height: SWITCH.h,
      boxSizing: "border-box",
      padding: SWITCH.pad,
      borderRadius: SWITCH.radius,
      backgroundColor: C.sunken,
      boxShadow: SHADOW.inset,
      display: "flex",
      alignItems: "stretch",
    }}
  >
    <div
      style={{
        ...KR,
        width: SWITCH.beforeW,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        paddingLeft: 30,
        boxSizing: "border-box",
        fontSize: T.item,
        fontWeight: 500,
        color: "#667189",
        whiteSpace: "nowrap",
      }}
    >
      {before}
    </div>
    <div
      style={{
        ...KR,
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: SWITCH.dotGap,
        paddingLeft: SWITCH.thumbPadL,
        borderRadius: R.lg,
        backgroundColor: C.panel,
        boxShadow: SHADOW.raised,
        fontSize: T.strong,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: C.ink,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: SWITCH.dot,
          height: SWITCH.dot,
          borderRadius: "50%",
          backgroundColor: C.agent,
          boxShadow: `0 0 0 7px ${C.agentSoft}`,
          flexShrink: 0,
        }}
      />
      {after}
    </div>
  </div>
);
