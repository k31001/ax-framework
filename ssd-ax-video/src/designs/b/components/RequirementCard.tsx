import type { FC } from "react";
import { COLOR, RULE, SIZE, WEIGHT, mono, pad2, sans } from "../theme";

type RequirementCardProps = {
  id: string;
  title: string;
  criterion: string;
  /** 앞 단계에서 붙은 기록. i번째 기록은 i번째 단계에서 붙었다. */
  records: readonly string[];
  x: number;
  y: number;
  bodyWidth: number;
  tabWidth: number;
};

// 요구사항 카드. 먹색 테두리의 전표 모양이고, 단계가 끝날 때마다 기록 꼬리표가 오른쪽에 한 장씩 붙는다.
// 영상에서는 카드가 진행 표시의 깃대를 따라 옆으로 밀려가 멈추고, 꼬리표가 오른쪽에서 끼워진다.
export const RequirementCard: FC<RequirementCardProps> = ({
  id,
  title,
  criterion,
  records,
  x,
  y,
  bodyWidth,
  tabWidth,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      display: "flex",
      alignItems: "stretch",
    }}
  >
    <div
      style={{
        width: bodyWidth,
        boxSizing: "border-box",
        border: `${RULE.mid}px solid ${COLOR.ink}`,
        backgroundColor: COLOR.paper,
      }}
    >
      <div
        style={{
          height: 46,
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          backgroundColor: COLOR.ink,
          color: COLOR.paper,
          ...mono(SIZE.note, 700, { letterSpacing: "0.02em" }),
        }}
      >
        {id}
      </div>
      <div
        style={{
          padding: "10px 18px 0",
          whiteSpace: "nowrap",
          ...sans(38, WEIGHT.heavy),
        }}
      >
        {title}
      </div>
      <div
        style={{
          padding: "2px 18px 14px",
          whiteSpace: "nowrap",
          color: COLOR.ink,
          ...mono(SIZE.note, 500),
        }}
      >
        {criterion}
      </div>
    </div>
    <div
      style={{
        width: tabWidth,
        marginLeft: -RULE.mid,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {records.map((record, i) => (
        <div
          key={record}
          style={{
            flex: 1,
            marginTop: i === 0 ? 0 : -RULE.mid,
            boxSizing: "border-box",
            border: `${RULE.mid}px solid ${COLOR.ink}`,
            backgroundColor: COLOR.paper,
            padding: "0 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ ...mono(SIZE.label, 500), color: COLOR.inkSoft }}>
            {pad2(i + 1)}
          </span>
          <span style={sans(SIZE.note, WEIGHT.bold)}>{record}</span>
        </div>
      ))}
    </div>
  </div>
);
