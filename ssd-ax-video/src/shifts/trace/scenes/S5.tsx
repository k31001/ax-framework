import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, stroke } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { TraceGraph, edgeLabelAt, place } from "./graph";
import { At, blend, mx, tx, useCues } from "./kitA";

// S5 그래프란: 엣지와 출처. s4 의 노드 위에 엣지가 흰 선으로 그려지고, s5.4 에서 출처별로 색이 갈린다.

const CARD = { x: 1178, y: 330, w: 646, px: 26 } as const;
const KINDS = ["derives_from", "implements", "verifies", "reads", "writes", "calls", "instantiates", "generated_from", "tracks", "result", "observed_at"] as const;

export const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c2 = cue("s5.2");
  const c3 = cue("s5.3");
  const c4 = cue("s5.4");
  const c5 = cue("s5.5");

  // s5.3 에서 그래프가 조금 물러나 엣지 카드의 자리를 낸다
  const shrink = progress(frame, c3 - 14, 22, ease.inOut);
  const view = { x: 96, y: 80, scale: lerp(1, 0.82, shrink) };

  const g1 = within("s5.1", 0.3);
  const g2 = within("s5.1", 0.44);
  const g3 = within("s5.1", 0.56);
  const g4 = within("s5.1", 0.68);
  const g5 = within("s5.1", 0.86);
  const bugAt = within("s5.2", 0.42);
  const bugOut = c3 - 14;
  const appear: Record<string, number> = {
    derives: g1,
    impl_field: g2,
    impl_prio_q: g2 + 4,
    ver_host: g3,
    ver_gc: g3 + 3,
    ver_test: g3 + 6,
    reads_prio_q: g4,
    writes_policy: g4 + 3,
    writes_gc: g4 + 6,
    reads_stats: g4 + 9,
    gen_shb: g4 + 12,
    trk_req: g5,
    trk_feat: g5 + 2,
    trk_541: g5 + 4,
    trk_542: g5 + 6,
    trk_543: g5 + 8,
    jira_impl: g5 + 10,
    tests_541: g5 + 12,
    tests_542: g5 + 14,
    tests_543: g5 + 16,
    res_541: c2 + 2,
    res_542: c2 + 6,
    observed: bugAt + 8,
    fw_role: c3 + 2,
    impl_policy: c3 + 10,
  };
  const kindAt: Record<string, number | undefined> = {
    derives_from: g1,
    implements: g2,
    verifies: g3,
    reads: g4,
    writes: g4 + 3,
    generated_from: g4 + 12,
    tracks: g5,
    result: c2 + 2,
    observed_at: bugAt + 8,
  };

  const [ex, ey] = place(view, ...edgeLabelAt("impl_policy"));
  const cardAt = c3 + 14;
  const rowY = (i: number): number => CARD.y + 64 + i * 39;
  const sign = progress(frame, c5 + 6, DUR.enter);
  const extractAt = c4 + 8;
  const tagAt = within("s5.4", 0.5);

  return (
    <ShiftSheet>
      <TraceGraph
        {...view}
        add={["observed", "fw_role", "impl_policy"]}
        appear={appear}
        vanish={{ observed: bugOut }}
        looks={[
          { look: "plain", until: c4 },
          { ids: ["observed"], look: "problem" },
        ]}
        hi={[
          { ids: ["BUG-2317", "fail"], color: color.problem, at: bugAt, out: bugOut },
          { ids: ["policy_init", "fw_role", "impl_policy"], at: c3 + 4, out: c4 },
        ]}
        dim={[{ at: c3 + 4, out: c4 - 6, to: 0.25 }]}
      />

      {/* 엣지 종류 범례 */}
      <At x={1424} y={80} p={progress(frame, cue("s5.1"), DUR.enter)} style={mx(22, 700, color.inkDim)}>
        EDGE
      </At>
      {KINDS.map((k, i) => {
        const at = kindAt[k];
        const lit = at === undefined ? 0 : progress(frame, at, 12);
        return (
          <At key={k} x={1424 + (i % 2) * 206} y={114 + Math.floor(i / 2) * 34} p={progress(frame, cue("s5.1") + 4 + i * 2, DUR.enter)} style={mx(22, 500, blend(color.lineStrong, k === "observed_at" ? color.problem : color.ink, lit))}>
            {k}
          </At>
        );
      })}

      {/* 엣지의 속성 카드 */}
      <svg {...fullSvg}>
        <g opacity={1 - progress(frame, c4 - 6, 12)}>
          <Trace pts={[[ex + 12, ey], [CARD.x, ey]]} stroke={color.ink} at={c3 + 16} duration={10} />
          <circle cx={ex} cy={ey} r={11} fill="none" stroke={color.ink} strokeWidth={stroke.thin} opacity={progress(frame, c3 + 12, 10)} />
        </g>
      </svg>
      <CodePanel
        x={CARD.x}
        y={CARD.y}
        w={CARD.w}
        px={CARD.px}
        title="EDGE"
        at={cardAt}
        lines={[
          "-[:IMPLEMENTS {",
          { text: "  method:      'tag', // extract | tag", mark: within("s5.3", 0.5), unmark: c4 - 4 },
          { text: "  commit:      '9f3c2e1',", mark: within("s5.3", 0.72), unmark: c4 - 4 },
          { text: "  approved_by: 'FW 복구 담당',", mark: c5, markTone: "human" },
          "  mr:          '!2334' }]->",
          "(:Clause {id:'HSI-RCV-010#fw_role'})",
        ]}
      />
      <div style={{ position: "absolute", left: CARD.x + CARD.w - 92, top: rowY(3) + 4, display: "flex", gap: 8, opacity: sign, translate: `${(1 - sign) * 10}px 0px` }}>
        <HumanIcon size={30} color={color.human} />
        <CheckIcon size={30} color={color.human} />
      </div>

      {/* 출처 범례 두 줄 */}
      <svg {...fullSvg}>
        <line x1={96} x2={96 + 110 * progress(frame, extractAt, DUR.draw)} y1={792} y2={792} stroke={color.agent} strokeWidth={stroke.thin} />
        <line x1={96} x2={96 + 110 * progress(frame, tagAt, DUR.draw)} y1={848} y2={848} stroke={color.human} strokeWidth={4} />
      </svg>
      <At x={230} y={770} p={progress(frame, extractAt + 4, DUR.enter)} style={tx(34, 700, color.agent)}>
        extract · 도구가 읽음
      </At>
      <At x={230} y={826} p={progress(frame, tagAt + 4, DUR.enter)} style={tx(34, 700, color.human)}>
        tag · 사람이 적고 승인
      </At>
    </ShiftSheet>
  );
};
