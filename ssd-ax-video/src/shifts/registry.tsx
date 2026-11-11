import React from "react";
import { Composition, Folder } from "remotion";
import { makeShiftScene, makeShiftVideo } from "./lib";
import type { SceneMap, ShiftTiming } from "./lib";
import * as shift1 from "./shift1";
import * as shift2 from "./shift2";
import * as shift3 from "./shift3";
import * as shift4 from "./shift4";
import * as shift5 from "./shift5";

// 5대 전환 상세 영상 5편.
//   Shift1 ~ Shift5      영상 전체
//   Shift1-s1 같은 id    씬 하나만 (미리보기·확인용)

const SHIFTS: { no: number; timing: ShiftTiming; scenes: SceneMap }[] = [shift1, shift2, shift3, shift4, shift5].map((m) => ({
  no: m.SHIFT_NO,
  timing: m.timing,
  scenes: m.scenes,
}));

const size = { width: 1920, height: 1080, fps: 30 };

export const ShiftCompositions: React.FC = () => (
  <>
    {SHIFTS.map(({ no, timing, scenes }) => (
      <Folder key={no} name={`Shift${no}`}>
        <Composition id={`Shift${no}`} component={makeShiftVideo(timing, no, scenes)} durationInFrames={timing.totalFrames} {...size} />
        {timing.scenes.map((scene) => (
          <Composition
            key={scene.id}
            id={`Shift${no}-${scene.id}`}
            component={makeShiftScene(timing, no, scenes, scene.id)}
            durationInFrames={scene.frames}
            {...size}
          />
        ))}
      </Folder>
    ))}
  </>
);
