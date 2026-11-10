import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, draw, ease, enter, progress, sub } from "../../anim";
import { color, mono, pad2, sans, size, stroke, withAlpha } from "../../theme";
import { PANEL } from "./layout";

// 작업 하나의 도면 조각: 테두리가 그려지며 켜지고, 안에서 작업이 진행되고, 끝나면 이름과 완료 표시가 붙는다.
// 완료 표시는 요구사항 카드의 기록 칸과 같은 모양(점선 칸 → 채워진 칸 + 확인 표시)이다.

export type TaskFigure = React.FC<{ work: number }>;

const PAD = 36;
const FOOT_H = 104;
const SLOT = 44;
export const FIGURE = { w: PANEL.w - PAD * 2, h: PANEL.h - FOOT_H - 52 - 24 } as const;

export const TaskPanel: React.FC<{
  index: number;
  name: string;
  x: number;
  y: number;
  /** 켜지는 프레임 */
  on: number;
  /** 작업이 끝나는 프레임 */
  done: number;
  /** 물러나는 프레임 */
  out: number;
  Figure: TaskFigure;
}> = ({ index, name, x, y, on, done, out, Figure }) => {
  const frame = useCurrentFrame();
  if (frame < on) return null;
  const { w, h } = PANEL;
  const lit = progress(frame, on, 18, ease.inOut);
  const work = progress(frame, on + 8, done - 2 - (on + 8), ease.linear);
  const check = progress(frame, done, 14);
  const gone = progress(frame, out, 8, ease.in);
  const outline = 2 * (w + h);

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: 1 - gone }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: withAlpha(color.panel, sub(lit, 0.2, 1)) }} />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* 테두리: 왼쪽 위에서 한 바퀴 */}
        <rect
          x={1}
          y={1}
          width={w - 2}
          height={h - 2}
          fill="none"
          stroke={color.inkSoft}
          strokeWidth={stroke.thin}
          {...(lit < 1 ? draw(lit, outline) : {})}
        />
        <line
          x1={1}
          x2={1 + (w - 2) * sub(lit, 0.5, 1)}
          y1={h - FOOT_H}
          y2={h - FOOT_H}
          stroke={color.line}
          strokeWidth={stroke.hair}
        />
        <g transform={`translate(${PAD} 52)`} opacity={sub(lit, 0.3, 0.8)}>
          <Figure work={work} />
        </g>

        {/* 완료 표시 */}
        <g transform={`translate(${w - PAD - SLOT} ${h - FOOT_H / 2 - SLOT / 2})`} opacity={sub(lit, 0.6, 1)}>
          <rect
            x={1}
            y={1}
            width={SLOT - 2}
            height={SLOT - 2}
            fill="none"
            stroke={color.lineStrong}
            strokeWidth={stroke.thin}
            strokeDasharray="5 5"
            opacity={1 - check}
          />
          {check > 0 ? (
            <>
              <rect
                x={1}
                y={1}
                width={SLOT - 2}
                height={SLOT - 2}
                fill={withAlpha(color.agent, 0.18)}
                stroke={color.agent}
                strokeWidth={stroke.thin}
                opacity={sub(check, 0, 0.5)}
              />
              <path
                d="M11 23 19 31 33.5 13.5"
                fill="none"
                stroke={color.agent}
                strokeWidth={stroke.bold}
                pathLength={1}
                {...draw(sub(check, 0.3, 1))}
              />
            </>
          ) : null}
        </g>
      </svg>

      {/* 장식 라벨: 테두리 위에 얹힌다 */}
      <div
        style={{
          position: "absolute",
          left: PAD - 10,
          top: -14,
          padding: "0 10px",
          lineHeight: "28px",
          backgroundColor: color.bg,
          ...mono(size.label, 700),
          color: color.inkDim,
          opacity: sub(lit, 0.2, 0.7),
        }}
      >
        TASK {pad2(index + 1)}
      </div>

      {/* 작업 이름: 끝나는 순간 붙는다 */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: h - FOOT_H,
          height: FOOT_H,
          display: "flex",
          alignItems: "center",
          ...sans(size.sub, 700),
          whiteSpace: "nowrap",
          ...enter(frame, done, { from: "left", distance: 14 }),
        }}
      >
        {name}
      </div>
    </div>
  );
};

// ── 그림 셋 ────────────────────────────────────────────────────────────
// 모두 (0,0) ~ (FIGURE.w, FIGURE.h) 안에 그린다. work 는 작업이 진행된 정도 0~1.

const BAR = 8;

/** 왼쪽에서 오른쪽으로 써지는 가로 막대 */
const Bar: React.FC<{ x0: number; x1: number; y: number; p: number; fill?: string; h?: number }> = ({
  x0,
  x1,
  y,
  p,
  fill = color.inkSoft,
  h = BAR,
}) => (p <= 0 ? null : <rect x={x0} y={y - h / 2} width={(x1 - x0) * clamp01(p)} height={h} fill={fill} />);

// 코드 초안: 들여 쓴 줄이 위에서부터 한 줄씩 써진다. 쓰는 자리에 청록 커서.
const CODE_LINES: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 132], [150, 268]],
  [[28, 236]],
  [[56, 196], [214, 330]],
  [[56, 304]],
  [[84, 250]],
  [[56, 120]],
  [[28, 210], [228, 300]],
  [[0, 60]],
];
const CODE_PITCH = 25;
const CODE_TOTAL = CODE_LINES.reduce((sum, line) => sum + line.reduce((s, [a, b]) => s + (b - a), 0), 0);

