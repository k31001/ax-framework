import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enter, lerp, progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { Trace, pointOnTrace, traceLength } from "../../../video/components/Trace";
import type { Pt } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { Badge, BugIcon, CodeIcon, DbIcon, LockIcon, QuestionCard, SimIcon, SpecIcon, TOOL, ToolNode, WaveIcon, toolCy, toolY, useCues } from "./kit";
import type { IconType } from "./kit";
import { CHAT_ANSWER, LOG_PASTE, TX } from "./text";

// S2 지금: 챗봇 창에 붙여 넣기. 왼쪽은 챗봇 창, 오른쪽은 이어지지 않은 도구들.

export const CHAT = { x: 96, y: 140, w: 764, h: 740 } as const;
const IN = { y: 784, h: 80 } as const; // 입력란
const Q_Y = 204;
const LOG_Y = 288;
const LOG_H = 141;
const ANS_Y = 452;

export const S2_TOOLS: { label: string; Icon: IconType; code?: boolean }[] = [
  { label: TX.tool.rtl, Icon: CodeIcon, code: true },
  { label: TX.tool.wave, Icon: WaveIcon },
  { label: TX.tool.sim, Icon: SimIcon },
  { label: TX.tool.regress, Icon: DbIcon },
  { label: TX.tool.bug, Icon: BugIcon },
  { label: TX.tool.spec, Icon: SpecIcon },
];

