// 원칙 표식. 원칙 이름과, 있으면 근거 수치(from → to)와 출처를 함께 보여 준다.
// 영상에서는 수치가 from에서 to로 올라가고 막대가 따라 찬다.

import type { CSSProperties } from "react";
import { C, KR, R, SHADOW, T } from "../theme";
import { ArrowIcon, LoopIcon } from "./Icons";

export type Principle = {
  name: string;
  stat?: string;
  from?: string;
  to?: string;
  source?: string;
};

const pct = (s: string | undefined) => (s ? Math.max(0, Math.min(100, parseFloat(s))) : 0);

export const PrincipleBadge: React.FC<{
  principle: Principle;
  icon?: React.ReactNode;
  style?: CSSProperties;
}> = ({ principle, icon, style }) => {
  const from = pct(principle.from);
  const to = pct(principle.to);
  return (
    <div
      style={{
        ...KR,
        position: "absolute",
        backgroundColor: C.panel,
        borderRadius: R.lg,
        boxShadow: SHADOW.panel,
        border: `1px solid ${C.lineSoft}`,
        boxSizing: "border-box",
        padding: "0 28px 0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        ...style,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 12,
            height: 60,
            padding: "0 20px 0 14px",
            borderRadius: R.md,
            backgroundColor: C.ink,
            color: "#FFFFFF",
            fontSize: T.item,
            fontWeight: 800,
            whiteSpace: "nowrap",
            marginBottom: 4,
          }}
        >
          {icon ?? <LoopIcon size={34} color="#A9A0FF" stroke={2.6} />}
          {principle.name}
        </div>
        {principle.stat ? (
          <div style={{ fontSize: T.label, lineHeight: "38px", fontWeight: 600, color: C.ink2, whiteSpace: "nowrap" }}>
            {principle.stat}
          </div>
        ) : null}
        {principle.source ? (
          <div style={{ fontSize: T.label, lineHeight: "38px", fontWeight: 500, color: C.ink3, whiteSpace: "nowrap" }}>
            {principle.source}
          </div>
        ) : null}
      </div>
      {principle.from && principle.to ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "stretch" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: T.strong, fontWeight: 700, color: C.ink3, letterSpacing: "-0.02em" }}>
              {principle.from}
            </span>
            <ArrowIcon size={42} color={C.ink3} stroke={2.8} style={{ alignSelf: "center", marginTop: 10 }} />
            <span style={{ fontSize: 80, lineHeight: "84px", fontWeight: 800, color: C.resolvedInk, letterSpacing: "-0.03em" }}>
              {principle.to}
            </span>
          </div>
          {/* 작은 막대: 눈금(from)과 채움(to) */}
          <div style={{ position: "relative", height: 12, borderRadius: 6, backgroundColor: C.sunken }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${to}%`,
                borderRadius: 6,
                backgroundColor: C.resolved,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${from}%`,
                top: -5,
                width: 4,
                height: 22,
                marginLeft: -2,
                borderRadius: 2,
                backgroundColor: C.ink,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
