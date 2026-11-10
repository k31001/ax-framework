import { ease, f, progress } from "../../anim";
import { S6 as content } from "../../content";
import { safe } from "../../theme";

// S6 의 배치와 시간. 배치는 승인 스틸(design/a/s6.png)과 같다.

export const CHIP = { x: 440, y: 96, w: 400, h: 904 } as const;
export const CHIP_RIGHT = CHIP.x + CHIP.w;
export const CHIP_CX = CHIP.x + CHIP.w / 2;
export const HEADER_H = 172;
export const HEADER_CY = CHIP.y + HEADER_H / 2;
export const BEFORE_RIGHT = CHIP.x - 40; // "현재" 글자의 오른쪽 끝
export const AFTER_LEFT = CHIP_RIGHT + 56; // "전환 후" 글자의 왼쪽 끝
export const WIRE_X0 = safe.left + 8; // 왼쪽 점선이 시작하는 자리
export const PIN = 14;

const ROW_Y0 = 358; // 첫 줄의 선 높이
const ROW_PITCH = 138;
export const rowY = (i: number): number => ROW_Y0 + ROW_PITCH * i;

// ── 시간 (프레임) ──────────────────────────────────────────────────────
export const AT = {
  outline: 2, // 패키지 윤곽이 그려진다
  title: 12,
  pins: 22, // 핀과 꺼진 축 이름이 차례로 놓인다
  columnBefore: f(content.rowsAt) - 8,
} as const;

/** i 번째 줄이 시작하는 프레임 */
export const rowAt = (i: number): number => f(content.rowsAt + content.rowStep * i);

// 한 줄 안의 순서. 줄이 시작한 뒤의 프레임이다.
// 왼쪽에서 들어온 것이 칩을 지나 오른쪽으로 바뀌어 나간다.
export const T = {
  lit: 0, // 축 이름이 켜진다
  wireIn: 0, // 왼쪽 점선이 칩 쪽으로 그려진다
  before: 3, // "현재" 문구
  cross: 20, // 칩 안을 지나간다
  dim: 24, // "현재"가 흐려진다
  pin: 30, // 오른쪽 핀이 채워진다
  wireOut: 31, // 청록 선이 오른쪽으로 그려진다
  after: 34, // "전환 후" 문구
} as const;

export type RowState = {
  /** 핀과 꺼진 축 이름이 놓인 정도 */
  base: number;
  lit: number;
  wireIn: number;
  cross: number;
  dim: number;
  pin: number;
  wireOut: number;
};

export const rowState = (frame: number, i: number): RowState => {
  const t0 = rowAt(i);
  return {
    base: progress(frame, AT.pins + i * 3, 12),
    lit: progress(frame, t0 + T.lit, 12),
    wireIn: progress(frame, t0 + T.wireIn, 16),
    cross: progress(frame, t0 + T.cross, 12, ease.inOut),
    dim: progress(frame, t0 + T.dim, 14, ease.inOut),
    pin: progress(frame, t0 + T.pin, 8),
    wireOut: progress(frame, t0 + T.wireOut, 22),
  };
};
