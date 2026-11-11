import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress, sub } from "../../anim";
import { CARD_HEIGHT, CARD_WIDTH, RequirementCard } from "../../components/RequirementCard";
import { Trace } from "../../components/Trace";
import { CARD, S4J as content, S5 } from "../../content";
import { color, fullSvg, mono, size, stroke } from "../../theme";
import { CARD_BOX, CARD_SCALE } from "../s4/layout";
import { IssueNode } from "./IssueNode";
import { LINK_Y, NODE, T, nodeX } from "./layout";

// 추적 사슬.
//   1. S4 에서 만든 요구사항 카드가 같은 자리에 있고, 카드의 Jira 키 칸이 켜진다.
//   2. 카드가 사슬의 첫 마디(요구사항 이슈)로 줄어들고, 거기서 링크가 뻗어 설계 기능 · 검증 항목 · 버그가 차례로 놓인다.
//      링크 위에는 링크 이름이 붙는다.

const RECORDS = S5.map((s) => s.record);
const NODES = content.chain.nodes;
const GAP = 8; // 마디와 링크 사이

export const Chain: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = progress(frame, T.jira, 16);
  const morph = progress(frame, T.morph, T.morphDur, ease.inOut);
  const linked = progress(frame, T.linked, 16);

  return (
    <>
      {/* 요구사항 카드 → 첫 마디 */}
      {morph < 1 ? (
        <div
          style={{
            position: "absolute",
            left: lerp(CARD_BOX.x, nodeX(0), morph),
            top: lerp(CARD_BOX.y, NODE.y, morph),
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            transform: `scale(${lerp(CARD_SCALE, NODE.w / CARD_WIDTH, morph)}, ${lerp(CARD_SCALE, NODE.h / CARD_HEIGHT, morph)})`,
            transformOrigin: "0 0",
            opacity: 1 - sub(morph, 0.3, 0.8),
          }}
        >
          <RequirementCard card={CARD} left={0} top={0} records={RECORDS} attached={0} jiraGlow={glow} />
        </div>
      ) : null}

      <svg {...fullSvg}>
        {NODES.map((_, k) =>
          k === 0 ? null : (
            <Trace
              key={k}
              pts={[
                [nodeX(k - 1) + NODE.w + GAP, LINK_Y],
                [nodeX(k) - GAP, LINK_Y],
              ]}
              stroke={color.inkSoft}
              width={stroke.trace}
              arrow
              at={T.link(k)}
              duration={16}
              easing={ease.inOut}
            />
          ),
        )}
      </svg>

      {/* 링크 이름 */}
      {content.chain.links.map((name, i) => {
        const p = progress(frame, T.link(i + 1) + 4, 14);
        const x0 = nodeX(i) + NODE.w;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: x0,
              width: nodeX(i + 1) - x0,
              top: LINK_Y - 46,
              textAlign: "center",
              ...mono(size.label, 500),
              letterSpacing: "0.04em",
              color: linked > 0 ? color.ink : color.inkSoft,
              opacity: p * lerp(0.85, 1, linked),
            }}
          >
            {name}
          </div>
        );
      })}

      {NODES.map((n, k) => (
        <IssueNode
          key={n.key}
          x={nodeX(k)}
          y={NODE.y}
          issueKey={n.key}
          type={n.type}
          app={n.app}
          p={k === 0 ? sub(morph, 0.5, 1) : progress(frame, T.node(k), 16)}
          tint={k === NODES.length - 1 ? color.problem : color.inkSoft}
        />
      ))}
    </>
  );
};
