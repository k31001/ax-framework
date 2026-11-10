// 두 줄 흐름도(스윔레인 보드).
// 위 줄은 에이전트, 아래 줄은 사람. 문제와 해결 표식은 두 줄의 경계선 위에 놓여 흐름에 끼어든다.
// layoutFlow()가 모든 항목의 위치를 미리 계산하므로, 영상에서는 항목을 순서대로 띄우고
// 연결선을 그리는 타이밍만 붙이면 된다.

import type { StepKind } from "../../shared/content";
import { C, KR, MONO_TXT, R, ROLE, SHADOW, T } from "../theme";
import { estimateWidth, wrapBalanced } from "../text";
import { Avatar } from "./Avatar";
import { AlertIcon, CheckIcon } from "./Icons";

export type FlowStep = { kind: StepKind; text: string };
export type FlowRow = 0 | 1 | 2; // 0 에이전트, 1 경계선(문제·해결), 2 사람

export type FlowRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  cy: number;
  row: FlowRow;
  kind: StepKind;
  lines: string[];
};

export const FLOW = {
  fontSize: T.flow,
  lineH: 44,
  padY: 14,
  radius: 14,
  // 역할 카드: 왼쪽 띠 + 안쪽 여백
  card: { band: 8, padL: 20, padR: 22 },
  // 문제·해결 표식: 아이콘 블록 + 안쪽 여백
  marker: { padL: 12, icon: 48, gap: 14, padR: 22 },
  /** 한 줄에 허용하는 글자 폭의 후보. 넓은 쪽부터 시도하고, 넘으면 두 줄로 나눈다. */
  lineWidths: [520, 392],
  /** 다음 항목은 앞 항목보다 최소 이만큼 오른쪽에서 시작한다(순서가 왼쪽→오른쪽으로 읽히게). */
  minAdvance: 118,
  /** 같은 줄에 놓인 두 항목 사이: 다른 줄에서 꺾여 들어오는 연결선의 자리. */
  rowGap: 72,
  /** 같은 줄에서 곧바로 이어지는 두 항목 사이. */
  straightGap: 56,
} as const;

/** 연결선 색. */
const LINK = "#7A869C";

const rowOf = (k: StepKind): FlowRow => (k === "agent" ? 0 : k === "human" ? 2 : 1);
const isMarker = (k: StepKind) => k === "problem" || k === "resolved";

const chromeOf = (k: StepKind) =>
  isMarker(k)
    ? FLOW.marker.padL + FLOW.marker.icon + FLOW.marker.gap + FLOW.marker.padR
    : FLOW.card.band + FLOW.card.padL + FLOW.card.padR;

/**
 * 항목을 순서대로 왼쪽에서 오른쪽으로 놓는다.
 * 줄이 다른 항목끼리는 가로로 겹쳐도 되므로, 일곱 항목도 한 화면 폭에 들어간다.
 * @param x0 첫 항목의 왼쪽 끝
 * @param x1 마지막 항목이 넘으면 안 되는 오른쪽 끝
 * @param rowCy 세 줄(에이전트, 경계선, 사람)의 세로 중심
 */
