# 전환 2. 프로세스: 순차 handoff → 상시 루프

> 상태: 초안 (2026-11-11). 상세 영상 `shift2` 의 원본이다.
> 이 문서의 과제, ID, 시각, 건수는 흐름을 보여 주기 위한 예시다. 출처가 있는 수치는 9장에 따로 적었다.

## 1. 한 줄 요약

Gate(tape-out, sign-off, 퀄 판정)는 그대로 두고, gate와 gate 사이의 기다림을 루프로 바꾼다. 변경 하나가 이벤트가 되어 영향 분석 → 선택 실행 → 실패 분류 → 다음 계획으로 그날 안에 이어진다. 루프는 Jira 이슈에서 시작하고, 단계마다 Jira에 흔적(댓글, Test Execution, 버그 초안, 전환 이력)을 남긴다. Jira 모델은 `docs/05-jira-traceability.md` 를 따른다.

## 2. 지금 무엇이 문제인가

본편 사례(REQ-QOS-07)의 한 장면에서 시작한다. Emulation에서 복구 완료 interrupt 한 건이 사라지는 문제가 나왔고, HW와 FW 담당은 완료를 status 비트 하나가 아니라 큐로 전달하기로 했다. 이 결정이 SystemRDL 몇 줄의 변경으로 올라온 날을 따라가 본다.

| 시점 (예시) | 일어나는 일 | 기다리는 것 |
|---|---|---|
| D+0 오후 | 설계자가 SystemRDL과 RTL을 고쳐 commit. API 문서 수정 요청을 등록 | 밤 regression |
| D+0 밤 | 미리 정해 둔 목록으로 전체 regression 실행 | 아침 |
| D+1 오전 | 검증 담당이 실패 로그를 분류. 예전 비트를 지우던 sequence 때문인지, RTL 때문인지 가름 | 설계자의 확인 |
| D+2 | 설계자가 수정하고 다시 밤 regression | 아침 |
| D+3 이후 | API 문서가 갱신되고, FW 팀이 변경을 알고 driver를 고침 | 문서, 리뷰 |
| 다음 장비 차례 | 최신 RTL과 FW가 FPGA나 emulator에서 처음 함께 실행. 큐가 찼을 때의 문제가 긴 부하 끝에 timeout으로 드러남 | 장비 대기열 |

각 칸의 작업은 길지 않다. 길어지는 것은 칸과 칸 사이다. 문제는 세 가지로 정리된다.

1. **변경이 사람을 거쳐 전파된다.** 어떤 테스트와 FW 파일이 영향받는지는 담당자의 기억과 문서 갱신에 달려 있다.
2. **피드백의 주기가 하루다.** 밤에 돌리고 아침에 분류하므로, 한 번 주고받는 데 하루가 든다.
3. **RTL과 FW가 늦게 만난다.** 둘이 처음 함께 도는 시점이 장비 준비 이후라서, interface 문제는 가장 비싼 곳에서 발견된다.

여기에 작성만 빨라지면 사정은 더 나빠진다. Faros AI의 텔레메트리(2026-04, 자사 발표)에서 개발자당 작업 처리량이 늘어난 조직은 첫 리뷰까지의 대기 시간도 함께 늘었다. 생성이 빨라지면 리뷰와 검증의 줄이 길어진다.

## 3. 전환 후의 모습

루프의 시작점은 Jira다. 신규 요구사항은 요구사항 이슈(제안)로, 변경 요청은 설계 기능 이슈나 버그로 들어온다. 그 이슈 키를 제목에 단 merge request(MR)가 올라오면 그것이 이벤트가 된다. 사람이 다음 사람에게 넘기지 않아도 네 가지가 차례로 일어나고, 각 단계의 결과는 Jira에서 읽을 수 있다. 사람은 보드와 Xray 화면으로, 에이전트는 JQL로 같은 것을 읽는다.

| 순서 | 루프의 단계 | 주체 | 하는 일 | Jira에 남는 것 |
|---|---|---|---|---|
| 1 | 영향 분석 | 에이전트 | 추적 그래프에서 이 변경에 걸린 요구사항, 계약, 재생성 대상, FW 파일, 테스트를 계산해 MR에 붙임 | 설계 기능 이슈(`FEAT-341`)의 에이전트 댓글 `[에이전트 · req-agent · 영향 분석]` |
| 2 | 선택 실행 | 에이전트 | 영향받는 테스트와 무작위 표본을 block 단계에서 먼저 실행 | 파이프라인 계정 `ci-import` 가 올린 Xray Test Execution(`VER-604`). Test 단위로 집계 |
| 3 | 분류 | 에이전트 | 실패를 원인별로 묶고, 묶음마다 대표 seed를 파형과 함께 다시 돌려 원인 가설 티켓을 작성 | 버그 초안(`BUG-2304`, `ai-authored`). 실패한 Test Run의 defect로 붙음 |
| 4 | 다음 계획 | 에이전트, 사람 | 사람이 가설과 수정을 승인. 재확인 범위, 추가할 assertion, FW 변경안이 다음 실행 계획이 됨 | 사람의 워크플로 전환(초안 → 등록, 수정 승인). 에이전트는 "검토 대기"까지만 |

