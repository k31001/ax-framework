import React from "react";
import { Composition, Folder } from "remotion";
import { Main } from "./video/Main";
import { SCENE_COMPONENTS } from "./video/scenes";
import { FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH } from "./video/timeline";

// Main  영상 전체 (5610프레임)
// S1, S2, … S5-4, … S9  씬 하나씩. 그 씬만 미리 보거나 렌더할 때 쓴다.

const size = { width: WIDTH, height: HEIGHT, fps: FPS } as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Main" component={Main} durationInFrames={TOTAL_FRAMES} {...size} />
      <Folder name="Scenes">
        {SCENES.map((scene) => (
          <Composition
            key={scene.id}
            id={scene.id}
            component={SCENE_COMPONENTS[scene.id]}
            durationInFrames={scene.seconds * FPS}
            {...size}
          />
        ))}
      </Folder>
    </>
  );
};
