import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../../video/anim";
import { WarnIcon } from "../../../video/components/Icons";
import { DimLine } from "../../../video/components/Trace";
import { color, mono, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { At, Box, DocShape, Svg, Team, Txt, useAt, vis } from "./kit";

// s2 지금: 벽으로 나뉜 세 칸(개인 폴더, 재지 않는 시간, 사라지는 실패, 느낌) → 오른쪽 수치 패널.

const CELL_X = 96;
const CELL_W = 260;
const CELL_Y = 340;
const CELL_H = 410;
const cx = (i: number): number => CELL_X + CELL_W * (i + 0.5);

const PX = 980; // 수치 패널
const BAR_X = PX + 36;
const UNIT = 560 / 157; // % 당 px

const Bar: React.FC<{ y: number; label: string; value: number; c: string; at: number; dur: number }> = ({ y, label, value, c, at, dur }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, dur, ease.inOut);
  const w = value * UNIT * p;
  return (
    <>
      <Txt x={BAR_X} y={y} at={at - 2} px={size.small} weight={600} c={color.inkSoft}>
        {label}
      </Txt>
      <Svg>
        {p > 0 ? (
          <>
            <rect x={BAR_X} y={y + 50} width={w} height={40} fill={withAlpha(c, 0.28)} stroke={c} strokeWidth={stroke.thin} />
            <line x1={BAR_X} y1={y + 44} x2={BAR_X} y2={y + 96} stroke={color.inkSoft} strokeWidth={stroke.thin} />
          </>
        ) : null}
      </Svg>
      {p > 0 ? (
        <div style={{ position: "absolute", left: BAR_X + w + 18, top: y + 42, ...mono(size.sub, 700), color: c, opacity: Math.min(1, p * 3) }}>
          {`+${Math.round(value * p)}%`}
        </div>
      ) : null}
    </>
  );
};

