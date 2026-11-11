# 전환 4. 시스템: 개인별 챗봇 → 통합 AI 플랫폼

> 상태: 초안 (2026-11-11). 대본은 `src/shifts/shift4/script.json`.
> 이 문서의 예제는 본편 사례(`03-workflow-case.md` 5장, 야간 regression 실패 312건)를 확대한 **가상 예제**다. 도구 이름, 파일 경로, seed, 건수, bug 번호는 모두 예시다. 형식(MCP 설정, tool 정의, SystemVerilog, UVM 로그)은 실제 문법을 따랐다.
> 확인 수준 표기: **[W]** 원문 직접 열람 / **[S]** 검색 요약으로만 확인 / **[K]** 사전 지식 / **[제안]** 공개 근거 없이 이 문서가 제안.

## 1. 한 줄 요약

**모델을 바꾸는 것이 아니라, 모델이 닿는 곳을 바꾼다.** 같은 질문이라도 챗봇은 붙여 넣은 로그 몇십 줄만 보고 답하고, 플랫폼의 에이전트는 regression DB를 조회하고 seed를 다시 돌리고 파형과 과거 bug를 찾아본 뒤에 답한다. 그 차이를 만드는 것은 도구 연결, 지식, 격리 실행, 평가, 권한·감사, 비용 관측이다.

## 2. 지금 무엇이 문제인가

아침에 야간 regression 결과가 온다. 검증 엔지니어는 실패 로그에서 그럴듯한 부분을 골라 챗봇 창에 붙여 넣는다. 이 장면에 문제가 다섯 개 들어 있다.

1. **챗봇은 붙여 넣은 것만 안다.** 시뮬레이터도, regression DB도, 스펙도, 과거 bug도, waiver 이력도 모른다. 그래서 답이 "handshake를 확인해 보세요" 수준의 일반론이 된다.
2. **붙여 넣을 수 있는 것이 제한된다.** RTL, 파형, 고객 요구서는 설계 IP와 고객 자료라서 외부 서비스에 넣을 수 없다. 정작 원인을 가르는 정보가 빠진 채로 묻게 된다.
3. **사람이 통로다.** 로그를 복사하고, 답을 읽고, 직접 seed를 다시 돌리고, 파형을 열고, 이슈 트래커를 검색한다. 챗봇은 그 사이의 한 칸만 메운다.
4. **남는 것이 없다.** 누가 무엇을 물었고 어떤 답을 받아 무엇을 했는지 기록되지 않는다. 좋은 질문 요령은 개인에게 남는다.
5. **맞는지 잴 방법이 없다.** 챗봇의 답이 실제 원인과 얼마나 자주 일치하는지 아무도 모른다. 비용도 모른다.

본편이 인용한 NVIDIA 자체 평가가 이 문제를 수치로 보여 준다. 같은 모델의 RTL 디버깅 통과율이 단독 호출 44.0%에서 에이전트 루프 94.3%로 올랐다[W]. 모델은 같았고, 달라진 것은 모델이 도구를 돌리고 결과를 다시 볼 수 있었다는 점이다.

## 3. 전환 후의 모습

같은 아침, 같은 질문이다. 다만 질문을 받는 쪽이 사내 플랫폼 위의 에이전트다. 플랫폼은 일곱 가지로 이뤄진다.

| # | 요소 | 하는 일 | 이 장면에서 |
|---|---|---|---|
| 1 | 사내·격리 배포 모델 | 설계 데이터가 밖으로 나가지 않는 추론 | RTL과 파형을 그대로 읽는다 |
| 2 | 도구 연결 계층 | 시뮬레이터, formal, lint/CDC, 합성, emulator 큐, issue tracker를 에이전트가 호출 | regression DB 조회, seed 재실행 |
| 3 | 지식 계층 | 스펙, 요구사항 그래프, 과거 bug와 해결, waiver 이력 검색 | 유사 bug 검색 |
| 4 | 격리 실행 환경 | 에이전트가 만든 명령을 제한된 범위에서 실행 | 재실행은 sandbox와 전용 큐에서 |
| 5 | 평가 체계 | 사내 과제 기반 평가 세트, hold-back, 심어 둔 bug | 원인 지목이 맞는 비율을 상시 측정 |
| 6 | 권한·감사 | 역할별 권한, 호출 단위 기록, 사람 승인 지점 | 티켓은 초안까지, 등록은 사람 |
| 7 | 비용 관측 | token, 시뮬레이션 시간, license 사용량 | 질문 한 건의 비용이 남는다 |

