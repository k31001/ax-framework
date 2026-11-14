import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, drawDashed, ease, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { At, Box, mx, tx, useCues } from "./kitA";

// S2 Jira가 아는 것과 모르는 것. 위: 이슈와 이슈를 잇는 링크. 가운데: Jira의 바닥. 아래: 이어지지 않은 조항 · 코드와 답이 있는 곳.

const CHIP = { w: 186, h: 56 } as const;
const REQ = { x: 934, y: 270 } as const;
const FEAT = { x: 1284, y: 270 } as const;
const VER = { x: 1634, ys: [180, 270, 360] } as const;
const BUS = 1552;
const FLOOR = 470;
const UNDER = [
  { text: "계약의 조항", x: 126, w: 230, id: "s2.4", t: 0.04 },
  { text: "RTL module", x: 446, w: 220, id: "s2.4", t: 0.45 },
  { text: "assertion", x: 756, w: 180, id: "s2.4", t: 0.62 },
  { text: "register field", x: 1026, w: 280, id: "s2.5", t: 0.08 },
  { text: "FW 함수", x: 1594, w: 200, id: "s2.5", t: 0.5 },
] as const;
const QUESTIONS = [
  { x: 401, id: "s2.4", t: 0.5 },
  { x: 711, id: "s2.4", t: 0.7 },
  { x: 1450, id: "s2.5", t: 0.56 },
] as const;
const ROWS = [
  ["어느 조항 → 어느 module · assertion", "설계자의 기억"],
  ["어느 field → 어느 FW 함수", "grep · 물어보기"],
  ["이 함수는 왜 있는가", "commit 메시지"],
] as const;

const col = (c: number): number => 120 + c * 15.6;
const row = (i: number): number => 124 + 64 + i * 39 + 14;

