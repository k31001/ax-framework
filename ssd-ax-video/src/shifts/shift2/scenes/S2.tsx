import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, progress } from "../../../video/anim";
import { WarnIcon } from "../../../video/components/Icons";
import { RequirementCard } from "../../../video/components/RequirementCard";
import { Trace } from "../../../video/components/Trace";
import { CARD, S5 } from "../../../video/content";
import { color, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { At, Boxed, Glyph, Layer, T, fade } from "./kit";

// s2 지금: 변경 하나가 지나가는 며칠. 가로 시간축 위에 짧은 작업 막대(호박색)와 긴 대기(붉은 점선).

const RECORDS = S5.map((s) => s.record);
const X0 = 170; // 카드에서 내려오는 선
const AXIS_Y = 352;
const Y_RTL = 470;
const Y_FW = 680;
const TICKS = [
  { x: 190, label: "D+0" },
  { x: 490, label: "D+1" },
  { x: 800, label: "D+2" },
  { x: 1050, label: "D+3" },
  { x: 1420, label: "다음 장비 차례", sans: true },
];
const EMU = { x: 1700, y: 576 };

const Bar: React.FC<{ x: number; w: number; y: number; at: number; dim: number }> = ({ x, w, y, at, dim }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, DUR.draw);
  if (p <= 0) return null;
  return (
    <rect x={x} y={y - 10} width={w * p} height={20} fill={withAlpha(color.human, 0.85)} stroke={color.human} strokeWidth={stroke.thin} opacity={1 - 0.65 * dim} />
  );
};

