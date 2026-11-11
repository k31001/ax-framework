import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, clamp01, ease, lerp, progress } from "../../../video/anim";
import { Source } from "../../../video/components/Text";
import { Trace } from "../../../video/components/Trace";
import { color, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { At, Glyph, Layer, LoopRing, T, fade } from "./kit";

// s7 기술 요소와 실행 순서: 위는 루프를 받치는 블록 넷, 아래는 대기열이 긴 곳부터 가는 순서.

const BY = 84;
const BH = 276;
const BLOCKS = [
  { x: 96, w: 450, title: "regression DB" },
  { x: 575, w: 450, title: "추적 그래프" },
  { x: 1054, w: 400, title: "gating 정책 (버전 관리)" },
  { x: 1483, w: 340, title: "가상 플랫폼" },
];
const RING = { x: 960, y: 432, r: 34 };
const CHAIN = [
  { key: "REQ-207", link: "" },
  { key: "FEAT-341", link: "is implemented by" },
  { key: "VER-514", link: "tested by" },
  { key: "BUG-2304", link: "defect" },
];
const TIERS = ["User", "Block", "Central"];

const CELLS = [
  { x: 420, name: "작성", base: 2 },
  { x: 800, name: "검증·분류", base: 9 },
  { x: 1180, name: "리뷰", base: 8 },
  { x: 1560, name: "통합", base: 9 },
];
const CELL_Y = 768;
const CELL_W = 220;
const CELL_H = 56;
const STEPS = [
  { x: 96, text: "① 기록·기준선", align: "left" as const },
  { x: 800, text: "② 실패 분류 루프", align: "center" as const },
  { x: 1180, text: "③ 영향 분석 · 선택 실행", align: "center" as const },
  { x: 1560, text: "④ 일일 통합", align: "center" as const },
];

const Block: React.FC<{ i: number; at: number; dim: number; children?: React.ReactNode }> = ({ i, at, dim, children }) => {
  const frame = useCurrentFrame();
  const b = BLOCKS[i];
  const p = progress(frame, at, DUR.draw);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: b.x, top: BY, width: b.w, height: BH, opacity: 1 - 0.5 * dim }}>
      <svg width={b.w} height={BH} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <rect x={1} y={1} width={b.w - 2} height={BH - 2} fill={withAlpha(color.panel, 0.92 * p)} stroke={color.line} strokeWidth={stroke.thin} opacity={p} />
        <rect x={0} y={0} width={b.w * p} height={5} fill={color.agent} />
      </svg>
      <div style={{ position: "absolute", left: 22, top: 20, ...mono(size.label, 700), color: color.agent, opacity: p }}>{`BLOCK 0${i + 1}`}</div>
      <div style={{ position: "absolute", left: 22, top: 50, ...sans(size.body, 800), whiteSpace: "nowrap", opacity: progress(frame, at + 4), translate: `0px ${(1 - progress(frame, at + 4)) * 8}px` }}>
        {b.title}
      </div>
      <div style={{ position: "absolute", left: 22, right: 22, top: 122, opacity: progress(frame, at + 12) }}>{children}</div>
    </div>
  );
};

