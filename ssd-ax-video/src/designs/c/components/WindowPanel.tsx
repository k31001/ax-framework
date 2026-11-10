// 창 머리줄이 있는 패널. 이 안의 기본 모티프다.
// 머리줄의 글자는 소품(mono 20~22px)이고, 읽는 문구는 children으로 넣는다.

import type { CSSProperties } from "react";
import { C, MONO_TXT, R, SHADOW, T } from "../theme";
import { WindowGlyph } from "./Icons";

export const WINDOW_HEAD = 42;

export const WindowPanel: React.FC<{
  title?: string;
  /** 머리줄 오른쪽에 붙는 뱃지 등. */
  right?: React.ReactNode;
  /** 머리줄 왼쪽 표식의 색. 창의 성격(에이전트 창, 문제 창)을 좁은 면적으로 알린다. */
  accent?: string;
  elevation?: keyof typeof SHADOW;
  headHeight?: number;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  children?: React.ReactNode;
}> = ({ title, right, accent = C.ink3, elevation = "panel", headHeight = WINDOW_HEAD, style, bodyStyle, children }) => (
  <div
    style={{
      position: "absolute",
      backgroundColor: C.panel,
      borderRadius: R.lg,
      boxShadow: SHADOW[elevation],
      border: `1px solid ${C.lineSoft}`,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    {title !== undefined ? (
      <div
        style={{
          height: headHeight,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px 0 16px",
          borderBottom: `1px solid ${C.lineSoft}`,
          backgroundColor: "#FBFCFE",
        }}
      >
        <WindowGlyph color={accent} />
        <span
          style={{
            ...MONO_TXT,
            fontSize: T.propSm,
            fontWeight: 500,
            color: C.ink3,
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {title}
        </span>
        {right}
      </div>
    ) : null}
    <div style={{ position: "relative", flex: 1, ...bodyStyle }}>{children}</div>
  </div>
);
