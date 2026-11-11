import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, enterExit, lerp, progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// shift5(문화) 씬들이 같이 쓰는 부품.

/** 문장 안의 한 지점: 문장 시작에서 길이의 frac 만큼 지난 프레임 */
export const useAt = (): ((id: string, frac?: number) => number) => {
  const { cue, end } = useScene();
  return (id, frac = 0) => Math.round(cue(id) + (end(id) - cue(id)) * frac);
};

/** at 에 나타나고 out 에 사라지는 투명도 */
export const vis = (frame: number, at: number, out?: number, dur: number = DUR.enter): number =>
  progress(frame, at, dur) * (out === undefined ? 1 : 1 - progress(frame, out, DUR.exit, ease.in));

export const Svg: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity }) => (
  <svg {...fullSvg} opacity={opacity}>
    {children}
  </svg>
);

export const Txt: React.FC<{
  x: number;
  y: number;
  at: number;
  out?: number;
  px?: number;
  weight?: number;
  c?: string;
  font?: "sans" | "mono";
  align?: "left" | "center" | "right";
  o?: number;
  children: React.ReactNode;
}> = ({ x, y, at, out, px = size.small, weight = 500, c = color.ink, font = "sans", align = "left", o = 1, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const base = font === "mono" ? mono(px, weight) : sans(px, weight);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: align === "center" ? "translateX(-50%)" : align === "right" ? "translateX(-100%)" : undefined,
        opacity: o,
      }}
    >
      <div style={{ ...base, color: c, whiteSpace: "nowrap", ...enterExit(frame, at, out) }}>{children}</div>
    </div>
  );
};

/** 테두리가 그려지며 나타나는 사각형. <svg> 안에서 쓴다. */
export const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
  c?: string;
  fill?: string;
  width?: number;
  dash?: string;
  o?: number;
}> = ({ x, y, w, h, p, c = color.lineStrong, fill = "none", width = stroke.thin, dash, o = 1 }) => {
  if (p <= 0 || o <= 0) return null;
  return dash ? (
    <rect x={x} y={y} width={w} height={h} fill={fill} stroke={c} strokeWidth={width} strokeDasharray={dash} opacity={p * o} />
  ) : (
    <g opacity={o}>
      {fill !== "none" ? <rect x={x} y={y} width={w} height={h} fill={fill} opacity={p} /> : null}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={c} strokeWidth={width} pathLength={1} strokeDasharray={`${p} 1`} />
    </g>
  );
};

/** 귀가 접힌 파일 모양. <svg> 안에서 쓴다. */
export const DocShape: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  c?: string;
  dash?: string;
  o?: number;
  fill?: string;
  width?: number;
  /** 실선이 그려진 정도. dash 가 없을 때 */
  p?: number;
}> = ({ x, y, w, h, c = color.inkSoft, dash, o = 1, fill = "none", width = stroke.thin, p = 1 }) => {
  if (o <= 0) return null;
  const k = Math.min(w, h) * 0.24;
  const d = `M ${x} ${y} H ${x + w - k} L ${x + w} ${y + k} V ${y + h} H ${x} Z`;
  return (
    <g opacity={o}>
      <path
        d={d}
        fill={fill}
        stroke={c}
        strokeWidth={width}
        strokeDasharray={dash ?? `${p} 1`}
        pathLength={dash ? undefined : 1}
        strokeLinejoin="round"
      />
      <path d={`M ${x + w - k} ${y} V ${y + k} H ${x + w}`} fill="none" stroke={c} strokeWidth={width} strokeDasharray={dash} opacity={dash ? 1 : p} />
    </g>
  );
};

/** 아이콘 등을 중심 좌표에 놓는다. */
export const At: React.FC<{ x: number; y: number; o?: number; scale?: number; children: React.ReactNode }> = ({ x, y, o = 1, scale = 1, children }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, opacity: o }}>{children}</div>
  );

