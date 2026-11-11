import { buildTiming } from "../lib";
import type { Durations, Script } from "../lib";
import durations from "./durations.json";
import { scenes } from "./scenes";
import script from "./script.json";

export const SHIFT_NO = 4;
export const timing = buildTiming(script as Script, durations as Durations);
export { scenes };
