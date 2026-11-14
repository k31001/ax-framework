import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { BASE_NODE_IDS, TraceGraph, nodeRect, place } from "./graph";
import { At, Box, mx, tx, useCues } from "./kitA";

// S4 그래프란: 노드. 그래프의 자리가 여기서 정해진다. 엣지는 그리지 않고 노드만 놓는다.

export const VIEW4 = { x: 96, y: 80, scale: 1 } as const;
const LEGEND = { from: [642, 330], to: [1424, 92] } as const;
const CARD = { x: 1040, y: 250, w: 764, px: 28 } as const;
const COL = 28 * 0.6;
const TICKS = [
  { x: 1150, name: "파일", note: "굵다" },
  { x: 1420, name: "심볼", note: "단위" },
  { x: 1690, name: "줄", note: "움직인다" },
] as const;

export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c2 = cue("s4.2");
  const c3 = cue("s4.3");
  const c4 = cue("s4.4");
  const c5 = cue("s4.5");
  const c6 = cue("s4.6");

  const orderAt = within("s4.2", 0.5);
  const fwAt = within("s4.5", 0.38);
  const testAt = within("s4.5", 0.78);
  const appear = {
    ac1: c2 + 2,
    order: orderAt,
    "REQ-207": c3,
    "FEAT-338": c3 + 8,
    "VER-541": c3 + 18,
    "VER-542": c3 + 22,
    "VER-543": c3 + 26,
    "BUG-2317": c3 + 40,
    field: c4 + 4,
    prio_q: within("s4.4", 0.5),
    a_host_first: within("s4.4", 0.74),
    a_gc_no_starve: within("s4.4", 0.74) + 6,
    set_host_burst: c5 + 2,
    policy_init: fwAt,
    throttle_update: fwAt + 5,
    stats_dump: fwAt + 10,
    ratio_test: testAt,
    pass: testAt + 6,
    fail: testAt + 12,
  };

  // 범례: 가운데에서 보이고, 노드가 놓이기 전에 오른쪽 위로 물러난다
  const move = progress(frame, c2 - 16, 22, ease.inOut);
  const lx = lerp(LEGEND.from[0], LEGEND.to[0], move);
  const ly = lerp(LEGEND.from[1], LEGEND.to[1], move);
  const nodeP = progress(frame, within("s4.1", 0.5), DUR.enter);
  const edgeP = progress(frame, within("s4.1", 0.72), DUR.draw, ease.inOut);

  const order = nodeRect("order");
  const [tagX, tagY] = place(VIEW4, order.x + order.w, order.cy);
  const tagAt = within("s4.2", 0.66);
  const tagP = progress(frame, tagAt, DUR.enter) * (1 - progress(frame, c6 - 4, 10));

  const host = nodeRect("a_host_first");
  const [hx, hy] = place(VIEW4, host.x + host.w + 12, host.cy);
  const cardAt = c6 + 8;
  const strikeAt = within("s4.6", 0.16);
  const symAt = within("s4.6", 0.3);
  const lineAt = within("s4.6", 0.62);
  const rowY = (i: number): number => CARD.y + 64 + i * 42;
  const strike = progress(frame, strikeAt, 12, ease.inOut);

  return (
    <ShiftSheet>
      <TraceGraph
        {...VIEW4}
        show={BASE_NODE_IDS}
        appear={appear}
        bands={4}
        dim={[{ at: c6, to: 0.16 }]}
        hi={[{ ids: ["a_host_first"], at: c6, ring: true }]}
      />

      {/* 범례: 노드 = 사물 · 엣지 = 관계 */}
      <div style={{ position: "absolute", left: lx, top: ly, width: 400, opacity: (1 - 0.25 * move) * (1 - progress(frame, c6 - 2, 10)) }}>
        <svg width={400} height={60} style={{ overflow: "visible" }}>
          <Trace pts={[[104, 30], [296, 30]]} stroke={color.inkSoft} arrow progress={edgeP} />
          <rect x={1} y={6} width={100} height={48} fill={withAlpha(color.agent, 0.1)} stroke={color.agent} strokeWidth={stroke.thin} opacity={nodeP} />
          <rect x={299} y={6} width={100} height={48} fill={withAlpha(color.agent, 0.1)} stroke={color.agent} strokeWidth={stroke.thin} opacity={nodeP} />
        </svg>
        <div style={{ ...tx(34, 700), marginTop: 14, opacity: nodeP }}>노드 = 사물</div>
        <div style={{ ...tx(34, 700), marginTop: 6, opacity: progress(frame, within("s4.1", 0.72) + 6, DUR.enter) }}>엣지 = 관계</div>
      </div>

      {/* 조항 노드의 꼬리표: 계약 파일의 한 줄 */}
      <svg {...fullSvg}>
        <line x1={tagX} x2={tagX + 26 * tagP} y1={tagY} y2={tagY} stroke={color.human} strokeWidth={stroke.thin} opacity={tagP} />
        <Trace pts={[[hx, hy], [1000, hy], [1000, 420], [CARD.x, 420]]} stroke={color.inkSoft} at={c6 + 4} />
      </svg>
      <At x={tagX + 26} y={tagY - 27} p={tagP} style={{ ...mx(26, 500, color.ink), height: 54, padding: "0 16px", display: "flex", alignItems: "center", border: `${stroke.thin}px solid ${color.human}`, backgroundColor: withAlpha(color.panel, 0.92) }}>
        order: host 먼저. gc는 host 4건당 1건 이상
      </At>

      <At x={182} y={76} p={progress(frame, c3 + 6, DUR.enter)} o={1 - progress(frame, c4 - 8, 10)} style={tx(30, 700)}>
        Jira 이슈도 노드
      </At>

      <Box x={CARD.x} y={556} w={CARD.w} h={170} c={color.line} bg={withAlpha(color.bg, 0.94)} p={progress(frame, symAt, DUR.enter)} />
      <svg {...fullSvg}>
        <g opacity={progress(frame, symAt + 2, DUR.enter)}>
          <line x1={CARD.x + 30} x2={CARD.x + CARD.w - 30} y1={590} y2={590} stroke={color.lineStrong} strokeWidth={stroke.thin} />
          {TICKS.map((t, i) => (
            <line key={i} x1={t.x} x2={t.x} y1={578} y2={602} stroke={i === 1 ? color.human : color.lineStrong} strokeWidth={i === 1 ? stroke.bold : stroke.thin} />
          ))}
        </g>
      </svg>
      {/* 속성 카드 */}
      <CodePanel
        x={CARD.x}
        y={CARD.y}
        w={CARD.w}
        px={CARD.px}
        title="NODE"
        at={cardAt}
        owner="agent"
        lines={[
          "(:Assertion)",
          { text: "  name  prio_q.a_host_first   ← 식별자", mark: symAt, markTone: "human" },
          "  path  rtl/rcv/prio_q_sva.sv",
          { text: "  line  12-14", tone: "dim" },
          "  kind  assert",
        ]}
      />
      <At x={CARD.x + 24 + 30 * COL} y={rowY(3)} p={progress(frame, lineAt, DUR.enter)} style={{ ...mx(28, 500, color.problem), lineHeight: "42px" }}>
        ← 속성일 뿐
      </At>
      <svg {...fullSvg}>
        {/* line 줄의 취소선 */}
        {strike > 0 ? <line x1={CARD.x + 24 + 2 * COL - 4} x2={CARD.x + 24 + 2 * COL - 4 + (11 * COL + 8) * strike} y1={rowY(3) + 21} y2={rowY(3) + 21} stroke={color.problem} strokeWidth={stroke.bold} /> : null}
      </svg>
      {TICKS.map((t, i) => {
        const p = progress(frame, symAt + i * 4, DUR.enter);
        const c = i === 1 ? color.human : color.inkDim;
        return (
          <React.Fragment key={i}>
            <At x={t.x} y={614} center p={p} style={tx(40, 800, i === 1 ? color.human : color.inkSoft)}>
              {t.name}
            </At>
            <At x={t.x} y={668} center p={p} style={tx(30, 500, c)}>
              {t.note}
            </At>
          </React.Fragment>
        );
      })}
    </ShiftSheet>
  );
};
