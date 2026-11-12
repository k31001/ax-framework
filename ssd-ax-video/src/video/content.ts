// 영상에 나오는 모든 문구. 원본은 docs/02-storyboard.md (승인본 4판).
// 문구를 고칠 때는 스토리보드와 함께 고친다. 씬 코드에 문구를 직접 쓰지 않는다.
//
// 시간 값 `at` 은 그 씬이 시작된 뒤의 초다. 씬 길이는 timeline.ts 에 있다.

// ── S1 Hook ────────────────────────────────────────────────────────────
export const S1 = {
  captions: [
    { at: 0.3, text: "AI 활용, 이미 일상" },
    { at: 3.29, text: "코드 초안 · 로그 요약 · 스크립트" },
    { at: 7.06, text: "쉬운 열매는 수확 완료" },
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
    { at: 4.49, text: "작성 가속 → 병목 이동" },
  ],
  stat: {
    at: 10.12,
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
    at: 6.02,
    steps: ["작업 보조", "워크플로 에이전트", "프로세스 재설계"],
    nowLabel: "현재", // steps[0] 위치에 붙는다
  },
} as const;

// ── S4 사례 소개 ───────────────────────────────────────────────────────
// id 는 요구사항 ID(git 산출물의 ID), jira 는 그 요구사항의 Jira 이슈 키다 (docs/05-jira-traceability.md 1장).
export const CARD = {
  id: "REQ-QOS-07",
  jira: "REQ-207",
  title: "수명 말기 read 지연 보장",
  criterion: "P99.99 ≤ 2 ms (예시)",
} as const;

export const S4 = {
  title: { at: 0.3, text: "요구사항 하나의 여정" },
  setting: { at: 1.2, text: "차세대 데이터센터 SSD 컨트롤러 · 차세대 QLC NAND" },
  cardAt: 3.39, // 요구사항 카드가 만들어지는 시점
  recovery: {
    at: 7.45,
    // 오류 복구 단계. 뒤로 갈수록 지연 막대가 길어진다.
    steps: ["read retry", "soft decoding", "parity 복구"],
  },
} as const;

// ── S4J Jira 추적 ──────────────────────────────────────────────────────
// 이슈 키, 링크 이름, 계정과 라벨은 docs/05-jira-traceability.md 의 것을 그대로 쓴다.
export const S4J = {
  title: { at: 0.3, text: "추적과 소통의 창구, Jira" },
  cardAt: 0.6, // 요구사항 카드의 Jira 키가 켜지는 시점
  // 추적 사슬. 유형마다 1초 간격으로 놓인다. app 은 그 유형을 맡는 곳(카드의 mono 라벨)
  chain: {
    at: 3.72,
    nodes: [
      { key: "REQ-207", type: "요구사항", app: "R4J" },
      { key: "FEAT-341", type: "설계 기능", app: "R4J" },
      { key: "VER-530", type: "검증 항목", app: "XRAY" },
      { key: "BUG-2291", type: "버그", app: "JIRA" },
    ],
    links: ["is implemented by", "tested by", "defect"],
  },
  actorsAt: 10.34, // 사람(보드)과 에이전트(JQL)가 사슬을 읽기 시작하는 시점
  read: { at: 11.74, text: "현황 파악" },
  write: { at: 13.85, text: "업무 지시 · 신규 요구사항" },
  agentAccount: "dv-agent", // 댓글로 지시받고 답하는 에이전트 계정
  agentLabel: "ai-authored", // 에이전트가 쓴 것에 붙는 표시
  newIssue: { key: "REQ-231", app: "JIRA" }, // 마지막에 들어오는 새 요구사항(제안)
} as const;

