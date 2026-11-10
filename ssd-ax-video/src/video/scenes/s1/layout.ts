// S1 Hook 의 좌표와 시점.
//
// 화면 구성
//   왼쪽 위  자막 (한 번에 하나)
//   가운데   앞부분: 작업 세 가지의 도면 조각 / 뒷부분: 나무

import { DUR, f } from "../../anim";
import { S1 as content } from "../../content";
import { safe } from "../../theme";

export const CAPTION = { x: safe.left, y: 104 } as const;

// ── 작업 조각 셋 ───────────────────────────────────────────────────────
export const PANEL = { w: 528, h: 400, y: 384, gap: 72 } as const;
export const panelX = (i: number): number => safe.left + i * (PANEL.w + PANEL.gap);

// ── 시점 (프레임) ──────────────────────────────────────────────────────
const c = content.captions.map((caption) => f(caption.at));

export const T = {
  caption: c,
  /** 자막이 물러나는 프레임. 둘째 자막은 나무가 자라기 전에 물러난다 */
  captionOut: [c[1] - DUR.exit, c[2] - 12] as const,
  /** i번째 조각이 켜진다 */
  on: (i: number) => c[0] + 11 + i * 14,
  /** i번째 작업이 끝난다: 완료 표시와 이름 */
  done: (i: number) => c[1] + 6 + i * 13,
  /** 조각들이 물러난다 */
  panelsOut: c[2] - 30,
  /** 나무가 자란다 */
  grow: c[2] - 24,
  growDur: 32,
  /** 손이 닿는 높이의 선 */
  reach: c[2] + 6,
  /** 낮은 가지의 열매를 딴다 */
  harvest: c[2] + 20,
  harvestStep: 7,
} as const;
