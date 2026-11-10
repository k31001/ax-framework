import type { FC } from "react";
import { COLOR, RULE } from "../theme";

type RuleProps = {
  x: number;
  y: number;
  length: number;
  weight?: number;
  color?: string;
};

// 가로 괘선. 영상에서는 왼쪽에서 오른쪽으로 그어진다.
export const HRule: FC<RuleProps> = ({
  x,
  y,
  length,
  weight = RULE.hair,
  color = COLOR.ink,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: length,
      height: weight,
      backgroundColor: color,
    }}
  />
);

// 세로 괘선.
export const VRule: FC<RuleProps> = ({
  x,
  y,
  length,
  weight = RULE.hair,
  color = COLOR.ink,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: weight,
      height: length,
      backgroundColor: color,
    }}
  />
);
