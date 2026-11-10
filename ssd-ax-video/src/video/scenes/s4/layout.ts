// S4 사례 소개의 좌표와 시점.
//
// 화면 구성
//   왼쪽 위       제목과 과제 설정
//   오른쪽 가운데 요구사항 카드. 카드의 수용 기준 칸에서 나온 선이 오른쪽 벽(기준선)이 된다
//   왼쪽 → 오른쪽 아래   오류 복구 3단계가 계단처럼 내려가며 지연 막대가 길어지고, 마지막 막대가 기준선을 넘는다

import { f } from "../../anim";
import { CARD_HEIGHT, CARD_WIDTH } from "../../components/RequirementCard";
import { S4 as content } from "../../content";
import { safe } from "../../theme";

export const TITLE = { x: safe.left, y: 96 } as const;
export const SETTING = { x: safe.left, y: 264 } as const;

// ── 요구사항 카드: 사례 구간과 같은 부품을 1.3배로 놓는다 ──────────────
export const CARD_SCALE = 1.3;
const cardW = CARD_WIDTH * CARD_SCALE;
const cardH = CARD_HEIGHT * CARD_SCALE;
export const CARD_BOX = { x: 1704 - cardW, y: 372, w: cardW, h: cardH } as const;
/** 수용 기준 칸(카드 1행)의 세로 중심 */
export const CRITERION_Y = CARD_BOX.y + 27 * CARD_SCALE;

// ── 지연 막대 ──────────────────────────────────────────────────────────
export const AXIS = { x0: safe.left, y: 944 } as const;
/** 수용 기준선의 x */
export const LIMIT_X = 1764;
/** 막대가 기준선을 넘어가는 길이 */
export const OVERSHOOT = 44;
/** 단계별 막대: 앞 단계가 끝난 자리에서 시작해 더 길게 이어진다 */
export const BARS: readonly { x0: number; x1: number; y: number }[] = [
  { x0: AXIS.x0, x1: 330, y: 496 },
  { x0: 330, x1: 800, y: 664 },
  { x0: 800, x1: LIMIT_X + OVERSHOOT, y: 832 },
];
export const BAR_H = 12;

// ── 시점 (프레임) ──────────────────────────────────────────────────────
const card = f(content.cardAt);
const recovery = f(content.recovery.at);
const STEP_GAP = 24;

export const T = {
  title: f(content.title.at),
  setting: f(content.setting.at),
  /** 카드 자리의 보조선이 먼저 그려진다 */
  guides: card - 8,
  card,
  cardDur: 32,
  /** 수용 기준 칸에서 기준선이 뻗어 나온다 */
  limit: card + 48,
  limitDur: 30,
  axis: recovery - 22,
  /** k번째 복구 단계 */
  step: (k: number) => recovery + k * STEP_GAP,
  /** k번째 막대가 그려지는 시간 */
  barDur: (k: number) => [12, 16, 26][k],
} as const;
