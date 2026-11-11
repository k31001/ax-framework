// S4J Jira 추적의 좌표와 시점.
//
// 화면 구성 (1920×1080)
//   왼쪽 위        제목
//   가운데 한 줄   추적 사슬: 요구사항 → 설계 기능 → 검증 항목 → 버그. 맨 앞은 S4 의 요구사항 카드가 줄어든 것이다
//   사슬 위        사람(호박색): 보드로 읽고, 댓글로 지시한다
//   사슬 아래      에이전트(청록): JQL 로 읽고, 댓글로 답한다. 왼쪽 아래에 새 요구사항 이슈가 들어온다
//   맨 아래        자막 둘: 읽기(가운데 열) · 쓰기(오른쪽 열)

import { f } from "../../anim";
import { S4J as content } from "../../content";
import { safe } from "../../theme";

export const TITLE = { x: safe.left, y: 96 } as const;

// ── 추적 사슬 ──────────────────────────────────────────────────────────
export const NODE = { w: 228, h: 120, y: 500 } as const;
const PITCH = (safe.right - safe.left - NODE.w) / (content.chain.nodes.length - 1);
export const nodeX = (i: number): number => safe.left + i * PITCH;
export const nodeCx = (i: number): number => nodeX(i) + NODE.w / 2;
/** 링크가 지나가는 높이 */
export const LINK_Y = NODE.y + NODE.h / 2;

// ── 사슬을 읽는 두 선 ──────────────────────────────────────────────────
export const RAIL = { human: NODE.y - 30, agent: NODE.y + NODE.h + 30 } as const;

// ── 열 ─────────────────────────────────────────────────────────────────
export const ACTOR_X = 400; // 사람·에이전트 이름
export const READ = { x: 620, w: 608 } as const; // 보드, JQL
export const WRITE = { x: 1260, w: 520 } as const; // 댓글
/** 댓글이 달리는 이슈(사슬의 순서)와, 댓글에서 그 이슈로 가는 선의 x */
export const COMMENT_ON = 2;
export const COMMENT_X = WRITE.x + 40;

export const HUMAN_ZONE = { y: 286, h: 150 } as const; // 아래 끝 436
export const AGENT_ZONE = { y: 684, h: 150 } as const;
export const JQL_H = 76;
export const COMMENT_H = 140;
export const NEW_ISSUE = { x: safe.left, y: AGENT_ZONE.y + 16 } as const;
export const CAPTION_Y = 878;

// ── 시점 (프레임) ──────────────────────────────────────────────────────
const card = f(content.cardAt);
const chain = f(content.chain.at);
const actors = f(content.actorsAt);
const write = f(content.write.at);
/** 사슬의 유형 사이 간격. 나레이션이 유형 이름을 하나씩 부르는 속도 */
const STEP = 30;

export const T = {
  title: f(content.title.at),
  /** 카드의 Jira 키 칸이 켜진다 */
  jira: card,
  /** 카드가 사슬의 첫 마디로 줄어든다 */
  morph: chain - 16,
  morphDur: 22,
  /** k번째 마디 */
  node: (k: number) => chain + k * STEP,
  /** k번째 마디로 들어오는 링크 */
  link: (k: number) => chain + k * STEP - 16,
  /** "링크로 이어집니다": 링크 이름이 밝아진다 */
  linked: chain + 4 * STEP,
  human: actors,
  agent: actors + 18,
  rails: actors + 40,
  read: f(content.read.at),
  write,
  comment: write + 4,
  reply: write + 26,
  newIssue: write + 40,
} as const;
