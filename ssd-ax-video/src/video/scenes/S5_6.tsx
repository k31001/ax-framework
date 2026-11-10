import React from "react";
import { S5 } from "../content";
import { PlaceholderIllustration } from "../stage/PlaceholderIllustration";
import { StageScene } from "../stage/StageScene";

// S5-6 FW 개발
// 그림(PlaceholderIllustration)만 이 단계의 그림으로 바꾼다. 나머지는 StageScene 이 그린다.
// 그림 컴포넌트는 Illustration 타입(stage/StageScene.tsx)을 따른다.

export const S5_6: React.FC = () => <StageScene stage={S5[5]} Illustration={PlaceholderIllustration} />;