/** 원 안에 고르게 흩어진 점 무리(해바라기 배열). <svg> 안에서 쓴다. */
export const Dots: React.FC<{ cx: number; cy: number; r: number; n: number; c: string; p?: number; o?: number; dot?: number }> = ({
  cx,
  cy,
  r,
  n,
  c,
  p = 1,
  o = 1,
  dot = 3,
}) => {
  if (p <= 0 || o <= 0) return null;
  const shown = Math.ceil(n * clamp01(p));
  const out: React.ReactNode[] = [];
  for (let i = 0; i < shown; i++) {
    const rr = r * Math.sqrt((i + 0.5) / n);
    const a = i * 2.39996;
    out.push(<circle key={i} cx={cx + rr * Math.cos(a)} cy={cy + rr * Math.sin(a)} r={dot} fill={c} />);
  }
  return <g opacity={o}>{out}</g>;
};

/** 작은 꼬리표(읽는 글자 크기). */
export const Tag: React.FC<{ x: number; y: number; text: string; c?: string; at: number; out?: number; align?: "left" | "center" | "right"; px?: number }> = ({
  x,
  y,
  text,
  c = color.inkSoft,
  at,
  out,
  align = "left",
  px = size.small,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: align === "center" ? "translateX(-50%)" : align === "right" ? "translateX(-100%)" : undefined }}>
      <div
        style={{
          ...sans(px, 600),
          color: c,
          whiteSpace: "nowrap",
          padding: "4px 14px",
          border: `${stroke.thin}px solid ${c}`,
          backgroundColor: withAlpha(color.bg, 0.9),
          ...enterExit(frame, at, out),
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ── 4주 타임라인 ──────────────────────────────────────────────────────
export const WEEKS = ["1주 기준선", "2주 실험", "3주 공유", "4주 판단"] as const;
const WEEK_X = [600, 880, 1160, 1440] as const;
const WEEK_Y = 118;

/**
 * 예제 씬의 머리: 제목 "한 팀의 4주", 주차 타임라인, "예시 수치" 표기.
 * on[i] 는 i 번째 주가 켜지는 프레임. 가장 늦게 켜진 주가 "지금"이다.
 */
export const WeekHeader: React.FC<{ at: number; titleAt?: number; on: number[]; dy?: number }> = ({ at, titleAt = at, on, dy = 0 }) => {
  const frame = useCurrentFrame();
  const line = progress(frame, at, 24, ease.inOut);
  let now = -1;
  on.forEach((f, i) => {
    if (frame >= f) now = i;
  });
  const x0 = WEEK_X[0] - 80;
  const x1 = WEEK_X[3] + 80;
  return (
    <div style={{ position: "absolute", inset: 0, translate: `0px ${dy}px` }}>
      <Txt x={96} y={84} at={titleAt} px={size.head} weight={800}>
        한 팀의 4주
      </Txt>
      <Svg>
        <line x1={x0} y1={WEEK_Y} x2={lerp(x0, x1, line)} y2={WEEK_Y} stroke={color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="3 9" />
        {now > 0 ? <line x1={x0} y1={WEEK_Y} x2={WEEK_X[now]} y2={WEEK_Y} stroke={color.inkSoft} strokeWidth={stroke.thin} opacity={line} /> : null}
        <line x1={x0} y1={WEEK_Y - 9} x2={x0} y2={WEEK_Y + 9} stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={line} />
        <line x1={x1} y1={WEEK_Y - 9} x2={x1} y2={WEEK_Y + 9} stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={line} />
        {WEEK_X.map((x, i) => {
          const p = progress(frame, at + 6 + i * 4);
          const lit = i === now ? progress(frame, on[i], 14) : 0;
          const past = i < now;
          return (
            <g key={i} opacity={p}>
              {lit > 0 ? <circle cx={x} cy={WEEK_Y} r={8 + 9 * lit} fill={color.bg} stroke={color.agent} strokeWidth={stroke.trace} /> : null}
              <circle
                cx={x}
                cy={WEEK_Y}
                r={i === now ? 7 : 8}
                fill={i === now ? color.agent : past ? color.inkSoft : color.bg}
                stroke={i === now ? color.agent : past ? color.inkSoft : color.lineStrong}
                strokeWidth={stroke.thin}
              />
            </g>
          );
        })}
      </Svg>
      {WEEK_X.map((x, i) => {
        const p = progress(frame, at + 6 + i * 4);
        const isNow = i === now;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x, top: 70, transform: "translateX(-50%)", ...mono(size.label, 700), color: isNow ? color.agent : color.inkDim, opacity: p * (isNow ? 1 : 0.7) }}>
              {`WEEK ${i + 1}`}
            </div>
            <div
              style={{
                position: "absolute",
                left: x,
                top: 142,
                transform: "translateX(-50%)",
                ...sans(size.small, isNow ? 800 : 500),
                whiteSpace: "nowrap",
                color: isNow ? color.ink : i < now ? color.inkSoft : color.inkDim,
                opacity: p,
              }}
            >
              {WEEKS[i]}
            </div>
          </React.Fragment>
        );
      })}
      <Tag x={1824} y={92} align="right" text="예시 수치" c={color.inkSoft} at={titleAt} />
    </div>
  );
};

