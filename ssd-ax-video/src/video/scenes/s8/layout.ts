import { f } from "../../anim";
import type { Pt } from "../../components";
import { S8 as content } from "../../content";
import { FRAME, space } from "../../theme";

// S8 의 배치와 시간. S3 의 3단 계단과 같은 모양(왼쪽 아래에서 오른쪽 위로 올라가는 단면)이다.

export const LEFT = space.frame;
export const RIGHT = FRAME.w - space.frame;
export const FLOOR = FRAME.h - space.frame;

export const TREAD_Y = [800, 620, 440] as const; // 디딤판 높이
export const RISER_X = [620, 1200] as const; // 챌판 위치
export const NODE_X = [176, 664, 1244] as const; // 각 단의 노드
export const TEXT_DX = 28; // 노드에서 글자까지

/** 계단 trace 의 세 토막. 단계가 나올 때마다 한 토막씩 그려진다. */
export const SEGMENTS: readonly (readonly Pt[])[] = [
  [
    [LEFT, TREAD_Y[0]],
    [RISER_X[0], TREAD_Y[0]],
  ],
  [
    [RISER_X[0], TREAD_Y[0]],
    [RISER_X[0], TREAD_Y[1]],
    [RISER_X[1], TREAD_Y[1]],
  ],
  [
    [RISER_X[1], TREAD_Y[1]],
    [RISER_X[1], TREAD_Y[2]],
    [RIGHT, TREAD_Y[2]],
  ],
];

/** 각 단 아래의 단면(빗금) */
export const GROUND = [
  { x: LEFT, y: TREAD_Y[0], w: RISER_X[0] - LEFT, h: FLOOR - TREAD_Y[0] },
  { x: RISER_X[0], y: TREAD_Y[1], w: RISER_X[1] - RISER_X[0], h: FLOOR - TREAD_Y[1] },
  { x: RISER_X[1], y: TREAD_Y[2], w: RIGHT - RISER_X[1], h: FLOOR - TREAD_Y[2] },
] as const;

// 열매: 1단계 위에서 나와 그 아래에 심긴다. 거기서 trace 가 자라 2단계의 노드로 올라간다.
export const SEED = { x: 120, y0: TREAD_Y[0] - 46, y1: TREAD_Y[0] + 84 } as const;
export const SPROUT: readonly Pt[] = [
  [SEED.x + 10, SEED.y1],
  [NODE_X[1], SEED.y1],
  [NODE_X[1], TREAD_Y[1] + 12],
];

// ── 시간 (프레임) ──────────────────────────────────────────────────────
export const stepAt = (i: number): number => f(content.stepsAt + content.stepGap * i);

const CLOSING = f(content.closing.at);
export const AT = {
  title: f(0.3),
  reference: f(content.reference.at),
  seed: CLOSING - 10, // 열매가 다시 나온다
  plant: CLOSING - 6, // 1단계 아래로 내려가 심긴다
  closing: CLOSING,
  sprout: CLOSING + 14, // trace 가 자란다
  reach: CLOSING + 40, // 2단계에 닿는다
} as const;
