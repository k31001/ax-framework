import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enter, enterExit, progress } from "../../video/anim";
import { Sheet } from "../../video/components/Sheet";
import { color, mono, pad2, safe, sans, size, stroke, withAlpha } from "../../video/theme";
import { useScene } from "./context";

// 5대 전환 상세 영상의 공통 부품. 본편의 theme · anim · Trace 등은 src/video 에서 그대로 가져다 쓴다.
//   ShiftSheet   씬의 바탕(도면 테두리, SHEET 번호, 왼쪽 아래 라벨, 선택적으로 아래 자막)
//   CaptionBar   문장의 caption 을 화면 아래에 차례로 띄운다
//   ShiftTitle   영상 첫 씬의 제목 블록 ("5대 전환 01 / 05", 축 이름, 현재 → 전환 후)
//   CodePanel    파일·코드 조각 창. 줄이 차례로 나타나고, 줄마다 색과 강조를 줄 수 있다
//   Chip         작은 꼬리표 (역할, 상태)

export const SHIFT_COUNT = 5;

/** 화면 아래 자막의 위치. 씬의 그림은 이 위쪽(y < CAPTION_TOP)에 둔다. */
export const CAPTION_TOP = 916;

export const ShiftSheet: React.FC<{
  /** 문장의 caption 을 아래에 띄울지. 기본 true */
  captions?: boolean;
  /** 마지막 씬에서 내용물이 사라지지 않게 한다 */
  hold?: boolean;
  children: React.ReactNode;
}> = ({ captions = true, hold, children }) => {
  const { scene, script, shiftNo } = useScene();
  return (
    <Sheet
      frames={scene.frames}
      label={`SHEET ${pad2(scene.index + 1)} / ${pad2(scene.count)}`}
      footer={script.series ? `${script.series} · ${script.key.toUpperCase()}` : `5 SHIFTS · ${pad2(shiftNo)} · ${script.key.toUpperCase()}`}
      fade={hold ? { out: false } : true}
    >
      {children}
      {captions ? <CaptionBar /> : null}
    </Sheet>
  );
};

export const CaptionBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { lines, frames, scene } = useScene();
  const lastScene = scene.index === scene.count - 1;
  const withCaption = lines.filter((l) => l.caption);
  return (
    <>
      {withCaption.map((line, i) => {
        const next = withCaption[i + 1];
        // 영상의 마지막 자막은 끝까지 남는다
        const out = next ? next.at - DUR.exit - 2 : lastScene ? frames + 1 : frames - DUR.exit - 2;
        return (
          <div
            key={line.id}
            style={{
              position: "absolute",
              left: safe.left,
              top: CAPTION_TOP,
              height: 76,
              display: "flex",
              alignItems: "center",
              gap: 20,
              ...enterExit(frame, line.at, out),
            }}
          >
            <div style={{ width: 6, height: 44, backgroundColor: color.agent }} />
            <div style={{ ...sans(size.sub, 700), whiteSpace: "nowrap" }}>{line.caption}</div>
          </div>
        );
      })}
    </>
  );
};

export const ShiftTitle: React.FC<{ at?: number }> = ({ at = 6 }) => {
  const frame = useCurrentFrame();
  const { script, shiftNo } = useScene();
  const arrow = progress(frame, at + 34, DUR.draw, ease.inOut);
  return (
    <div style={{ position: "absolute", left: safe.left, top: 150 }}>
      <div style={{ ...mono(size.label, 700), color: color.agent, ...enter(frame, at) }}>
        {script.series ? `${script.series}  ·  ${script.seriesNo ?? ""}` : `5 SHIFTS  ${pad2(shiftNo)} / ${pad2(SHIFT_COUNT)}`}
      </div>
      <div style={{ ...sans(200, 800), lineHeight: 1.1, marginTop: 8, letterSpacing: "-0.04em", ...enter(frame, at + 6, { distance: 28 }) }}>
        {script.axis}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 28 }}>
        <div style={{ ...sans(size.head, 500), color: color.inkDim, whiteSpace: "nowrap", ...enter(frame, at + 22) }}>{script.from}</div>
        <svg width={120} height={24} style={{ flex: "none" }}>
          <line x1={0} y1={12} x2={104 * arrow} y2={12} stroke={color.agent} strokeWidth={stroke.bold} />
          <path d="M 104 4 L 118 12 L 104 20 Z" fill={color.agent} opacity={arrow >= 1 ? 1 : 0} />
        </svg>
        <div style={{ ...sans(size.head, 700), whiteSpace: "nowrap", ...enter(frame, at + 46) }}>{script.to}</div>
      </div>
    </div>
  );
};

export type Tone = "plain" | "dim" | "agent" | "human" | "problem" | "add" | "del";

