import React from "react";
import { S5 } from "../content";
import { StageScene } from "../stage/StageScene";
import { S55Illustration } from "./s5_5/Illustration";

// S5-5 Emulation · FPGA
// 그림(s5_5/Illustration.tsx): HW 파형과 FW trace 두 줄, 고장 시점의 확대 창(완료 두 건이 비트 하나에 겹친다 → 큐).
// 나머지는 StageScene 이 그린다.

export const S5_5: React.FC = () => <StageScene stage={S5[4]} Illustration={S55Illustration} />;
