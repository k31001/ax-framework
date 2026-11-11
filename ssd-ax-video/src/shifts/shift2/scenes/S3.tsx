import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { At, Boxed, Gate, Header, Layer, LoopRing, T, fade, ringPoint } from "./kit";

// s3 전환 후: gate 세 개는 그대로 서 있고, gate 사이에서 변경이 이벤트가 되어 루프가 돈다.

export const LOOP_STAGES = ["영향 분석", "선택 실행", "분류", "다음 계획"] as const;
export const GATES = ["block gate", "sign-off", "퀄 판정"] as const;

const Y = 560;
const GX = [900, 1310, 1700];
const GR = 36;
const L = { cx: 480, cy: Y, r: 180 };
const DEG = [315, 45, 135, 225];
const SEGS: [number, number][] = [
  [96, GX[0] - GR],
  [GX[0] + GR, GX[1] - GR],
  [GX[1] + GR, GX[2] - GR],
];
const LABEL = [
  { x: 330, y: 366 },
  { x: 630, y: 366 },
  { x: 640, y: 714 },
  { x: 330, y: 714 },
];

export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const c1 = cue("s3.1");
  const c2 = cue("s3.2");
  const c3 = cue("s3.3");
  const c4 = cue("s3.4");

  const base = progress(frame, c1 - 12, 30, ease.inOut);
  const bright = progress(frame, c2, 16);
  const waitIn = progress(frame, c2 + 8, 24, ease.inOut);
  const waitOut = progress(frame, c2 + 62, 22, ease.inOut);
  const eventAt = c3 + 56;
  const mr = progress(frame, c3 + 20, 30, ease.inOut);
  const flash = progress(frame, eventAt, 26);
  const ringAt = c3 + 74;
  const ring = progress(frame, ringAt, 60, ease.inOut) * 0.875 + progress(frame, c4 + 100, 16, ease.inOut) * 0.125;
  const inner = 1 - progress(frame, ringAt, 30);
  const nodeAt = [c4 + 2, c4 + 34, c4 + 62, c4 + 86];
  const turning = frame - (c4 + 118);

  return (
    <ShiftSheet>
      <Header label="AFTER" />
      <Layer>
        {/* gate 사이 구간이 밝아진다 */}
        {SEGS.map(([a, b], i) => (
          <rect key={i} x={a} y={Y - 9} width={b - a} height={18} fill={withAlpha(color.agent, 0.16 * bright)} />
        ))}
        <rect x={L.cx - L.r + 2} y={Y - 10} width={L.r * 2 - 4} height={20} fill={color.bg} opacity={1 - inner} />

        {/* 바탕 trace: 루프 안쪽 구간은 루프가 그려지면 사라진다 */}
        <Trace pts={[[96, Y], [1824, Y]]} stroke={color.lineStrong} progress={base} opacity={inner} />
        <Trace pts={[[96, Y], [L.cx - L.r, Y]]} stroke={bright > 0 ? color.inkSoft : color.lineStrong} progress={inner < 1 ? 1 : 0} />
        <Trace pts={[[L.cx + L.r, Y], [1824, Y]]} stroke={bright > 0 ? color.inkSoft : color.lineStrong} progress={inner < 1 ? 1 : 0} />

        {/* s2의 대기(붉은 점선)가 겹쳐 보였다가 사라진다 */}
        {SEGS.map(([a, b], i) => (
          <Trace key={i} pts={[[a + 8, Y], [b - 8, Y]]} stroke={color.problem} dash="10 9" width={stroke.bold + 0.5} progress={waitIn} opacity={1 - waitOut} />
        ))}

        {/* 변경이 이벤트가 된다 */}
        {flash > 0 ? (
          <>
            <circle cx={L.cx - L.r} cy={Y} r={12 + 44 * flash} fill="none" stroke={color.ink} strokeWidth={stroke.thin} opacity={1 - flash} />
            <circle cx={L.cx - L.r} cy={Y} r={12} fill={color.ink} stroke={color.agent} strokeWidth={stroke.bold} opacity={Math.min(1, flash * 4)} />
          </>
        ) : null}

        {/* 루프 */}
        <LoopRing
          cx={L.cx}
          cy={L.cy}
          r={L.r}
          p={ring}
          start={270}
          arrows={[0, 90, 180, 256]}
          nodes={DEG.map((deg, i) => ({ deg, on: progress(frame, nodeAt[i], DUR.enter) }))}
          dot={turning > 0 ? (270 + turning * 3) % 360 : undefined}
        />
        {flash > 0 ? <circle cx={L.cx - L.r} cy={Y} r={9} fill={color.ink} opacity={Math.min(1, flash * 4)} /> : null}

        {/* gate: 씬 내내 그대로 */}
        {GX.map((x, i) => (
          <Gate key={i} x={x} y={Y} r={GR} p={progress(frame, c1 + i * 8, 20)} />
        ))}
      </Layer>

      {GX.map((x, i) => (
        <React.Fragment key={i}>
          <At x={x} y={Y - 82} opacity={fade(frame, c1 + 12 + i * 8)}>
            <HumanIcon size={44} color={color.human} />
          </At>
          <T x={x} y={Y + 56} at={c1 + 8 + i * 8} align="center" weight={700} color={color.human}>
            {GATES[i]}
          </T>
        </React.Fragment>
      ))}

      {/* Jira 이슈가 먼저 나타나고, MR 표식이 왼쪽에서 들어온다 */}
      <T x={104} y={Y - 162} at={c3} px={size.label} weight={700} color={color.inkSoft} code>
        <span style={{ letterSpacing: "0.08em" }}>JIRA</span>
      </T>
      <T x={104} y={Y - 132} at={c3 + 2} weight={700} code>
        <Boxed tone="human">FEAT-341</Boxed>
      </T>
      <T x={lerp(40, 104, mr)} y={Y - 74} at={c3 + 20} weight={700} code>
        <Boxed tone="human" fill>
          MR !2291
        </Boxed>
      </T>

      <At x={L.cx} y={L.cy} opacity={fade(frame, ringAt + 30)}>
        <AgentIcon size={72} color={color.agent} />
      </At>

      {LOOP_STAGES.map((name, i) => (
        <T key={i} x={LABEL[i].x} y={LABEL[i].y} at={nodeAt[i]} align="center" px={34} weight={700}>
          {name}
        </T>
      ))}
      <At x={ringPoint(L.cx, L.cy, L.r, 225).x - 58} y={ringPoint(L.cx, L.cy, L.r, 225).y - 8} opacity={fade(frame, nodeAt[3] + 14)}>
        <HumanIcon size={40} color={color.human} />
      </At>
    </ShiftSheet>
  );
};