export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c1 = cue("s2.1");
  const c2 = cue("s2.2");
  const c3 = cue("s2.3");
  const c4 = cue("s2.4");
  const c5 = cue("s2.5");
  const implAt = within("s2.2", 0.12);
  const testAt = within("s2.2", 0.6);
  const floor = progress(frame, c3, 26, ease.inOut);
  const tableAt = within("s2.5", 0.62);
  const rowAt = [tableAt + 6, tableAt + 14, tableAt + 22];

  const chips = [
    { key: "REQ-207", x: REQ.x, y: REQ.y, at: c1 + 2 },
    { key: "FEAT-338", x: FEAT.x, y: FEAT.y, at: c1 + 10 },
    ...VER.ys.map((y, i) => ({ key: `VER-54${i + 1}`, x: VER.x, y, at: c1 + 18 + i * 4 })),
  ];

  return (
    <ShiftSheet>
      <At x={96} y={74} p={progress(frame, 4, DUR.enter)} style={tx(34, 800)}>
        JIRA가 아는 것
      </At>

      {/* 칩과 링크 */}
      <svg {...fullSvg}>
        <Trace pts={[[FEAT.x, FEAT.y], [REQ.x + CHIP.w, REQ.y]]} stroke={color.ink} arrow at={within("s2.1", 0.45)} />
        {VER.ys.map((y, i) => (
          <Trace key={i} pts={[[VER.x, y], [BUS, y], [BUS, FEAT.y], [FEAT.x + CHIP.w, FEAT.y]]} stroke={color.ink} arrow at={within("s2.1", 0.6) + i * 3} />
        ))}
        {/* Jira의 바닥 */}
        <line x1={96} x2={1824} y1={FLOOR} y2={FLOOR} stroke={color.ink} strokeWidth={stroke.trace} strokeDasharray={drawDashed([12, 10], floor, 1728)} opacity={floor > 0 ? 1 : 0} />
        {/* 그 아래: 가려진 면 */}
        <rect x={56} y={FLOOR + 14} width={1808} height={416} fill="rgba(2, 5, 12, 0.42)" opacity={progress(frame, 2, 14)} />
      </svg>
      {chips.map((c) => (
        <Box key={c.key} x={c.x} y={c.y - CHIP.h / 2} w={CHIP.w} h={CHIP.h} c={color.ink} p={progress(frame, c.at, DUR.enter)} round>
          <div style={mx(30, 700, color.ink)}>{c.key}</div>
        </Box>
      ))}
      <At x={(REQ.x + CHIP.w + FEAT.x) / 2} y={REQ.y - 46} center p={progress(frame, implAt, DUR.enter)} style={mx(24, 700, color.ink)}>
        Implements
      </At>
      <At x={(FEAT.x + CHIP.w + BUS) / 2} y={FEAT.y - 46} center p={progress(frame, testAt, DUR.enter)} style={mx(24, 700, color.ink)}>
        Tests
      </At>
      <At x={FEAT.x + CHIP.w / 2 - 20} y={FEAT.y + 36} center p={progress(frame, within("s2.3", 0.35), DUR.enter)} style={tx(30, 500, color.inkSoft)}>
        파일 수십 개 · 몇 주의 일
      </At>

      <CodePanel
        x={96}
        y={124}
        w={800}
        px={26}
        title="JIRA"
        at={c2}
        lines={[
          "REQ-207  요구사항  REQ-QOS-07 · P99.99 ≤ 2 ms",
          { text: "    is implemented by   FEAT-338  우선 큐", mark: implAt, unmark: testAt },
          "                         계약 HSI-RCV-010",
          { text: "         tested by   VER-541  a_host_first", mark: testAt, unmark: c3 },
          { text: "         tested by   VER-542  a_gc_no_starve", mark: testAt, unmark: c3 },
          { text: "         tested by   VER-543  prio_q_ratio_test", mark: testAt, unmark: c3 },
        ]}
      />

      {/* 트리의 가지(글꼴에 없는 선 문자를 대신 그린다) */}
      <svg {...fullSvg} opacity={progress(frame, c2 + 12, 12)}>
        <path
          d={`M ${col(1.5)} ${row(0) + 16} V ${row(1)} H ${col(3.3)} M ${col(21.7)} ${row(1)} H ${col(23.3)} M ${col(6.5)} ${row(1) + 16} V ${row(5)} H ${col(8.3)} M ${col(6.5)} ${row(3)} H ${col(8.3)} M ${col(6.5)} ${row(4)} H ${col(8.3)} ${[3, 4, 5].map((i) => `M ${col(18.7)} ${row(i)} H ${col(20.3)}`).join(" ")}`}
          fill="none"
          stroke={color.inkDim}
          strokeWidth={stroke.thin}
        />
      </svg>

      <At x={1824} y={FLOOR - 52} right p={progress(frame, c3 + 14, DUR.enter)} style={tx(34, 800)}>
        Jira의 바닥 · 이슈 단위
      </At>

      {/* 그 아래 */}
      <At x={96} y={FLOOR + 26} p={progress(frame, 8, DUR.enter)} style={tx(34, 800, color.inkDim)}>
        그 아래
      </At>
      <Box x={96} y={546} w={870} h={124} c={color.problem} dash bg={withAlpha(color.problem, 0.04)} p={progress(frame, c4, DUR.enter)} />
      <Box x={996} y={546} w={828} h={124} c={color.problem} dash bg={withAlpha(color.problem, 0.04)} p={progress(frame, c5, DUR.enter)} />
      {UNDER.map((u) => (
        <Box key={u.text} x={u.x} y={576} w={u.w} h={64} c={color.lineStrong} p={progress(frame, within(u.id, u.t), DUR.enter)}>
          <div style={tx(32, 600, color.inkSoft)}>{u.text}</div>
        </Box>
      ))}
      {QUESTIONS.map((q, i) => (
        <At key={i} x={q.x} y={570} center p={progress(frame, within(q.id, q.t), DUR.enter)} style={mx(60, 700, color.problem)}>
          ?
        </At>
      ))}

      {/* 질문과 지금 답이 있는 곳 */}
      <At x={96} y={694} p={progress(frame, tableAt, DUR.enter)} style={tx(30, 600, color.inkDim)}>
        질문
      </At>
      <At x={820} y={694} p={progress(frame, tableAt, DUR.enter)} style={tx(30, 600, color.inkDim)}>
        지금 답이 있는 곳
      </At>
      <svg {...fullSvg}>
        <line x1={96} x2={96 + 1180 * progress(frame, tableAt, 20, ease.inOut)} y1={738} y2={738} stroke={color.line} strokeWidth={stroke.thin} />
      </svg>
      {ROWS.map(([q, a], i) => (
        <React.Fragment key={i}>
          <At x={96} y={748 + i * 48} p={progress(frame, rowAt[i], DUR.enter)} style={tx(32, 600)}>
            {q}
          </At>
          <At x={820} y={748 + i * 48} p={progress(frame, rowAt[i] + 4, DUR.enter)} style={tx(32, 700, color.human)}>
            {a}
          </At>
        </React.Fragment>
      ))}
    </ShiftSheet>
  );
};