export const CodeFigure: TaskFigure = ({ work }) => {
  const typed = work * CODE_TOTAL;
  let used = 0;
  let cursor: { x: number; y: number } = { x: 0, y: 6 };
  const bars: React.ReactNode[] = [];
  CODE_LINES.forEach((line, row) => {
    const y = 6 + row * CODE_PITCH;
    line.forEach(([a, b], n) => {
      const p = clamp01((typed - used) / (b - a));
      if (p > 0) {
        bars.push(<Bar key={`${row}-${n}`} x0={a} x1={b} y={y} p={p} fill={n === 1 ? color.lineStrong : color.inkSoft} />);
        cursor = { x: a + (b - a) * p + 6, y };
      }
      used += b - a;
    });
  });
  return (
    <>
      {bars}
      {work < 1 ? <rect x={cursor.x} y={cursor.y - 9} width={9} height={18} fill={color.agent} /> : null}
    </>
  );
};

// 로그 요약: 왼쪽의 빽빽한 로그를 청록 선이 훑어 내려가고, 오른쪽 상자에 요약 세 줄이 써진다.
const LOG_LINES = [176, 150, 188, 132, 170, 188, 144, 160, 120, 176] as const;
const LOG_PITCH = 20;
const SUMMARY = { x: 268, y: 22, w: FIGURE.w - 268, h: 150 } as const;
const SUMMARY_LINES = [128, 96, 112] as const;

export const LogFigure: TaskFigure = ({ work }) => {
  const scan = sub(work, 0, 0.8);
  const scanY = 6 + scan * (LOG_LINES.length - 1) * LOG_PITCH;
  return (
    <>
      {LOG_LINES.map((len, i) => {
        const y = 6 + i * LOG_PITCH;
        const read = y <= scanY;
        return <rect key={i} x={0} y={y - 2} width={len} height={4} fill={read ? color.inkSoft : color.lineStrong} />;
      })}
      {work < 1 ? (
        <line x1={-8} x2={200} y1={scanY} y2={scanY} stroke={color.agent} strokeWidth={stroke.thin} opacity={0.4 + 0.6 * sub(work, 0, 0.1)} />
      ) : null}
      {/* 로그 → 요약 */}
      <path
        d={`M 208 ${SUMMARY.y + SUMMARY.h / 2} H 252 M 242 ${SUMMARY.y + SUMMARY.h / 2 - 8} l 10 8 l -10 8`}
        fill="none"
        stroke={color.agent}
        strokeWidth={stroke.trace}
        opacity={sub(work, 0.1, 0.25)}
      />
      <rect
        x={SUMMARY.x}
        y={SUMMARY.y}
        width={SUMMARY.w}
        height={SUMMARY.h}
        fill="none"
        stroke={color.inkSoft}
        strokeWidth={stroke.thin}
        pathLength={1}
        {...draw(sub(work, 0.05, 0.35))}
      />
      {SUMMARY_LINES.map((len, i) => {
        const y = SUMMARY.y + 36 + i * 40;
        const p = sub(work, 0.3 + i * 0.22, 0.48 + i * 0.22);
        return (
          <g key={i}>
            <rect x={SUMMARY.x + 20} y={y - 5} width={10} height={10} fill={color.agent} opacity={clamp01(p * 4)} />
            <Bar x0={SUMMARY.x + 42} x1={SUMMARY.x + 42 + len} y={y} p={p} />
          </g>
        );
      })}
    </>
  );
};

// 스크립트: 명령 한 줄이 써지고, 단계 셋이 차례로 끝나며 아래의 진행 막대가 찬다.
const STEP_LINES = [236, 300, 204] as const;

export const ScriptFigure: TaskFigure = ({ work }) => {
  const bar = sub(work, 0.22, 1);
  return (
    <>
      <path d="M0 0 L10 8 L0 16" fill="none" stroke={color.agent} strokeWidth={stroke.trace} />
      <Bar x0={26} x1={150} y={8} p={sub(work, 0, 0.12)} />
      <Bar x0={166} x1={262} y={8} p={sub(work, 0.12, 0.22)} fill={color.lineStrong} />
      {STEP_LINES.map((len, i) => {
        const y = 52 + i * 38;
        const done = sub(work, 0.4 + i * 0.2, 0.5 + i * 0.2);
        const shown = sub(work, 0.2 + i * 0.05, 0.3 + i * 0.05);
        return (
          <g key={i} opacity={shown}>
            <rect x={1} y={y - 9} width={18} height={18} fill={withAlpha(color.agent, 0.9 * done)} stroke={done > 0 ? color.agent : color.lineStrong} strokeWidth={stroke.hair} />
            <Bar x0={36} x1={36 + len} y={y} p={1} fill={done > 0 ? color.inkSoft : color.lineStrong} />
          </g>
        );
      })}
      <rect x={1} y={FIGURE.h - 22} width={FIGURE.w - 2} height={14} fill="none" stroke={color.lineStrong} strokeWidth={stroke.hair} />
      <rect x={4} y={FIGURE.h - 19} width={(FIGURE.w - 8) * bar} height={8} fill={color.agent} />
    </>
  );
};
