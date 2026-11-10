import React from "react";
import { useCurrentFrame } from "remotion";
import { draw, ease, progress, pulse, sub } from "../anim";
import type { FlowKind } from "../theme";
import { color, fullSvg, kindColor, mono, pad2, safe, sans, size, stroke, withAlpha } from "../theme";
import { AgentIcon, HumanIcon, WarnIcon } from "./Icons";
import { Trace } from "./Trace";
import type { Pt } from "./Trace";

// 두 줄 흐름도.
//   위 줄 = 에이전트, 아래 줄 = 사람. 일이 일어나는 순서대로 항목이 나타나고,
//   직전 항목에서 연결선이 그려진 뒤 항목이 자리 잡는다.
//   problem  흐름 위의 붉은 마름모 + 깃대 + 깃발
//   resolved 두 줄에 걸쳐 서는 끝 단자. 마름모에서 붉은색이 빠지고 확인 표시가 들어간다.
//
// 좌표는 글자 폭을 재지 않고 배치 설정(FlowSlot)으로 정한다. 글자는 상자 안에서 두 줄까지 놓인다.

export type Box = { x: number; y: number; w: number; h: number };

/** 줄과 바탕의 자리 */
export type FlowGeometry = {
  /** 에이전트 줄 상자의 위쪽 y */
  agentY: number;
  /** 사람 줄 상자의 위쪽 y */
  humanY: number;
  rowH: number;
  /** 줄 바탕의 위·아래 */
  top: number;
  bottom: number;
  /** 줄 바탕의 왼쪽 (줄 이름이 놓이는 쪽) */
  left: number;
  /** 두 줄 바탕의 오른쪽 끝 */
  right: number;
  /** 에이전트 줄 위쪽 띠(깃발이 놓이는 곳)의 오른쪽 끝 */
  stripRight: number;
  /** 문제 깃발의 위쪽 y */
  flagY: number;
};

/** 항목 하나의 자리. 줄(y)은 종류에서 정해지고, 열(x)과 폭(w)만 적는다. */
/** 줄이 바뀌는 자리: 새 줄이 시작하는 낱말의 순서(0부터). 세 줄이면 [3, 6] 처럼 둘을 적는다. */
export type Breaks = number | readonly number[];

/** 항목 하나의 자리. 줄(y)은 종류에서 정해지고, 열(x)과 폭(w)만 적는다. */
export type FlowSlot =
  | {
      type: "step";
      x: number;
      w: number;
      /** 없으면 한 줄로 놓는다. 상자에는 두 줄까지 들어간다. */
      br?: Breaks;
    }
  | {
      type: "problem";
      /** 마름모 중심의 x. 깃대가 이 자리에 선다. */
      x: number;
      /** 마름모가 놓이는 줄. 기본은 에이전트 줄 */
      lane?: "agent" | "human";
      flag: { x: number; w: number };
    }
  | {
      type: "gate";
      x: number;
      w: number;
      /** 없으면 " · " 뒤에서 먼저 바뀌도록 자동으로 줄을 나눈다. 단자에는 서너 줄까지 들어간다. */
      br?: Breaks;
    };

export type FlowItem = {
  kind: FlowKind;
  text: string;
  /** 등장 프레임 */
  at: number;
  slot: FlowSlot;
};

export const FLAG_HEIGHT = 64;
export const DIAMOND = 28;
/** 항목 하나가 자리 잡는 데 걸리는 프레임 */
export const ITEM_ENTER = 16;
/** 연결선은 항목보다 이만큼 먼저 그려지기 시작한다 */
export const LINK_LEAD = 8;
const LINK_DRAW = 12;

const rowY = (g: FlowGeometry, lane: "agent" | "human"): number => (lane === "agent" ? g.agentY : g.humanY);

/** 항목이 차지하는 사각형. 문제는 마름모가 들어가는 정사각형이다. */
export const flowRect = (g: FlowGeometry, item: Pick<FlowItem, "kind" | "slot">): Box => {
  const slot = item.slot;
  if (slot.type === "problem") {
    const cy = rowY(g, slot.lane ?? "agent") + g.rowH / 2;
    return { x: slot.x - DIAMOND, y: cy - DIAMOND, w: DIAMOND * 2, h: DIAMOND * 2 };
  }
  if (slot.type === "gate") {
    return { x: slot.x, y: g.agentY, w: slot.w, h: g.humanY + g.rowH - g.agentY };
  }
  return { x: slot.x, y: rowY(g, item.kind === "human" ? "human" : "agent"), w: slot.w, h: g.rowH };
};

