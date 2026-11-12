import React from "react";
import { useCurrentFrame } from "remotion";
import { draw, ease, enterSvg, lerp, progress, sub } from "../../anim";
import { Trace, Via } from "../../components";
import { FIG } from "../../content";
import { color, sans, size, stroke, withAlpha } from "../../theme";
import { Label } from "./Label";

// S5-3 배경 그림: RTL 설계자가 받는 것. 본문 전체(1728×504)를 쓴다.
//   왼쪽   블록도 한 장(흐려진다)과 받는 사람(RTL 설계자, 호박색)
//   오른쪽 01 블록별 지연 예산: 기준 2 ms 를 꼬리 경로의 구간으로 나눈 막대. 구간의 합 + 여유 = 판정선 1.78 ms
//          02 interface 계약: 순서와 한계까지 적은 규칙
// 수치와 식별자는 docs/06-architecture-exploration.md 5.7 의 예시(BUD-RCV-001, HSI-RCV-010)다.

const L = FIG["S5-3"].handoff;
const TOP = 16;

// ── 왼쪽 ──
const SHEET = { x: 30, y: 16, w: 250, h: 190, fold: 26 } as const;
const BLOCKS = [
  { x: 24, y: 40, w: 54, h: 34 },
  { x: 112, y: 40, w: 54, h: 34 },
  { x: 112, y: 116, w: 54, h: 34 },
  { x: 190, y: 116, w: 40, h: 34 },
] as const;
const WHO_Y = 372;

// ── 오른쪽: 예산 막대 ──
const X0 = 440;
const BAR = { y: 84, h: 48, w: 1250 } as const;
const PX = BAR.w / L.budget.total; // px per ms
const STARTS = L.budget.parts.map((_, i) => L.budget.parts.slice(0, i).reduce((sum, p) => sum + p.ms, 0));
const USED = L.budget.parts.reduce((sum, p) => sum + p.ms, 0);
const LINE_X = X0 + L.budget.line.ms * PX;
/** 이름표: 위 단과 아래 단을 번갈아 쓴다. dx 는 구간 가운데에서 옮기는 거리(겹침을 피한다). */
const TAGS = [
  { tier: 1, anchor: "start", dx: -32 },
  { tier: 0, anchor: "middle", dx: 0 },
  { tier: 1, anchor: "middle", dx: 0 },
  { tier: 0, anchor: "middle", dx: 0 },
  { tier: 1, anchor: "middle", dx: 0 },
  { tier: 0, anchor: "middle", dx: 22 },
] as const;
const TIER_Y = [176, 222] as const;

// ── 오른쪽: 계약 ──
const CARD = { x: X0, y: 316, w: 980, h: 146 } as const;
const JOIN_X = X0 - 44;
const BAR_CY = BAR.y + BAR.h / 2;
const CARD_CY = CARD.y + CARD.h / 2;

const PackTitle: React.FC<{ n: string; text: string; y: number; at: number }> = ({ n, text, y, at }) => {
  const frame = useCurrentFrame();
  return (
    <g {...enterSvg(frame, at, { distance: 8 })}>
      <Label x={X0} y={y} text={n} deco weight={700} fill={color.human} />
      <Label x={X0 + 44} y={y} text={text} weight={700} fill={color.ink} />
    </g>
  );
};

