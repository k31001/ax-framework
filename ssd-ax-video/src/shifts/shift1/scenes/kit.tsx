import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, draw, ease, enter, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { color, fullSvg, mono, safe, sans, size, stroke, withAlpha } from "../../../video/theme";
import { useScene } from "../../lib";

// shift1(산출물) 씬들이 함께 쓰는 부품.

/** 영상 내내 다시 쓰이는 API 문서의 문장 */
export const DOC = "복구 완료 interrupt는 IRQ_STATUS를 읽은 뒤 RCV_DONE에 1을 써서 지운다.";
export const DOC_2 = ["복구 완료 interrupt는 IRQ_STATUS를 읽은 뒤", "RCV_DONE에 1을 써서 지운다."] as const;
export const DOC_LABEL = "API 문서";

/** JetBrains Mono 의 글자 폭(em) */
export const CH = 0.6;

export type Tone = "plain" | "dim" | "agent" | "human" | "problem";
export const toneColor: Record<Tone, string> = {
  plain: color.inkSoft,
  dim: color.lineStrong,
  agent: color.agent,
  human: color.human,
  problem: color.problem,
};

/** 문장 id 와 그 문장 안의 위치(0~1)로 프레임을 얻는다. */
export const useT = (): { frame: number; t: (id: string, frac?: number) => number; frames: number } => {
  const frame = useCurrentFrame();
  const { cue, end, frames } = useScene();
  return { frame, frames, t: (id, frac = 0) => Math.round(cue(id) + (end(id) - cue(id)) * frac) };
};

/** 씬 머리: 장식 라벨과 씬 이름 */
export const SceneHead: React.FC = () => {
  const frame = useCurrentFrame();
  const { scene, shiftNo } = useScene();
  return (
    <div style={{ position: "absolute", left: safe.left, top: 76 }}>
      <div style={{ ...mono(size.label, 700), color: color.agent, ...enter(frame, 2, { distance: 0 }) }}>{`SHIFT 0${shiftNo} / 05`}</div>
      <div style={{ ...sans(40, 700), marginTop: 4, whiteSpace: "nowrap", ...enter(frame, 4) }}>{scene.name}</div>
    </div>
  );
};

/** 코드의 `|->`, `!=` 같은 글자가 합자(ligature)로 바뀌지 않게 씬 내용물을 감싼다. */
export const NoLig: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ fontVariantLigatures: "none" }}>{children}</div>;

/** 화면 전체를 덮는 svg */
export const Layer: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity }) => (
  <svg {...fullSvg} opacity={opacity}>
    {children}
  </svg>
);

