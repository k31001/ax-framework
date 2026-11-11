import React from "react";
import { DUR, ease, enter, lerp, progress } from "../../../video/anim";
import { Trace, Via } from "../../../video/components/Trace";
import { color, mono, size, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { Box, Group, Layer, NoLig, SceneHead, Status, codeLineY, useT } from "./kit";

// s6 그 밖의 산출물: 요구사항은 Jira 이슈 + git 기준, 추적 사슬은 Jira 링크, bug 는 실패한 Test 의 defect.
// 원본은 git, 링크와 상태는 Jira.

const PX = 26;
const REQ = { x: 96, y: 180, w: 640 };
const GIT = { x: 96, y: 440, w: 640 };
const ROW = codeLineY(REQ.y, 0, PX) + 19;
const FEAT = { x: 1100, y: ROW - 35, w: 440, h: 70 };
const VER = { x: 1320, w: 504, h: 56 };
const VY = [344, 416, 520];
const STEM = 1150;
const R4J = { x: 900, y: 580, w: 924, h: 252 };
const BUG = { x: 1064, y: 620, w: 760 };

const REQ_ISSUE = ["REQ-207  요구사항        상태: 승인", "수명 말기 read 지연 보장", "요구사항 ID: REQ-QOS-07", "수용 기준: REQ-QOS-07.yaml (git)"];
const REQ_YAML = [
  "id: REQ-QOS-07",
  "jira: REQ-207",
  "acceptance:",
  "  - id: AC-1",
  "    metric: P99.99 read latency",
  '    limit: "<= 2 ms"   # 예시',
  "    judged_at: [구조 모델, emulation,",
  "                제품 테스트]",
];
const BUG_LINES = [
  "signature: cmd_timeout / rcv_ctrl / 완료 병합",
  "repro: tests/rcv/two_done_b2b (sim)",
  "root_cause: 완료 2건이 한 비트에 겹침",
  "contract: HSI-RCV-012 (on_overlap 미정의)",
  "fix: [contract v2, rdl, rtl, fw]",
];
const COVERAGE: { a: string; b: string; c: string; bad?: "b" | "c" | "a" }[] = [
  { a: "REQ-207 read 지연 보장", b: "FEAT-341 완료 전달", c: "3" },
  { a: "", b: "FEAT-352 soft 경로", c: "없음", bad: "c" },
  { a: "REQ-231 방치 후 지연", b: "없음 (제안)", c: "", bad: "b" },
  { a: "연결 없음 2건", b: "", c: "", bad: "a" },
];

type IconKind = "table" | "doc" | "bug";
const OldIcon: React.FC<{ kind: IconKind; x0: number; to: [number, number]; at: number; moveAt: number; goneAt: number }> = ({ kind, x0, to, at, moveAt, goneAt }) => {
  const { frame } = useT();
  const a = progress(frame, at);
  const m = progress(frame, moveAt, 26, ease.inOut);
  const g = progress(frame, goneAt, 10, ease.in);
  const op = a * lerp(0.75, 0.4, m) * (1 - g);
  if (op <= 0) return null;
  const s = 180;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{ position: "absolute", left: lerp(x0, to[0], m) - s / 2, top: lerp(330, to[1], m) - s / 2, opacity: op, scale: `${lerp(1, 0.5, m)}` }}>
      <g fill="none" stroke={color.inkDim} strokeWidth={2.4}>
        {kind === "table" ? (
          <>
            <rect x={8} y={18} width={84} height={64} />
            <path d="M 8 34 H 92 M 8 50 H 92 M 8 66 H 92 M 36 18 V 82 M 64 18 V 82" />
          </>
        ) : kind === "doc" ? (
          <>
            <path d="M 20 8 H 66 L 80 22 V 92 H 20 Z M 66 8 V 22 H 80" />
            <path d="M 32 38 H 68 M 32 52 H 68 M 32 66 H 56" />
          </>
        ) : (
          <>
            <path d="M 10 14 H 90 V 72 H 44 L 28 90 V 72 H 10 Z" />
            <path d="M 22 32 q 7 -9 14 0 t 14 0 t 14 0 t 14 0 M 22 52 q 7 -9 14 0 t 14 0 t 14 0" />
          </>
        )}
      </g>
    </svg>
  );
};

/** 'GIT', 'JIRA' 표지 */
const Tag: React.FC<{ text: string; right: number; top: number; at: number; tone: string }> = ({ text, right, top, at, tone }) => {
  const { frame } = useT();
  const p = progress(frame, at, DUR.enter, ease.out);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", right: 1920 - right, top, height: 32, padding: "0 12px", display: "flex", alignItems: "center", backgroundColor: tone, ...mono(size.label, 700), color: color.bg, opacity: p, scale: `${1.25 - 0.25 * p}` }}>
      {text}
    </div>
  );
};