const toneColor: Record<Tone, string> = {
  plain: color.ink,
  dim: color.inkDim,
  agent: color.agent,
  human: color.human,
  problem: color.problem,
  add: color.agent,
  del: color.problem,
};

export type CodeLine =
  | string
  | {
      text: string;
      tone?: Tone;
      /** 이 줄이 나타나는 프레임. 없으면 창의 at 부터 차례로 */
      at?: number;
      /** 이 프레임부터 줄 뒤에 강조 띠를 켠다 */
      mark?: number;
      /** 강조 띠를 끄는 프레임 */
      unmark?: number;
      markTone?: Tone;
    };

export const CodePanel: React.FC<{
  x: number;
  y: number;
  w: number;
  /** 창 머리에 적는 파일 이름. 예: "ecc_recovery.rdl" */
  title: string;
  lines: CodeLine[];
  /** 창이 나타나는 프레임 */
  at: number;
  /** 창이 사라지는 프레임 */
  out?: number;
  /** 글자 크기. 기본 28. 읽어야 하는 코드는 26 이상 */
  px?: number;
  /** 창 테두리 색의 성격: 누가 쓴 것인가 */
  owner?: "agent" | "human" | "none";
  /** 창 전체를 흐리게 하는 프레임(다음 창으로 시선을 넘길 때) */
  dimAt?: number;
  /** 줄 사이 시차(프레임). 기본 3 */
  step?: number;
}> = ({ x, y, w, title, lines, at, out, px = 28, owner = "none", dimAt, step = 3 }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, at, DUR.draw, ease.out);
  if (open <= 0) return null;
  const gone = out === undefined ? 0 : progress(frame, out, DUR.exit, ease.in);
  if (gone >= 1) return null;
  const dim = dimAt === undefined ? 0 : progress(frame, dimAt, 14, ease.inOut);
  const edge = owner === "agent" ? color.agent : owner === "human" ? color.human : color.lineStrong;
  const lineH = Math.round(px * 1.5);
  const headH = 44;
  const h = headH + 20 + lines.length * lineH + 16;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: (1 - gone) * (1 - 0.6 * dim) }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <rect x={1} y={1} width={w - 2} height={h - 2} fill={withAlpha(color.panel, 0.92 * open)} stroke={color.line} strokeWidth={stroke.thin} opacity={open} />
        <line x1={1} y1={headH} x2={1 + (w - 2) * open} y2={headH} stroke={color.line} strokeWidth={stroke.hair} />
        <rect x={0} y={0} width={5} height={h * open} fill={edge} />
      </svg>
      <div style={{ position: "absolute", left: 24, top: 0, height: headH, display: "flex", alignItems: "center", ...mono(size.label, 700), color: color.inkSoft, opacity: open }}>
        {title}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: headH + 20 }}>
        {lines.map((raw, i) => {
          const line = typeof raw === "string" ? { text: raw } : raw;
          const start = line.at ?? at + 8 + i * step;
          const p = progress(frame, start, 10, ease.out);
          const on = line.mark === undefined ? 0 : progress(frame, line.mark, 10, ease.out) * (line.unmark === undefined ? 1 : 1 - progress(frame, line.unmark, 10, ease.in));
          const tone = toneColor[line.tone ?? "plain"];
          const markColor = toneColor[line.markTone ?? "agent"];
          return (
            <div key={i} style={{ position: "relative", height: lineH }}>
              {on > 0 ? (
                <div style={{ position: "absolute", left: 6, right: 2, top: 1, bottom: 1, backgroundColor: withAlpha(markColor, 0.16 * on), borderLeft: `3px solid ${withAlpha(markColor, on)}` }} />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: 24,
                  top: 0,
                  lineHeight: `${lineH}px`,
                  ...mono(px, 500),
                  letterSpacing: "0",
                  whiteSpace: "pre",
                  fontVariantLigatures: "none", // |-> 나 != 가 합자로 바뀌지 않게
                  color: tone,
                  opacity: p,
                }}
              >
                {line.text === "" ? " " : line.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** CodePanel 의 높이(다른 요소를 그 아래에 놓을 때). */
export const codePanelHeight = (lineCount: number, px = 28): number => 44 + 20 + lineCount * Math.round(px * 1.5) + 16;

export const Chip: React.FC<{ text: string; tone?: Tone; at: number; out?: number; style?: React.CSSProperties }> = ({ text, tone = "plain", at, out, style }) => {
  const frame = useCurrentFrame();
  const c = toneColor[tone];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 40,
        padding: "0 14px",
        border: `${stroke.thin}px solid ${c}`,
        ...mono(size.label, 700),
        color: c,
        ...(out === undefined ? enter(frame, at) : enterExit(frame, at, out)),
        ...style,
      }}
    >
      {text}
    </div>
  );
};
