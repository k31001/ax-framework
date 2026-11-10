import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { SCENE_COMPONENTS } from "./scenes";
import { color } from "./theme";
import { FPS, SCENES } from "./timeline";

// 영상 전체: timeline.ts 의 순서대로 씬을 잇는다.
// 씬 사이의 전환은 없다. 씬마다 같은 바탕(Sheet)을 그리고 내용물만 들어오고 나가므로 바탕이 끊기지 않는다.
// 배경음악은 여기에 넣는다(아직 없음).

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <Series>
        {SCENES.map((scene) => {
          const Scene = SCENE_COMPONENTS[scene.id];
          return (
            <Series.Sequence key={scene.id} name={`${scene.id} ${scene.name}`} durationInFrames={scene.seconds * FPS}>
              <Scene />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
