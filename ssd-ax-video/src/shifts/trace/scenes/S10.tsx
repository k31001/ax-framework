import React from "react";
import { useCurrentFrame } from "remotion";
import { DUR, ease, lerp, progress } from "../../../video/anim";
import { Trace } from "../../../video/components/Trace";
import { color, fullSvg, mono, sans, stroke, withAlpha } from "../../../video/theme";
import { CodePanel, ShiftSheet } from "../../lib";
import { Box, Cyl, T, Table, useCues } from "./kitB";

// s10 그래프 DB 선택.
// 왼쪽: 원통(그래프 DB · Neo4j 기본안) → 엣지 하나의 확대(속성 그래프) → Cypher 한 줄.
// 오른쪽: 규모 표 → 판 비교 → 사내 MCP 서버를 거치는 조회.
// 끝: 원통이 작아지고 '스키마'와 '추출 파이프라인'이 커진다.

// 원통 안의 그래프 축소판 (0~1 좌표)
const DOTS: [number, number, string][] = [
  [0.5, 0.1, color.human],
  [0.5, 0.34, color.human],
  [0.5, 0.6, color.agent],
  [0.2, 0.76, color.agent],
  [0.34, 0.92, color.agent],
  [0.74, 0.74, color.agent],
  [0.84, 0.9, color.agent],
  [0.1, 0.2, color.ink],
  [0.1, 0.44, color.ink],
];
const LINKS: [number, number, string][] = [
  [1, 0, color.human],
  [2, 1, color.human],
  [3, 1, color.human],
  [4, 1, color.human],
  [3, 2, color.agent],
  [5, 2, color.agent],
  [6, 2, color.agent],
  [7, 0, color.agent],
  [8, 1, color.agent],
  [8, 7, color.agent],
];
const PICK = 5; // 확대할 엣지: LINKS[5]

const RX = 980;
const RW = 844;

