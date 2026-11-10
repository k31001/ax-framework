// 인라인 SVG 아이콘. 모두 24×24 격자에 그리고 size로 키운다.

import type { CSSProperties } from "react";

type IconProps = { size?: number; color?: string; stroke?: number; style?: CSSProperties };

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 24,
  color = "currentColor",
  stroke = 2.4,
  style,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

export const CheckIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5 12.5l4.6 4.6L19 7.5" />
  </Svg>
);

export const AlertIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3.6l9.2 16H2.8l9.2-16z" />
    <path d="M12 10v4.4" />
    <path d="M12 17.2v.1" />
  </Svg>
);

export const ArrowIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 12h15" />
    <path d="M13.5 6l6 6-6 6" />
  </Svg>
);

/** 닫힌 고리: 폐루프. */
export const LoopIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M19.5 12a7.5 7.5 0 0 1-13.2 4.9" />
    <path d="M4.5 12a7.5 7.5 0 0 1 13.2-4.9" />
    <path d="M17.9 3.4v3.9h-3.9" />
    <path d="M6.1 20.6v-3.9h3.9" />
  </Svg>
);

/** 에이전트 표식: 네 갈래 반짝임. */
export const SparkIcon: React.FC<IconProps> = ({ size = 24, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, ...style }}>
    <path
      d="M11 2.5C11.6 8 14 10.400 19.500 11C14 11.600 11.600 14 11 19.500C10.400 14 8 11.600 2.500 11C8 10.400 10.400 8 11 2.500Z"
      fill={color}
    />
    <circle cx="18.800" cy="18.800" r="2.200" fill={color} />
  </svg>
);

/** 사람 표식: 머리와 어깨. */
export const PersonIcon: React.FC<IconProps> = ({ size = 24, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, ...style }}>
    <circle cx="12" cy="8.200" r="4.200" fill={color} />
    <path d="M3.800 21c.6-4.800 3.900-7.200 8.200-7.200s7.600 2.400 8.200 7.200z" fill={color} />
  </svg>
);

/** 창 머리줄 왼쪽의 작은 표식. */
export const WindowGlyph: React.FC<{ color: string; size?: number }> = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ display: "block", flexShrink: 0 }}>
    <rect x="1" y="1" width="6" height="6" rx="1.500" fill={color} />
    <rect x="9" y="1" width="6" height="6" rx="1.500" fill={color} opacity="0.45" />
    <rect x="1" y="9" width="6" height="6" rx="1.500" fill={color} opacity="0.45" />
    <rect x="9" y="9" width="6" height="6" rx="1.500" fill={color} opacity="0.45" />
  </svg>
);
