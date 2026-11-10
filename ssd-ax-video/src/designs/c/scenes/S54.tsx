// S5-4 시뮬레이션 검증. 사례 구간의 대표 장면.
// 스틸은 모든 항목이 나타난 마지막 상태다: 하이라이트는 마지막 항목(해결)에 있다.

import { S5_4 } from "../../shared/content";
import { Badge } from "../components/Badge";
import { Canvas } from "../components/Canvas";
import { BOARD, SwimlaneBoard } from "../components/FlowBoard";
import { PrincipleBadge } from "../components/PrincipleBadge";
import { layoutStages, ProgressStrip, STRIP_H } from "../components/ProgressStrip";
import { CLUSTER_COUNTS, RegressionClusters, Waveform } from "../components/Props";
import { RequirementCard } from "../components/RequirementCard";
import { WindowPanel } from "../components/WindowPanel";
import { C, FRAME, KR, SAFE, T } from "../theme";

const W = FRAME.w - SAFE.x * 2;

// 세로 배치
const STRIP_Y = SAFE.y;
const CARD_Y = STRIP_Y + STRIP_H + 14;
const CARD_W = 984;
const CARD_H = 138;
const BOARD_Y = CARD_Y + CARD_H + 20;
const LANE_H = 216;
const BOARD_H = BOARD.headH + LANE_H * 2;
const BAND_Y = BOARD_Y + BOARD_H + 20;
const BAND_H = FRAME.h - SAFE.y - BAND_Y;

// 아래 띠의 가로 배치
const REG_W = 500;
const WAVE_W = 392;
const PRINCIPLE_X = SAFE.x + REG_W + 18 + WAVE_W + 20;

export const S54: React.FC = () => {
  const boxes = layoutStages(S5_4.stages, S5_4.stageIndex, W);
  const cx = boxes[S5_4.stageIndex].cx;
  const cardX = Math.max(0, Math.min(W - CARD_W, cx - CARD_W / 2));
  const failures = CLUSTER_COUNTS.reduce((a, b) => a + b, 0);

  return (
    <Canvas>
      {/* 위: 7단계 진행 표시와 요구사항 카드 */}
      <div style={{ position: "absolute", left: SAFE.x, top: STRIP_Y }}>
        <ProgressStrip stages={S5_4.stages} current={S5_4.stageIndex} width={W} boxes={boxes} />
      </div>
      <RequirementCard
        req={S5_4.card}
        notchX={cx - cardX}
        pendingSlot={S5_4.stageIndex + 1}
        style={{ left: SAFE.x + cardX, top: CARD_Y, width: CARD_W, height: CARD_H }}
      />

      {/* 본문: 두 줄 흐름도 */}
      <SwimlaneBoard
        x={SAFE.x}
        y={BOARD_Y}
        width={W}
        laneH={LANE_H}
        steps={S5_4.steps}
        lanes={S5_4.lanes}
        active={S5_4.steps.length - 1}
        header={
          // "현재" 한 줄: 먼저 나왔다가 흐려진 상태
          <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: 0.5 }}>
            <Badge tone="neutral" style={{ height: 38, padding: "0 12px" }}>
              {S5_4.before.label}
            </Badge>
            <span style={{ ...KR, fontSize: T.label, fontWeight: 500, color: C.ink2, whiteSpace: "nowrap" }}>
              {S5_4.before.text}
            </span>
          </div>
        }
      />

      {/* 아래 띠: 이 장면의 그림(regression 묶음, 파형)과 원칙 표식 */}
      <WindowPanel
        title="regression / nightly"
        accent={C.problem}
        elevation="card"
        right={
          <Badge size="sm" tone="problem" mono dot>
            {failures} failed
          </Badge>
        }
        style={{ left: SAFE.x, top: BAND_Y, width: REG_W, height: BAND_H }}
      >
        <div style={{ position: "absolute", left: 14, top: 8, right: 14, bottom: 4 }}>
          <RegressionClusters width={REG_W - 28} height={BAND_H - 42 - 14} selected={0} spacing={3.1} dot={1.9} />
        </div>
      </WindowPanel>
      <WindowPanel
        title="wave / cluster 1"
        accent={C.agent}
        elevation="card"
        right={
          <Badge size="sm" tone="neutral" mono>
            seed 4127
          </Badge>
        }
        style={{ left: SAFE.x + REG_W + 18, top: BAND_Y, width: WAVE_W, height: BAND_H }}
      >
        <div style={{ position: "absolute", left: 18, top: 14, right: 18, bottom: 14 }}>
          <Waveform width={WAVE_W - 36} height={BAND_H - 42 - 30} />
        </div>
      </WindowPanel>
      <PrincipleBadge
        principle={S5_4.principle}
        style={{ left: PRINCIPLE_X, top: BAND_Y, width: FRAME.w - SAFE.x - PRINCIPLE_X, height: BAND_H }}
      />
    </Canvas>
  );
};