export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const at = useAt();
  const t1 = cue("s2.1");
  const t2 = cue("s2.2");
  const t3 = cue("s2.3");
  const t4 = cue("s2.4");
  const t5 = cue("s2.5");
  const t6 = cue("s2.6");

  const leftDim = lerp(1, 0.32, progress(frame, t5 - 6, 16, ease.inOut));
  const file = progress(frame, t1 + 14, 16);
  const blink = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin((frame - t2) / 5));
  const warnOut = at("s2.3", 0.62);
  const warn = vis(frame, t3 + 4, warnOut, 10);
  const bubbleOut = at("s2.3", 0.78);
  const mist = progress(frame, t4 + 6, 30, ease.inOut);
  const coverOn = at("s2.6", 0.5);
  const cover = vis(frame, coverOn, coverOn + 44, 12);
  const panel = progress(frame, t5 - 4, 18);

  return (
    <ShiftSheet>
      <div style={{ position: "absolute", inset: 0, opacity: leftDim, translate: `${lerp(430, 0, progress(frame, t5 - 14, 24, ease.inOut))}px 0px` }}>
        <Team x={CELL_X} y={CELL_Y} cellW={CELL_W} h={CELL_H} p={progress(frame, 4, 26, ease.inOut)} />
        {/* s2.1 개인 폴더의 파일 하나 */}
        <Svg>
          <DocShape x={cx(0) - 36} y={CELL_Y + 250} w={72} h={92} c={color.human} p={file} o={file > 0 ? 1 : 0} fill={withAlpha(color.human, 0.1 * file)} />
          {[0, 1, 2].map((k) => (
            <line key={k} x1={cx(0) - 20} y1={CELL_Y + 286 + k * 16} x2={cx(0) - 20 + 40 * file} y2={CELL_Y + 286 + k * 16} stroke={color.human} strokeWidth={stroke.hair} opacity={file} />
          ))}
          <line x1={cx(0)} y1={CELL_Y + 342} x2={cx(0)} y2={CELL_Y + 342 + 84 * file} stroke={color.human} strokeWidth={stroke.hair} strokeDasharray="4 6" />
        </Svg>
        <Txt x={CELL_X} y={CELL_Y + CELL_H + 22} at={t1 + 22} px={28} font="mono" c={color.human}>
          ~/notes/prompt_log_요약.txt
        </Txt>

        {/* s2.2 재지 않는 시간 */}
        <Txt x={CELL_X} y={84} at={t2} px={size.small} weight={600} c={color.inkSoft}>
          야간 regression → 아침 triage
        </Txt>
        <Svg>
          <Box x={CELL_X} y={136} w={3 * CELL_W} h={22} p={progress(frame, t2 + 4, 22, ease.inOut)} c={color.inkSoft} />
          <DimLine from={[CELL_X, 184]} to={[CELL_X + 3 * CELL_W, 184]} p={progress(frame, t2 + 18, 18)} />
        </Svg>
        {frame >= t2 + 26 ? (
          <div
            style={{
              position: "absolute",
              left: cx(1),
              top: 160,
              transform: "translateX(-50%)",
              padding: "0 18px",
              backgroundColor: color.bg,
              ...mono(size.sub, 700),
              color: color.human,
              opacity: progress(frame, t2 + 26, 10) * blink,
            }}
          >
            ? 분
          </div>
        ) : null}

        {/* s2.3 잠깐 켜졌다 흔적 없이 꺼지는 경고와 말 한 줄 */}
        <At x={cx(1)} y={CELL_Y + 296} o={warn}>
          <WarnIcon size={76} color={color.problem} />
        </At>
        <Svg>
          <Box x={cx(1) - 300} y={262} w={600} h={58} p={1} c={color.problem} dash="6 6" o={vis(frame, at("s2.3", 0.2), bubbleOut) * 0.8} />
        </Svg>
        <Txt x={cx(1)} y={271} at={at("s2.3", 0.2)} out={bubbleOut} px={size.small} c={color.ink} align="center">
          어제 묶음이 잘못 지어져서 오전을 날렸어요
        </Txt>

        {/* s2.4 느낌만 남는다 */}
        {mist > 0 ? (
          <div
            style={{
              position: "absolute",
              left: cx(1),
              top: 244 - 6 * Math.sin((frame - t4) / 26),
              transform: "translateX(-50%)",
              fontFamily: "Pretendard",
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
              color: "transparent",
              WebkitTextStroke: `1.5px ${color.inkDim}`,
              opacity: 0.75 * mist,
            }}
          >
            빨라진 것 같다
          </div>
        ) : null}
      </div>

      {/* s2.5 ~ s2.6 수치 패널 */}
      <Svg>
        <Box x={PX} y={96} w={1824 - PX} h={704} p={panel} c={color.line} fill={withAlpha(color.panel, 0.9)} />
      </Svg>
      <div style={{ position: "absolute", left: BAR_X, top: 116, ...mono(size.label, 700), color: color.inkDim, opacity: panel }}>TELEMETRY</div>
      <Bar y={162} label="처리량" value={34} c={color.agent} at={at("s2.5", 0.3)} dur={22} />
      <Bar y={318} label="첫 리뷰 대기" value={157} c={color.problem} at={at("s2.5", 0.62)} dur={44} />
      <Bar y={474} label="버그" value={54} c={color.problem} at={t6 + 2} dur={24} />
      {/* 처리량만 남기고 가리는 덮개 */}
      <Svg>
        {cover > 0 ? (
          <g opacity={cover}>
            <defs>
              <pattern id="s2hatch" width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1={0} y1={0} x2={0} y2={16} stroke={color.lineStrong} strokeWidth={2} />
              </pattern>
            </defs>
            <rect x={PX + 14} y={306} width={1824 - PX - 28} height={318} fill={color.bg} opacity={0.94} />
            <rect x={PX + 14} y={306} width={1824 - PX - 28} height={318} fill="url(#s2hatch)" stroke={color.inkDim} strokeWidth={stroke.thin} strokeDasharray="10 8" />
            <rect x={PX + 14} y={152} width={1824 - PX - 28} height={142} fill="none" stroke={color.agent} strokeWidth={stroke.thin} />
          </g>
        ) : null}
        <line x1={BAR_X} y1={650} x2={BAR_X + (1824 - PX - 72) * progress(frame, t5 + 10, 20)} y2={650} stroke={color.line} strokeWidth={stroke.hair} />
      </Svg>
      <Txt x={BAR_X} y={672} at={t5 + 14} px={size.small} c={color.inkDim}>
        Faros AI, 2026-04, 개발자 22,000명 텔레메트리
      </Txt>
      <Txt x={BAR_X} y={718} at={t5 + 18} px={size.small} c={color.inkDim}>
        자사 발표 · 소프트웨어 조직
      </Txt>
    </ShiftSheet>
  );
};
