import React from "react";
import { S5 } from "../content";
import { StageScene } from "../stage/StageScene";
import { QualIllustration } from "./s5_7/QualIllustration";

// S5-7 제품 테스트 · 퀄
// 그림은 s5_7/QualIllustration.tsx. 나머지는 StageScene 이 그린다.

export const S5_7: React.FC = () => <StageScene stage={S5[6]} Illustration={QualIllustration} />;
