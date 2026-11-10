// 사례 7단계(S5-1 ~ S5-7)의 배치 설정.
// 글자 폭을 재지 않는다. 항목마다 열 위치(x)와 폭(w)을 여기에 적고, 글자는 상자 안에서 두 줄까지 놓인다.
// 문구가 바뀌어 넘치면 이 파일의 x, w, br 을 고친다.
//
// 화면의 세로 구성 (1920×1080)
//    72 ~ 245   머리: 왼쪽 단계 제목 · 가운데 요구사항 카드 · 오른쪽 "현재"
//   292         7단계 진행 표시 (이름은 314 ~ 352)
//   392 ~       본문: 두 줄 흐름도 + 그림 자리
//   874 ~ 1008  원칙 띠 (있는 단계만)

import type { Box, FlowGeometry, FlowSlot } from "../components/Flow";
import { DEFAULT_FLOW_GEOMETRY } from "../components/Flow";
import type { PrincipleIcon } from "../components/PrincipleStrip";
import { PRINCIPLE_NAME_W } from "../components/PrincipleStrip";
import { CARD_HEIGHT, CARD_WIDTH, recordSlotCenter } from "../components/RequirementCard";
import { stageX } from "../components/StageTrack";
import { safe } from "../theme";

// ── 머리 ───────────────────────────────────────────────────────────────
export const TITLE_POS = { x: safe.left, y: 96 } as const;
export const TRACK_Y = 292;
export const CARD_TOP = safe.top;
export const STAGE_COUNT = 7;

// 카드는 단계가 넘어갈 때마다 오른쪽으로 한 칸씩 옮겨 가고, 카드 아래의 연결선이 그 단계의 점에 닿는다.
// 왼쪽의 단계 제목과 오른쪽의 "현재" 블록 사이에서만 움직일 수 있어 한 칸은 44px 이다.
// 4번째 단계(S5-4)에서 카드가 점 바로 위(화면 가운데)에 온다.
const CARD_STEP = 44;

/** 단계 index(0~6)에서 요구사항 카드가 놓이는 사각형. 소수면 두 단계 사이. */
export const cardRect = (index: number): Box => ({
  x: 960 + (index - 3) * CARD_STEP - CARD_WIDTH / 2,
  y: CARD_TOP,
  w: CARD_WIDTH,
  h: CARD_HEIGHT,
});

/** 카드의 연결선이 닿는 진행 표시 위의 점 */
export const cardAnchor = (index: number): { x: number; y: number } => ({
  x: stageX(index, STAGE_COUNT),
  y: TRACK_Y - 14,
});

/** 단계 index 에서 n번째(0부터) 기록 슬롯의 중심 (화면 좌표) */
export const recordSlotAt = (index: number, slot: number): { x: number; y: number } => {
  const card = cardRect(index);
  const c = recordSlotCenter(slot);
  return { x: card.x + c.x, y: card.y + c.y };
};

// ── 본문 ───────────────────────────────────────────────────────────────
export type StageLayout = {
  /** 두 줄의 자리 */
  flow: FlowGeometry;
  /** 흐름도 항목의 자리. before·note 를 뺀 beat 순서대로 적는다. */
  slots: FlowSlot[];
  /** 해결에서 문제로 되돌아가는 폐루프 점선 */
  loopback?: { y: number };
  /** "현재" 한 줄 */
  before: {
    /** 블록의 폭(머리 쪽 크기 기준). 가장 긴 줄보다 조금 넓게 */
    w: number;
    /** 둘째 줄이 시작하는 낱말의 순서. 없으면 한 줄 */
    br?: number;
    /** 본문 자리: 키운 블록의 왼쪽 x 와 세로 중심 y */
    x: number;
    cy: number;
  };
  /** 그림이 쓸 수 있는 사각형 */
  illustration: Box;
  /** 원칙 띠 */
  strip?: Box;
  principleIcon?: PrincipleIcon;
  /** 강조 문구(note) */
  note?: Box;
  /** 마무리 문구(closing) */
  closing?: Box;
};

const G = DEFAULT_FLOW_GEOMETRY;
const BODY_BOTTOM = safe.bottom;
const STRIP = { y: 874, h: 134 } as const;

// 원칙 띠가 없는 단계: 줄 바탕을 본문 아래 끝까지 내리고 두 줄을 그 가운데에 놓는다.
const TALL: FlowGeometry = { ...G, agentY: 556, humanY: 728, flagY: 448, bottom: BODY_BOTTOM };

/** 두 줄 사이 경계선의 y. "현재" 한 줄은 본문에서 이 높이를 중심으로 놓인다. */
const splitY = (g: FlowGeometry): number => (g.agentY + g.rowH + g.humanY) / 2;
const BEFORE_X = 244; // 흐름도 상자가 시작하는 열

/** 흐름도를 왼쪽으로 좁히고 오른쪽을 그림에 주는 단계의 그림 자리 */
const rightColumn = (flowRight: number): Box => ({
  x: flowRight + 40,
  y: G.top,
  w: safe.right - flowRight - 40,
  h: BODY_BOTTOM - G.top,
});