에이전트는 답을 하기 전에 일을 한다. 엔지니어가 받는 것은 일반론이 아니라 **근거가 달린 가설**(대표 seed, 파형 구간, 코드 위치, 과거 유사 bug)이고, 엔지니어가 하는 일은 복사·붙여넣기가 아니라 그 가설을 확인하고 승인하는 것이다.

## 4. 실제 예제: 같은 질문, 다른 시스템

질문: **"어젯밤 regression에서 retry 관련 실패의 원인이 뭐야?"**

### 4.1 지금: 챗봇 창

붙여 넣는 것(로그 일부. RTL과 파형은 넣지 못한다):

```text
UVM_ERROR @ 2040000ns: uvm_test_top.env.scb [SCB_TIMEOUT]
  cmd 0x3A1 no completion within 200us
  (test=recov_retry_burst seed=48213)
```

돌아오는 답:

```text
completion timeout은 보통 다음 원인으로 발생합니다.
1. request/ack handshake 불일치
2. FSM이 특정 state에서 빠져나오지 못하는 경우
3. testbench의 응답 지연 설정
파형에서 해당 command의 상태 천이를 확인해 보세요.
```

틀린 말은 없다. 하지만 "파형을 확인해 보세요" 다음의 일은 전부 사람 몫이다.

### 4.2 전환 후: 에이전트가 부르는 도구

같은 질문에 에이전트가 남기는 호출 기록이다.

```text
01 regress.query   run=nightly-1110 status=FAIL   -> 312건
02 regress.cluster by=signature                   -> 4묶음
03 regress.query   cluster=C2 tag=recov_retry     -> 97건
04 sim.rerun       recov_retry_burst seed=48213   -> FAIL
05 wave.query      recov_req,dec_done,state       -> 4행
06 code.read       rd_recov_ctrl.sv:212-240
07 kb.search       "같은 cycle 완료 누락" hybrid   -> BUG-2291
08 tracker.draft   REQ-QOS-07 연결                -> 승인 대기
```

**05의 결과.** 파형 전체가 아니라 멈추기 직전 구간만 표로 받는다(파형 database 전체를 모델에 넣지 않는다).

```text
time(ns)  state      recov_req  dec_done  cmd_done
1839990   WAIT_DEC   0          0         0
1840000   WAIT_DEC   1          1         0   <- 같은 cycle
1840010   RETRY_REQ  0          0         0   <- 완료 유실
2040000   RETRY_REQ  0          0         0   <- timeout
```

**06의 결과.** 요청을 먼저 보는 분기 때문에 같은 cycle의 완료 pulse가 버려진다.

```systemverilog
WAIT_DEC: begin
  if (recov_req)     state_d = RETRY_REQ; // 요청 우선
  else if (dec_done) state_d = DONE;      // 같은 cycle이면 유실
end
```

**07의 결과.** 검색은 두 방식을 함께 쓴다. `dec_done`, `SCB_TIMEOUT` 같은 정확한 이름은 키워드 검색이 잡고, "pulse가 겹쳐서 사라진다"는 뜻은 의미 검색이 잡는다. 식별자와 오류 코드는 의미 검색만으로는 놓치기 쉽다는 것이 검색 실무의 일반적인 권고다[S].

```text
BUG-2291 (이전 과제, read channel FSM)  score 0.82
  증상: 같은 cycle에 req와 done이 겹치면 done 유실
  해결: done을 sticky flag로 잡고 state 천이 때 소거
  추가된 검사: assert property (dec_done |-> ##[1:4] cmd_done)
```

**에이전트의 답.**

```text
가설: WAIT_DEC에서 recov_req와 dec_done이 같은 cycle에
      오면 완료를 놓치고 command가 멈춘다. (C2 97건)
근거 1 재현  recov_retry_burst seed=48213, 1.84 ms
근거 2 파형  1,840,000 ns 구간 (첨부)
근거 3 코드  rd_recov_ctrl.sv:214
근거 4 유사  BUG-2291 (이전 과제, 같은 유형)
확인 못 한 것: C2의 나머지 96건은 signature만 일치.
              표본 5건 재실행 권장.
```

