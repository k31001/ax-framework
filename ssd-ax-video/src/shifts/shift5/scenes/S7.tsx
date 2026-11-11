import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../../video/anim";
import { AgentIcon, HumanIcon } from "../../../video/components/Icons";
import { Trace } from "../../../video/components/Trace";
import { color, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { At, Box, Svg, Team, Txt, useAt, vis } from "./kit";

// s7 지키는 선 세 줄과 평가 기준의 전환, 그리고 마무리(세 칸이 한 탁자로).

const ROW_Y = [210, 390, 570];
const ROW_H = 150;
const LINES = ["지표는 팀 단위. 개인 감시 금지", "실패 보고에 불이익 없음", "주니어의 직접 debug 구간"];
const PEOPLE_X = [1030, 1110, 1190];
const EV = { x: 1300, y: 216, w: 524, h: 420 };
const EV_ITEMS = ["통과 기준 정의", "판단의 질", "팀 자산 기여"];

export const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const at = useAt();
  const t1 = cue("s7.1");
  const t2 = cue("s7.2");
  const t3 = cue("s7.3");
  const t4 = cue("s7.4");
  const t5 = cue("s7.5");
  const t6 = cue("s7.6");
  const rowAt = [t2, t3, t4];
  const allOut = 1 - progress(frame, t6 - 12, 10, ease.in);

  // 붉은 경계선이 문장마다 한 칸씩 내려온다
  const lineEnd = [176, ...ROW_Y.map((y) => y + ROW_H)];
  let reach = 96;
  [t1, t2, t3, t4].forEach((t, i) => {
    reach = lerp(reach, lineEnd[i], progress(frame, t, 22, ease.inOut));
  });

  // ① 개인 → 팀
  const y1 = ROW_Y[0] + 75;
  const xAt = at("s7.2", 0.28);
  const teamAt = at("s7.2", 0.52);
  const single = vis(frame, t2 + 10, teamAt, 10);
  const team = progress(frame, teamAt, 18, ease.inOut);
  // ② 이름 칸 없음
  const y2 = ROW_Y[1] + 75;
  const noName = at("s7.3", 0.4);
  // ③ 직접 debug 뒤에 가설 카드를 뒤집는다
  const y3 = ROW_Y[2] + 75;
  const wave = progress(frame, at("s7.4", 0.3), 40, ease.inOut);
  const flipAt = at("s7.4", 0.78);
  const flip = progress(frame, flipAt, 22, ease.inOut);
  const faceUp = flip > 0.5;
  const cardW = 150 * Math.abs(1 - 2 * flip);
  const CARD_CX = 1125;
  // 평가 기준
  const strike = progress(frame, at("s7.5", 0.3), 14, ease.inOut);
  const ev = progress(frame, t5, 18);
  // 마무리
  const closing = progress(frame, t6 - 2, 20, ease.inOut);
  const merge = progress(frame, t6 + 10, 44, ease.inOut);

  const wavePath = (y: number, edges: number[]): string => {
    let d = `M 880 ${y}`;
    let hi = false;
    edges.forEach((x) => {
      d += ` H ${x} V ${hi ? y : y - 22}`;
      hi = !hi;
    });
    return `${d} H 1030`;
  };

  return (
    <ShiftSheet hold>
      <div style={{ opacity: allOut }}>
        <Svg>
          <line x1={100} y1={96} x2={100} y2={reach} stroke={color.problem} strokeWidth={stroke.bold} />
          {ROW_Y.map((y, i) => {
            const p = progress(frame, rowAt[i], 18);
            return (
              <g key={i}>
                <line x1={100} y1={y + ROW_H} x2={100 + 1140 * p} y2={y + ROW_H} stroke={withAlpha(color.problem, 0.55)} strokeWidth={stroke.hair} />
              </g>
            );
          })}

          {/* ① 지표 카드 → 한 사람(X) → 팀 전체 */}
          <g opacity={progress(frame, t2 + 4, 14)}>
            <rect x={800} y={y1 - 36} width={84} height={72} fill={withAlpha(color.panel, 0.9)} stroke={color.inkSoft} strokeWidth={stroke.thin} />
            <rect x={814} y={y1 - 4} width={20} height={26} fill={color.agent} />
            <rect x={848} y={y1 - 18} width={20} height={40} fill={color.human} />
          </g>
          <Trace pts={[[884, y1], [team > 0 ? 986 : 996, y1]]} at={t2 + 10} stroke={team > 0 ? color.agent : color.inkSoft} arrow />
          {single > 0 ? (
            <g opacity={single}>
              <circle cx={PEOPLE_X[0]} cy={y1} r={36} fill="none" stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="6 6" />
              {frame >= xAt ? (
                <g stroke={color.problem} strokeWidth={stroke.bold}>
                  <line x1={926} y1={y1 - 16} x2={926 + 32 * progress(frame, xAt, 8)} y2={y1 - 16 + 32 * progress(frame, xAt, 8)} />
                  <line x1={958} y1={y1 - 16} x2={958 - 32 * progress(frame, xAt + 5, 8)} y2={y1 - 16 + 32 * progress(frame, xAt + 5, 8)} />
                </g>
              ) : null}
            </g>
          ) : null}
          <Box x={988} y={y1 - 44} w={244} h={88} p={team} c={color.agent} />

          {/* ② F-007 양식 */}
          <g opacity={progress(frame, t3 + 4, 14)}>
            <rect x={800} y={y2 - 46} width={170} height={92} fill={withAlpha(color.panel, 0.9)} stroke={color.inkSoft} strokeWidth={stroke.thin} />
            <rect x={800} y={y2 - 46} width={5} height={92} fill={color.human} />
            {[0, 1].map((k) => (
              <line key={k} x1={822} y1={y2 + 10 + k * 18} x2={822 + [120, 84][k]} y2={y2 + 10 + k * 18} stroke={color.lineStrong} strokeWidth={stroke.bold} />
            ))}
          </g>
          {frame >= noName ? <path d={`M 984 ${y2 - 30} H 998 V ${y2 + 30} H 984`} fill="none" stroke={color.human} strokeWidth={stroke.thin} opacity={progress(frame, noName, 12)} /> : null}

          {/* ③ 파형을 직접 본 뒤 가설 카드 */}
          <g opacity={progress(frame, t4 + 8, 14)}>
            <path d={wavePath(y3 - 8, [910, 950])} fill="none" stroke={color.human} strokeWidth={stroke.thin} pathLength={1} strokeDasharray={`${wave} 1`} />
            <path d={wavePath(y3 + 34, [960, 1000])} fill="none" stroke={color.human} strokeWidth={stroke.thin} pathLength={1} strokeDasharray={`${wave} 1`} />
            <defs>
              <pattern id="s7hatch" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1={0} y1={0} x2={0} y2={12} stroke={color.lineStrong} strokeWidth={2} />
              </pattern>
            </defs>
            <rect
              x={CARD_CX - cardW / 2}
              y={y3 - 48}
              width={cardW}
              height={96}
              fill={faceUp ? withAlpha(color.agent, 0.1) : "url(#s7hatch)"}
              stroke={faceUp ? color.agent : color.inkDim}
              strokeWidth={stroke.thin}
              strokeDasharray={faceUp ? undefined : "8 6"}
            />
            {faceUp
              ? [0, 1, 2].map((k) => (
                  <line key={k} x1={CARD_CX - 6} y1={y3 - 20 + k * 20} x2={CARD_CX - 6 + [60, 44, 52][k] * (2 * flip - 1)} y2={y3 - 20 + k * 20} stroke={color.agent} strokeWidth={stroke.bold} />
                ))
              : null}
          </g>

          {/* 평가 기준 */}
          <Box {...EV} p={ev} c={color.line} fill={withAlpha(color.panel, 0.9)} />
          <rect x={EV.x} y={EV.y} width={5} height={EV.h * ev} fill={color.human} />
          <line x1={EV.x + 30} y1={EV.y + 105} x2={EV.x + 30 + 210 * strike} y2={EV.y + 105} stroke={color.problem} strokeWidth={stroke.bold} />
          {EV_ITEMS.map((_, i) => {
            const p = progress(frame, at("s7.5", 0.5 + i * 0.14), 12);
            return <path key={i} d={`M ${EV.x + 34} ${EV.y + 210 + i * 68} l 10 10 l 18 -22`} fill="none" stroke={color.agent} strokeWidth={stroke.bold} opacity={p} />;
          })}
        </Svg>

        <div style={{ position: "absolute", left: 130, top: 70, ...mono(size.label, 700), color: color.problem, opacity: progress(frame, t1, 14) }}>BOUNDARY</div>
        <Txt x={130} y={100} at={t1 + 4} px={size.head} weight={800}>
          지키는 선
        </Txt>
        {LINES.map((text, i) => (
          <Txt key={i} x={140} y={ROW_Y[i] + 46} at={rowAt[i] + 4} px={size.sub} weight={700}>
            {text}
          </Txt>
        ))}
        {LINES.map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 140, top: ROW_Y[i] + 14, ...mono(size.label, 700), color: color.problem, opacity: progress(frame, rowAt[i], 14) }}>{`LINE 0${i + 1}`}</div>
        ))}

        <div style={{ position: "absolute", left: 800, top: y1 - 66, ...mono(size.label, 700), color: color.inkDim, opacity: progress(frame, t2 + 4, 14) }}>JIRA</div>
        {PEOPLE_X.map((x, i) => (
          <At key={i} x={x} y={y1} o={progress(frame, t2 + 6 + i * 3, 14)}>
            <HumanIcon size={52} color={color.human} />
          </At>
        ))}
        <Txt x={826} y={y2 - 40} at={t3 + 6} px={30} font="mono" weight={700} c={color.ink}>
          F-007
        </Txt>
        <Txt x={1012} y={y2 - 20} at={noName} px={size.small} weight={700} c={color.human}>
          사람 이름 칸 없음
        </Txt>
        <At x={830} y={y3} o={progress(frame, t4 + 6, 14)}>
          <HumanIcon size={52} color={color.human} />
        </At>
        <At x={CARD_CX - 36} y={y3} o={faceUp ? 2 * flip - 1 : 0}>
          <AgentIcon size={40} color={color.agent} />
        </At>
        <Txt x={140} y={748} at={at("s7.4", 0.45)} px={size.small} c={color.inkDim}>
          AI 사용 그룹 이해도 50% vs 직접 작성 67%, 격차는 debugging에서 최대
        </Txt>
        <Txt x={140} y={792} at={at("s7.4", 0.45) + 4} px={size.small} c={color.inkDim}>
          Anthropic 실험, 2026, 52명
        </Txt>

        <div style={{ position: "absolute", left: EV.x + 30, top: EV.y + 22, ...mono(size.label, 700), color: color.inkDim, opacity: ev }}>EVALUATION</div>
        <Txt x={EV.x + 30} y={EV.y + 68} at={t5 + 6} px={size.head} weight={700} c={strike > 0.5 ? color.inkDim : color.ink}>
          작성량
        </Txt>
        {EV_ITEMS.map((text, i) => (
          <Txt key={i} x={EV.x + 84} y={EV.y + 180 + i * 68} at={at("s7.5", 0.5 + i * 0.14)} px={size.sub} weight={700}>
            {text}
          </Txt>
        ))}
      </div>

      {/* s7.6 세 칸이 하나의 탁자로 */}
      <Team x={570} y={170} cellW={260} h={300} p={closing} merge={merge} />
      {frame >= t6 + 6 ? (
        <div style={{ position: "absolute", left: 960, top: 540, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 32, whiteSpace: "nowrap" }}>
          <div style={{ ...sans(size.title, 600), color: color.inkDim, opacity: progress(frame, t6 + 6, 14) }}>개인 요령</div>
          <svg width={120} height={24} style={{ flex: "none" }}>
            <line x1={0} y1={12} x2={104 * progress(frame, t6 + 16, 18, ease.inOut)} y2={12} stroke={color.agent} strokeWidth={stroke.bold} />
            <path d="M 104 4 L 118 12 L 104 20 Z" fill={color.agent} opacity={progress(frame, t6 + 32, 4)} />
          </svg>
          <div style={{ ...sans(size.display, 800), color: color.ink, opacity: progress(frame, t6 + 30, 16) }}>팀의 학습</div>
        </div>
      ) : null}
      <Txt x={960} y={700} at={t6 + 48} px={size.small} c={color.inkDim} align="center">
        SHIFT 05 · 문화
      </Txt>
    </ShiftSheet>
  );
};