export const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const { cue, within } = useCues();
  const t1 = cue("s10.1");
  const t2 = cue("s10.2");
  const t3 = cue("s10.3");
  const t4 = cue("s10.4");
  const t5 = cue("s10.5");
  const t6 = cue("s10.6");

  // 원통: 큰 자리 → 작은 자리
  const m = progress(frame, t6, DUR.move, ease.inOut);
  const cyl = { cx: lerp(250, 855, m), top: lerp(190, 336, m), w: lerp(300, 110, m), h: lerp(310, 108, m) };
  const cylIn = progress(frame, t1, DUR.draw);
  const inner = progress(frame, t1 + 10, 20) * (1 - m);
  const gx = (u: number): number => cyl.cx - cyl.w * 0.36 + u * cyl.w * 0.72;
  const gy = (v: number): number => cyl.top + 44 + v * (cyl.h - 70);
  const leftOut = t6 - 2;
  const rightDim = progress(frame, t6, 14, ease.inOut);

  // 엣지 확대
  const z = progress(frame, t2, DUR.draw) * (1 - progress(frame, leftOut, DUR.exit, ease.in));
  const tagAt = within("s10.2", 0.42);
  const tagP = progress(frame, tagAt, DUR.enter) * (1 - progress(frame, leftOut, DUR.exit, ease.in));
  const pick = LINKS[PICK];
  const px0 = (gx(DOTS[pick[0]][0]) + gx(DOTS[pick[1]][0])) / 2;
  const py0 = (gy(DOTS[pick[0]][1]) + gy(DOTS[pick[1]][1])) / 2;

  // 질의가 타자되듯
  const Q = ["MATCH (f:Func)-[w:WRITES]->(x:Field)", "RETURN f.name, w.via, x.name"];
  const typed = Math.max(0, Math.floor((frame - t3 - 8) * 1.1));
  const q0 = Q[0].slice(0, typed);
  const q1 = Q[1].slice(0, Math.max(0, typed - Q[0].length));

  const sumAt = within("s10.4", 0.3);
  const oneAt = within("s10.4", 0.68);
  const rbacAt = within("s10.5", 0.18);
  const mcpAt = within("s10.5", 0.55);
  const mcp = progress(frame, mcpAt, DUR.enter);

  const schemaAt = within("s10.6", 0.3);
  const pipeAt = within("s10.6", 0.46);
  const fileAt = within("s10.6", 0.66);

  return (
    <ShiftSheet>
      {/* ── 원통 ── */}
      <T x={100} y={96} text="그래프 DB" px={44} weight={700} at={t1} out={leftOut} />
      <svg {...fullSvg}>
        {/* 갈아 끼울 수 있는 자리 */}
        <rect x={782} y={300} width={146} height={176} fill="none" stroke={color.lineStrong} strokeWidth={stroke.thin} strokeDasharray="8 7" opacity={progress(frame, fileAt, 14)} />
        <Cyl {...cyl} p={cylIn} />
        <g opacity={inner}>
          {LINKS.map(([a, b, c], i) => (
            <line key={i} x1={gx(DOTS[a][0])} y1={gy(DOTS[a][1])} x2={gx(DOTS[b][0])} y2={gy(DOTS[b][1])} stroke={i === PICK && z > 0 ? color.ink : c} strokeWidth={i === PICK && z > 0 ? stroke.bold : c === color.human ? stroke.trace : stroke.hair} opacity={i === PICK ? 1 : 0.8} />
          ))}
          {DOTS.map(([u, v, c], i) => (
            <rect key={i} x={gx(u) - 9} y={gy(v) - 7} width={18} height={14} fill={color.bg} stroke={c} strokeWidth={stroke.thin} rx={c === color.ink ? 7 : 0} />
          ))}
        </g>
        {/* 확대: 엣지에서 확대 창으로 */}
        <g opacity={z}>
          <path d={`M ${px0} ${py0} L 470 270 M ${px0} ${py0} L 470 410`} stroke={color.lineStrong} strokeWidth={stroke.hair} strokeDasharray="5 6" fill="none" />
          <rect x={470} y={250} width={460} height={180} fill={withAlpha(color.panel, 0.92)} stroke={color.line} strokeWidth={stroke.thin} />
          <rect x={492} y={352} width={84} height={50} fill={color.bg} stroke={color.agent} strokeWidth={stroke.thin} />
          <rect x={824} y={352} width={84} height={50} fill={color.bg} stroke={color.agent} strokeWidth={stroke.thin} />
          <Trace pts={[[576, 377], [824, 377]]} stroke={color.ink} width={stroke.bold} arrow progress={z} />
        </g>
        <line x1={700} y1={318} x2={700} y2={318 + 52 * tagP} stroke={color.human} strokeWidth={stroke.thin} opacity={tagP} />
        {/* MCP 서버를 거치는 조회 */}
        <g opacity={1 - 0.7 * rightDim}>
          <Trace pts={[[RX + 236, 826], [RX + 290, 826]]} stroke={color.inkSoft} arrow at={mcpAt + 6} />
          <Trace pts={[[RX + 660, 826], [RX + 716, 826]]} stroke={color.inkSoft} arrow at={mcpAt + 12} />
          <Cyl cx={RX + 772} top={794} w={92} h={62} p={progress(frame, mcpAt + 14, 12)} />
        </g>
        {/* 끝: 스키마 · 파이프라인 → 중립 파일 → 원통 */}
        <Trace pts={[[286, 310], [286, 336]]} stroke={color.human} at={pipeAt + 4} />
        <Trace pts={[[476, 392], [528, 392]]} stroke={color.inkSoft} arrow at={fileAt} />
        <Trace pts={[[760, 392], [798, 392]]} stroke={color.inkSoft} arrow at={fileAt + 8} />
      </svg>
      <T x={250} y={546} text="Neo4j · 기본안" px={36} weight={700} c={color.agent} align="center" at={within("s10.1", 0.5)} out={leftOut} />
      <T x={470} y={196} text="속성 그래프 · 엣지에도 속성" px={30} weight={700} at={within("s10.2", 0.1)} out={leftOut} />
      <div style={{ position: "absolute", left: 480, top: 270, width: 440, height: 46, boxSizing: "border-box", border: `${stroke.thin}px solid ${color.human}`, backgroundColor: withAlpha(color.human, 0.1), display: "flex", alignItems: "center", justifyContent: "center", ...mono(24, 700), letterSpacing: "0", color: color.human, opacity: tagP, translate: `0px ${(1 - tagP) * 8}px` }}>
        {"{method, commit, approved_by}"}
      </div>

      {/* ── Cypher ── */}
      <CodePanel x={96} y={612} w={834} title="CYPHER" px={30} at={t3} out={leftOut} owner="none" lines={[{ text: q0, at: t3 }, { text: q1, at: t3, tone: "dim" }]} />

      {/* ── 규모 ── */}
      <Table
        x={RX}
        y={96}
        w={RW}
        title="우리 그래프의 규모 (자릿수 가정)"
        at={t4}
        rowH={44}
        dim={Math.max(progress(frame, t5, 14, ease.inOut) * 0.6, rightDim)}
        cols={[{ w: 320 }, { w: 480 }]}
        rows={[
          { cells: ["Jira 이슈", "1만 ~ 10만"], at: t4 + 8, c: color.inkSoft },
          { cells: ["register · field", "1만 ~ 10만"], at: t4 + 13, c: color.inkSoft },
          { cells: ["RTL module · port", "10만 안팎"], at: t4 + 18, c: color.inkSoft },
          { cells: ["FW 함수 · 심볼", "1만 ~ 10만"], at: t4 + 23, c: color.inkSoft },
          { cells: [{ t: "합계", weight: 700 }, { t: "노드 10만 ~ 100만 · 엣지 그 10배", weight: 700 }], at: sumAt, mark: sumAt },
          { cells: ["", { t: "→ 서버 한 대", c: color.agent, weight: 700 }], at: oneAt },
        ]}
      />

      {/* ── 판 비교 ── */}
      <Table
        x={RX}
        y={456}
        w={RW}
        title="Neo4j (2026-11 확인)"
        at={t5}
        rowH={44}
        dim={rightDim}
        cols={[{ w: 340 }, { w: 230 }, { w: 230 }]}
        head={["", "Community", "Enterprise"]}
        rows={[
          { cells: ["라이선스", "GPLv3", "상용"], at: t5 + 8, c: color.inkSoft },
          { cells: ["vector 색인", "있음", "있음"], at: t5 + 12, c: color.inkSoft },
          { cells: [{ t: "RBAC", weight: 700 }, { t: "없음", c: color.problem, weight: 700, u: color.problem }, "있음"], at: t5 + 16, mark: rbacAt, markC: color.problem },
          { cells: ["online backup · 군집", "없음", "있음"], at: t5 + 20, c: color.inkSoft },
        ]}
      />
      <Box x={RX} y={786} w={236} h={80} c={color.inkSoft} p={mcp * (1 - 0.7 * rightDim)}>
        <div style={{ ...sans(30, 600), whiteSpace: "nowrap" }}>사람 · 에이전트</div>
      </Box>
      <Box x={RX + 296} y={774} w={364} h={104} c={color.human} fill={withAlpha(color.human, 0.07)} p={progress(frame, mcpAt + 6, DUR.enter) * (1 - 0.7 * rightDim)} style={{ flexDirection: "column", gap: 2 }}>
        <div style={{ ...sans(30, 700), whiteSpace: "nowrap" }}>사내 MCP 서버</div>
        <div style={{ ...sans(30, 500), whiteSpace: "nowrap", color: color.human }}>정해진 질의 · 권한 필터</div>
      </Box>

      {/* ── 실제 일: 스키마와 추출 파이프라인 ── */}
      <Box x={96} y={200} w={380} h={110} c={color.human} bw={stroke.bold} fill={withAlpha(color.human, 0.08)} p={progress(frame, schemaAt, DUR.enter)}>
        <div style={{ ...sans(44, 700), whiteSpace: "nowrap" }}>스키마</div>
      </Box>
      <Box x={96} y={336} w={380} h={112} c={color.human} bw={stroke.bold} fill={withAlpha(color.human, 0.08)} p={progress(frame, pipeAt, DUR.enter)}>
        <div style={{ ...sans(44, 700), whiteSpace: "nowrap" }}>추출 파이프라인</div>
      </Box>
      <Box x={530} y={336} w={230} h={112} c={color.inkSoft} p={progress(frame, fileAt + 4, DUR.enter)} style={{ flexDirection: "column", gap: 2 }}>
        <div style={{ ...sans(30, 700), whiteSpace: "nowrap" }}>중립 파일</div>
        <div style={{ ...sans(30, 500), whiteSpace: "nowrap", color: color.inkSoft }}>노드 · 엣지 목록</div>
      </Box>
      <T x={930} y={496} text="Memgraph · Apache AGE · RDF · 파일" px={30} weight={500} c={color.inkDim} align="right" at={fileAt + 14} />
    </ShiftSheet>
  );
};