/** 문제 깃발이 차지하는 사각형 */
export const flagRect = (g: FlowGeometry, slot: Extract<FlowSlot, { type: "problem" }>): Box => ({
  x: slot.flag.x,
  y: g.flagY,
  w: slot.flag.w,
  h: FLAG_HEIGHT,
});

const midY = (b: Box): number => b.y + b.h / 2;

/** 앞 항목에서 뒤 항목으로 가는 직각 연결선의 꼭짓점 */
export const routeLink = (a: Box, b: Box, intoStep: boolean): Pt[] => {
  const sameRow = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0;
  if (sameRow && b.x >= a.x + a.w) {
    const y = a.h <= b.h ? midY(a) : midY(b);
    return [
      [a.x + a.w, y],
      [b.x, y],
    ];
  }
  const down = midY(b) > midY(a);
  const from = down ? a.y + a.h : a.y;
  const to = down ? b.y : b.y + b.h;
  const o0 = Math.max(a.x, b.x);
  const o1 = Math.min(a.x + a.w, b.x + b.w);
  if (o1 - o0 >= 40) {
    let x = (o0 + o1) / 2;
    // 아래 상자의 번호표(왼쪽 위)를 피한다.
    if (down && intoStep) x = Math.max(o0 + 16, Math.min(Math.max(x, b.x + 84), o1 - 16));
    return [
      [x, from],
      [x, to],
    ];
  }
  // 가로로 겹치지 않으면 옆으로 나갔다가 꺾어 들어간다.
  const x = b.x + Math.min(60, b.w / 2);
  return [
    [a.x + a.w, midY(a)],
    [x, midY(a)],
    [x, to],
  ];
};

// ── 글자 ───────────────────────────────────────────────────────────────
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

/** 낱말 순서 br 에서 줄을 나눈다. br 이 없으면 한 줄. 줄마다 줄바꿈 없이 놓인다. */
export const Lines: React.FC<{ text: string; br?: Breaks }> = ({ text, br }) => {
  if (br === undefined) return <span style={{ whiteSpace: "nowrap" }}>{text}</span>;
  const words = text.split(" ");
  const cuts = [0, ...(typeof br === "number" ? [br] : br), words.length];
  return (
    <>
      {cuts.slice(0, -1).map((from, i) => (
        <span key={i} style={{ display: "block", whiteSpace: "nowrap" }}>
          {words.slice(from, cuts[i + 1]).join(" ")}
        </span>
      ))}
    </>
  );
};

// ── 부품 ───────────────────────────────────────────────────────────────
const IndexTab: React.FC<{ index: number; tint: string; side?: "left" | "right"; p: number }> = ({
  index,
  tint,
  side = "left",
  p,
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
      opacity: p,
    }}
  >
    {pad2(index)}
  </div>
);

/** 상자 테두리: 왼쪽 위에서 시작해 한 바퀴 그려진다. */
const Outline: React.FC<{ w: number; h: number; tint: string; width: number; p: number }> = ({
  w,
  h,
  tint,
  width,
  p,
}) => {
  const inset = width / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <rect
        x={inset}
        y={inset}
        width={w - width}
        height={h - width}
        fill="none"
        stroke={tint}
        strokeWidth={width}
        {...(p < 1 ? draw(p, 2 * (w + h)) : {})}
      />
    </svg>
  );
};

/** 에이전트·사람 줄에 놓이는 항목 상자. p 는 등장 진행값 0~1. */
export const FlowStep: React.FC<
  Box & {
    kind: "agent" | "human";
    /** 흐름 안의 순서(1부터) */
    index: number;
    text: string;
    br?: Breaks;
    p?: number;
  }
