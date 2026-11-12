import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { clamp01, draw, ease, enterSvg, lerp, progress, sub } from "../../anim";
import { Trace } from "../../components";
import { FIG } from "../../content";
import { color, size, stroke, withAlpha } from "../../theme";
import { Label } from "./Label";

// S5-2 배경 그림: 요구사항이 크게 바뀌어 이전 구조를 그대로 쓸 수 없다. 본문 전체(1728×504)를 쓴다.
//   왼쪽   이전 세대 → 이번 과제. NAND 와 용량은 바뀌고 전력 한도는 그대로다
//   오른쪽 이전 구조(FW 가 복구 단계를 하나씩 제어). 새 조건에서 FW 왕복이 쌓여 P99.99 가 기준을 넘는다
// 수치는 docs/06-architecture-exploration.md 5.1, 5.4 의 예시다.

const L = FIG["S5-2"];
/** 문구 아래에 두는 여백 */
const TOP = 28;

// ── 왼쪽: 바뀐 것 ──
const COL = { item: 30, from: 236, arrow: 430, to: 510, note: 772 } as const;
const HEAD_Y = 34;
const ROW_Y = [112, 190, 268] as const;
const TABLE_RIGHT = 880;

// ── 오른쪽: 이전 구조 ──
const X0 = 1010;
const FW = { x: X0, y: 76, w: 600, h: 64 } as const;
const NAND = { x: X0, y: 218, w: 270, h: 64 } as const;
const LDPC = { x: X0 + 330, y: 218, w: 270, h: 64 } as const;
const UP_X = LDPC.x + LDPC.w / 2;
const DOWN_X = NAND.x + NAND.w / 2;
const MID_Y = NAND.y + NAND.h / 2;
// FW 왕복: 실패하면 FW 로 올라갔다가(오른쪽) 다시 read 하러 내려온다(왼쪽). 한 바퀴의 앞 절반은 올라가고 뒤 절반은 내려온다.
const GAP_TOP = FW.y + FW.h;
const GAP_BOTTOM = NAND.y;
const tokenOnTrip = (t: number): { x: number; y: number; opacity: number } => {
  const u = t - Math.floor(t);
  const leg = u < 0.5 ? u / 0.5 : (u - 0.5) / 0.5;
  const fade = Math.min(1, leg / 0.2, (1 - leg) / 0.2);
  return u < 0.5
    ? { x: UP_X, y: lerp(GAP_BOTTOM, GAP_TOP, leg), opacity: fade }
    : { x: DOWN_X, y: lerp(GAP_TOP, GAP_BOTTOM, leg), opacity: fade };
};

const BAR = { x: X0, y: 372, w: 600, h: 28 } as const;
const SCALE = BAR.w / 3.6; // px per ms
const LIMIT_X = BAR.x + 2 * SCALE;
const OVER_W = 3.41 * SCALE;

const BoxOutline: React.FC<{
  b: { x: number; y: number; w: number; h: number };
  p: number;
  tint: string;
  dash?: string;
}> = ({ b, p, tint, dash }) => (
  <rect
    x={b.x}
    y={b.y}
    width={b.w}
    height={b.h}
    fill={withAlpha(color.panel, 0.6 * p)}
    stroke={tint}
    strokeWidth={stroke.thin}
    {...(p < 1 ? draw(p, 2 * (b.w + b.h)) : { strokeDasharray: dash })}
  />
);

