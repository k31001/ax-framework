// 씬 순서와 길이. 길이를 바꾸면 영상 전체 길이와 배경음악 구간이 함께 바뀐다.
// 배경음악(public/audio/bgm.*)은 이 표의 경계에 맞춰 만든다.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const SCENES = [
  { id: "S1", name: "Hook", seconds: 11 },
  { id: "S2", name: "문제", seconds: 16 },
  { id: "S3", name: "전환 선언", seconds: 13 },
  { id: "S4", name: "사례 소개", seconds: 12.5 },
  { id: "S4J", name: "Jira 추적", seconds: 19 },
  { id: "S5-1", name: "요구사항 분석", seconds: 15 },
  { id: "S5-2", name: "아키텍처 설계", seconds: 25 },
  { id: "S5-3", name: "IP 설계 · PPA", seconds: 20.5 },
  { id: "S5-4", name: "시뮬레이션 검증", seconds: 30 },
  { id: "S5-5", name: "Emulation · FPGA", seconds: 26 },
  { id: "S5-6", name: "FW 개발", seconds: 21.5 },
  { id: "S5-7", name: "제품 테스트 · 퀄", seconds: 34.5 },
  { id: "S6", name: "5대 전환", seconds: 22.5 },
  { id: "S7", name: "책임", seconds: 12.5 },
  { id: "S8", name: "로드맵", seconds: 14.5 },
  { id: "S9", name: "Closing", seconds: 17.5 },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

export const sceneFrames = (id: SceneId): number => {
  const scene = SCENES.find((s) => s.id === id);
  if (!scene) throw new Error(`unknown scene: ${id}`);
  return Math.round(scene.seconds * FPS);
};

/** 영상 시작부터 그 씬이 시작될 때까지의 프레임 수 */
export const sceneStart = (id: SceneId): number => {
  let frames = 0;
  for (const scene of SCENES) {
    if (scene.id === id) return frames;
    frames += Math.round(scene.seconds * FPS);
  }
  throw new Error(`unknown scene: ${id}`);
};

export const TOTAL_SECONDS = SCENES.reduce((sum, s) => sum + s.seconds, 0);
export const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * FPS);

/** 도면 테두리의 장식 라벨. 예: "SHEET 03 / 15" */
export const sheetLabel = (id: SceneId): string => {
  const n = SCENES.findIndex((s) => s.id === id) + 1;
  return `SHEET ${n < 10 ? `0${n}` : n} / ${SCENES.length}`;
};
