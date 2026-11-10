import React from "react";
import { DraftScene } from "../components/DraftScene";
import { S1 as content } from "../content";

// S1 Hook — 임시 씬. 씬 제작자가 통째로 다시 만든다.

export const S1: React.FC = () => <DraftScene id="S1" lines={content.captions} />;