마지막 두 줄이 중요하다. 에이전트는 확인한 것과 확인하지 못한 것을 구분해 적는다. 본편 사례와 같이, 설계자가 가설을 확인하고 수정을 승인한다.

### 4.3 이 장면을 가능하게 하는 설정

**도구 연결(MCP 설정 예).** 에이전트에게 도구를 알려 주는 파일이다. 사내 서버 주소만 가리킨다.

```json
{
  "mcpServers": {
    "regress": { "type": "http",
                 "url": "https://mcp.eda.internal/regress" },
    "sim":     { "type": "http",
                 "url": "https://mcp.eda.internal/sim" },
    "wave":    { "type": "http",
                 "url": "https://mcp.eda.internal/wave" },
    "kb":      { "type": "http",
                 "url": "https://mcp.eda.internal/kb" }
  }
}
```

**도구 하나의 정의(MCP tool 예).** `sim.rerun` 서버가 에이전트에게 내보내는 설명이다. 에이전트는 임의의 shell 명령을 받지 않고, 정해진 인자만 넘긴다. 실제 실행은 서버가 사내 job scheduler에 제출한다.

```json
{
  "name": "rerun",
  "description": "실패한 test를 같은 seed로 재실행한다.
                  파형은 지정한 구간만 저장한다.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "test":    { "type": "string" },
      "seed":    { "type": "integer" },
      "dump_ns": { "type": "array", "items": { "type": "integer" } }
    },
    "required": ["test", "seed"]
  }
}
```

**권한 정책(예).** 형식은 팀이 정한다. 핵심은 기본이 차단이고, 허용한 것만 열린다는 점이다.

```yaml
agent: triage-agent
model_route: onprem        # 데이터 등급 C3 (설계 IP)
tools:
  regress: read
  wave:    read
  code:    read            # rtl/, dv/ 만
  sim:     run             # queue=agent-short, 20분, 동시 8
  tracker: draft           # 등록은 사람 승인
deny: [git.push, waiver.write, signoff]
network: { egress: none }
```

**감사 기록(예).** 호출 한 건이 한 줄이다. 누가 시켰고, 무엇을 불렀고, 얼마가 들었는지 남는다.

```json
{"ts":"2026-11-11T07:42:10+09:00","run":"tr-0412",
 "user":"dv-eng-07","agent":"triage-agent",
 "tool":"sim.rerun",
 "args":{"test":"recov_retry_burst","seed":48213},
 "result":"FAIL","cpu_min":6,"tokens":18400}
```

## 5. 전환 전략: 통로 하나부터

플랫폼 전체를 먼저 짓지 않는다. 전략 문서의 순서 원칙(되돌릴 수 있는 일 먼저, 측정이 자율보다 먼저)을 그대로 따른다.

1. **읽는 통로 하나.** 사내 모델에 regression DB와 로그 조회만 연결한다. 읽기 전용이라 잘못돼도 잃을 것이 없다. 감사 기록은 이때부터 켠다. 나중에 붙이면 초기 기록이 없다.
2. **평가 세트.** 실행 권한을 주기 전에 채점 기준을 만든다. 이미 닫힌 bug 티켓의 "실패 로그 → 확정된 원인" 쌍이 그대로 문제집이 된다.
3. **실행하는 통로.** Sandbox와 전용 큐 안에서 seed 재실행과 파형 구간 조회를 연다. 여기서 4장의 예제가 처음 끝까지 돈다.
4. **지식 계층.** 과거 bug와 해결, 스펙, waiver 이력을 색인한다. 3단계의 기록을 보면 에이전트가 무엇을 못 찾아서 틀렸는지 드러나므로, 무엇부터 색인할지를 그 기록이 정해 준다.
5. **도구 확장과 비용 관측.** Formal, lint/CDC, 합성, emulator 큐, FW 빌드로 넓힌다. 고가 장비가 붙는 시점이라 예산과 비용 대시보드가 같이 들어간다.

**직접 만들 것과 사서 쓸 것.**

