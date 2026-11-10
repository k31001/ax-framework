/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// 이 클라우드 환경에는 Chrome Headless Shell이 미리 설치돼 있다.
// 경로가 없으면(로컬 PC 등) Remotion이 기본 브라우저를 내려받아 쓴다.
import { existsSync } from "node:fs";
const preinstalled =
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
if (existsSync(preinstalled)) {
  Config.setBrowserExecutable(preinstalled);
}