export const STAGE_LAYOUT: Record<string, StageLayout> = {
  // 항목 2개. 흐름도는 왼쪽, 그림은 오른쪽 넓게.
  "S5-1": {
    flow: { ...TALL, right: 744, stripRight: 744 },
    slots: [
      { type: "step", x: 244, w: 312, br: 4 },
      { type: "step", x: 412, w: 312, br: 3 },
    ],
    before: { x: BEFORE_X, cy: splitY(TALL), w: 264, br: 3 },
    illustration: rightColumn(744),
  },

  // 항목 4개(문제·해결 포함).
  "S5-2": {
    flow: { ...TALL, right: 784, stripRight: 784 },
    slots: [
      { type: "step", x: 244, w: 328, br: 3 },
      { type: "step", x: 380, w: 384, br: 4 },
      { type: "problem", x: 690, flag: { x: 244, w: 524 } },
      { type: "gate", x: 804, w: 300, br: [3, 6] },
    ],
    before: { x: BEFORE_X, cy: splitY(TALL), w: 284 },
    illustration: rightColumn(1104),
  },

  // 항목 4개 + 원칙(이름만). 원칙 띠는 흐름도 폭만큼만 쓰고, 그림은 아래까지 내려온다.
  "S5-3": {
    flow: { ...G, right: 884, stripRight: 884 },
    slots: [
      { type: "step", x: 244, w: 440, br: 2 },
      { type: "step", x: 404, w: 384, br: 5 },
      { type: "problem", x: 846, flag: { x: 476, w: 398 } },
      { type: "gate", x: 904, w: 304, br: [2, 4] },
    ],
    before: { x: BEFORE_X, cy: splitY(G), w: 344, br: 2 },
    illustration: rightColumn(1208),
    strip: { x: safe.left, y: STRIP.y, w: 1208 - safe.left, h: STRIP.h },
    principleIcon: "source",
  },

  // 항목 7개 + 원칙(수치). 승인 스틸(design/a/s5-4.png)의 좌표 그대로.
  // 그림은 흐름도 위쪽 띠의 오른쪽(깃발 옆).
  "S5-4": {
    flow: { ...G, right: 1504 },
    slots: [
      { type: "step", x: 244, w: 384, br: 4 },
      { type: "step", x: 414, w: 284, br: 2 },
      { type: "problem", x: 756, flag: { x: 244, w: 540 } },
      { type: "step", x: 814, w: 272 },
      { type: "step", x: 1122, w: 362, br: 2 },
      { type: "step", x: 1148, w: 336 },
      { type: "gate", x: 1524, w: 300, br: [3, 5] },
    ],
    loopback: { y: 848 },
    before: { x: BEFORE_X, cy: splitY(G), w: 378 },
    illustration: { x: 804, y: 392, w: 1020, h: 120 },
    strip: { x: safe.left, y: STRIP.y, w: safe.right - safe.left, h: STRIP.h },
    principleIcon: "loop",
  },

  // 항목 6개, 원칙 없음. 두 줄을 아래로 내려 위쪽 띠를 키우고 그 오른쪽을 그림에 준다.
  "S5-5": {
    flow: { ...G, agentY: 704, humanY: 876, bottom: BODY_BOTTOM, right: 1486, flagY: 596 },
    slots: [
      { type: "step", x: 244, w: 450, br: 4 },
      { type: "problem", x: 748, flag: { x: 180, w: 596 } },
      { type: "step", x: 802, w: 292, br: 4 },
      { type: "step", x: 1126, w: 340, br: 2 },
      { type: "step", x: 1062, w: 404, br: 5 },
      { type: "gate", x: 1506, w: 318, br: 2 },
    ],
    before: { x: BEFORE_X, cy: 850, w: 360, br: 4 },
    illustration: { x: 812, y: 400, w: 1012, h: 280 },
  },

  // 항목 3개.
  "S5-6": {
    flow: { ...TALL, right: 1122, stripRight: 1122 },
    slots: [
      { type: "step", x: 244, w: 444, br: 2 },
      { type: "step", x: 456, w: 388, br: 4 },
      { type: "step", x: 730, w: 372, br: 2 },
    ],
    before: { x: BEFORE_X, cy: splitY(TALL), w: 264, br: 4 },
    illustration: rightColumn(1122),
  },

  // 항목 5개 + 강조 문구 + 원칙(이름만) + 마무리.
  // 아래쪽 띠 자리를 강조 문구가 먼저 쓰고, 원칙이 나오기 전에 비켜 준다. 마무리 문구는 원칙 띠의 오른쪽 칸.
  "S5-7": {
    flow: { ...G, right: 1248, stripRight: 1248 },
    slots: [
      { type: "problem", x: 292, flag: { x: 264, w: 752 } },
      { type: "step", x: 350, w: 360, br: 5 },
      { type: "step", x: 556, w: 304, br: 3 },
      { type: "step", x: 884, w: 268 },
      { type: "step", x: 1016, w: 212 },
    ],
    before: { x: BEFORE_X, cy: splitY(G), w: 392 },
    illustration: rightColumn(1248),
    strip: { x: safe.left, y: STRIP.y, w: 1248 - safe.left, h: STRIP.h },
    principleIcon: "chain",
    note: { x: safe.left, y: STRIP.y, w: 1248 - safe.left, h: STRIP.h },
    closing: {
      x: safe.left + PRINCIPLE_NAME_W + 36,
      y: STRIP.y,
      w: 1248 - safe.left - PRINCIPLE_NAME_W - 36,
      h: STRIP.h,
    },
  },
};

export const stageLayout = (id: string): StageLayout => {
  const layout = STAGE_LAYOUT[id];
  if (!layout) throw new Error(`no stage layout: ${id}`);
  return layout;
};

/** 단계별 그림 자리 (화면 좌표) */
export const illustrationBox = (id: string): Box => stageLayout(id).illustration;