| 사서 쓴다 | 직접 만든다 |
|---|---|
| 모델(사내 서빙하는 open-weight 모델 또는 벤더의 고객 관리형 배포) | 사내 regression DB, job scheduler, issue tracker의 연결 서버 |
| 벤더 도구의 연결 계층(벤더가 내놓는 MCP 인터페이스) | 과거 bug, 스펙, waiver의 색인 |
| Sandbox runtime, 검색 엔진 | 평가 세트(사내 과제, hold-back, 심어 둔 bug) |
| 워크플로 에이전트 제품(평가 후 선택) | 데이터 등급 규칙, 권한 정책, 예산 |

기준은 단순하다. **우리 데이터와 우리 판정 기준에 닿는 것은 살 수 없다.** 벤더의 에이전트를 사더라도 그 에이전트가 맞는지 재는 평가 세트는 팀의 것이어야 한다.

## 6. 실행 계획

| 단계 | 누가 | 만드는 것 | 완료 판단 |
|---|---|---|---|
| 1 읽는 통로 | CAD·인프라 담당, 검증 엔지니어 1~2명, 보안 담당 | 사내 모델 endpoint, `regress` 연결 서버(읽기), 감사 기록 저장소, 데이터 등급 표 | 야간 regression 결과를 붙여 넣지 않고 질문할 수 있다. 모든 호출이 기록에 남는다 |
| 2 평가 세트 | 검증 리드, 설계자 | 닫힌 bug에서 뽑은 문제(로그 → 확정 원인), 그중 일부를 hold-back으로 분리, RTL에 bug를 심은 문제 | 모델·prompt·도구를 바꿀 때마다 같은 세트로 점수가 나온다. Hold-back은 에이전트를 만드는 사람이 보지 않는다 |
| 3 실행하는 통로 | CAD·인프라 담당 | `sim`·`wave` 연결 서버, sandbox, `agent-short` 큐와 한도, 권한 정책 | 4장의 흐름이 사람 개입 없이 가설까지 간다. 평가 세트의 원인 지목 정확도가 읽기 전용일 때보다 오른다 |
| 4 지식 계층 | 검증·설계·FW 각 1명, CAD 담당 | bug·스펙·waiver 색인(키워드와 의미 검색), 접근 권한 연동 | 평가 세트에서 "유사 bug가 있었던 문제"의 정답 bug가 검색 상위에 나온다 |
| 5 확장·비용 | CAD·인프라 담당, 각 도구 담당, 과제 관리자 | formal, lint/CDC, 합성, emulator 큐, FW 빌드 연결. 비용 대시보드 | 워크플로별 단위 작업당 비용과 품질이 같이 보인다. 예산 초과 시 자동으로 멈춘다 |

기간은 적지 않는다. 각 단계는 완료 판단을 통과해야 다음으로 간다.

## 7. 기술 요소

