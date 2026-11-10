import React from "react";
import { S5 } from "../content";
import { StageScene } from "../stage/StageScene";
import { S54Illustration } from "./s5_4/Illustration";

// S5-4 시뮬레이션 검증
// 그림(s5_4/Illustration.tsx): 실패 312건의 점이 원인 4개로 모이고, 한 묶음이 파형의 겹치는 cycle 로 이어진다.
// 나머지는 StageScene 이 그린다.

export const S5_4: React.FC = () => <StageScene stage={S5[3]} Illustration={S54Illustration} />;
