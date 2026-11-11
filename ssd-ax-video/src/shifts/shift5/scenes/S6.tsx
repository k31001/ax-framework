import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, lerp, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import { color, mono, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { Box, Svg, Tag, Tree, Txt, useAt } from "./kit";
import type { TreeRow } from "./kit";

// s6 기술 요소(위)와 실행 순서(아래).

const DB = { x: 96, y: 150, w: 300, h: 80 };
const TK = { x: 96, y: 330, w: 300, h: 80 };
const MC = { x: 500, y: 190, w: 320, h: 190 };
const REPO = { x: 870, y: 104, w: 560, h: 362 };
const FORM = { x: 1470, y: 104, w: 354, h: 170 };
const AGENDA = { x: 1470, y: 296, w: 354, h: 170 };

const STEPS = [
  { text: "기준선", x: 96, w: 250 },
  { text: "작은 실험", x: 396, w: 290 },
  { text: "주간 공유", x: 736, w: 290 },
  { text: "확대 · 중단 판단", x: 1076, w: 390 },
];
const STEP_Y = 650;
const STEP_H = 92;
const LAST = { x: 1516, w: 308 };

export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const at = useAt();
  const t1 = cue("s6.1");
  const t2 = cue("s6.2");
  const t3 = cue("s6.3");
  const t5 = cue("s6.5");

  const topDim = lerp(1, 0.4, progress(frame, t5 - 4, 16, ease.inOut));
  const outline = (i: number): number => progress(frame, t1 + 6 + i * 8, 18);
  const dbOn = progress(frame, t2, 14);
  const tkOn = progress(frame, at("s6.2", 0.3), 14);
  const join = at("s6.2", 0.6);
  const mcOn = progress(frame, at("s6.2", 0.72), 14);
  const repoOn = progress(frame, t3, 16);
  const formAt = at("s6.4", 0.12);
  const agendaAt = at("s6.4", 0.55);
  const stepAt = [0.1, 0.32, 0.52, 0.68].map((fr) => at("s6.5", fr));
  const backAt = at("s6.5", 0.85);
  const back = progress(frame, backAt, 30, ease.inOut);

  const rows: TreeRow[] = [
    { depth: 0, name: "ax-team-assets/   (예시)", at: t3 + 4 },
    { depth: 1, name: "experiments/", desc: "실험 카드", at: t3 + 12, c: color.inkSoft },
    { depth: 1, name: "metrics/", desc: "기준선 · 지표 쌍", at: t3 + 17, c: color.inkSoft },
    { depth: 1, name: "playbooks/", desc: "에이전트 작업 순서", at: t3 + 22, c: color.agent, descC: color.ink },
    { depth: 1, name: "failures/", desc: "실패 기록", at: t3 + 27, c: color.inkSoft },
    { depth: 1, name: "evals/", desc: "평가 세트", at: t3 + 32, c: color.agent, descC: color.ink },
  ];

  const mini = (r: { x: number; y: number; w: number; h: number }, startAt: number, n: number, c: string): React.ReactNode => {
    const p = progress(frame, startAt, 16);
    return (
      <g>
        <Box {...r} p={p} c={color.line} fill={withAlpha(color.panel, 0.9)} />
        <rect x={r.x} y={r.y} width={5} height={r.h * p} fill={c} />
        {Array.from({ length: n }).map((_, i) => (
          <line
            key={i}
            x1={r.x + 26}
            y1={r.y + 74 + i * (n > 3 ? 22 : 28)}
            x2={r.x + 26 + [250, 180, 220, 150][i % 4] * progress(frame, startAt + 6 + i * 3, 12)}
            y2={r.y + 74 + i * (n > 3 ? 22 : 28)}
            stroke={color.lineStrong}
            strokeWidth={stroke.bold}
          />
        ))}
      </g>
    );
  };

  return (
    <ShiftSheet>
      <div style={{ opacity: topDim }}>
        <Svg>
          {/* s6.1 소박한 블록 넷의 윤곽 */}
          <Box {...DB} p={outline(0)} c={dbOn > 0 ? color.inkSoft : color.lineStrong} fill={withAlpha(color.panel, 0.9)} />
          <Box {...TK} p={outline(1)} c={tkOn > 0 ? color.inkSoft : color.lineStrong} fill={withAlpha(color.panel, 0.9)} />
          <Box {...MC} p={outline(2)} c={mcOn > 0 ? color.inkSoft : color.lineStrong} fill={withAlpha(color.panel, 0.9)} />
          <Box {...REPO} p={outline(3)} c={repoOn > 0 ? color.line : color.lineStrong} fill={withAlpha(color.panel, 0.9)} />
          <rect x={MC.x} y={MC.y} width={5} height={(MC.h / 2) * mcOn} fill={color.agent} />
          <rect x={MC.x} y={MC.y + MC.h / 2} width={5} height={(MC.h / 2) * mcOn} fill={color.human} />
          <rect x={REPO.x} y={REPO.y} width={5} height={REPO.h * repoOn} fill={color.agent} />
          {/* s6.2 두 원천에서 지표 카드로 */}
          <Trace pts={[[DB.x + DB.w, DB.y + 40], [448, DB.y + 40], [448, 280], [MC.x, 280]]} at={join} duration={22} stroke={color.agent} arrow />
          <Trace pts={[[TK.x + TK.w, TK.y + 40], [448, TK.y + 40], [448, 280]]} at={join} duration={18} stroke={color.agent} />
          <line x1={REPO.x + 300} y1={REPO.y + REPO.h} x2={REPO.x + 300} y2={490} stroke={color.inkSoft} strokeWidth={stroke.thin} strokeDasharray="4 5" opacity={progress(frame, at("s6.3", 0.62), 12)} />
          {/* s6.4 실패 기록 양식, 30분 안건 */}
          {mini(FORM, formAt, 3, color.human)}
          {mini(AGENDA, agendaAt, 4, color.human)}
        </Svg>
        <Txt x={DB.x + DB.w / 2} y={DB.y + 20} at={t2} px={size.small} weight={700} align="center">
          Jira 변경 이력
        </Txt>
        <Txt x={TK.x + TK.w / 2} y={TK.y + 20} at={at("s6.2", 0.3)} px={size.small} weight={700} align="center">
          Xray 실행 결과
        </Txt>
        <div style={{ position: "absolute", left: DB.x, top: DB.y - 30, ...mono(size.label, 700), color: color.inkDim, opacity: dbOn }}>JIRA</div>
        <div style={{ position: "absolute", left: TK.x, top: TK.y - 30, ...mono(size.label, 700), color: color.inkDim, opacity: tkOn }}>XRAY</div>
        <div style={{ position: "absolute", left: MC.x + 30, top: MC.y + 146, ...mono(size.label, 700), color: color.agent, opacity: progress(frame, at("s6.2", 0.72) + 10, 14) }}>FILTER ai-authored</div>
        <Txt x={96} y={254} at={join + 6} px={size.small} c={color.agent}>
          스크립트로 자동 추출
        </Txt>
        <Txt x={MC.x + 30} y={MC.y + 22} at={at("s6.2", 0.72)} px={size.body} weight={800}>
          지표 카드
        </Txt>
        <Txt x={MC.x + 30} y={MC.y + 92} at={at("s6.2", 0.72) + 6} px={size.small} c={color.inkSoft}>
          팀 · 워크플로 단위
        </Txt>
        <Tree x={REPO.x + 30} y={REPO.y + 12} rows={rows} rowH={56} px={28} descX={290} />
        <Txt x={FORM.x + 26} y={FORM.y + 18} at={formAt + 4} px={28} font="mono" weight={700} c={color.ink}>
          failures/F-007.yaml
        </Txt>
        <Txt x={AGENDA.x + 26} y={AGENDA.y + 16} at={agendaAt + 4} px={size.small} weight={700}>
          주간 AI 공유 (30분)
        </Txt>
        {/* 성숙도 꼬리표 */}
        <Tag x={MC.x} y={MC.y + MC.h + 24} text="직접 구축" c={color.human} at={at("s6.2", 0.85)} />
        <Tag x={REPO.x} y={490} text="기존 형상관리" c={color.inkSoft} at={at("s6.3", 0.8)} />
        <Tag x={REPO.x + 250} y={490} text="Jira: 링크와 논의" c={color.ink} at={at("s6.3", 0.62)} />
        <Tag x={FORM.x} y={490} text="도구 불필요" c={color.inkSoft} at={at("s6.4", 0.85)} />
      </div>

      {/* s6.5 실행 순서 */}
      <Svg>
        <line x1={96} y1={590} x2={96 + 1728 * progress(frame, t1 + 30, 24, ease.inOut)} y2={590} stroke={color.line} strokeWidth={stroke.hair} />
        {STEPS.map((s, i) => {
          const p = progress(frame, stepAt[i], 16);
          return (
            <g key={i}>
              <Box x={s.x} y={STEP_Y} w={s.w} h={STEP_H} p={1} c={color.lineStrong} dash="8 8" o={progress(frame, t1 + 40 + i * 6, 16) * 0.55 * (1 - p)} />
              <Box x={s.x} y={STEP_Y} w={s.w} h={STEP_H} p={p} c={color.line} fill={withAlpha(color.panel, 0.92)} />
              <rect x={s.x} y={STEP_Y} width={5} height={STEP_H * p} fill={color.agent} />
              <circle cx={s.x + 46} cy={STEP_Y + STEP_H / 2} r={20} fill="none" stroke={color.agent} strokeWidth={stroke.thin} opacity={p} />
              {i > 0 ? (
                <Trace pts={[[STEPS[i - 1].x + STEPS[i - 1].w, STEP_Y + STEP_H / 2], [s.x, STEP_Y + STEP_H / 2]]} at={stepAt[i] - 8} duration={12} stroke={color.inkSoft} arrow />
              ) : null}
            </g>
          );
        })}
        {/* ④ → ① 다음 워크플로 */}
        <Trace
          pts={[[STEPS[3].x + STEPS[3].w / 2, STEP_Y + STEP_H], [STEPS[3].x + STEPS[3].w / 2, 800], [STEPS[0].x + STEPS[0].w / 2, 800], [STEPS[0].x + STEPS[0].w / 2, STEP_Y + STEP_H + 4]]}
          progress={back}
          stroke={color.agent}
          dash="10 8"
          arrow
        />
        {/* 흐린 다섯째 칸 */}
        <Box x={LAST.x} y={STEP_Y} w={LAST.w} h={STEP_H} p={1} c={color.lineStrong} dash="8 8" o={progress(frame, backAt + 14, 16) * 0.8} />
        <line x1={STEPS[3].x + STEPS[3].w} y1={STEP_Y + STEP_H / 2} x2={LAST.x} y2={STEP_Y + STEP_H / 2} stroke={color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="4 6" opacity={progress(frame, backAt + 14, 16)} />
      </Svg>
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ position: "absolute", left: s.x + 46, top: STEP_Y + STEP_H / 2 - 15, transform: "translateX(-50%)", ...mono(24, 700), color: color.agent, opacity: progress(frame, stepAt[i], 14) }}>{i + 1}</div>
          <Txt x={s.x + 80} y={STEP_Y + 22} at={stepAt[i] + 3} px={size.body} weight={700}>
            {s.text}
          </Txt>
        </React.Fragment>
      ))}
      <Txt x={640} y={812} at={backAt + 8} px={size.small} c={color.agent}>
        다음 워크플로
      </Txt>
      <Txt x={LAST.x + LAST.w / 2} y={STEP_Y + 22} at={backAt + 16} px={size.body} weight={600} c={color.inkDim} align="center">
        평가 · 육성 반영
      </Txt>
    </ShiftSheet>
  );
};
