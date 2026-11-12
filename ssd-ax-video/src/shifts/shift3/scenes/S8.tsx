import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, enterExit, progress } from "../../../video/anim";
import { AgentIcon, CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { BundleIcon, DocIcon, LockIcon, Steps, mix, split } from "./kit";

// s8 기술 요소와 실행 순서.
//   s8.1  부품 네 개가 낱말에 맞춰 차례로 채워진다
//   s8.2  1번 '분리 규칙': 생성 경로와 검증 기준 경로 사이의 벽, ref_model/ 에 자물쇠
//   s8.3  벽이 사라진 가정: RTL 과 testbench 가 같은 오해(?)를 공유하고 서로 통과 → 벽이 서면 드러난다
//   s8.4  2 → 3 → 4 → (측정이 쌓인 뒤) 5

const PARTS = [
  { title: "작업 지시서 양식", sub: "YAML, 직접 구축", c: color.human },
  { title: "증거 묶음 형식", sub: "tool 출력 수집, 직접 구축", c: color.agent },
  { title: "mutation tool", sub: "상용 · 오픈소스", c: color.inkSoft },
  { title: "권한 · 승인 기록", sub: "저장소 권한, 직접 구축", c: color.human },
];
const PART = { y: 138, w: 408, h: 186, pitch: 440 };

const STAIRS = [["분리 규칙"], ["블록 하나에서", "작업 지시서"], ["증거 묶음"], ["mutation 측정"], ["리뷰 방식 전환"]];
const STAIR = { y: 780, w: 320, h: 110, pitch: 352 };
const AFTER = "측정이 쌓인 뒤";

// 분리 규칙 그림
const FX = 220;
const UP = 446; // 생성 경로
const LOW = 654; // 검증 기준 경로
const WALL = 566;
const Q = { x: FX + 800, y: UP };

const Box: React.FC<{ x: number; y: number; w: number; c: string; at: number; children: React.ReactNode }> = ({ x, y, w, c, at, children }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: y - 34, width: w, height: 68, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, border: `${stroke.trace}px solid ${c}`, backgroundColor: color.panel, boxSizing: "border-box", ...mono(size.small, 700), color: color.ink, ...enter(frame, at) }}>
      {children}
    </div>
  );
};

