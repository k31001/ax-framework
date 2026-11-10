import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { draw, ease, enterSvg, lerp, progress, pulse, sub } from "../../anim";
import { Trace, pointOnTrace, traceLength } from "../../components";
import type { Pt } from "../../components";
import { FIG } from "../../content";
import type { Illustration, IllustrationBeat } from "../../stage/StageScene";
import { color, sans, size, stroke, withAlpha } from "../../theme";

// S5-1 요구사항 분석의 그림 (1040×616).
//
//   왼쪽   문서 세 장. 한 장에 조항 네 줄.
//   오른쪽 요구사항 그래프. 조항 하나가 점 하나가 된다. 점의 높이는 대체로 출처 문서의 높이다.
//   가운데 세로줄: [수용 기준] ─ read 지연 ─ ◆ 충돌 위험 ─ QLC 오류율
//
// 순서
//   before  문서가 그려진다
//   agent   문서를 훑고, 조항 조각이 날아가 점이 되고, trace 로 이어진다.
//           이어서 두 점이 강조되고 그 사이가 붉어진다. 두 점에서 출처 조항까지 점선이 되짚어 간다
//           (서로 다른 문서에서 온 요구라는 것).
//   human   read 지연 쪽에 우선순위 고리 → 붉은색이 빠진다 → "수용 기준" 표식이 붙는다
//   record  표식에서 요구사항 카드의 기록 줄로 선이 올라간다

const L = FIG["S5-1"];

// ── 문서 ───────────────────────────────────────────────────────────────
const DOC = { x: 12, w: 150, h: 128, fold: 22 } as const;
const DOC_TOPS = [60, 252, 444] as const;
const ROWS = [30, 54, 78, 102] as const; // 문서 위쪽에서 조항 줄까지
const ROW_LEN = [
  [96, 70, 104, 84],
  [80, 104, 64, 92],
  [100, 76, 92, 68],
] as const;
const MARK_X = DOC.x + 18; // 조항 머리표의 중심
const LINE_X = DOC.x + 34;
const rowY = (doc: number, row: number): number => DOC_TOPS[doc] + ROWS[row];

// ── 그래프 ─────────────────────────────────────────────────────────────
// 가운데 세로줄의 x. 카드로 올라가는 선이 진행 표시의 단계 이름 사이(화면 x 1361)를 지나도록 잡았다.
const SPINE = 577;
type Node = { doc: number; row: number; x: number; y: number; key?: "a" | "b" };
const NODES: Node[] = [
  { doc: 0, row: 0, x: 330, y: 90 },
  { doc: 0, row: 1, x: 870, y: 114 },
  { doc: 0, row: 2, x: 990, y: 168 },
  { doc: 0, row: 3, x: SPINE, y: 162, key: "b" }, // read 지연: 고객 요구서에서
  { doc: 1, row: 0, x: 330, y: 282 },
  { doc: 1, row: 1, x: 870, y: 306 },
  { doc: 1, row: 2, x: 450, y: 400 },
  { doc: 1, row: 3, x: SPINE, y: 354, key: "a" }, // QLC 오류율: NAND 스펙에서
  { doc: 2, row: 0, x: 330, y: 474 },
  { doc: 2, row: 1, x: SPINE, y: 498 },
  { doc: 2, row: 2, x: 990, y: 470 },
  { doc: 2, row: 3, x: 820, y: 546 },
];
const B = NODES[3];
const A = NODES[7];

// 첫 줄은 나중에 충돌이 켜지는 연결이다.
const CONFLICT: Pt[] = [
  [B.x, B.y],
  [A.x, A.y],
];
const EDGES: Pt[][] = [
  [
    [330, 90],
    [330, 282],
  ],
  [
    [330, 282],
    [450, 282],
    [450, 400],
  ],
  [
    [450, 400],
    [330, 400],
    [330, 474],
  ],
  [
    [330, 474],
    [450, 474],
    [450, 498],
    [SPINE, 498],
  ],
  [
    [SPINE, 354],
    [SPINE, 498],
  ],
  [
    [SPINE, 498],
    [700, 498],
    [700, 546],
    [820, 546],
  ],
  [
    [820, 546],
    [990, 546],
    [990, 470],
  ],
  [
    [870, 306],
    [990, 306],
    [990, 470],
  ],
  [
    [870, 114],
    [870, 306],
  ],
  [
    [870, 114],
    [990, 114],
    [990, 168],
  ],
];

const NODE_R = 7;
const KEY_R = 11;
const PRIORITY_R = 19;
const MARK_Y = (A.y + B.y) / 2; // 충돌 표식의 높이
const MARK_S = 17;
const LABEL_X = SPINE + KEY_R + 14;

