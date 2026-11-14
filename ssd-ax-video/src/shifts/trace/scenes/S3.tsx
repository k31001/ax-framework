import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { At, Box, blend, mx, tx, useCues } from "./kitA";

// S3 팀의 장면: 숫자 하나를 바꾸려는 날. 위: host 우선 큐와 4 : 1. 가운데: 계약. 이어서 Jira의 답(이슈 4건)과 실제로 볼 곳(파일 7개).

const RC = { x: 96, y: 130, w: 190, h: 120 } as const;
const Q = { x: 380, y: 130, w: 380, h: 120 } as const;
const ARB = { x: 782, y: 148, w: 54, h: 84 } as const;
const SD = { x: 940, y: 130, w: 240, h: 120 } as const;
const MID = 190;
const WHO = { x: 1240, y: 150, h: 64 } as const;
const JIRA = { x: 96, y: 310, w: 740, row: 50 } as const;
const LIST = { x: 900, y: 310, row: 54 } as const;
const ISSUES = [
  ["FEAT-338", "우선 큐", "구현 중"],
  ["VER-541", "a_host_first", "승인"],
  ["VER-542", "a_gc_no_starve", "승인"],
  ["VER-543", "prio_q_ratio_test", "승인"],
] as const;
const FILES = [
  ["hsi/contracts/HSI-RCV-010.yaml", "order 조항", 0.2],
  ["arch/struct/rcv.arch.yaml", "prio_q.order", 0.3],
  ["hsi/rdl/rcv_ctrl.rdl", "HOST_BURST = 4", 0.42],
  ["rtl/rcv/prio_q_sva.sv", "assertion 2개", 0.56],
  ["dv/rcv/tests/prio_q_ratio_test.sv", "기대값이 비율", 0.66],
  ["fw/rcv/rcv_policy.cpp", "kHostBurst = 4", 0.78],
  ["fw/gc/gc_throttle.cpp", "?", 0.9],
] as const;

