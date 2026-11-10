import type { Illustration } from "../../stage/StageScene";
import { Package } from "./Package";
import { Triage } from "./Triage";

// S5-7 제품 테스트 · 퀄의 그림 (536×616). 두 장면이 같은 자리를 차례로 쓴다.
//
//   전반 (문제 ~ 사람의 처분)        Triage:  로그 → 깔때기 → 기존 불량 묶음 + 신규 불량 후보 카드
//   강조 문구가 떠 있는 동안          전반 장면이 멈춘 채 흐려진다
//   후반 (퀄 패키지 조립 ~ 마무리)   Package: 기록 7개를 한 줄에 꿰어 패키지로 닫고, 사람이 서명한다

export const QualIllustration: Illustration = (props) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <Triage {...props} />
    <Package {...props} />
  </div>
);
