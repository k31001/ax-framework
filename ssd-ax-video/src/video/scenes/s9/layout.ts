import { f } from "../../anim";
import { S9 as content } from "../../content";
import { safe } from "../../theme";

// S9 의 배치와 시간.

// ── 역할 네 줄: S6 의 "현재 → 전환 후"와 같은 문법 ─────────────────────
export const BLOCK = { x: 440, w: 320, h: 84 } as const; // 역할 이름이 놓이는 작은 소자
export const BLOCK_RIGHT = BLOCK.x + BLOCK.w;
export const BEFORE_RIGHT = BLOCK.x - 40;
export const AFTER_LEFT = BLOCK_RIGHT + 56;
export const WIRE_X0 = safe.left + 8;
export const PIN = 14;

const ROW_Y0 = 276;
const ROW_PITCH = 180;
export const rowY = (i: number): number => ROW_Y0 + ROW_PITCH * i;
export const rowAt = (i: number): number => f(content.rolesAt + content.roleGap * i);

// 한 줄 안의 순서(줄이 시작한 뒤의 프레임). 줄 간격이 0.9초라 S6 보다 훨씬 빠르다.
export const T = {
  wireIn: 0, // 왼쪽 점선
  before: 0,
  after: 5,
  wireOut: 6, // 오른쪽 실선
  dim: 12, // before 가 흐려진다
} as const;

// ── 핵심 문구: S3 과 같은 글자 처리, 화면 가운데 높이 ──────────────────
export const HEAD_X = 128;
export const HEAD_TOP = 356;
export const TEXT_X = 136; // 도입 문구와 엔드 카드의 왼쪽 끝
export const LEAD_TOP = HEAD_TOP - 82; // 핵심 문구 위의 한 줄
export const UNDER_Y = HEAD_TOP + 300; // "재설계" 밑줄
export const UNDER_X0 = 946; // "재설계"가 시작하는 x
export const END_TOP = HEAD_TOP + 352;

// ── 시간 (프레임) ──────────────────────────────────────────────────────
const SHIFT = f(content.shift.at);
const HEADLINE = f(content.headline.at);
export const AT = {
  rolesOut: SHIFT - 6, // 역할 네 줄이 물러난다
  shift: SHIFT,
  shiftMove: HEADLINE - 20, // 문구가 핵심 문구 위의 자리로 올라간다
  guide: HEADLINE - 12, // 조판 안내선 (S3 과 같은 간격)
  headline: HEADLINE,
  underline: HEADLINE + 10,
  endCard: f(content.endCard.at),
} as const;