> = ({ kind, index, text, br, x, y, w, h, p = 1 }) => {
  if (p <= 0) return null;
  const tint = kindColor[kind];
  const bar = sub(p, 0, 0.5);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: withAlpha(tint, 0.06), opacity: sub(p, 0.2, 0.8) }} />
      <Outline w={w} h={h} tint={withAlpha(tint, 0.75)} width={stroke.thin} p={sub(p, 0, 0.8)} />
      {/* 왼쪽 굵은 띠: 가운데에서 위아래로 자란다 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: (h * (1 - bar)) / 2,
          width: 5,
          height: h * bar,
          backgroundColor: tint,
        }}
      />
      <IndexTab index={index} tint={tint} p={sub(p, 0.3, 0.7)} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 20px 0 23px",
        }}
      >
        <div
          style={{
            ...sans(size.body, 600),
            lineHeight: "46px",
            opacity: sub(p, 0.3, 1),
            translate: `${(1 - sub(p, 0.3, 1)) * 10}px 0px`,
          }}
        >
          <Lines text={text} br={br} />
        </div>
      </div>
    </div>
  );
};

/**
 * 문제 깃발. 깃대와 trace 위의 마름모는 <ProblemMark> 가 그린다.
 * 깃발은 깃대를 따라 올라와 자리 잡는다.
 */
export const ProblemFlag: React.FC<{ index: number; text: string; x: number; y: number; w: number; p?: number }> = ({
  index,
  text,
  x,
  y,
  w,
  p = 1,
}) => {
  if (p <= 0) return null;
  return (
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
        opacity: p,
        translate: `0px ${(1 - p) * 12}px`,
      }}
    >
      <IndexTab index={index} tint={color.problem} side="right" p={1} />
      <WarnIcon size={34} color={color.problem} width={2.5} />
      <div style={{ ...sans(size.body, 700), whiteSpace: "nowrap", color: color.problem }}>{text}</div>
    </div>
  );
};

/**
 * 문제 표식: trace 위의 마름모와 깃대. <svg> 안에서 쓴다.
 * 해결되기 전에는 마름모 둘레에 잔잔한 고리가 퍼진다(alive 0~1 로 세기를 정한다).
 */
export const ProblemMark: React.FC<{
  x: number;
  cy: number;
  /** 깃발의 아래쪽 y. 깃대가 여기까지 올라간다. */
  flagBottom: number;
  p?: number;
  /** 고리의 진행 0~1 (pulse() 값) */
  ring?: number;
  alive?: number;
}> = ({ x, cy, flagBottom, p = 1, ring = 0, alive = 0 }) => {
  if (p <= 0) return null;
  const pop = sub(p, 0, 0.45);
  const s = DIAMOND * (0.6 + 0.4 * pop);
  const pole = sub(p, 0.25, 0.75);
  const poleTop = cy - DIAMOND - (cy - DIAMOND - flagBottom) * pole;
  const halo = DIAMOND + 6 + ring * 18;
  return (
    <g>
      {alive > 0 && p >= 1 ? (
        <path
          d={`M ${x} ${cy - halo} L ${x + halo} ${cy} L ${x} ${cy + halo} L ${x - halo} ${cy} Z`}
          fill="none"
          stroke={color.problem}
          strokeWidth={stroke.thin}
          opacity={alive * 0.55 * (1 - ring)}
        />
      ) : null}
      {pole > 0 ? (
        <line x1={x} x2={x} y1={cy - DIAMOND} y2={poleTop} stroke={color.problem} strokeWidth={stroke.trace} />
      ) : null}
      <path
        d={`M ${x} ${cy - s} L ${x + s} ${cy} L ${x} ${cy + s} L ${x - s} ${cy} Z`}
        fill={color.problem}
        opacity={pop}
      />
      <path
        d={`M ${x} ${cy - 12} V ${cy + 4} M ${x} ${cy + 10} V ${cy + 13}`}
        stroke={color.bg}
        strokeWidth={4}
        fill="none"
        opacity={sub(p, 0.3, 0.6)}
      />
    </g>
  );
};

