// 디자인 안 비교용 공통 문구. 세 안이 같은 문구를 그대로 쓴다.
// 원본: docs/02-storyboard.md (S3, S5-4, S6)

export const S3 = {
  lead: "AI 도입을 넘어",
  headline: "AI 중심 재설계",
  ladder: ["작업 보조", "워크플로 에이전트", "프로세스 재설계"],
  nowLabel: "현재", // ladder[0] 위치에 붙는 표시
} as const;

export type StepKind = "human" | "agent" | "problem" | "resolved";

export const S5_4 = {
  // 화면 위쪽 진행 표시. stageIndex가 현재 단계.
  stages: [
    "요구사항 분석",
    "아키텍처 설계",
    "IP 설계 · PPA",
    "시뮬레이션 검증",
    "Emulation · FPGA",
    "FW 개발",
    "제품 테스트 · 퀄",
  ],
  stageIndex: 3,
  stageTitle: "시뮬레이션 검증",
  // 진행 표시를 따라 이동하는 요구사항 카드. records는 앞 단계에서 붙은 기록.
  card: {
    id: "REQ-QOS-07",
    title: "수명 말기 read 지연 보장",
    criterion: "P99.99 ≤ 2 ms (예시)",
    records: ["수용 기준", "구조 모델", "블록별 예산"],
  },
  before: { label: "현재", text: "실패 수백 건, 원인 분석은 수작업" },
  lanes: { agent: "에이전트", human: "사람" },
  // 일이 일어나는 순서. 두 줄(에이전트/사람) 흐름도로 배치한다.
  steps: [
    { kind: "human", text: "통과 기준 정의 · reference model 소유" },
    { kind: "agent", text: "testplan · testbench 생성" },
    { kind: "problem", text: "야간 regression 실패 312건" },
    { kind: "agent", text: "원인 4개로 분류" },
    { kind: "agent", text: "원인 가설: FSM의 완료 신호 누락" },
    { kind: "human", text: "가설 확인 · 수정 승인" },
    { kind: "resolved", text: "assertion 추가 · 전체 regression 재확인" },
  ] as { kind: StepKind; text: string }[],
  principle: {
    name: "폐루프 자동화",
    stat: "동일 모델 디버깅 통과율",
    from: "44%",
    to: "94%",
    source: "NVIDIA 자체 평가, 2026",
  },
} as const;

export const S6 = {
  title: "5대 전환",
  columns: { before: "현재", after: "전환 후" },
  rows: [
    { axis: "산출물", before: "사람용 문서", after: "실행 가능한 스펙" },
    { axis: "프로세스", before: "순차 handoff", after: "상시 루프" },
    { axis: "업무 방식", before: "직접 작성", after: "의도 정의 · 증거 기반 판단" },
    { axis: "시스템", before: "개인별 챗봇", after: "통합 AI 플랫폼" },
    { axis: "문화", before: "개인 요령", after: "측정 · 공유 · 학습" },
  ],
} as const;
