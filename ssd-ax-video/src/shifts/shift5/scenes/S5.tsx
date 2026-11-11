import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { color, mono, sans, size, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet, useScene } from "../../lib";
import { Box, PairFrame, Svg, Tag, Team, Txt, WeekHeader, teamDeskY, useAt, vis } from "./kit";

// s5 예제 ②: 3주 공유(안건 · playbook diff · 평가 세트) → 4주 지표 쌍으로 판단.

const TEAM = { x: 96, y: 540, cellW: 220, h: 300 };
const DESK_Y = teamDeskY(TEAM.y, 72);
const DOC = { x: 356, y: DESK_Y + 10, w: 140, h: 50 }; // 탁자 위의 F-007

const CARD = { x: 260, y: 216, w: 1400, h: 566 };
const LX = CARD.x + CARD.w / 4;
const RX = CARD.x + (CARD.w * 3) / 4;
const SPARK_DX = 200;
const yTime = (v: number): number => 580 + ((95 - v) / 55) * 120;
const yMiss = (v: number): number => 580 + ((9 - v) / 5) * 120;

const Spark: React.FC<{
  cx: number;
  pts: number[];
  ys: (v: number) => number;
  c: string;
  at: number;
  out?: number;
  redAt?: number;
  ringAt?: number;
  ringOut?: number;
}> = ({ cx, pts, ys, c, at, redAt, ringAt, ringOut }) => {
  const frame = useCurrentFrame();
  const xs = [cx - SPARK_DX, cx, cx + SPARK_DX];
  const labels = ["BASE", "WEEK 2", "WEEK 4"];
  const seg = [progress(frame, at + 8, 16, ease.inOut), progress(frame, at + 26, 16, ease.inOut)];
  const dot = [progress(frame, at, 10), progress(frame, at + 20, 10), progress(frame, at + 38, 10)];
  const red = redAt !== undefined;
  const ring = ringAt === undefined ? 0 : vis(frame, ringAt, ringOut, 12);
  return (
    <>
      <Svg>
        <line x1={xs[0] - 50} y1={720} x2={xs[2] + 50} y2={720} stroke={color.line} strokeWidth={stroke.hair} opacity={dot[0]} />
        {[0, 1].map((i) => (
          <line
            key={i}
            x1={xs[i]}
            y1={ys(pts[i])}
            x2={lerp(xs[i], xs[i + 1], seg[i])}
            y2={lerp(ys(pts[i]), ys(pts[i + 1]), seg[i])}
            stroke={c}
            strokeWidth={stroke.bold}
            opacity={seg[i] > 0 ? 1 : 0}
          />
        ))}
        {xs.map((x, i) => {
          const isRed = red && i === 1;
          return (
            <g key={i} opacity={dot[i]}>
              <line x1={x} y1={ys(pts[i]) + 12} x2={x} y2={720} stroke={color.line} strokeWidth={stroke.hair} strokeDasharray="3 6" />
              {i === 1 && ring > 0 ? <circle cx={x} cy={ys(pts[i])} r={22} fill="none" stroke={isRed ? color.problem : c} strokeWidth={stroke.thin} opacity={ring} /> : null}
              <circle cx={x} cy={ys(pts[i])} r={isRed ? 11 : 9} fill={isRed ? color.problem : color.bg} stroke={isRed ? color.problem : c} strokeWidth={stroke.trace} />
            </g>
          );
        })}
      </Svg>
      {xs.map((x, i) => {
        const isRed = red && i === 1;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x, top: ys(pts[i]) - 54, transform: "translateX(-50%)", ...mono(34, 700), color: isRed ? color.problem : color.ink, opacity: dot[i] }}>{pts[i]}</div>
            <div style={{ position: "absolute", left: x, top: 730, transform: "translateX(-50%)", ...mono(size.label, 700), color: isRed ? color.problem : color.inkDim, opacity: dot[i] }}>
              {labels[i]}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

const Big: React.FC<{ cx: number; from: string; to: string; c: string; at: number }> = ({ cx, from, to, c, at }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const a = progress(frame, at, 12);
  const b = progress(frame, at + 16, 14);
  return (
    <div style={{ position: "absolute", left: cx, top: 360, transform: "translateX(-50%)", display: "flex", alignItems: "baseline", gap: 22, whiteSpace: "nowrap" }}>
      <div style={{ ...sans(64, 700), color: color.inkSoft, opacity: a }}>{from}</div>
      <div style={{ ...sans(56, 700), color: c, opacity: b }}>→</div>
      <div style={{ ...sans(88, 800), color: c, opacity: b, translate: `${(1 - b) * -14}px 0px` }}>{to}</div>
    </div>
  );
};

export const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const at = useAt();
  const t1 = cue("s5.1");
  const t2 = cue("s5.2");
  const t3 = cue("s5.3");
  const t4 = cue("s5.4");
  const t5 = cue("s5.5");
  const t6 = cue("s5.6");
  const t7 = cue("s5.7");
  const out3 = t4 - 12; // 3주차 화면이 물러나는 프레임

  const leftDim = lerp(1, 0.4, progress(frame, t2 - 4, 16, ease.inOut)) * (1 - progress(frame, out3, 8));
  const docAt = at("s5.1", 0.5);
  const docP = progress(frame, docAt, 22, ease.inOut);
  const docO = vis(frame, docAt, out3, 10);
  const docX = lerp(520, DOC.x, docP);
  const docY = lerp(360, DOC.y, docP);

  // s5.3 로그 두 조각이 평가 세트로
  const flyAt = at("s5.3", 0.15);
  const landAt = at("s5.3", 0.55);
  const TARGET = { x: 838, y: 540 + 64 + 42 + 21 };

  // s5.6 ~ s5.7 저울
  const tilt = 2.5 * (progress(frame, t6 + 4, 20, ease.inOut) - progress(frame, t7, 22, ease.inOut));
  const holdAt = at("s5.6", 0.6);
  const hold = vis(frame, holdAt, t7 - 8, 12);
  const decide = progress(frame, at("s5.7", 0.35), 16);

  return (
    <ShiftSheet>
      <WeekHeader at={0} on={[-3, -2, -1, t4]} />

      {/* s5.1 주간 공유 안건, 한 탁자 */}
      <div style={{ opacity: leftDim }}>
        <CodePanel
          x={96}
          y={232}
          w={664}
          title="주간 AI 공유 (30분) (예시)"
          owner="human"
          px={30}
          at={t1}
          lines={[
            "1. 지표 쌍             5분",
            { text: "2. 이번 주 실패 기록     10분  F-007", mark: at("s5.1", 0.45), markTone: "human" },
            "3. playbook 변경 리뷰  10분",
            "4. 다음 주 실험 한 가지   5분",
          ]}
        />
        <Team {...TEAM} p={progress(frame, t1 + 6, 24, ease.inOut)} merge={1} icon={72} />
      </div>
      {/* 탁자 위로 올라오는 F-007 */}
      {docO > 0 ? (
        <>
          <Svg opacity={docO}>
            <Box x={docX} y={docY} w={DOC.w} h={DOC.h} p={1} c={color.human} fill={color.panel} />
          </Svg>
          <div style={{ position: "absolute", left: docX + DOC.w / 2, top: docY + 8, transform: "translateX(-50%)", ...mono(28, 700), color: color.ink, opacity: docO }}>F-007</div>
        </>
      ) : null}

      {/* s5.2 playbook diff */}
      <CodePanel
        x={800}
        y={232}
        w={1024}
        title="playbooks/regression-triage.md (예시)"
        owner="human"
        px={28}
        at={t2}
        out={out3}
        dimAt={t3 - 4}
        lines={[
          "  1. error signature로 1차 묶음",
          "  2. 묶음마다 대표 seed를 파형과 재실행",
          "  3. 원인 가설에 로그 줄과 파형 구간 첨부",
          { text: "+ 4. 문구가 같아도 첫 불일치 시점의", tone: "add", at: at("s5.2", 0.3), mark: at("s5.2", 0.3) },
          { text: "+    FSM 상태가 다르면 묶음을 나눈다 (F-007)", tone: "add", at: at("s5.2", 0.3) + 6, mark: at("s5.2", 0.3) + 6 },
        ]}
      />
      {/* 리뷰 승인 */}
      <div style={{ position: "absolute", left: 1824 - 220, top: 236, display: "flex", alignItems: "center", gap: 10, opacity: vis(frame, at("s5.2", 0.72), out3, 12) * lerp(1, 0.5, progress(frame, t3 - 4, 14)) }}>
        <CheckIcon size={34} color={color.human} width={stroke.bold} />
        <div style={{ ...mono(size.label, 700), color: color.human }}>REVIEWED</div>
      </div>

      {/* s5.3 평가 세트 */}
      <CodePanel
        x={800}
        y={540}
        w={1024}
        title="$ make eval-triage   (예시)"
        owner="agent"
        px={28}
        at={t3}
        out={out3}
        lines={[
          { text: "case-001 … case-022   pass 19 / fail 3", tone: "dim" },
          { text: "case-023 (F-007)      fail → pass", at: landAt, mark: landAt + 4 },
          { text: "묶음 정확도  19/23 → 21/23", at: at("s5.3", 0.8) },
        ]}
      />
      {(["A", "B"] as const).map((k, i) => {
        const p = progress(frame, flyAt + i * 6, landAt - flyAt, ease.inOut);
        if (p <= 0 || p >= 1) return null;
        const x = lerp(DOC.x + 40 + i * 60, TARGET.x + i * 50, p);
        const y = lerp(DOC.y + 25, TARGET.y, p) - 90 * Math.sin(Math.PI * p);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x - 22,
              top: y - 20,
              width: 44,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `${stroke.thin}px solid ${i ? color.inkSoft : color.problem}`,
              backgroundColor: color.panel,
              ...mono(26, 700),
              color: i ? color.inkSoft : color.problem,
            }}
          >
            {k}
          </div>
        );
      })}

      {/* s5.4 ~ s5.7 지표 쌍 카드 */}
      <PairFrame {...CARD} at={t4 + 4} tilt={tilt}>
        <Big cx={LX} from="95분" to="40분" c={color.agent} at={t5} />
        <Big cx={RX} from="6/41" to="4/38" c={color.human} at={at("s5.5", 0.5)} />
        {frame >= t5 ? <Spark cx={LX} pts={[95, 55, 40]} ys={yTime} c={color.agent} at={t5 + 20} ringAt={t6 + 4} ringOut={t7 - 8} /> : null}
        {frame >= at("s5.5", 0.5) ? (
          <Spark cx={RX} pts={[6, 9, 4]} ys={yMiss} c={color.human} at={at("s5.5", 0.5) + 20} redAt={0} ringAt={at("s5.6", 0.3)} ringOut={t7 - 8} />
        ) : null}
        {/* s5.6 붉은 2주차 점 위의 표식, 저울선의 "확대 보류" */}
        <Tag x={RX} y={yMiss(9) - 116} align="center" text="시간만 봤다면 성공 보고" c={color.problem} at={at("s5.6", 0.3)} />
        <Tag x={CARD.x + CARD.w / 2} y={556} align="center" text="확대 보류" c={color.problem} px={size.body} at={holdAt} out={t7 - 8} />
        <Svg opacity={hold}>
          <line x1={CARD.x + CARD.w / 2} y1={336} x2={CARD.x + CARD.w / 2} y2={556} stroke={color.problem} strokeWidth={stroke.thin} strokeDasharray="4 6" />
        </Svg>
      </PairFrame>

      {/* s5.7 결정 한 줄과 서명 */}
      <Svg opacity={decide}>
        <Box x={400} y={800} w={1120} h={72} p={decide} c={color.line} fill={withAlpha(color.panel, 0.92)} />
        <rect x={400} y={800} width={5} height={72 * decide} fill={color.human} />
      </Svg>
      <Txt x={430} y={813} at={at("s5.7", 0.35) + 4} px={size.body} weight={700}>
        결정: 인접 블록 하나로 확대. 중단 조건 유지.
      </Txt>
      <div style={{ position: "absolute", left: 1340, top: 812, display: "flex", alignItems: "center", gap: 8, opacity: progress(frame, at("s5.7", 0.7), 12) }}>
        <HumanIcon size={44} color={color.human} />
        <CheckIcon size={36} color={color.human} width={stroke.bold} />
        <div style={{ ...mono(size.label, 700), color: color.human }}>SIGN</div>
      </div>
    </ShiftSheet>
  );
};
