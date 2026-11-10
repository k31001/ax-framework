import type { CSSProperties, FC } from "react";
import type { StepKind } from "../../shared/content";
import { COLOR, RULE, SIZE, WEIGHT, mono, sans } from "../theme";
import { HRule } from "./Rule";

export type FlowStep = { kind: StepKind; text: string };

// 흐름도의 치수. 다른 사례 씬에서도 같은 값을 쓴다.
export const FLOW = {
  gutter: 52, // 순서 번호가 놓이는 왼쪽 여백
  header: 48, // 줄 이름이 놓이는 높이
  row: 62, // 사람·에이전트 항목의 높이
  band: 86, // 문제 띠의 높이
  gap: 19, // 항목 사이
  spine: 28, // 줄의 왼쪽에서 흐름선까지
} as const;

export type FlowRow = FlowStep & { top: number; height: number };

/** 흐름도를 y에 놓았을 때 각 행의 위치. 씬에서 행 옆에 그림을 맞춰 놓을 때도 쓴다. */
export const layoutFlow = (
  steps: readonly FlowStep[],
  y: number,
): FlowRow[] => {
  let cursor = y + FLOW.header + RULE.mid + 14;
  return steps.map((step) => {
    const height = step.kind === "problem" ? FLOW.band : FLOW.row;
    const row = { ...step, top: cursor, height };
    cursor += height + FLOW.gap;
    return row;
  });
};

const isBand = (kind: StepKind): boolean =>
  kind === "problem" || kind === "resolved";

// 마름모 표식. 꽉 찬 마름모는 문제, 빈 마름모는 해결(표식이 풀린 상태)이다.
const Diamond: FC<{ filled: boolean; color: string }> = ({ filled, color }) => (
  <svg width={30} height={30} viewBox="0 0 30 30" style={{ flex: "none" }}>
    <polygon
      points="15,2 28,15 15,28 2,15"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={RULE.mid}
      strokeLinejoin="miter"
    />
  </svg>
);

// 숫자만 크게 키워 그래픽으로 쓴다. 문구는 바꾸지 않는다.
const withBigDigits = (text: string, size: number) =>
  text.split(/(\d+)/).map((part, i) =>
    /^\d+$/.test(part) ? (
      <span
        key={i}
        style={{
          fontSize: size,
          fontWeight: WEIGHT.black,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          margin: "0 3px 0 6px",
        }}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );

const itemBase: CSSProperties = {
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  whiteSpace: "nowrap",
};

// 흐름도 항목 하나. 형태로 누가 한 일인지 구분한다.
//   사람     먹색 테두리, 바탕색 면
//   에이전트 청록 면
//   문제     주홍 띠(두 줄을 가로지른다)
//   해결     먹색 띠
export const FlowItem: FC<{ kind: StepKind; text: string }> = ({
  kind,
  text,
}) => {
  if (kind === "problem") {
    return (
      <div
        style={{
          ...itemBase,
          width: "100%",
          height: FLOW.band,
          padding: "0 26px",
          gap: 18,
          backgroundColor: COLOR.vermilion,
          color: COLOR.paper,
          ...sans(42, WEIGHT.heavy, { lineHeight: 1 }),
        }}
      >
        <Diamond filled color={COLOR.paper} />
        <div style={{ display: "flex", alignItems: "baseline" }}>
          {withBigDigits(text, 70)}
        </div>
      </div>
    );
  }
  if (kind === "resolved") {
    return (
      <div
        style={{
          ...itemBase,
          width: "100%",
          height: FLOW.row,
          padding: "0 26px",
          gap: 18,
          backgroundColor: COLOR.ink,
          color: COLOR.paper,
          ...sans(SIZE.body, WEIGHT.heavy, { lineHeight: 1 }),
        }}
      >
        <Diamond filled={false} color={COLOR.paper} />
        {text}
      </div>
    );
  }
  const human = kind === "human";
  return (
    <div
      style={{
        ...itemBase,
        height: FLOW.row,
        padding: human ? "0 18px" : "0 22px",
        border: human ? `${RULE.mid}px solid ${COLOR.ink}` : "none",
        backgroundColor: human ? COLOR.paper : COLOR.teal,
        color: human ? COLOR.ink : COLOR.paper,
        ...sans(SIZE.body, WEIGHT.bold, { lineHeight: 1 }),
      }}
    >
      {text}
    </div>
  );
};

// 줄 이름. 항목과 같은 재질의 작은 사각형을 앞에 둔다.
const LaneName: FC<{ name: string; human: boolean; x: number; y: number }> = ({
  name,
  human,
  x,
  y,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      height: FLOW.header - 10,
      display: "flex",
      alignItems: "center",
      gap: 12,
      whiteSpace: "nowrap",
      ...sans(SIZE.note, WEIGHT.heavy, { lineHeight: 1 }),
    }}
  >
    <div
      style={{
        width: 22,
        height: 22,
        boxSizing: "border-box",
        border: human ? `${RULE.mid}px solid ${COLOR.ink}` : "none",
        backgroundColor: human ? COLOR.paper : COLOR.teal,
      }}
    />
    {name}
  </div>
);