| 요소 | 선택지 | 성숙도 |
|---|---|---|
| 사내 모델 | (a) 사내 GPU에 open-weight 모델 서빙 (b) 벤더의 고객 관리형·air-gapped 배포 (c) 계약된 전용 endpoint(낮은 데이터 등급에만) | 상용·오픈소스. Samsung Code Mate는 on-prem[W], Siemens Fuse는 air-gapped 지원[S], Synopsys Autopilot은 on-prem 포함 고객 관리형 배포를 내세움[S, 벤더 주장] |
| 도구 연결 표준 | MCP | 표준은 성숙. Samsung Code Mate와 Siemens Fuse가 사용[W/S] |
| 벤더 도구용 MCP | Siemens Questa One Agentic Toolkit(Sim, formal, Verification IQ를 MCP로 노출, early access)[W], AMIQ DVT MCP Server(컴파일된 설계·검증 database 조회, lint 결과)[S], Synopsys Autopilot(MCP·A2A 지원 주장, 정식 출시는 2026년 말 예정)[S] | Early access~상용 초기. Synopsys Verdi, Cadence Xcelium·Jasper의 **벤더 공식** MCP 서버는 이번 조사에서 확인하지 못함 |
| 오픈소스 MCP | Icarus Verilog·Yosys·GTKWave를 묶은 서버(MCP4EDA), Xcelium을 Tcl로 잇는 커뮤니티 서버[S] | 오픈소스. 참고용. 사내 flow에 그대로 쓰기는 어렵고 형태를 참고해 직접 구축 |
| 사내 시스템 연결 서버 | regression DB, job scheduler, issue tracker의 얇은 wrapper | 직접 구축 필요 |
| 지식 계층 | 키워드(BM25)와 의미(embedding) 검색을 함께 쓰는 hybrid 검색 | 검색 엔진은 상용·오픈소스[K]. 색인 설계와 권한 연동은 직접 구축. 요구사항 그래프는 전환 1(산출물)의 결과에 의존 |
| 격리 실행 | 컨테이너 기반 sandbox, 정책으로 파일·네트워크 범위 제한 | 오픈소스 있음(NVIDIA OpenShell, 2026-03 공개, 기본 차단 네트워크 정책)[S]. Cadence·Siemens도 sandbox 실행을 내세움[S] |
| 평가 체계 | 사내 과제 세트, hold-back, 심어 둔 bug | 직접 구축 필요. 공개 benchmark(CVDP 등)는 참고용이고 사내 설계를 대신하지 못함. Samsung도 실제 개발 과제 기반 평가 환경은 "계획" 단계라고 밝힘[W] |
| 권한·감사 | RBAC, 호출 기록, 사람 승인 지점 | 벤더 제품에 포함(Siemens Fuse)[S]. 사내 도구까지 덮는 정책은 직접 구축 |
| 비용 관측 | token, CPU 시간, license 사용량을 호출 기록에서 집계 | 직접 구축(감사 기록이 있으면 집계는 쉽다) |

## 8. 리스크와 지키는 선

| 리스크 | 지키는 선 |
|---|---|
| 설계 IP·고객 자료 반출 | **데이터 등급별 모델 경로.** 설계 IP, 고객 자료, foundry 자료는 사내·격리 모델로만 간다. 에이전트 실행 환경의 외부 네트워크는 기본 차단이다. 등급 표는 보안·법무가 확정한다 |
| 에이전트가 권한을 넘는 행동 | **권한 최소화.** 읽기에서 시작하고, 실행은 sandbox와 전용 큐 안에서만. Push, waiver 등록, sign-off는 에이전트 권한에 없다. 에이전트는 임의 명령이 아니라 정의된 도구만 부른다 |
| 로그·문서에 섞인 지시문을 에이전트가 따름 | 도구 결과는 데이터로만 취급하고, 쓰기 권한이 있는 행동은 사람 승인 뒤에 둔다 |
| 장비와 token 비용 증가 | **예산.** 큐별 동시 실행 수와 시간 한도, 작업당 token 한도. Emulator처럼 비싼 장비는 사람이 우선순위를 정한다. 참고: Samsung Code Mate는 월 약 1.45조 token 사용을 밝혔다[W] |
| 그럴듯하지만 틀린 가설 | 판정은 시뮬레이터가 한다(재현되지 않는 가설은 가설로 올리지 않는다). 정확도는 hold-back과 심어 둔 bug로 잰다. 본편이 인용한 실험에서 에이전트는 검증 완료를 선언하고도 심어 둔 bug의 20.8%를 놓쳤다[W] |
| 벤더 종속 | 연결은 표준(MCP)으로, 평가 세트와 지식 색인은 팀 소유로 둔다. 그러면 모델과 에이전트 제품을 바꿔도 같은 기준으로 다시 잴 수 있다 |
| 권한이 다른 문서가 검색에 섞임 | 지식 계층은 질문한 사람의 권한으로 걸러서 검색한다(고객별 자료 분리) |

## 9. 근거

기존 리서치(`docs/research/04-ax-strategy.md` 3절, `02-verification.md`)에서 출발했고, 아래는 2026-11-11에 추가로 확인한 것이다.

