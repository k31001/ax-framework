import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, ease, enterExit, lerp, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { CodeRow, HEAD, Pane, TB_CODE, Tag, mix, paneH, rowH, split } from "./kit";

// s2 지금: 검증 엔지니어의 하루.
//   s2.1  오전: 편집기에 testbench 를 타이핑
//   s2.2  AI 초안 조각을 손으로 고쳐 쓴다
//   s2.3  아침: 붉은 로그가 밀려 올라간다
//   s2.4  오후: diff 의 줄마다 체크
//   s2.5  diff 더미가 시니어 앞에 쌓이고 붉어진다

const PX = 26; // 초안
const ED = 28; // 편집기 · diff
const LG = 30; // 로그
const TOP = 284;
const DW = 1100; // diff 창의 폭
const DAY = [
  { text: "아침", x: 300 },
  { text: "오전", x: 900 },
  { text: "오후", x: 1500 },
];

const DayAxis: React.FC<{ active: number }> = ({ active }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, 4, 20, ease.out);
  return (
    <>
      <svg {...fullSvg}>
        <line x1={96} y1={224} x2={96 + 1728 * p} y2={224} stroke={color.lineStrong} strokeWidth={stroke.thin} />
        {DAY.map((d, i) => (
          <circle key={i} cx={d.x} cy={224} r={i === active ? 9 : 6} fill={i === active ? color.human : color.bg} stroke={i === active ? color.human : color.lineStrong} strokeWidth={stroke.thin} opacity={p} />
        ))}
      </svg>
      {DAY.map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x - 100, width: 200, top: 166, textAlign: "center", ...sans(size.small, i === active ? 800 : 500), color: i === active ? color.human : color.inkDim, opacity: p }}>
          {d.text}
        </div>
      ))}
    </>
  );
};

const DRAFT = [
  { text: "task body();" },
  { text: "  repeat (10)", strike: 0 },
  { text: "  repeat (200)", fix: 0 },
  { text: "    `uvm_do(req)", strike: 1 },
  { text: "    `uvm_do_with(req, { src inside {HOST, GC};", fix: 1 },
  { text: "endtask" },
] as const;

const hex = (n: number): string => `0x${n.toString(16).toUpperCase().padStart(2, "0")}`;
const LOG = Array.from({ length: 26 }, (_, i) => {
  const ns = 1284350 + i * 7520 + ((i * 37) % 11) * 130;
  return i === 1 ? "UVM_ERROR @ 1291870ns [SCB] cmd 0x41 timeout (no done)" : `UVM_ERROR @ ${ns}ns [SCB] cmd ${hex(0x3a + ((i * 7) % 29))} timeout (no done)`;
});
const LOG_TAIL = "... 같은 message 57건, 다른 message 5종";

