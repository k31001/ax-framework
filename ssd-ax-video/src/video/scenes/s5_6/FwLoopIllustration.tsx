import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { clamp01, draw, ease, lerp, progress, sub } from "../../anim";
import { FIG } from "../../content";
import { Pad, Trace } from "../../components/Trace";
import type { Illustration } from "../../stage/StageScene";
import { color, mono, pad2, sans, size, stroke, withAlpha } from "../../theme";

// S5-6 FW 개발의 그림 (662×616).
//
//   위      칩 실루엣 위의 닫힌 고리(빌드 → 실행 → 수정). 에이전트 항목부터 노드가 고리를 계속 돈다.
//           한 바퀴마다 대상이 가상 플랫폼 ↔ 보드로 바뀐다(위쪽 두 이름표, 칩 외곽선이 점선 ↔ 실선).
//   오른쪽  칩에서 HOST 로 나가는 길목의 관문(불변식). 사람의 첫 항목에 고리보다 먼저 놓인다.
//           첫 바퀴의 실행에서 붉은 조각(정정 실패 데이터, UECC)이 나가다 관문에 막히고,
//           그 뒤 바퀴의 조각은 관문이 열려 HOST 까지 간다.
//   아래    read retry table. 사람의 마지막 항목에 표가 나타나 실제 NAND 표식과 이어지고,
//           사람 색 승인 표시가 찍힌 뒤 칩으로 올라간다.

const L = FIG["S5-6"];

// ── 자리 ───────────────────────────────────────────────────────────────
const CHIP = { x: 20, y: 62, w: 310, h: 290, cut: 14, pin: 12 } as const;
const RING = { cx: 175, cy: 207, r: 110 } as const;
/** 고리 위 세 지점의 각도(도). 시계 방향으로 빌드 → 실행 → 수정 */
const START = -120;
const EXIT_Y = RING.cy;
const GATE = { x: 470, w: 48, h: 68 } as const;
const HOST_X = 586;
const TABLE = { x: 20, y: 456, cw: 76, rh: 38 } as const;
const CELLS = [
  ["R1", "-06", "+02", "-10"],
  ["R2", "-12", "+04", "-18"],
  ["R3", "-20", "+08", "-26"],
] as const;
const TABLE_W = TABLE.cw * 4;
const TABLE_H = TABLE.rh * CELLS.length;
const NAND = { x: 456, y: 478, w: 136, h: 70 } as const;
const LINK_Y = TABLE.y + TABLE_H / 2;
const STAMP_X = (TABLE.x + TABLE_W + NAND.x - CHIP.pin) / 2;

/** 한 바퀴의 길이(프레임) */
const LAP = 42;

const RAD = Math.PI / 180;
const onRing = (deg: number, r: number = RING.r): { x: number; y: number } => ({
  x: RING.cx + r * Math.cos(deg * RAD),
  y: RING.cy + r * Math.sin(deg * RAD),
});

const chamferBox = (x: number, y: number, w: number, h: number, c: number): string =>
  `M ${x + c} ${y} H ${x + w - c} L ${x + w} ${y + c} V ${y + h - c} L ${x + w - c} ${y + h} H ${x + c} L ${x} ${
    y + h - c
  } V ${y + c} Z`;

// 칩의 핀. 오른쪽 가운데는 데이터가 나가는 길이라 비운다.
const PINS: { x1: number; y1: number; x2: number; y2: number }[] = [];
for (let k = 0; k < 6; k++) {
  const x = CHIP.x + (CHIP.w * (k + 0.5)) / 6;
  PINS.push({ x1: x, x2: x, y1: CHIP.y - CHIP.pin, y2: CHIP.y });
  PINS.push({ x1: x, x2: x, y1: CHIP.y + CHIP.h, y2: CHIP.y + CHIP.h + CHIP.pin });
}
for (let k = 0; k < 5; k++) {
  const y = CHIP.y + (CHIP.h * (k + 0.5)) / 5;
  PINS.push({ x1: CHIP.x - CHIP.pin, x2: CHIP.x, y1: y, y2: y });
  if (k !== 2) PINS.push({ x1: CHIP.x + CHIP.w, x2: CHIP.x + CHIP.w + CHIP.pin, y1: y, y2: y });
}
/** 승인된 표가 올라가 닿는 아래쪽 핀 */
const FEED_X = CHIP.x + (CHIP.w * 5.5) / 6;