| 내용 | 출처 | 시점 | 확인 |
|---|---|---|---|
| Samsung Code Mate: on-prem, 외부망과 분리, MCP로 사내 코드·문서·개발 도구 연결, 의미 기반 코드 검색, 개발자 1만 명 이상, 월 약 1.45조 token(9월 기준), 실제 과제 기반 평가 환경은 계획 | https://semiconductor.samsung.com/news-events/tech-blog/faster-and-secure-how-code-mate-is-transforming-semiconductor-software-development/ | 게시일 미표기(이미지 경로상 2026-10-29 추정) | [W] |
| Siemens Fuse 구조: MCP 기반 통합 orchestration, 기존 job scheduler와 연동, EDA data lake와 전용 RAG, sandbox, RBAC, audit trail, 사람 checkpoint. 평가 체계 언급은 없음 | https://semiengineering.com/the-architecture-decisions-behind-a-production-ready-eda-ai-agent/ | 2026-07-09 | [W] 벤더 기고(sponsored) |
| Siemens Questa One Agentic Toolkit: Questa One Sim·SFV·Verification IQ를 MCP로 노출, RTL Code·Lint·CDC·Verification Planning·Debug agent, 외부 agent(IDE·CLI)에서도 연결, early access | https://news.siemens.com/en-us/questa-one-agentic-ai-toolkit/ | 2026-02-27 | [W] 벤더 발표 |
| Siemens Fuse EDA AI Agent: RBAC, audit trail, air-gapped | https://news.siemens.com/en-us/siemens-fuse-eda-ai-agent/ | 2026-03-16 | [S] |
| Synopsys Autopilot Platform: MCP·A2A, 고객 agent 연결, on-prem 포함 고객 관리형 배포, 정식 출시는 2026년 말 목표 | https://www.synopsys.com/ai/agentic-ai.html , Tom's Hardware 보도 | 2026-09-28 | [S] 벤더 주장 |
| Cadence ChipStack: agent가 Xcelium·Jasper를 구동(보도). 벤더 공식 MCP 서버 공개는 확인하지 못함 | https://futurumgroup.com/insights/cadence-and-synopsys-accelerate-agentic-eda-race-at-computex | 2026 | [S] |
| AMIQ DVT MCP Server: 컴파일된 설계·검증 database를 agent에 제공, lint 결과 조회 도구 | https://eda.amiq.com/products/dvt-mcp-server | 2026 | [S] |
| 오픈소스 EDA MCP 서버(MCP4EDA: Yosys, Icarus Verilog, OpenLane, GTKWave) | https://glama.ai/mcp/servers/NellyW8/mcp-EDA | 2026 | [S] |
| NVIDIA OpenShell: 오픈소스 agent sandbox runtime, 정책 파일로 파일·네트워크 제한, 네트워크 기본 차단 | https://docs.nvidia.com/openshell/home | 2026-03-16 공개 | [S] |
| Hybrid 검색(키워드+의미)이 식별자·오류 코드 검색에 필요하다는 실무 권고 | 여러 기술 블로그(검색 요약) | 2026 | [S] 독립 benchmark는 확인 못 함 |
| 같은 모델의 RTL 디버깅 통과율 44.0% → 94.3% | NVIDIA Technical Blog (본편 근거) | 2026-07-26 | [W] 자체 평가 |
| 심어 둔 bug 806개 중 20.8% 누락 | SemiEngineering (본편 근거) | 2026-11-02 | [W] |

**확인하지 못한 것과 팀 확인이 필요한 것.**

- Synopsys Verdi, Cadence Xcelium·Jasper의 벤더 공식 MCP 서버: 찾지 못했다. 팀이 쓰는 시뮬레이터·debug 도구의 벤더에 직접 확인해야 한다. 없으면 3단계의 `sim`·`wave` 서버는 batch 명령과 파형 조회 API를 감싸는 직접 구축이 된다.
- 팀의 regression 결과가 조회 가능한 DB에 있는지, 파일로만 있는지. 1단계의 작업량이 여기서 갈린다.
- 사내에서 쓸 수 있는 모델과 GPU 자원, 외부 서비스 사용에 대한 현재 보안 규정. 데이터 등급 표(C1~C3)는 이 문서의 제안이다.
- 4장의 FSM 조각, 신호 이름, test 이름은 본편 사례의 가설을 코드로 옮긴 예시다. 실제 블록과 다를 수 있다.
- 플랫폼 일곱 요소를 모두 갖추고 운영한 결과를 공개한 반도체 사례는 찾지 못했다. 벤더 자료는 구성 요소를 나열하지만 평가 체계는 거의 다루지 않는다.
