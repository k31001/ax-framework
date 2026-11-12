import { buildTiming } from "../lib";
import type { Durations, Script } from "../lib";
import durations from "./durations.json";
import { scenes } from "./scenes";
import script from "./script.json";

// 구조 설계 편. 5대 전환 번호가 아니라 script.json 의 series 로 표기한다.
export const SHIFT_NO = 0;
export const timing = buildTiming(script as Script, durations as Durations);
export { scenes };