/** 해결 단자. 두 줄에 걸쳐 서서 흐름을 닫는다. */
export const ResolvedGate: React.FC<Box & { index: number; text: string; br?: Breaks; p?: number }> = ({
  index,
  text,
  br,
  x,
  y,
  w,
  h,
  p = 1,
}) => {
  if (p <= 0) return null;
  // 마름모: 붉게 채워져 나타났다가 붉은색이 빠지고, 확인 표시가 그려진다.
  const drain = sub(p, 0.35, 0.75);
  const check = sub(p, 0.6, 1);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div
        style={{ position: "absolute", inset: 0, backgroundColor: withAlpha(color.resolved, 0.05), opacity: sub(p, 0.2, 0.8) }}
      />
      <Outline w={w} h={h} tint={color.resolved} width={stroke.trace} p={sub(p, 0, 0.8)} />
      <IndexTab index={index} tint={color.resolved} p={sub(p, 0.3, 0.7)} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 18,
          padding: "0 22px",
        }}
      >
        <svg width={60} height={60} viewBox="0 0 60 60" style={{ flex: "none", marginLeft: -4, opacity: sub(p, 0.15, 0.45) }}>
          <path d="M30 3 57 30 30 57 3 30Z" fill={color.problem} opacity={1 - drain} />
          <path
            d="M30 3 57 30 30 57 3 30Z"
            fill="none"
            stroke={color.resolved}
            strokeWidth={stroke.trace}
            opacity={drain}
          />
          <path
            d="M19 30.5 27 38 41.5 22"
            fill="none"
            stroke={color.resolved}
            strokeWidth={stroke.bold}
            pathLength={1}
            {...draw(check)}
          />
        </svg>
        <div
          style={{
            ...sans(size.body, 600),
            lineHeight: "46px",
            opacity: sub(p, 0.4, 1),
            translate: `${(1 - sub(p, 0.4, 1)) * 10}px 0px`,
          }}
        >
          {br === undefined ? <Phrases text={text} /> : <Lines text={text} br={br} />}
        </div>
      </div>
    </div>
  );
};

export const LaneLabel: React.FC<{
  kind: "agent" | "human";
  name: string;
  /** 영문 장식 라벨 */
  tag: string;
  x: number;
  /** 줄의 세로 중심 */
  cy: number;
  p?: number;
}> = ({ kind, name, tag, x, cy, p = 1 }) => {
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
        opacity: p,
        translate: `${(1 - p) * -10}px 0px`,
      }}
    >
      <Icon size={34} color={tint} />
      <div style={{ ...sans(size.small, 700), lineHeight: "40px", color: tint, whiteSpace: "nowrap" }}>{name}</div>
      <div style={{ ...mono(size.label, 500), color: color.inkDim }}>{tag}</div>
    </div>
  );
};

