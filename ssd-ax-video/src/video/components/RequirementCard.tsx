import React from "react";
import { interpolateColors } from "remotion";
import { clamp01, draw, sub } from "../anim";
import { color, fullSvg, mono, pad2, sans, size, stroke, withAlpha } from "../theme";
import { Trace } from "./Trace";
import type { Pt } from "./Trace";

// 요구사항 카드: 도면의 spec sheet처럼 칸으로 나뉜 표제란.
//   1행  ID · 수용 기준
//   2행  제목
//   3행  기록 슬롯 7칸 + 방금 붙은 기록의 이름
// 슬롯은 단계마다 하나씩 채워진다. 이름은 가장 최근에 붙은 기록 하나만 글자로 보여 준다
// (일곱 개를 다 글자로 쓰면 읽을 수 없다).

export type RequirementCardData = { id: string; title: string; criterion: string };

const ROW_ID = 52;
const ROW_TITLE = 62;
const ROW_RECORDS = 56;
export const CARD_HEIGHT = ROW_ID + ROW_TITLE + ROW_RECORDS + 3;
export const CARD_WIDTH = 630;

const PAD_X = 20;
const SLOT = 26;
const SLOT_GAP = 7;

/** 카드의 왼쪽 위를 (0,0)으로 한 n번째(0부터) 기록 슬롯의 중심. 그림이 기록과 이어질 때 쓴다. */
export const recordSlotCenter = (slot: number): { x: number; y: number } => ({
  x: PAD_X + slot * (SLOT + SLOT_GAP) + SLOT / 2,
  y: ROW_ID + ROW_TITLE + 2 + ROW_RECORDS / 2,
});

const Slot: React.FC<{ fill: number; pending: number; flash: number }> = ({ fill, pending, flash }) => {
  const tint = interpolateColors(flash, [0, 1], [color.inkSoft, color.agent]);
  return (
    <svg width={SLOT} height={SLOT} viewBox={`0 0 ${SLOT} ${SLOT}`} style={{ flex: "none", overflow: "visible" }}>
      {/* 빈 칸. 다음에 채워질 칸은 청록 점선 */}
      <rect
        x={1}
        y={1}
        width={SLOT - 2}
        height={SLOT - 2}
        fill="none"
        stroke={interpolateColors(pending, [0, 1], [color.lineStrong, color.agent])}
        strokeWidth={stroke.thin}
        strokeDasharray="4 4"
        opacity={1 - fill}
      />
      {/* 채워진 칸 */}
      {fill > 0 ? (
        <>
          <rect
            x={1}
            y={1}
            width={SLOT - 2}
            height={SLOT - 2}
            fill={flash > 0 ? color.agent : color.inkSoft}
            fillOpacity={0.1 + 0.14 * flash}
            stroke={tint}
            strokeWidth={stroke.thin}
            opacity={sub(fill, 0, 0.5)}
          />
          <path
            d="M6.5 13.5 11 18 19.5 8"
            fill="none"
            stroke={tint}
            strokeWidth={stroke.trace}
            pathLength={1}
            {...draw(sub(fill, 0.3, 1))}
          />
        </>
      ) : null}
    </svg>
  );
};

const RecordName: React.FC<{ index: number; name: string; p: number; flash: number; leaving?: boolean }> = ({
  index,
  name,
  p,
  flash,
  leaving,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      gap: 12,
      opacity: p,
      translate: `0px ${(leaving ? -1 : 1) * (1 - p) * 10}px`,
    }}
  >
    <div style={{ ...mono(size.label, 700), color: interpolateColors(flash, [0, 1], [color.inkDim, color.agent]) }}>
      {pad2(index + 1)}
    </div>
    <div
      style={{
        ...sans(size.small, 600),
        whiteSpace: "nowrap",
        color: interpolateColors(flash, [0, 1], [color.inkSoft, color.ink]),
      }}
    >
      {name}
    </div>
  </div>
);

