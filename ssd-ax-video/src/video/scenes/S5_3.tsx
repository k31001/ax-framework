import React from "react";
import { S5 } from "../content";
import { StageScene } from "../stage/StageScene";
import { ContractAndPpa } from "./s5_3/ContractAndPpa";

// S5-3 IP 설계 · PPA
// 그림만 이 단계의 것이다(s5_3/). 나머지는 StageScene 이 그린다.

export const S5_3: React.FC = () => <StageScene stage={S5[2]} Illustration={ContractAndPpa} />;
