import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { STEP_WORDS, Steps, Tag, split } from "./kit";

// s6 설계자, FW, 그리고 리뷰.
//   s6.1  RTL 설계자 카드: 정의(불변식 두 줄)
//   s6.2  같은 카드: 증거(formal · 면적 · CDC)
//   s6.3  FW 엔지니어 카드: 정의 → 증거
//   s6.4  줄 단위 diff(흐림) → 위험 등급 3단 띠, A 만 진하다
//   s6.5  주니어가 놓친 bug 하나를 파형과 함께 직접 본다

const CARD_Y = 136;
const CARD_W = 840;
const HEAD_H = 54;
const DEF_H = 118;
const EVI_H = 164;
const LINE = 46;
const EVIDENCE = "증거";

type Row = { text: string; at: number; bar?: boolean };

const Card: React.FC<{ x: number; title: string; at: number; define: Row[]; evidence: Row[]; defineAt: number; evidenceAt: number; dim: number; dy: number }> = ({ x, title, at, define, evidence, defineAt, evidenceAt, dim, dy }) => {
  const frame = useCurrentFrame();
  const open = progress(frame, at, 16, ease.out);
  if (open <= 0) return null;
  const eLit = progress(frame, evidenceAt, 14, ease.out);
  const section = (y: number, h: number, c: string, label: string, rows: Row[], lit: number, monoFont: boolean) => (
    <div style={{ position: "absolute", left: 0, top: y, width: CARD_W, height: h }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 6, height: h * lit, backgroundColor: c }} />
      <div style={{ position: "absolute", left: 24, top: 14, ...sans(size.small, 800), color: c, opacity: 0.35 + 0.65 * lit }}>{label}</div>
      {rows.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 112, top: 12 + i * LINE, height: LINE, display: "flex", alignItems: "center", gap: 24, ...(monoFont ? { ...mono(size.small, 500), color: color.ink } : sans(size.small, 600)), whiteSpace: "pre", ...enter(frame, r.at) }}>
          {r.text}
          {r.bar ? (
            <svg width={300} height={30}>
              <rect x={1} y={8} width={280} height={14} fill="none" stroke={color.lineStrong} strokeWidth={stroke.hair} />
              <rect x={1} y={8} width={196 * progress(frame, r.at + 6, 20, ease.out)} height={14} fill={color.agent} />
              <line x1={240} y1={1} x2={240} y2={29} stroke={color.human} strokeWidth={stroke.trace} />
            </svg>
          ) : null}
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: x, top: CARD_Y + dy, width: CARD_W, height: HEAD_H + DEF_H + EVI_H, opacity: open * (1 - 0.55 * dim) }}>
      <svg width={CARD_W} height={HEAD_H + DEF_H + EVI_H} style={{ position: "absolute", inset: 0 }}>
        <rect x={1} y={1} width={CARD_W - 2} height={HEAD_H + DEF_H + EVI_H - 2} fill={withAlpha(color.panel, 0.92)} stroke={color.lineStrong} strokeWidth={stroke.thin} />
        <line x1={1} y1={HEAD_H} x2={CARD_W - 1} y2={HEAD_H} stroke={color.line} strokeWidth={stroke.hair} />
        <line x1={1} y1={HEAD_H + DEF_H} x2={CARD_W - 1} y2={HEAD_H + DEF_H} stroke={color.line} strokeWidth={stroke.hair} strokeDasharray="6 6" />
      </svg>
      <div style={{ position: "absolute", left: 24, top: 0, height: HEAD_H, display: "flex", alignItems: "center", ...sans(size.small, 800), whiteSpace: "nowrap" }}>{title}</div>
      {section(HEAD_H, DEF_H, color.human, STEP_WORDS[0], define, progress(frame, defineAt, 14, ease.out), false)}
      {section(HEAD_H + DEF_H, EVI_H, color.agent, EVIDENCE, evidence, eLit, true)}
    </div>
  );
};

const TIERS = [
  { k: "A", target: "무결성 경로 · checker", how: "사람이 전부 직접" },
  { k: "B", target: "제어 로직 · interface", how: "증거 + 표본" },
  { k: "C", target: "sequence · 스크립트", how: "증거 + 무작위 표본" },
];
const TIER = { x: 560, y: 504, w: 860, h: 108, pitch: 124 };
const OLD = { x: 96, y: 504, w: 380, h: 356 };

