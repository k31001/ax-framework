// 영상에 나오는 모든 문구. 원본은 docs/02-storyboard.md (승인본 4판).
// 문구를 고칠 때는 스토리보드와 함께 고친다. 씬 코드에 문구를 직접 쓰지 않는다.
//
// 시간 값 `at` 은 그 씬이 시작된 뒤의 초다. 씬 길이는 timeline.ts 에 있다.

// ── S1 Hook ────────────────────────────────────────────────────────────
export const S1 = {
  captions: [
    { at: 0.3, text: "AI 활용, 이미 일상" },
    { at: 2.6, text: "코드 초안 · 로그 요약 · 스크립트" },
    { at: 5.2, text: "쉬운 열매는 수확 완료" },
  ],
  // 두 번째 자막과 함께 하나씩 완료되는 작업 세 가지
  tasks: ["코드 초안", "로그 요약", "스크립트"],
} as const;

// ── S2 문제 ────────────────────────────────────────────────────────────
export const STAGES = [
  "요구사항 분석",
  "아키텍처 설계",
  "IP 설계 · PPA",
  "시뮬레이션 검증",
  "Emulation · FPGA",
  "FW 개발",
  "제품 테스트 · 퀄",
] as const;

export const S2 = {
  captions: [
    { at: 0.3, text: "개인 속도 향상, 과제 일정은 제자리" },
    { at: 4.2, text: "작성 가속 → 병목 이동" },
  ],
  stat: {
    at: 8.0,
    value: "60~70%",
    text: "칩 개발 공수의 60~70%는 검증",
    source: "Siemens EDA, 2025",
  },
} as const;

// ── S3 전환 선언 ───────────────────────────────────────────────────────
export const S3 = {
  lead: { at: 0.3, text: "AI 도입을 넘어" },
  headline: { at: 2.2, text: "AI 중심 재설계" },
  ladder: {
    at: 5.2,
    steps: ["작업 보조", "워크플로 에이전트", "프로세스 재설계"],
    nowLabel: "현재", // steps[0] 위치에 붙는다
  },
} as const;

// ── S4 사례 소개 ───────────────────────────────────────────────────────
export const CARD = {
  id: "REQ-QOS-07",
  title: "수명 말기 read 지연 보장",
  criterion: "P99.99 ≤ 2 ms (예시)",
} as const;

export const S4 = {
  title: { at: 0.3, text: "요구사항 하나의 여정" },
  setting: { at: 1.2, text: "차세대 데이터센터 SSD 컨트롤러 · 신세대 QLC NAND" },
  cardAt: 3.0, // 요구사항 카드가 만들어지는 시점
  recovery: {
    at: 6.0,
    // 오류 복구 단계. 뒤로 갈수록 지연 막대가 길어진다.
    steps: ["read retry", "soft decoding", "parity 복구"],
  },
} as const;

// ── S5 사례 7단계 ──────────────────────────────────────────────────────
// before:   전환 전의 방식. 먼저 나왔다가 흐려진다.
// human:    사람 줄에 놓이는 항목
// agent:    에이전트 줄에 놓이는 항목
// problem:  흐름 중간에 끼어드는 문제 (경고색)
// resolved: 문제의 해결
// note:     흐름과 별개로 화면에 크게 나오는 강조 문구
export type BeatKind = "before" | "human" | "agent" | "problem" | "resolved" | "note";
export type Beat = { kind: BeatKind; at: number; text: string };

export type Principle = {
  at: number;
  name: string;
  stat?: { label: string; from: string; to: string; source: string };
};

export type Stage = {
  id: string; // timeline.ts 의 씬 id
  index: number; // 0~6, STAGES 의 순서
  record: string; // 이 단계가 끝날 때 요구사항 카드에 붙는 기록
  recordAt: number;
  beats: Beat[];
  principle?: Principle;
  closing?: { at: number; text: string };
};