// "수용 기준" 표식
const TAG = { w: 182, h: 46, top: 72 } as const;
const TAG_X = SPINE - TAG.w / 2;

// ── 시점 (프레임, 기준 시점에서의 거리) ────────────────────────────────
const CHIP_DUR = 18;
const chipDelay = (n: Node): number => 6 + n.doc * 4 + n.row * 2;
const EDGES_AT = 30;
const DETECT_AT = 48;

const frameOf = (beats: readonly IllustrationBeat[], kind: IllustrationBeat["kind"]): number => {
  const hit = beats.filter((b) => b.kind === kind)[0];
  return hit ? hit.frame : 0;
};

const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  fill?: string;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  opacity?: number;
}> = ({ x, y, text, fill = color.inkSoft, weight = 600, anchor = "start", opacity }) => {
  const font = sans(size.small, weight);
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fill={fill}
      opacity={opacity}
      style={{
        fontFamily: font.fontFamily,
        fontSize: font.fontSize,
        fontWeight: font.fontWeight,
        letterSpacing: font.letterSpacing,
      }}
    >
      {text}
    </text>
  );
};

export const RequirementGraph: Illustration = ({ width, height, beats, frames, card }) => {
  const frame = useCurrentFrame();
  const agentAt = frameOf(beats, "agent");
  const humanAt = frameOf(beats, "human");

  // 충돌: 켜짐 → 정리
  const detect = progress(frame, agentAt + DETECT_AT, 14);
  const red = progress(frame, agentAt + DETECT_AT + 2, 12);
  const markP = progress(frame, agentAt + DETECT_AT + 4, 12);
  const trace = progress(frame, agentAt + DETECT_AT + 4, 18, ease.inOut);
  const drain = progress(frame, humanAt + 14, 18, ease.inOut);
  const hot = red * (1 - drain);
  const conflictColor = interpolateColors(
    drain,
    [0, 1],
    [interpolateColors(red, [0, 1], [color.lineStrong, color.problem]), color.inkSoft],
  );

  // 사람: 우선순위 고리 → 표식
  const priority = progress(frame, humanAt + 6, 16);
  const stem = progress(frame, humanAt + 22, 10);
  const tag = progress(frame, humanAt + 28, 16);

  // 카드로 가는 선
  const slotY = card.slots[0].y;
  const cardRight = card.rect.x + card.rect.w;
  const link = progress(frame, frames.record - 20, 22, ease.inOut);
  const linkRest = progress(frame, frames.record + 20, 24, ease.linear);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      {/* ── 문서 세 장 ── */}
      {L.docs.map((name, d) => {
        const top = DOC_TOPS[d];
        const appear = progress(frame, frames.before + d * 5, 18);
        if (appear <= 0) return null;
        const scan = progress(frame, agentAt + 2 + d * 4, 10, ease.linear);
        const emptied = progress(frame, agentAt + 16 + d * 4, 22);
        const outline = interpolateColors(emptied, [0, 1], [color.inkSoft, color.lineStrong]);
        const right = DOC.x + DOC.w;
        return (
          <g key={name}>
            <g {...enterSvg(frame, frames.before + d * 5 + 4)}>
              <Label
                x={DOC.x}
                y={top - 25}
                text={name}
                fill={interpolateColors(emptied, [0, 1], [color.inkSoft, color.inkDim])}
              />
            </g>
            <path
              d={`M ${DOC.x} ${top} H ${right - DOC.fold} L ${right} ${top + DOC.fold} V ${top + DOC.h} H ${DOC.x} Z`}
              fill={withAlpha(color.panel, 0.6 * appear)}
              stroke={outline}
              strokeWidth={stroke.thin}
              strokeLinejoin="round"
              pathLength={1}
              {...draw(appear)}
            />
            <path
              d={`M ${right - DOC.fold} ${top} V ${top + DOC.fold} H ${right}`}
              fill="none"
              stroke={outline}
              strokeWidth={stroke.hair}
              opacity={sub(appear, 0.6, 1)}
            />
            {ROWS.map((dy, r) => {
              const y = top + dy;
              const rowP = sub(appear, 0.35 + r * 0.1, 0.75 + r * 0.1);
              const node = NODES[d * ROWS.length + r];
              const left = progress(frame, agentAt + chipDelay(node), 6); // 조각이 떠났다
              const scanned = scan * DOC.h >= dy ? 1 : 0;
              // 충돌한 두 요구의 출처 조항은 다시 밝아진다.
              const source = node.key ? trace : 0;
              const lineColor = interpolateColors(
                source,
                [0, 1],
                [interpolateColors(left, [0, 1], [color.inkSoft, color.lineStrong]), color.ink],
              );
              return (
                <g key={r} opacity={rowP}>
                  <line
                    x1={LINE_X}
                    x2={LINE_X + ROW_LEN[d][r]}
                    y1={y}
                    y2={y}
                    stroke={lineColor}
                    strokeWidth={stroke.trace}
                    opacity={lerp(0.85, 1, source)}
                  />
                  <rect
                    x={MARK_X - 4.5}
                    y={y - 4.5}
                    width={9}
                    height={9}
                    fill={scanned ? color.agent : color.inkSoft}
                    opacity={1 - left}
                  />
                  {/* 조각이 떠난 자리 */}
                  <rect
                    x={MARK_X - 4}
                    y={y - 4}
                    width={8}
                    height={8}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={stroke.hair}
                    opacity={left}
                  />
                </g>
              );
            })}
            {/* 훑는 선 */}
            {scan > 0 && scan < 1 ? (
              <line
                x1={DOC.x - 6}
                x2={right + 6}
                y1={top + DOC.h * scan}
                y2={top + DOC.h * scan}
                stroke={color.agent}
                strokeWidth={stroke.thin}
              />
            ) : null}
          </g>
        );
      })}

      {/* ── 출처를 되짚는 점선: 두 점 → 각자의 문서 ── */}
      {[B, A].map((n) => (
        <Trace
          key={n.key}
          pts={[
            [n.x - KEY_R - 4, n.y],
            [LINE_X + ROW_LEN[n.doc][n.row] + 10, n.y],
          ]}
          stroke={color.inkDim}
          width={stroke.thin}
          dash="4 7"
          progress={trace}
        />
      ))}

      {/* ── 그래프의 연결 ── */}
      {EDGES.map((pts, i) => (
        <Trace
          key={i}
          pts={pts}
          stroke={color.lineStrong}
          width={stroke.thin}
          progress={progress(frame, agentAt + EDGES_AT + 2 + i * 1.5, 12)}
        />
      ))}
      <Trace
        pts={CONFLICT}
        stroke={conflictColor}
        width={lerp(stroke.thin, stroke.bold, hot)}
        progress={progress(frame, agentAt + EDGES_AT, 12)}
      />

      {/* ── 날아가는 조항 조각 ── */}
      {NODES.map((n, i) => {
        const p = progress(frame, agentAt + chipDelay(n), CHIP_DUR, ease.inOut);
        if (p <= 0 || p >= 1) return null;
        const y0 = rowY(n.doc, n.row);
        const route: Pt[] =
          n.y === y0
            ? [
                [MARK_X, y0],
                [n.x, n.y],
              ]
            : [
                [MARK_X, y0],
                [n.x, y0],
                [n.x, n.y],
              ];
        const at = pointOnTrace(route, traceLength(route, 0) * p, 0);
        return (
          <g key={i}>
            <Trace
              pts={route}
              chamfer={0}
              stroke={color.agent}
              width={stroke.hair}
              opacity={0.4 * (1 - sub(p, 0.6, 1))}
              progress={p}
            />
            <rect x={at.x - 4.5} y={at.y - 4.5} width={9} height={9} fill={color.agent} />
          </g>
        );
      })}

      {/* ── 점 ── */}
      {NODES.map((n, i) => {
        const born = progress(frame, agentAt + chipDelay(n) + CHIP_DUR - 3, 9);
        if (born <= 0) return null;
        const k = n.key ? detect : 0;
        return (
          <g key={i} opacity={born}>
            <circle
              cx={n.x}
              cy={n.y}
              r={lerp(NODE_R, KEY_R, k) * (0.5 + 0.5 * born)}
              fill={color.bg}
              stroke={interpolateColors(k, [0, 1], [color.inkSoft, color.ink])}
              strokeWidth={stroke.trace}
            />
            {k > 0 ? <circle cx={n.x} cy={n.y} r={4 * k} fill={color.ink} /> : null}
          </g>
        );
      })}

      {/* ── 두 요구의 이름 ── */}
      <g {...enterSvg(frame, agentAt + DETECT_AT + 2, { from: "right", distance: 10 })}>
        <Label x={LABEL_X} y={B.y} text={L.nodes.b} fill={color.ink} />
      </g>
      <g {...enterSvg(frame, agentAt + DETECT_AT + 5, { from: "right", distance: 10 })}>
        <Label x={LABEL_X} y={A.y} text={L.nodes.a} fill={color.ink} />
      </g>

      {/* ── 충돌 표식 ── */}
      {markP > 0 ? (
        <g>
          {drain < 1 && markP >= 1 ? (
            (() => {
              const ring = pulse(frame, agentAt + DETECT_AT + 16, 40);
              const halo = MARK_S + 5 + ring * 14;
              return (
                <path
                  d={`M ${SPINE} ${MARK_Y - halo} L ${SPINE + halo} ${MARK_Y} L ${SPINE} ${MARK_Y + halo} L ${SPINE - halo} ${MARK_Y} Z`}
                  fill="none"
                  stroke={color.problem}
                  strokeWidth={stroke.thin}
                  opacity={0.55 * (1 - ring) * (1 - sub(drain, 0, 0.3))}
                />
              );
            })()
          ) : null}
          {(() => {
            const s = MARK_S * (0.6 + 0.4 * markP);
            const d = `M ${SPINE} ${MARK_Y - s} L ${SPINE + s} ${MARK_Y} L ${SPINE} ${MARK_Y + s} L ${SPINE - s} ${MARK_Y} Z`;
            return (
              <>
                <path d={d} fill={color.bg} opacity={markP} />
                <path d={d} fill={color.problem} opacity={markP * (1 - drain)} />
                <path d={d} fill="none" stroke={color.inkSoft} strokeWidth={stroke.thin} opacity={drain} />
              </>
            );
          })()}
          <path
            d={`M ${SPINE} ${MARK_Y - 8} V ${MARK_Y + 2} M ${SPINE} ${MARK_Y + 6.5} V ${MARK_Y + 9}`}
            stroke={color.bg}
            strokeWidth={3}
            fill="none"
            opacity={sub(markP, 0.4, 0.8) * (1 - sub(drain, 0, 0.4))}
          />
          <path
            d={`M ${SPINE - 7} ${MARK_Y + 0.5} L ${SPINE - 2} ${MARK_Y + 5.5} L ${SPINE + 7.5} ${MARK_Y - 5}`}
            fill="none"
            stroke={color.ink}
            strokeWidth={stroke.trace}
            pathLength={1}
            {...draw(sub(drain, 0.5, 1))}
          />
        </g>
      ) : null}
      <g {...enterSvg(frame, agentAt + DETECT_AT + 8, { from: "right", distance: 10 })}>
        <Label
          x={SPINE + MARK_S + 14}
          y={MARK_Y}
          text={L.conflict}
          weight={700}
          fill={interpolateColors(drain, [0, 1], [color.problem, color.inkDim])}
        />
      </g>

      {/* ── 우선순위: read 지연 쪽에 고리 ── */}
      {priority > 0 ? (
        <circle
          cx={B.x}
          cy={B.y}
          r={PRIORITY_R}
          fill="none"
          stroke={color.human}
          strokeWidth={stroke.trace}
          pathLength={1}
          transform={`rotate(-90 ${B.x} ${B.y})`}
          {...draw(priority)}
        />
      ) : null}

      {/* ── "수용 기준" 표식 ── */}
      <Trace
        pts={[
          [SPINE, B.y - PRIORITY_R],
          [SPINE, TAG.top + TAG.h],
        ]}
        stroke={color.human}
        progress={stem}
      />
      {tag > 0 ? (
        <g opacity={tag} transform={`translate(0 ${(1 - tag) * 8})`}>
          <rect
            x={TAG_X}
            y={TAG.top}
            width={TAG.w}
            height={TAG.h}
            fill={color.bg}
          />
          <rect
            x={TAG_X}
            y={TAG.top}
            width={TAG.w}
            height={TAG.h}
            fill={withAlpha(color.human, 0.1)}
            stroke={color.human}
            strokeWidth={stroke.thin}
          />
          <path
            d={`M ${TAG_X + 16} ${TAG.top + 24} l 7 7 l 12 -14`}
            fill="none"
            stroke={color.human}
            strokeWidth={stroke.bold}
            pathLength={1}
            {...draw(sub(tag, 0.4, 1))}
          />
          <Label x={TAG_X + 47} y={TAG.top + TAG.h / 2} text={L.criterion} weight={700} fill={color.ink} />
        </g>
      ) : null}

      {/* ── 표식 → 요구사항 카드의 기록 줄 ── */}
      <Trace
        pts={[
          [SPINE, TAG.top],
          [SPINE, slotY],
          [cardRight + 3, slotY],
        ]}
        stroke={color.inkSoft}
        arrow
        chamfer={12}
        opacity={lerp(1, 0.45, linkRest)}
        progress={link}
      />
    </svg>
  );
};
