// 상태 뱃지. 읽는 문구용(md, 30px)과 소품용(sm, 20px mono) 두 크기.

import type { CSSProperties } from "react";
import { C, KR, MONO_TXT, R, ROLE, T, type Tone } from "../theme";

const toneColors = (tone: Tone, solid: boolean) => {
  if (tone === "dark") return { bg: C.ink, fg: "#FFFFFF", dot: "#FFFFFF", border: C.ink };
  if (tone === "neutral") {
    return solid
      ? { bg: C.ink3, fg: "#FFFFFF", dot: "#FFFFFF", border: C.ink3 }
      : { bg: C.sunken, fg: C.ink2, dot: C.ink3, border: C.line };
  }
  const r = ROLE[tone];
  return solid
    ? { bg: r.main, fg: "#FFFFFF", dot: "#FFFFFF", border: r.main }
    : { bg: r.soft, fg: r.ink, dot: r.main, border: "transparent" };
};

export const Badge: React.FC<{
  tone?: Tone;
  size?: "sm" | "md";
  solid?: boolean;
  dot?: boolean;
  mono?: boolean;
  children: React.ReactNode;
  style?: CSSProperties;
}> = ({ tone = "neutral", size = "md", solid = false, dot = false, mono = false, children, style }) => {
  const c = toneColors(tone, solid);
  const md = size === "md";
  return (
    <span
      style={{
        ...(mono ? MONO_TXT : KR),
        display: "inline-flex",
        alignItems: "center",
        gap: md ? 10 : 7,
        height: md ? 46 : 30,
        padding: md ? "0 16px" : "0 10px",
        borderRadius: md ? R.md : R.sm,
        backgroundColor: c.bg,
        color: c.fg,
        border: `1.5px solid ${c.border}`,
        fontSize: md ? T.label : T.propSm,
        fontWeight: md ? 700 : 500,
        lineHeight: 1,
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{
            width: md ? 12 : 8,
            height: md ? 12 : 8,
            borderRadius: "50%",
            backgroundColor: c.dot,
          }}
        />
      ) : null}
      {children}
    </span>
  );
};
