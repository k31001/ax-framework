import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, draw, ease, lerp, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, mono, sans, size, stroke } from "../../../video/theme";
import { CodePanel, ShiftSheet, useScene } from "../../lib";
import { At, Gate, Glyph, Header, Layer, LoopRing, T, TestGrid, fade } from "./kit";
import { GATES, LOOP_STAGES } from "./S3";

// s8 지키는 선과 마무리: 네 가지 선을 차례로 보이고, 마지막에 gate 는 그대로 서 있고 그 사이마다 루프가 도는 그림.

const PITCH = 12;
const GL = { x: 330, y: 232 };
const GR = { x: 1110, y: 232 };
const GW = 40 * PITCH;
const GH = 32 * PITCH;

const Gauge: React.FC<{ cx: number; cy: number; r: number; p: number; fill: number }> = ({ cx, cy, r, p, fill }) => {
  if (p <= 0) return null;
  const arc = Math.PI * r;
  const a = Math.PI * (1 - fill * p);
  return (
    <g opacity={Math.min(1, p * 3)}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color.lineStrong} strokeWidth={10} />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color.agent} strokeWidth={10} strokeDasharray={`${arc * fill * p} ${arc * 2}`} />
      {/* 상한 */}
      <line x1={cx + (r - 16) * Math.cos(Math.PI * (1 - fill))} y1={cy - (r - 16) * Math.sin(Math.PI * (1 - fill))} x2={cx + (r + 16) * Math.cos(Math.PI * (1 - fill))} y2={cy - (r + 16) * Math.sin(Math.PI * (1 - fill))} stroke={color.human} strokeWidth={stroke.bold} />
      <line x1={cx} y1={cy} x2={cx + (r - 24) * Math.cos(a)} y2={cy - (r - 24) * Math.sin(a)} stroke={color.ink} strokeWidth={stroke.trace} />
      <circle cx={cx} cy={cy} r={7} fill={color.ink} />
    </g>
  );
};

// 마지막 그림
const FY = 600;
const FGATE = [640, 1180, 1720];
const FLOOP = [368, 910, 1450];
const FR = 118;