export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, end } = useScene();
  const c1 = cue("s2.1");
  const c2 = cue("s2.2");
  const c3 = cue("s2.3");
  const c4 = cue("s2.4");
  const c5 = cue("s2.5");
  const active = frame < c3 - 6 ? 1 : frame < c4 - 6 ? 0 : 2;

  // 타이핑
  const total = TB_CODE.reduce((n, l) => n + l.length, 0);
  const typed = Math.floor(total * clamp01((frame - (c1 + 8)) / (end("s2.1") - 6 - (c1 + 8))));
  let left = typed;
  const typedLines = TB_CODE.map((l) => {
    const n = Math.max(0, Math.min(l.length, left));
    left -= l.length;
    return l.slice(0, n);
  });
  const cursorRow = Math.max(0, typedLines.findIndex((l, i) => l.length < TB_CODE[i].length));
  const cursorOn = Math.floor(frame / 8) % 2 === 0;

  // 초안 고쳐 쓰기
  const e2 = end("s2.2");
  const steps = [split(c2, e2, 1, 3), split(c2, e2, 2, 3)];
  const open = steps.map((s) => progress(frame, s + 8, 10, ease.inOut));

  // 로그
  const e3 = end("s2.3");
  const scroll = lerp(0, LOG.length - 8, clamp01((frame - (c3 + 10)) / (e3 + 24 - c3)));
  const lh = rowH(LG);
  const dh = rowH(ED);

  // diff
  const e4 = end("s2.4");
  const e5 = end("s2.5");
  const red = progress(frame, split(c5, e5, 1, 2), 16, ease.inOut);
  const pile = [0, 1, 2, 3, 4];

  return (
    <ShiftSheet>
      <Tag text="현재" c={color.inkDim} x={96} y={78} at={4} dashed />
      <DayAxis active={active} />

      {/* 오전: 편집기와 초안 */}
      <Pane x={96} y={TOP} w={960} h={paneH(8, ED)} title="tb/rec_done_q_seq.sv" edge={color.human} at={c1} out={c3 - 10}>
        {typedLines.map((l, i) => (
          <CodeRow key={i} i={i} px={ED}>
            {l}
            {i === cursorRow && typed < total && cursorOn && frame > c1 + 8 ? <span style={{ color: color.human }}>▌</span> : null}
          </CodeRow>
        ))}
      </Pane>
      <Pane x={1080} y={TOP} w={744} h={paneH(6, PX)} title="DRAFT · AI" edge={withAlpha(color.agent, 0.6)} at={c2} out={c3 - 10}>
        {DRAFT.map((d, i) => {
          const k = "strike" in d ? d.strike : "fix" in d ? d.fix : -1;
          const fix = "fix" in d;
          const row = [0, 1, 2, 2 + open[0], 3 + open[0], 3 + open[0] + open[1]][i];
          return (
            <CodeRow
              key={i}
              i={row}
              px={PX}
              c={fix ? color.human : withAlpha(color.agent, 0.7)}
              o={fix ? open[k] : progress(frame, c2 + 6 + i * 2, 10)}
              strike={"strike" in d ? progress(frame, steps[k], 10, ease.out) : 0}
            >
              {d.text}
            </CodeRow>
          );
        })}
      </Pane>
      <Tag text="초안" c={color.agent} x={1824} right y={TOP - 2} at={c2 + 4} out={c3 - 10} style={{ height: 40, border: "none", backgroundColor: "transparent" }} />

      {/* 아침: 실패 로그 */}
      <Pane x={96} y={TOP} w={1050} h={paneH(9, LG)} title="regress/nightly.log" edge={color.problem} at={c3} out={c4 - 10}>
        <div style={{ position: "absolute", left: 0, right: 0, top: HEAD + 20, height: lh * 8 - 8, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 6, right: 2, top: lh * 3 + 1, height: lh - 2, backgroundColor: withAlpha(color.human, 0.16), borderLeft: `3px solid ${color.human}` }} />
          {LOG.map((l, i) => (
            <div key={i} style={{ position: "absolute", left: 24, top: (i - scroll) * lh, lineHeight: `${lh}px`, ...mono(LG, 500), letterSpacing: "0", fontVariantLigatures: "none", whiteSpace: "pre", color: color.problem }}>
              {l}
            </div>
          ))}
        </div>
        <CodeRow i={8} px={LG} c={color.inkSoft} o={progress(frame, split(c3, e3, 1, 2), 12)}>
          {LOG_TAIL}
        </CodeRow>
      </Pane>

      {/* 어디에도 이어지지 않은 티켓 */}
      <Pane x={1200} y={TOP} w={624} h={250} title="JIRA · TICKET" edge={color.lineStrong} at={split(c3, e3, 1, 3)} out={c4 - 10} opacity={0.75}>
        <CodeRow i={0} px={PX} c={color.inkSoft}>
          cmd timeout (no done)
        </CodeRow>
        {[0, 1].map((k) => (
          <div key={k} style={{ position: "absolute", left: 24 + k * 150, top: 122, width: 130, height: 44, border: `${stroke.thin}px dashed ${color.lineStrong}` }} />
        ))}
        <Tag text="링크 없음" c={color.problem} x={24} y={184} at={split(c3, e3, 1, 3) + 10} />
      </Pane>

      {/* 오후: 줄 단위 리뷰와 쌓이는 더미 */}
      <svg {...fullSvg}>
        {pile.map((k) => {
          const p = progress(frame, c5 + k * 5, 12, ease.out);
          const d = (5 - k) * 16;
          return p <= 0 ? null : (
            <rect key={k} x={96 + d * p} y={TOP - d * 0.4 * p} width={DW} height={paneH(8, ED)} fill={color.panel} stroke={mix(red, color.lineStrong, color.problem)} strokeWidth={stroke.thin} opacity={p} />
          );
        })}
        <Trace pts={[[DW + 96 + 96, 480], [1520, 480]]} stroke={mix(red, color.inkSoft, color.problem)} width={stroke.bold} arrow at={c5 + 14} />
      </svg>
      <Pane x={96} y={TOP} w={DW} h={paneH(8, ED)} title="review · tb/rec_done_q_seq.sv" edge={color.lineStrong} border={mix(red, color.line, color.problem)} at={c4}>
        {TB_CODE.map((l, i) => {
          const checked = progress(frame, split(c4, e4, i + 1, 9), 8, ease.out);
          return (
            <React.Fragment key={i}>
              <CodeRow i={i} px={ED} c={color.inkSoft} o={progress(frame, c4 + 6 + i * 2, 10)} mark={checked * (1 - progress(frame, split(c4, e4, i + 2, 9), 8))} markColor={color.human}>
                <span style={{ color: color.inkDim }}>{`${101 + i} `}</span>
                <span style={{ color: color.agent }}>+ </span>
                {l}
              </CodeRow>
              <div style={{ position: "absolute", right: 22, top: HEAD + 20 + i * dh + 6, opacity: checked }}>
                <CheckIcon size={30} color={color.human} />
              </div>
            </React.Fragment>
          );
        })}
      </Pane>
      <Tag text="+412 줄" c={color.agent} x={96 + DW} right y={TOP + paneH(8, ED) + 16} at={c4 + 10} />
      <div style={{ position: "absolute", left: 1560, top: 390, width: 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, ...enterExit(frame, c5 + 6) }}>
        <HumanIcon size={130} color={color.human} />
        <Tag text="시니어" c={color.human} at={c5 + 6} />
      </div>
    </ShiftSheet>
  );
};