그 바깥에 두 가지가 매일 돈다. 가상 플랫폼에서 최신 FW가 최신 계약 위에서 부팅과 I/O 시나리오를 실행하고, emulator가 준비된 뒤에는 실제 RTL과 FW가 정해진 예산 안에서 매일 짧게 만난다.

Gate는 없어지지 않는다. Gate의 통과는 사람 명의의 워크플로 전환으로 남고, 판정 기록에는 이슈 키와 정책 버전이 함께 적힌다. Block 단계의 통과율이 정책 기준을 넘어야 칩 수준 regression에 들어가고, 전체 regression과 sign-off는 지금과 같은 자리에 있다. 바뀌는 것은 gate에 도착할 때의 상태다.

## 4. 실제 예제: 스펙 한 줄이 바뀐 날

**10:12, 변경.** 설계자가 MR !2291을 올린다. 제목에 Jira 이슈 키 `FEAT-341`(설계 기능)과 `BUG-2291`(이 변경의 발단인 emulation bug)을 적어, 이슈의 개발 패널에 MR이 나타난다.

```systemrdl
// rcv_ctrl.rdl (예제)
-  field { sw=rw; onwrite=woclr; hwset; } rcv_done[3:3];  // INT_STATUS
+  reg {
+    name = "Recovery completion queue, pop on read";
+    field { sw=r; hw=w; swacc; } tag[7:0];
+    field { sw=r; hw=w; }        result[9:8];
+    field { sw=r; hw=w; }        valid[31:31];
+  } RCV_CPL_POP @ 0x48;
```

**10:16, 영향 분석.** 파이프라인이 추적 그래프와 테스트별 coverage 기록을 조회해 결과를 설계 기능 이슈 `FEAT-341` 의 댓글로 단다(MR에도 같은 내용이 보인다).

```text
[에이전트 · req-agent · 영향 분석]  FEAT-341                 ai-authored
  변경      MR !2291  rcv_ctrl.rdl  (INT_STATUS.rcv_done → RCV_CPL_POP)
  요구사항  REQ-207 (REQ-QOS-07)
  계약      HSI-RCV-012 (변경)  HSI-RCV-013 (신규: 큐가 차도 완료를 버리지 않는다)
  재생성    rcv_ctrl_regs.sv  rcv_ctrl_regs.h  rcv_ctrl_ral.sv
  RTL       rcv_ctrl/  ecc_top/ (완료 경로)
  FW        rcv_isr.cpp  rcv_driver.cpp      → FW 소유자 리뷰 요청
  테스트    block 41 / 1,280   SoC 3 / 212   VP 시나리오 2
            + 무작위 20 (선택의 편향 방지)
```

**10:20, 선택 실행.** 파이프라인 정의는 저장소에 있다. 형식은 예시이고, 쓰는 CI 도구에 맞추면 된다.

```yaml
# ci/loop.yaml (예제)
on: merge_request
steps:
  - impact: { diff: $MR, graph: trace, out: impact.json }
  - select: { from: impact.json, add_random: 20, tier: block }
  - run:    { pool: sim, budget: { license: 40, wall: 60m } }
  - triage: { bin: cause, rerun: witness_with_wave, ticket: draft }
  - gate:   { policy: gating/block.yaml }
daily:
  - vp_boot_io: { model: from_contract, fw: main }
  - emu_smoke:  { rtl: main, fw: main, budget: { slots: 2, wall: 90m } }
```

**11:20, 분류.** 61건 중 9건이 실패한다. 결과는 에이전트가 아니라 파이프라인 계정 `ci-import` 가 Xray Test Execution `VER-604` 로 올린다. Run 61건은 regression DB에 남고, Jira에는 Test 14건 단위로 집계된 결과(PASS 12, FAIL 1, TODO 1)만 올라간다. 에이전트가 두 묶음으로 나누고, 묶음마다 가장 짧은 테스트 하나를 파형과 함께 다시 돌린다.