export const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, script } = useScene();
  const c1 = cue("s8.1");
  const c2 = cue("s8.2");
  const c3 = cue("s8.3");
  const c4 = cue("s8.4");
  const c5 = cue("s8.5");
  const gone = (out: number) => 1 - progress(frame, out, DUR.exit, ease.in);
  const o1 = gone(c2 - 8);
  const o2 = gone(c3 - 8);
  const o3 = gone(c4 - 8);
  const o4 = gone(c5 - 8);

  // s8.2
  const lockAt = c2 + 74;
  // s8.4
  const run = progress(frame, c4 + 4, 40, ease.inOut);
  const bubbleX = lerp(380, 760, run);
  const signAt = c4 + 50;
  const sign = progress(frame, signAt, 34, ease.inOut);
  // s8.5
  const base = progress(frame, c5, 30, ease.inOut);
  const titleAt = c5 + 78;

  return (
    <ShiftSheet hold>
      <div style={{ opacity: o4 }}>
        <Header label="GUARDRAILS" />
      </div>

      {/* s8.1 선택 실행 ≠ 전체 regression */}
      {o1 > 0 ? (
        <div style={{ opacity: o1 }}>
          <Layer>
            <TestGrid x={GL.x} y={GL.y} pitch={PITCH} p={progress(frame, c1 - 8, 20)} sel={progress(frame, c1, 20)} rnd={progress(frame, c1 + 6, 20)} />
            <TestGrid x={GR.x} y={GR.y} pitch={PITCH} p={progress(frame, c1 - 4, 20)} all={progress(frame, c1 + 46, 40)} />
            <line x1={GL.x} y1={718} x2={GL.x + (GR.x + GW - GL.x) * progress(frame, c1 + 92, 20)} y2={718} stroke={color.lineStrong} strokeWidth={stroke.hair} />
          </Layer>
          <T x={GL.x} y={172} at={c1 - 4} px={size.body} weight={800}>
            {LOOP_STAGES[1]}
          </T>
          <T x={GR.x} y={172} at={c1 + 44} px={size.body} weight={800}>
            전체 regression
          </T>
          <T x={(GL.x + GW + GR.x) / 2} y={GL.y + GH / 2 - 84} at={c1 + 22} px={130} weight={700} align="center" color={color.human}>
            ≠
          </T>
          <T x={GL.x} y={GL.y + GH + 14} at={c1 + 8} px={32} weight={700} color={color.agent} code>
            41 + 20
          </T>
          <T x={GR.x} y={GL.y + GH + 14} at={c1 + 60} px={32} weight={700} color={color.agent} code>
            1,280
          </T>
          <T x={(GL.x + GR.x + GW) / 2} y={734} at={c1 + 94} px={34} weight={600} align="center">
            놓친 비율을 상시 측정
          </T>
        </div>
      ) : null}

      {/* s8.2 정책은 사람 소유 */}
      {frame >= c2 - 2 && o2 > 0 ? (
        <div style={{ opacity: o2 }}>
          <CodePanel
            x={330}
            y={250}
            w={830}
            title="gating/block.yaml"
            owner="human"
            at={c2}
            step={3}
            lines={[
              { text: "# gating/block.yaml   소유자: 검증 리드", tone: "dim" },
              "policy_version: v2.1",
              "min_pass_rate: 0.95",
              "contract_assertions: must_pass",
              "allow_known_issues: true   # 티켓 연결분만",
              { text: "agent_may_edit: false", mark: lockAt, markTone: "human" },
            ]}
          />
          <Layer>
            <Trace pts={[[1262, 330], [1166, 330]]} stroke={color.human} arrow at={c2 + 20} />
            <Trace pts={[[1262, 540], [1246, 540]]} stroke={color.agent} dash="6 6" at={lockAt} duration={8} />
            {progress(frame, lockAt + 4) > 0 ? (
              <rect x={1180} y={510} width={60} height={60} fill={color.bg} stroke={color.agent} strokeWidth={stroke.thin} opacity={progress(frame, lockAt + 4)} />
            ) : null}
          </Layer>
          <At x={1304} y={330} opacity={fade(frame, c2 + 14)}>
            <HumanIcon size={64} color={color.human} />
          </At>
          <T x={1356} y={306} at={c2 + 16} px={size.body} weight={700} color={color.human}>
            소유자: 검증 리드
          </T>
          <At x={1304} y={540} opacity={fade(frame, lockAt - 6)}>
            <AgentIcon size={64} color={color.agent} />
          </At>
          <At x={1210} y={540} opacity={fade(frame, lockAt + 4)}>
            <Glyph kind="lock" size={40} color={color.agent} />
          </At>
        </div>
      ) : null}

      {/* s8.3 장비 · license 예산 */}
      {frame >= c3 - 2 && o3 > 0 ? (
        <div style={{ opacity: o3 }}>
          <CodePanel
            x={330}
            y={300}
            w={900}
            title="ci/loop.yaml"
            at={c3}
            step={14}
            lines={[
              { text: "run:       { budget: { license: 40, wall: 60m } }", mark: c3 + 44 },
              { text: "emu_smoke: { budget: { slots: 2,  wall: 90m } }", mark: c3 + 6, unmark: c3 + 40 },
            ]}
          />
          <Layer>
            <Gauge cx={1420} cy={420} r={84} p={progress(frame, c3 + 46, 30, ease.inOut)} fill={0.62} />
            <Gauge cx={1680} cy={420} r={84} p={progress(frame, c3 + 8, 30, ease.inOut)} fill={0.8} />
          </Layer>
          <T x={1420} y={440} at={c3 + 46} px={28} align="center" weight={500} code>
            license 40
          </T>
          <T x={1680} y={440} at={c3 + 8} px={28} align="center" weight={500} code>
            slots 2
          </T>
        </div>
      ) : null}

      {/* s8.4 sign-off 는 사람 */}
      {frame >= c4 - 2 && o4 > 0 ? (
        <div style={{ opacity: o4 }}>
          <Layer>
            <Trace pts={[[300, 460], [916, 460]]} stroke={color.inkSoft} at={c4 - 2} />
            <Trace pts={[[1004, 460], [1620, 460]]} stroke={sign >= 1 ? color.human : color.lineStrong} at={c4 + 2} arrow />
            <Gate x={960} y={460} r={44} p={progress(frame, c4, 18)} lit={progress(frame, signAt + 30, 14)} />
            {/* 에이전트의 '검토 대기'는 gate 앞에서 멈춘다 */}
            <line x1={888} y1={420} x2={888} y2={500} stroke={color.human} strokeWidth={stroke.bold} opacity={progress(frame, c4 + 36)} />
            {/* 서명란 */}
            <line x1={1130} y1={640} x2={1130 + 420 * progress(frame, c4 + 30, DUR.draw)} y2={640} stroke={color.human} strokeWidth={stroke.thin} />
            <path
              d="M 1160 626 c 14 -58 44 -58 40 -6 s 30 22 48 -18 s 26 -22 40 14 s 36 10 60 -14 s 30 -8 70 4"
              fill="none"
              stroke={color.human}
              strokeWidth={stroke.bold}
              strokeLinecap="round"
              pathLength={1}
              {...draw(sign)}
              opacity={sign > 0 ? 1 : 0}
            />
            <Trace pts={[[960, 508], [960, 640], [1124, 640]]} stroke={color.human} at={c4 + 24} />
          </Layer>
          <T x={960} y={378} at={c4 + 4} align="center" weight={700} color={color.human}>
            {GATES[1]}
          </T>
          <div
            style={{
              position: "absolute",
              left: bubbleX,
              top: 420,
              height: 80,
              padding: "0 22px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: `${stroke.thin}px solid ${color.agent}`,
              backgroundColor: color.panel,
              translate: "-100% 0",
              opacity: fade(frame, c4 + 2),
            }}
          >
            <AgentIcon size={40} color={color.agent} />
            <div style={{ ...sans(size.body, 700), color: color.agent, whiteSpace: "nowrap" }}>검토 대기</div>
          </div>
          <At x={1590} y={606} opacity={fade(frame, c4 + 34)}>
            <HumanIcon size={56} color={color.human} />
          </At>
          <T x={1130} y={688} at={signAt + 30} weight={700} color={color.human}>
            검토 대기 → 승인
          </T>
          <div style={{ position: "absolute", left: 1130, top: 652, ...mono(size.label, 700), color: color.human, opacity: fade(frame, c4 + 32) }}>SIGN-OFF</div>
        </div>
      ) : null}

      {/* s8.5 마지막 그림: gate 는 그대로, 그 사이마다 루프 */}
      {frame >= c5 - 2 ? (
        <>
          <Layer>
            <Trace pts={[[96, FY], [1824, FY]]} stroke={color.inkSoft} progress={base} />
            {FLOOP.map((cx, i) => {
              const at = c5 + 34 + i * 10;
              const p = progress(frame, at, 34, ease.inOut);
              const t = frame - at - 34;
              return (
                <g key={i}>
                  <rect x={cx - FR + 2} y={FY - 6} width={FR * 2 - 4} height={12} fill={color.bg} opacity={p > 0 ? 1 : 0} />
                  <LoopRing
                    cx={cx}
                    cy={FY}
                    r={FR}
                    p={p}
                    start={270}
                    arrows={[0, 90, 180, 270]}
                    nodes={[315, 45, 135, 225].map((deg) => ({ deg, on: p >= 1 ? 1 : 0 }))}
                    nodeR={9}
                    dot={t > 0 ? (270 + t * 3 + i * 120) % 360 : undefined}
                  />
                </g>
              );
            })}
            {FGATE.map((x, i) => (
              <Gate key={i} x={x} y={FY} r={36} p={progress(frame, c5 + 6 + i * 6, 18)} lit={0.25} />
            ))}
          </Layer>
          {FGATE.map((x, i) => (
            <React.Fragment key={i}>
              <At x={x} y={FY - 82} opacity={fade(frame, c5 + 12 + i * 6)}>
                <HumanIcon size={44} color={color.human} />
              </At>
              <T x={x} y={FY + 56} at={c5 + 10 + i * 6} align="center" weight={700} color={color.human}>
                {GATES[i]}
              </T>
            </React.Fragment>
          ))}
          {FLOOP.map((cx, i) => (
            <At key={i} x={cx} y={FY} opacity={fade(frame, c5 + 52 + i * 10)}>
              <AgentIcon size={52} color={color.agent} />
            </At>
          ))}
          <div style={{ position: "absolute", left: 0, top: 216, width: 1920, display: "flex", justifyContent: "center", alignItems: "center", gap: 36 }}>
            <div style={{ ...sans(size.title, 500), color: color.inkDim, whiteSpace: "nowrap", opacity: fade(frame, titleAt) }}>{script.from}</div>
            <svg width={120} height={24} style={{ flex: "none" }}>
              <line x1={0} y1={12} x2={104 * progress(frame, titleAt + 10, DUR.draw, ease.inOut)} y2={12} stroke={color.agent} strokeWidth={stroke.bold} />
              <path d="M 104 4 L 118 12 L 104 20 Z" fill={color.agent} opacity={progress(frame, titleAt + 10, DUR.draw) >= 1 ? 1 : 0} />
            </svg>
            <div style={{ ...sans(size.title, 800), whiteSpace: "nowrap", opacity: fade(frame, titleAt + 22) }}>{script.to}</div>
          </div>
        </>
      ) : null}
    </ShiftSheet>
  );
};
