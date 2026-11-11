// 화면에 띄우는 문구. 모두 script.json 의 visual·caption·name 에 적힌 것이다.

export const TX = {
  question: "어젯밤 regression에서 retry 관련 실패의 원인이 뭐야?",
  chatbot: "챗봇",
  platformAgent: "플랫폼의 에이전트",
  tool: {
    rtl: "rd_recov_ctrl.sv",
    wave: "파형",
    sim: "시뮬레이터",
    regress: "regression DB",
    bug: "과거 bug",
    spec: "스펙",
    tracker: "issue tracker",
  },
  ipLock: "설계 IP · 반출 금지",
  now: "현재",
  nowNote: "복사 · 붙여넣기, 연결은 사람 손",
  verb: { copy: "복사", rerun: "재실행", wave: "파형 열기", search: "검색" },
  intranet: "사내망",
  model: "사내 모델",
  failBox: "야간 regression 실패 312건",
  c2: "C2 · recov_retry · 97건",
  sameCycle: "같은 cycle",
  lost: "완료 유실",
  keyword: "키워드: dec_done, SCB_TIMEOUT",
  meaning: "의미: pulse가 겹쳐 사라짐",
  query: "\"같은 cycle 완료 누락\"",
  pending: "승인 대기",
  blocks: ["사내 모델", "도구 연결", "지식", "격리 실행", "평가", "권한 · 감사", "비용 관측"],
  vendorLink: "벤더 도구 연결",
  inhouseLink: "사내 DB · scheduler · tracker 연결",
  buy: "구매",
  buyNote: "사서 쓴다",
  build: "구축",
  buildNote: "직접 만든다 · 우리 데이터와 판정 기준",
  reach: ["regression DB · 로그", "과거 bug · 스펙 색인", "formal, lint/CDC, 합성, emulator 큐"],
  steps: ["읽는 통로", "평가 세트", "실행하는 통로", "지식 계층", "도구 확장 · 비용 관측"],
  readOnly: "읽기 전용",
  workbook: ["닫힌 bug: 로그 → 확정 원인", "hold-back", "심어 둔 bug"],
  guard: "지키는 선",
  grades: [
    ["C1", "공개 자료", "외부 모델 가능"],
    ["C2", "사내 일반", "계약된 전용 경로"],
    ["C3", "설계 IP · 고객 자료", "사내 모델만"],
  ],
  gradeNote: "등급 구분은 예시, 보안 · 법무 확정",
  signoff: "sign-off는 사람",
  meters: ["emulator · sim 시간", "token"],
  passRate: "동일 모델 디버깅 통과율",
  passSource: "NVIDIA 자체 평가, 2026",
  alone: "단독",
  loop: "도구를 쓰는 에이전트 루프",
  closing: "차이는 모델이 아니라 시스템",
} as const;

export const LOG_PASTE = ["UVM_ERROR @ 2040000ns: [SCB_TIMEOUT]", "  cmd 0x3A1 no completion within 200us", "  (test=recov_retry_burst seed=48213)"];

export const CHAT_ANSWER = [
  "completion timeout은 보통 다음 원인으로 발생합니다.",
  "1. request/ack handshake 불일치",
  "2. FSM이 특정 state에서 빠져나오지 못하는 경우",
  "3. testbench의 응답 지연 설정",
  "파형에서 상태 천이를 확인해 보세요.",
];

export const MCP_CONFIG = [
  "{ \"mcpServers\": {",
  "  \"regress\": { \"type\": \"http\",",
  "    \"url\": \"https://mcp.eda.internal/regress\" },",
  "  \"sim\":  { \"url\": \"https://mcp.eda.internal/sim\" },",
  "  \"wave\": { \"url\": \"https://mcp.eda.internal/wave\" },",
  "  \"kb\":   { \"url\": \"https://mcp.eda.internal/kb\" }",
  "} }",
];

export type Call = { no: string; tool: string; args: string; result?: string; resultTone?: "problem" | "human"; strip: number };

// strip: 도구 띠에서의 자리 (regress, sim, wave, code, kb, tracker)
export const CALLS: Call[] = [
  { no: "01", tool: "regress.query", args: "run=nightly-1110 status=FAIL", result: "-> 312건", strip: 0 },
  { no: "02", tool: "regress.cluster", args: "by=signature", result: "-> 4묶음", strip: 0 },
  { no: "03", tool: "regress.query", args: "cluster=C2 tag=recov_retry", result: "-> 97건", strip: 0 },
  { no: "04", tool: "sim.rerun", args: "recov_retry_burst seed=48213", result: "-> FAIL", resultTone: "problem", strip: 1 },
  { no: "05", tool: "wave.query", args: "recov_req,dec_done,state", result: "-> 4행", strip: 2 },
  { no: "06", tool: "code.read", args: "rd_recov_ctrl.sv:212-240", strip: 3 },
  { no: "07", tool: "kb.search", args: "\"같은 cycle 완료 누락\" hybrid", result: "-> BUG-2291", strip: 4 },
  { no: "08", tool: "tracker.draft", args: "REQ-QOS-07 연결", result: "-> 승인 대기", resultTone: "human", strip: 5 },
];

export const WAVE_TABLE = [
  "time(ns)  state      recov_req dec_done cmd_done",
  "1839990   WAIT_DEC   0         0        0",
  "1840000   WAIT_DEC   1         1        0",
  "1840010   RETRY_REQ  0         0        0",
  "2040000   RETRY_REQ  0         0        0",
];

export const RTL = [
  "WAIT_DEC: begin",
  "  if (recov_req)     state_d = RETRY_REQ; // 요청 우선",
  "  else if (dec_done) state_d = DONE;      // 같은 cycle이면 유실",
  "end",
];

export const BUG_CARD = [
  "BUG-2291 (이전 과제, read channel FSM)",
  "  증상: 같은 cycle에 req와 done이 겹치면 done 유실",
  "  해결: done을 sticky flag로 잡고 천이 때 소거",
];

export const ANSWER = [
  "가설: WAIT_DEC에서 recov_req와 dec_done이 같은 cycle에",
  "      오면 완료를 놓치고 command가 멈춘다 (C2 97건)",
  "근거 1 재현  recov_retry_burst seed=48213",
  "근거 2 파형  1,840,000 ns 구간",
  "근거 3 코드  rd_recov_ctrl.sv:214",
  "근거 4 유사  BUG-2291",
  "확인 못 한 것: 나머지 96건은 signature만 일치",
  "              표본 5건 재실행 권장",
];

export const POLICY = [
  "agent: triage-agent",
  "model_route: onprem      # 설계 IP 등급",
  "tools:",
  "  regress: read",
  "  sim:     run           # queue=agent-short, 20분",
  "  tracker: draft         # 등록은 사람 승인",
  "deny: [git.push, waiver.write, signoff]",
];

export const AUDIT = [
  "{\"user\":\"dv-eng-07\",\"agent\":\"triage-agent\",",
  " \"tool\":\"sim.rerun\",\"args\":{\"seed\":48213},",
  " \"result\":\"FAIL\",\"cpu_min\":6,\"tokens\":18400}",
];