export const S5: Stage[] = [
  {
    id: "S5-1",
    index: 0,
    record: "수용 기준",
    recordAt: 9.4,
    beats: [
      { kind: "before", at: 0.8, text: "문서 수작업 대조, 충돌은 뒤늦게 발견" },
      { kind: "agent", at: 3.4, text: "조항 단위 추출 · 충돌 위험 탐지" },
      { kind: "human", at: 6.6, text: "우선순위 결정 · 수용 기준 확정" },
    ],
  },
  {
    id: "S5-2",
    index: 1,
    record: "구조 모델",
    recordAt: 15.4,
    beats: [
      { kind: "before", at: 0.8, text: "소수 후보, 회의로 결정" },
      { kind: "agent", at: 3.2, text: "보정된 성능 모델로 수백 구성 탐색" },
      { kind: "human", at: 6.2, text: "선택: 오류 복구 제어를 FW에서 HW로" },
      { kind: "problem", at: 9.2, text: "구조 검증: GC 중 P99.99 초과" },
      { kind: "resolved", at: 12.2, text: "host read 우선 큐 추가 · RTL 작성 전 발견" },
    ],
  },
  {
    id: "S5-3",
    index: 2,
    record: "interface 계약",
    recordAt: 10.6,
    beats: [
      { kind: "before", at: 0.8, text: "register는 SystemRDL, 동작 규약은 API 문서" },
      { kind: "human", at: 2.8, text: "동작 규약을 실행 가능한 계약으로 정의" },
      { kind: "agent", at: 4.8, text: "계약 기반 RTL 생성 · commit마다 PPA 추정" },
      { kind: "problem", at: 6.8, text: "ECC 블록 면적 초과" },
      { kind: "resolved", at: 8.6, text: "축소안 · 구조 모델로 지연 재확인" },
    ],
    principle: { at: 9.6, name: "스펙 원본화" },
  },
  {
    id: "S5-4",
    index: 3,
    record: "검증 기록",
    recordAt: 16.6,
    beats: [
      { kind: "before", at: 0.8, text: "실패 수백 건, 원인 분석은 수작업" },
      { kind: "human", at: 2.8, text: "통과 기준 정의 · reference model 소유" },
      { kind: "agent", at: 4.6, text: "testplan · testbench 생성" },
      { kind: "problem", at: 6.4, text: "야간 regression 실패 312건" },
      { kind: "agent", at: 8.4, text: "원인 4개로 분류" },
      { kind: "agent", at: 10.2, text: "원인 가설: FSM의 완료 신호 누락" },
      { kind: "human", at: 12.2, text: "가설 확인 · 수정 승인" },
      { kind: "resolved", at: 14.0, text: "assertion 추가 · 전체 regression 재확인" },
    ],
    principle: {
      at: 15.0,
      name: "폐루프 자동화",
      stat: {
        label: "동일 모델 디버깅 통과율",
        from: "44%",
        to: "94%",
        source: "NVIDIA 자체 평가, 2026",
      },
    },
  },
  {
    id: "S5-5",
    index: 4,
    record: "구동 기록",
    recordAt: 14.6,
    beats: [
      { kind: "before", at: 0.8, text: "RTL과 FW의 첫 통합은 FPGA · emulator 준비 이후" },
      { kind: "agent", at: 3.0, text: "가상 플랫폼에서 선행 통합, 이후 매일 RTL + FW 구동" },
      { kind: "problem", at: 5.6, text: "장시간 부하 중 command timeout" },
      { kind: "agent", at: 7.6, text: "파형 · FW trace 교차 분석" },
      { kind: "agent", at: 9.4, text: "원인 가설: interrupt 1건 유실" },
      { kind: "human", at: 11.4, text: "HW · FW 공동 결정: 완료 전달을 큐 방식으로" },
      { kind: "resolved", at: 13.4, text: "interface 계약 개정" },
    ],
  },
  {
    id: "S5-6",
    index: 5,
    record: "불변식 테스트",
    recordAt: 8.8,
    beats: [
      { kind: "before", at: 0.8, text: "API 문서 해석 후 driver 수작업 구현" },
      { kind: "human", at: 2.6, text: "불변식 정의: 정정 실패 데이터 반환 금지" },
      { kind: "agent", at: 4.6, text: "가상 플랫폼 · 보드에서 빌드 · 실행 · 수정 반복" },
      { kind: "human", at: 6.8, text: "실제 NAND로 read retry table 승인" },
    ],
  },
  {
    id: "S5-7",
    index: 6,
    record: "퀄 증빙",
    recordAt: 15.6,
    beats: [
      { kind: "before", at: 0.8, text: "로그 수동 분석, 막바지 증빙 취합" },
      { kind: "problem", at: 2.8, text: "고온 방치 후 특정 NAND lot, 지연 기준 초과" },
      { kind: "agent", at: 5.0, text: "신규 불량 후보 제시 · 수정안 비교" },
      { kind: "human", at: 7.2, text: "처분 결정 · 재시험 범위 승인" },
      { kind: "note", at: 9.4, text: "시험 시간은 그대로, 단축은 원인 분석과 취합" },
      { kind: "agent", at: 12.0, text: "퀄 패키지 조립" },
      { kind: "human", at: 13.6, text: "판정 · 서명" },
    ],
    principle: { at: 15.0, name: "전 과정 추적성" },
    closing: { at: 17.0, text: "필드 데이터는 다음 요구사항에 반영" },
  },
];