// ── S5 사례 7단계 ──────────────────────────────────────────────────────
// context:  흐름에 앞서 나오는 배경 문구. 본문 위쪽에 크게 나왔다가 다음 항목 앞에서 물러난다. 흐름도에는 놓이지 않는다.
// before:   전환 전의 방식. 먼저 나왔다가 흐려진다.
// human:    사람 줄에 놓이는 항목
// agent:    에이전트 줄에 놓이는 항목
// problem:  흐름 중간에 끼어드는 문제 (경고색)
// resolved: 문제의 해결
// note:     흐름과 별개로 화면에 크게 나오는 강조 문구
export type BeatKind = "context" | "before" | "human" | "agent" | "problem" | "resolved" | "note";
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
  jira?: string; // 그 기록에 해당하는 Jira 이슈 키(링크된 이슈 또는 Test Execution). 기준 문서에 없으면 비운다
  recordAt: number;
  beats: Beat[];
  principle?: Principle;
  closing?: { at: number; text: string; jira?: string }; // jira: 마무리 문구 옆에 놓이는 새 이슈의 키
};

export const S5: Stage[] = [
  {
    id: "S5-1",
    index: 0,
    record: "수용 기준",
    recordAt: 12.92,
    beats: [
      { kind: "before", at: 0.8, text: "문서 수작업 대조, 충돌은 뒤늦게 발견" },
      { kind: "agent", at: 5.77, text: "조항 단위 추출 · 충돌 위험 탐지" },
      { kind: "human", at: 10.12, text: "우선순위 결정 · 수용 기준 확정" },
    ],
  },
  {
    id: "S5-2",
    index: 1,
    record: "구조 모델",
    recordAt: 32.28,
    beats: [
      { kind: "context", at: 0.8, text: "요구사항 급변 → 구조 재설계" },
      { kind: "before", at: 6.07, text: "RTL 먼저, 구조 문제는 emulation에서 발견" },
      { kind: "agent", at: 11.62, text: "목적별 모델 · 수백 구성 여러 관점에서 탐색" },
      { kind: "human", at: 17.59, text: "선택: 오류 복구 제어를 FW에서 HW로" },
      { kind: "problem", at: 22.56, text: "구조 검증: GC 중 P99.99 초과" },
      { kind: "resolved", at: 29.08, text: "host read 우선 큐 추가 · RTL 작성 전 발견" },
    ],
  },
  {
    id: "S5-3",
    index: 2,
    record: "interface 계약",
    jira: "FEAT-341",
    recordAt: 29.28,
    beats: [
      { kind: "before", at: 0.8, text: "register는 SystemRDL, 동작 규약은 API 문서" },
      { kind: "context", at: 2.8, text: "블록도 한 장 → 블록별 예산 · interface 계약" },
      { kind: "human", at: 8.95, text: "동작 규약을 실행 가능한 계약으로 정의" },
      { kind: "agent", at: 14.97, text: "계약 기반 RTL 생성 · commit마다 PPA 추정" },
      { kind: "problem", at: 18.74, text: "ECC 블록 면적 초과" },
      { kind: "resolved", at: 20.54, text: "축소안 · 구조 모델로 지연 재확인" },
      { kind: "note", at: 24.11, text: "지키는 방법은 설계자의 결정" },
    ],
    principle: { at: 28.28, name: "스펙 원본화" },
  },
  {
    id: "S5-4",
    index: 3,
    record: "검증 기록",
    jira: "VER-620",
    recordAt: 23.47,
    beats: [
      { kind: "before", at: 0.8, text: "실패 수백 건, 원인 분석은 수작업" },
      { kind: "human", at: 2.8, text: "통과 기준 정의 · reference model 소유" },
      { kind: "agent", at: 4.6, text: "testplan · testbench 생성" },
      { kind: "problem", at: 7.36, text: "야간 regression 실패 312건" },
      { kind: "agent", at: 10.53, text: "원인 4개로 분류" },
      { kind: "agent", at: 13.39, text: "원인 가설: FSM의 완료 신호 누락" },
      { kind: "human", at: 17.5, text: "가설 확인 · 수정 승인" },
      { kind: "resolved", at: 19.3, text: "assertion 추가 · 전체 regression 재확인" },
    ],
    principle: {
      at: 21.87,
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
    jira: "VER-588",
    recordAt: 22.56,
    beats: [
      { kind: "before", at: 0.8, text: "RTL과 FW의 첫 통합은 FPGA · emulator 준비 이후" },
      { kind: "agent", at: 3, text: "가상 플랫폼에서 선행 통합, 이후 매일 RTL + FW 구동" },
      { kind: "problem", at: 10.27, text: "장시간 부하 중 command timeout" },
      { kind: "agent", at: 13.31, text: "파형 · FW trace 교차 분석" },
      { kind: "agent", at: 15.11, text: "원인 가설: interrupt 1건 유실" },
      { kind: "human", at: 19.36, text: "HW · FW 공동 결정: 완료 전달을 큐 방식으로" },
      { kind: "resolved", at: 21.36, text: "interface 계약 개정" },
    ],
  },
  {
    id: "S5-6",
    index: 5,
    record: "불변식 테스트",
    recordAt: 17.66,
    beats: [
      { kind: "before", at: 0.8, text: "API 문서 해석 후 driver 수작업 구현" },
      { kind: "human", at: 2.6, text: "불변식 정의: 정정 실패 데이터 반환 금지" },
      { kind: "agent", at: 9.22, text: "가상 플랫폼 · 보드에서 빌드 · 실행 · 수정 반복" },
      { kind: "human", at: 15.66, text: "실제 NAND로 read retry table 승인" },
    ],
  },
  {
    id: "S5-7",
    index: 6,
    record: "퀄 증빙",
    recordAt: 27.42,
    beats: [
      { kind: "before", at: 0.8, text: "로그 수동 분석, 막바지 증빙 취합" },
      { kind: "problem", at: 2.8, text: "고온 방치 후 특정 NAND lot, 지연 기준 초과" },
      { kind: "agent", at: 7.59, text: "신규 불량 후보 제시 · 수정안 비교" },
      { kind: "human", at: 11.31, text: "처분 결정 · 재시험 범위 승인" },
      { kind: "note", at: 14.95, text: "시험 시간은 그대로, 단축은 원인 분석과 취합" },
      { kind: "agent", at: 22.25, text: "퀄 패키지 조립" },
      { kind: "human", at: 25.42, text: "판정 · 서명" },
    ],
    principle: { at: 26.82, name: "전 과정 추적성" },
    closing: { at: 28.82, text: "필드 데이터는 다음 요구사항에 반영", jira: "REQ-231" },
  },
];

export const LANES = { agent: "에이전트", human: "사람" } as const;
export const BEFORE_LABEL = "현재";

// ── S6 5대 전환 ────────────────────────────────────────────────────────
export const S6 = {
  title: "5대 전환",
  columns: { before: "현재", after: "전환 후" },
  rowsAt: 3.42, // 첫 줄이 나오는 시점. 이후 줄마다 rowStep 초 간격
  rowStep: 3.29,
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
    at: 4.28,
    text: "bug 806개 주입 실험: AI는 완료 선언, 최고 모델도 21% 누락",
    injected: 806,
    missedPercent: 21,
    source: "SemiEngineering, 2026-11",
  },
} as const;

