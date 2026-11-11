import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, progress, sub } from "../../anim";
import { AgentIcon, HumanIcon } from "../../components/Icons";
import { Trace } from "../../components/Trace";
import { S4J as content } from "../../content";
import { color, fullSvg, mono, size, stroke, withAlpha } from "../../theme";
import { IssueNode } from "./IssueNode";
import { AGENT_ZONE, COMMENT_H, COMMENT_X, HUMAN_ZONE, NEW_ISSUE, NODE, T, WRITE } from "./layout";

// Jira 에 남기는 것.
//   사람      이슈에 지시 댓글을 단다 (에이전트 계정을 언급한다)
//   에이전트  ai-authored 표시가 붙은 댓글로 답한다
//   새 이슈   새 요구사항 하나가 사슬 옆(요구사항 아래)에 제안으로 들어온다
// 댓글의 내용은 글자가 아니라 줄로만 그린다.

const BARS = [0.78, 0.5] as const;

const Comment: React.FC<{
  kind: "human" | "agent";
  y: number;
  at: number;
  children: React.ReactNode;
}> = ({ kind, y, at, children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, 16);
  if (p <= 0) return null;
  const tint = kind === "human" ? color.human : color.agent;
  const Icon = kind === "human" ? HumanIcon : AgentIcon;
  const barW = WRITE.w - 23 - 24;
  return (
    <div
      style={{
        position: "absolute",
        left: WRITE.x,
        top: y,
        width: WRITE.w,
        height: COMMENT_H,
        boxSizing: "border-box",
        border: `${stroke.thin}px solid ${withAlpha(tint, 0.75)}`,
        backgroundColor: withAlpha(tint, 0.06),
        opacity: p,
        translate: `0px ${(1 - p) * (kind === "human" ? -12 : 12)}px`,
      }}
    >
      <div style={{ position: "absolute", left: -2, top: -2, bottom: -2, width: 5, backgroundColor: tint }} />
      <div
        style={{
          position: "absolute",
          left: 23,
          top: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Icon size={32} color={tint} />
        {children}
      </div>
      {BARS.map((w, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 23,
            top: 84 + i * 22,
            width: barW * w * progress(frame, at + 8 + i * 5, 16, ease.inOut),
            height: 8,
            backgroundColor: color.lineStrong,
          }}
        />
      ))}
    </div>
  );
};

export const Comments: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.write) return null;
  const fresh = progress(frame, T.newIssue, 18);
  const settle = 1 - progress(frame, T.newIssue + 24, 30, ease.linear);
  const humanBottom = HUMAN_ZONE.y + HUMAN_ZONE.h;

  return (
    <>
      <svg {...fullSvg}>
        <Trace
          pts={[
            [COMMENT_X, humanBottom + 2],
            [COMMENT_X, NODE.y - 4],
          ]}
          stroke={color.human}
          width={stroke.bold}
          arrow
          at={T.comment + 10}
          duration={12}
        />
        <Trace
          pts={[
            [COMMENT_X, AGENT_ZONE.y - 2],
            [COMMENT_X, NODE.y + NODE.h + 4],
          ]}
          stroke={color.agent}
          width={stroke.bold}
          arrow
          at={T.reply + 10}
          duration={12}
        />
      </svg>

      <Comment kind="human" y={humanBottom - COMMENT_H} at={T.comment}>
        <div style={{ ...mono(size.small, 700), color: color.agent }}>@{content.agentAccount}</div>
      </Comment>

      <Comment kind="agent" y={AGENT_ZONE.y} at={T.reply}>
        <div style={{ ...mono(size.small, 700), color: color.agent }}>{content.agentAccount}</div>
        <div
          style={{
            ...mono(size.label, 500),
            color: color.agent,
            padding: "2px 8px",
            marginLeft: 6,
            border: `${stroke.hair}px solid ${withAlpha(color.agent, 0.7)}`,
          }}
        >
          {content.agentLabel}
        </div>
      </Comment>

      {/* 새 요구사항 이슈 */}
      <div style={{ position: "absolute", inset: 0, translate: `${(1 - fresh) * -24}px 0px` }}>
        <IssueNode
          x={NEW_ISSUE.x}
          y={NEW_ISSUE.y}
          issueKey={content.newIssue.key}
          type={content.chain.nodes[0].type}
          app={content.newIssue.app}
          p={fresh}
          tint={color.ink}
          dashed
          glow={sub(fresh, 0.2, 0.8) * settle}
          glowTint={color.ink}
        />
      </div>
    </>
  );
};