export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const c1 = cue("s3.1");
  const c2 = cue("s3.2");
  const c3 = cue("s3.3");
  const c4 = cue("s3.4");
  const c5 = cue("s3.5");
  const c6 = cue("s3.6");

  const diag = progress(frame, c1, DUR.enter);
  const back = 1 - 0.5 * progress(frame, c4 - 6, 14); // 뒤 장면에서는 그림이 물러난다
  const ratioAt = within("s3.1", 0.55);
  const toAt = within("s3.2", 0.55);
  const blink = frame >= c2 && frame < c3 ? 0.6 + 0.4 * Math.cos(((frame - c2) / 20) * Math.PI * 2) : frame >= c3 ? 1 : 0;
  const four = blend(color.ink, color.human, progress(frame, c2, 10));
  const fwLead = progress(frame, within("s3.2", 0.2), DUR.enter) * (1 - progress(frame, c3 - 10, 8));
  const rtlLead = progress(frame, c3, DUR.enter);
  const ask = progress(frame, within("s3.3", 0.4), DUR.enter);
  const countAt = within("s3.4", 0.5);
  const lone = progress(frame, c6 + 2, 14);
  const gapAt = within("s3.6", 0.55);

  return (
    <ShiftSheet>
      {/* ── 구조 설계 편의 host 우선 큐 ── */}
      <div style={{ opacity: back }}>
        <svg {...fullSvg} opacity={diag}>
          <g fill="none" stroke={color.inkSoft} strokeWidth={stroke.trace}>
            <path d={`M ${RC.x + RC.w} 160 H ${Q.x} M ${RC.x + RC.w} 220 H ${Q.x}`} />
            <path d={`M ${Q.x + Q.w} 160 H ${ARB.x} M ${Q.x + Q.w} 220 H ${ARB.x} M ${ARB.x + ARB.w} ${MID} H ${SD.x - 4}`} />
            <path d={`M ${SD.x - 16} ${MID - 8} L ${SD.x - 4} ${MID} L ${SD.x - 16} ${MID + 8}`} />
          </g>
          <g fill={withAlpha(color.panel, 0.9)} stroke={color.agent} strokeWidth={stroke.thin}>
            <rect x={RC.x} y={RC.y} width={RC.w} height={RC.h} />
            <rect x={Q.x} y={Q.y} width={Q.w} height={Q.h} strokeWidth={stroke.trace} />
            <line x1={Q.x} x2={Q.x + Q.w} y1={MID} y2={MID} />
            <path d={`M ${ARB.x} ${ARB.y} L ${ARB.x + ARB.w} ${ARB.y + 22} V ${ARB.y + ARB.h - 22} L ${ARB.x} ${ARB.y + ARB.h} Z`} fill={blend(color.panel, color.agent, 0.2)} />
            <rect x={SD.x} y={SD.y} width={SD.w} height={SD.h} />
          </g>
          <line x1={ARB.x + 27} x2={ARB.x + 27} y1={126} y2={ARB.y + 8} stroke={color.lineStrong} strokeWidth={stroke.hair} opacity={progress(frame, ratioAt, 10)} />
        </svg>
        <At x={RC.x + RC.w / 2} y={RC.y + 40} center p={diag} style={mx(30, 700, color.ink)}>
          rcv_ctrl
        </At>
        <At x={Q.x} y={82} p={diag} style={tx(30, 700)}>
          복구 요청 큐(prio_q)
        </At>
        <At x={Q.x + 24} y={Q.y + 11} p={diag} style={tx(30, 700)}>
          host 우선
        </At>
        <At x={Q.x + 24} y={MID + 11} p={diag} style={tx(30, 600, color.inkDim)}>
          GC
        </At>
        <At x={SD.x + SD.w / 2} y={SD.y + 40} center p={diag} style={mx(30, 700, color.ink)}>
          soft LDPC ×2
        </At>
        <At x={776} y={80} p={progress(frame, ratioAt, DUR.enter)} style={mx(34, 700, color.ink)}>
          host <span style={{ color: four, opacity: blink || 1 }}>4</span> : GC 1<span style={{ color: color.human, opacity: progress(frame, toAt, DUR.enter) }}> → 3 ?</span>
        </At>
        <At x={1824} y={84} right p={progress(frame, c1 + 8, DUR.enter)} style={tx(30, 500, color.inkDim)}>
          구조 설계 편에서 이어짐 · soft decoder 3 → 2
        </At>
      </div>

      {/* ── 사람 ── */}
      <Box x={WHO.x} y={WHO.y} w={584} h={WHO.h} c={color.human} bg={withAlpha(color.human, 0.08)} p={fwLead} style={{ gap: 14 }}>
        <HumanIcon size={34} color={color.human} />
        <div style={tx(30, 700, color.human)}>FW 리드 · GC 처리량이 빠듯함</div>
      </Box>
      <Box x={WHO.x} y={WHO.y} w={186} h={WHO.h} c={color.human} bg={withAlpha(color.human, 0.08)} p={rtlLead} style={{ gap: 10 }}>
        <HumanIcon size={34} color={color.human} />
        <div style={tx(30, 700, color.human)}>RTL 리드</div>
      </Box>
      <Box x={WHO.x + 204} y={WHO.y} w={380} h={WHO.h} c={color.human} bg={withAlpha(color.panel, 0.92)} p={ask} round>
        <div style={tx(32, 700)}>그 4가 어디어디에 있지?</div>
      </Box>

      {/* ── 계약 ── */}
      <CodePanel
        x={96}
        y={320}
        w={900}
        px={30}
        title="hsi/contracts/HSI-RCV-010.yaml"
        owner="human"
        at={within("s3.2", 0.3)}
        out={c4 - 10}
        lines={[
          "id: HSI-RCV-010          # 복구 요청 계약 (예시)",
          "jira: FEAT-338",
          { text: "order: host 먼저. gc는 host 4건당 1건 이상", mark: within("s3.2", 0.45), markTone: "human" },
          "full: 큐가 차면 gc 요청부터 backpressure",
          "verify: [sva:a_host_first, sva:a_gc_no_starve]",
        ]}
      />

      {/* ── Jira의 답: 이슈 4건 ── */}
      <Box x={JIRA.x} y={JIRA.y} w={JIRA.w} h={56 + ISSUES.length * JIRA.row + 8} c={color.ink} p={progress(frame, c4, DUR.enter)} style={{ justifyContent: "flex-start", alignItems: "flex-start" }}>
        <div style={{ ...mx(22, 700, color.inkSoft), letterSpacing: "0.08em", padding: "12px 24px", width: "100%", boxSizing: "border-box", borderBottom: `${stroke.hair}px solid ${color.line}` }}>JIRA SEARCH</div>
      </Box>
      {ISSUES.map(([key, name, state], i) => {
        const p = progress(frame, c4 + 10 + i * 6, DUR.enter);
        const y = JIRA.y + 60 + i * JIRA.row;
        return (
          <React.Fragment key={key}>
            <At x={JIRA.x + 26} y={y} p={p} style={mx(28, 700, color.ink)}>
              {key}
            </At>
            <At x={JIRA.x + 196} y={y} p={p} style={mx(28, 500, color.inkSoft)}>
              {name}
            </At>
            <At x={JIRA.x + JIRA.w - 26} y={y - 2} right p={p} style={tx(28, 600, color.inkSoft)}>
              {state}
            </At>
          </React.Fragment>
        );
      })}
      <At x={JIRA.x} y={596} p={progress(frame, countAt, DUR.enter)} style={tx(48, 800)}>
        이슈 4건
      </At>

      {/* ── 실제로 볼 곳: 파일 7개 ── */}
      <svg {...fullSvg}>
        {/* 흐린 파일 트리 */}
        <g opacity={0.6 * progress(frame, c5, 16)} stroke={color.line} strokeWidth={8}>
          {[420, 260, 540, 330, 600, 380, 300, 470].map((w, i) => (
            <line key={i} x1={LIST.x + 38 + (i % 3) * 26} x2={LIST.x + 38 + (i % 3) * 26 + w} y1={LIST.y - 5 + i * LIST.row} y2={LIST.y - 5 + i * LIST.row} />
          ))}
        </g>
        {FILES.map(([, , t], i) => {
          const p = progress(frame, within("s3.5", t), 12);
          const y = LIST.y + i * LIST.row + 22;
          const c = i === 6 ? blend(color.ink, color.problem, lone) : color.ink;
          return <circle key={i} cx={LIST.x + 14} cy={y} r={7 * p} fill={c} />;
        })}
        {lone > 0 ? <rect x={LIST.x - 6} y={LIST.y + 6 * LIST.row - 5} width={930} height={54} fill={withAlpha(color.problem, 0.07)} stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="9 7" opacity={lone} /> : null}
        {/* 이슈 4건과 목록 사이의 빈틈 */}
        <Trace pts={[[330, 628], [560, 628]]} stroke={color.problem} dash="8 7" at={gapAt} duration={14} easing={ease.inOut} />
        <Trace pts={[[870, 628], [640, 628]]} stroke={color.problem} dash="8 7" at={gapAt} duration={14} easing={ease.inOut} />
        <g opacity={progress(frame, gapAt + 10, 10)} stroke={color.problem} strokeWidth={stroke.bold}>
          <line x1={572} x2={592} y1={646} y2={610} />
          <line x1={608} x2={628} y1={646} y2={610} />
        </g>
      </svg>
      {FILES.map(([path, note, t], i) => {
        const p = progress(frame, within("s3.5", t), DUR.enter);
        const y = LIST.y + i * LIST.row + 4;
        const hot = i === 6 ? lone : 0;
        return (
          <React.Fragment key={path}>
            <At x={LIST.x + 38} y={y} p={p} style={mx(26, 500, blend(color.ink, color.problem, hot))}>
              {path}
            </At>
            <At x={LIST.x + 590} y={y} p={p} style={{ ...mx(26, 700, blend(color.human, color.problem, hot)), backgroundColor: color.bg, padding: "0 8px" }}>
              {note}
            </At>
          </React.Fragment>
        );
      })}
      <At x={LIST.x + 38} y={LIST.y + 7 * LIST.row + 14} p={progress(frame, within("s3.6", 0.3), DUR.enter)} style={tx(32, 700, color.problem)}>
        FW GC 담당의 코드 · 복구 블록은 모름
      </At>
    </ShiftSheet>
  );
};