export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const c1 = cue("s2.1");
  const c2 = cue("s2.2");
  const c3 = cue("s2.3");
  const c4 = cue("s2.4");
  const c5 = cue("s2.5");
  const c6 = cue("s2.6");
  const tickOn = [c2, c3, undefined, c4, c5];
  const dim = progress(frame, c6, 14, ease.inOut);
  const waitW = stroke.trace + dim * 1.5;
  const axisP = progress(frame, c1 + 30, 30);
  const diffP = progress(frame, c1 + 44, DUR.draw);
  const logP = fade(frame, c3 + 34);
  const workP = progress(frame, c6 + 14, 20);
  const waitP = progress(frame, c6 + 44, 50, ease.inOut);
  const humanText = 1 - 0.55 * dim;

  return (
    <ShiftSheet>
      <RequirementCard card={CARD} left={96} top={80} records={RECORDS} attached={4} appear={progress(frame, c1 - 8, 24)} />
      <T x={770} y={90} at={c1 + 10} color={color.inkDim}>
        본편 S5-5: 완료 전달을 비트에서 큐로
      </T>
      <T x={1824} y={84} at={8} align="right" color={color.inkDim}>
        <span style={{ display: "inline-block", padding: "2px 14px", border: `${stroke.hair}px dashed ${color.lineStrong}` }}>현재</span>
      </T>

      <Layer>
        {/* 카드에서 diff 조각으로, 카드에서 시간축 맨 왼쪽으로 */}
        <Trace pts={[[726, 196], [770, 196]]} stroke={color.human} at={c1 + 40} duration={8} />
        {diffP > 0 ? (
          <g opacity={diffP}>
            <rect x={770} y={146} width={620 * diffP} height={102} fill={withAlpha(color.panel, 0.92)} stroke={color.line} strokeWidth={stroke.thin} />
            <rect x={770} y={146} width={5} height={102} fill={color.human} />
          </g>
        ) : null}
        <Trace pts={[[X0, 253], [X0, Y_RTL], [190, Y_RTL]]} stroke={color.inkSoft} at={c1 + 20} duration={24} />

        {/* 시간축 */}
        <line x1={X0} y1={AXIS_Y} x2={X0 + (1824 - X0) * axisP} y2={AXIS_Y} stroke={color.lineStrong} strokeWidth={stroke.thin} />
        {TICKS.map((t, i) => {
          const p = progress(frame, c1 + 34 + i * 5, DUR.enter);
          const at = tickOn[i];
          const on = at === undefined ? 0 : progress(frame, at, DUR.enter);
          return (
            <g key={i} opacity={p}>
              <line x1={t.x} y1={AXIS_Y - 12} x2={t.x} y2={AXIS_Y + 12} stroke={on > 0 ? color.ink : color.lineStrong} strokeWidth={stroke.thin} />
            </g>
          );
        })}

        {/* RTL 선 */}
        <Bar x={190} w={110} y={Y_RTL} at={c2 + 4} dim={dim} />
        <Trace pts={[[300, Y_RTL], [490, Y_RTL]]} stroke={color.problem} dash="10 9" width={waitW} at={c2 + 56} duration={34} easing={ease.inOut} />
        <Bar x={490} w={110} y={Y_RTL} at={c3 + 6} dim={dim} />
        <Trace pts={[[545, Y_RTL + 10], [545, 585], [640, 585]]} stroke={color.lineStrong} at={c3 + 26} opacity={1 - 0.6 * dim} />
        <Trace pts={[[600, Y_RTL], [EMU.x, Y_RTL], [EMU.x, EMU.y - 40]]} stroke={color.problem} dash="10 9" width={waitW} at={c5 + 2} duration={48} easing={ease.inOut} />

        {/* FW 선 */}
        <Trace pts={[[X0, Y_RTL], [X0, Y_FW], [190, Y_FW]]} stroke={color.inkSoft} at={c4} duration={14} />
        <Trace pts={[[190, Y_FW], [1050, Y_FW]]} stroke={color.problem} dash="10 9" width={waitW} at={c4 + 10} duration={40} easing={ease.inOut} />
        <Bar x={1130} w={110} y={Y_FW} at={c4 + 84} dim={dim} />
        <Trace pts={[[1240, Y_FW], [EMU.x, Y_FW], [EMU.x, EMU.y + 40]]} stroke={color.problem} dash="10 9" width={waitW} at={c5 + 14} duration={36} easing={ease.inOut} />

        {/* 장비: 두 선이 처음 만나는 곳 */}
        {progress(frame, c5 + 44) > 0 ? (
          <rect
            x={EMU.x - 40}
            y={EMU.y - 40}
            width={80}
            height={80}
            fill={color.bg}
            stroke={color.inkSoft}
            strokeWidth={stroke.thin}
            opacity={progress(frame, c5 + 44)}
          />
        ) : null}

        {/* 작업 대 대기: 길이만 */}
        {workP > 0 ? <rect x={300} y={800} width={330 * workP} height={20} fill={withAlpha(color.human, 0.85)} stroke={color.human} strokeWidth={stroke.thin} /> : null}
        <Trace pts={[[300, 862], [1820, 862]]} stroke={color.problem} dash="10 9" width={stroke.bold + 0.5} progress={waitP} />
      </Layer>

      {/* diff 조각 */}
      <T x={798} y={156} at={c1 + 50} px={28} color={color.problem} code>
        {"- rcv_done[3:3]"}
      </T>
      <T x={798} y={200} at={c1 + 56} px={28} color={color.agent} code>
        {"+ RCV_CPL_POP @ 0x48"}
      </T>

      {/* 눈금 글자 */}
      {TICKS.map((t, i) => {
        const at = tickOn[i];
        const on = at !== undefined && frame >= at;
        return (
          <T key={i} x={t.x + 12} y={300} at={c1 + 34 + i * 5} code={!t.sans} weight={on ? 700 : 500} color={on ? color.ink : color.inkDim}>
            {t.label}
          </T>
        );
      })}
      <T x={1824} y={298} at={c1 + 58} align="right" weight={600}>
        <Boxed tone="dim">예시</Boxed>
      </T>

      <T x={96} y={Y_RTL - 19} at={c1 + 30} px={28} weight={700} color={color.inkSoft} code>
        RTL
      </T>
      <T x={96} y={Y_FW - 19} at={c4 + 4} px={28} weight={700} color={color.inkSoft} code>
        FW
      </T>

      {/* s2.2 */}
      <T x={190} y={414} at={c2 + 6} weight={600} color={color.human} opacity={humanText}>
        RTL commit
      </T>
      <T x={316} y={486} at={c2 + 66} weight={600} color={color.problem}>
        밤 regression 대기
      </T>

      {/* s2.3 */}
      <T x={490} y={414} at={c3 + 8} weight={600} color={color.human} opacity={humanText}>
        실패 로그 수동 분류
      </T>
      {logP > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 640,
            top: 524,
            width: 250,
            height: 122,
            border: `${stroke.thin}px solid ${color.line}`,
            backgroundColor: withAlpha(color.panel, 0.92),
            overflow: "hidden",
            opacity: logP * (1 - 0.6 * dim),
          }}
        >
          {Array.from({ length: 44 }, (_, i) => {
            const scroll = Math.max(0, frame - (c3 + 34)) * 1.6;
            const y = ((((12 + i * 15 - scroll) % 660) + 660) % 660) - 15;
            if (y < -10 || y > 130) return null;
            const w = 90 + ((i * 53) % 120);
            const red = i % 5 !== 3;
            return <div key={i} style={{ position: "absolute", left: 14, top: y, width: w, height: 5, backgroundColor: red ? color.problem : color.lineStrong, opacity: red ? 0.85 : 0.6 }} />;
          })}
        </div>
      ) : null}

      {/* s2.4 */}
      <T x={420} y={696} at={c4 + 22} weight={600} color={color.problem}>
        문서 대기
      </T>
      <At x={1082} y={Y_FW} opacity={fade(frame, c4 + 40) * humanText}>
        <div style={{ backgroundColor: color.bg, padding: 4 }}>
          <Glyph kind="doc" size={44} color={color.human} />
        </div>
      </At>
      <T x={1012} y={618} at={c4 + 42} weight={600} color={color.human} opacity={humanText}>
        API 문서 갱신
      </T>
      <T x={1130} y={696} at={c4 + 86} weight={600} color={color.human} opacity={humanText}>
        FW driver 수정
      </T>

      {/* s2.5 */}
      <T x={1150} y={486} at={c5 + 22} weight={600} color={color.problem}>
        장비 대기열
      </T>
      <At x={EMU.x} y={EMU.y} opacity={fade(frame, c5 + 46)}>
        <Glyph kind="emu" size={52} color={color.ink} />
      </At>
      <At x={1500} y={EMU.y} opacity={fade(frame, c5 + 78)}>
        <WarnIcon size={40} color={color.problem} />
      </At>
      <T x={1528} y={EMU.y - 20} at={c5 + 78} weight={700} color={color.problem} code>
        timeout
      </T>

      {/* s2.6 */}
      <T x={190} y={790} at={c6 + 10} weight={700} color={color.human}>
        작업
      </T>
      <T x={190} y={842} at={c6 + 40} weight={700} color={color.problem}>
        대기
      </T>
    </ShiftSheet>
  );
};