- 묶음 A (7건): testbench의 sequence가 없어진 `rcv_done` 비트를 지우려 한다. Testbench 쪽 문제이고, sequence 수정안이 붙는다.
- 묶음 B (2건): 계약에서 파생된 assertion `a_cpl_no_drop` 이 실패한다. RTL 쪽 문제다.

**11:45, 버그 초안.** triage 에이전트가 Jira 버그를 "초안" 상태로 만들고, `VER-604` 에서 실패한 `VER-514` 의 defect로 붙인다.

```text
BUG-2304  버그   상태: 초안     작성: triage-agent   라벨: ai-authored
rcv_cpl_fifo: full 직후 push 1건 유실
묶음    B, 2건 / 실패 9건
위반    a_cpl_no_drop  (계약 HSI-RCV-013)
가설    full이 한 cycle 늦게 올라와 9번째 완료가 덮어쓴다 (깊이 8)
재현    rcv_cpl_burst_test  seed 0x5A17C3  (파형 포함 재실행 완료)
파형    48,210~48,260 ns   cpl_push, cpl_full, wr_ptr
수정안  rcv_cpl_fifo.sv:88  full 판정을 같은 cycle로. 미적용, 승인 대기
연결    VER-514 FAIL @ VER-604, FEAT-341, MR !2291, gating block v2.1
```

이 문제는 현재 방식에서는 emulator의 긴 부하 끝에 command timeout으로 나타났을 종류다.

**13:30, FW와의 만남.** 새 header로 FW main을 빌드하면 `rcv_isr.cpp` 가 없어진 비트를 참조해 빌드가 깨진다. 에이전트가 큐에서 꺼내 읽는 방식의 FW 변경안을 올리고, 계약에서 다시 만든 가상 플랫폼 모델 위에서 부팅과 복구 I/O 시나리오를 실행한다. FW 담당이 변경안을 검토한다. 문서 갱신을 기다리지 않는다.

**16:10, gate.** 설계자가 가설을 확인하고 `BUG-2304` 를 "등록"으로 옮긴 뒤 수정을 승인한다. 둘 다 Jira의 전환 이력으로 남는다. 실패했던 묶음과 영향받는 테스트가 다시 돌고, block gate가 판정한다.

```yaml
# gating/block.yaml (예제. 소유자: 검증 리드)
policy_version: v2.1
tier: block -> central
min_pass_rate: 0.95            # 선택 실행 + 무작위 표본
allow_known_issues: true       # 등록된 버그가 defect로 붙은 실패만
contract_assertions: must_pass
decision: [PROMOTE, REJECT, QUARANTINE]
agent_may_edit: false
```

판정 기록에는 그때의 정책 버전과 이슈 키(`FEAT-341`)가 함께 남는다. 기준이 나중에 바뀌어도 왜 통과했는지 설명할 수 있다.

**밤, 전체 regression.** 지금과 같이 전체가 돈다. 달라진 점은 아침에 남는 것이 수백 줄의 실패 목록이 아니라 새 원인 묶음 몇 개라는 것이다. 아침에 사람은 Jira 보드와 Xray 화면으로, 에이전트는 JQL(`issue in defectsCreatedForRequirement("REQ-207-trace") AND statusCategory != Done`)로 같은 현황을 읽는다. Merge 뒤에는 emulator의 일일 smoke에서 실제 RTL과 FW가 만난다.

**비교.** 현재는 같은 변경이 FW와 만나기까지 장비 차례를 포함해 여러 날이 걸린다. 전환 후에는 영향 범위, 실패 원인 가설, FW 변경안이 같은 날 나온다. 일수와 시각은 예시이고, 팀의 실제 값은 기준선을 측정해 채운다.

## 5. 전환 전략

순서를 정하는 기준은 하나다. 작성 단계가 아니라 대기열이 쌓이는 곳부터 한다.

1. **기록과 기준선.** 모든 실행(commit, seed, 설정, 결과)을 regression DB에 남기고, 변경에서 검증 완료까지의 시간과 triage 시간을 잰다. 측정이 없으면 어디가 가장 긴 줄인지 알 수 없다.
2. **실패 분류 루프.** 야간 regression 뒤의 수동 분류를 먼저 루프로 만든다. 지금 프로세스를 바꾸지 않고 얹을 수 있고, 틀려도 되돌릴 수 있고, 공개 사례가 가장 많다.
3. **영향 분석과 선택 실행.** SystemRDL, C++ header, RTL, 테스트를 잇는 추적 연결과 테스트별 coverage 기록이 쌓이면, 변경마다 영향 범위를 계산하고 block 단계에서 먼저 돌린다. 이때 gating 정책을 파일로 만들어 버전 관리한다.
4. **일일 통합.** 가상 플랫폼에서 FW를 매일 구동하고, 장비가 준비되면 emulator smoke를 예산 안에서 매일 돌린다.
5. **이벤트 연결.** 스펙 변경이 FW 변경안과 testplan 갱신까지 이어지게 하고, gate에 낼 증빙이 루프의 기록에서 조립되게 한다.

