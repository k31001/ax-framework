import type { FC } from "react";
import { Composition } from "remotion";
import { S3Scene } from "./scenes/S3";
import { S54Scene } from "./scenes/S54";
import { S6Scene } from "./scenes/S6";
import { CANVAS } from "./theme";

const still = {
  width: CANVAS.width,
  height: CANVAS.height,
  fps: CANVAS.fps,
  durationInFrames: 1,
} as const;

export const Root: FC = () => (
  <>
    <Composition id="B-S3" component={S3Scene} {...still} />
    <Composition id="B-S54" component={S54Scene} {...still} />
    <Composition id="B-S6" component={S6Scene} {...still} />
  </>
);