export const RequirementCard: React.FC<{
  card: RequirementCardData;
  left: number;
  top: number;
  width?: number;
  /** 카드가 올라타 있는 진행 표시 위의 점. 카드 아래에서 이 점까지 직각 연결선을 긋는다. */
  anchor?: { x: number; y: number };
  /** 단계별 기록 이름. 슬롯 수는 이 배열의 길이다. */
  records: readonly string[];
  /** 붙은 기록의 수. 소수부는 지금 붙고 있는 기록의 진행이다. 예: 3.4 는 네 번째 기록이 40% 붙었다. */
  attached: number;
  /** 다음 기록이 붙을 칸(0부터)을 청록 점선으로 표시한다. */
  pending?: number;
  /** 그 표시의 세기 0~1. 씬이 시작될 때 서서히 켠다. */
  pendingStrength?: number;
  /** 방금 붙은 기록의 강조 0~1. 붙은 직후 1 이었다가 0 으로 가라앉는다. */
  flash?: number;
  /** 카드가 처음 만들어지는 정도 0~1. 테두리가 그려지고 칸이 차례로 나타난다. */
  appear?: number;
}> = ({
  card,
  left,
  top,
  width = CARD_WIDTH,
  anchor,
  records,
  attached,
  pending,
  pendingStrength = 1,
  flash = 0,
  appear = 1,
}) => {
  const rule = `${stroke.hair}px solid ${color.line}`;
  const bottom = top + CARD_HEIGHT;
  const cx = left + width / 2;
  const outline = 2 * (width + CARD_HEIGHT);

  const whole = Math.floor(attached + 1e-6);
  const frac = attached - whole;
  const attaching = frac > 1e-6;
  const latest = attaching ? whole : whole - 1; // 이름으로 보여 줄 기록

  let link: Pt[] | null = null;
  if (anchor) {
    const midY = bottom + (anchor.y - bottom) * 0.45;
    link =
      Math.abs(anchor.x - cx) < 1
        ? [
            [cx, bottom],
            [cx, anchor.y],
          ]
        : [
            [cx, bottom],
            [cx, midY],
            [anchor.x, midY],
            [anchor.x, anchor.y],
          ];
  }

  return (
    <>
      <svg {...fullSvg}>
        {link ? (
          <>
            <Trace pts={link} stroke={color.agent} chamfer={6} progress={sub(appear, 0.6, 1)} />
            <rect
              x={cx - 5}
              y={bottom - 5}
              width={10}
              height={10}
              fill={color.agent}
              opacity={sub(appear, 0.55, 0.7)}
            />
          </>
        ) : null}
      </svg>

      <div
        style={{
          position: "absolute",
          left,
          top,
          width,
          height: CARD_HEIGHT,
          boxSizing: "border-box",
          padding: 1.5,
          backgroundColor: withAlpha(color.panel, sub(appear, 0, 0.5)),
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ID · 수용 기준 */}
        <div
          style={{
            height: ROW_ID,
            display: "flex",
            alignItems: "stretch",
            borderBottom: rule,
            opacity: sub(appear, 0.2, 0.6),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: `0 ${PAD_X}px`,
              borderRight: rule,
              ...mono(size.small, 700),
              color: color.ink,
            }}
          >
            {card.id}
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: `0 ${PAD_X}px`,
              ...mono(size.small, 500),
              wordSpacing: "-0.28em",
              color: color.inkSoft,
            }}
          >
            {card.criterion}
          </div>
        </div>

        {/* 제목 */}
        <div
          style={{
            height: ROW_TITLE,
            display: "flex",
            alignItems: "center",
            padding: `0 ${PAD_X}px`,
            borderBottom: rule,
            ...sans(size.body, 700),
            whiteSpace: "nowrap",
            opacity: sub(appear, 0.35, 0.75),
          }}
        >
          {card.title}
        </div>

        {/* 기록 */}
        <div
          style={{
            height: ROW_RECORDS,
            display: "flex",
            alignItems: "center",
            padding: `0 ${PAD_X}px`,
            opacity: sub(appear, 0.5, 0.9),
            // 기록이 붙는 순간 이 칸이 잠깐 밝아졌다가 가라앉는다.
            backgroundColor: withAlpha(color.agent, 0.14 * (attaching ? sub(frac, 0, 0.5) : flash)),
          }}
        >
          <div style={{ display: "flex", gap: SLOT_GAP }}>
            {records.map((name, i) => (
              <Slot
                key={name}
                fill={clamp01(attached - i)}
                pending={pending === i ? pendingStrength : 0}
                flash={i === latest ? Math.max(flash, attaching ? 1 : 0) : 0}
              />
            ))}
          </div>
          <div style={{ position: "relative", flex: 1, alignSelf: "stretch", marginLeft: 22 }}>
            {attaching && whole >= 1 ? (
              <RecordName index={whole - 1} name={records[whole - 1]} p={1 - sub(frac, 0, 0.4)} flash={0} leaving />
            ) : null}
            {latest >= 0 && latest < records.length ? (
              <RecordName
                index={latest}
                name={records[latest]}
                p={attaching ? sub(frac, 0.35, 1) : 1}
                flash={attaching ? 1 : flash}
              />
            ) : null}
          </div>
        </div>

        {/* 테두리: 왼쪽 위에서 시작해 한 바퀴 그려진다 */}
        <svg
          width={width}
          height={CARD_HEIGHT}
          viewBox={`0 0 ${width} ${CARD_HEIGHT}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <rect
            x={1}
            y={1}
            width={width - 2}
            height={CARD_HEIGHT - 2}
            fill="none"
            stroke={color.inkSoft}
            strokeWidth={stroke.thin}
            {...(appear < 1 ? draw(sub(appear, 0, 0.7), outline) : {})}
          />
        </svg>
      </div>
    </>
  );
};