## 6. 실행 계획

| 단계 | 누가 | 무엇을 만드는가 | 완료 판단 |
|---|---|---|---|
| 1 | 검증 인프라 담당 | Regression DB, 기준선 리포트 | 실행 전건이 commit과 seed로 조회됨. 두 지표의 기준선이 있음 |
| 2 | 검증 엔지니어, 인프라 담당 | 실패 묶음 → 대표 재실행 → 가설 티켓 흐름. 과거 실패로 만든 평가 세트 | 묶음 정확도와 귀책(TB/RTL) 정확도를 평가 세트로 측정. 아침 분류 시간이 기준선보다 줄어듦 |
| 3 | 설계·검증 리드, FW 리드 | 추적 연결, 영향 분석 단계, `gating/block.yaml` | 전체 regression에서 나온 실패 중 선택 실행이 놓친 비율을 상시 측정. Gate 판정이 정책 버전과 함께 기록됨 |
| 4 | FW 팀, emulation 담당 | 가상 플랫폼의 일일 부팅·I/O, emulator smoke와 큐 예산 | FW main이 매일 최신 계약 위에서 실행됨. Interface 문제의 발견 시점이 장비 단계보다 앞으로 옴 |
| 5 | 각 리드, 품질 담당 | 스펙 변경 → FW 변경안, gate 증빙 조립 | Gate 회의의 증빙이 루프 기록에서 생성됨. Sign-off는 사람 명의 |

## 7. 기술 요소

| 요소 | 역할 | 성숙도 |
|---|---|---|
| 하드웨어용 CI | MR 이벤트로 lint, 생성, 시뮬레이션을 실행 | 상용·오픈소스 CI 도구에 사내 실행 스크립트를 연결. 연결은 직접 구축 |
| Regression DB | 실행, 결과, gate 판정의 공식 기록과 근거 자료 | 직접 구축. 관계형과 문서형을 함께 쓰는 공개 사례 있음(Samsung) |
| 추적 그래프 | 요구사항–계약–SystemRDL–RTL–FW–테스트 연결. 이슈 사이(요구사항 → 설계 기능 → 검증 항목 → 버그)는 Jira의 링크(`Implements`, `Tests`, defect)로 잇고 R4J와 Xray가 보여 준다 | Jira Data Center와 R4J, Xray는 상용. 파일 수준 연결(SystemRDL–RTL–FW)은 직접 구축 |
| Jira 연결 | 루프의 흔적을 남기고 지시를 받는 창구. 에이전트는 사내 MCP 서버로 조회·댓글·초안까지, 결과는 `ci-import` 가 Xray로 올림 | Jira REST와 Xray REST를 감싼 연결은 직접 구축 |
| 영향 분석·테스트 선택 | 변경과 테스트별 coverage로 테스트를 고름 | 상용 기능 있음. 흐름으로 엮는 일은 직접 |
| 실패 묶음·원인 분석 | 묶기, 대표 재실행, 가설 | 상용·early access와 논문. 가설 정확도는 공개 수치가 적음 |
| 계층형 gating | User → Block → Central, 버전 관리되는 정책 | 공개 설계 사례(Samsung). 직접 구축 |
| 가상 플랫폼 | FW를 장비 없이 실행 | 상용·오픈소스 기반 있음. SoC·NAND 모델은 직접 구축, FW 팀이 유지 |
| Emulator 큐 예산 | 일일 smoke와 재현 실행의 우선순위 | 벤더 스케줄러는 상용. 예산 규칙은 팀이 정함 |

## 8. 리스크와 지키는 선

