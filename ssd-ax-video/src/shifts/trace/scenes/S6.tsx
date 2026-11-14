import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { TAG_EDGES, TraceGraph, edgeLabelAt, place } from "./graph";
import { At, Box, StepStrip, blend, mx, tx, useCues } from "./kitA";

// S6 채우는 방법 ① 도구로 읽는다. 왼쪽의 원천 다섯에서 오른쪽 그래프로: 노드가 회색에서 제 색으로, 청록 엣지가 그려진다.

export const VIEW6 = { x: 906, y: 150, scale: 0.7 } as const;
const FRAME = { x: 892, y: 140, w: 932, h: 590 } as const;
const SRC = { x: 96, w: 200, h: 60, y0: 160, pitch: 76 } as const;
const SLOT = { x: 96, y: 580, w: 800 } as const;
const NAMES = ["Jira", "git", "SystemRDL", "RTL", "FW"] as const;

export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c1 = cue("s6.1");
  const c2 = cue("s6.2");
  const c3 = cue("s6.3");
  const c4 = cue("s6.4");
  const c5 = cue("s6.5");
  const c6 = cue("s6.6");
  const c7 = cue("s6.7");

  const gitAt = within("s6.2", 0.6);
  const linkAt = within("s6.3", 0.22);
  const treeAt = within("s6.3", 0.5);
  const xrayAt = within("s6.3", 0.78);
  const fieldAt = within("s6.4", 0.5);
  const rtlAt = within("s6.5", 0.35);
  const fwAt = within("s6.6", 0.25);
  const callAt = within("s6.6", 0.5);
  const regAt = within("s6.6", 0.78);
  /** 원천 상자가 켜지는 프레임 */
  const srcAt = [c3, gitAt - 10, c4, c5, c6];

  // 노드는 회색으로 있다가 읽힌 순간 제 색이 된다
  const read: [number, string[]][] = [
    [gitAt, ["ac1", "order"]],
    [c3 + 10, ["REQ-207", "FEAT-338", "VER-541", "VER-542", "VER-543"]],
    [xrayAt, ["pass"]],
    [fieldAt, ["field"]],
    [rtlAt, ["prio_q", "a_host_first", "a_gc_no_starve", "ratio_test"]],
    [fwAt, ["set_host_burst", "policy_init", "throttle_update", "stats_dump"]],
  ];
  const appear: Record<string, number> = {
    jira_impl: linkAt,
    tests_541: linkAt + 5,
    tests_542: linkAt + 8,
    tests_543: linkAt + 11,
    trk_req: treeAt,
    trk_feat: treeAt + 4,
    res_541: xrayAt + 4,
    res_542: xrayAt + 8,
    res_543: xrayAt + 12,
    reads_prio_q: within("s6.5", 0.7),
    trk_541: within("s6.5", 0.7) + 6,
    trk_542: within("s6.5", 0.7) + 9,
    trk_543: within("s6.5", 0.7) + 12,
    gen_shb: callAt,
    writes_policy: callAt + 4,
    reads_stats: callAt + 8,
    writes_gc: regAt,
  };
  for (const id of TAG_EDGES) appear[id] = c7 + 6;

  const [vx, vy] = place(VIEW6, ...edgeLabelAt("writes_gc"));
  const via = progress(frame, regAt + 14, DUR.enter);
  const srcY = (i: number): number => SRC.y0 + i * SRC.pitch;

  return (
    <ShiftSheet>
      <StepStrip active={0} c={color.agent} at={c1} onAt={c2} />

      <Box x={FRAME.x} y={FRAME.y} w={FRAME.w} h={FRAME.h} c={color.line} bg="transparent" bw={stroke.hair} p={progress(frame, c2 + 6, DUR.enter)} />
      <TraceGraph
        {...VIEW6}
        opacity={progress(frame, c2 + 8, DUR.enter)}
        appear={appear}
        looks={[{ ids: TAG_EDGES, look: "ghost" }, ...read.map(([until, ids]) => ({ ids, look: "ghost" as const, until }))]}
        hi={read.map(([at, ids]) => ({ ids, at, out: at + 26, ring: true }))}
      />

      {/* 원천 다섯 */}
      <svg {...fullSvg}>
        {NAMES.map((_, i) => (
          <Trace key={i} pts={[[SRC.x + SRC.w, srcY(i) + SRC.h / 2], [FRAME.x, srcY(i) + SRC.h / 2]]} stroke={color.agent} arrow at={srcAt[i]} duration={20} />
        ))}
      </svg>
      {NAMES.map((name, i) => {
        const lit = progress(frame, srcAt[i], 12);
        return (
          <Box key={name} x={SRC.x} y={srcY(i)} w={SRC.w} h={SRC.h} c={blend(color.lineStrong, color.agent, lit)} bg={blend(color.panel, color.agent, 0.12 * lit)} p={progress(frame, c2 + i * 4, DUR.enter)}>
            <div style={tx(30, 700, blend(color.inkSoft, color.ink, lit))}>{name}</div>
          </Box>
        );
      })}

      {/* 아래 칸: 지금 읽는 원천의 조각 */}
      <CodePanel
        x={SLOT.x}
        y={SLOT.y}
        w={SLOT.w}
        px={28}
        title="REST"
        owner="agent"
        at={c3 + 4}
        out={c4 - 8}
        lines={[
          { text: "Jira REST    이슈 · 링크 · 변경 이력", at: c3 + 10 },
          { text: "R4J REST     트리 위치", at: treeAt - 4 },
          { text: "Xray REST    Test · Test Execution 결과", at: xrayAt - 4 },
        ]}
      />
      <CodePanel
        x={SLOT.x}
        y={SLOT.y}
        w={SLOT.w}
        px={26}
        title="hsi/rdl/rcv_ctrl.rdl (예시)"
        owner="human"
        at={c4 + 2}
        out={c5 - 8}
        lines={[
          "reg {",
          { text: " field { sw = rw; hw = r; } HOST_BURST[3:0] = 4;", mark: fieldAt - 6 },
          " field { sw = rw; hw = r; } GC_BOOST[8:8] = 0;",
          "} PRIOQ_CFG @ 0x60;",
          { text: "→ systemrdl-compiler → Reg 1 · Field 2", tone: "agent", at: fieldAt },
        ]}
      />
      <At x={SLOT.x} y={SLOT.y + 30} p={progress(frame, c5 + 6, DUR.enter)} o={1 - progress(frame, c6 - 10, 8)} style={tx(36, 700, color.agent)}>
        elaboration → module · port · assertion · 계층
      </At>
      <CodePanel
        x={SLOT.x}
        y={SLOT.y}
        w={SLOT.w}
        px={26}
        title="fw/gc/gc_throttle.cpp (예시)"
        owner="human"
        at={c6 + 2}
        out={c7 - 8}
        lines={[
          "void gc::throttle_update(Bus& bus,",
          "                         uint32_t backlog) {",
          { text: "  bus.write(rcv_ctrl::PRIOQ_CFG,", mark: regAt - 8 },
          { text: "            (backlog > kHigh) << 8);", mark: regAt - 8 },
          "}",
          { text: "→ compile DB + clang 색인 → WRITES {via:'reg'}", tone: "agent", at: regAt },
        ]}
      />
      <At x={vx - 152} y={vy - 17} p={via} style={{ ...mx(22, 700, color.agent), height: 34, padding: "0 10px", display: "flex", alignItems: "center", border: `${stroke.hair}px solid ${color.agent}`, backgroundColor: withAlpha(color.bg, 0.96) }}>
        via: reg (통째 쓰기)
      </At>

      <At x={SLOT.x} y={SLOT.y + 40} p={progress(frame, c7 + 4, DUR.enter)} style={tx(52, 800, color.agent)}>
        LLM 사용 0 · method: extract
      </At>
    </ShiftSheet>
  );
};