/** 여러 요소를 묶어 함께 나타나고, 흐려지고, 사라지게 한다. */
export const Group: React.FC<{
  at?: number;
  out?: number;
  dimAt?: number;
  undimAt?: number;
  dimTo?: number;
  children: React.ReactNode;
}> = ({ at, out, dimAt, undimAt, dimTo = 0.35, children }) => {
  const frame = useCurrentFrame();
  const a = at === undefined ? 1 : progress(frame, at, DUR.enter, ease.out);
  const o = out === undefined ? 0 : progress(frame, out, DUR.exit, ease.in);
  const d =
    (dimAt === undefined ? 0 : progress(frame, dimAt, 14, ease.inOut)) *
    (undimAt === undefined ? 1 : 1 - progress(frame, undimAt, 14, ease.inOut));
  const opacity = a * (1 - o) * (1 - (1 - dimTo) * d);
  if (opacity <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
};

/** 종이 윤곽선의 문서. 문장 하나만 밝고 나머지 줄은 흐린 선이다. */
export const Paper: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  at: number;
  lines: readonly string[];
  px?: number;
  /** 문장이 밝아지는 프레임. 없으면 at 과 같다 */
  litAt?: number;
  /** 문장 위·아래의 흐린 줄 수 */
  above?: number;
  below?: number;
  edge?: string;
  /** 문장의 색 */
  ink?: string;
  /** 흐린 줄을 지우는 프레임 */
  barsOut?: number;
  label?: boolean;
}> = ({ x, y, w, h, at, lines, px = 34, litAt, above = 2, below = 2, edge = color.lineStrong, ink = color.ink, barsOut, label = true }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, DUR.draw, ease.out);
  if (p <= 0) return null;
  const lit = progress(frame, litAt ?? at + 6, DUR.enter, ease.out);
  const bars = barsOut === undefined ? 1 : 1 - progress(frame, barsOut, 12, ease.in);
  const fold = 30;
  const padX = Math.round(px * 1.1);
  const lineH = Math.round(px * 1.45);
  const barGap = Math.round(px * 0.95);
  const textH = lines.length * lineH;
  const top = (h - textH) / 2 + (label ? 10 : 0);
  const widths = [0.82, 0.64, 0.9, 0.5, 0.74, 0.58];
  const bar = (i: number, yy: number) => (
    <rect key={i} x={padX} y={yy} width={(w - padX * 2) * widths[i % widths.length]} height={8} fill={color.line} opacity={bars * p} />
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path
          d={`M 1 1 H ${w - fold} L ${w - 1} ${fold} V ${h - 1} H 1 Z`}
          fill={withAlpha(color.panel, 0.9 * p)}
          stroke={edge}
          strokeWidth={stroke.thin}
          pathLength={1}
          {...draw(p)}
        />
        <path d={`M ${w - fold} 1 V ${fold} H ${w - 1}`} fill="none" stroke={edge} strokeWidth={stroke.hair} opacity={p} />
        {Array.from({ length: above }, (_, i) => bar(i, top - 26 - (above - 1 - i) * barGap))}
        {Array.from({ length: below }, (_, i) => bar(i + 3, top + textH + 18 + i * barGap))}
      </svg>
      {label ? (
        <div style={{ position: "absolute", left: padX, top: 12, ...sans(size.small, 600), color: color.inkDim, opacity: p }}>{DOC_LABEL}</div>
      ) : null}
      <div style={{ position: "absolute", left: padX - 12, top, width: w - padX * 2 + 24 }}>
        {lines.map((s, i) => (
          <div key={i} style={{ position: "relative", height: lineH }}>
            <div style={{ position: "absolute", left: 0, top: 3, bottom: 3, width: `${100 * lit}%`, backgroundColor: withAlpha(ink, 0.07), borderLeft: `3px solid ${withAlpha(ink, lit)}` }} />
            <div style={{ position: "absolute", left: 14, top: 0, ...sans(px, 700), lineHeight: `${lineH}px`, whiteSpace: "nowrap", color: ink, opacity: 0.35 * p + 0.65 * lit }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 이름표가 있는 상자. 왼쪽 모서리 띠의 색으로 성격을 나타낸다. */
export const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  at: number;
  text: string;
  sub?: string;
  tone?: Tone;
  px?: number;
  dashed?: boolean;
  /** 이 프레임에 한 번 깜빡인다 */
  flashAt?: number;
  textColor?: string;
  mono?: boolean;
  align?: "left" | "center";
}> = ({ x, y, w, h, at, text, sub, tone = "plain", px = 32, dashed, flashAt, textColor, mono: isMono, align = "left" }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, DUR.draw, ease.out);
  if (p <= 0) return null;
  const c = toneColor[tone];
  const fl = flashAt === undefined || frame < flashAt ? 0 : 1 - progress(frame, flashAt, 26, ease.out);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: Math.min(1, p * 1.5), translate: `${(1 - p) * 10}px 0px` }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <rect
          x={1}
          y={1}
          width={w - 2}
          height={h - 2}
          fill={withAlpha(fl > 0 ? color.agent : color.panel, fl > 0 ? 0.1 + 0.25 * fl : 0.92)}
          stroke={fl > 0 ? color.agent : tone === "plain" ? color.line : c}
          strokeWidth={stroke.thin + fl * 2}
          strokeDasharray={dashed ? "9 7" : undefined}
        />
        {dashed ? null : <rect x={0} y={0} width={5} height={h * p} fill={c} />}
      </svg>
      <div
        style={{
          position: "absolute",
          left: align === "center" ? 0 : 26,
          right: align === "center" ? 0 : 12,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: align === "center" ? "center" : "flex-start",
          gap: 2,
        }}
      >
        <div style={{ ...(isMono ? mono(px, 700) : sans(px, 700)), color: textColor ?? color.ink, whiteSpace: "nowrap" }}>{text}</div>
        {sub ? <div style={{ ...sans(size.small, 600), color: c, whiteSpace: "nowrap" }}>{sub}</div> : null}
      </div>
    </div>
  );
};

/** 사람 아이콘과 이름 */
export const Person: React.FC<{ x: number; y: number; label: string; at: number; px?: number }> = ({ x, y, label, at, px = size.small }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12, ...enter(frame, at) }}>
      <HumanIcon size={36} color={color.human} />
      <div style={{ ...sans(px, 700), color: color.human, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
};

/** 청록 PASS 같은 상태 꼬리표 */
export const Status: React.FC<{ x: number; y: number; text: string; at: number; tone?: Tone; right?: boolean }> = ({ x, y, text, at, tone = "agent", right }) => {
  const frame = useCurrentFrame();
  const c = toneColor[tone];
  const p = progress(frame, at, DUR.enter, ease.out);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        ...(right ? { right: 1920 - x } : { left: x }),
        top: y,
        height: 44,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: `${stroke.thin}px solid ${c}`,
        backgroundColor: withAlpha(color.bg, 0.92),
        opacity: p,
        scale: `${1.12 - 0.12 * p}`,
      }}
    >
      {tone === "agent" ? <CheckIcon size={22} color={c} /> : null}
      <div style={{ ...sans(size.small, 700), color: c, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
};

export type Signal = { name: string; /** 칸마다의 값(0/1) */ levels: readonly number[]; tone?: Tone };

/** 디지털 파형. 칸 단위로 값을 주면 왼쪽에서 오른쪽으로 그려진다. */
export const Wave: React.FC<{
  x: number;
  y: number;
  /** 이름 칸의 폭 */
  nameW: number;
  w: number;
  rowH?: number;
  signals: readonly Signal[];
  at: number;
  duration?: number;
  px?: number;
  /** 붉은 세로 띠: [시작 칸, 끝 칸] 과 나타나는 프레임 */
  fail?: { from: number; to: number; at: number };
}> = ({ x, y, nameW, w, rowH = 56, signals, at, duration = 36, px = 26, fail }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, duration, ease.inOut);
  const a = progress(frame, at, 10, ease.out);
  if (a <= 0) return null;
  const hi = rowH - 22;
  const h = signals.length * rowH;
  const fp = fail ? progress(frame, fail.at, 12, ease.out) : 0;
  const blink = fail && frame >= fail.at ? 0.75 + 0.25 * Math.cos(((frame - fail.at) / 30) * Math.PI * 2) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: nameW + w, height: h, opacity: a }}>
      {signals.map((s, i) => (
        <div key={s.name} style={{ position: "absolute", left: 0, top: i * rowH, width: nameW - 20, height: rowH, display: "flex", alignItems: "center", justifyContent: "flex-end", ...mono(px, 500), letterSpacing: "0", color: color.inkSoft }}>
          {s.name}
        </div>
      ))}
      <svg width={w} height={h} style={{ position: "absolute", left: nameW, top: 0, overflow: "visible" }}>
        {fail && fp > 0 ? (
          <rect
            x={(w * fail.from) / signals[0].levels.length}
            y={-6}
            width={(w * (fail.to - fail.from)) / signals[0].levels.length}
            height={(h + 6) * fp}
            fill={withAlpha(color.problem, 0.2 * blink)}
            stroke={color.problem}
            strokeWidth={stroke.thin}
          />
        ) : null}
        {signals.map((s, i) => {
          const n = s.levels.length;
          const u = w / n;
          const base = i * rowH + rowH - 11;
          let d = `M 0 ${base - s.levels[0] * hi}`;
          for (let k = 0; k < n; k++) {
            const yy = base - s.levels[k] * hi;
            if (k > 0 && s.levels[k] !== s.levels[k - 1]) d += ` V ${yy}`;
            d += ` H ${(k + 1) * u}`;
          }
          return <path key={s.name} d={d} fill="none" stroke={toneColor[s.tone ?? "plain"]} strokeWidth={stroke.trace} pathLength={1} {...draw(clamp01(p))} />;
        })}
      </svg>
    </div>
  );
};

/** 줄 번호로 CodePanel 안의 줄 위치(y, 화면 좌표)를 얻는다. */
export const codeLineY = (panelY: number, index: number, px = 28): number => panelY + 64 + index * Math.round(px * 1.5);