export const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end } = useScene();
  const c1 = cue("s8.1");
  const c2 = cue("s8.2");
  const c3 = cue("s8.3");
  const c4 = cue("s8.4");
  const e1 = end("s8.1");
  const e2 = end("s8.2");
  const e3 = end("s8.3");
  const e4 = end("s8.4");

  const partsDim = progress(frame, c2 - 4, 14, ease.inOut);
  const wallUp = split(c2, e2, 1, 2);
  const wallBack = split(c3, e3, 3, 5);
  const wall = progress(frame, wallUp, 16, ease.out) * (1 - progress(frame, c3, 12, ease.in)) + progress(frame, wallBack, 14, ease.out);
  const lowDim = progress(frame, c3, 12) * (1 - progress(frame, wallBack, 12));
  const shared = split(c3, e3, 1, 4); // "같은 오해를 공유합니다" 앞에서 물음표가 뜬다
  const passAt = split(c3, e3, 2, 5);
  const exposed = progress(frame, wallBack + 10, 14, ease.out);
  const figDim = progress(frame, c4 - 4, 14, ease.inOut);
  const stairAt = [c2, c4, split(c4, e4, 1, 4), split(c4, e4, 2, 4), split(c4, e4, 3, 4) + 8];
  const icons = [<DocIcon key="d" size={52} color={color.human} />, <BundleIcon key="b" size={52} color={color.agent} />, null, <LockIcon key="l" size={52} color={color.human} />];

  return (
    <ShiftSheet>
      <Steps />
      {/* ── 부품표 ─────────────────────────────────────────────────── */}
      {PARTS.map((p, i) => {
        const at = split(c1, e1, i, 4);
        return (
          <div key={i} style={{ position: "absolute", left: 96 + i * PART.pitch, top: PART.y + 230 * (1 - progress(frame, c2 - 14, 20, ease.inOut)), width: PART.w, height: PART.h, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.lineStrong}`, backgroundColor: withAlpha(color.panel, 0.9), ...enter(frame, at), opacity: progress(frame, at) * (1 - 0.6 * partsDim) }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 6, height: "100%", backgroundColor: p.c }} />
            <div style={{ position: "absolute", left: 26, top: 16, ...mono(size.label, 700), color: color.inkDim }}>{`PART 0${i + 1}`}</div>
            <div style={{ position: "absolute", right: 22, top: 16 }}>
              {icons[i] ?? (
                <svg width={52} height={52}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
                    <circle key={k} cx={10 + (k % 3) * 16} cy={10 + Math.floor(k / 3) * 16} r={5} fill={k === 4 ? color.problem : color.agent} />
                  ))}
                </svg>
              )}
            </div>
            <div style={{ position: "absolute", left: 26, top: 76, ...sans(size.body, 800), whiteSpace: "nowrap" }}>{p.title}</div>
            <div style={{ position: "absolute", left: 26, top: 128, ...sans(size.small, 500), color: color.inkSoft, whiteSpace: "nowrap" }}>{p.sub}</div>
          </div>
        );
      })}

      {/* ── 분리 규칙 그림 ─────────────────────────────────────────── */}
      <div style={{ opacity: 1 - 0.7 * figDim }}>
        <svg {...fullSvg}>
          {/* 생성 경로 */}
          <Trace pts={[[FX + 80, UP], [FX + 330, UP], [FX + 330, UP - 46], [FX + 400, UP - 46]]} stroke={color.agent} arrow at={c2 + 8} />
          <Trace pts={[[FX + 330, UP], [FX + 330, UP + 46], [FX + 400, UP + 46]]} stroke={color.agent} arrow at={c2 + 12} />
          {/* 검증 기준 경로 */}
          <g opacity={1 - 0.65 * lowDim}>
            <Trace pts={[[FX + 80, LOW], [FX + 400, LOW]]} stroke={color.human} arrow at={wallUp + 4} />
          </g>
          {/* 벽 */}
          {wall > 0 ? (
            <g opacity={Math.min(1, wall)}>
              <line x1={FX - 30} y1={WALL} x2={FX - 30 + 1180 * Math.min(1, wall)} y2={WALL} stroke={color.ink} strokeWidth={5} />
              {Array.from({ length: 40 }, (_, k) => (
                <line key={k} x1={FX - 22 + k * 29} y1={WALL + 3} x2={FX - 34 + k * 29} y2={WALL + 15} stroke={color.inkSoft} strokeWidth={stroke.hair} opacity={k * 29 < 1160 * wall ? 1 : 0} />
              ))}
            </g>
          ) : null}
          {/* 같은 오해 */}
          <Trace pts={[[FX + 680, UP - 46], [Q.x, UP - 46], [Q.x, UP - 34]]} stroke={color.problem} at={shared} />
          <Trace pts={[[FX + 680, UP + 46], [Q.x, UP + 46], [Q.x, UP + 34]]} stroke={color.problem} at={shared} />
          {frame >= shared ? <circle cx={Q.x} cy={Q.y} r={34} fill={color.bg} stroke={color.problem} strokeWidth={stroke.bold} opacity={progress(frame, shared + 6, 10)} /> : null}
          {exposed > 0 ? <circle cx={Q.x} cy={Q.y} r={34 + 14 * exposed} fill="none" stroke={color.human} strokeWidth={stroke.bold} opacity={exposed} /> : null}
          {/* 벽이 서면 사람의 기준이 오해를 드러낸다 */}
          <Trace pts={[[FX + 720, LOW], [Q.x, LOW], [Q.x, UP + 52]]} stroke={color.human} width={stroke.bold} arrow at={wallBack + 4} duration={18} />
        </svg>
        <div style={{ position: "absolute", left: FX, top: UP - 38, ...enter(frame, c2 + 4) }}>
          <AgentIcon size={76} color={color.agent} />
        </div>
        <div style={{ position: "absolute", left: FX + 130, top: UP - 50, ...sans(size.small, 800), color: color.agent, ...enter(frame, c2 + 8) }}>생성</div>
        <Box x={FX + 400} y={UP - 46} w={280} c={color.agent} at={c2 + 14}>
          RTL
        </Box>
        <Box x={FX + 400} y={UP + 46} w={280} c={color.agent} at={c2 + 18}>
          testbench
        </Box>
        <div style={{ opacity: 1 - 0.65 * lowDim }}>
          <div style={{ position: "absolute", left: FX, top: LOW - 38, ...enter(frame, wallUp) }}>
            <HumanIcon size={76} color={color.human} />
          </div>
          <div style={{ position: "absolute", left: FX + 130, top: LOW - 50, ...sans(size.small, 800), color: color.human, ...enter(frame, wallUp + 4) }}>검증 기준</div>
          <Box x={FX + 400} y={LOW} w={320} c={color.human} at={wallUp + 10}>
            ref_model/
            <LockIcon size={34} color={color.human} />
          </Box>
        </div>
        {frame >= shared ? (
          <div style={{ position: "absolute", left: Q.x - 34, top: Q.y - 34, width: 68, height: 68, display: "flex", alignItems: "center", justifyContent: "center", ...mono(size.sub, 700), color: color.problem, opacity: progress(frame, shared + 6, 10) }}>?</div>
        ) : null}
        {[0, 1].map((k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              left: Q.x + 70,
              top: UP - 46 + k * 92 - 28,
              height: 56,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 14px",
              border: `${stroke.thin}px solid ${mix(exposed, color.agent, color.lineStrong)}`,
              ...sans(size.small, 700),
              color: mix(exposed, color.agent, color.inkDim),
              textDecoration: exposed > 0.5 ? "line-through" : "none",
              ...enterExit(frame, passAt + k * 8),
            }}
          >
            <CheckIcon size={26} color={mix(exposed, color.agent, color.inkDim)} />
            통과
          </div>
        ))}
      </div>

      {/* ── 실행 순서 다섯 칸 ──────────────────────────────────────── */}
      <svg {...fullSvg}>
        {[1, 2, 3, 4].map((i) => (
          <Trace key={i} pts={[[96 + i * STAIR.pitch - 30, STAIR.y + STAIR.h / 2], [96 + i * STAIR.pitch - 2, STAIR.y + STAIR.h / 2]]} stroke={color.inkSoft} arrow at={stairAt[i] - 6} duration={8} />
        ))}
      </svg>
      {STAIRS.map((lines, i) => {
        const lit = progress(frame, stairAt[i], 14, ease.out);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 96 + i * STAIR.pitch,
              top: STAIR.y,
              width: STAIR.w,
              height: STAIR.h,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingLeft: 20,
              border: `${stroke.trace}px solid ${mix(lit, color.line, color.human)}`,
              backgroundColor: withAlpha(color.human, 0.14 * lit),
              ...enter(frame, c2 - 6 + i * 3),
            }}
          >
            <div style={{ ...mono(size.head, 700), color: mix(lit, color.lineStrong, color.human) }}>{i + 1}</div>
            <div style={{ ...sans(size.small, 700), color: mix(lit, color.inkDim, color.ink), whiteSpace: "nowrap", lineHeight: 1.22 }}>
              {lines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 96 + 4 * STAIR.pitch - 16 - 150, width: 300, top: 728, textAlign: "center", ...sans(size.small, 700), color: color.human, ...enter(frame, split(c4, e4, 3, 4)) }}>{AFTER}</div>
    </ShiftSheet>
  );
};