// ── 흐름도 전체 ────────────────────────────────────────────────────────
export const Flow: React.FC<{
  geometry: FlowGeometry;
  /** 나타나는 순서대로. 번호(01, 02 …)는 이 순서로 붙는다. */
  items: readonly FlowItem[];
  laneNames: { agent: string; human: string };
  /** 두 줄의 바탕과 이름이 그려지기 시작하는 프레임 */
  lanesAt: number;
  /** 해결 단자에서 문제로 되돌아가는 점선 고리(폐루프). y 는 고리 아래쪽 변의 높이 */
  loopback?: { y: number };
}> = ({ geometry: g, items, laneNames, lanesAt, loopback }) => {
  const frame = useCurrentFrame();
  const agentCy = g.agentY + g.rowH / 2;
  const humanCy = g.humanY + g.rowH / 2;
  const split = (g.agentY + g.rowH + g.humanY) / 2;
  const notch = g.agentY - 14;

  const lanes = progress(frame, lanesAt, 14, ease.out);
  const rects = items.map((item) => flowRect(g, item));
  const ps = items.map((item) => progress(frame, item.at, ITEM_ENTER, ease.out));

  let problemIdx = -1;
  let resolvedIdx = -1;
  items.forEach((item, i) => {
    if (item.kind === "problem") problemIdx = i;
    if (item.kind === "resolved") resolvedIdx = i;
  });
  const resolvedAt = resolvedIdx >= 0 ? items[resolvedIdx].at : null;

  return (
    <>
      <svg {...fullSvg}>
        {/* 줄의 바탕 */}
        <g opacity={lanes}>
          <path
            d={`M ${g.left} ${g.top} H ${g.stripRight} V ${notch} H ${g.right} V ${split} H ${g.left} Z`}
            fill={withAlpha(color.agent, 0.035)}
          />
          <rect
            x={g.left}
            y={split}
            width={g.right - g.left}
            height={g.bottom - split}
            fill={withAlpha(color.human, 0.035)}
          />
        </g>
        {lanes > 0 ? (
          <>
            <line
              x1={g.left}
              x2={g.left}
              y1={g.top}
              y2={g.top + (split - g.top) * lanes}
              stroke={color.agent}
              strokeWidth={stroke.bold}
            />
            <line
              x1={g.left}
              x2={g.left}
              y1={split}
              y2={split + (g.bottom - split) * lanes}
              stroke={color.human}
              strokeWidth={stroke.bold}
            />
            <line
              x1={g.left}
              x2={g.left + (g.right - g.left) * lanes}
              y1={split}
              y2={split}
              stroke={color.lineStrong}
              strokeWidth={stroke.hair}
              strokeDasharray="18 6 3 6"
            />
          </>
        ) : null}

        {/* 연결선: 직전 항목 → 이 항목 */}
        {items.map((item, i) => {
          if (i === 0) return null;
          const pts = routeLink(rects[i - 1], rects[i], item.slot.type === "step");
          return (
            <Trace
              key={i}
              pts={pts}
              arrow={item.kind !== "problem"}
              progress={progress(frame, item.at - LINK_LEAD, LINK_DRAW, ease.out)}
            />
          );
        })}

        {/* 폐루프: 해결 뒤 문제의 자리로 되돌아간다 */}
        {loopback && problemIdx >= 0 && resolvedIdx >= 0 && resolvedAt !== null ? (
          <Trace
            pts={[
              [rects[resolvedIdx].x + rects[resolvedIdx].w / 2, rects[resolvedIdx].y + rects[resolvedIdx].h],
              [rects[resolvedIdx].x + rects[resolvedIdx].w / 2, loopback.y],
              [rects[problemIdx].x + DIAMOND, loopback.y],
              [rects[problemIdx].x + DIAMOND, rects[problemIdx].y + DIAMOND * 2],
            ]}
            stroke={color.agent}
            dash="10 8"
            chamfer={12}
            arrow
            progress={progress(frame, resolvedAt + ITEM_ENTER, 30, ease.inOut)}
          />
        ) : null}

        {/* 문제 표식 */}
        {items.map((item, i) => {
          if (item.slot.type !== "problem") return null;
          const cy = item.slot.lane === "human" ? humanCy : agentCy;
          return (
            <ProblemMark
              key={i}
              x={item.slot.x}
              cy={cy}
              flagBottom={g.flagY + FLAG_HEIGHT}
              p={ps[i]}
              ring={pulse(frame, item.at + ITEM_ENTER, 48)}
              alive={resolvedAt === null ? 1 : 1 - progress(frame, resolvedAt, ITEM_ENTER, ease.out)}
            />
          );
        })}
      </svg>

      <LaneLabel kind="agent" name={laneNames.agent} tag="AGENT" x={g.left + 20} cy={agentCy} p={lanes} />
      <LaneLabel kind="human" name={laneNames.human} tag="HUMAN" x={g.left + 20} cy={humanCy} p={lanes} />

      {items.map((item, i) => {
        const slot = item.slot;
        if (slot.type === "problem") {
          return (
            <ProblemFlag
              key={i}
              index={i + 1}
              text={item.text}
              x={slot.flag.x}
              y={g.flagY}
              w={slot.flag.w}
              p={sub(ps[i], 0.4, 1)}
            />
          );
        }
        if (slot.type === "gate") {
          return <ResolvedGate key={i} index={i + 1} text={item.text} br={slot.br} {...rects[i]} p={ps[i]} />;
        }
        return (
          <FlowStep
            key={i}
            kind={item.kind === "human" ? "human" : "agent"}
            index={i + 1}
            text={item.text}
            br={slot.br}
            {...rects[i]}
            p={ps[i]}
          />
        );
      })}
    </>
  );
};

/** 기본 줄 자리: 승인 스틸(S5-4)의 좌표 */
export const DEFAULT_FLOW_GEOMETRY: FlowGeometry = {
  agentY: 528,
  humanY: 700,
  rowH: 120,
  top: 392,
  bottom: 834,
  left: safe.left,
  right: safe.right,
  stripRight: safe.right,
  flagY: 420,
};