// ── S8 로드맵 ──────────────────────────────────────────────────────────
export const S8 = {
  title: "3단계 로드맵",
  stepsAt: 2.56,
  stepGap: 2.17,
  steps: [
    { name: "기반 구축", detail: "Jira 추적 체계 · 플랫폼 · 기준선" },
    { name: "병목 우선 에이전트화", detail: "워크플로 단위 폐루프" },
    { name: "프로세스 재설계", detail: "스펙 중심 흐름 · 역할 전환" },
  ],
  reference: { at: 7.86, text: "2026년, EDA 3사 워크플로 에이전트 발표" },
  closing: { at: 9.46, text: "성과는 다음 단계에 재투자" },
} as const;

// ── S9 Closing ─────────────────────────────────────────────────────────
export const S9 = {
  rolesAt: 0.4,
  roleGap: 1.01,
  roles: [
    { role: "설계", before: "RTL 작성", after: "구조 · 계약 결정" },
    { role: "검증", before: "테스트 작성", after: "기준 정의 · 독립 판정" },
    { role: "FW", before: "규약 구현", after: "정책 · 불변식 정의" },
    { role: "테스트 · 퀄", before: "로그 분석", after: "신규 불량 판단 · 퀄 판정" },
  ],
  shift: { at: 5.92, text: "작성자에서 설계자로" },
  headline: { at: 10.58, text: "AI 중심 재설계" },
  endCard: { at: 12.73, text: "SSD Controller SoC · AX 전략" },
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
  // 수치와 식별자는 docs/06-architecture-exploration.md 5장의 예제와 같다(모두 예시).
  "S5-2": {
    // 배경: 이전 세대 대비 바뀐 것과, 이전 구조(FW 순차 제어)가 새 조건에서 기준을 넘는 모습
    change: {
      head: { from: "이전 세대", to: "이번 과제 (예시)" },
      rows: [
        { item: "NAND", from: "TLC", to: "차세대 QLC", note: "" },
        { item: "용량", from: "30.72 TB", to: "122.88 TB", note: "4배" },
        { item: "전력 한도", from: "25 W", to: "25 W", note: "그대로" },
      ],
    },
    prev: { title: "이전 구조", fw: "FW 순차 제어", limit: "기준 2 ms", over: "3.41 ms (예시)" },
    // 현재: RTL 먼저. 구조의 문제는 emulation 에서야 보인다
    rtlFirst: {
      steps: ["구조", "RTL", "블록 검증", "emulation"],
      found: "P99.99 초과",
      back: "구조부터 재작업",
    },
    // 목적별 모델은 구조 기술 하나에서 파생된다. views 는 탐색 결과를 보는 관점
    source: "구조 기술",
    models: ["지연 · 전력", "면적", "기능", "formal"],
    views: ["지연 꼬리", "전력", "면적", "FW 복잡도", "검증 가능성", "재사용"],
    axes: { x: "면적", y: "지연" },
    chosen: "선택안",
    queue: { host: "host read", gc: "GC read", decoder: "soft decoder" },
    limit: "P99.99 기준",
  },
  "S5-3": {
    // 배경: RTL 설계자가 받는 것. 지연 예산은 BUD-RCV-001 의 tail_path_ms, 계약은 HSI-RCV-010
    handoff: {
      sheet: "블록도 한 장",
      to: "RTL 설계자",
      budget: {
        title: "블록별 지연 예산 (예시)",
        total: 2, // ms. 요구사항의 기준
        // 구간의 합 1.66 + 여유 0.12 = 판정선 1.78
        parts: [
          { name: "host · FTL", ms: 0.1 },
          { name: "첫 read", ms: 0.35 },
          { name: "HW retry", ms: 0.51 },
          { name: "soft read", ms: 0.3 },
          { name: "soft 큐", ms: 0.15 },
          { name: "soft decode", ms: 0.25 },
        ],
        margin: 0.12,
        line: { ms: 1.78, text: "판정선 1.78 ms" },
        limit: "기준 2 ms",
      },
      contract: {
        title: "interface 계약",
        id: "HSI-RCV-010",
        rules: [
          { key: "order", text: "host 먼저 · GC는 host 4건당 1건 이상" },
          { key: "bound", text: "모든 요청은 성공 또는 실패로 한 번 종료" },
        ],
      },
    },
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
    // 원인 가설은 에이전트가 Jira 버그 초안으로 올린다
    bug: { key: "BUG-2268", label: "ai-authored" },
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