export const ChangeAndBreak: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const gone = progress(frame, out, 8, ease.in);
  if (gone >= 1) return null;

  // 이전 구조: 그려진 뒤 부하가 걸리고, 지연이 기준을 넘는다.
  const structAt = at + 56;
  const struct = progress(frame, structAt, 18);
  const loadAt = structAt + 20;
  const grow = progress(frame, loadAt, 48, ease.linear);
  const latency = OVER_W * grow;
  const over = clamp01((latency - (LIMIT_X - BAR.x)) / 14);
  const tint = interpolateColors(over, [0, 1], [color.inkSoft, color.problem]);
  const laps = frame < loadAt ? 0 : (frame - loadAt) / 22;
  const token = tokenOnTrip(laps);

  return (
    <g opacity={1 - gone} transform={`translate(0 ${TOP})`}>
      {/* ── 바뀐 것 ── */}
      <g {...enterSvg(frame, at + 6, { distance: 8 })}>
        <Label x={COL.from} y={HEAD_Y} text={L.change.head.from} fill={color.inkDim} />
        <Label x={COL.to} y={HEAD_Y} text={L.change.head.to} fill={color.inkSoft} />
      </g>
      <line
        x1={COL.item}
        x2={COL.item + (TABLE_RIGHT - COL.item) * progress(frame, at + 6, 18)}
        y1={HEAD_Y + 30}
        y2={HEAD_Y + 30}
        stroke={color.lineStrong}
        strokeWidth={stroke.thin}
      />
      {L.change.rows.map((row, i) => {
        const rowAt = at + 14 + i * 12;
        const y = ROW_Y[i];
        const same = row.from === row.to;
        const moved = progress(frame, rowAt + 6, 14, ease.inOut);
        return (
          <g key={row.item}>
            <g {...enterSvg(frame, rowAt, { from: "left", distance: 10 })}>
              <Label x={COL.item} y={y} text={row.item} />
              <Label x={COL.from} y={y} text={row.from} px={size.body} weight={500} fill={color.inkDim} />
            </g>
            <Trace
              pts={[
                [COL.arrow, y],
                [COL.to - 22, y],
              ]}
              stroke={same ? color.lineStrong : color.ink}
              width={stroke.thin}
              dash={same ? "6 6" : undefined}
              arrow={!same}
              progress={moved}
            />
            <g {...enterSvg(frame, rowAt + 12, { from: "left", distance: 10 })}>
              <Label
                x={COL.to}
                y={y}
                text={row.to}
                px={size.body}
                weight={same ? 500 : 700}
                fill={same ? color.inkSoft : color.ink}
              />
              {row.note ? (
                <>
                  <rect
                    x={COL.note}
                    y={y - 23}
                    width={row.note.length * 30 + 28}
                    height={46}
                    fill="none"
                    stroke={same ? color.lineStrong : color.ink}
                    strokeWidth={stroke.hair}
                  />
                  <Label
                    x={COL.note + (row.note.length * 30 + 28) / 2}
                    y={y}
                    text={row.note}
                    anchor="middle"
                    weight={700}
                    fill={same ? color.inkSoft : color.ink}
                  />
                </>
              ) : null}
            </g>
            <line
              x1={COL.item}
              x2={TABLE_RIGHT}
              y1={y + 39}
              y2={y + 39}
              stroke={color.line}
              strokeWidth={stroke.hair}
              opacity={progress(frame, rowAt, 12)}
            />
          </g>
        );
      })}

      {/* 바뀐 조건이 이전 구조에 걸린다 */}
      <Trace
        pts={[
          [TABLE_RIGHT + 16, ROW_Y[1]],
          [X0 - 44, ROW_Y[1]],
        ]}
        stroke={color.inkSoft}
        width={stroke.thin}
        arrow
        progress={progress(frame, structAt - 6, 12)}
      />

      {/* ── 이전 구조 ── */}
      {struct > 0 ? (
        <g>
          <g {...enterSvg(frame, structAt, { distance: 8 })}>
            <Label x={X0} y={HEAD_Y} text={L.prev.title} weight={700} fill={color.ink} />
            <Label x={X0 + FW.w} y={HEAD_Y} text="PREV GEN" anchor="end" deco />
          </g>
          {/* 구조가 기준을 넘으면 테두리가 붉은 점선으로 바뀐다 */}
          <rect
            x={X0 - 22}
            y={FW.y - 20}
            width={FW.w + 44}
            height={NAND.y + NAND.h - FW.y + 40}
            fill={withAlpha(color.problem, 0.06 * over)}
            stroke={color.problem}
            strokeWidth={stroke.thin}
            strokeDasharray="10 8"
            opacity={over}
          />
          <BoxOutline b={FW} p={struct} tint={tint} dash="8 6" />
          <BoxOutline b={NAND} p={sub(struct, 0.2, 1)} tint={color.inkSoft} />
          <BoxOutline b={LDPC} p={sub(struct, 0.3, 1)} tint={color.inkSoft} />
          <g opacity={sub(struct, 0.5, 1)}>
            <Label x={FW.x + FW.w / 2} y={FW.y + FW.h / 2} text={L.prev.fw} anchor="middle" fill={color.ink} />
            <Label x={NAND.x + NAND.w / 2} y={MID_Y} text="NAND interface" anchor="middle" fill={color.ink} />
            <Label x={LDPC.x + LDPC.w / 2} y={MID_Y} text="LDPC decoder" anchor="middle" fill={color.ink} />
          </g>
          <Trace
            pts={[
              [NAND.x + NAND.w + 4, MID_Y],
              [LDPC.x - 4, MID_Y],
            ]}
            stroke={color.inkSoft}
            width={stroke.thin}
            arrow
            progress={sub(struct, 0.5, 1)}
          />
          {/* FW 왕복: 실패할 때마다 FW 로 올라갔다가 다시 내려온다 */}
          <Trace
            pts={[
              [UP_X + 26, LDPC.y - 4],
              [UP_X + 26, FW.y + FW.h + 4],
            ]}
            stroke={tint}
            arrow
            progress={progress(frame, structAt + 12, 12)}
          />
          <Trace
            pts={[
              [DOWN_X - 26, FW.y + FW.h + 4],
              [DOWN_X - 26, NAND.y - 4],
            ]}
            stroke={tint}
            arrow
            progress={progress(frame, structAt + 18, 12)}
          />
          {grow > 0 ? (
            <rect
              x={token.x - 9}
              y={token.y - 9}
              width={18}
              height={18}
              fill={interpolateColors(over, [0, 1], [color.ink, color.problem])}
              opacity={token.opacity}
            />
          ) : null}

          {/* 지연 막대와 기준선 */}
          <g opacity={sub(struct, 0.5, 1)}>
            <Label x={BAR.x} y={BAR.y - 20} text="P99.99" deco />
            <rect
              x={BAR.x}
              y={BAR.y}
              width={BAR.w}
              height={BAR.h}
              fill="none"
              stroke={color.line}
              strokeWidth={stroke.hair}
            />
            {latency > 0 ? (
              <rect
                x={BAR.x}
                y={BAR.y}
                width={latency}
                height={BAR.h}
                fill={tint}
                fillOpacity={0.3}
                stroke={tint}
                strokeWidth={stroke.thin}
              />
            ) : null}
            {latency > LIMIT_X - BAR.x ? (
              <rect
                x={LIMIT_X}
                y={BAR.y}
                width={latency - (LIMIT_X - BAR.x)}
                height={BAR.h}
                fill={color.problem}
                opacity={over}
              />
            ) : null}
            <line
              x1={LIMIT_X}
              x2={LIMIT_X}
              y1={BAR.y - 12}
              y2={BAR.y + BAR.h + 12}
              stroke={color.ink}
              strokeWidth={stroke.thin}
              strokeDasharray="6 5"
            />
            <Label x={LIMIT_X} y={BAR.y + BAR.h + 40} text={L.prev.limit} anchor="middle" />
          </g>
          <g {...enterSvg(frame, loadAt + 44, { from: "left", distance: 10 })}>
            <Label
              x={BAR.x + BAR.w}
              y={BAR.y + BAR.h + 40}
              text={L.prev.over}
              anchor="end"
              weight={700}
              fill={color.problem}
            />
          </g>
        </g>
      ) : null}
    </g>
  );
};
