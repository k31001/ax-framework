import type React from "react";
import type { SceneId } from "../timeline";
import { S1 } from "./S1";
import { S2 } from "./S2";
import { S3 } from "./S3";
import { S4 } from "./S4";
import { S5_1 } from "./S5_1";
import { S5_2 } from "./S5_2";
import { S5_3 } from "./S5_3";
import { S5_4 } from "./S5_4";
import { S5_5 } from "./S5_5";
import { S5_6 } from "./S5_6";
import { S5_7 } from "./S5_7";
import { S6 } from "./S6";
import { S7 } from "./S7";
import { S8 } from "./S8";
import { S9 } from "./S9";

// 씬 id → 씬 컴포넌트. Main 과 Root 가 이 표를 쓴다.
export const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  S1,
  S2,
  S3,
  S4,
  "S5-1": S5_1,
  "S5-2": S5_2,
  "S5-3": S5_3,
  "S5-4": S5_4,
  "S5-5": S5_5,
  "S5-6": S5_6,
  "S5-7": S5_7,
  S6,
  S7,
  S8,
  S9,
};
