import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, enter, lerp, progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { Trace, Via } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { AREA, CallLog, LOG, rowY } from "./CallLog";
import { SearchIcon, TicketIcon, useCues } from "./kit";
import { ANSWER, AUDIT, BUG_CARD, CALLS, POLICY, TX } from "./text";

// S5 예제 2: 근거가 달린 가설과 기록. S4 의 구도 그대로, 호출 기록에 두 줄이 더 쌓인다.

const SEARCH = { y: AREA.y + 6, h: 72 } as const;
const BR = { y: 376, h: 68, lx: AREA.x, rx: 1320, w: 504 } as const;
const RESULT_Y = 536;
const ANS_Y = AREA.y + 6;
const ROW = { y: 262, h: 116 } as const; // 티켓 → 승인 대기 → 사람
const POLICY_Y = 452;
const AUDIT_Y = 476;

export const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s5.1");
  const t3 = cue("s5.3");
  const t4 = cue("s5.4");
  const t5 = cue("s5.5");
  const t6 = cue("s5.6");

  // 1부: 검색
  const part1 = 1 - progress(frame, t3 - 6, DUR.exit, ease.in);
  const kw = within("s5.1", 0.5);
  const sem = within("s5.1", 0.78);
  const merge = cue("s5.2") - 8;

  // 2부: 답
  const ev = [0.5, 0.63, 0.76, 0.88].map((t) => within("s5.3", t));
  const part2out = t5 - 6;
  const part2 = 1 - progress(frame, part2out, DUR.exit, ease.in);

  // 3부: 초안과 승인 대기, 정책, 감사 기록
  const draftGo = progress(frame, t5 + 16, DUR.move, ease.inOut);
  const stub = progress(frame, t5 + 2, DUR.enter);
  const gate = progress(frame, t5 + 34, DUR.enter);
  const beat = gate > 0 ? 0.5 + 0.5 * Math.sin((frame - t5) / 7) : 0;
  const cy = ROW.y + ROW.h / 2;
  const GATE_X = 1470;

  return (
    <ShiftSheet>
      <CallLog at={[-100, -100, -100, -100, -100, -100, t1, t5]} flash={[[3, ev[0], ev[1]], [4, ev[1], ev[2]], [5, ev[2], ev[3]], [6, ev[3], t4 - 4]]} />

      {/* ── 1부: 키워드 · 의미 병행 검색 ── */}
      {part1 > 0 ? (
        <div style={{ opacity: part1 }}>
          <div style={{ position: "absolute", left: AREA.x, top: SEARCH.y, width: AREA.w, height: SEARCH.h, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.agent}`, backgroundColor: withAlpha(color.panel, 0.9), display: "flex", alignItems: "center", gap: 18, padding: "0 24px", ...enter(frame, t1 + 18) }}>
            <SearchIcon size={36} color={color.agent} />
            <div style={{ ...sans(34, 600), whiteSpace: "nowrap" }}>{TX.query}</div>
            <div style={{ marginLeft: "auto", ...mono(26, 700), color: color.agent }}>hybrid</div>
          </div>
          {[
            { x: BR.lx, text: TX.keyword, at: kw, tag: "BM25" },
            { x: BR.rx, text: TX.meaning, at: sem, tag: "EMBEDDING" },
          ].map((b) => (
            <div key={b.tag} style={{ position: "absolute", left: b.x, top: BR.y, width: BR.w, height: BR.h, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.lineStrong}`, backgroundColor: withAlpha(color.panel, 0.9), display: "flex", alignItems: "center", padding: "0 22px", ...enter(frame, b.at + 8) }}>
              <div style={{ ...sans(30, 600), whiteSpace: "nowrap" }}>{b.text}</div>
            </div>
          ))}
          <svg {...fullSvg}>
            <Trace pts={[[BR.lx + BR.w / 2, SEARCH.y + SEARCH.h], [BR.lx + BR.w / 2, BR.y - 4]]} stroke={color.agent} arrow at={kw} />
            <Trace pts={[[BR.rx + BR.w / 2, SEARCH.y + SEARCH.h], [BR.rx + BR.w / 2, BR.y - 4]]} stroke={color.agent} arrow at={sem} />
            <Trace pts={[[BR.lx + BR.w / 2, BR.y + BR.h], [BR.lx + BR.w / 2, 490], [1300, 490], [1300, RESULT_Y - 4]]} stroke={color.agent} at={merge} arrow />
            <Trace pts={[[BR.rx + BR.w / 2, BR.y + BR.h], [BR.rx + BR.w / 2, 490], [1300, 490]]} stroke={color.agent} at={merge} />
            <Via x={1300} y={490} stroke={color.agent} p={progress(frame, merge + 10, 8)} />
          </svg>
        </div>
      ) : null}
      <CodePanel x={AREA.x} y={RESULT_Y} w={AREA.w} title="kb.search · score 0.82" px={28} at={cue("s5.2")} out={t3 - 6} owner="none" lines={BUG_CARD.map((text, i) => (i === 0 ? { text, tone: "agent" as const } : i === 1 ? { text, mark: within("s5.2", 0.45) } : { text }))} />

      {/* ── 2부: 에이전트의 답 ── */}
      <CodePanel
        x={AREA.x}
        y={ANS_Y}
        w={AREA.w}
        title="triage-agent · answer"
        px={28}
        at={t3}
        out={part2out}
        owner="agent"
        lines={ANSWER.map((text, i) => {
          if (i < 2) return { text, at: t3 + 8 + i * 4 };
          if (i < 6) return { text, at: ev[i - 2], mark: ev[i - 2], unmark: i === 5 ? t4 - 4 : ev[i - 1] };
          return { text, at: t4 + (i - 6) * 5, tone: "human" as const };
        })}
      />
      {part2 > 0 ? (
        <svg {...fullSvg} opacity={part2}>
          {[
            { x0: AREA.x + 24, x1: AREA.x + 24 + 640, row: 6 },
            { x0: AREA.x + 24 + 14 * 16.8, x1: AREA.x + 24 + 14 * 16.8 + 262, row: 7 },
          ].map((u) => {
            const p = progress(frame, t4 + 10 + (u.row - 6) * 6, DUR.draw);
            const y = ANS_Y + 64 + (u.row + 1) * 42 - 2;
            return <line key={u.row} x1={u.x0} x2={lerp(u.x0, u.x1, p)} y1={y} y2={y} stroke={color.human} strokeWidth={stroke.trace} strokeDasharray="3 7" opacity={p > 0 ? 1 : 0} />;
          })}
        </svg>
      ) : null}

      {/* ── 3부: 초안 → 승인 대기 → 사람 ── */}
      <svg {...fullSvg}>
        <Trace pts={[[AREA.x + 150, cy], [GATE_X - 62, cy]]} stroke={color.agent} at={t5 + 12} duration={DUR.move} easing={ease.inOut} />
        <Trace pts={[[GATE_X + 62, cy], [1640, cy]]} stroke={color.human} dash="8 7" at={t5 + 40} arrow />
        {gate > 0 ? (
          <g opacity={gate}>
            <path d={`M ${GATE_X} ${cy - 54} L ${GATE_X + 54} ${cy} L ${GATE_X} ${cy + 54} L ${GATE_X - 54} ${cy} Z`} fill={withAlpha(color.human, 0.1 + 0.14 * beat)} stroke={color.human} strokeWidth={stroke.bold} />
            <path d={`M ${GATE_X - 9} ${cy - 16} v 32 M ${GATE_X + 9} ${cy - 16} v 32`} stroke={color.human} strokeWidth={5} />
          </g>
        ) : null}
        {/* 호출마다 감사 기록으로 */}
        {CALLS.map((c, i) => {
          const y = rowY(i) + 54;
          return <Trace key={c.no} pts={[[LOG.x + LOG.w, y], [732, y], [732, AUDIT_Y + 98], [AREA.x - 2, AUDIT_Y + 98]]} stroke={color.agent} width={stroke.hair} opacity={0.8} at={t6 + i * 3} duration={DUR.draw + 4} />;
        })}
      </svg>
      {stub > 0 ? (
        <div style={{ position: "absolute", left: AREA.x, top: ROW.y, width: 150, height: ROW.h, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.agent}`, borderLeft: `5px solid ${color.agent}`, backgroundColor: withAlpha(color.panel, 0.9), display: "flex", alignItems: "center", justifyContent: "center", ...mono(22, 700), color: color.agent, opacity: stub * 0.75 }}>ANSWER</div>
      ) : null}
      {stub > 0 ? (
        <div style={{ position: "absolute", left: lerp(AREA.x + 20, 1010, draftGo), top: ROW.y, width: 330, height: ROW.h, boxSizing: "border-box", border: `${stroke.thin}px dashed ${color.agent}`, backgroundColor: color.panel, padding: "12px 20px", opacity: progress(frame, t5 + 14, 10) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TicketIcon size={32} color={color.agent} />
            <div style={{ ...mono(22, 700), color: color.agent }}>TICKET · DRAFT</div>
          </div>
          <div style={{ ...mono(34, 700), color: color.ink, marginTop: 8 }}>REQ-QOS-07</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: GATE_X - 200, width: 400, top: cy + 62, textAlign: "center", ...sans(32, 700), color: color.human, ...enter(frame, t5 + 38, { distance: 8 }) }}>{TX.pending}</div>
      <div style={{ position: "absolute", left: 1660, top: cy - 46, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, ...enter(frame, t5 + 44, { from: "left" }) }}>
        <HumanIcon size={64} color={color.human} />
        <div style={{ ...mono(22, 700), color: color.human }}>HUMAN</div>
      </div>

      <CodePanel
        x={AREA.x}
        y={POLICY_Y}
        w={860}
        title="policy · triage-agent"
        px={26}
        at={t5 + 6}
        out={t6 - 6}
        owner="human"
        lines={POLICY.map((text, i) => (i === 5 ? { text, mark: within("s5.5", 0.5), markTone: "human" as const } : i === 6 ? { text, tone: "problem" as const } : { text }))}
      />
      <CodePanel
        x={AREA.x}
        y={AUDIT_Y}
        w={AREA.w}
        title="audit.jsonl"
        px={26}
        at={t6 + 8}
        owner="none"
        lines={AUDIT.map((text, i) => {
          const m = [t6 + 18, within("s5.6", 0.34), within("s5.6", 0.6)];
          return { text, mark: m[i], unmark: i < 2 ? m[i + 1] : undefined };
        })}
      />
    </ShiftSheet>
  );
};
