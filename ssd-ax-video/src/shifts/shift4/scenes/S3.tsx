import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, draw, ease, enter, lerp, progress, sub } from "../../../video/anim";
import { AgentIcon } from "../../../video/components/Icons";
import { Trace, Via, pointOnTrace, traceLength } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { AgentNode, Badge, BugIcon, CodeIcon, DbIcon, EdgeTag, LockIcon, QuestionCard, SimIcon, TOOL, TicketIcon, ToolNode, WaveIcon, toolCy, toolY, useCues } from "./kit";
import type { IconType } from "./kit";
import { ChatFrame } from "./S2";
import { MCP_CONFIG, TX } from "./text";

// S3 전환 후: 사내망 안에서 에이전트가 도구에 닿는다.

const BOUND = { x: 200, y: 100, w: 1616, h: 776 } as const;
const AGENT = { x: 490, y: 185, w: 220, h: 130 } as const;
const AY = AGENT.y + AGENT.h / 2;
const MODEL = { x: 480, y: 372, w: 240, h: 80 } as const;
const MCP = { x: 1110, y: AY - 30, w: 120, h: 60 } as const;
const BUS = 1280;
const CFG = { x: 230, y: 500, w: 860 } as const;
const ASK: Pt[] = [[330, 596], [330, AY], [AGENT.x - 6, AY]];

const TOOLS: { label: string; Icon: IconType; code?: boolean }[] = [
  { label: TX.tool.rtl, Icon: CodeIcon, code: true },
  { label: TX.tool.wave, Icon: WaveIcon },
  { label: TX.tool.sim, Icon: SimIcon },
  { label: TX.tool.regress, Icon: DbIcon },
  { label: TX.tool.bug, Icon: BugIcon },
  { label: TX.tool.tracker, Icon: TicketIcon },
];

