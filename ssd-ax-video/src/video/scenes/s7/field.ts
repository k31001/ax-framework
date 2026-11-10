import { f } from "../../anim";
import { S7 as content } from "../../content";
import { safe } from "../../theme";

// S7 의 점 격자: 주입한 bug 806개. 그중 21%(169개)가 "완료" 뒤에도 붉게 남는다.
// 어느 점이 남는지는 점 번호의 해시로 정한다. 렌더할 때마다 같다.

export const COLS = 31; // 806 = 31 × 26
export const PITCH = 21;
export const DOT_R = 4.5;
const PAD = 20; // 점과 테두리 사이

const count = content.stat.injected;
export const ROWS = Math.ceil(count / COLS);
export const MISSED_COUNT = Math.round((count * content.stat.missedPercent) / 100);

// 테두리(완료 표식이 둘러싸는 사각형)
const BOX_W = (COLS - 1) * PITCH + PAD * 2;
const BOX_H = (ROWS - 1) * PITCH + PAD * 2;
export const BOX = { x: safe.right - BOX_W, y: 172, w: BOX_W, h: BOX_H } as const;

/** 정수 → 0~1. 결정적이다. */
const hash = (n: number): number => {
  let x = Math.imul(n + 1, 0x9e3779b1);
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

export type Dot = { x: number; y: number; col: number; row: number; missed: boolean };

const ranked = Array.from({ length: count }, (_, i) => i).sort((a, b) => hash(a) - hash(b));
const missed = new Set(ranked.slice(0, MISSED_COUNT));

export const DOTS: Dot[] = Array.from({ length: count }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return {
    x: BOX.x + PAD + col * PITCH,
    y: BOX.y + PAD + row * PITCH,
    col,
    row,
    missed: missed.has(i),
  };
});

// ── 시간 (프레임) ──────────────────────────────────────────────────────
const A = f(content.stat.at);
export const AT = {
  dots: A, // 점이 왼쪽 위에서부터 번져 나온다
  caption: A + 6,
  source: A + 12,
  sweep: A + 34, // 에이전트의 검사가 왼쪽에서 오른쪽으로 지나간다
  sign: A + 64, // 완료 표식이 전체를 둘러싼다
  tab: A + 70,
  reveal: A + 88, // 남은 점이 드러난다
} as const;
