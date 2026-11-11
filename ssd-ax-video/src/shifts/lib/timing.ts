// 5대 전환 상세 영상의 시간 계산. 나레이션이 시간을 정한다.
// script.json 의 문장(line)을 차례로 놓고, 문장 길이(durations.json, audio/narrate_shift.py 가 만든다)로
// 각 문장의 시작 프레임과 씬 길이를 정한다. 화면 요소는 문장 id 에 맞춰 나타난다.

export const FPS = 30;

export type ScriptLine = { id: string; text: string; say: string; caption?: string };
export type ScriptScene = { id: string; name: string; visual?: string; lines: ScriptLine[] };
export type Script = { key: string; axis: string; from: string; to: string; scenes: ScriptScene[] };
export type Durations = Record<string, number>;

const LEAD = 0.6; // 씬이 시작되고 첫 문장까지 (초)
const GAP = 0.45; // 문장 사이 쉼
const TAIL = 1.1; // 마지막 문장 뒤 여유
const END_HOLD = 2.5; // 영상의 마지막 씬은 조금 더 머문다
const CHARS_PER_SEC = 6.7; // 음성이 아직 없을 때의 추정

export type LineTiming = ScriptLine & {
  /** 씬 시작 기준, 목소리가 시작되는 프레임 */
  at: number;
  /** 목소리가 끝나는 프레임 */
  end: number;
  seconds: number;
};
export type SceneTiming = {
  id: string;
  name: string;
  index: number;
  count: number;
  /** 영상 시작 기준 프레임 */
  start: number;
  frames: number;
  lines: LineTiming[];
};
export type ShiftTiming = { script: Script; scenes: SceneTiming[]; totalFrames: number };

export const buildTiming = (script: Script, durations: Durations): ShiftTiming => {
  let start = 0;
  const scenes = script.scenes.map((scene, index) => {
    let t = LEAD;
    const lines = scene.lines.map((line) => {
      const seconds = durations[line.id] ?? line.say.length / CHARS_PER_SEC;
      const at = Math.round(t * FPS);
      const end = at + Math.ceil(seconds * FPS);
      t += seconds + GAP;
      return { ...line, at, end, seconds };
    });
    const last = index === script.scenes.length - 1;
    const frames = Math.round((t - GAP + TAIL + (last ? END_HOLD : 0)) * FPS);
    const timing: SceneTiming = { id: scene.id, name: scene.name, index, count: script.scenes.length, start, frames, lines };
    start += frames;
    return timing;
  });
  return { script, scenes, totalFrames: start };
};