export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c1 = cue("s3.1");
  const c2 = cue("s3.2");
  const c3 = cue("s3.3");
  const c4 = cue("s3.4");

  const chatOut = progress(frame, 2, 16, ease.in);
  const bound = progress(frame, 6, 30, ease.inOut);
  const agentP = progress(frame, 10, DUR.enter);

  // 도구가 연결되는 시점
  const unlock = within("s3.2", 0.5);
  const linkAt: number[] = [unlock + 6, unlock, c1 + 22, c1 + 10, c1 + 34, c1 + 46];
  // 설정의 줄과 도구가 짝지어 켜진다 (regress, sim, wave, kb)
  const pair: { line: number; tool: number; at: number }[] = [
    { line: 1, tool: 3, at: within("s3.3", 0.2) },
    { line: 3, tool: 2, at: within("s3.3", 0.42) },
    { line: 4, tool: 1, at: within("s3.3", 0.64) },
    { line: 5, tool: 4, at: within("s3.3", 0.86) },
  ];
  const mcpP = progress(frame, c3, DUR.enter);
  const modelP = progress(frame, c2, DUR.enter);
  const egress = progress(frame, c2 + 12, DUR.draw + 6, ease.inOut);

  // 질문 카드가 에이전트로 들어간다
  const goAt = within("s3.4", 0.42);
  const go = progress(frame, goAt, DUR.move, ease.inOut);
  const glow = progress(frame, goAt + DUR.move - 4, 10) * (1 - 0.5 * progress(frame, goAt + DUR.move + 14, 20));

  return (
    <ShiftSheet>
      {chatOut < 1 ? (
        <div style={{ opacity: 0.5 * (1 - chatOut), translate: `${-40 * chatOut}px 0px` }}>
          <ChatFrame />
        </div>
      ) : null}

      <svg {...fullSvg}>
        {/* 사내망 경계: 가는 이중선 */}
        <rect x={BOUND.x} y={BOUND.y} width={BOUND.w} height={BOUND.h} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} pathLength={1} {...draw(bound)} />
        <rect x={BOUND.x + 8} y={BOUND.y + 8} width={BOUND.w - 16} height={BOUND.h - 16} fill="none" stroke={color.lineStrong} strokeWidth={stroke.hair} pathLength={1} {...draw(sub(bound, 0.1, 1))} />

        {/* 에이전트 → (MCP) → 도구 */}
        <Trace pts={[[AGENT.x + AGENT.w, AY], [BUS, AY]]} stroke={color.agent} width={lerp(stroke.trace, stroke.bold, mcpP)} at={c1} />
        {TOOLS.map((t, i) => (
          <g key={t.label}>
            <Trace pts={[[BUS, AY], [BUS, toolCy(i)], [TOOL.x - 4, toolCy(i)]]} stroke={color.agent} width={lerp(stroke.trace, stroke.bold, mcpP * 0.6)} at={linkAt[i]} arrow />
          </g>
        ))}
        <Via x={BUS} y={AY} stroke={color.agent} p={progress(frame, c1 + 10, 8)} />

        {/* 사내 모델과 밖으로 나가는 길 */}
        <Trace pts={[[AGENT.x + AGENT.w / 2, AGENT.y + AGENT.h], [MODEL.x + MODEL.w / 2, MODEL.y]]} stroke={color.agent} at={c2} />
        <Trace pts={[[MODEL.x, MODEL.y + 40], [BOUND.x + 26, MODEL.y + 40]]} stroke={color.lineStrong} dash="4 8" width={stroke.thin} progress={egress} />
        <Trace pts={[[BOUND.x - 14, MODEL.y + 40], [112, MODEL.y + 40]]} stroke={color.line} dash="4 8" width={stroke.thin} arrow progress={sub(egress, 0.8, 1)} />
        <g opacity={sub(egress, 0.6, 1)}>
          <line x1={BOUND.x + 4} x2={BOUND.x + 4} y1={MODEL.y + 6} y2={MODEL.y + 74} stroke={color.problem} strokeWidth={6} />
          <path d={`M ${BOUND.x - 12} ${MODEL.y + 24} l 32 32 M ${BOUND.x + 20} ${MODEL.y + 24} l -32 32`} stroke={color.problem} strokeWidth={stroke.bold} />
        </g>

        {/* MCP 에서 설정 조각으로 */}
        <Trace pts={[[MCP.x + MCP.w / 2, MCP.y + MCP.h], [MCP.x + MCP.w / 2, CFG.y + 40], [CFG.x + CFG.w, CFG.y + 40]]} stroke={color.lineStrong} width={stroke.thin} dash="3 6" at={c3 + 8} opacity={1 - progress(frame, c4, 8)} />
      </svg>

      <EdgeTag x={BOUND.x + 40} y={BOUND.y} text={TX.intranet} px={30} c={color.inkSoft} p={progress(frame, 26, DUR.enter)} />

      {TOOLS.map((t, i) => {
        const locked = i < 2;
        const lit = progress(frame, linkAt[i] + 10, DUR.enter);
        const open = progress(frame, unlock + i * 6, 10);
        const ping = pair.find((p) => p.tool === i);
        const pingP = ping ? progress(frame, ping.at, 8) * (1 - progress(frame, ping.at + 22, 12)) : 0;
        return (
          <React.Fragment key={t.label}>
            <ToolNode x={TOOL.x} y={toolY(i)} w={TOOL.w} h={TOOL.h} Icon={t.Icon} label={t.label} code={t.code} lit={lit} hot={locked ? 1 - open : 0}>
              {locked ? (
                <Badge p={1 - progress(frame, unlock + i * 6 + 36, 12)}>
                  <LockIcon size={40} color={open > 0.5 ? color.agent : color.problem} open={open > 0.5} />
                </Badge>
              ) : null}
            </ToolNode>
            {pingP > 0 ? <div style={{ position: "absolute", left: TOOL.x - 6, top: toolY(i) - 6, width: TOOL.w + 12, height: TOOL.h + 12, boxSizing: "border-box", border: `${stroke.bold}px solid ${color.agent}`, backgroundColor: withAlpha(color.agent, 0.12), opacity: pingP }} /> : null}
          </React.Fragment>
        );
      })}

      <AgentNode x={AGENT.x} y={AGENT.y} w={AGENT.w} h={AGENT.h} p={agentP} glow={glow} />

      {/* 사내 모델 */}
      <div style={{ position: "absolute", left: MODEL.x, top: MODEL.y, width: MODEL.w, height: MODEL.h, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.agent}`, backgroundColor: color.panel, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, opacity: modelP, translate: `0px ${(1 - modelP) * -10}px` }}>
        <AgentIcon size={36} color={color.inkSoft} />
        <div style={{ ...sans(32, 700), whiteSpace: "nowrap" }}>{TX.model}</div>
      </div>
      <div style={{ position: "absolute", left: BOUND.x + 44, top: MODEL.y - 4, ...mono(26, 700), color: color.problem, ...enter(frame, c2 + 24, { distance: 8 }) }}>egress: none</div>

      {/* MCP 커넥터 */}
      {mcpP > 0 ? (
        <div style={{ position: "absolute", left: MCP.x, top: MCP.y, width: MCP.w, height: MCP.h, boxSizing: "border-box", border: `${stroke.trace}px solid ${color.agent}`, backgroundColor: color.bg, display: "flex", alignItems: "center", justifyContent: "center", ...mono(32, 700), color: color.agent, opacity: mcpP, scale: `${0.8 + 0.2 * mcpP}` }}>
          MCP
          <div style={{ position: "absolute", left: -12, top: 12, width: 10, height: 10, backgroundColor: color.agent }} />
          <div style={{ position: "absolute", left: -12, bottom: 12, width: 10, height: 10, backgroundColor: color.agent }} />
          <div style={{ position: "absolute", right: -12, top: 12, width: 10, height: 10, backgroundColor: color.agent }} />
          <div style={{ position: "absolute", right: -12, bottom: 12, width: 10, height: 10, backgroundColor: color.agent }} />
        </div>
      ) : null}

      <CodePanel
        x={CFG.x}
        y={CFG.y}
        w={CFG.w}
        title=".mcp.json"
        px={26}
        at={c3 + 6}
        out={c4 - 4}
        lines={MCP_CONFIG.map((text, i) => {
          const p = pair.find((q) => q.line === i);
          return p ? { text, mark: p.at, unmark: p.line === 5 ? undefined : p.at + 20 } : { text, tone: i === 2 ? ("plain" as const) : ("dim" as const) };
        })}
      />

      {/* 같은 질문이 이번에는 에이전트로 */}
      <div style={{ position: "absolute", left: CFG.x + 10, top: 600, ...enter(frame, c4, { distance: 16 }) }}>
        <QuestionCard text={TX.question} px={32} h={86} />
      </div>
      <svg {...fullSvg}>
        <Trace pts={ASK} stroke={color.human} width={stroke.bold} arrow at={goAt} duration={DUR.move} easing={ease.inOut} />
        {go > 0 && go < 1
          ? (() => {
              const at = pointOnTrace(ASK, traceLength(ASK) * go);
              return <circle cx={at.x} cy={at.y} r={9} fill={color.human} />;
            })()
          : null}
      </svg>
    </ShiftSheet>
  );
};
