import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, enter, f, progress } from "../anim";
import { Sheet, Source } from "../components";
import { S7 as content } from "../content";
import { color, sans, size, stroke } from "../theme";
import { BugField } from "./s7/BugField";
import { AT, BOX } from "./s7/field";

// S7 책임. 영상에서 가장 고요한 장면.
// 왼쪽에 문구 하나, 오른쪽에 그 근거(점 806개) 하나. 문구는 처음 자리에서 움직이지 않는다.
// 시선의 중심: 처음에는 문구의 "책임은 사람", 수치가 나온 뒤에는 붉게 남은 점.

const HEAD_X = 136;
const HEAD_TOP = 392;
const HEAD_LINE = 124;

// 문구는 content.ts 의 것을 그대로 쓰고, 쉼표와 쌍점에서 줄만 나눈다.
const head = content.headline.text;
const headCut = head.indexOf(", ");
const headLines = headCut < 0 ? [head] : [head.slice(0, headCut + 1), head.slice(headCut + 2)];

const stat = content.stat.text;
const statCut = stat.indexOf(": ");
const statLead = statCut < 0 ? "" : stat.slice(0, statCut + 1);
const statBody = statCut < 0 ? stat : stat.slice(statCut + 2);
// 본문에서 누락 비율만 붉게
const percent = `${content.stat.missedPercent}%`;
const percentAt = statBody.indexOf(percent);

const CAPTION_TOP = BOX.y + BOX.h + 22;

export const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const headAt = f(content.headline.at);
  const underline = progress(frame, headAt + 22, 30, ease.inOut);

  return (
    <Sheet id="S7">
      {/* 문구: 둘째 줄("책임은 사람")에 사람의 색으로 무게를 싣는다 */}
      {headLines.map((line, i) => {
        const weighted = i === headLines.length - 1 && headLines.length > 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: HEAD_X,
              top: HEAD_TOP + i * HEAD_LINE,
              ...enter(frame, headAt + i * 8, { duration: 20, distance: 14 }),
            }}
          >
            <div
              style={{
                position: "relative",
                ...sans(size.display, 800),
                lineHeight: `${HEAD_LINE}px`,
                whiteSpace: "nowrap",
                color: weighted ? color.human : color.ink,
              }}
            >
              {line}
              {weighted ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: -18,
                    width: `${underline * 100}%`,
                    height: stroke.bold,
                    backgroundColor: color.human,
                  }}
                />
              ) : null}
            </div>
          </div>
        );
      })}

      {/* 근거: bug 806개 */}
      <BugField frame={frame} />

      <div
        style={{
          position: "absolute",
          left: BOX.x,
          top: CAPTION_TOP,
          ...sans(size.body, 500),
          lineHeight: "46px",
          color: color.inkSoft,
          whiteSpace: "nowrap",
          ...enter(frame, AT.caption),
        }}
      >
        {statLead}
      </div>
      <div
        style={{
          position: "absolute",
          left: BOX.x,
          top: CAPTION_TOP + 48,
          ...sans(size.body, 700),
          lineHeight: "46px",
          whiteSpace: "nowrap",
          ...enter(frame, AT.caption + 4),
        }}
      >
        {percentAt < 0 ? (
          statBody
        ) : (
          <>
            {statBody.slice(0, percentAt)}
            <span style={{ color: color.problem }}>{percent}</span>
            {statBody.slice(percentAt + percent.length)}
          </>
        )}
      </div>
      <Source text={content.stat.source} x={BOX.x} y={CAPTION_TOP + 116} at={AT.source} />
    </Sheet>
  );
};