export const S6: React.FC = () => {
  const { frame, t } = useT();
  const a1 = t("s6.1");
  const a2 = t("s6.2");
  const a4 = t("s6.4");
  const a5 = t("s6.5");
  const a6 = t("s6.6");
  const k = [t("s6.3"), t("s6.3", 0.25), t("s6.3", 0.5), t("s6.3", 0.62), t("s6.3", 0.82)];
  const moveAt = t("s6.1", 0.45);
  const gitAt = t("s6.2", 0.5);
  const bugAt = t("s6.4", 0.32);
  const jiraAt = t("s6.6", 0.45);
  const cov = progress(frame, a5, DUR.draw, ease.out) * (1 - progress(frame, a4 - 6, DUR.exit, ease.in));
  const gitBox = progress(frame, a6, DUR.draw, ease.out);
  const jiraBox = progress(frame, jiraAt, DUR.draw, ease.out);
  const label = (text: string, x: number, y: number, at: number, c: string = color.inkDim) => (
    <div style={{ position: "absolute", left: x, top: y, ...mono(PX, 500), letterSpacing: "0", color: c, ...enter(frame, at, { distance: 0 }) }}>{text}</div>
  );
  const ver = (i: number, text: string, at: number, bad?: boolean) => (
    <Box x={VER.x} y={VY[i]} w={VER.w} h={VER.h} at={at} text={text} tone={bad ? "problem" : "agent"} px={PX} mono />
  );
  return (
    <ShiftSheet>
      <NoLig>
        <SceneHead />

        {/* [s6.1] 지금의 산출물: 엑셀 표, 문서, 자유 서술 bug report */}
        <OldIcon kind="table" x0={560} to={[1240, 700]} at={a1} moveAt={moveAt} goneAt={a5} />
        <OldIcon kind="doc" x0={960} to={[FEAT.x + FEAT.w / 2, ROW]} at={a1 + 5} moveAt={moveAt + 4} goneAt={k[1]} />
        <OldIcon kind="bug" x0={1360} to={[1620, 700]} at={a1 + 10} moveAt={moveAt + 8} goneAt={a5} />

        {/* [s6.2] 요구사항: Jira 이슈 + git 의 수용 기준 */}
        <CodePanel x={REQ.x} y={REQ.y} w={REQ.w} title="JIRA · REQ-207" px={PX} owner="human" at={a2} lines={[REQ_ISSUE[0], REQ_ISSUE[1], REQ_ISSUE[2], { text: REQ_ISSUE[3], mark: gitAt, unmark: k[0] }]} />
        <Layer>
          <Trace pts={[[REQ.x + 120, REQ.y + 236], [REQ.x + 120, GIT.y]]} stroke={color.inkSoft} at={gitAt} arrow />
        </Layer>
        <CodePanel
          x={GIT.x}
          y={GIT.y}
          w={GIT.w}
          title="REQ-QOS-07.yaml"
          px={PX}
          owner="human"
          at={gitAt + 6}
          lines={REQ_YAML.map((text, i) => (i === 1 ? { text, tone: "dim" as const } : i >= 2 ? { text, mark: t("s6.2", 0.62), unmark: k[0] } : text))}
        />

        {/* [s6.3] 추적 사슬: is implemented by → tested by */}
        <Layer>
          <Trace pts={[[REQ.x + REQ.w, ROW], [FEAT.x, ROW]]} stroke={color.agent} at={k[0]} duration={22} arrow />
          <Trace pts={[[STEM, FEAT.y + FEAT.h], [STEM, VY[0] + VER.h / 2], [VER.x, VY[0] + VER.h / 2]]} stroke={color.agent} at={k[2] - 10} arrow />
          <Trace pts={[[STEM, VY[0] + VER.h / 2], [STEM, VY[1] + VER.h / 2], [VER.x, VY[1] + VER.h / 2]]} stroke={color.agent} at={k[3] - 10} arrow />
          <Via x={STEM} y={VY[0] + VER.h / 2} stroke={color.agent} p={progress(frame, k[3] - 8)} />
          {/* [s6.4] 요구사항에 직접 걸린 Test 가 실패했고, 거기에 defect 가 붙는다 */}
          <Trace pts={[[REQ.x + REQ.w, ROW + 78], [790, ROW + 78], [790, VY[2] + VER.h / 2], [VER.x, VY[2] + VER.h / 2]]} stroke={color.problem} at={a4} duration={22} arrow />
          <Trace pts={[[1572, VY[2] + VER.h], [1572, BUG.y]]} stroke={color.problem} at={bugAt - 8} arrow />
          {/* [s6.6] 원본은 git, 링크와 상태는 Jira */}
          {gitBox > 0 ? <rect x={GIT.x - 8} y={GIT.y - 8} width={GIT.w + 16} height={(392 + 16) * gitBox} fill="none" stroke={color.ink} strokeWidth={stroke.bold} /> : null}
          {jiraBox > 0 ? (
            <>
              <rect x={REQ.x - 8} y={REQ.y - 8} width={REQ.w + 16} height={(236 + 16) * jiraBox} fill="none" stroke={color.inkSoft} strokeWidth={stroke.trace} strokeDasharray="12 8" />
              <rect x={1056} y={FEAT.y - 12} width={776} height={(BUG.y + 275 + 4 - FEAT.y + 12) * jiraBox} fill="none" stroke={color.inkSoft} strokeWidth={stroke.trace} strokeDasharray="12 8" />
            </>
          ) : null}
        </Layer>
        {label("is implemented by", REQ.x + REQ.w + 40, ROW - 42, k[0] + 6)}
        {label("tested by", STEM + 18, VY[0] + VER.h / 2 - 40, k[2] - 6)}
        <Box x={FEAT.x} y={FEAT.y} w={FEAT.w} h={FEAT.h} at={k[1]} text="FEAT-341 · HSI-RCV-012" tone="human" px={28} mono align="center" />
        {ver(0, "VER-512 a_no_drop", k[2])}
        {ver(1, "VER-513 two_done_b2b", k[3])}
        <Status x={VER.x + VER.w - 8} y={VY[0] + 6} right text="PASS" at={k[4]} />
        <Status x={VER.x + VER.w - 8} y={VY[1] + 6} right text="PASS" at={k[4] + 5} />
        <div style={{ position: "absolute", right: 96, top: VY[1] + VER.h + 8, ...mono(size.label, 700), color: color.agent, ...enter(frame, k[4] + 8, { distance: 0 }) }}>XRAY · VER-604</div>

        {/* [s6.5] 엑셀 추적표 자리에 R4J Coverage View */}
        {cov > 0 ? (
          <div style={{ position: "absolute", left: R4J.x, top: R4J.y, width: R4J.w, height: R4J.h, opacity: cov }}>
            <div style={{ position: "absolute", inset: 0, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.line}`, backgroundColor: withAlpha(color.panel, 0.92) }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: 5, height: "100%", backgroundColor: color.lineStrong }} />
            <div style={{ position: "absolute", left: 24, top: 0, height: 44, display: "flex", alignItems: "center", ...mono(size.label, 700), color: color.inkSoft }}>R4J · Coverage View</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 44, borderTop: `${stroke.hair}px solid ${color.line}` }} />
            {COVERAGE.map((r, i) => {
              const at = t("s6.5", 0.12 + i * 0.1);
              const hot = r.bad ? progress(frame, t("s6.5", 0.55) + i * 5, 12, ease.out) : 0;
              const cell = (text: string, left: number, bad: boolean) => (
                <div style={{ position: "absolute", left, top: 0, lineHeight: "44px", ...mono(PX, bad ? 700 : 500), letterSpacing: "0", color: bad && hot > 0.5 ? color.problem : color.ink }}>{text}</div>
              );
              return (
                <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 60 + i * 44, height: 44, ...enter(frame, at, { distance: 6 }) }}>
                  {hot > 0 ? <div style={{ position: "absolute", left: 6, right: 2, top: 2, bottom: 2, backgroundColor: withAlpha(color.problem, 0.16 * hot), borderLeft: `3px solid ${color.problem}` }} /> : null}
                  {cell(r.a, 24, r.bad === "a")}
                  {cell(r.b, 420, r.bad === "b")}
                  {cell(r.c, 780, r.bad === "c")}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* [s6.4] 실패한 Test 에 붙은 bug 이슈 */}
        {label("tested by", 806, VY[2] + VER.h / 2 - 40, a4 + 8)}
        {ver(2, "VER-530 혼합 부하 P99.99", a4 + 14, true)}
        <Status x={VER.x + VER.w - 8} y={VY[2] + 6} right text="FAIL" tone="problem" at={a4 + 22} />
        {label("defect", 1590, VY[2] + VER.h + 6, bugAt - 4, color.problem)}
        <CodePanel
          x={BUG.x}
          y={BUG.y}
          w={BUG.w}
          title="JIRA · BUG-2291 · 수정 중"
          px={PX}
          owner="human"
          at={bugAt}
          lines={BUG_LINES.map((text, i) =>
            i === 2 ? { text, mark: t("s6.4", 0.56) } : i === 4 ? { text, mark: t("s6.4", 0.7) } : i === 3 ? { text, mark: t("s6.4", 0.85), markTone: "problem" as const } : text,
          )}
        />

        <Group>
          <Tag text="GIT" right={GIT.x + GIT.w - 10} top={GIT.y + 6} at={a6 + 6} tone={color.ink} />
          <Tag text="JIRA" right={REQ.x + REQ.w - 10} top={REQ.y + 6} at={jiraAt + 6} tone={color.inkSoft} />
          <Tag text="JIRA" right={1824} top={FEAT.y - 50} at={jiraAt + 6} tone={color.inkSoft} />
        </Group>
      </NoLig>
    </ShiftSheet>
  );
};
