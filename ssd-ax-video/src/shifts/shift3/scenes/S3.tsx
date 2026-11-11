import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, enterExit, lerp, progress } from "../../../video/anim";
import { AgentIcon, CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace, pointOnTrace, traceLength } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { BundleIcon, DocIcon, STEP_WORDS, Tag, Workflow, mix, split } from "./kit";

// s3 전환 후: 정의 → 실행 → 판단.
//   s3.1  '현재' 표지가 '전환 후'로 바뀌고 빈 칸 셋이 trace 로 이어진다
//   s3.2  정의(사람): 작업 지시서 — 의도 / 통과 기준 / 금지 사항
//   s3.3  실행(에이전트) 루프 → 증거 묶음이 판단(사람)으로 → 승인 / 반려
//   s3.4  '완료했습니다' 말풍선은 판단 칸 입구에서 막힌다
//   s3.5  Jira 의 상태 띠: 지시됨 → 진행 중 → 검토 대기 → (자물쇠) → 승인

const W = 480;
const H = 440;
const Y = 250;
const X = [96, 666, 1236];
const MID = Y + H / 2;

const Cell: React.FC<{ i: number; c: string; drawAt: number; litAt: number; icon: React.ReactNode; children?: React.ReactNode }> = ({ i, c, drawAt, litAt, icon, children }) => {
  const frame = useCurrentFrame();
  const d = progress(frame, drawAt, 18, ease.out);
  const lit = progress(frame, litAt, 14, ease.out);
  if (d <= 0) return null;
  return (
    <div style={{ position: "absolute", left: X[i], top: Y, width: W, height: H, opacity: d }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <rect x={1} y={1} width={W - 2} height={H - 2} fill={withAlpha(color.panel, 0.9)} stroke={mix(lit, color.line, c)} strokeWidth={stroke.thin} />
        <rect x={0} y={0} width={W * lit} height={6} fill={c} />
      </svg>
      <div style={{ position: "absolute", left: 28, top: 22, ...mono(size.label, 700), color: mix(lit, color.inkDim, c) }}>{`STEP 0${i + 1}`}</div>
      <div style={{ position: "absolute", left: 28, top: 58, display: "flex", alignItems: "center", gap: 16, ...enter(frame, litAt) }}>
        {icon}
        <div style={{ ...sans(size.head, 800), color: c }}>{STEP_WORDS[i]}</div>
      </div>
      {children}
    </div>
  );
};

const DEFINE = ["의도", "통과 기준", "금지 사항"];
const LOOP = ["생성", "sim · formal", "수정"];
// 실행 칸 안의 루프 (칸 왼쪽 위 기준)
const NODE = [
  { x: 28, y: 170, w: 120 },
  { x: 232, y: 170, w: 220 },
  { x: 180, y: 320, w: 120 },
];
const NH = 60;
const loopPath: Pt[] = [
  [148, 200],
  [232, 200],
  [342, 200],
  [342, 350],
  [300, 350],
  [240, 350],
  [88, 350],
  [88, 230],
];

export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end } = useScene();
  const c1 = cue("s3.1");
  const c2 = cue("s3.2");
  const c3 = cue("s3.3");
  const c4 = cue("s3.4");
  const e2 = end("s3.2");
  const e3 = end("s3.3");
  const half = split(c3, e3, 1, 2);
  const verdict = split(c3, e3, 3, 4);

  // 증거 묶음이 trace 를 따라 이동
  const hop: Pt[] = [
    [X[1] + W, MID],
    [X[2], MID],
  ];
  const travel = (start: number) => progress(frame, start, 20, ease.inOut);
  const t1 = travel(half);
  const t2 = travel(c4 + 34);
  const moving = frame >= c4 + 34 && t2 < 1 ? t2 : t1 < 1 && frame >= half ? t1 : -1;
  const at = moving >= 0 ? pointOnTrace(hop, traceLength(hop) * moving) : null;

  // 루프를 도는 점
  const loopLen = traceLength(loopPath);
  const dot = frame >= c3 + 16 ? pointOnTrace(loopPath, (((frame - c3 - 16) % 70) / 70) * loopLen) : null;

  // 말풍선
  const bx = lerp(X[1] + 150, X[2] - 262, progress(frame, c4 + 4, 22, ease.inOut));
  const blocked = progress(frame, c4 + 26, 8, ease.out);

  const back: Pt[] = [
    [X[2] + 330, Y + H],
    [X[2] + 330, Y + H + 60],
    [X[1] + W / 2, Y + H + 60],
    [X[1] + W / 2, Y + H + 4],
  ];

  return (
    <ShiftSheet>
      <Tag text="현재" c={color.inkDim} x={96} y={78} at={0} out={c1 + 6} dashed />
      <Tag text="전환 후" c={color.agent} x={96} y={78} at={c1 + 14} />

      <svg {...fullSvg}>
        <Trace pts={[[X[0] + W, MID], [X[1], MID]]} stroke={frame >= c3 ? color.agent : color.inkSoft} arrow at={c1 + 20} />
        <Trace pts={hop} stroke={frame >= half ? color.agent : color.inkSoft} arrow at={c1 + 26} />
        {/* 승인: 밖으로, 반려: 점선으로 실행 칸에 되돌아간다 */}
        <Trace pts={[[X[2] + W, Y + 300], [1824, Y + 300]]} stroke={color.human} width={stroke.bold} arrow at={verdict + 6} />
        <Trace pts={back} stroke={color.problem} dash="10 8" arrow at={verdict + 14} duration={24} />
        {/* 완료 선언을 막는 선 */}
        {blocked > 0 ? <line x1={X[2] - 22} y1={Y - 12} x2={X[2] - 22} y2={Y - 12 - 96 * blocked} stroke={color.problem} strokeWidth={6} /> : null}
      </svg>

      <Cell i={0} c={color.human} drawAt={c1 + 8} litAt={c2} icon={<HumanIcon size={56} color={color.human} />}>
        <div style={{ position: "absolute", left: 28, top: 158, display: "flex", alignItems: "center", gap: 14, ...enter(frame, c2 + 10) }}>
          <DocIcon size={56} color={color.human} />
          <div style={{ ...sans(size.body, 700) }}>작업 지시서</div>
        </div>
        {DEFINE.map((t, i) => (
          <div key={t} style={{ position: "absolute", left: 44, top: 250 + i * 56, display: "flex", alignItems: "center", gap: 16, ...enter(frame, split(c2, e2, i + 1, 4)) }}>
            <div style={{ width: 12, height: 12, backgroundColor: color.human }} />
            <div style={{ ...sans(size.body, 600) }}>{t}</div>
          </div>
        ))}
      </Cell>

      <Cell i={1} c={color.agent} drawAt={c1 + 14} litAt={c3} icon={<AgentIcon size={56} color={color.agent} />}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Trace pts={[loopPath[0], loopPath[1]]} stroke={color.agent} arrow at={c3 + 10} />
          <Trace pts={[loopPath[2], loopPath[3], loopPath[4]]} stroke={color.agent} arrow at={c3 + 16} />
          <Trace pts={[loopPath[5], loopPath[6], loopPath[7]]} stroke={color.agent} arrow at={c3 + 22} />
          {dot ? <circle cx={dot.x} cy={dot.y} r={8} fill={color.agent} /> : null}
        </svg>
        {LOOP.map((t, i) => (
          <div
            key={t}
            style={{
              position: "absolute",
              left: NODE[i].x,
              top: NODE[i].y,
              width: NODE[i].w,
              height: NH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `${stroke.thin}px solid ${color.agent}`,
              backgroundColor: color.panel,
              ...sans(size.small, 700),
              whiteSpace: "nowrap",
              ...enter(frame, c3 + 8 + i * 6),
            }}
          >
            {t}
          </div>
        ))}
      </Cell>

      <Cell i={2} c={color.human} drawAt={c1 + 20} litAt={half + 12} icon={<HumanIcon size={56} color={color.human} />}>
        <div style={{ position: "absolute", left: 28, top: 158, display: "flex", alignItems: "center", gap: 14, ...enter(frame, half + 18) }}>
          <BundleIcon size={56} color={color.agent} />
          <div style={{ ...sans(size.body, 700) }}>증거 묶음</div>
        </div>
        <div style={{ position: "absolute", left: 250, top: 270, display: "flex", alignItems: "center", gap: 12, height: 60, padding: "0 18px", border: `${stroke.trace}px solid ${color.human}`, backgroundColor: withAlpha(color.human, 0.16), ...enter(frame, verdict) }}>
          <CheckIcon size={30} color={color.human} />
          <div style={{ ...sans(size.body, 800), color: color.human }}>승인</div>
        </div>
        <div style={{ position: "absolute", left: 250, top: 352, height: 60, display: "flex", alignItems: "center", padding: "0 18px", border: `${stroke.trace}px dashed ${color.problem}`, ...sans(size.body, 800), color: color.problem, ...enter(frame, verdict + 8) }}>
          반려
        </div>
      </Cell>

      {/* trace 를 따라 가는 증거 묶음 */}
      {at ? (
        <div style={{ position: "absolute", left: at.x - 26, top: at.y - 26, backgroundColor: color.bg }}>
          <BundleIcon size={52} color={color.agent} />
        </div>
      ) : null}

      {/* 완료 보고 말풍선 */}
      {frame >= c4 ? (
        <div style={{ position: "absolute", left: bx, top: Y - 98, ...enterExit(frame, c4) }}>
          <div
            style={{
              height: 64,
              padding: "0 18px",
              display: "flex",
              alignItems: "center",
              border: `${stroke.trace}px solid ${mix(blocked, color.agent, color.problem)}`,
              backgroundColor: color.panel,
              ...sans(size.small, 700),
              color: mix(blocked, color.agent, color.inkSoft),
              whiteSpace: "nowrap",
            }}
          >
            완료했습니다
          </div>
        </div>
      ) : null}
      <Workflow x={96} y={Y + H + 96} label="JIRA · WORKFLOW" start={cue("s3.5")} at={[0, 1, 2, 3].map((i) => split(cue("s3.5"), end("s3.5"), i, 4) + 6)} />
      <Tag text="증거 아님" c={color.problem} x={X[2]} y={Y - 90} at={c4 + 30} fill />
    </ShiftSheet>
  );
};
