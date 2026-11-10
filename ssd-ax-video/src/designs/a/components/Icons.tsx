import React from "react";
import { color, stroke } from "../theme";

// 선으로만 그린 아이콘. 24×24 좌표계에 그리고 size로 키운다.

type IconProps = { size?: number; color?: string; width?: number };

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 32,
  color: c = color.ink,
  width = stroke.trace,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={c}
    strokeWidth={(width * 24) / size}
    strokeLinecap="square"
    strokeLinejoin="miter"
    style={{ display: "block", flex: "none" }}
  >
    {children}
  </svg>
);

/** 에이전트: 핀이 달린 칩. */
export const AgentIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x={6} y={6} width={12} height={12} />
    <path d="M9.5 2.5V6M14.5 2.5V6M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5" />
    <rect x={10} y={10} width={4} height={4} />
  </Svg>
);

/** 사람: 머리와 어깨. */
export const HumanIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx={12} cy={7.5} r={4} />
    <path d="M3.5 21.5v-2.5a5 5 0 0 1 5-5h7a5 5 0 0 1 5 5v2.5" />
  </Svg>
);

/** 문제: 경고 삼각형. */
export const WarnIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3 22 20.5H2Z" />
    <path d="M12 9.5v5.5M12 17.6v.4" />
  </Svg>
);

/** 해결: 확인 표시. */
export const CheckIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4.5 12.5 10 18 19.5 6.5" />
  </Svg>
);

/** 폐루프: 닫힌 직각 고리와 화살촉. */
export const LoopIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M14.5 5H20v14H4V5h5.5" />
    <path d="M7 1.8 10.2 5 7 8.2" />
  </Svg>
);
