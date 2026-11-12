import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DUR, ease, enter, f, progress, sceneFade } from "../anim";
import { BEFORE_LABEL, CARD, LANES, S5, STAGES } from "../content";
import type { BeatKind, Stage } from "../content";
import { BeforeLine, beforeHeight } from "../components/BeforeLine";
import { ContextLine } from "../components/ContextLine";
import { Flow, ITEM_ENTER, flagRect, flowRect } from "../components/Flow";
import type { Box, FlowItem } from "../components/Flow";
import { ReturnIcon } from "../components/Icons";
import { NoteBanner } from "../components/NoteBanner";
import { PrincipleStrip } from "../components/PrincipleStrip";
import { RequirementCard } from "../components/RequirementCard";
import { SceneFade, Sheet } from "../components/Sheet";
import { StageTrack } from "../components/StageTrack";
import type { FlowKind } from "../theme";
import { color, mono, pad2, sans, size, stroke, withAlpha } from "../theme";
import type { SceneId } from "../timeline";
import { sceneFrames } from "../timeline";
import { BODY, STAGE_COUNT, TITLE_POS, TRACK_Y, cardAnchor, cardRect, recordSlotAt, stageLayout } from "./layout";

// 사례 7단계(S5-1 ~ S5-7)의 공통 씬.
// content.ts 의 Stage 하나와 그 단계의 "그림" 하나를 받아 씬 전체를 그린다.
//
// 한 씬 안의 순서
//   0f        요구사항 카드와 진행 표시의 고리가 앞 단계 자리에서 이 단계 자리로 옮겨 온다 (24f)
//             단계 제목이 들어온다
//   before.at "현재" 한 줄이 본문 자리에 크게 나온다
//   context.at (있는 단계만) 배경 문구가 본문 위쪽에 크게 나온다. 그 아래 본문 전체는 그림이 쓴다.
//             "현재"보다 먼저 오면 "현재"가 나올 때 물러나고, 뒤에 오면 "현재"를 머리 쪽으로 보내고 나온다.
//   첫 항목 20f 전  "현재"가 머리 쪽으로 물러나고, 두 줄의 바탕이 그려진다
//   beat.at   항목이 순서대로 나타난다 (직전 항목에서 연결선이 먼저 그려진다)
//   recordAt  이 단계의 기록이 카드에 붙는다
//   마지막 8f 내용물이 사라진다. 카드와 진행 표시는 남아 다음 단계로 이어진다.

// ── 그림 인터페이스 ────────────────────────────────────────────────────
export type IllustrationBeat = {
  kind: BeatKind;
  text: string;
  /** 등장 프레임 (씬 시작 기준) */
  frame: number;
  /** 흐름도 번호(1부터). context·before·note 는 0 */
  index: number;
  /** 흐름도에서 이 항목이 차지하는 사각형. 그림 자리의 왼쪽 위가 (0,0). context·before·note 는 null */
  rect: Box | null;
  /** 문제 항목만: 깃발이 차지하는 사각형(rect 는 trace 위의 마름모다). 그림 자리 좌표 */
  flag?: Box;
};

export type IllustrationProps = {
  stage: Stage;
  /** 그림 자리의 크기(px). 그림은 (0,0) ~ (width,height) 안에 그린다. */
  width: number;
  height: number;
  /** 그림 자리 왼쪽 위의 화면 좌표 */
  origin: { x: number; y: number };
  /** 이 단계의 모든 beat (content.ts 의 순서). 등장 프레임이 들어 있다. */
  beats: IllustrationBeat[];
  /** 자주 쓰는 시점 (프레임, 씬 시작 기준) */
  frames: {
    /** "현재" 한 줄이 나오는 시점 */
    before: number;
    /** 배경 문구가 나오는 시점과 물러나기 시작하는 시점. 없으면 null. 그 사이에는 본문 전체(layout 의 BODY)가 비어 있다. */
    context: number | null;
    contextOut: number | null;
    /** "현재"가 물러나고 흐름도가 그려지기 시작하는 시점 */
    flowStart: number;
    /** 문제가 나타나는 시점. 없으면 null */
    problem: number | null;
    /** 해결되는 시점. 없으면 null */
    resolved: number | null;
    /** 기록이 요구사항 카드에 붙는 시점 */
    record: number;
    principle: number | null;
    note: number | null;
    closing: number | null;
    /** 씬의 길이 */
    end: number;
  };
  /** 요구사항 카드와 기록 슬롯 7칸의 중심. 그림 자리 좌표. 그림이 카드의 기록과 이어질 때 쓴다. */
  card: { rect: Box; slots: { x: number; y: number }[] };
};

