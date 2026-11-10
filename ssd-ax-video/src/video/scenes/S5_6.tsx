import React from "react";
import { S5 } from "../content";
import { StageScene } from "../stage/StageScene";
import { FwLoopIllustration } from "./s5_6/FwLoopIllustration";

// S5-6 FW 개발
// 그림은 s5_6/FwLoopIllustration.tsx. 나머지는 StageScene 이 그린다.

export const S5_6: React.FC = () => <StageScene stage={S5[5]} Illustration={FwLoopIllustration} />;
