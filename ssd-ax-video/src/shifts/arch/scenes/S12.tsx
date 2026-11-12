import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enter, progress } from "../../../video/anim";
import { HumanIcon, LoopIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { DocPanel, GROUPS, ScatterMarks, T, blend, groupLabel, pickPoint, useCues } from "./kitB";
import type { DocRow, PlotRect } from "./kitB";

// s12 고르고 기록하기.
// 아래: 사람 레인(아키텍트 선택, RTL 리드 · FW 리드 승인). 위: 고른 점 → 결정 기록(ADR, git 원본) ← Jira 이슈.

const LANE = { y: 672, boxY: 704, boxH: 76, x0: 290, w: 380, pitch: 420 } as const;
const PEOPLE = ["아키텍트 · 선택", "RTL 리드 · 승인", "FW 리드 · 승인"];
const R: PlotRect = { x: 560, y: 124, w: 800, h: 470 };
const ADR = { x: 96, y: 96, w: 1074, px: 26 } as const;
const JIRA = { x: 1198, y: 96, w: 626, px: 26 } as const;
const LINE_H = Math.round(26 * 1.5);

export const S12: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end, within } = useCues();
  const t1 = cue("s12.1");
  const t2 = cue("s12.2");
  const t3 = cue("s12.3");
  const t4 = cue("s12.4");
  const t5 = cue("s12.5");
  const who = [t1, within("s12.1", 0.5), within("s12.1", 0.72)];

  const plot = progress(frame, 6, DUR.enter) * (1 - progress(frame, t2 - 8, DUR.exit, ease.in));
  const ringAt = within("s12.1", 0.22);
  const ring = progress(frame, ringAt, DUR.draw);
  const [px, py] = pickPoint(R);
  const firstCx = LANE.x0 + LANE.w / 2;

  const lit3 = [t3, within("s12.3", 0.2), within("s12.3", 0.42), within("s12.3", 0.66)];
  const rowAt = (i: number): number => t2 + 10 + i * 2;
  const restAt = end("s12.4") - 6;
  const adr: DocRow[] = [
    { full: true, text: "# ADR-RCV-003  read 오류 복구 구조    상태: 승인", at: rowAt(0) },
    { full: true, text: "jira: FEAT-330 · req: REQ-QOS-07         (예시)", at: rowAt(1), c: color.inkSoft },
    { label: "맥락", text: "QLC 수명 말기에 soft 진입률 3e-4.", at: rowAt(2), lit: lit3[0], mark: lit3[0], unmark: lit3[1] },
    { text: "P99.99를 soft 경로가 정한다", at: rowAt(3), lit: lit3[0], mark: lit3[0], unmark: lit3[1] },
    { label: "결정", text: "구조 C. 복구 단계 제어를 HW(rcv_ctrl)로,", at: rowAt(4), lit: lit3[1], mark: lit3[1], unmark: lit3[2] },
    { text: "soft decoder 전용 3기, host 우선 큐", at: rowAt(5), lit: lit3[1], mark: lit3[1], unmark: lit3[2] },
    { label: "버린 안", text: "A · B 지연 초과 / D 면적 · 전력 초과", at: rowAt(6), lit: lit3[2], mark: lit3[2], unmark: lit3[3] },
    { label: "근거", text: "model@4c1e9f2 · VER-506 · 보정 오차 +10%", at: rowAt(7), lit: lit3[3], mark: lit3[3], unmark: t4 },
    {
      label: "전제",
      text: "soft 진입률 ≤ 5e-4. 넘으면 다시 연다",
      at: rowAt(8),
      lit: t4,
      mark: t4,
      markC: color.human,
      right: (
        <div style={{ display: "flex", alignItems: "center", gap: 10, ...enter(frame, within("s12.4", 0.5), { from: "left" }) }}>
          <LoopIcon size={28} color={color.human} />
          <div style={{ ...sans(30, 700), color: color.human, whiteSpace: "nowrap" }}>NAND 평가 데이터 갱신 때 재확인</div>
        </div>
      ),
    },
    { label: "결과", text: "FW는 정책 · table · parity 복구. 면적 +14%", at: rowAt(9), lit: restAt },
    { label: "승인", text: "아키텍트 · RTL 리드 · FW 리드", at: rowAt(10), lit: restAt, c: color.human },
  ];

  const moved = progress(frame, within("s12.5", 0.5), 12);
  const chip = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ ...mono(26, 500), letterSpacing: "0", color: color.inkSoft }}>상태:</div>
      <div style={{ height: 34, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 10px", border: `${stroke.thin}px solid ${blend(color.agent, color.human, moved)}`, backgroundColor: withAlpha(moved > 0.5 ? color.human : color.agent, 0.14), ...sans(26, 700), color: blend(color.agent, color.human, moved), whiteSpace: "nowrap" }}>{moved > 0.5 ? "구현 중" : "검토 대기"}</div>
    </div>
  );
  const jAt = (i: number): number => t5 + 8 + i * 3;
  const linkAt = within("s12.5", 0.62);
  const jira: DocRow[] = [
    { full: true, text: "FEAT-330  설계 기능", at: jAt(0), right: chip },
    { full: true, text: "read 오류 복구 구조 (구조 결정)", at: jAt(1) },
    { full: true, text: "담당: arch-agent   검토: 아키텍트", at: jAt(2), c: color.inkSoft },
    { label: "링크", text: "implements REQ-207", at: jAt(3), c: color.inkSoft },
    { text: "tested by VER-505 (구조 모델 P99.99)", at: jAt(4), c: color.inkSoft },
    { full: true, text: "결정 기록: arch/adr/ADR-RCV-003.md", at: jAt(5), mark: linkAt },
    { label: "댓글", text: "arch-agent  [에이전트 · 증거]", at: jAt(6), c: color.agent },
    { text: "216 구성, 제약 통과 9. 실행 VER-506", at: jAt(7), c: color.inkSoft },
    { text: "확인 못 한 것: 고온 방치 직후 조건", at: jAt(8), c: color.inkSoft },
  ];
  const linkY = JIRA.y + 44 + 16 + 5 * LINE_H + LINE_H / 2;

  return (
    <ShiftSheet>
      {/* ── 고른 점 ── */}
      {plot > 0 ? (
        <div style={{ opacity: plot }}>
          <svg {...fullSvg}>
            <ScatterMarks r={R} shown={() => 1} hLine={1} vLine={1} shade={1} outAB={1} outD={1} focus={0.55} pareto={1} ring={ring} dot={4} />
            <Trace pts={[[firstCx, LANE.boxY], [firstCx, 640], [px, 640], [px, py + 22]]} stroke={color.human} width={stroke.trace} arrow at={ringAt - 6} duration={24} />
          </svg>
          {GROUPS.map((n, g) => {
            const [x, y] = groupLabel(R, g);
            return <T key={n} x={x} y={y - 22} text={n} px={36} code weight={700} c={g === 2 ? color.agent : color.problem} align="center" opacity={g === 2 ? 1 : 0.7} />;
          })}
          <T x={R.x} y={R.y - 44} text="216 구성 · eol_mixed" px={30} weight={700} c={color.inkSoft} />
        </div>
      ) : null}

      {/* ── 결정 기록 (원본은 git) ── */}
      <DocPanel
        x={ADR.x}
        y={ADR.y}
        w={ADR.w}
        title="arch/adr/ADR-RCV-003.md"
        rows={adr}
        at={t2}
        px={ADR.px}
        labelW={112}
        owner="human"
        headRight={<div style={{ ...mono(22, 700), color: color.human, padding: "2px 10px", border: `${stroke.hair}px solid ${color.human}`, ...enter(frame, t5, { distance: 0 }) }}>GIT · SOURCE</div>}
      />

      {/* ── Jira 이슈 ── */}
      <DocPanel x={JIRA.x} y={JIRA.y} w={JIRA.w} title="JIRA · 설계 기능" rows={jira} at={within("s12.5", 0.3)} px={JIRA.px} labelW={66} owner="agent" />
      <svg {...fullSvg}>
        <Trace pts={[[JIRA.x, linkY], [JIRA.x - 15, linkY], [JIRA.x - 15, ADR.y + 22], [ADR.x + ADR.w + 2, ADR.y + 22]]} stroke={color.agent} width={stroke.trace} arrow at={linkAt + 4} duration={20} />
      </svg>

      {/* ── 사람 레인 ── */}
      <svg {...fullSvg}>
        <line x1={96} x2={1824} y1={LANE.y} y2={LANE.y} stroke={color.human} strokeWidth={stroke.hair} strokeDasharray="8 8" opacity={0.6 * progress(frame, 4, DUR.draw)} />
        <line x1={97} x2={97} y1={LANE.y} y2={LANE.y + 140} stroke={color.human} strokeWidth={stroke.trace} opacity={progress(frame, 4, DUR.draw)} />
      </svg>
      <div style={{ position: "absolute", left: 122, top: LANE.y + 22, ...enter(frame, 4) }}>
        <HumanIcon size={34} color={color.human} />
        <div style={{ ...sans(32, 800), color: color.human, marginTop: 6 }}>사람</div>
        <div style={{ ...mono(22, 500), color: color.inkDim }}>HUMAN</div>
      </div>
      {PEOPLE.map((p, i) => (
        <div key={p} style={{ position: "absolute", left: LANE.x0 + i * LANE.pitch, top: LANE.boxY, width: LANE.w, height: LANE.boxH, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.line}`, borderLeft: `5px solid ${color.human}`, backgroundColor: withAlpha(color.human, 0.07), display: "flex", alignItems: "center", paddingLeft: 26, ...enter(frame, who[i]) }}>
          <div style={{ ...sans(34, 700), whiteSpace: "nowrap" }}>{p}</div>
        </div>
      ))}
    </ShiftSheet>
  );
};
