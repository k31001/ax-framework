import React, { createContext, useContext } from "react";
import type { LineTiming, SceneTiming, Script } from "./timing";

// 씬 안에서 쓰는 시간 정보.
//   const { cue, end, frames } = useScene();
//   cue("s3.2")  → 그 문장의 목소리가 시작되는 프레임(씬 시작 기준). 화면 요소를 이 프레임에 등장시킨다
//   end("s3.2")  → 그 문장이 끝나는 프레임
//   frames       → 이 씬의 길이

export type SceneApi = {
  script: Script;
  /** 5대 전환 중 몇 번째인가 (1~5) */
  shiftNo: number;
  scene: SceneTiming;
  frames: number;
  lines: LineTiming[];
  line: (id: string) => LineTiming;
  cue: (id: string) => number;
  end: (id: string) => number;
};

const Ctx = createContext<SceneApi | null>(null);

export const SceneProvider: React.FC<{ script: Script; shiftNo: number; scene: SceneTiming; children: React.ReactNode }> = ({
  script,
  shiftNo,
  scene,
  children,
}) => {
  const line = (id: string): LineTiming => {
    const found = scene.lines.find((l) => l.id === id);
    if (!found) throw new Error(`line ${id} is not in scene ${scene.id}`);
    return found;
  };
  const api: SceneApi = {
    script,
    shiftNo,
    scene,
    frames: scene.frames,
    lines: scene.lines,
    line,
    cue: (id) => line(id).at,
    end: (id) => line(id).end,
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
};

export const useScene = (): SceneApi => {
  const api = useContext(Ctx);
  if (!api) throw new Error("useScene must be used inside a shift scene");
  return api;
};
