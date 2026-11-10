// S3 전환 선언의 좌표와 시점. 좌표는 승인 스틸(design/a/s3.png, src/designs/a/scenes/S3.tsx) 그대로다.

import { f } from "../../anim";
import { S3 as content } from "../../content";
import { FRAME, size, space } from "../../theme";

// ── 도입 문구 ──────────────────────────────────────────────────────────
export const LEAD = { x: 136, y: 100 } as const;

// ── 핵심 문구 ──────────────────────────────────────────────────────────
export const HEAD = { x: 128, top: 182, px: size.hero } as const;

// ── 계단 단면: 디딤판 높이와 챌판 위치 ─────────────────────────────────
export const TREAD_Y = [914, 802, 690] as const;
export const RISER_X = [660, 1190] as const;
export const STEP_X = [136, 704, 1234] as const; // 각 단의 노드 x. 글자는 여기서 28px 오른쪽
export const FLOOR = FRAME.h - space.frame;
export const LEFT = space.frame;
export const RIGHT = FRAME.w - space.frame;
/** 각 단이 차지하는 가로 구간 */
export const STEP_SPAN: readonly (readonly [number, number])[] = [
  [LEFT, RISER_X[0]],
  [RISER_X[0], RISER_X[1]],
  [RISER_X[1], RIGHT],
];

// ── 청록 trace: 핵심 문구 밑줄 → 오른쪽 → 아래 → 세 번째 단 ────────────
export const RISE_X = 1720;
export const UNDER_Y = 482;
export const UNDER_X0 = 946; // "재설계"가 시작하는 x

// ── 도입 문구 옆의 기존 흐름과 덧붙인 조각 ─────────────────────────────
export const GHOST_Y = 128;
export const GHOST_X0 = 520;
export const GHOST_X1 = 1500;
export const GHOST_XS = [0, 1, 2, 3, 4, 5, 6].map(
  (i) => GHOST_X0 + 70 + ((GHOST_X1 - GHOST_X0 - 140) / 6) * i,
);
export const GHOST_ADDONS: readonly { at: number; side: 1 | -1 }[] = [
  { at: 1, side: -1 },
  { at: 3, side: 1 },
  { at: 4, side: -1 },
];

// ── 시점 (프레임) ──────────────────────────────────────────────────────
const lead = f(content.lead.at);
const headline = f(content.headline.at);
const ladder = f(content.ladder.at);

export const T = {
  lead,
  /** 기존 흐름의 선이 그려진다 */
  flow: lead + 6,
  /** 덧붙인 조각이 하나씩 붙는다 */
  addon: (i: number) => lead + 20 + i * 7,
  /** 흐름과 조각이 흐려진다. 핵심 문구가 나오기 직전에 끝난다 */
  dim: headline - 14,
  /** 조판 안내선 */
  guide: headline - 12,
  headline,
  ladder,
  /** k번째 단이 올라오기 시작한다 */
  step: (k: number) => ladder + 2 + k * 7,
  /** 청록 trace 가 그려지는 구간. 마지막 구간(세 번째 단의 윗선)은 그 단이 다 올라온 뒤에 그려진다 */
  trace: ladder,
  traceDur: 52,
} as const;