- **선택 실행은 전체 regression을 대신하지 않는다.** 선택은 놓칠 수 있다. 전체 regression을 주기적으로 돌리고, 놓친 비율을 지표로 본다. Sign-off의 coverage는 전체 실행에서 얻는다.
- **Gating 기준은 사람이 소유한다.** 정책 파일은 리뷰를 거쳐야 바뀌고, 에이전트는 고칠 수 없다. Known issue와 waiver의 증가율을 guardrail로 본다.
- **자율 수준은 되돌릴 수 있는지로 정한다.** 재실행, 묶기, 버그 초안과 댓글, "검토 대기"까지의 전환은 자율에 맡긴다. 버그의 등록, 승인, 종결은 사람의 전환이다. RTL과 FW의 수정 반영은 사람이 승인한다. Tape-out, sign-off, 퀄 판정은 gate다.
- **장비와 license에 예산을 둔다.** 매일 돌리고 실패마다 다시 돌리면 수요가 늘어난다. 단계마다 상한을 파이프라인에 적는다.
- **에이전트의 가설은 증거가 아니다.** 버그 초안에는 재현 seed와 파형 구간이 붙어야 하고, 통과 판정은 시뮬레이터와 assertion이 한다. Jira의 PASS와 FAIL은 파이프라인이 올린 것만 인정한다.
- **가상 플랫폼은 RTL이 아니다.** 여기서 통과한 것은 계약에 대한 FW의 동작이다. RTL과의 확인은 emulator와 FPGA에서 한다.

## 9. 근거

| 내용 | 출처 | 시점 | 확인 수준 |
|---|---|---|---|
| User/Block/Central 계층, gate agent, 정책 버전과 판정 기록의 연결(min_pass_rate 예시 0.85, PROMOTE/REJECT/QUARANTINE), 관계형+문서형 DB. 영향받는 테스트를 찾는 수작업 2~3일을 없앴다는 주장. 33개 block, 테스트 2만여 개 중 약 14%가 central regression 전에 한 번도 실행되지 않았다는 조사 | Samsung Electronics, DVCon U.S. 2026 발표 자료. https://dvcon-proceedings.org/wp-content/uploads/54-A-3-Tiered-Agentic-AI-Framework-for-Verification-Regression.pdf | 2026 | 원문 직접 확인(2026-11-11). 수치는 저자 주장 |
| 변경 영향 분석 → 테스트 선택 → 실패 묶음 → 파형 분석을 하나의 흐름으로 묶음. 양산 IP 3개에서 미리 정한 sanity 목록 중 변경과 관련된 테스트는 5~20%. Runtime 최대 89% 감소, TAT 약 절반. 수동 sanity regression은 1회 4~8 engineer-hour. 한계: 대규모 변경에서 순위가 틀릴 수 있고 보조 도구로 봐야 함 | Samsung Electronics·Cadence, "A Novel Fast Regression". https://dvcon-proceedings.org/wp-content/uploads/submission_52.pdf | 2026 (행사명은 미확인, DVCon 2026 proceedings) | 원문 직접 확인. 수치는 저자 주장, 특정 벤더 툴 기반 |
| 묶기 → 대표 실행만 파형 재실행 → 원인 분석 → 전체 재검증 | ChipAgents 기고, SemiEngineering. https://semiengineering.com/scaling-autonomous-root-cause-analysis-for-regression-triage/ | 2026-10-29 | 원문 확인. 후원 기고, 정확도 수치 없음 |
| 처리량이 늘면 첫 리뷰 대기 시간도 늘어남 | Faros AI. https://www.faros.ai/blog/ai-acceleration-whiplash-takeaways | 2026-04 | 기존 리서치(`research/04`). 자사 발표 |
| 가상 prototype은 RTL과 병행 개발할 수 있고 CI의 통합 regression에 쓸 수 있음 | Synopsys 기고, SemiEngineering. https://semiengineering.com/continuous-integration-and-deployment-flows-with-virtual-prototypes | 2022-04-28 | 원문 확인. 벤더 기고, 수치 없음 |
| Emulation으로 양산 SW stack을 tape-out 수개월 전에 구동 | Microsoft, SNUG 2026. https://www.synopsys.com/blogs/chip-design/pcie-sriov-validation-zebu-vhs.html | 2026-09 | 기존 리서치(`research/02`) |
| Emulator 작업 스케줄링과 우선순위가 운영의 어려움 | Tech Design Forum. https://www.techdesignforums.com/?p=10441 | 미확인 | 검색 요약으로만 확인 |

**확인하지 못한 것.** SSD 컨트롤러 팀이 이 루프 전체를 운영한다는 공개 사례는 찾지 못했다. 스펙 변경에서 FW 변경안이 자동으로 나오는 사례, emulator 대기 시간의 공개 수치도 찾지 못했다. 4장의 시각과 건수, 이슈 키는 모두 예시다. Jira 쪽의 미확인 사항은 `docs/05-jira-traceability.md` 8장에 있다.
