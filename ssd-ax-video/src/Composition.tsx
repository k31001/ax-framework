import { AbsoluteFill, Composition } from "remotion";
import { MONO, SANS } from "./fonts";

export const MyComposition = () => {
  return (
    <Composition
      id="Smoke"
      component={Smoke}
      durationInFrames={60}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

const Smoke: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0f14",
        color: "white",
        fontFamily: SANS,
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 800 }}>AI 중심으로 다시 설계한다</div>
      <div style={{ fontSize: 48, fontWeight: 300 }}>산출물 · 프로세스 · 일하는 방식 · 시스템 · 문화</div>
      <div style={{ fontSize: 40, fontFamily: MONO, color: "#7ee0c3" }}>spec → RTL → verify → FW → qual</div>
    </AbsoluteFill>
  );
};
