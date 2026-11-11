import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, Sequence, Series, staticFile } from "remotion";
import { NARRATION } from "./narration";
import { SCENE_COMPONENTS } from "./scenes";
import { color } from "./theme";
import { FPS, SCENES, sceneFrames, sceneStart } from "./timeline";

// 영상 전체: timeline.ts 의 순서대로 씬을 잇는다.
// 씬 사이의 전환은 없다. 씬마다 같은 바탕(Sheet)을 그리고 내용물만 들어오고 나가므로 바탕이 끊기지 않는다.
//
// 소리
// - 나레이션: audio/narration.py 로 만든 문장별 음성을 narration.ts 의 시점(audio/retime.py 가 계산)에 놓는다.
// - 배경음악: audio/make_bgm.py 로 만든 public/audio/bgm.mp3. 목소리가 나오는 동안 음량을 낮춘다.

const BGM_VOLUME = 0.7; // 목소리가 없을 때
const BGM_DUCKED = 0.22; // 목소리가 나올 때
const DUCK_RAMP = 10; // 낮추고 올리는 데 걸리는 프레임

const SPEECH: [number, number][] = NARRATION.map((line) => {
  const start = sceneStart(line.scene) + Math.round(line.at * FPS);
  return [start, start + Math.ceil(line.duration * FPS)];
});

/** 그 프레임에서 목소리에 얼마나 가까운가: 0(멀다) ~ 1(목소리 구간 안) */
const speechWeight = (frame: number): number => {
  let w = 0;
  for (const [a, b] of SPEECH) {
    if (frame >= a - DUCK_RAMP && frame <= b + DUCK_RAMP) {
      const d = frame < a ? a - frame : frame > b ? frame - b : 0;
      w = Math.max(w, 1 - d / DUCK_RAMP);
    }
  }
  return w;
};

export const bgmVolume = (frame: number): number =>
  interpolate(speechWeight(frame), [0, 1], [BGM_VOLUME, BGM_DUCKED]);

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <Html5Audio src={staticFile("audio/bgm.mp3")} volume={bgmVolume} />
      {NARRATION.map((line) => (
        <Sequence
          key={line.file}
          name={`voice ${line.file.replace("audio/narration/", "")}`}
          from={sceneStart(line.scene) + Math.round(line.at * FPS)}
          durationInFrames={Math.ceil(line.duration * FPS) + 6}
          layout="none"
        >
          <Html5Audio src={staticFile(line.file)} />
        </Sequence>
      ))}
      <Series>
        {SCENES.map((scene) => {
          const Scene = SCENE_COMPONENTS[scene.id];
          return (
            <Series.Sequence key={scene.id} name={`${scene.id} ${scene.name}`} durationInFrames={sceneFrames(scene.id)}>
              <Scene />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