export const Handoff: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const gone = progress(frame, out, 8, ease.in);
  if (gone >= 1) return null;

  const sheet = progress(frame, at + 2, 16);
  const faded = progress(frame, at + 38, 18); // 블록도는 물러난다
  const sheetTint = faded > 0.5 ? color.lineStrong : color.inkSoft;
  const whoAt = at + 40;
  const barAt = at + 60;
  const lineAt = barAt + L.budget.parts.length * 6 + 8;
  const cardAt = at + 108;
  const card = progress(frame, cardAt, 16);
  const right = SHEET.x + SHEET.w;

  return (
    <g opacity={1 - gone} transform={`translate(0 ${TOP})`}>
      {/* ── 블록도 한 장 ── */}
      <g opacity={lerp(1, 0.55, faded)}>
        <path
          d={`M ${SHEET.x} ${SHEET.y} H ${right - SHEET.fold} L ${right} ${SHEET.y + SHEET.fold} V ${SHEET.y + SHEET.h} H ${SHEET.x} Z`}
          fill={withAlpha(color.panel, 0.6 * sheet)}
          stroke={sheetTint}
          strokeWidth={stroke.thin}
          strokeLinejoin="round"
          pathLength={faded >= 1 ? undefined : 1}
          {...(faded >= 1 ? { strokeDasharray: "8 6" } : draw(sheet))}
        />
        <g opacity={sub(sheet, 0.4, 1)} stroke={sheetTint} strokeWidth={stroke.hair} fill="none">
          {BLOCKS.map((b, i) => (
            <rect key={i} x={SHEET.x + b.x} y={SHEET.y + b.y} width={b.w} height={b.h} />
          ))}
          <path
            d={`M ${SHEET.x + 78} ${SHEET.y + 57} H ${SHEET.x + 112} M ${SHEET.x + 139} ${SHEET.y + 74} V ${SHEET.y + 116} M ${SHEET.x + 166} ${SHEET.y + 133} H ${SHEET.x + 190}`}
          />
        </g>
        <g {...enterSvg(frame, at + 6, { distance: 8 })}>
          <Label x={SHEET.x} y={SHEET.y + SHEET.h + 32} text={L.sheet} fill={faded > 0.5 ? color.inkDim : color.inkSoft} />
        </g>
      </g>

      {/* ── 받는 사람 ── */}
      <g {...enterSvg(frame, whoAt, { distance: 8 })}>
        <g
          transform={`translate(${SHEET.x} ${WHO_Y - 20})`}
          fill="none"
          stroke={color.human}
          strokeWidth={2.5}
          strokeLinecap="square"
        >
          <circle cx={20} cy={12.5} r={6.7} />
          <path d="M5.8 36 v-4.2 a8.3 8.3 0 0 1 8.3 -8.3 h11.8 a8.3 8.3 0 0 1 8.3 8.3 V36" />
        </g>
        <Label x={SHEET.x + 54} y={WHO_Y} text={L.to} px={size.body} weight={700} fill={color.human} />
      </g>
      <Trace
        pts={[
          [X0 - 8, BAR_CY],
          [JOIN_X, BAR_CY],
          [JOIN_X, WHO_Y],
          [SHEET.x + 264, WHO_Y],
        ]}
        stroke={color.human}
        arrow
        progress={progress(frame, barAt + 4, 26, ease.inOut)}
      />
      <Trace
        pts={[
          [X0 - 8, CARD_CY],
          [JOIN_X, CARD_CY],
        ]}
        stroke={color.human}
        progress={progress(frame, cardAt + 4, 10)}
      />
      <Via x={JOIN_X} y={CARD_CY} stroke={color.human} p={progress(frame, cardAt + 12, 8)} />

      {/* ── 01 블록별 지연 예산 ── */}
      <PackTitle n="01" text={L.budget.title} y={24} at={barAt - 8} />
      <rect
        x={X0}
        y={BAR.y}
        width={BAR.w * progress(frame, barAt - 4, 16)}
        height={BAR.h}
        fill="none"
        stroke={color.line}
        strokeWidth={stroke.hair}
      />
      {L.budget.parts.map((part, i) => {
        const p = progress(frame, barAt + i * 6, 12);
        if (p <= 0) return null;
        const x = X0 + STARTS[i] * PX;
        const w = part.ms * PX;
        const tag = TAGS[i];
        const cx = x + w / 2;
        const ty = TIER_Y[tag.tier];
        const tx = cx + tag.dx;
        return (
          <g key={part.name}>
            <rect
              x={x}
              y={BAR.y}
              width={w * p}
              height={BAR.h}
              fill={withAlpha(color.ink, i % 2 === 0 ? 0.2 : 0.1)}
              stroke={color.inkSoft}
              strokeWidth={stroke.thin}
            />
            <g opacity={sub(p, 0.4, 1)}>
              <line
                x1={cx}
                x2={cx}
                y1={BAR.y + BAR.h + 4}
                y2={ty - 20}
                stroke={color.lineStrong}
                strokeWidth={stroke.hair}
              />
              <text
                x={tx}
                y={ty}
                textAnchor={tag.anchor}
                dominantBaseline="central"
                style={{ fontFamily: sans(size.small).fontFamily }}
              >
                <Tag name={part.name} ms={part.ms} />
              </text>
            </g>
          </g>
        );
      })}
      {/* 여유: 빗금 */}
      {(() => {
        const p = progress(frame, lineAt - 6, 12);
        if (p <= 0) return null;
        const x = X0 + USED * PX;
        const w = L.budget.margin * PX;
        return (
          <g opacity={p}>
            <rect x={x} y={BAR.y} width={w} height={BAR.h} fill="none" stroke={color.inkSoft} strokeWidth={stroke.hair} />
            {Array.from({ length: 6 }, (_, k) => (
              <line
                key={k}
                x1={x + 4 + k * 12}
                x2={x + 4 + k * 12 + 10}
                y1={BAR.y + BAR.h - 4}
                y2={BAR.y + 4}
                stroke={color.inkSoft}
                strokeWidth={stroke.hair}
                opacity={x + 14 + k * 12 <= x + w ? 1 : 0}
              />
            ))}
          </g>
        );
      })()}
      {/* 판정선과 기준 */}
      {(() => {
        const p = progress(frame, lineAt, 14);
        if (p <= 0) return null;
        return (
          <g opacity={p}>
            <line
              x1={LINE_X}
              x2={LINE_X}
              y1={BAR.y - 16}
              y2={BAR.y + BAR.h + 16}
              stroke={color.ink}
              strokeWidth={stroke.trace}
              strokeDasharray="7 5"
            />
            <Label x={LINE_X - 12} y={BAR.y - 30} text={L.budget.line.text} anchor="end" weight={700} fill={color.ink} />
            <line
              x1={X0 + BAR.w}
              x2={X0 + BAR.w}
              y1={BAR.y - 16}
              y2={BAR.y + BAR.h + 16}
              stroke={color.lineStrong}
              strokeWidth={stroke.thin}
            />
            <Label x={X0 + BAR.w} y={BAR.y - 30} text={L.budget.limit} anchor="end" fill={color.inkDim} />
          </g>
        );
      })()}

      {/* ── 02 interface 계약 ── */}
      <PackTitle n="02" text={L.contract.title} y={CARD.y - 30} at={cardAt - 6} />
      {card > 0 ? (
        <g>
          <rect
            x={CARD.x}
            y={CARD.y}
            width={CARD.w}
            height={CARD.h}
            fill={withAlpha(color.human, 0.06 * card)}
            stroke={color.human}
            strokeWidth={stroke.trace}
            {...(card < 1 ? draw(card, 2 * (CARD.w + CARD.h)) : {})}
          />
          <g opacity={sub(card, 0.4, 1)}>
            <rect x={CARD.x + CARD.w - 236} y={CARD.y - 16} width={212} height={32} fill={color.bg} />
            <Label x={CARD.x + CARD.w - 130} y={CARD.y} text={L.contract.id} anchor="middle" deco weight={700} />
          </g>
          {L.contract.rules.map((rule, i) => {
            const y = CARD.y + 46 + i * 54;
            return (
              <g key={rule.key} {...enterSvg(frame, cardAt + 10 + i * 8, { from: "left", distance: 10 })}>
                <Label x={CARD.x + 28} y={y} text={rule.key} code fill={color.human} />
                <Label x={CARD.x + 150} y={y} text={rule.text} fill={color.ink} />
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
};

/** 구간 이름과 값(ms). <text> 안에 넣는다. */
const Tag: React.FC<{ name: string; ms: number }> = ({ name, ms }) => {
  const font = { fontSize: size.small, letterSpacing: "-0.012em" } as const;
  return (
    <>
      <tspan fill={color.inkSoft} style={{ ...font, fontWeight: 600 }}>
        {name}
      </tspan>
      <tspan dx={10} fill={color.ink} style={{ ...font, fontWeight: 700 }}>
        {ms.toFixed(2)}
      </tspan>
    </>
  );
};