/** 점을 가운데로 놓는 글자 자리 */
const At: React.FC<{
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  opacity?: number;
  dy?: number;
  children: React.ReactNode;
}> = ({ x, y, align = "center", opacity = 1, dy = 0, children }) =>
  opacity <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + dy,
        transform: `translate(${align === "center" ? "-50%" : align === "right" ? "-100%" : "0"}, -50%)`,
        whiteSpace: "nowrap",
        opacity,
      }}
    >
      {children}
    </div>
  );

export const FwLoopIllustration: Illustration = ({ width, height, beats, frames }) => {
  const frame = useCurrentFrame();
  const humans = beats.filter((b) => b.kind === "human");
  const agents = beats.filter((b) => b.kind === "agent");
  const tChip = frames.before + 8;
  const tInv = humans[0].frame;
  const tLoop = agents[0].frame;
  const tTable = humans[1].frame;

  // ── 칩 ──
  const chipP = progress(frame, tChip, 30, ease.inOut);
  const exitP = progress(frame, tChip + 16, 22, ease.inOut);

  // ── 고리와 노드 ──
  const ringP = progress(frame, tLoop, 20, ease.inOut);
  const t0 = tLoop + 16; // 노드가 빌드에서 출발
  const legs = Math.max(0, (frame - t0) / (LAP / 3));
  const leg = Math.floor(legs);
  const within = legs - leg;
  // 지점마다 살짝 머문다.
  const angle = START + (leg + lerp(within, ease.inOut(within), 0.6)) * 120;
  const runnerP = progress(frame, t0 - 8, 8);
  const lap = Math.floor(legs / 3);
  const node = onRing(angle);
  const tail = Math.min(34, (angle - START) * 0.9);
  const tailFrom = onRing(angle - tail);
  const nearStation = (j: number): number => {
    const d = ((((angle - (START + j * 120)) % 360) + 540) % 360) - 180;
    return runnerP * clamp01(1 - Math.abs(d) / 42);
  };

  // 대상: 앞 두 바퀴는 가상 플랫폼, 그 뒤는 보드 (가상에서 먼저 돌리고 보드로 넘어간다)
  const turn = progress(frame, t0 + 2 * LAP, 10, ease.inOut);
  const board = lap < 2 ? 0 : turn;
  const tabsP = progress(frame, tLoop + 2, 14);

  // ── 관문 ──
  const gateP = progress(frame, tInv, 16);
  const runAt = (n: number): number => t0 + (n + 1 / 3) * LAP; // n번째 바퀴의 실행
  // 붉은 조각: 첫 실행에서 나가다 막힌다.
  const tBad = runAt(0);
  const badFrom = onRing(START + 120).x + 12;
  const badStop = GATE.x - GATE.w / 2 - 12;
  const badP = progress(frame, tBad, 18, ease.inOut);
  const tHit = tBad + 18;
  const badGone = progress(frame, tHit + 8, 12, ease.in);
  const hit = frame < tHit ? 0 : 1 - progress(frame, tHit, 22, ease.linear);
  // 통과하는 조각: 그 뒤 바퀴의 실행마다 하나씩
  const oks = [1, 2].map((n) => clamp01((frame - runAt(n)) / 34));
  const okX = (p: number): number => lerp(badFrom, HOST_X - 12, p);
  const xIn = GATE.x - GATE.w / 2;
  const xOut = GATE.x + GATE.w / 2;
  const open = oks.reduce((most, p) => {
    if (p <= 0 || p >= 1) return most;
    const x = okX(p);
    return Math.max(most, Math.min(clamp01((x - (xIn - 46)) / 30), clamp01((xOut + 34 - x) / 22)));
  }, 0);
  const arrived = oks.reduce((most, p, i) => {
    const at = runAt(i + 1) + 34;
    return Math.max(most, frame < at ? 0 : 1 - progress(frame, at, 16, ease.linear));
  }, 0);
  const gap = 34 * ease.inOut(open);
  const barTop = EXIT_Y - GATE.h / 2 + 8;
  const barBottom = EXIT_Y + GATE.h / 2 - 8;
  // 기록이 카드에 붙을 때 관문에서 고리가 한 번 퍼진다.
  const recorded = frame < frames.record ? 0 : progress(frame, frames.record, 26, ease.out);

  // ── 표 ──
  const tableP = progress(frame, tTable, 18, ease.inOut);
  const nandP = progress(frame, tTable + 6, 18, ease.inOut);
  const linkP = progress(frame, tTable + 14, 12, ease.inOut);
  const tStamp = tTable + 26;
  const stampP = progress(frame, tStamp, 12);
  const approved = progress(frame, tStamp + 2, 12);
  const feedP = progress(frame, tStamp + 12, 16, ease.inOut);
  const tableTint = interpolateColors(approved, [0, 1], [color.inkSoft, color.human]);
  const tableOutline = 2 * (TABLE_W + TABLE_H);

  const chipTint = interpolateColors(board, [0, 1], [color.lineStrong, color.inkSoft]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        fill="none"
      >
        {/* ── 칩 실루엣 ── */}
        <g opacity={sub(chipP, 0.5, 1) * lerp(0.45, 1, board)} stroke={chipTint} strokeWidth={stroke.thin}>
          {PINS.map((p, i) => (
            <line key={i} {...p} />
          ))}
        </g>
        <path d={chamferBox(CHIP.x, CHIP.y, CHIP.w, CHIP.h, CHIP.cut)} fill={withAlpha(color.panel, 0.6 * chipP)} />
        {/* 가상 플랫폼: 점선 외곽 / 보드: 실선 외곽 */}
        <path
          d={chamferBox(CHIP.x, CHIP.y, CHIP.w, CHIP.h, CHIP.cut)}
          stroke={color.inkSoft}
          strokeWidth={stroke.thin}
          strokeDasharray="10 7"
          opacity={sub(chipP, 0.3, 1) * (1 - board) * 0.85}
        />
        <path
          d={chamferBox(CHIP.x, CHIP.y, CHIP.w, CHIP.h, CHIP.cut)}
          stroke={color.inkSoft}
          strokeWidth={stroke.thin}
          pathLength={1}
          {...draw(chipP)}
          opacity={chipP < 1 ? 0.5 : board}
        />
        <circle cx={CHIP.x + 24} cy={CHIP.y + 24} r={4} fill={color.lineStrong} opacity={sub(chipP, 0.6, 1)} />

        {/* ── 나가는 길: 칩 → 관문 → HOST ── */}
        <Trace
          pts={[
            [CHIP.x + CHIP.w, EXIT_Y],
            [xIn, EXIT_Y],
          ]}
          stroke={color.lineStrong}
          progress={sub(exitP, 0, 0.6)}
        />
        {/* 실행 지점에서 칩 가장자리까지: 고리와 함께 생긴다 */}
        <Trace
          pts={[
            [onRing(START + 120).x + 8, EXIT_Y],
            [CHIP.x + CHIP.w, EXIT_Y],
          ]}
          stroke={color.lineStrong}
          progress={sub(ringP, 0.35, 0.7)}
        />
        <Trace
          pts={[
            [xOut, EXIT_Y],
            [HOST_X, EXIT_Y],
          ]}
          stroke={interpolateColors(arrived, [0, 1], [color.lineStrong, color.ink])}
          arrow
          progress={sub(exitP, 0.5, 1)}
        />

        {/* ── 고리 ── */}
        {ringP > 0 ? (
          <>
            <circle
              cx={RING.cx}
              cy={RING.cy}
              r={RING.r}
              stroke={withAlpha(color.agent, 0.5)}
              strokeWidth={stroke.trace}
              pathLength={1}
              {...draw(ringP)}
              transform={`rotate(${START} ${RING.cx} ${RING.cy})`}
            />
            {/* 방향 표시 */}
            {[60, 180, 300].map((offset, i) => {
              const a = START + offset;
              const p = onRing(a);
              const tx = -Math.sin(a * RAD);
              const ty = Math.cos(a * RAD);
              const nx = Math.cos(a * RAD);
              const ny = Math.sin(a * RAD);
              return (
                <polygon
                  key={i}
                  points={`${p.x + tx * 8},${p.y + ty * 8} ${p.x - tx * 6 + nx * 6},${p.y - ty * 6 + ny * 6} ${
                    p.x - tx * 6 - nx * 6
                  },${p.y - ty * 6 - ny * 6}`}
                  fill={color.agent}
                  opacity={0.7 * sub(ringP, (offset / 360) * 0.9, (offset / 360) * 0.9 + 0.1)}
                />
              );
            })}
            {/* 노드가 지나온 자리 */}
            {runnerP > 0 && tail > 1 ? (
              <path
                d={`M ${tailFrom.x} ${tailFrom.y} A ${RING.r} ${RING.r} 0 0 1 ${node.x} ${node.y}`}
                stroke={color.agent}
                strokeWidth={stroke.bold}
                opacity={runnerP}
              />
            ) : null}
            {/* 세 지점 */}
            {L.loop.map((_, j) => {
              const p = onRing(START + j * 120);
              const on = nearStation(j);
              const shown = sub(ringP, (j / 3) * 0.9, (j / 3) * 0.9 + 0.12);
              return (
                <circle
                  key={j}
                  cx={p.x}
                  cy={p.y}
                  r={lerp(7, 9, on) * (0.4 + 0.6 * shown)}
                  fill={interpolateColors(on, [0, 1], [color.bg, color.agent])}
                  stroke={color.agent}
                  strokeWidth={stroke.trace}
                  opacity={shown}
                />
              );
            })}
            {/* 도는 노드 */}
            {runnerP > 0 ? (
              <g opacity={runnerP}>
                <circle cx={node.x} cy={node.y} r={16} fill={withAlpha(color.agent, 0.18)} />
                <circle cx={node.x} cy={node.y} r={8} fill={color.agent} stroke={color.bg} strokeWidth={stroke.thin} />
              </g>
            ) : null}
          </>
        ) : null}

        {/* ── 막히는 조각 ── */}
        {badP > 0 && badGone < 1 ? (
          <rect
            x={lerp(badFrom, badStop, badP) - 7}
            y={EXIT_Y - 7}
            width={14}
            height={14}
            fill={withAlpha(color.problem, 1 - 0.75 * sub(hit < 1 && frame >= tHit ? 1 - hit : 0, 0, 0.5))}
            stroke={color.problem}
            strokeWidth={stroke.thin}
            opacity={Math.min(1, badP * 6) * (1 - badGone)}
          />
        ) : null}

        {/* ── 관문 ── */}
        {gateP > 0 ? (
          <g opacity={gateP} transform={`translate(0 ${(1 - gateP) * -14})`}>
            {recorded > 0 && recorded < 1 ? (
              <rect
                x={xIn - 18 * recorded}
                y={EXIT_Y - GATE.h / 2 - 18 * recorded}
                width={GATE.w + 36 * recorded}
                height={GATE.h + 36 * recorded}
                stroke={color.human}
                strokeWidth={stroke.thin}
                opacity={0.8 * (1 - recorded)}
              />
            ) : null}
            <rect x={xIn} y={EXIT_Y - GATE.h / 2} width={GATE.w} height={GATE.h} fill={color.bg} />
            <rect
              x={xIn}
              y={EXIT_Y - GATE.h / 2}
              width={GATE.w}
              height={GATE.h}
              fill={withAlpha(color.human, 0.26 * hit)}
              stroke={color.human}
              strokeWidth={lerp(stroke.trace, stroke.bold, hit)}
            />
            {/* 차단 막대: 통과할 조각이 오면 가운데가 열린다 */}
            <g stroke={color.human} strokeWidth={6}>
              <line x1={GATE.x} x2={GATE.x} y1={barTop} y2={Math.max(barTop, EXIT_Y - gap / 2)} />
              <line x1={GATE.x} x2={GATE.x} y1={Math.min(barBottom, EXIT_Y + gap / 2)} y2={barBottom} />
            </g>
          </g>
        ) : null}

        {/* ── 통과하는 조각: 열린 관문 위로 지나간다 ── */}
        {oks.map((p, i) =>
          p > 0 && p < 1 ? (
            <rect
              key={i}
              x={okX(p) - 6}
              y={EXIT_Y - 6}
              width={12}
              height={12}
              fill={color.ink}
              opacity={Math.min(1, p * 8, (1 - p) * 8)}
            />
          ) : null,
        )}

        {/* ── read retry table ── */}
        {tableP > 0 ? (
          <>
            <rect
              x={TABLE.x}
              y={TABLE.y}
              width={TABLE_W}
              height={TABLE_H}
              fill={withAlpha(color.human, 0.05 * approved)}
              stroke={tableTint}
              strokeWidth={stroke.thin}
              {...(tableP < 1 ? draw(tableP, tableOutline) : {})}
            />
            <g stroke={color.line} strokeWidth={stroke.hair} opacity={sub(tableP, 0.4, 1)}>
              {[1, 2, 3].map((c) => (
                <line
                  key={`c${c}`}
                  x1={TABLE.x + c * TABLE.cw}
                  x2={TABLE.x + c * TABLE.cw}
                  y1={TABLE.y}
                  y2={TABLE.y + TABLE_H}
                />
              ))}
              {[1, 2].map((r) => (
                <line
                  key={`r${r}`}
                  x1={TABLE.x}
                  x2={TABLE.x + TABLE_W}
                  y1={TABLE.y + r * TABLE.rh}
                  y2={TABLE.y + r * TABLE.rh}
                />
              ))}
            </g>
          </>
        ) : null}

        {/* 실제 NAND 표식 */}
        {nandP > 0 ? (
          <g>
            <g stroke={color.inkSoft} strokeWidth={stroke.thin} opacity={sub(nandP, 0.5, 1)}>
              {[0, 1, 2, 3].map((k) => {
                const y = NAND.y + (NAND.h * (k + 0.5)) / 4;
                return (
                  <React.Fragment key={k}>
                    <line x1={NAND.x - CHIP.pin} x2={NAND.x} y1={y} y2={y} />
                    <line x1={NAND.x + NAND.w} x2={NAND.x + NAND.w + CHIP.pin} y1={y} y2={y} />
                  </React.Fragment>
                );
              })}
            </g>
            <path
              d={chamferBox(NAND.x, NAND.y, NAND.w, NAND.h, 8)}
              fill={withAlpha(color.panel, 0.6 * nandP)}
              stroke={color.inkSoft}
              strokeWidth={stroke.thin}
              pathLength={1}
              {...draw(nandP)}
            />
          </g>
        ) : null}

        {/* 표 ↔ NAND, 승인 표시 */}
        <Trace
          pts={[
            [TABLE.x + TABLE_W, LINK_Y],
            [NAND.x - CHIP.pin, LINK_Y],
          ]}
          stroke={interpolateColors(approved, [0, 1], [color.inkSoft, color.human])}
          progress={linkP}
        />
        <Pad x={TABLE.x + TABLE_W} y={LINK_Y} fill={tableTint} p={sub(linkP, 0, 0.3)} />
        {stampP > 0 ? (
          <g
            opacity={stampP}
            transform={`translate(${STAMP_X} ${LINK_Y}) scale(${lerp(1.35, 1, stampP)})`}
            stroke={color.human}
          >
            <circle r={24} fill={color.bg} strokeWidth={stroke.trace} />
            <circle r={24} fill={withAlpha(color.human, 0.14)} stroke="none" />
            <path d="M -11 1 L -3 9 L 12 -8" strokeWidth={stroke.bold} pathLength={1} {...draw(sub(stampP, 0.3, 1))} />
          </g>
        ) : null}

        {/* 승인된 표가 칩으로 */}
        <Trace
          pts={[
            [FEED_X, TABLE.y],
            [FEED_X, CHIP.y + CHIP.h + CHIP.pin],
          ]}
          stroke={color.human}
          arrow
          progress={feedP}
        />
      </svg>

      {/* ── 글자 ── */}
      {/* 대상 이름표 */}
      <div
        style={{
          position: "absolute",
          left: CHIP.x,
          top: 0,
          display: "flex",
          gap: 32,
          opacity: tabsP,
          translate: `0px ${(1 - tabsP) * 10}px`,
        }}
      >
        {L.targets.map((name, i) => {
          const on = i === 0 ? 1 - board : board;
          return (
            <div
              key={name}
              style={{
                position: "relative",
                ...sans(size.small, 600),
                lineHeight: "38px",
                whiteSpace: "nowrap",
                color: interpolateColors(on, [0, 1], [color.inkDim, color.ink]),
              }}
            >
              {name}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -3,
                  height: stroke.bold,
                  backgroundColor: color.agent,
                  opacity: on,
                  transform: `scaleX(${0.3 + 0.7 * on})`,
                  transformOrigin: "left center",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 고리 위 세 지점의 이름: 고리 안쪽 */}
      {L.loop.map((name, j) => {
        const p = onRing(START + j * 120, 58);
        const on = nearStation(j);
        const shown = sub(ringP, (j / 3) * 0.9 + 0.05, (j / 3) * 0.9 + 0.3);
        return (
          <At key={name} x={p.x} y={p.y} opacity={shown} dy={(1 - shown) * 8}>
            <span
              style={{
                ...sans(size.small, 700),
                color: interpolateColors(on, [0, 1], [color.inkSoft, color.ink]),
              }}
            >
              {name}
            </span>
          </At>
        );
      })}
      <At x={CHIP.x + 18} y={CHIP.y + CHIP.h - 20} align="left" opacity={runnerP * 0.9}>
        <span style={{ ...mono(size.label, 500), color: color.inkDim }}>ITER {pad2(lap + 1)}</span>
      </At>

      {/* 관문 이름 */}
      <At x={GATE.x} y={EXIT_Y - GATE.h / 2 - 34} opacity={gateP} dy={(1 - gateP) * -14}>
        <span style={{ ...sans(size.small, 700), color: color.human }}>{L.invariant}</span>
      </At>
      <At x={HOST_X + 12} y={EXIT_Y} align="left" opacity={sub(exitP, 0.7, 1)}>
        <span
          style={{
            ...mono(size.label, 700),
            color: interpolateColors(arrived, [0, 1], [color.inkDim, color.ink]),
          }}
        >
          HOST
        </span>
      </At>
      {/* 붉은 조각의 이름표: 칩과 관문 사이에 고정 */}
      <At
        x={(CHIP.x + CHIP.w + xIn) / 2}
        y={EXIT_Y + 30}
        opacity={clamp01((lerp(badFrom, badStop, badP) - CHIP.x - CHIP.w) / 24) * (1 - badGone)}
      >
        <span style={{ ...mono(size.label, 700), color: color.problem }}>UECC</span>
      </At>

      {/* 표 */}
      <At x={TABLE.x} y={TABLE.y - 28} align="left" opacity={sub(tableP, 0, 0.6)} dy={(1 - sub(tableP, 0, 0.6)) * 10}>
        <span style={{ ...sans(size.small, 600), color: color.ink }}>{L.table}</span>
      </At>
      {CELLS.map((row, r) => {
        const shown = progress(frame, tTable + 8 + r * 4, 12);
        return row.map((cell, c) => (
          <At
            key={`${r}-${c}`}
            x={TABLE.x + (c + 0.5) * TABLE.cw}
            y={TABLE.y + (r + 0.5) * TABLE.rh}
            opacity={shown}
            dy={(1 - shown) * 6}
          >
            <span style={{ ...mono(size.label, c === 0 ? 700 : 500), color: c === 0 ? color.inkDim : color.inkSoft }}>
              {cell}
            </span>
          </At>
        ));
      })}
      <At x={NAND.x + NAND.w / 2} y={NAND.y + NAND.h / 2} opacity={sub(nandP, 0.4, 1)}>
        <span style={{ ...mono(size.label, 700), color: color.inkSoft }}>NAND</span>
      </At>
    </div>
  );
};
