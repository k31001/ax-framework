import type { FC } from "react";
import { COLOR, RULE, SIZE, WEIGHT, mono, sans } from "../theme";
import { ArrowRight } from "./Arrow";

type PrincipleMarkProps = {
  name: string;
  stat: string;
  from: string;
  to: string;
  source: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// 원칙 표식. 지면의 곁단처럼 선다: 굵은 괘선 아래에 원칙 이름, 단의 바닥에 수치.
// 수치는 가는 숫자에서 화살표를 거쳐 굵은 숫자로 이어지며 그래픽 요소가 된다.
// 영상에서는 굵은 괘선이 그어지고 이름이 올라온 뒤, 가는 수치가 아래의 굵은 수치로 넘어간다.
export const PrincipleMark: FC<PrincipleMarkProps> = ({
  name,
  stat,
  from,
  to,
  source,
  x,
  y,
  width,
  height,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      height,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    <div>
      <div style={{ height: RULE.heavy, backgroundColor: COLOR.ink }} />
      <div
        style={{
          marginTop: 18,
          whiteSpace: "nowrap",
          ...sans(64, WEIGHT.black, { lineHeight: 1.1 }),
        }}
      >
        {name}
      </div>
    </div>
    <div style={{ fontVariantNumeric: "tabular-nums" }}>
      <div
        style={{
          marginBottom: 14,
          whiteSpace: "nowrap",
          color: COLOR.inkSoft,
          ...sans(SIZE.note, WEIGHT.medium),
        }}
      >
        {stat}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 26,
          marginLeft: -4,
          color: COLOR.inkSoft,
          ...sans(120, WEIGHT.thin, { lineHeight: 0.9 }),
        }}
      >
        {from}
        <ArrowRight length={96} weight={RULE.mid} color={COLOR.inkSoft} />
      </div>
      <div
        style={{
          marginLeft: -8,
          whiteSpace: "nowrap",
          color: COLOR.teal,
          ...sans(SIZE.stat, WEIGHT.black, { lineHeight: 0.9 }),
        }}
      >
        {to}
      </div>
      <div
        style={{
          marginTop: 6,
          color: COLOR.inkSoft,
          ...mono(SIZE.label + 2, 500),
        }}
      >
        {source}
      </div>
    </div>
  </div>
);
