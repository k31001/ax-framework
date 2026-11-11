import React from "react";
import { DUR, ease, enter, progress } from "../../../video/anim";
import { CheckIcon } from "../../../video/components/Icons";
import { color, sans, size, stroke, withAlpha } from "../../../video/theme";
import { ShiftSheet } from "../../lib";
import { Group, Layer, NoLig, SceneHead, useT } from "./kit";

// s7 기술 요소와 실행 순서: 있는 것 / 없는 것, 그리고 네 단계.

const HAVE = [
  { text: "SystemRDL → RTL · header · register model · 문서", sub: "PeakRDL 등 오픈소스, 상용 툴", id: "s7.1" },
  { text: "Jira + R4J + Xray", sub: "요구사항 · 설계 기능 · 검증 항목 · 버그", id: "s7.2" },
];
const STEPS = [
  { text: "① 규약 목록", sub: "블록 하나, 과거 통합 bug가 난 규약부터" },
  { text: "② 계약 양식 · 검사기" },
  { text: "③ assertion · 테스트 생성" },
  { text: "④ Jira 이슈 · 링크로 확장" },
];
const LX = 96;
const LW = 844;
const RX = 1000;
const RW = 824;
const TY = 670;
const cx = (i: number): number => 312 + 432 * i;

export const S7: React.FC = () => {
  const { frame, t } = useT();
  const a3 = t("s7.3");
  const a4 = t("s7.4");
  const a5 = t("s7.5");
  const miss = progress(frame, a3, DUR.draw, ease.out);
  const build = progress(frame, a4, 18, ease.inOut);
  const nodeAt = [a5, t("s7.6"), t("s7.6", 0.5), t("s7.7")];
  // trace 의 머리: 노드가 켜질 때마다 그 노드까지 자란다
  let head = LX;
  nodeAt.forEach((at, i) => {
    const from = i === 0 ? LX : cx(i - 1);
    const p = progress(frame, at - 4, 20, ease.inOut);
    if (p > 0) head = Math.max(head, from + (cx(i) - from) * p);
  });
  const ci = progress(frame, t("s7.7", 0.5), DUR.enter, ease.out);
  return (
    <ShiftSheet>
      <NoLig>
      <SceneHead />

      <Group dimAt={a5} dimTo={0.45}>
        {/* 이미 있는 것 */}
        <div style={{ position: "absolute", left: LX, top: 184, display: "flex", alignItems: "center", gap: 12, ...enter(frame, t("s7.1")) }}>
          <CheckIcon size={30} color={color.agent} />
          <div style={{ ...sans(36, 800) }}>이미 있는 것</div>
        </div>
        {HAVE.map((h, i) => {
          const at = t(h.id) + (i === 0 ? 8 : 0);
          const p = progress(frame, at, DUR.draw, ease.out);
          return (
            <div key={h.id} style={{ position: "absolute", left: LX, top: 250 + i * 140, width: LW, height: 120, opacity: p, translate: `${(1 - p) * -12}px 0px` }}>
              <div style={{ position: "absolute", inset: 0, border: `${stroke.thin}px solid ${color.line}`, backgroundColor: withAlpha(color.panel, 0.92) }} />
              <div style={{ position: "absolute", left: 0, top: 0, width: 5, height: `${100 * p}%`, backgroundColor: color.agent }} />
              <div style={{ position: "absolute", left: 28, top: 16, ...sans(32, 700), whiteSpace: "nowrap" }}>{h.text}</div>
              <div style={{ position: "absolute", left: 28, top: 66, ...sans(size.small, 500), color: color.inkDim, whiteSpace: "nowrap" }}>{h.sub}</div>
            </div>
          );
        })}

        {/* 없는 것 → 직접 구축 */}
        <div style={{ position: "absolute", left: RX, top: 184, ...sans(36, 800), color: color.inkSoft, ...enter(frame, a3) }}>없는 것</div>
        <Layer>
          <rect x={RX} y={250} width={RW} height={260} fill={withAlpha(build > 0 ? color.agent : color.panel, build > 0 ? 0.08 * build : 0.6 * miss)} stroke={build > 0.5 ? color.agent : color.inkDim} strokeWidth={build > 0.5 ? stroke.trace : stroke.thin} strokeDasharray={build > 0.5 ? undefined : "10 8"} opacity={miss} />
          {build > 0 ? <rect x={RX} y={250} width={5} height={260 * build} fill={color.agent} /> : null}
        </Layer>
        <div style={{ position: "absolute", left: RX + 30, top: 290, ...sans(40, 700), color: build > 0.5 ? color.ink : color.inkSoft, whiteSpace: "nowrap", ...enter(frame, a3 + 6) }}>동작 규약의 표준 형식</div>
        <div style={{ position: "absolute", left: RX + 30, top: 366, ...sans(size.small, 500), color: color.inkDim, whiteSpace: "nowrap", opacity: progress(frame, t("s7.3", 0.4)) * (1 - build) }}>IP-XACT · SystemRDL은 register 중심</div>
        <div style={{ position: "absolute", left: RX + 30, top: 366, opacity: build }}>
          <div style={{ ...sans(32, 700), color: color.agent, whiteSpace: "nowrap" }}>직접 구축: YAML 계약 양식 + 검사기 + 생성기</div>
          <div style={{ ...sans(size.small, 500), color: color.inkSoft, whiteSpace: "nowrap", marginTop: 18, ...enter(frame, t("s7.4", 0.5)) }}>패턴 4종: interrupt · 접근 순서 · 초기화 순서 · errata</div>
        </div>
      </Group>

      {/* 실행 순서 */}
      <Layer>
        <line x1={LX} x2={LX + 1728} y1={TY} y2={TY} stroke={color.line} strokeWidth={stroke.hair} strokeDasharray="3 9" opacity={progress(frame, a5 - 4)} />
        {head > LX ? <line x1={LX} x2={head} y1={TY} y2={TY} stroke={color.agent} strokeWidth={stroke.trace} /> : null}
        {STEPS.map((_, i) => {
          const p = progress(frame, nodeAt[i] + 12, 12, ease.out);
          const pre = progress(frame, a5 - 4 + i * 3);
          return (
            <g key={i} opacity={pre}>
              <circle cx={cx(i)} cy={TY} r={13} fill={color.bg} stroke={p > 0 ? color.agent : color.lineStrong} strokeWidth={stroke.trace} />
              <circle cx={cx(i)} cy={TY} r={7 * p} fill={color.agent} />
            </g>
          );
        })}
        {/* CI 표지 */}
        <g opacity={ci}>
          <line x1={cx(2) + 40} x2={cx(3) - 40} y1={TY - 22} y2={TY - 22} stroke={color.inkSoft} strokeWidth={stroke.hair} />
          <line x1={cx(2) + 40} x2={cx(2) + 40} y1={TY - 30} y2={TY - 14} stroke={color.inkSoft} strokeWidth={stroke.hair} />
          <line x1={cx(3) - 40} x2={cx(3) - 40} y1={TY - 30} y2={TY - 14} stroke={color.inkSoft} strokeWidth={stroke.hair} />
        </g>
      </Layer>
      {STEPS.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: cx(i) - 205, width: 410, top: TY + 34, textAlign: "center", ...enter(frame, nodeAt[i] + 10) }}>
          <div style={{ ...sans(32, 700) }}>{s.text}</div>
          {s.sub ? <div style={{ ...sans(size.small, 500), color: color.inkSoft, marginTop: 10, ...enter(frame, t("s7.5", 0.5)) }}>{s.sub}</div> : null}
        </div>
      ))}
      <div style={{ position: "absolute", left: (cx(2) + cx(3)) / 2 - 170, width: 340, top: TY - 84, height: 50, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", border: `${stroke.thin}px solid ${color.inkSoft}`, backgroundColor: withAlpha(color.bg, 0.95), ...sans(size.small, 700), color: color.ink, whiteSpace: "nowrap", opacity: ci, translate: `0px ${(1 - ci) * 8}px` }}>
        CI: 계약 변경 = PR
      </div>
      </NoLig>
    </ShiftSheet>
  );
};