export const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const c1 = cue("s7.1");
  const c2 = cue("s7.2");
  const c3 = cue("s7.3");
  const c4 = cue("s7.4");
  const c5 = cue("s7.5");
  const c6 = cue("s7.6");

  const b4At = c3 + 78;
  const linkAt = b4At + 22;
  const ring = progress(frame, linkAt + 10, 30, ease.inOut);
  const dim = progress(frame, c4, 16, ease.inOut);
  const stepAt = [c5 - 4, c5 + 4, c5 + 44, c5 + 84];
  const stepsOut = c6 - 8;
  const back = progress(frame, c6, 18, ease.inOut); // s7.6: 줄이 원래대로
  const fast = progress(frame, c6 + 8, 14);
  const grow = progress(frame, c6 + 40, 60, ease.inOut);

  const count = (i: number): number => {
    const cell = CELLS[i];
    if (i === 0) return cell.base;
    const cut = progress(frame, stepAt[i] + 10, 30, ease.inOut) * (1 - back);
    return lerp(cell.base, 3, cut) + 3 * grow;
  };
  const calm = (i: number): number => (i === 0 ? 1 : progress(frame, stepAt[i] + 10, 30, ease.inOut) * (1 - back));

  return (
    <ShiftSheet>
      {/* 위: 블록 넷 */}
      <Block i={0} at={c1} dim={dim}>
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div>
            <div style={{ ...mono(26, 500), letterSpacing: "0", color: color.ink, lineHeight: "44px" }}>run · commit · seed ·</div>
            <div style={{ ...mono(26, 500), letterSpacing: "0", color: color.ink, lineHeight: "44px" }}>config · result · gate 판정</div>
          </div>
        </div>
      </Block>
      <At x={BLOCKS[0].x + BLOCKS[0].w - 56} y={BY + 62} opacity={fade(frame, c1 + 6) * (1 - 0.5 * dim)}>
        <Glyph kind="db" size={56} color={color.agent} />
      </At>

      <Block i={1} at={c2} dim={dim}>
        <div style={{ marginTop: -10 }}>
          {CHAIN.map((n, k) => {
            const p = progress(frame, c2 + 30 + k * 16, 10);
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", height: 37, opacity: p }}>
                {n.link ? <div style={{ ...mono(size.label, 500), letterSpacing: "0", color: color.agent, width: 262, flex: "none" }}>{`└ ${n.link}`}</div> : null}
                <div style={{ ...mono(26, 700), letterSpacing: "0", color: k === 3 ? color.problem : color.ink }}>{n.key}</div>
              </div>
            );
          })}
        </div>
      </Block>

      <Block i={2} at={c3} dim={dim}>
        <div style={{ position: "relative", height: 140 }}>
          {TIERS.map((name, k) => {
            const p = progress(frame, c3 + 18 + k * 10, 12);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: k * 119,
                  top: 84 - k * 40,
                  width: 119,
                  height: 56 + k * 40,
                  boxSizing: "border-box",
                  borderTop: `${stroke.trace}px solid ${color.human}`,
                  borderLeft: `${stroke.trace}px solid ${color.human}`,
                  backgroundColor: withAlpha(color.human, 0.08),
                  opacity: p,
                }}
              >
                <div style={{ ...mono(26, 500), letterSpacing: "0", color: color.ink, textAlign: "center", lineHeight: "50px" }}>{name}</div>
              </div>
            );
          })}
        </div>
      </Block>

      <T x={BLOCKS[1].x + BLOCKS[1].w - 22} y={BY + 20} at={c2 + 8} px={size.label} weight={700} align="right" color={color.inkSoft} code opacity={1 - 0.5 * dim}>
        <span style={{ letterSpacing: "0.08em" }}>JIRA · R4J · XRAY</span>
      </T>

      <Block i={3} at={b4At} dim={dim}>
        <div style={{ ...sans(size.small, 600), whiteSpace: "nowrap", lineHeight: "56px" }}>FW + SoC·NAND 모델</div>
      </Block>

      <Layer>
        {/* 네 블록이 루프에 이어진다 */}
        <g opacity={1 - 0.5 * dim}>
          {BLOCKS.map((b, i) => {
            const bx = b.x + b.w / 2;
            return <Trace key={i} pts={[[bx, BY + BH], [bx, RING.y - RING.r - 12], [RING.x, RING.y - RING.r - 12], [RING.x, RING.y - RING.r]]} stroke={color.agent} width={stroke.thin} at={linkAt + i * 3} duration={20} />;
          })}
          <LoopRing
            cx={RING.x}
            cy={RING.y}
            r={RING.r}
            p={ring}
            start={0}
            arrows={[90, 270]}
            nodes={[]}
            width={stroke.trace}
            dot={ring >= 1 ? ((frame - linkAt) * 4) % 360 : undefined}
          />
        </g>

        {/* 아래: 단계 칸과 대기열 */}
        {CELLS.map((cell, i) => {
          const p = progress(frame, c4 + i * 4, DUR.enter);
          if (p <= 0) return null;
          const n = count(i);
          const k = calm(i);
          const hot = i === 0 ? fast : 0;
          return (
            <g key={i} opacity={p}>
              <rect
                x={cell.x - CELL_W / 2}
                y={CELL_Y - CELL_H / 2}
                width={CELL_W}
                height={CELL_H}
                fill={withAlpha(hot > 0 ? color.agent : color.panel, hot > 0 ? 0.18 * hot : 0.92)}
                stroke={hot > 0 ? color.agent : color.lineStrong}
                strokeWidth={stroke.thin}
              />
              {Array.from({ length: 13 }, (_, d) => {
                const on = clamp01(n - d) * clamp01((frame - (c4 + 10 + i * 4 + d * 2)) / 6);
                if (on <= 0) return null;
                const red = i !== 0 && k < 0.5;
                return <circle key={d} cx={cell.x} cy={CELL_Y - CELL_H / 2 - 18 - d * 20} r={7} fill={red ? color.problem : color.inkSoft} opacity={on} />;
              })}
            </g>
          );
        })}
        {CELLS.slice(0, -1).map((cell, i) => (
          <Trace key={i} pts={[[cell.x + CELL_W / 2 + 6, CELL_Y], [CELLS[i + 1].x - CELL_W / 2 - 6, CELL_Y]]} stroke={color.lineStrong} arrow at={c4 + 6 + i * 4} />
        ))}

        {/* s7.6: 작성만 빨라진다 */}
        {fast > 0
          ? [0, 1, 2].map((k) => {
              const t = ((frame - c6) * 0.03 + k / 3) % 1;
              const x = lerp(CELLS[0].x + CELL_W / 2 + 14, CELLS[1].x - CELL_W / 2 - 34, t);
              return (
                <path
                  key={k}
                  d={`M ${x} ${CELL_Y - 34} l 14 12 l -14 12`}
                  fill="none"
                  stroke={color.agent}
                  strokeWidth={stroke.bold}
                  opacity={fast * Math.sin(Math.PI * t)}
                />
              );
            })
          : null}

        {/* s7.5: 순서 */}
        <g opacity={1 - progress(frame, stepsOut, DUR.exit, ease.in)}>
          <Trace pts={[[96, 886], [1740, 886]]} stroke={color.lineStrong} arrow progress={progress(frame, c5 - 4, 100, ease.linear)} />
          {STEPS.slice(1).map((s, i) => (
            <Trace key={i} pts={[[s.x, 832], [s.x, CELL_Y + CELL_H / 2 + 4]]} stroke={color.agent} arrow at={stepAt[i + 1]} duration={12} />
          ))}
        </g>
        {progress(frame, c6 + 70) > 0 ? <line x1={96} y1={826} x2={96 + 1728 * progress(frame, c6 + 70, DUR.draw)} y2={826} stroke={color.line} strokeWidth={stroke.thin} /> : null}
      </Layer>

      {CELLS.map((cell, i) => (
        <T key={i} x={cell.x} y={CELL_Y - 20} at={c4 + i * 4} align="center" weight={700} color={i === 0 && fast > 0 ? color.agent : color.ink}>
          {cell.name}
        </T>
      ))}
      {STEPS.map((s, i) => (
        <T key={i} x={s.x} y={836} at={stepAt[i]} out={stepsOut} align={s.align} weight={i === 0 ? 500 : 700} color={i === 0 ? color.inkDim : color.ink}>
          {s.text}
        </T>
      ))}

      {/* 근거 띠 */}
      <T x={96} y={838} at={c6 + 72} px={32} weight={600}>
        처리량이 늘어난 조직은 첫 리뷰 대기 시간도 증가
      </T>
      <Source x={860} y={842} at={c6 + 80} text="Faros AI, 2026-04 (자사 발표)" />
    </ShiftSheet>
  );
};
