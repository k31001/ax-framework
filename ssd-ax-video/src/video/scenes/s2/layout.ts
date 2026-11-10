// S2 문제의 좌표, 시점, 작업 조각의 움직임.
//
// 화면 구성
//   왼쪽 위   자막 (한 번에 하나)
//   가운데    7단계 흐름. 그 위에 개인 작업의 깜빡임과 쌓이는 작업 조각, 아래에 전체 길이의 치수선
//   왼쪽 아래 수치 (마지막에)

import { f } from "../../anim";
import { S2 as content, STAGES } from "../../content";
import { safe } from "../../theme";

export const CAPTION = { x: safe.left, y: 104 } as const;

// ── 7단계 흐름 ─────────────────────────────────────────────────────────
export const ROW = { x0: safe.left, x1: safe.right, y: 460 } as const;
export const COUNT = STAGES.length;
export const SLOT = (ROW.x1 - ROW.x0) / COUNT;
export const stageX = (i: number): number => ROW.x0 + SLOT * (i + 0.5);

/** 개인 작업이 빨라지는 단계 */
export const FAST: readonly number[] = [0, 1, 2, 5];
/** 작업 조각을 쏟아내는 단계 */
export const SOURCES: readonly number[] = [0, 1, 2];
/** 조각이 쌓이는 단계(검증과 통합)와 쌓이는 수 */
export const JAMS: readonly { stage: number; count: number }[] = [
  { stage: 3, count: 32 },
  { stage: 4, count: 16 },
];

// ── 치수선과 수치 ──────────────────────────────────────────────────────
export const DIM_Y = 610;
/** 검증 구간(두 단계)의 가로 범위 */
export const VERIFY = { x0: ROW.x0 + SLOT * 3, x1: ROW.x0 + SLOT * 5 } as const;
const total = ROW.x1 - ROW.x0;
const mid = (VERIFY.x0 + VERIFY.x1) / 2;
/** 전체 길이의 60% (굵은 띠) 와 70% (점선으로 더 뻗는 범위) */
export const SHARE = {
  core: [mid - total * 0.3, mid + total * 0.3] as const,
  outer: [mid - total * 0.35, mid + total * 0.35] as const,
};
export const BRACKET_Y = ROW.y + 76;
export const STAT = { x: safe.left, y: 690 } as const;

// ── 시점 (프레임) ──────────────────────────────────────────────────────
const c0 = f(content.captions[0].at);
const c1 = f(content.captions[1].at);
const stat = f(content.stat.at);

export const T = {
  caption: [c0, c1] as const,
  /** 흐름이 그려진다 */
  row: 2,
  rowDur: 30,
  /** 개인 작업의 깜빡임이 켜진다 */
  blink: c0 + 22,
  /** 깜빡임이 빨라지는 구간 */
  speedup: c0 + 34,
  speedupDur: 36,
  /** 전체 길이의 치수선 */
  dim: c0 + 50,
  /** 조각이 쏟아지기 시작한다 */
  emit: c1 + 6,
  emitStep: 1.5,
  stat,
  end: 360,
} as const;

// ── 작업 조각 ──────────────────────────────────────────────────────────
// 앞 단계의 점에서 나와 흐름을 따라 가다가, 쌓이는 자리에서 위로 올라가 칸에 놓인다.
export const PIECE = 16;
const PITCH = 24;
const COLS = 4;

export type Piece = {
  /** 나오는 프레임 */
  start: number;
  /** 움직이는 시간 */
  duration: number;
  /** 지나는 길: 나오는 점 → 흐름 위 → 칸 */
  from: number;
  x: number;
  y: number;
  /** 쌓이는 곳 (JAMS 의 순서) */
  jam: number;
};

const slotOf = (jam: number, order: number): { x: number; y: number } => {
  const col = order % COLS;
  const row = Math.floor(order / COLS);
  return { x: stageX(JAMS[jam].stage) - 32 - col * PITCH, y: ROW.y - 26 - row * PITCH };
};

const buildPieces = (): Piece[] => {
  const totalCount = JAMS.reduce((sum, j) => sum + j.count, 0);
  // 나오는 순서: 세 조각에 하나꼴로 뒤쪽 병목까지 간다.
  const raw: { start: number; from: number; jam: number }[] = [];
  const left = JAMS.map((j) => j.count);
  for (let k = 0; k < totalCount; k++) {
    let jam = k % 3 === 2 ? 1 : 0;
    if (left[jam] === 0) jam = 1 - jam;
    left[jam]--;
    raw.push({
      start: Math.round(T.emit + k * T.emitStep),
      from: stageX(SOURCES[(k + Math.floor(k / 3)) % SOURCES.length]),
      jam,
    });
  }
  // 도착하는 순서대로 아래 칸부터 채운다. 움직이는 시간은 거리에 비례하므로 칸을 정하기 전에 어림한다.
  const eta = (r: { start: number; from: number; jam: number }): number =>
    r.start + 10 + (stageX(JAMS[r.jam].stage) - r.from) / 44;
  const pieces: Piece[] = [];
  JAMS.forEach((_, jam) => {
    raw
      .filter((r) => r.jam === jam)
      .sort((a, b) => eta(a) - eta(b))
      .forEach((r, order) => {
        const slot = slotOf(jam, order);
        const length = slot.x - r.from + (ROW.y - slot.y);
        pieces.push({
          start: r.start,
          duration: Math.round(10 + length / 44),
          from: r.from,
          x: slot.x,
          y: slot.y,
          jam,
        });
      });
  });
  return pieces;
};

export const PIECES: Piece[] = buildPieces();
/** 조각이 모두 놓이는 프레임 */
export const PIECES_DONE = PIECES.reduce((m, p) => Math.max(m, p.start + p.duration), 0);
/** 쌓인 더미의 윗변 y. count 는 놓인 조각 수(소수 가능) */
export const pileTop = (count: number): number => ROW.y - 26 - (Math.ceil(count / COLS) - 1) * PITCH - PIECE / 2;
export const pileCenterX = (jam: number): number => stageX(JAMS[jam].stage) - 32 - ((COLS - 1) * PITCH) / 2;

/** frame 까지 그 더미에 놓인 조각 수. 놓이는 중인 조각은 소수로 센다. */
export const landedCount = (frame: number, jam: number): number => {
  let n = 0;
  for (const p of PIECES) {
    if (p.jam !== jam) continue;
    const t = (frame - (p.start + p.duration - 4)) / 4;
    n += t <= 0 ? 0 : t >= 1 ? 1 : t;
  }
  return n;
};
