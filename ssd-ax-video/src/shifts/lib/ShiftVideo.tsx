import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, Sequence, Series, staticFile } from "remotion";
import { color } from "../../video/theme";
import { SceneProvider } from "./context";
import { DraftScene } from "./DraftScene";
import type { ShiftTiming } from "./timing";

// 5대 전환 상세 영상 하나. 씬을 순서대로 잇고, 문장별 나레이션과 배경음악을 놓는다.
// 배경음악은 본편의 것을 앞에서부터 쓰고, 목소리가 나오는 동안 낮추며, 끝에서 사라지게 한다.

const BGM_VOLUME = 0.6;
const BGM_DUCKED = 0.2;
const DUCK_RAMP = 10;
const BGM_FADE_OUT = 75;

export type SceneMap = Record<string, React.FC>;

export const makeShiftVideo = (timing: ShiftTiming, shiftNo: number, scenes: SceneMap): React.FC => {
  const speech: [number, number][] = [];
  for (const scene of timing.scenes) for (const line of scene.lines) speech.push([scene.start + line.at, scene.start + line.end]);
  const weight = (frame: number): number => {
    let w = 0;
    for (const [a, b] of speech) {
      if (frame >= a - DUCK_RAMP && frame <= b + DUCK_RAMP) {
        const d = frame < a ? a - frame : frame > b ? frame - b : 0;
        w = Math.max(w, 1 - d / DUCK_RAMP);
      }
    }
    return w;
  };
  const total = timing.totalFrames;
  const bgm = (frame: number): number =>
    interpolate(weight(frame), [0, 1], [BGM_VOLUME, BGM_DUCKED]) *
    interpolate(frame, [total - BGM_FADE_OUT, total - 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const Video: React.FC = () => (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <Html5Audio src={staticFile("audio/bgm.mp3")} volume={bgm} />
      {timing.scenes.map((scene) =>
        scene.lines.map((line) => (
          <Sequence key={line.id} name={`voice ${line.id}`} from={scene.start + line.at} durationInFrames={line.end - line.at + 6} layout="none">
            <Html5Audio src={staticFile(`audio/shifts/${timing.script.key}/${line.id}.mp3`)} />
          </Sequence>
        )),
      )}
      <Series>
        {timing.scenes.map((scene) => {
          const Scene = scenes[scene.id] ?? DraftScene;
          return (
            <Series.Sequence key={scene.id} name={`${scene.id} ${scene.name}`} durationInFrames={scene.frames}>
              <SceneProvider script={timing.script} shiftNo={shiftNo} scene={scene}>
                <Scene />
              </SceneProvider>
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
  return Video;
};

/** 씬 하나만 따로 보는 Composition 용 */
export const makeShiftScene = (timing: ShiftTiming, shiftNo: number, scenes: SceneMap, sceneId: string): React.FC => {
  const scene = timing.scenes.find((s) => s.id === sceneId);
  if (!scene) throw new Error(`unknown scene ${sceneId}`);
  const Scene = scenes[scene.id] ?? DraftScene;
  const Single: React.FC = () => (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      {scene.lines.map((line) => (
        <Sequence key={line.id} from={line.at} durationInFrames={line.end - line.at + 6} layout="none">
          <Html5Audio src={staticFile(`audio/shifts/${timing.script.key}/${line.id}.mp3`)} />
        </Sequence>
      ))}
      <SceneProvider script={timing.script} shiftNo={shiftNo} scene={scene}>
        <Scene />
      </SceneProvider>
    </AbsoluteFill>
  );
  return Single;
};
