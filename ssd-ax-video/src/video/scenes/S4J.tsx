import React from "react";
import { Sheet } from "../components/Sheet";
import { Caption, Title } from "../components/Text";
import { S4J as content } from "../content";
import { size } from "../theme";
import { Chain } from "./s4j/Chain";
import { Comments } from "./s4j/Comments";
import { Readers } from "./s4j/Readers";
import { CAPTION_Y, READ, T, TITLE, WRITE } from "./s4j/layout";

// S4J 추적과 소통의 창구, Jira. 이슈 키와 링크 이름은 docs/05-jira-traceability.md 를 따른다.
//
//   1. S4 의 요구사항 카드가 그대로 있고, 카드의 Jira 키 칸이 켜진다                     "이 요구사항은, 지라의 이슈입니다."
//   2. 카드가 사슬의 첫 마디가 되고 설계 기능 · 검증 항목 · 버그가 링크로 이어진다      "요구사항에서 … 링크로 이어집니다."
//   3. 사슬 위에 사람(보드), 아래에 에이전트(JQL). 둘의 선이 같은 사슬을 따라간다       "사람도 에이전트도, 여기서 현황을 읽고,"
//   4. 사람의 지시 댓글, 에이전트의 답 댓글(ai-authored), 새 요구사항 이슈              "업무 지시와 새 요구사항도, 여기에 남깁니다."

export const S4J: React.FC = () => (
  <Sheet id="S4J">
    <Title text={content.title.text} label="TRACEABILITY" x={TITLE.x} y={TITLE.y} at={T.title} px={size.title} />
    <Chain />
    <Readers />
    <Comments />
    <Caption text={content.read.text} x={READ.x} y={CAPTION_Y} align="left" at={T.read} px={size.sub} />
    <Caption text={content.write.text} x={WRITE.x} y={CAPTION_Y} align="left" at={T.write} px={size.sub} />
  </Sheet>
);