export const layoutFlow = (
  steps: readonly FlowStep[],
  x0: number,
  x1: number,
  rowCy: readonly [number, number, number],
): FlowRect[] => {
  const size = (maxLine: number) =>
    steps.map((s) => {
      const lines = wrapBalanced(s.text, FLOW.fontSize, maxLine);
      const textW = Math.max(...lines.map((l) => estimateWidth(l, FLOW.fontSize)));
      return {
        kind: s.kind,
        row: rowOf(s.kind),
        lines,
        // 표식은 굵기 700이라 조금 더 넓다.
        w: Math.ceil(textW * (isMarker(s.kind) ? 1.035 : 1.02) + chromeOf(s.kind)),
        h: lines.length * FLOW.lineH + FLOW.padY * 2,
      };
    });

  const pack = (sized: ReturnType<typeof size>, scale: number) => {
    const lastRight = [-Infinity, -Infinity, -Infinity];
    const xs: number[] = [];
    sized.forEach((s, i) => {
      const prev = sized[i - 1];
      const gap = (prev && prev.row === s.row ? FLOW.straightGap : FLOW.rowGap) * scale;
      const x = i === 0 ? x0 : Math.max(xs[i - 1] + FLOW.minAdvance * scale, lastRight[s.row] + gap);
      xs.push(x);
      lastRight[s.row] = x + s.w;
    });
    return { xs, right: Math.max(...xs.map((x, i) => x + sized[i].w)) };
  };

  // 1) 항목이 적은 씬은 한 줄짜리 카드로 놓는다. 안 들어가면 줄 폭을 좁혀 두 줄 카드로 바꾼다.
  let sized = size(Infinity);
  let packed = pack(sized, 1);
  for (const maxLine of FLOW.lineWidths) {
    if (packed.right <= x1) break;
    sized = size(maxLine);
    packed = pack(sized, 1);
  }
  // 2) 그래도 넘치면 간격을 조금씩 줄인다.
  let scale = 1;
  while (packed.right > x1 && scale > 0.6) {
    scale -= 0.02;
    packed = pack(sized, scale);
  }
  // 3) 남는 폭은 뒤 항목일수록 많이 밀어 고르게 편다.
  const extra = Math.max(0, x1 - packed.right);
  const n = sized.length;

  return sized.map((s, i) => {
    const x = Math.round(packed.xs[i] + (n > 1 ? (extra * i) / (n - 1) : 0));
    const cy = rowCy[s.row];
    return { ...s, x, y: Math.round(cy - s.h / 2), cy };
  });
};

/** 항목 a에서 b로 가는 연결선. 항상 b의 왼쪽 변으로 들어간다. */
const route = (a: FlowRect, b: FlowRect) => {
  const endX = b.x - 9;
  if (a.row === b.row) {
    return `M ${a.x + a.w + 5} ${a.cy} H ${endX}`;
  }
  const down = b.row > a.row;
  const r = 14;
  const sx = Math.min(a.x + a.w - 30, b.x - 36);
  const sy = down ? a.y + a.h + 5 : a.y - 5;
  const s = down ? 1 : -1;
  return `M ${sx} ${sy} V ${b.cy - s * r} Q ${sx} ${b.cy} ${sx + r} ${b.cy} H ${endX}`;
};

const StepNumber: React.FC<{ n: number; color: string }> = ({ n, color }) => (
  <div
    style={{
      ...MONO_TXT,
      position: "absolute",
      left: -13,
      top: -13,
      width: 34,
      height: 34,
      borderRadius: "50%",
      backgroundColor: color,
      color: "#FFFFFF",
      border: "3px solid #FFFFFF",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: T.propSm,
      fontWeight: 700,
      lineHeight: 1,
    }}
  >
    {n}
  </div>
);

