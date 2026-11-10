import React from "react";
import { S5 } from "../content";
import { StageScene } from "../stage/StageScene";
import { RequirementGraph } from "./s5_1/RequirementGraph";

// S5-1 요구사항 분석
// 그림만 이 단계의 것이다(s5_1/). 나머지는 StageScene 이 그린다.

export const S5_1: React.FC = () => <StageScene stage={S5[0]} Illustration={RequirementGraph} />;