export type Illustration = React.FC<IllustrationProps>;

// ── 씬 ─────────────────────────────────────────────────────────────────
const RECORDS = S5.map((s) => s.record);
const RECORD_KEYS = S5.map((s) => s.jira);
const MOVE = DUR.move;
const ATTACH = 18;

const isFlowKind = (kind: BeatKind): kind is FlowKind => kind !== "context" && kind !== "before" && kind !== "note";

export const StageScene: React.FC<{
  stage: Stage;
  Illustration: Illustration;
}> = ({ stage, Illustration }) => {
  const frame = useCurrentFrame();
  const id = stage.id as SceneId;
  const duration = sceneFrames(id);
  const layout = stageLayout(stage.id);
  const first = stage.index === 0;
  const last = stage.index === STAGE_COUNT - 1;

  // ── 시점 ──
  const before = stage.beats.filter((b) => b.kind === "before")[0];
  const context = stage.beats.filter((b) => b.kind === "context")[0];
  const note = stage.beats.filter((b) => b.kind === "note")[0];
  // 강조 문구는 다음 흐름도 항목이 나오기 직전에 물러난다. 다음 항목이 없으면 원칙 띠가 나오기 전에.
  const afterNote = note ? stage.beats.find((b) => b.at > note.at && b.kind !== "note") : undefined;
  const flowBeats = stage.beats.filter((b) => isFlowKind(b.kind));
  if (flowBeats.length !== layout.slots.length) {
    throw new Error(`${stage.id}: 흐름도 항목 ${flowBeats.length}개, 배치 설정 ${layout.slots.length}개`);
  }
  const items: FlowItem[] = flowBeats.map((b, i) => ({
    kind: b.kind as FlowKind,
    text: b.text,
    at: f(b.at),
    slot: layout.slots[i],
  }));
  const flowStart = items[0].at - 20;
  const lanesAt = items[0].at - 16;
  const recordAt = f(stage.recordAt);
  const principleAt = stage.principle ? f(stage.principle.at) : null;
  const noteOut = afterNote ? f(afterNote.at) - 8 : principleAt === null ? undefined : principleAt - 12;
  const closingAt = stage.closing ? f(stage.closing.at) : null;
  // 배경 문구는 다음 항목 직전에 물러난다. 다음이 흐름도 항목이면 흐름도가 그려지기 전에 자리를 비운다.
  const afterContext = context ? stage.beats.find((b) => b.at > context.at && b.kind !== "context") : undefined;
  const contextAt = context ? f(context.at) : null;
  const contextOut =
    contextAt === null
      ? null
      : (afterContext && !isFlowKind(afterContext.kind) ? f(afterContext.at) : flowStart) - DUR.exit;
  // "현재" 뒤에 배경 문구가 오면 "현재"는 그 앞에서 머리 쪽으로 물러난다.
  const beforeOut =
    before && context && contextAt !== null && context.at > before.at ? Math.min(flowStart, contextAt - 20) : flowStart;

  // ── 카드와 진행 표시: 앞 단계에서 이 단계로 ──
  const move = first ? 1 : progress(frame, 0, MOVE, ease.inOut);
  const position = first ? 0 : stage.index - 1 + move;
  const card = cardRect(position);
  const anchor = cardAnchor(position);
  // 첫 단계는 S4 에서 넘어온다: 진행 표시가 그려지고 카드가 나타나는 것으로 시작한다.
  const trackAppear = first ? progress(frame, 2, 36, ease.inOut) : 1;
  const cardAppear = first ? progress(frame, 8, 32, ease.inOut) : 1;
  const attached = stage.index + progress(frame, recordAt, ATTACH, ease.out);
  // 붙은 직후의 강조는 씬이 끝나기 전에 가라앉는다(다음 단계의 첫 프레임과 이어져야 한다).
  const settle = Math.max(8, Math.min(45, duration - 2 - (recordAt + ATTACH)));
  const flash = frame < recordAt ? 0 : 1 - progress(frame, recordAt + ATTACH, settle, ease.linear);
  const loop = closingAt === null ? 0 : progress(frame, closingAt + 6, 44, ease.inOut);
  // 카드와 진행 표시는 단계 사이에 끊기지 않는다. 마지막 단계에서만 내용물과 함께 사라진다.
  const persist = last ? sceneFade(frame, duration, { in: false }) : 1;

  // ── 그림에 넘길 값 ──
  const box = layout.illustration;
  const toLocal = (r: Box): Box => ({ x: r.x - box.x, y: r.y - box.y, w: r.w, h: r.h });
  let n = 0;
  const beats: IllustrationBeat[] = stage.beats.map((b) => {
    if (!isFlowKind(b.kind)) return { kind: b.kind, text: b.text, frame: f(b.at), index: 0, rect: null };
    const item = items[n++];
    return {
      kind: b.kind,
      text: b.text,
      frame: item.at,
      index: n,
      rect: toLocal(flowRect(layout.flow, item)),
      flag: item.slot.type === "problem" ? toLocal(flagRect(layout.flow, item.slot)) : undefined,
    };
  });
  const frameOf = (kind: BeatKind): number | null => {
    const hit = stage.beats.filter((b) => b.kind === kind)[0];
    return hit ? f(hit.at) : null;
  };
  const home = cardRect(stage.index);
  const slots = RECORDS.map((_, i) => {
    const c = recordSlotAt(stage.index, i);
    return { x: c.x - box.x, y: c.y - box.y };
  });

  const beforeLines = layout.before.br === undefined ? 1 : 2;
  const beforeScale = 1.8;

  return (
    <Sheet id={id} fade={false}>
      <AbsoluteFill style={{ opacity: persist }}>
        <StageTrack stages={STAGES} position={position} y={TRACK_Y} appear={trackAppear} loop={loop} />
        <RequirementCard
          card={CARD}
          left={card.x}
          top={card.y}
          width={card.w}
          anchor={anchor}
          records={RECORDS}
          recordKeys={RECORD_KEYS}
          attached={attached}
          pending={stage.index}
          pendingStrength={first ? cardAppear : move}
          flash={flash}
          appear={cardAppear}
        />
      </AbsoluteFill>

      <SceneFade id={id}>
        {/* 단계 제목 */}
        <div style={{ position: "absolute", left: TITLE_POS.x, top: TITLE_POS.y }}>
          <div style={{ ...mono(size.label, 700), color: color.agent }}>
            STAGE {pad2(stage.index + 1)} / {pad2(STAGE_COUNT)}
          </div>
          <div
            style={{
              ...sans(size.head, 800),
              lineHeight: "72px",
              marginTop: 4,
              whiteSpace: "nowrap",
              ...enter(frame, 2, { distance: 14, duration: 16 }),
            }}
          >
            {STAGES[stage.index]}
          </div>
        </div>

        {/* 흐름도 */}
        <Flow geometry={layout.flow} items={items} laneNames={LANES} lanesAt={lanesAt} loopback={layout.loopback} />

        {/* 그림 자리 */}
        <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h }}>
          <Illustration
            stage={stage}
            width={box.w}
            height={box.h}
            origin={{ x: box.x, y: box.y }}
            beats={beats}
            frames={{
              before: before ? f(before.at) : 0,
              context: contextAt,
              contextOut,
              flowStart,
              problem: frameOf("problem"),
              resolved: frameOf("resolved"),
              record: recordAt,
              principle: principleAt,
              note: note ? f(note.at) : null,
              closing: closingAt,
              end: duration,
            }}
            card={{ rect: toLocal(home), slots }}
          />
        </div>

        {/* 현재 → 머리 쪽으로 */}
        {before ? (
          <BeforeLine
            label={BEFORE_LABEL}
            text={before.text}
            br={layout.before.br}
            w={layout.before.w}
            scale={beforeScale}
            body={{
              x: layout.before.x,
              y: layout.before.cy - (beforeHeight(beforeLines) * beforeScale) / 2,
            }}
            at={f(before.at)}
            retreatAt={beforeOut}
          />
        ) : null}

        {/* 배경 문구: 본문 위쪽. 아래쪽 그림은 Illustration 이 그린다 */}
        {context && contextAt !== null && contextOut !== null ? (
          <ContextLine text={context.text} x={BODY.x} y={BODY.y} at={contextAt} out={contextOut} />
        ) : null}

        {/* 강조 문구: 원칙 띠와 같은 자리를 쓰면 원칙이 나오기 전에 비켜 준다 */}
        {note && layout.note ? (
          <NoteBanner
            text={note.text}
            {...layout.note}
            at={f(note.at)}
            out={noteOut}
          />
        ) : null}

        {/* 원칙 */}
        {stage.principle && layout.strip && principleAt !== null ? (
          <PrincipleStrip principle={stage.principle} {...layout.strip} at={principleAt} icon={layout.principleIcon} />
        ) : null}

        {/* 마무리 문구: 다음 순환으로 넘긴다 */}
        {stage.closing && layout.closing && closingAt !== null ? (
          <div
            style={{
              position: "absolute",
              left: layout.closing.x,
              top: layout.closing.y,
              width: layout.closing.w,
              height: layout.closing.h,
              display: "flex",
              alignItems: "center",
              gap: 18,
              ...enter(frame, closingAt, { from: "left" }),
            }}
          >
            <ReturnIcon size={40} color={color.agent} width={3} />
            <div style={{ ...sans(size.body, 600), whiteSpace: "nowrap" }}>{stage.closing.text}</div>
            {stage.closing.jira ? <NewIssueTag jira={stage.closing.jira} p={progress(frame, closingAt + 38, 16)} /> : null}
          </div>
        ) : null}
      </SceneFade>
    </Sheet>
  );
};

/** 마무리 문구 옆의 새 Jira 이슈: 아직 제안이라 점선 테두리다. */
const NewIssueTag: React.FC<{ jira: string; p: number }> = ({ jira, p }) => (
  <div
    style={{
      position: "relative",
      flex: "none",
      marginLeft: 6,
      padding: "8px 14px",
      border: `${stroke.thin}px dashed ${color.agent}`,
      backgroundColor: withAlpha(color.agent, 0.08),
      opacity: p,
      translate: `${(1 - p) * 14}px 0px`,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 10,
        top: -15,
        padding: "0 6px",
        backgroundColor: color.bg,
        ...mono(size.label, 700),
        color: color.agent,
      }}
    >
      JIRA
    </div>
    <div style={{ ...mono(size.small, 700), color: color.ink }}>{jira}</div>
  </div>
);

/** 흐름도 항목이 자리 잡는 데 걸리는 프레임. 그림이 항목과 박자를 맞출 때 쓴다. */
export const STAGE_ITEM_ENTER = ITEM_ENTER;
/** 씬이 시작될 때 카드와 고리가 옮겨 오는 데 걸리는 프레임 */
export const STAGE_MOVE = MOVE;
