import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, progress, sub } from "../../anim";
import { AgentIcon, HumanIcon } from "../../components/Icons";
import { Pad, Trace } from "../../components/Trace";
import type { Pt } from "../../components/Trace";
import { LANES, S4J as content } from "../../content";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../theme";
import { ACTOR_X, AGENT_ZONE, HUMAN_ZONE, JQL_H, NODE, RAIL, READ, T, nodeCx } from "./layout";

// 사람과 에이전트가 같은 사슬을 읽는다.
//   사람(위, 호박색)      보드: 사슬의 이슈들이 칸마다 놓여 있다
//   에이전트(아래, 청록)  JQL: 같은 이슈들을 질의로 읽는다
// 두 쪽에서 나온 선이 사슬 위아래를 따라가며 마디마다 닿는다.

const NODES = content.chain.nodes;
const STEM_X = READ.x + READ.w / 2;
const JQL = `issue in linkedIssues("${NODES[0].key}")`;

// 보드: 세 칸. 이슈가 진행 정도에 따라 놓인다(왼쪽이 새 것).
const BOARD_COLS: readonly (readonly number[])[] = [[3], [1, 2], [0]];
const BOARD = { pad: 16, gap: 16, top: 24, cardH: 44, rowGap: 10 } as const;
const COL_W = (READ.w - BOARD.pad * 2 - BOARD.gap * 2) / 3;

const frameBox = (tint: string) =>
  ({
    position: "absolute",
    boxSizing: "border-box",
    border: `${stroke.thin}px solid ${withAlpha(tint, 0.75)}`,
    backgroundColor: withAlpha(tint, 0.05),
  }) as const;

const Tab: React.FC<{ text: string; tint: string }> = ({ text, tint }) => (
  <div
    style={{
      position: "absolute",
      left: 14,
      top: -15,
      height: 28,
      padding: "0 8px",
      display: "flex",
      alignItems: "center",
      backgroundColor: color.bg,
      ...mono(size.label, 700),
      color: tint,
    }}
  >
    {text}
  </div>
);