/** 흐름도 항목 하나. 역할 카드(에이전트·사람) 또는 표식(문제·해결). */
export const FlowItem: React.FC<{ rect: FlowRect; n: number; active?: boolean }> = ({ rect, n, active }) => {
  const role = ROLE[rect.kind];
  const marker = isMarker(rect.kind);
  return (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
      {/* 하이라이트: 영상에서는 이 고리가 항목을 따라 이동한다 */}
      {active ? (
        <div
          style={{
            position: "absolute",
            inset: -9,
            borderRadius: FLOW.radius + 9,
            border: `4px solid ${role.main}`,
            opacity: 0.32,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: FLOW.radius,
          overflow: "hidden",
          boxSizing: "border-box",
          backgroundColor: marker ? role.soft : C.panel,
          border: marker ? `2px solid ${role.main}` : `1.5px solid ${C.line}`,
          boxShadow: active ? SHADOW.raised : SHADOW.card,
          display: "flex",
          alignItems: "center",
        }}
      >
        {marker ? (
          <div
            style={{
              marginLeft: FLOW.marker.padL - 2,
              marginRight: FLOW.marker.gap,
              width: FLOW.marker.icon,
              height: FLOW.marker.icon,
              borderRadius: R.md,
              backgroundColor: role.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {rect.kind === "problem" ? (
              <AlertIcon size={30} color="#FFFFFF" stroke={2.6} />
            ) : (
              <CheckIcon size={32} color="#FFFFFF" stroke={3.2} />
            )}
          </div>
        ) : (
          <div
            style={{
              alignSelf: "stretch",
              width: FLOW.card.band,
              marginRight: FLOW.card.padL - 1.5,
              backgroundColor: role.main,
              flexShrink: 0,
            }}
          />
        )}
        <div>
          {rect.lines.map((line) => (
            <div
              key={line}
              style={{
                ...KR,
                fontSize: FLOW.fontSize,
                lineHeight: `${FLOW.lineH}px`,
                fontWeight: marker ? 700 : 600,
                color: marker ? role.ink : C.ink,
                whiteSpace: "nowrap",
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
      <StepNumber n={n} color={role.main} />
    </div>
  );
};

export const FlowConnectors: React.FC<{ rects: FlowRect[]; width: number; height: number }> = ({
  rects,
  width,
  height,
}) => (
  <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {rects.slice(1).map((b, i) => {
      const a = rects[i];
      return (
        <g key={i}>
          <path d={route(a, b)} fill="none" stroke={LINK} strokeWidth={3} strokeLinecap="round" />
          <path
            d={`M ${b.x - 15} ${b.cy - 7} L ${b.x - 5} ${b.cy} L ${b.x - 15} ${b.cy + 7}`}
            fill="none"
            stroke={LINK}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    })}
  </svg>
);

const LaneHead: React.FC<{ role: "agent" | "human"; label: string; top: number; width: number; height: number }> = ({
  role,
  label,
  top,
  width,
  height,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top,
      width,
      height,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    }}
  >
    <Avatar role={role} size={56} />
    <span style={{ ...KR, fontSize: T.label, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{label}</span>
  </div>
);

export const BOARD = { headH: 52, laneHeadW: 150, padR: 22 } as const;

/**
 * 스윔레인 보드.
 * header에는 "현재" 한 줄이 들어간다(영상에서는 먼저 나왔다가 흐려지는 자리).
 */
export const SwimlaneBoard: React.FC<{
  x: number;
  y: number;
  width: number;
  laneH: number;
  steps: readonly FlowStep[];
  lanes: { agent: string; human: string };
  header?: React.ReactNode;
  /** 하이라이트가 놓인 항목. */
  active?: number;
}> = ({ x, y, width, laneH, steps, lanes, header, active }) => {
  const top = BOARD.headH;
  const height = top + laneH * 2;
  const maxH = FLOW.lineH * 2 + FLOW.padY * 2;
  const inset = (laneH - maxH / 2 - maxH) / 2; // 카드와 경계선 표식 사이 틈과 같은 여백
  const rowCy: [number, number, number] = [
    top + inset + maxH / 2,
    top + laneH,
    top + laneH * 2 - inset - maxH / 2,
  ];
  const rects = layoutFlow(steps, BOARD.laneHeadW + 26, width - BOARD.padR, rowCy);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        backgroundColor: C.panel,
        borderRadius: R.lg,
        boxShadow: SHADOW.panel,
        border: `1px solid ${C.lineSoft}`,
        boxSizing: "border-box",
      }}
    >
      {/* 머리줄 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          height: top,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          boxSizing: "border-box",
          borderBottom: `1px solid ${C.lineSoft}`,
        }}
      >
        {header}
      </div>
      {/* 레인 바닥 */}
      <div
        style={{
          position: "absolute",
          left: BOARD.laneHeadW,
          top,
          right: 0,
          height: laneH * 2,
          backgroundColor: C.lane,
          borderBottomRightRadius: R.lg,
          borderLeft: `1px solid ${C.lineSoft}`,
        }}
      />
      {/* 두 줄의 경계 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: top + laneH - 1,
          height: 0,
          borderTop: `2px dashed ${C.line}`,
        }}
      />
      {/* 줄 머리의 역할 색 띠 */}
      {([C.agent, C.human] as const).map((color, i) => (
        <div
          key={color}
          style={{
            position: "absolute",
            left: BOARD.laneHeadW - 2,
            top: top + laneH * i + 14,
            width: 5,
            height: laneH - 28,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      ))}
      <LaneHead role="agent" label={lanes.agent} top={top} width={BOARD.laneHeadW} height={laneH} />
      <LaneHead role="human" label={lanes.human} top={top + laneH} width={BOARD.laneHeadW} height={laneH} />
      <FlowConnectors rects={rects} width={width} height={height} />
      {rects.map((r, i) => (
        <FlowItem key={i} rect={r} n={i + 1} active={i === active} />
      ))}
    </div>
  );
};
