import React from "react";
import type { StepKind } from "../../shared/content";
import { color, kindColor, mono, pad2, sans, size, stroke, withAlpha } from "../theme";
import { AgentIcon, HumanIcon, WarnIcon } from "./Icons";

// 두 줄 흐름도의 부품.
//   FlowStep     에이전트·사람 줄에 놓이는 항목 상자
//   ProblemFlag  흐름 중간에 끼어드는 문제 표식(깃발)
//   ResolvedGate 해결을 나타내는 끝 단자
//   LaneLabel    줄 이름
// 좌표는 씬이 정한다. 연결선은 씬이 Trace로 긋는다.

/**
 * " · " 와 ": " 뒤를 먼저 줄이 바뀌는 자리로 삼는다.
 * 글자는 그대로 두고, 구절을 inline-block으로 묶어 구절 사이에서 먼저 줄이 바뀌게 한다.
 */
export const Phrases: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(?<=[·:]) /).map((phrase, i) => (
      <React.Fragment key={i}>
        {i > 0 ? " " : null}
        <span style={{ display: "inline-block" }}>{phrase}</span>
      </React.Fragment>
    ))}
  </>
);

const IndexTab: React.FC<{ index: number; tint: string; side?: "left" | "right" }> = ({
  index,
  tint,
  side = "left",
}) => (
  <div
    style={{
      position: "absolute",
      [side]: 16,
      top: -15,
      height: 28,
      padding: "0 8px",
      display: "flex",
      alignItems: "center",
      backgroundColor: color.bg,
      ...mono(size.label, 700),
      color: tint,
    }}
  >
    {pad2(index)}
  </div>
);

export type Box = { x: number; y: number; w: number; h: number };

export const FlowStep: React.FC<
  Box & {
    kind: Extract<StepKind, "agent" | "human">;
    /** 흐름 안의 순서(1부터). */
    index: number;
    text: string;
  }
> = ({ kind, index, text, x, y, w, h }) => {
  const tint = kindColor[kind];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        border: `${stroke.thin}px solid ${withAlpha(tint, 0.75)}`,
        borderLeft: `5px solid ${tint}`,
        backgroundColor: withAlpha(tint, 0.06),
        display: "flex",
        alignItems: "center",
        padding: "0 20px 0 18px",
      }}
    >
      <IndexTab index={index} tint={tint} />
      <div style={{ ...sans(size.body, 600), lineHeight: "46px" }}>
        <Phrases text={text} />
      </div>
    </div>
  );
};

export const FLAG_HEIGHT = 64;

/**
 * 문제 깃발. 깃대는 깃발의 오른쪽 끝에 서고, 순서 번호도 깃대 쪽에 붙는다.
 * 깃대와 trace 위의 마름모는 씬이 그린다.
 */
export const ProblemFlag: React.FC<{
  index: number;
  text: string;
  x: number;
  y: number;
  w: number;
}> = ({ index, text, x, y, w }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: FLAG_HEIGHT,
      boxSizing: "border-box",
      border: `${stroke.trace}px solid ${color.problem}`,
      backgroundColor: withAlpha(color.problem, 0.1),
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 20px 0 18px",
    }}
  >
    <IndexTab index={index} tint={color.problem} side="right" />
    <WarnIcon size={34} color={color.problem} width={2.5} />
    <div style={{ ...sans(size.body, 700), whiteSpace: "nowrap", color: color.problem }}>{text}</div>
  </div>
);

/** 해결 단자. 두 줄에 걸쳐 서서 흐름을 닫는다. */
export const ResolvedGate: React.FC<Box & { index: number; text: string }> = ({
  index,
  text,
  x,
  y,
  w,
  h,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      boxSizing: "border-box",
      border: `${stroke.trace}px solid ${color.resolved}`,
      backgroundColor: withAlpha(color.resolved, 0.05),
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 18,
      padding: "0 22px",
    }}
  >
    <IndexTab index={index} tint={color.resolved} />
    {/* 문제의 마름모가 풀린 모습: 같은 마름모, 붉은색이 빠지고 확인 표시가 들어간다 */}
    <svg width={60} height={60} viewBox="0 0 60 60" style={{ flex: "none", marginLeft: -4 }}>
      <path d="M30 3 57 30 30 57 3 30Z" fill="none" stroke={color.resolved} strokeWidth={stroke.trace} />
      <path d="M19 30.5 27 38 41.5 22" fill="none" stroke={color.resolved} strokeWidth={stroke.bold} />
    </svg>
    <div style={{ ...sans(size.body, 600), lineHeight: "46px" }}>
      <Phrases text={text} />
    </div>
  </div>
);

export const LaneLabel: React.FC<{
  kind: Extract<StepKind, "agent" | "human">;
  name: string;
  /** 영문 장식 라벨 */
  tag: string;
  x: number;
  /** 줄의 세로 중심 */
  cy: number;
}> = ({ kind, name, tag, x, cy }) => {
  const tint = kindColor[kind];
  const Icon = kind === "agent" ? AgentIcon : HumanIcon;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: cy - 56,
        height: 112,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <Icon size={34} color={tint} />
      <div style={{ ...sans(size.small, 700), lineHeight: "40px", color: tint, whiteSpace: "nowrap" }}>
        {name}
      </div>
      <div style={{ ...mono(size.label, 500), color: color.inkDim }}>{tag}</div>
    </div>
  );
};