type FlowProps = {
  steps: readonly FlowStep[];
  lanes: { agent: string; human: string };
  x: number;
  y: number;
  width: number;
  /** 사람 줄이 시작하는 x. 에이전트 줄은 x + gutter에서 시작한다. */
  humanX: number;
};

// 두 줄 흐름도. 두 줄은 지면의 두 단이고, 시간은 위에서 아래로 흐른다.
// 한 행에 항목 하나만 놓이므로 순서는 번호와 흐름선으로, 누가 했는지는 단과 재질로 읽힌다.
// 영상에서는 행이 위에서부터 하나씩 가림막 뒤에서 올라오고, 흐름선이 다음 행까지 그어진다.
export const Flow: FC<FlowProps> = ({ steps, lanes, x, y, width, humanX }) => {
  const agentX = x + FLOW.gutter;
  const agentSpine = agentX + FLOW.spine;
  const humanSpine = humanX + FLOW.spine;

  const rows = layoutFlow(steps, y);

  // 흐름선: 앞 항목에서 다음 항목으로. 단이 바뀌면 빈칸을 가로질러 꺾인다.
  const HEAD = 11;
  const paths: string[] = [];
  const heads: string[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i];
    const b = rows[i + 1];
    const aBottom = a.top + a.height;
    if (a.kind === "human" && b.kind === "agent") {
      const midY = a.top + a.height / 2;
      paths.push(`M ${humanX} ${midY} H ${agentSpine} V ${b.top - HEAD + 1}`);
      heads.push(downHead(agentSpine, b.top, HEAD));
    } else if (a.kind === "agent" && b.kind === "human") {
      const midY = b.top + b.height / 2;
      paths.push(`M ${agentSpine} ${aBottom} V ${midY} H ${humanX - HEAD + 1}`);
      heads.push(rightHead(humanX, midY, HEAD));
    } else {
      const sx =
        a.kind === "human" || b.kind === "human" ? humanSpine : agentSpine;
      paths.push(`M ${sx} ${aBottom} V ${b.top - HEAD + 1}`);
      heads.push(downHead(sx, b.top, HEAD));
    }
  }

  return (
    <>
      <LaneName name={lanes.agent} human={false} x={agentX} y={y} />
      <LaneName name={lanes.human} human x={humanX} y={y} />
      <HRule x={x} y={y + FLOW.header} length={width} weight={RULE.mid} />

      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={COLOR.ink}
            strokeWidth={RULE.hair + 1}
          />
        ))}
        {heads.map((points, i) => (
          <polygon key={i} points={points} fill={COLOR.ink} />
        ))}
      </svg>

      {rows.map((row, i) => {
        const band = isBand(row.kind);
        const left = row.kind === "human" ? humanX : agentX;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: row.top,
                height: row.height,
                display: "flex",
                alignItems: "center",
                color:
                  row.kind === "problem"
                    ? COLOR.vermilion
                    : row.kind === "resolved"
                      ? COLOR.ink
                      : COLOR.inkSoft,
                ...mono(SIZE.note, band ? 700 : 500),
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                position: "absolute",
                left,
                top: row.top,
                width: band ? x + width - agentX : undefined,
              }}
            >
              <FlowItem kind={row.kind} text={row.text} />
            </div>
          </div>
        );
      })}
    </>
  );
};

const downHead = (x: number, y: number, size: number): string =>
  `${x - size * 0.6},${y - size} ${x + size * 0.6},${y - size} ${x},${y}`;

const rightHead = (x: number, y: number, size: number): string =>
  `${x - size},${y - size * 0.6} ${x - size},${y + size * 0.6} ${x},${y}`;
