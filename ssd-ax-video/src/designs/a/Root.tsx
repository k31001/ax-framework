import React from "react";
import { Composition } from "remotion";
import { S3 } from "./scenes/S3";
import { S54 } from "./scenes/S54";
import { S6 } from "./scenes/S6";
import { FRAME } from "./theme";

const still = { width: FRAME.w, height: FRAME.h, fps: 30, durationInFrames: 1 } as const;

export const Root: React.FC = () => {
  return (
    <>
      <Composition id="A-S3" component={S3} {...still} />
      <Composition id="A-S54" component={S54} {...still} />
      <Composition id="A-S6" component={S6} {...still} />
    </>
  );
};
