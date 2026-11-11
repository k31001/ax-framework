import React from "react";
import { useCurrentFrame } from "remotion";
import { enter } from "../../video/anim";
import { color, mono, safe, sans, size } from "../../video/theme";
import { useScene } from "./context";
import { ShiftSheet, ShiftTitle } from "./parts";

// 아직 만들지 않은 씬의 임시 화면: 씬 이름과 대본 문장이 목소리에 맞춰 나온다.
export const DraftScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { scene, lines } = useScene();
  return (
    <ShiftSheet>
      {scene.index === 0 ? (
        <ShiftTitle />
      ) : (
        <div style={{ position: "absolute", left: safe.left, top: 120, right: 96 }}>
          <div style={{ ...mono(size.label, 700), color: color.agent }}>{`DRAFT · ${scene.id.toUpperCase()}`}</div>
          <div style={{ ...sans(size.title, 800), marginTop: 6 }}>{scene.name}</div>
          <div style={{ marginTop: 40 }}>
            {lines.map((l) => (
              <div key={l.id} style={{ ...sans(size.body, 500), color: color.inkSoft, marginBottom: 14, ...enter(frame, l.at) }}>
                {l.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </ShiftSheet>
  );
};
