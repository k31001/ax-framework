import React from "react";
import { FRAME, color, mono, sans, size, stroke } from "../theme";

// 요구사항 카드: 도면의 spec sheet처럼 칸으로 나뉜 표제란.
// 맨 아래 칸에는 앞 단계에서 붙은 기록이 차례로 놓이고,
// 마지막의 빈 점선 칸은 이번 단계가 끝나면 붙을 기록의 자리다.

export type RequirementCardData = {
  id: string;
  title: string;
  criterion: string;
  records: readonly string[];
};

const ROW_ID = 52;
const ROW_TITLE = 62;
const ROW_RECORDS = 56;
export const CARD_HEIGHT = ROW_ID + ROW_TITLE + ROW_RECORDS + 3;

export const RequirementCard: React.FC<{
  card: RequirementCardData;
  left: number;
  top: number;
  width: number;
  /** 카드가 올라타 있는 진행 표시 위의 점. 카드 아래에서 이 점까지 가는 선을 긋는다. */
  anchor?: { x: number; y: number };
  /** 다음 기록이 붙을 빈 칸을 보여 준다. */
  pendingSlot?: boolean;
}> = ({ card, left, top, width, anchor, pendingSlot = true }) => {
  const border = `${stroke.thin}px solid ${color.inkSoft}`;
  const rule = `${stroke.hair}px solid ${color.line}`;
  const bottom = top + CARD_HEIGHT;

  return (
    <>
      {anchor ? (
        <svg
          width={FRAME.w}
          height={FRAME.h}
          viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
          style={{ position: "absolute", inset: 0 }}
        >
          <line
            x1={anchor.x}
            x2={anchor.x}
            y1={bottom}
            y2={anchor.y}
            stroke={color.agent}
            strokeWidth={stroke.trace}
          />
          <rect x={anchor.x - 5} y={bottom - 5} width={10} height={10} fill={color.agent} />
        </svg>
      ) : null}

      <div
        style={{
          position: "absolute",
          left,
          top,
          width,
          height: CARD_HEIGHT,
          boxSizing: "border-box",
          border,
          backgroundColor: color.panel,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ID · 수용 기준 */}
        <div style={{ height: ROW_ID, display: "flex", alignItems: "stretch", borderBottom: rule }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
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
              padding: "0 20px",
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
            padding: "0 20px",
            borderBottom: rule,
            ...sans(size.body, 700),
            whiteSpace: "nowrap",
          }}
        >
          {card.title}
        </div>

        {/* 기록 */}
        <div style={{ height: ROW_RECORDS, display: "flex", alignItems: "center", padding: "0 20px", gap: 22 }}>
          {card.records.map((record) => (
            <div key={record} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width={18} height={18} viewBox="0 0 18 18" style={{ flex: "none" }}>
                <path
                  d="M2.5 9.5 7 14 15.5 4"
                  fill="none"
                  stroke={color.inkSoft}
                  strokeWidth={stroke.trace}
                />
              </svg>
              <div style={{ ...sans(size.small, 500), color: color.inkSoft, whiteSpace: "nowrap" }}>
                {record}
              </div>
            </div>
          ))}
          {pendingSlot ? (
            <div
              style={{
                flex: 1,
                minWidth: 40,
                height: 30,
                boxSizing: "border-box",
                border: `${stroke.thin}px dashed ${color.lineStrong}`,
              }}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};
