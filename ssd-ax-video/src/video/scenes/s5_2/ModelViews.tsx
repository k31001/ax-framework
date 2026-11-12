import React from "react";
import { useCurrentFrame } from "remotion";
import { draw, ease, enterSvg, progress, sub } from "../../anim";
import { Pad, Trace, Via } from "../../components";
import { FIG } from "../../content";
import { color, stroke, withAlpha } from "../../theme";
import { Label } from "./Label";

// S5-2 탐색 그림의 위아래.
//   위   목적별 모델: 구조 기술 하나에서 모델 넷(지연·전력 / 면적 / 기능 / formal)이 파생된다
//   아래 탐색 결과를 보는 여섯 관점
// 가운데(산점도)는 ParetoPlot 이 그린다. 고른 구조의 상세도가 나오기 전에 둘 다 물러나 자리를 내준다.

const L = FIG["S5-2"];

/** 이 그림이 위쪽에서 차지하는 높이. 산점도는 그동안 이만큼 내려와 있다. */
export const MODELS_HEIGHT = 132;

const SRC = { x: 262, y: 0, w: 156, h: 46 } as const;
const SRC_CX = SRC.x + SRC.w / 2;
const BUS_Y = 59;
const CHIP = { y: 72, h: 46, gap: 16 } as const;
const CHIP_W = [172, 92, 92, 122] as const;
const CHIP_X0 = (680 - (CHIP_W.reduce((a, b) => a + b, 0) + CHIP.gap * (CHIP_W.length - 1))) / 2;
const CHIPS = CHIP_W.map((w, i) => {
  const x = CHIP_X0 + CHIP_W.slice(0, i).reduce((sum, v) => sum + v + CHIP.gap, 0);
  return { x, w, cx: x + w / 2 };
});

const VIEW = { y0: 458, w: 216, h: 46, gapX: 16, gapY: 12 } as const;

export const ModelViews: React.FC<{
  /** 모델이 파생되기 시작하는 프레임 */
  at: number;
  /** 관점이 켜지기 시작하는 프레임 */
  viewsAt: number;
  /** 물러나기 시작하는 프레임 */
  out: number;
}> = ({ at, viewsAt, out }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const gone = progress(frame, out, 10, ease.in);
  if (gone >= 1) return null;

  const src = progress(frame, at, 14);
  const bus = progress(frame, at + 10, 12, ease.inOut);

  return (
    <g opacity={1 - gone}>
      {/* 구조 기술: 원본 하나 */}
      <rect
        x={SRC.x}
        y={SRC.y + stroke.thin / 2}
        width={SRC.w}
        height={SRC.h - stroke.thin}
        fill={withAlpha(color.panel, 0.6 * src)}
        stroke={color.ink}
        strokeWidth={stroke.thin}
        {...(src < 1 ? draw(src, 2 * (SRC.w + SRC.h)) : {})}
      />
      <g opacity={sub(src, 0.3, 1)}>
        <Label x={SRC_CX} y={SRC.y + SRC.h / 2} text={L.source} anchor="middle" weight={700} fill={color.ink} />
        <Label x={SRC.x - 16} y={SRC.y + SRC.h / 2} text="rcv.arch.yaml" anchor="end" deco />
        <Label x={SRC.x + SRC.w + 16} y={SRC.y + SRC.h / 2} text="→ MODELS" deco />
      </g>

      {/* 원본에서 모델 넷으로 */}
      <Trace
        pts={[
          [SRC_CX, SRC.y + SRC.h],
          [SRC_CX, BUS_Y],
        ]}
        stroke={color.agent}
        progress={progress(frame, at + 8, 6, ease.linear)}
      />
      {CHIPS.map((c, i) => (
        <React.Fragment key={i}>
          <Trace
            pts={[
              [SRC_CX, BUS_Y],
              [c.cx, BUS_Y],
              [c.cx, CHIP.y],
            ]}
            stroke={color.agent}
            chamfer={6}
            progress={bus}
          />
          {(() => {
            const p = progress(frame, at + 20 + i * 4, 12);
            return p <= 0 ? null : (
              <g opacity={p} transform={`translate(0 ${(1 - p) * 8})`}>
                <rect
                  x={c.x}
                  y={CHIP.y}
                  width={c.w}
                  height={CHIP.h}
                  fill={withAlpha(color.agent, 0.08)}
                  stroke={color.agent}
                  strokeWidth={stroke.thin}
                />
                <Label x={c.cx} y={CHIP.y + CHIP.h / 2} text={L.models[i]} anchor="middle" fill={color.ink} />
              </g>
            );
          })()}
        </React.Fragment>
      ))}
      <Via x={SRC_CX} y={BUS_Y} stroke={color.agent} p={progress(frame, at + 12, 8)} />

      {/* 여섯 관점 */}
      <g {...enterSvg(frame, viewsAt - 4, { distance: 6 })}>
        <Label x={0} y={VIEW.y0 - 24} text="VIEWS" deco />
      </g>
      {L.views.map((name, i) => {
        const p = progress(frame, viewsAt + i * 5, 12);
        if (p <= 0) return null;
        const x = (i % 3) * (VIEW.w + VIEW.gapX);
        const y = VIEW.y0 + Math.floor(i / 3) * (VIEW.h + VIEW.gapY);
        return (
          <g key={name} opacity={p} transform={`translate(0 ${(1 - p) * 8})`}>
            <rect
              x={x + stroke.hair / 2}
              y={y}
              width={VIEW.w - stroke.hair}
              height={VIEW.h}
              fill={withAlpha(color.ink, 0.03)}
              stroke={color.lineStrong}
              strokeWidth={stroke.hair}
            />
            <Pad x={x + 20} y={y + VIEW.h / 2} fill={color.agent} p={sub(p, 0.4, 1)} />
            <Label x={x + 40} y={y + VIEW.h / 2} text={name} fill={color.ink} />
          </g>
        );
      })}
    </g>
  );
};