// ── 저장소 트리 ───────────────────────────────────────────────────────
export type TreeRow = { depth: number; name: string; desc?: string; at: number; c?: string; descC?: string };

export const Tree: React.FC<{ x: number; y: number; rows: TreeRow[]; rowH?: number; px?: number; descX?: number; out?: number }> = ({
  x,
  y,
  rows,
  rowH = 56,
  px = 30,
  descX = 300,
  out,
}) => {
  const frame = useCurrentFrame();
  const IND = 44;
  const gone = out === undefined ? 1 : 1 - progress(frame, out, DUR.exit, ease.in);
  if (gone <= 0) return null;
  return (
    <div style={{ opacity: gone }}>
      <Svg>
        {rows.map((row, i) => {
          if (row.depth === 0) return null;
          let parent = i - 1;
          while (parent > 0 && rows[parent].depth >= row.depth) parent--;
          const tx = x + (row.depth - 1) * IND + 12;
          const yTop = y + parent * rowH + rowH / 2 + 20;
          const yMid = y + i * rowH + rowH / 2;
          const p = progress(frame, row.at, 12);
          return p <= 0 ? null : (
            <path key={i} d={`M ${tx} ${yTop} V ${yMid} H ${tx + IND - 20}`} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={p} />
          );
        })}
      </Svg>
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          <Txt x={x + row.depth * IND} y={y + i * rowH + (rowH - px * 1.2) / 2} at={row.at} px={px} weight={row.depth === 0 ? 700 : 500} font="mono" c={row.c ?? color.ink}>
            {row.name}
          </Txt>
          {row.desc ? (
            <Txt x={x + descX} y={y + i * rowH + (rowH - 30 * 1.25) / 2} at={row.at + 4} px={30} c={row.descC ?? color.inkSoft}>
              {row.desc}
            </Txt>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── 지표 쌍 카드의 틀 ─────────────────────────────────────────────────
/**
 * 좌우 두 칸(속도 / guardrail)과 그 사이를 잇는 저울선. 내용은 children 으로 얹는다.
 * tilt 는 저울선의 기울기(도). 양수면 속도 쪽이 내려간다.
 */
export const PairFrame: React.FC<{ x: number; y: number; w: number; h: number; at: number; out?: number; tilt?: number; children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  at,
  out,
  tilt = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, 18);
  const o = out === undefined ? 1 : 1 - progress(frame, out, DUR.exit, ease.in);
  if (p <= 0 || o <= 0) return null;
  const cx = x + w / 2;
  const lx = x + w / 4;
  const rx = x + (w * 3) / 4;
  const beamY = y + 106;
  const beam = progress(frame, at + 8, 18);
  const half = (rx - lx) / 2 + 150;
  return (
    <div style={{ opacity: o }}>
      <Svg>
        <Box x={x} y={y} w={w} h={h} p={p} c={color.line} fill={withAlpha(color.panel, 0.92)} />
        <rect x={x} y={y} width={5} height={(h / 2) * p} fill={color.agent} />
        <rect x={x + w - 5} y={y + h - (h / 2) * p} width={5} height={(h / 2) * p} fill={color.human} />
        <line x1={cx} y1={beamY + 22} x2={cx} y2={beamY + 22 + (h - 140) * p} stroke={color.line} strokeWidth={stroke.hair} strokeDasharray="4 8" />
        {/* 저울선 */}
        <g transform={`rotate(${-tilt} ${cx} ${beamY})`}>
          <line x1={cx - half * beam} y1={beamY} x2={cx + half * beam} y2={beamY} stroke={color.inkSoft} strokeWidth={stroke.thin} />
          <rect x={cx - half * beam - 5} y={beamY - 5} width={10} height={10} fill={color.agent} opacity={beam} />
          <rect x={cx + half * beam - 5} y={beamY - 5} width={10} height={10} fill={color.human} opacity={beam} />
        </g>
        <path d={`M ${cx} ${beamY} L ${cx - 12} ${beamY + 20} H ${cx + 12} Z`} fill={color.bg} stroke={color.inkSoft} strokeWidth={stroke.thin} opacity={beam} />
      </Svg>
      <Txt x={lx} y={y + 22} at={at + 4} px={size.sub} weight={800} c={color.agent} align="center">
        속도
      </Txt>
      <Txt x={rx} y={y + 22} at={at + 8} px={size.sub} weight={800} c={color.human} align="center">
        guardrail
      </Txt>
      {children}
    </div>
  );
};

// ── 팀: 벽으로 나뉜 세 칸 ↔ 한 탁자 ───────────────────────────────────
/** merge 0 이면 벽으로 나뉜 책상 셋, 1 이면 벽이 없어지고 탁자 하나에 모인다. */
export const Team: React.FC<{ x: number; y: number; cellW: number; h: number; p: number; merge?: number; o?: number; icon?: number }> = ({
  x,
  y,
  cellW,
  h,
  p,
  merge = 0,
  o = 1,
  icon = 84,
}) => {
  if (p <= 0 || o <= 0) return null;
  const wall = (1 - merge) * p;
  const deskY = y + icon + 76;
  const centers = [0, 1, 2].map((i) => x + cellW * (i + 0.5));
  const pull = cellW * 0.16 * merge; // 탁자에 모이며 조금 가까워진다
  const px = [centers[0] + pull, centers[1], centers[2] - pull];
  return (
    <div style={{ opacity: o }}>
      <Svg>
        {wall > 0
          ? [0, 1, 2, 3].map((k) => (
              <line key={k} x1={x + k * cellW} y1={y + h} x2={x + k * cellW} y2={y + h - h * p} stroke={color.inkSoft} strokeWidth={stroke.thin} opacity={wall} />
            ))
          : null}
        {wall > 0 ? <line x1={x} y1={y + h} x2={x + 3 * cellW * p} y2={y + h} stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={wall} /> : null}
        {wall > 0
          ? centers.map((c, i) => (
              <path key={i} d={`M ${c - 84} ${deskY + 44} V ${deskY} H ${c + 84} V ${deskY + 44}`} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} opacity={wall} />
            ))
          : null}
        {merge > 0 ? (
          <Box x={px[0] - 110} y={deskY} w={px[2] - px[0] + 220} h={70} p={merge * p} c={color.human} fill={withAlpha(color.panel, 0.9)} />
        ) : null}
      </Svg>
      {px.map((c, i) => (
        <At key={i} x={c} y={y + 28 + icon / 2} o={progress(p, 0.2 + i * 0.15, 0.5, ease.linear)}>
          <HumanIcon size={icon} color={color.human} />
        </At>
      ))}
    </div>
  );
};
export const teamDeskY = (y: number, icon = 84): number => y + icon + 76;

// ── 팀이 남기는 네 가지 (s1, s3) ───────────────────────────────────────
export const KEEP = [
  { name: "기준선", path: "metrics/" },
  { name: "지표 쌍", path: "experiments/" },
  { name: "playbook", path: "playbooks/" },
  { name: "실패 기록", path: "failures/" },
] as const;
export type Rect = { x: number; y: number; w: number; h: number };
/** s1 에서 빈 틀이 놓이는 자리 */
export const slotHome = (i: number): Rect => ({ x: 96 + i * 250, y: 620, w: 180, h: 230 });
export const mix = (a: Rect, b: Rect, p: number): Rect => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