export const ChatFrame: React.FC<{ inputTop?: number }> = ({ inputTop = IN.y }) => (
  <div style={{ position: "absolute", left: CHAT.x, top: CHAT.y, width: CHAT.w, height: CHAT.h, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.lineStrong}`, backgroundColor: withAlpha(color.panel, 0.6) }}>
    <div style={{ height: 44, borderBottom: `${stroke.hair}px solid ${color.line}`, display: "flex", alignItems: "center", gap: 10, padding: "0 20px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 10, height: 10, border: `${stroke.hair}px solid ${color.lineStrong}` }} />
      ))}
      <div style={{ ...mono(22, 700), color: color.inkDim, marginLeft: 10 }}>CHATBOT</div>
    </div>
    <div style={{ position: "absolute", left: 16, right: 16, top: inputTop - CHAT.y, bottom: CHAT.h - (IN.y + IN.h - CHAT.y) - 2, border: `${stroke.hair}px solid ${color.line}` }} />
  </div>
);

export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();

  // 질문: 입력란에 나타났다가 대화로 올라간다
  const qUp = progress(frame, within("s2.1", 0.62), DUR.move, ease.inOut);
  // 로그: 입력란에 붙여 넣고, 올라간다
  const logIn = cue("s2.2") + 6;
  const logUp = progress(frame, within("s2.2", 0.68), DUR.move, ease.inOut);
  const grow = progress(frame, logIn - 4, 10) * (1 - logUp);
  const inputTop = lerp(IN.y, IN.y + IN.h - 8 - LOG_H - 8, grow);
  const logTop = lerp(IN.y + IN.h - 8 - LOG_H, LOG_Y, logUp);

  // 막힌 길
  const lock = cue("s2.3");
  const lockP = progress(frame, lock, DUR.enter);
  // 물음표
  const asks: Record<number, number> = { 2: within("s2.5", 0.1), 3: within("s2.5", 0.32), 4: within("s2.5", 0.5) };
  // 사람이 잇는다
  const h0 = cue("s2.6");
  const HUB: Pt = [1090, 538];
  const legs: { i: number; y: number; verb: string }[] = [
    { i: 3, y: toolCy(3), verb: TX.verb.copy },
    { i: 2, y: toolCy(2), verb: TX.verb.rerun },
    { i: 1, y: toolCy(1) + 26, verb: TX.verb.wave },
    { i: 4, y: toolCy(4), verb: TX.verb.search },
  ];
  const LEG = 24;
  const legPts = (y: number): Pt[] => [[CHAT.x + CHAT.w, 538], HUB, [HUB[0], y], [TOOL.x, y]];
  const k = Math.floor((frame - h0 - 8) / LEG);
  const shuttle = frame >= h0 + 8 && k < legs.length ? legs[k] : null;

  return (
    <ShiftSheet>
      <ChatFrame inputTop={inputTop} />

      {/* 질문 */}
      <div style={{ position: "absolute", left: CHAT.x + 24, width: CHAT.w - 48, top: lerp(IN.y + 8, Q_Y, qUp), display: "flex", justifyContent: "flex-end", ...enter(frame, cue("s2.1"), { distance: 0 }) }}>
        <QuestionCard text={TX.question} px={30} />
      </div>

      {/* 붙여 넣은 로그 */}
      <div style={{ position: "absolute", left: CHAT.x + 24, width: CHAT.w - 48, top: logTop, height: LOG_H, boxSizing: "border-box", borderLeft: `5px solid ${color.human}`, backgroundColor: withAlpha(color.human, 0.08), padding: "12px 18px", ...enter(frame, logIn, { from: "left", distance: 24 }) }}>
        {LOG_PASTE.map((l, i) => (
          <div key={i} style={{ ...mono(26, 500), lineHeight: "39px", whiteSpace: "pre", color: color.ink, opacity: progress(frame, logIn + 4 + i * 3, 8) }}>
            {l}
          </div>
        ))}
        <div style={{ position: "absolute", right: 12, top: 8, ...mono(22, 700), color: color.human }}>PASTE</div>
      </div>

      {/* 챗봇의 답 */}
      <div style={{ position: "absolute", left: CHAT.x + 24, width: CHAT.w - 48, top: ANS_Y, boxSizing: "border-box", borderLeft: `5px solid ${color.lineStrong}`, padding: "12px 18px", ...enter(frame, cue("s2.4"), { distance: 0 }) }}>
        {CHAT_ANSWER.map((l, i) => (
          <div key={i} style={{ ...sans(30, 500), lineHeight: "44px", whiteSpace: "nowrap", color: color.inkSoft, ...enter(frame, cue("s2.4") + 4 + i * 7, { distance: 8 }) }}>
            {l}
          </div>
        ))}
      </div>

      {/* 도구들 */}
      {S2_TOOLS.map((t, i) => {
        const locked = i < 2;
        const ask = asks[i];
        return (
          <ToolNode key={t.label} x={TOOL.x} y={toolY(i)} w={TOOL.w} h={TOOL.h} Icon={t.Icon} label={t.label} code={t.code} p={progress(frame, 4 + i * 3, DUR.enter)} hot={locked ? lockP : 0}>
            {locked ? (
              <Badge p={progress(frame, lock + 4 + i * 5, DUR.enter)}>
                <LockIcon size={40} color={color.problem} />
              </Badge>
            ) : null}
            {ask !== undefined ? (
              <Badge p={progress(frame, ask, DUR.enter)}>
                <div style={{ ...mono(44, 700), color: color.inkSoft, width: 40, textAlign: "center" }}>?</div>
              </Badge>
            ) : null}
          </ToolNode>
        );
      })}

      <svg {...fullSvg}>
        {/* 챗봇으로 가려던 길: 붉은 X 에서 끊긴다 */}
        {[0, 1].map((i) => {
          const y = toolCy(i);
          const x = progress(frame, lock + 16 + i * 5, 10);
          return (
            <g key={i}>
              <Trace pts={[[TOOL.x - 6, y], [1010, y]]} stroke={color.problem} dash="4 8" width={stroke.thin} at={lock + 6 + i * 5} opacity={0.8} />
              <path d={`M ${986 - 13} ${y - 13} l 26 26 M ${986 + 13} ${y - 13} l -26 26`} stroke={color.problem} strokeWidth={stroke.bold} opacity={x} />
            </g>
          );
        })}
        {/* 사람이 손으로 잇는 길 */}
        <Trace pts={[[CHAT.x + CHAT.w, 538], [968, 538]]} stroke={color.human} dash="8 7" at={h0} />
        <Trace pts={[[1052, 538], HUB]} stroke={color.human} dash="8 7" at={h0} />
        {legs.map((leg, n) => (
          <Trace key={leg.i} pts={[HUB, [HUB[0], leg.y], [TOOL.x - 4, leg.y]]} stroke={color.human} dash="8 7" arrow at={h0 + 8 + n * LEG} duration={LEG / 2} easing={ease.linear} />
        ))}
        {shuttle
          ? (() => {
              const pts = legPts(shuttle.y);
              const t = (frame - h0 - 8 - k * LEG) / LEG;
              const along = t < 0.5 ? t * 2 : 2 - t * 2;
              const at = pointOnTrace(pts, traceLength(pts) * along);
              return <circle cx={at.x} cy={at.y} r={8} fill={color.human} />;
            })()
          : null}
      </svg>

      <div style={{ position: "absolute", left: 1010 - 34, top: 538 - 34, ...enter(frame, h0, { distance: 0 }) }}>
        <div style={{ backgroundColor: color.bg, padding: 2 }}>
          <HumanIcon size={64} color={color.human} />
        </div>
      </div>
      {legs.map((leg, n) => (
        <div key={leg.i} style={{ position: "absolute", left: HUB[0] + 18, top: n === 2 ? leg.y + 4 : leg.y - 46, ...sans(30, 600), color: color.human, whiteSpace: "nowrap", ...enter(frame, h0 + 12 + n * LEG, { distance: 8 }) }}>
          {leg.verb}
        </div>
      ))}

      <div style={{ position: "absolute", left: 880, width: TOOL.x - 20 - 880, top: 222, textAlign: "right", ...sans(30, 700), color: color.problem, whiteSpace: "nowrap", ...enter(frame, lock + 10) }}>
        {TX.ipLock}
      </div>

      {/* 현재 */}
      <div style={{ position: "absolute", right: 1920 - 1824 + 34, top: 80, display: "flex", alignItems: "center", gap: 18, ...enter(frame, within("s2.6", 0.25)) }}>
        <div style={{ ...sans(30, 600), color: color.inkDim, padding: "0 12px", height: 44, display: "flex", alignItems: "center", border: `${stroke.hair}px dashed ${color.inkDim}` }}>{TX.now}</div>
        <div style={{ ...sans(30, 500), color: color.inkDim, whiteSpace: "nowrap" }}>{TX.nowNote}</div>
      </div>
    </ShiftSheet>
  );
};
