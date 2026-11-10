import React from "react";
import { AbsoluteFill, Html5Audio, Series, staticFile } from "remotion";
import { SCENE_COMPONENTS } from "./scenes";
import { color } from "./theme";
import { FPS, SCENES } from "./timeline";

// 영상 전체: timeline.ts 의 순서대로 씬을 잇는다.
// 씬 사이의 전환은 없다. 씬마다 같은 바탕(Sheet)을 그리고 내용물만 들어오고 나가므로 바탕이 끊기지 않는다.
// 배경음악은 audio/make_bgm.py 로 만든 public/audio/bgm.mp3 이다. 길이와 구간이 timeline.ts 와 맞춰져 있다.

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <Html5Audio src={staticFile("audio/bgm.mp3")} />
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
