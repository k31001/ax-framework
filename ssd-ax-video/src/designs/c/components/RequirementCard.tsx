// 요구사항 카드(티켓). 진행 표시의 현재 단계 아래에 매달려 이동하고,
// 단계가 끝날 때마다 그 단계의 기록이 아래 줄에 하나씩 붙는다.

import type { CSSProperties } from "react";
import { C, KR, MONO_TXT, R, SHADOW, T } from "../theme";

export type Requirement = {
  id: string;
  title: string;
  criterion: string;
  records: readonly string[];
};

const NumberDot: React.FC<{ n: number; pending?: boolean }> = ({ n, pending }) => (
  <span
    style={{
      ...MONO_TXT,
      width: 28,
      height: 28,
      borderRadius: "50%",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: T.propSm,
      fontWeight: 700,
      lineHeight: 1,
      color: pending ? C.ink3 : "#FFFFFF",
      backgroundColor: pending ? "transparent" : C.ink2,
      border: pending ? `2px dashed ${C.ink4}` : "none",
      flexShrink: 0,
    }}
  >
    {n}
  </span>
);

export const RequirementCard: React.FC<{
  req: Requirement;
  /** 카드 왼쪽 끝에서 잰 꼭지(진행 표시의 현재 점을 가리키는 삼각형) 위치. */
  notchX: number;
  /** 지금 단계의 기록이 붙을 빈 자리를 보여 준다. 값은 단계 번호. */
  pendingSlot?: number;
  style?: CSSProperties;
}> = ({ req, notchX, pendingSlot, style }) => (
  <div
    style={{
      ...KR,
      position: "absolute",
      backgroundColor: C.panel,
      borderRadius: R.lg,
      boxShadow: SHADOW.panel,
      border: `1px solid ${C.lineSoft}`,
      padding: "16px 20px 16px 20px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      ...style,
    }}
  >
    {/* 꼭지 */}
    <div
      style={{
        position: "absolute",
        left: notchX - 10,
        top: -10,
        width: 20,
        height: 20,
        rotate: "45deg",
        backgroundColor: C.panel,
        borderLeft: `1px solid ${C.lineSoft}`,
        borderTop: `1px solid ${C.lineSoft}`,
        borderTopLeftRadius: 4,
      }}
    />
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <span
        style={{
          ...MONO_TXT,
          fontSize: T.label,
          fontWeight: 700,
          color: C.ink,
          backgroundColor: C.sunken,
          borderRadius: R.sm,
          padding: "0 14px",
          height: 48,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        {req.id}
      </span>
      <span style={{ fontSize: T.sub, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", flex: 1 }}>
        {req.title}
      </span>
      <span style={{ fontSize: T.label, fontWeight: 600, color: C.ink2, whiteSpace: "nowrap" }}>
        {req.criterion}
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {req.records.map((r, i) => (
        <span
          key={r}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 46,
            padding: "0 16px 0 9px",
            borderRadius: R.md,
            backgroundColor: C.bg,
            border: `1.5px solid ${C.line}`,
            fontSize: T.label,
            fontWeight: 600,
            color: C.ink2,
            whiteSpace: "nowrap",
            boxSizing: "border-box",
          }}
        >
          <NumberDot n={i + 1} />
          {r}
        </span>
      ))}
      {pendingSlot !== undefined ? (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 46,
            padding: "0 16px 0 9px",
            borderRadius: R.md,
            border: `2px dashed ${C.ink4}`,
            boxSizing: "border-box",
          }}
        >
          <NumberDot n={pendingSlot} pending />
          <span style={{ width: 84, height: 10, borderRadius: 5, backgroundColor: C.sunken }} />
        </span>
      ) : null}
    </div>
  </div>
);