export const LANES = { agent: "에이전트", human: "사람" } as const;
export const BEFORE_LABEL = "현재";

// ── S6 5대 전환 ────────────────────────────────────────────────────────
export const S6 = {
  title: "5대 전환",
  columns: { before: "현재", after: "전환 후" },
  rowsAt: 1.6, // 첫 줄이 나오는 시점. 이후 줄마다 rowStep 초 간격
  rowStep: 2.1,
  rows: [
    { axis: "산출물", before: "사람용 문서", after: "실행 가능한 스펙" },
    { axis: "프로세스", before: "순차 handoff", after: "상시 루프" },
    { axis: "업무 방식", before: "직접 작성", after: "의도 정의 · 증거 기반 판단" },
    { axis: "시스템", before: "개인별 챗봇", after: "통합 AI 플랫폼" },
    { axis: "문화", before: "개인 요령", after: "측정 · 공유 · 학습" },
  ],
} as const;

// ── S7 책임 ────────────────────────────────────────────────────────────
export const S7 = {
  headline: { at: 0.4, text: "작업은 자동화, 책임은 사람" },
  stat: {
    at: 3.6,
    text: "bug 806개 주입 실험: AI는 완료 선언, 최고 모델도 21% 누락",
    injected: 806,
    missedPercent: 21,
    source: "SemiEngineering, 2026-11",
  },
} as const;

// ── S8 로드맵 ──────────────────────────────────────────────────────────
export const S8 = {
  title: "3단계 로드맵",
  stepsAt: 1.2,
  stepGap: 1.8,
  steps: [
    { name: "기반 구축", detail: "플랫폼 · 데이터 · 기준선" },
    { name: "병목 우선 에이전트화", detail: "워크플로 단위 폐루프" },
    { name: "프로세스 재설계", detail: "스펙 중심 흐름 · 역할 전환" },
  ],
  reference: { at: 5.6, text: "2026년, EDA 3사 워크플로 에이전트 발표" },
  closing: { at: 7.2, text: "성과는 다음 단계에 재투자" },
} as const;

// ── S9 Closing ─────────────────────────────────────────────────────────
export const S9 = {
  rolesAt: 0.4,
  roleGap: 0.8,
  roles: [
    { role: "설계", before: "RTL 작성", after: "구조 · 계약 결정" },
    { role: "검증", before: "테스트 작성", after: "기준 정의 · 독립 판정" },
    { role: "FW", before: "규약 구현", after: "정책 · 불변식 정의" },
    { role: "테스트 · 퀄", before: "로그 분석", after: "신규 불량 판단 · 퀄 판정" },
  ],
  shift: { at: 5.3, text: "작성자에서 설계자로" },
  headline: { at: 6.6, text: "AI 중심 재설계" },
  endCard: { at: 8.4, text: "SSD Controller SoC · AX 전략" },
} as const;

// ── S5 그림 속 라벨 ────────────────────────────────────────────────────
// 단계별 그림(illustration) 안에 들어가는 짧은 이름표. 자막이 아니다.
// 그림에 한글 라벨이 필요하면 여기에 있는 것만 쓴다. 영문 기술 라벨은 그림에서 직접 써도 된다.
export const FIG = {
  "S5-1": {
    docs: ["고객 요구서", "NAND 스펙", "표준"],
    nodes: { a: "QLC 오류율", b: "read 지연" },
    conflict: "충돌 위험",
    criterion: "수용 기준",
  },
  "S5-2": {
    axes: { x: "면적", y: "지연" },
    chosen: "선택안",
    queue: { host: "host read", gc: "GC read", decoder: "soft decoder" },
    limit: "P99.99 기준",
  },
  "S5-3": {
    from: "API 문서",
    contract: "계약",
    outputs: ["RTL", "C++ header", "assertion"],
    area: "ECC 면적",
    budget: "예산",
    model: "구조 모델",
  },
  "S5-4": {
    clusters: [148, 87, 52, 25], // 합 312
    signals: ["retry_req", "dec_done"],
  },
  "S5-5": {
    rows: { hw: "HW 파형", fw: "FW trace" },
    lost: "1건 유실",
    queue: "큐",
    platforms: ["가상 플랫폼", "emulator · FPGA"],
  },
  "S5-6": {
    loop: ["빌드", "실행", "수정"],
    targets: ["가상 플랫폼", "보드"],
    invariant: "불변식",
    table: "read retry table",
  },
  "S5-7": {
    logs: "테스트 로그",
    known: "기존 불량",
    fresh: "신규 불량 후보",
    pack: "퀄 패키지",
    sign: "서명",
  },
} as const;
