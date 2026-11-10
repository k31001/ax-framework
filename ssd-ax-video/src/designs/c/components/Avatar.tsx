// 에이전트와 사람의 아바타. 역할 색을 가장 뚜렷하게 쓰는 자리다.

import { C } from "../theme";
import { PersonIcon, SparkIcon } from "./Icons";

export const Avatar: React.FC<{ role: "agent" | "human"; size?: number }> = ({ role, size = 56 }) => {
  const agent = role === "agent";
  return (
    <div
      style={{
        width: size,
        height: size,
        // 에이전트는 둥근 사각형, 사람은 원: 색을 못 봐도 모양으로 구분된다.
        borderRadius: agent ? size * 0.28 : size / 2,
        backgroundColor: agent ? C.agent : C.human,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 0 0 ${Math.max(3, size * 0.07)}px ${agent ? C.agentSoft : C.humanSoft}`,
      }}
    >
      {agent ? (
        <SparkIcon size={size * 0.62} color="#FFFFFF" />
      ) : (
        <PersonIcon size={size * 0.62} color="#FFFFFF" />
      )}
    </div>
  );
};