const Actor: React.FC<{ kind: "human" | "agent"; cy: number; at: number }> = ({ kind, cy, at }) => {
  const frame = useCurrentFrame();
  const tint = kind === "human" ? color.human : color.agent;
  const Icon = kind === "human" ? HumanIcon : AgentIcon;
  return (
    <div
      style={{
        position: "absolute",
        left: ACTOR_X,
        top: cy - 44,
        height: 88,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
        ...enter(frame, at, { from: "left" }),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Icon size={38} color={tint} />
        <div style={{ ...sans(size.body, 700), color: tint, whiteSpace: "nowrap" }}>{LANES[kind]}</div>
      </div>
      <div style={{ ...mono(size.label, 500), color: color.inkDim }}>{kind === "human" ? "HUMAN" : "AGENT"}</div>
    </div>
  );
};

/** 읽는 선: 줄기에서 나와 사슬을 따라가고, 마디마다 가지가 닿는다. */
const Rail: React.FC<{ tint: string; from: number; railY: number; nodeY: number; at: number }> = ({
  tint,
  from,
  railY,
  nodeY,
  at,
}) => {
  const frame = useCurrentFrame();
  const first = nodeCx(0);
  const last = nodeCx(NODES.length - 1);
  const span = Math.max(STEM_X - first, last - STEM_X);
  const run = progress(frame, at + 8, 26, ease.inOut);
  const sides: Pt[][] = [
    [
      [STEM_X, railY],
      [first, railY],
    ],
    [
      [STEM_X, railY],
      [last, railY],
    ],
  ];
  return (
    <>
      <Trace
        pts={[
          [STEM_X, from],
          [STEM_X, railY],
        ]}
        stroke={tint}
        width={stroke.thin}
        at={at}
        duration={10}
      />
      {sides.map((pts, i) => (
        <Trace
          key={i}
          pts={pts}
          stroke={tint}
          width={stroke.thin}
          progress={Math.min(1, (run * span) / Math.abs(pts[1][0] - STEM_X))}
        />
      ))}
      {NODES.map((n, k) => {
        // 선의 머리가 그 마디 위를 지날 때 가지가 내려간다.
        const reach = Math.abs(nodeCx(k) - STEM_X) / span;
        const p = sub(run, reach, Math.min(1, reach + 0.25)) * (run > 0 ? 1 : 0);
        const done = run >= 1 ? progress(frame, at + 34 + k * 3, 10) : 0;
        return (
          <React.Fragment key={n.key}>
            <Trace
              pts={[
                [nodeCx(k), railY],
                [nodeCx(k), nodeY],
              ]}
              stroke={tint}
              width={stroke.thin}
              progress={reach >= 1 ? progress(frame, at + 34, 8) : p}
            />
            <Pad x={nodeCx(k)} y={nodeY} fill={tint} s={11} p={reach >= 1 ? done : Math.max(done, p >= 1 ? 1 : 0)} />
          </React.Fragment>
        );
      })}
    </>
  );
};

export const Readers: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.human) return null;
  const board = progress(frame, T.human + 4, 16);
  const jql = progress(frame, T.agent + 4, 16);
  const typed = Math.round(JQL.length * progress(frame, T.agent + 10, 26, ease.linear));
  const jqlY = AGENT_ZONE.y;

  return (
    <>
      <svg {...fullSvg}>
        <Rail
          tint={color.human}
          from={HUMAN_ZONE.y + HUMAN_ZONE.h}
          railY={RAIL.human}
          nodeY={NODE.y}
          at={T.rails}
        />
        <Rail tint={color.agent} from={jqlY} railY={RAIL.agent} nodeY={NODE.y + NODE.h} at={T.rails + 4} />
      </svg>

      {/* 사람: 보드 */}
      <Actor kind="human" cy={HUMAN_ZONE.y + HUMAN_ZONE.h / 2} at={T.human} />
      <div
        style={{
          ...frameBox(color.human),
          left: READ.x,
          top: HUMAN_ZONE.y,
          width: READ.w,
          height: HUMAN_ZONE.h,
          opacity: board,
          translate: `0px ${(1 - board) * 10}px`,
        }}
      >
        <Tab text="BOARD" tint={color.human} />
        {BOARD_COLS.map((col, c) => (
          <React.Fragment key={c}>
            {c > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: BOARD.pad + c * (COL_W + BOARD.gap) - BOARD.gap / 2,
                  top: BOARD.top - 6,
                  bottom: 14,
                  borderLeft: `${stroke.hair}px dashed ${color.line}`,
                }}
              />
            ) : null}
            {col.map((k, r) => {
              const p = progress(frame, T.human + 10 + (c * 2 + r) * 4, 14);
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: BOARD.pad + c * (COL_W + BOARD.gap),
                    top: BOARD.top + r * (BOARD.cardH + BOARD.rowGap),
                    width: COL_W,
                    height: BOARD.cardH,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `${stroke.hair}px solid ${color.lineStrong}`,
                    backgroundColor: color.panel,
                    ...mono(size.small, 500),
                    color: color.ink,
                    opacity: p,
                  }}
                >
                  {NODES[k].key}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* 에이전트: JQL */}
      <Actor kind="agent" cy={jqlY + JQL_H / 2} at={T.agent} />
      <div
        style={{
          ...frameBox(color.agent),
          left: READ.x,
          top: jqlY,
          width: READ.w,
          height: JQL_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: jql,
          translate: `0px ${(1 - jql) * -10}px`,
        }}
      >
        <Tab text="JQL" tint={color.agent} />
        <div style={{ ...mono(size.small, 500), color: color.ink, width: JQL.length * size.small * 0.6 }}>
          {JQL.slice(0, typed)}
        </div>
      </div>
    </>
  );
};
