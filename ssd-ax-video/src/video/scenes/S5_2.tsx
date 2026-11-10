import React from "react";
import { S5 } from "../content";
import { StageScene } from "../stage/StageScene";
import { ArchitectureSearch } from "./s5_2/ArchitectureSearch";

// S5-2 아키텍처 설계
// 그림만 이 단계의 것이다(s5_2/). 나머지는 StageScene 이 그린다.

export const S5_2: React.FC = () => <StageScene stage={S5[1]} Illustration={ArchitectureSearch} />;
