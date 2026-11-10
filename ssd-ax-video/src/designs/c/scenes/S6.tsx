// S6 5대 전환. 다섯 축을 스위치 다섯 개로 보여 준다: 모두 "전환 후" 쪽으로 넘어간 상태.

import { S6 as CONTENT } from "../../shared/content";
import { Badge } from "../components/Badge";
import { Canvas } from "../components/Canvas";
import { MiniScene } from "../components/MiniScenes";
import { SWITCH, switchWidth, TransitionSwitch } from "../components/TransitionSwitch";
import { C, FRAME, KR, MONO_TXT, SAFE, T } from "../theme";

const AXIS_X = SAFE.x;
const SWITCH_X = 392;
const ROW_Y = 286;
const ROW_PITCH = SWITCH.h + 21;

// 오른쪽: 사례의 장면이 작은 창으로 돌아와 축마다 하나씩 정리된다.
const MINI_W = 300;
const MINI_X = FRAME.w - SAFE.x - MINI_W;

export const S6: React.FC = () => (
  <Canvas>
    <div
      style={{
        ...KR,
        position: "absolute",
        left: AXIS_X - 4,
        top: SAFE.y - 6,
        fontSize: T.title,
        lineHeight: "124px",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        color: C.ink,
        whiteSpace: "nowrap",
      }}
    >
      {CONTENT.title}
    </div>

    {/* 두 상태의 이름: 스위치의 왼쪽 칸과 오른쪽 칸 위에 붙는다 */}
    <div style={{ position: "absolute", left: SWITCH_X + SWITCH.pad + 22, top: ROW_Y - 62 }}>
      <Badge tone="neutral">{CONTENT.columns.before}</Badge>
    </div>
    <div style={{ position: "absolute", left: SWITCH_X + SWITCH.pad + SWITCH.beforeW + 22, top: ROW_Y - 62 }}>
      <Badge tone="agent" solid dot>
        {CONTENT.columns.after}
      </Badge>
    </div>

    {CONTENT.rows.map((row, i) => {
      const top = ROW_Y + i * ROW_PITCH;
      return (
        <div key={row.axis}>
          <div
            style={{
              position: "absolute",
              left: AXIS_X,
              top,
              height: SWITCH.h,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <span style={{ ...MONO_TXT, fontSize: T.prop, fontWeight: 700, color: C.ink4 }}>0{i + 1}</span>
            <span style={{ ...KR, fontSize: T.item, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>
              {row.axis}
            </span>
          </div>
          <TransitionSwitch before={row.before} after={row.after} left={SWITCH_X} top={top} />
          {/* 스위치에서 사례 장면으로 이어지는 점선 */}
          <div
            style={{
              position: "absolute",
              left: SWITCH_X + switchWidth(row.after) + 18,
              top: top + SWITCH.h / 2 - 1,
              width: MINI_X - (SWITCH_X + switchWidth(row.after)) - 36,
              borderTop: `3px dotted ${C.ink4}`,
            }}
          />
          <div style={{ opacity: 0.78 }}>
            <MiniScene index={i} left={MINI_X} top={top} width={MINI_W} height={SWITCH.h} />
          </div>
        </div>
      );
    })}
  </Canvas>
);