export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end } = useScene();
  const c1 = cue("s6.1");
  const c2 = cue("s6.2");
  const c3 = cue("s6.3");
  const c4 = cue("s6.4");
  const c5 = cue("s6.5");
  const e1 = end("s6.1");
  const e2 = end("s6.2");
  const e3 = end("s6.3");
  const e4 = end("s6.4");
  const fwEvidence = split(c3, e3, 3, 5);
  const tiersAt = split(c4, e4, 2, 5);
  const dim = progress(frame, c4, 16, ease.inOut);
  const dy = 170 * (1 - progress(frame, c4 - 12, 20, ease.inOut)); // 카드는 가운데에서 시작해 위로 물러난다
  const aLit = progress(frame, split(c4, e4, 7, 10), 14, ease.out);

  return (
    <ShiftSheet>
      <Steps
        activeAt={[
          { index: 0, at: 0 },
          { index: 2, at: c2 },
          { index: 0, at: c3 },
          { index: 2, at: fwEvidence },
        ]}
      />
      <Card
        x={96}
        title="RTL 설계자 · host read 우선 큐"
        at={c1}
        defineAt={c1 + 6}
        evidenceAt={c2}
        dim={dim}
        dy={dy}
        define={[
          { text: "불변식 1: host 요청이 GC 요청보다 먼저", at: split(c1, e1, 1, 3) },
          { text: "불변식 2: GC 요청도 반드시 처리 (기아 없음)", at: split(c1, e1, 2, 3) },
        ]}
        evidence={[
          { text: "formal:  proven 2 / 2", at: c2 + 4 },
          { text: "면적:    예산 대비", at: split(c2, e2, 1, 2), bar: true },
          { text: "CDC:     신규 경고 0 · 신규 waiver 0", at: split(c2, e2, 4, 5) },
        ]}
      />
      <Card
        x={984}
        title="FW 엔지니어 · read 오류 복구"
        at={c3}
        defineAt={c3 + 6}
        evidenceAt={fwEvidence}
        dim={dim}
        dy={dy}
        define={[{ text: "정정 실패 데이터는 host에 반환하지 않는다", at: c3 + 10 }]}
        evidence={[{ text: "정정 실패 주입 → host 반환 0건 (예시)", at: fwEvidence + 4 }]}
      />

      {/* 줄 단위 전수 리뷰 (흐림) */}
      <div style={{ position: "absolute", left: OLD.x, top: OLD.y, width: OLD.w, height: OLD.h, opacity: progress(frame, c4, 14) * (1 - 0.5 * progress(frame, tiersAt, 14)) }}>
        <svg width={OLD.w} height={OLD.h}>
          <rect x={1} y={1} width={OLD.w - 2} height={OLD.h - 2} fill={withAlpha(color.panel, 0.9)} stroke={color.line} strokeWidth={stroke.thin} />
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={24} y={26 + i * 32} width={[250, 190, 150, 220, 270, 240, 120, 200, 160, 90][i]} height={10} fill={color.lineStrong} />
          ))}
        </svg>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ position: "absolute", right: 22, top: 18 + i * 32, opacity: progress(frame, c4 + 4 + i * 2, 8) }}>
            <CheckIcon size={24} color={color.human} />
          </div>
        ))}
      </div>
      <svg {...fullSvg}>
        <Trace pts={[[OLD.x + OLD.w + 10, OLD.y + OLD.h / 2], [TIER.x - 12, OLD.y + OLD.h / 2]]} stroke={color.inkSoft} width={stroke.bold} arrow at={tiersAt - 6} />
      </svg>

      {/* 위험 기반 3단 띠 */}
      {TIERS.map((t, i) => {
        const a = i === 0;
        const lit = a ? aLit : 0;
        return (
          <div
            key={t.k}
            style={{
              position: "absolute",
              left: TIER.x,
              top: TIER.y + i * TIER.pitch,
              width: TIER.w,
              height: TIER.h,
              display: "flex",
              alignItems: "center",
              border: `${a ? stroke.bold : stroke.thin}px solid ${a ? withAlpha(color.human, 0.4 + 0.6 * lit) : color.lineStrong}`,
              backgroundColor: a ? withAlpha(color.human, 0.2 * lit) : withAlpha(color.panel, 0.9),
              boxSizing: "border-box",
              ...enter(frame, tiersAt + i * 6),
            }}
          >
            <div style={{ width: 96, textAlign: "center", ...mono(size.head, 700), color: a ? color.human : color.inkDim }}>{t.k}</div>
            <div style={{ flex: 1, ...sans(size.body, a ? 800 : 600), color: a ? color.ink : color.inkSoft, whiteSpace: "nowrap" }}>{t.target}</div>
            <div style={{ marginRight: 28, ...sans(size.small, 700), color: a ? color.human : color.agent, whiteSpace: "nowrap" }}>{t.how}</div>
          </div>
        );
      })}

      {/* 주니어의 직접 debug */}
      <div style={{ position: "absolute", left: 1480, top: 512, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, ...enter(frame, c5) }}>
        <HumanIcon size={104} color={color.human} />
        <Tag text="주니어" c={color.human} at={c5} />
      </div>
      {frame >= c5 ? (
        <svg {...fullSvg} opacity={progress(frame, c5 + 10, 14)}>
          <Trace pts={[[1604, 566], [1716, 566]]} stroke={color.human} width={stroke.bold} arrow at={c5 + 10} />
          <circle cx={1756} cy={566} r={20} fill={color.problem} />
          <circle cx={1756} cy={566} r={32} fill="none" stroke={color.problem} strokeWidth={stroke.thin} />
          <Trace pts={[[1756, 600], [1756, 716]]} stroke={color.problem} at={c5 + 22} />
          <rect x={1700} y={724} width={40} height={124} fill={withAlpha(color.problem, 0.22)} stroke={color.problem} strokeWidth={stroke.thin} />
          <path d="M 1560 770 H 1620 V 740 H 1660 V 770 H 1700 V 740 H 1740 V 770 H 1824" fill="none" stroke={color.inkSoft} strokeWidth={stroke.thin} />
          <path d="M 1560 836 H 1700 V 806 H 1740 V 836 H 1824" fill="none" stroke={color.inkSoft} strokeWidth={stroke.thin} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 1480, top: 746, ...mono(size.label, 700), color: color.inkDim, opacity: progress(frame, c5 + 22) }}>PUSH</div>
      <div style={{ position: "absolute", left: 1480, top: 812, ...mono(size.label, 700), color: color.inkDim, opacity: progress(frame, c5 + 22) }}>POP</div>
    </ShiftSheet>
  );
};
