import type { SceneMap } from "../../lib";
import { S1 } from "./S1";
import { S2 } from "./S2";
import { S3 } from "./S3";
import { S4 } from "./S4";
import { S5 } from "./S5";
import { S6 } from "./S6";
import { S7 } from "./S7";
import { S8 } from "./S8";
import { S9 } from "./S9";
import { S10 } from "./S10";
import { S11 } from "./S11";
import { S12 } from "./S12";
import { S13 } from "./S13";
import { S14 } from "./S14";
import { S15 } from "./S15";
import { S16 } from "./S16";
import { S17 } from "./S17";

// 씬 id → 씬 컴포넌트. 여기에 없는 씬은 임시 화면(DraftScene)으로 나온다.
export const scenes: SceneMap = {
  s1: S1,
  s2: S2,
  s3: S3,
  s4: S4,
  s5: S5,
  s6: S6,
  s7: S7,
  s8: S8,
  s9: S9,
  s10: S10,
  s11: S11,
  s12: S12,
  s13: S13,
  s14: S14,
  s15: S15,
  s16: S16,
  s17: S17,
};
