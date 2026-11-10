import React from "react";
import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enterExit, progress, stagger } from "../anim";
import type { EnterOptions } from "../anim";
import { color, mono, sans, size, stroke } from "../theme";

// S1~S4, S6~S9 에서 쓰는 글자 부품.
//   Appear   아무 내용이나 감싸 at 프레임에 등장(선택적으로 out 프레임에 퇴장)시킨다
//   Caption  자막 한 줄
//   Title    큰 제목 (+ 위쪽 영문 장식 라벨)
//   Stat     수치 강조 블록 (큰 수치 + 설명 + 출처)
//   Source   출처 표기
// 자리는 x, y 와 align 으로 정한다. align 은 x 가 글자의 왼쪽 끝/가운데/오른쪽 끝 중 어디인지다.
// 문구는 content.ts 에서 가져와 text 로 넘긴다.

export type Align = "left" | "center" | "right";

const SPAN = 2400; // 정렬용 가상 폭. 화면보다 넓으면 된다.

const anchor = (x: number, y: number, align: Align): CSSProperties => ({
  position: "absolute",
  top: y,
  left: align === "left" ? x : align === "center" ? x - SPAN / 2 : x - SPAN,
  width: SPAN,
  display: "flex",
  flexDirection: "column",
  alignItems: align === "left" ? "flex-start" : align === "center" ? "center" : "flex-end",
  textAlign: align,
});

/** 내용을 감싸 at 프레임에 등장시키고, out 이 있으면 그 프레임에 퇴장시킨다. */
export const Appear: React.FC<
  {
    at: number;
    out?: number;
    style?: CSSProperties;
    children: React.ReactNode;
  } & EnterOptions
> = ({ at, out, style, children, ...options }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return <div style={{ ...style, ...enterExit(frame, at, out, options) }}>{children}</div>;
};

type Placed = {
  x: number;
  /** 글자 블록의 위쪽 y */
  y: number;
  align?: Align;
  /** 등장 프레임 */
  at: number;
  /** 퇴장 프레임. 없으면 씬 끝까지 남는다. */
  out?: number;
};

/** 자막 한 줄. 한 번에 문구 하나만 보이게 하려면 다음 자막의 at 직전을 out 으로 준다. */
export const Caption: React.FC<
  Placed & {
    text: string;
    /** 글자 크기. 기본 size.head */
    px?: number;
    weight?: number;
    color?: string;
  }
> = ({ text, x, y, align = "center", at, out, px = size.head, weight = 700, color: c = color.ink }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={anchor(x, y, align)}>
      <div style={{ ...sans(px, weight), color: c, whiteSpace: "nowrap", ...enterExit(frame, at, out) }}>{text}</div>
    </div>
  );
};

/** 큰 제목. label 은 제목 위에 놓이는 영문 장식 라벨(선택)이다. */
export const Title: React.FC<
  Placed & {
    text: string;
    label?: string;
    px?: number;
    weight?: number;
    color?: string;
  }
> = ({ text, label, x, y, align = "left", at, out, px = size.display, weight = 800, color: c = color.ink }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={anchor(x, y, align)}>
      {label ? (
        <div style={{ ...mono(size.label, 700), color: color.agent, marginBottom: 8, ...enterExit(frame, at, out, { distance: 0 }) }}>
          {label}
        </div>
      ) : null}
      <div
        style={{
          ...sans(px, weight),
          lineHeight: 1.15,
          color: c,
          whiteSpace: "nowrap",
          ...enterExit(frame, at + (label ? 3 : 0), out, { distance: 16, duration: 16 }),
        }}
      >
        {text}
      </div>
    </div>
  );
};

const SourceTag: React.FC<{ text: string; style?: CSSProperties }> = ({ text, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, ...style }}>
    <div
      style={{
        ...mono(size.label, 500),
        color: color.inkDim,
        padding: "2px 8px",
        border: `${stroke.hair}px solid ${color.lineStrong}`,
      }}
    >
      SOURCE
    </div>
    <div style={{ ...sans(size.small, 500), color: color.inkDim, whiteSpace: "nowrap" }}>{text}</div>
  </div>
);

/** 출처 표기: 영문 장식 라벨 "SOURCE" 와 출처 글자. */
export const Source: React.FC<Placed & { text: string }> = ({ text, x, y, align = "left", at, out }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={anchor(x, y, align)}>
      <SourceTag text={text} style={enterExit(frame, at, out, { distance: 8 })} />
    </div>
  );
};

/**
 * 수치 강조 블록: 큰 수치, 그 아래 설명 한 줄, 출처.
 * 수치 왼쪽에 치수선 모양의 세로선이 그려진다.
 */
export const Stat: React.FC<
  Placed & {
    /** 크게 보여 줄 수치. 예: "60~70%" */
    value: string;
    /** 수치를 설명하는 문구 */
    text?: string;
    source?: string;
    /** 수치의 색. 기본 청록 */
    color?: string;
    /** 수치의 글자 크기. 기본 size.display */
    px?: number;
  }
> = ({ value, text, source, x, y, align = "left", at, out, color: c = color.agent, px = size.display }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const bar = progress(frame, at, DUR.draw, ease.out);
  const gone = out === undefined ? 1 : 1 - progress(frame, out, DUR.exit, ease.in);
  return (
    <div style={anchor(x, y, align)}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 28 }}>
        {/* 치수선 */}
        <div style={{ position: "relative", width: 18, opacity: gone }}>
          <div
            style={{
              position: "absolute",
              left: 8,
              top: `${50 - 50 * bar}%`,
              height: `${100 * bar}%`,
              borderLeft: `${stroke.thin}px solid ${color.lineStrong}`,
            }}
          />
          <div style={{ position: "absolute", left: 0, top: 0, width: 18, borderTop: `${stroke.thin}px solid ${color.lineStrong}`, opacity: bar }} />
          <div style={{ position: "absolute", left: 0, bottom: 0, width: 18, borderTop: `${stroke.thin}px solid ${color.lineStrong}`, opacity: bar }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", gap: 10 }}>
          <div style={{ ...mono(px, 700), lineHeight: 1, color: c, ...enterExit(frame, at, out, { distance: 16, duration: 16 }) }}>
            {value}
          </div>
          {text ? (
            <div style={{ ...sans(size.sub, 600), whiteSpace: "nowrap", ...enterExit(frame, stagger(at, 1, 5), out) }}>
              {text}
            </div>
          ) : null}
          {source ? <SourceTag text={source} style={enterExit(frame, stagger(at, 2, 5), out, { distance: 8 })} /> : null}
        </div>
      </div>
    </div>
  );
};
