// S3 전환 선언. 영상에서 가장 큰 타이틀 장면.
// 도구 화면 소품(덧붙인 "+ AI" 조각이 달린 기존 창들)은 오른쪽 뒤로 흐려지고 글자가 주인공이 된다.

import { S3 as CONTENT } from "../../shared/content";
import { Badge } from "../components/Badge";
import { Canvas } from "../components/Canvas";
import { ArrowIcon } from "../components/Icons";
import { RegressionClusters, Waveform } from "../components/Props";
import { WindowPanel } from "../components/WindowPanel";
import { C, FRAME, KR, MONO_TXT, R, SHADOW, T } from "../theme";

const LEFT = 120;

// 계단: 세 단이 오른쪽으로 갈수록 높아진다.
const STEP_W = 544;
const STEP_GAP = 24;
const STEP_H = 108;
const STEP_TOPS = [828, 702, 576];
const STEP_BAND = [C.ink4, "#A29AF0", C.agent];
const STEP_TINT = ["rgba(23,32,58,0.07)", "rgba(85,70,224,0.10)", "rgba(85,70,224,0.17)"];

/** 기존 화면에 덧붙인 조각. */
const BoltOn: React.FC<{ left: number; top: number }> = ({ left, top }) => (
  <div
    style={{
      ...MONO_TXT,
      position: "absolute",
      left,
      top,
      height: 34,
      padding: "0 12px",
      display: "flex",
      alignItems: "center",
      borderRadius: R.sm,
      border: `2px dashed ${C.agent}`,
      backgroundColor: C.agentSoft,
      color: C.agentInk,
      fontSize: T.propSm,
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    + AI
  </div>
);

/** 기존 7단계 흐름의 흔적. */
const GhostPipeline: React.FC<{ width: number }> = ({ width }) => {
  const n = 7;
  const step = (width - 40) / (n - 1);
  return (
    <svg width={width} height={40} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={20} x2={width - 20} y1={20} y2={20} stroke={C.ink4} strokeWidth={3} />
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={20 + i * step} cy={20} r={9} fill={C.panel} stroke={C.ink4} strokeWidth={3} />
      ))}
    </svg>
  );
};

/** 뒤로 물러난 도구 화면들. */
const Backdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: FRAME.w,
      height: FRAME.h,
      opacity: 0.6,
      filter: "saturate(0.75) blur(0.8px)",
      WebkitMaskImage: "linear-gradient(to right, transparent 1250px, #000 1720px)",
      maskImage: "linear-gradient(to right, transparent 1250px, #000 1720px)",
    }}
  >
    <WindowPanel title="flow / current" style={{ left: 1404, top: 60, width: 600, height: 142 }} elevation="card">
      <div style={{ position: "absolute", left: 24, top: 32, right: 0 }}>
        <GhostPipeline width={640} />
      </div>
      <BoltOn left={104} top={60} />
      <BoltOn left={310} top={6} />
    </WindowPanel>
    <WindowPanel
      title="regression / nightly"
      accent={C.problem}
      style={{ left: 1548, top: 222, width: 460, height: 160 }}
      elevation="card"
    >
      <div style={{ position: "absolute", left: 12, top: 8 }}>
        <RegressionClusters width={400} height={100} labels={false} spacing={3} dot={1.9} />
      </div>
      <BoltOn left={196} top={74} />
    </WindowPanel>
    <WindowPanel title="wave / cluster 1" style={{ left: 1476, top: 402, width: 520, height: 132 }} elevation="card">
      <div style={{ position: "absolute", left: 20, top: 12 }}>
        <Waveform width={480} height={66} labels={false} hit={5} />
      </div>
    </WindowPanel>
  </div>
);

const Step: React.FC<{ index: number; label: string; now?: string; last: boolean }> = ({ index, label, now, last }) => {
  const x = LEFT + index * (STEP_W + STEP_GAP);
  const top = STEP_TOPS[index];
  return (
    <>
      {/* 단 아래의 기둥: 바닥으로 갈수록 옅어진다 */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: top + STEP_H / 2,
          width: STEP_W,
          height: FRAME.h - top,
          background: `linear-gradient(to bottom, ${STEP_TINT[index]} 0%, ${STEP_TINT[index]} 30%, rgba(243,245,249,0) 100%)`,
        }}
      />
      {/* 하이라이트: 계단을 따라 올라와 마지막 단에 멈춘다 */}
      {last ? (
        <div
          style={{
            position: "absolute",
            left: x - 9,
            top: top - 9,
            width: STEP_W + 18,
            height: STEP_H + 18,
            boxSizing: "border-box",
            borderRadius: R.lg + 9,
            border: `4px solid ${C.agent}`,
            opacity: 0.3,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top,
          width: STEP_W,
          height: STEP_H,
          boxSizing: "border-box",
          backgroundColor: C.panel,
          borderRadius: R.lg,
          border: `1px solid ${C.lineSoft}`,
          boxShadow: last ? SHADOW.raised : SHADOW.panel,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ alignSelf: "stretch", width: 10, backgroundColor: STEP_BAND[index], flexShrink: 0 }} />
        <span
          style={{
            ...MONO_TXT,
            fontSize: T.prop,
            fontWeight: 700,
            color: last ? C.agent : C.ink3,
            marginLeft: 24,
            marginRight: 16,
          }}
        >
          0{index + 1}
        </span>
        <span
          style={{
            ...KR,
            fontSize: T.lead,
            fontWeight: last ? 800 : 700,
            color: C.ink,
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {label}
        </span>
        {!last ? <ArrowIcon size={34} color={C.ink4} stroke={2.6} style={{ marginRight: 24 }} /> : null}
      </div>
      {/* "현재" 표시: 첫 단 위에 꽂힌 핀 */}
      {now ? (
        <div style={{ position: "absolute", left: x + 34, top: top - 64 }}>
          <Badge tone="dark" dot style={{ height: 48, padding: "0 18px 0 14px" }}>
            {now}
          </Badge>
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 40,
              width: 16,
              height: 16,
              rotate: "45deg",
              backgroundColor: C.ink,
              borderBottomRightRadius: 3,
            }}
          />
        </div>
      ) : null}
    </>
  );
};

export const S3: React.FC = () => {
  // 핵심 문구의 마지막 낱말("재설계")만 짙은 글자로, 앞부분("AI 중심")은 강조색으로.
  const words = CONTENT.headline.split(" ");
  const tail = words[words.length - 1];
  const head = words.slice(0, -1).join(" ");
  return (
    <Canvas>
      <Backdrop />

      <div
        style={{
          ...KR,
          position: "absolute",
          left: LEFT + 6,
          top: 176,
          fontSize: T.lead,
          lineHeight: "60px",
          fontWeight: 600,
          color: C.ink3,
          whiteSpace: "nowrap",
        }}
      >
        {CONTENT.lead}
      </div>
      <div
        style={{
          ...KR,
          position: "absolute",
          left: LEFT - 6,
          top: 236,
          fontSize: T.hero,
          lineHeight: `${Math.round(T.hero * 1.12)}px`,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          color: C.ink,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: C.agent }}>{head}</span> {tail}
      </div>

      {CONTENT.ladder.map((label, i) => (
        <Step
          key={label}
          index={i}
          label={label}
          now={i === 0 ? CONTENT.nowLabel : undefined}
          last={i === CONTENT.ladder.length - 1}
        />
      ))}
    </Canvas>
  );
};
