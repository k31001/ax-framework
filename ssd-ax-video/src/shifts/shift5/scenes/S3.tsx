import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { CheckIcon, HumanIcon } from "../../../video/components/Icons";
import { color, mono, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet, useScene } from "../../lib";
import { At, Box, DocShape, KEEP, PairFrame, Svg, Tree, Txt, mix, slotHome, useAt, vis } from "./kit";
import type { Rect, TreeRow } from "./kit";

// s3 전환 후: 빈 틀 넷이 올라와 이름이 채워지고, "지표 쌍"과 "playbook"이 차례로 펼쳐진다.

const rowRect = (i: number): Rect => ({ x: 190 + i * 400, y: 260, w: 340, h: 300 });
const tabRect = (i: number): Rect => ({ x: 190 + i * 400, y: 92, w: 340, h: 96 });

const PAIRS: [string, string][] = [
  ["triage 시간", "오분류율"],
  ["스펙 변경→검증 완료", "bug escape"],
  ["리뷰 대기", "리뷰 없이 반영된 변경"],
];

const CARD = { x: 300, y: 250, w: 1320, h: 590 };

export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue } = useScene();
  const at = useAt();
  const t1 = cue("s3.1");
  const t3 = cue("s3.3");
  const t4 = cue("s3.4");

  const rise = progress(frame, 2, 26, ease.inOut);
  const toTab = progress(frame, t3 - 4, DUR.move, ease.inOut);
  const nameAt = [0, 0.24, 0.45, 0.7].map((fr) => at("s3.2", fr));
  const active = frame >= t4 - 4 ? 2 : frame >= t3 - 4 ? 1 : -1;
  const activeAt = active === 2 ? t4 - 4 : t3 - 4;

  // s3.4 개인 파일이 벽을 넘어 저장소로
  const fly = progress(frame, at("s3.4", 0.28), 34, ease.inOut);
  const FROM = { x: 300, y: 656 };
  const TO = { x: 800, y: 597 };
  const fx = lerp(FROM.x, TO.x, fly);
  const fy = lerp(FROM.y, TO.y, fly) - 300 * Math.sin(Math.PI * fly);
  const landed = at("s3.4", 0.28) + 30;
  const left = progress(frame, t4 + 2, 18);
  const treeRows: TreeRow[] = [
    { depth: 0, name: "ax-team-assets/", at: t4 + 6 },
    { depth: 1, name: "experiments/", at: t4 + 10, c: color.inkSoft },
    { depth: 1, name: "metrics/", at: t4 + 13, c: color.inkSoft },
    { depth: 1, name: "playbooks/", at: t4 + 16 },
    { depth: 2, name: "regression-triage.md", at: landed, c: color.agent },
    { depth: 1, name: "failures/", at: t4 + 19, c: color.inkSoft },
  ];

  return (
    <ShiftSheet>
      {/* 네 틀 */}
      <Svg>
        {KEEP.map((_, i) => {
          const r = mix(mix(slotHome(i), rowRect(i), rise), tabRect(i), toTab);
          const solid = progress(frame, t1 + 6 + i * 5, 20, ease.inOut);
          const on = i === active ? progress(frame, activeAt, 14) : 0;
          const off = active >= 0 && i !== active ? 0.55 : 1;
          return (
            <g key={i} opacity={off}>
              <DocShape {...r} c={color.inkDim} dash="10 8" o={1 - solid} />
              <DocShape {...r} c={on > 0 ? color.agent : color.inkSoft} p={solid} o={solid > 0 ? 1 : 0} fill={withAlpha(color.panel, 0.9 * solid)} width={on > 0 ? stroke.bold : stroke.thin} />
            </g>
          );
        })}
        {/* 펼쳐진 틀에서 내용으로 내려가는 선 */}
        {active >= 0 ? (
          <line
            x1={tabRect(active).x + 170}
            y1={188}
            x2={tabRect(active).x + 170}
            y2={188 + 62 * progress(frame, activeAt + 6, 12)}
            stroke={color.agent}
            strokeWidth={stroke.trace}
          />
        ) : null}
      </Svg>
      {KEEP.map((k, i) => {
        const r = mix(rowRect(i), tabRect(i), toTab);
        const off = active >= 0 && i !== active ? 0.55 : 1;
        return (
          <React.Fragment key={i}>
            <Txt x={r.x + r.w / 2} y={r.y + r.h / 2 - 28} at={nameAt[i]} px={size.sub} weight={800} align="center" o={off}>
              {k.name}
            </Txt>
            <Txt x={r.x + r.w / 2} y={r.y + r.h + 18} at={nameAt[i] + 8} out={t3 - 12} px={28} font="mono" c={color.inkDim} align="center">
              {k.path}
            </Txt>
          </React.Fragment>
        );
      })}

      {/* s3.3 지표 쌍 카드 */}
      <PairFrame {...CARD} at={t3 + 6} out={t4 - 12}>
        {PAIRS.map(([a, b], i) => {
          const rowAt = at("s3.3", 0.3 + i * 0.22);
          const y = CARD.y + 170 + i * 132;
          const p = vis(frame, rowAt + 4, t4 - 12, 14);
          const cxm = CARD.x + CARD.w / 2;
          return (
            <React.Fragment key={i}>
              <Txt x={cxm - 90} y={y} at={rowAt} px={size.body} weight={600} align="right">
                {a}
              </Txt>
              <Txt x={cxm + 90} y={y} at={rowAt + 6} px={size.body} weight={600}>
                {b}
              </Txt>
              <Svg opacity={p}>
                <line x1={cxm - 52 * p} y1={y + 23} x2={cxm + 52 * p} y2={y + 23} stroke={color.inkSoft} strokeWidth={stroke.thin} />
                <path d={`M ${cxm - 42} ${y + 14} L ${cxm - 54} ${y + 23} L ${cxm - 42} ${y + 32}`} fill="none" stroke={color.agent} strokeWidth={stroke.trace} />
                <path d={`M ${cxm + 42} ${y + 14} L ${cxm + 54} ${y + 23} L ${cxm + 42} ${y + 32}`} fill="none" stroke={color.human} strokeWidth={stroke.trace} />
                <line x1={CARD.x + 60} y1={y + 84} x2={CARD.x + CARD.w - 60} y2={y + 84} stroke={color.line} strokeWidth={stroke.hair} opacity={i < 2 ? 1 : 0} />
              </Svg>
            </React.Fragment>
          );
        })}
      </PairFrame>

      {/* s3.4 개인 파일 → 저장소 */}
      <Svg opacity={left}>
        <line x1={600} y1={800} x2={600} y2={800 - 520 * left} stroke={color.inkSoft} strokeWidth={stroke.thin} />
        <line x1={96} y1={800} x2={96 + 504 * left} y2={800} stroke={color.lineStrong} strokeWidth={stroke.thin} />
        <path d="M 216 600 V 556 H 384 V 600" fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} />
        <DocShape x={FROM.x - 36} y={FROM.y - 46} w={72} h={92} c={color.human} o={1 - 0.6 * fly} fill={withAlpha(color.human, 0.1)} />
        {/* 저장소 틀 */}
        <Box x={700} y={270} w={1010} h={470} p={left} c={color.line} fill={withAlpha(color.panel, 0.9)} />
        <rect x={700} y={270} width={5} height={470 * left} fill={color.agent} />
      </Svg>
      <At x={300} y={440} o={left}>
        <HumanIcon size={84} color={color.human} />
      </At>
      <Txt x={96} y={826} at={t4 + 10} px={28} font="mono" c={color.human}>
        ~/notes/prompt_log_요약.txt
      </Txt>
      <div style={{ position: "absolute", left: 1560, top: 286, ...mono(size.label, 700), color: color.inkDim, opacity: left }}>GIT REPO</div>
      <Tree x={750} y={300} rows={treeRows} rowH={66} px={32} />
      {/* 날아가는 파일 */}
      {fly > 0 && fly < 1 ? (
        <Svg>
          <DocShape x={fx - 30} y={fy - 38} w={60} h={76} c={color.human} fill={withAlpha(color.human, 0.16)} />
        </Svg>
      ) : null}
      {/* 리뷰 표식: 체크 둘 */}
      {[0, 1].map((k) => {
        const cAt = at("s3.4", 0.72 + k * 0.12);
        return (
          <At key={k} x={1310 + k * 62} y={300 + 66 * 4 + 33} o={progress(frame, cAt, 10)} scale={lerp(1.5, 1, progress(frame, cAt, 12))}>
            <CheckIcon size={44} color={color.human} width={stroke.bold} />
          </At>
        );
      })}
      {frame >= at("s3.4", 0.72) ? (
        <div style={{ position: "absolute", left: 1440, top: 300 + 66 * 4 + 20, ...mono(size.label, 700), color: color.human, opacity: progress(frame, at("s3.4", 0.72), 12) }}>REVIEW</div>
      ) : null}
    </ShiftSheet>
  );
};
