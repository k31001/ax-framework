# 전환 3. 업무 방식: 직접 작성 → 의도 정의 · 증거 기반 판단

> 상태: 초안 (2026-11-11). 상세 영상 3편의 원본이다. 대본은 `src/shifts/shift3/script.json`.
> 예제의 과제, ID, 수치(120개, 96.2% 등)는 흐름을 보여 주기 위한 가상 값이다. 공개 수치는 9장에 출처를 적었다.
> Jira의 이슈 키·상태·계정 이름은 `docs/05-jira-traceability.md` 의 공통 모델을 따른다. `VER-510` 처럼 접두어와 숫자만 있으면 Jira 키, `VER-REC-012` 처럼 영역 약어가 있으면 git 산출물의 ID다.
> 이 문서의 coverage는 검증의 code/functional coverage를 뜻한다.

## 1. 한 줄 요약

엔지니어의 손이 가는 곳이 코드에서 **작업 지시서와 증거 묶음**으로 옮겨간다. 무엇을 만들지와 무엇으로 통과를 판정할지를 사람이 먼저 적고, 실행은 에이전트가 하고, 사람은 에이전트의 말이 아니라 tool이 낸 증거로 승인하거나 반려한다. 지시·보고·승인이 오가는 창구는 Jira다. 지시서와 증거의 원본은 git에 있고, Jira에는 할당, 댓글, 상태 전환이 기록으로 남는다.

## 2. 지금 무엇이 문제인가

검증 엔지니어의 하루로 보면 이렇다.

| 시간 | 지금 하는 일 |
|---|---|
| 아침 | 야간 regression 리포트를 연다. 실패 로그를 한 줄씩 읽고 testbench 문제인지 RTL 문제인지 가른다 |
| 오전 | 스펙을 읽고 sequence와 checker를 타이핑한다. 챗봇이 준 초안은 우리 환경에 맞지 않아 손으로 고친다 |
| 오후 | 동료의 testbench 변경 수백 줄을 줄 단위로 리뷰한다. 내 변경도 시니어의 리뷰를 기다린다 |
| 저녁 | Coverage 리포트의 빈 bin을 보고 내일 쓸 테스트를 적는다 |

여기에 구조적인 문제가 셋 있다.

1. **통과 기준이 작성자의 머릿속에 있다.** "이 블록이 검증됐다"의 뜻이 testbench 코드에 흩어져 있고, 리뷰어는 코드를 읽어 그 뜻을 역으로 추정한다.
2. **AI로 작성이 빨라지면 리뷰가 막힌다.** 소프트웨어 조직의 텔레메트리에서 AI 활용이 높은 구간은 첫 리뷰까지의 대기 시간이 156.6% 늘고, 리뷰 없이 반영된 변경이 31.3% 늘었다(Faros AI 자사 발표). 그럴듯해 보이는 코드를 풀어 읽는 일이 시니어에게 몰린다. 보고서는 이를 "senior engineer tax"라고 부른다.
3. **줄 단위 리뷰는 "무엇을 확인하지 않았는가"를 보지 못한다.** 리뷰어는 쓰인 코드를 본다. 빠진 checker, 너무 느슨한 assertion은 코드에 없으므로 눈에 띄지 않는다.

RTL 설계자와 FW 엔지니어도 같다. 설계자는 블록도 한 장을 해석해 RTL을 쓰고 lint 경고를 손으로 지우고, 면적과 timing은 후반에 한꺼번에 받는다. FW 엔지니어는 API 문서를 읽고 driver를 쓴 뒤 보드 로그를 눈으로 확인한다. 리뷰는 모두 diff를 줄 단위로 읽는 방식이다.

## 3. 전환 후의 모습

일의 순서가 **정의 → 위임 → 판단**으로 바뀐다.

| 순서 | 주체 | 하는 일 | 산출물 |
|---|---|---|---|
| 1 | 사람 | 의도, 통과 기준, 불변식, 금지 사항, 쓸 수 있는 tool을 적는다. Jira의 Test Plan을 에이전트 계정에 할당하고 "지시됨"으로 옮긴다. 설계 지시는 설계 기능 이슈를 할당하고 "구현 중"으로 옮긴다(4.4) | 작업 지시서(git), Test Plan·설계 기능 이슈(Jira) |
| 2 | 에이전트 | "진행 중"으로 옮기고 testbench·RTL·driver를 만들고 tool을 돌리고 스스로 고친다. 모호하면 멈추고 Jira 댓글로 질문한다 | 코드, 질문 댓글 |
| 3 | 파이프라인 | Tool 출력에서 결과를 모은다. 에이전트의 요약문이 아니라 simulator, formal, coverage, mutation tool의 원본 출력이다. Test 단위 결과는 파이프라인 계정 `ci-import` 가 Xray Test Execution으로 올린다. 에이전트는 댓글 한 건에 요약과 증거 경로를 적고 "검토 대기"로 옮긴다 | 증거 묶음(git), Test Execution과 댓글(Jira) |
| 4 | 사람 | 증거 묶음을 통과 기준과 대조해 승인하거나 반려한다. 위험 등급이 높은 부분은 코드를 직접 읽는다. 승인과 반려는 사람만 할 수 있는 워크플로 전환이다 | 승인 기록(Jira의 전환 이력) |

같은 하루가 이렇게 달라진다.

| 시간 | 전환 후 하는 일 |
|---|---|
| 아침 | Jira에서 "검토 대기"인 Test Plan 두세 건을 열고 댓글의 링크로 증거 묶음을 본다. 심어 둔 bug의 미검출 목록과 질문 목록부터 본다 |
| 오전 | 미검출 한 건을 파형으로 직접 따라가 본다. 반려 사유를 적거나 승인한다 |
| 오후 | 다음 블록의 작업 지시서를 쓴다. 통과 기준을 놓고 설계자, FW 담당과 이야기한다 |
| 저녁 | Reference model을 고치고, 이번 주에 나온 실제 bug의 유형을 심어 둔 bug 세트에 추가한다 |

두 가지가 이 방식을 떠받친다.

**생성과 검증의 분리.** 같은 에이전트가 같은 해석으로 설계와 검증을 만들면 같은 오해를 공유하고 서로 통과시킨다. 그래서 reference model과 통과 기준은 사람이 소유하고, 에이전트는 그 파일에 쓰기 권한이 없다. 검증 환경의 품질은 에이전트의 자기 보고가 아니라 **심어 둔 bug(mutation)의 검출률**로 잰다. Arm 소속 엔지니어의 실험에서 세 모델은 스스로 정한 검증 목표를 100% 달성하고 sign-off를 선언했지만, 심어 둔 bug 806개 중 최고 모델도 20.8%를 놓쳤다. 누락은 ECC memory와 AXI DMA에서 많았고, 모호한 스펙을 만났을 때 질문하지 않고 진행했다.

**리뷰 방식의 변화.** 줄 단위 전수 리뷰를 증거 리뷰와 위험 기반 표본으로 바꾼다.

| 등급 | 대상 | 리뷰 방식 |
|---|---|---|
| A | 데이터 무결성 경로, reference model, sign-off에 쓰는 checker와 통과 기준 | 사람이 전부 직접 읽고 확인. 에이전트가 줄일 수 없음 |
| B | 제어 로직, interface, CDC·reset 관련 변경 | 증거 리뷰와 구조·interface 리뷰. 변경 영향 범위에서 표본을 뽑아 읽음 |
| C | Sequence, 스크립트, 리포트 | 증거 리뷰와 무작위 표본 |

증거 리뷰는 체크리스트로 할 수 있으므로 시니어가 아니어도 맡을 수 있다. 시니어의 시간은 A 등급과 통과 기준 검토로 옮긴다.

## 4. 실제 예제: 완료 큐 변경 뒤의 재검증

본편 사례를 잇는다. 5장에서 "요청과 완료가 같은 cycle에 오면 FSM이 완료를 놓치는" bug가 나왔고, 6장에서 완료 전달이 비트 하나에서 큐로 바뀌었다. 오류 복구 제어 블록 `rcv_ctrl` 을 다시 검증해야 한다.

### 4.1 전: 타이핑하고, 로그를 읽는다

```systemverilog
class rec_done_q_seq extends uvm_sequence #(rec_item);
  `uvm_object_utils(rec_done_q_seq)   // new() 생략
  task body();
    repeat (200)
      `uvm_do_with(req, { src inside {HOST, GC};
                          gap inside {[0:8]}; })
  endtask
endclass
```

```
UVM_ERROR @ 1284350ns [SCB] cmd 0x3A timeout (no done)
UVM_ERROR @ 1291870ns [SCB] cmd 0x41 timeout (no done)
... 같은 message 57건, 다른 message 5종
```

실패를 적은 티켓은 요구사항에도 검증 항목에도 이어져 있지 않다. 리뷰어는 이 sequence와 scoreboard 수백 줄을 읽는다. Regression이 모두 통과하면 "검증됐다"고 본다. 이 환경이 어떤 bug를 못 잡는지는 아무도 모른다.

### 4.2 후 ①: 작업 지시서를 쓰고, Jira로 지시한다

```yaml
task: VER-REC-012        # 예시
req:  REQ-QOS-07 / rcv_ctrl / 완료 큐 변경
intent: 복구 완료는 유실·중복 없이 FW에 전달된다
pass:                    # 사람이 소유
  - 모든 요청은 성공 또는 실패로 한 번만 종료
  - host 요청이 GC 요청보다 먼저 처리
  - 큐가 차면 backpressure, 완료 유실 0
  - 심어 둔 bug: 미검출 전건에 사유
forbid:
  - ref_model/, 통과 기준, bug 세트 수정
  - assertion 삭제·완화, 신규 waiver
tools: [sim, formal, coverage, mutation]
stop: 스펙이 모호하면 멈추고 질문
```

지시서는 git에 두고, 지시는 Jira로 한다. 검증 리드가 Xray Test Plan `VER-510` 을 에이전트 계정 `dv-agent` 에 할당하고 "지시됨"으로 옮긴다. 이슈에는 `intent` 한 줄과 지시서 경로만 적는다. `pass` 와 `forbid` 는 저장소 권한으로 지켜야 하므로 Jira로 옮겨 적지 않는다.

```text
VER-510  Test Plan                  상태: 지시됨
rcv_ctrl 완료 큐 재검증
담당: dv-agent   검토: 검증 리드
지시서: tasks/VER-REC-012.yaml @ a71b04d
링크   relates to FEAT-341  rcv_ctrl 복구 완료 전달
```

`forbid` 는 부탁이 아니라 권한이다. 에이전트의 계정은 `ref_model/` 과 통과 기준 파일에 쓸 수 없다. 심어 둔 bug 세트는 mutation tool이 만든 것과, 사람이 과거 bug 유형에서 골라 넣은 것으로 이뤄진다. 5장의 "동시 도착 이벤트 유실"도 이 세트에 들어 있다.

### 4.3 후 ②: 증거 묶음을 검토한다

밤사이 에이전트가 testbench와 assertion을 만들고 regression, formal, mutation을 돌렸다. Test 단위 결과는 `ci-import` 가 Test Execution `VER-620` 으로 올렸고, 에이전트는 `VER-510` 에 댓글 한 건을 남기고 "검토 대기"로 옮겼다. 에이전트가 갈 수 있는 상태는 여기까지다.

```text
dv-agent  11-11 07:40   라벨: ai-authored
[에이전트 · dv-agent · 증거]
fail 0, mutation 공백 7, 질문 1
evidence/VER-REC-012/ @ a71b04d · 실행 VER-620
확인 못 한 것  큐가 찬 상태의 abort 처리
```

댓글의 경로를 따라가면 요약이 있다. Seed별 run 1,840건은 regression DB에 남고 Jira에는 올리지 않는다.

```yaml
task: VER-REC-012  rtl: 3f9c2e1  tb: a71b04d   # 예시
regression: 1840 run / fail 0
coverage:   code 98.6%  functional 96.2%
formal:     proven 14 / cex 0 / inconclusive 1
            vacuous 0
mutation:   주입 120 / 검출 109 / 미검출 11
            동등 4 (formal로 확인) / 공백 7
changed:    tb/ sva/ 만 변경. 금지 경로 0건
questions:  1건 (큐가 찬 상태의 abort 처리)
agent:      "검증 완료"   # 판정 근거 아님
```

Regression은 실패가 없고 coverage도 높다. 에이전트는 완료를 선언했다. 엔지니어는 mutation 줄부터 본다. 미검출 11건 중 4건은 동작이 달라지지 않는 동등 변형이고, 7건은 검증 환경의 공백이다. 그중 하나를 연다.

```
M-031  rec_done_q.sv:88  미검출  출처: 과거 bug 유형
- if (push_i)           wr_ptr_q <= wr_ptr_q + 1;
+ if (push_i && !pop_i) wr_ptr_q <= wr_ptr_q + 1;
→ 완료 push와 FW pop이 같은 cycle이면 완료 1건 유실
→ 이 조건을 잡는 test·assertion 없음
```

본편에서 본 그 유형이다. 블록의 구조가 바뀌자 같은 유형의 bug가 들어설 자리가 새로 생겼고, 새로 만든 검증 환경은 그 자리를 보지 않았다. Coverage 96.2%는 이 사실을 알려 주지 않는다. Sequence는 push와 pop의 동시 발생을 지나갔지만, 지나간 뒤 완료 개수가 맞는지 확인하는 checker가 없었다.

엔지니어는 반려한다. 반려와 승인은 `VER-510` 의 워크플로 전환이고, 사유는 댓글로, 이력은 Jira에 남는다. 에이전트 계정에는 "승인" 전환이 없다. "검토 대기"는 완료 선언이 아니다.

```
#1 반려  검증 담당
  - 공백 7건: 완료 개수를 보존하는 checker 없음 (M-031 외)
  - inconclusive 1건: property를 나눠 재시도
  - 질문 1건: FW 담당과 확정 후 통과 기준에 추가
#2 승인  검증 담당 / 서명
  - mutation 미검출 4 (전건 동등), formal proven 17
```

재제출에는 이 assertion이 들어 있다. 엔지니어는 이 조각을 직접 읽는다. Sign-off에 쓰는 checker는 A 등급이기 때문이다.

```systemverilog
// 완료 개수 보존: 넣은 수 = 꺼낸 수 + 큐에 남은 수
a_done_conserve: assert property (
  @(posedge clk) disable iff (!rst_n)
  push_cnt == pop_cnt + q_level);
```

### 4.4 RTL 설계자의 경우: 작업 지시와 증거

같은 틀을 RTL 설계자의 눈으로 본다. 예제는 구조 설계 편의 soft 경로다. 구조가 어떻게 정해졌는지, 예산과 계약이 어디서 나오는지는 [`docs/06-architecture-exploration.md`](../06-architecture-exploration.md) 5.7절과 6장에 있다. 여기서는 그 뒤의 일하는 방식만 다룬다. 영상에서는 s6이다.

| | 전 | 후 |
|---|---|---|
| 받는 것 | 블록도 한 장과 서술 문서 | 블록별 예산 `BUD-RCV-001`, interface 계약 `HSI-RCV-010` |
| 정의하는 것 | RTL 코드 그 자체 | Microarchitecture의 선택(상태, 큐 깊이, pipeline), 불변식, 통과 기준, 고칠 수 없는 것 |
| 실행 | 직접 쓰고 lint·CDC 경고를 손으로 지움 | 에이전트가 RTL 생성과 lint·CDC·formal·합성을 반복 |
| 판단의 근거 | diff를 줄 단위로 읽음 | Formal 증명, 예산 대비 면적·timing 표, 계약 assertion 통과. 코드는 위험한 곳만 골라 읽음 |
| 예산을 못 지킬 때 | 혼자 끼워 맞추거나 후반에 드러남 | 구조 변경 요청을 올림 |

**받는 것.** 예산표는 2 ms를 꼬리 경로의 구간으로 나눈 값과 블록별 면적이고, 계약은 순서와 한계까지 적은 것이다(예: `order: host 먼저. gc는 host 4건당 1건 이상`, `verify: [sva:a_host_first, sva:a_gc_no_starve]`). 둘 다 아키텍트 소유이고 설계자와 에이전트는 고칠 수 없다.

**정의하는 것.** 설계자는 예산을 어떻게 지킬지를 정해 작업 지시서로 적는다. 지시의 단위는 Jira의 설계 기능 이슈다. 설계자가 `FEAT-352` 를 에이전트 계정 `rtl-agent` 에 할당하고 "구현 중"으로 옮긴다(사람의 전환). 지시서 원본은 git에 있고 이슈에는 경로만 적는다.

```yaml
task: RTL-RCV-021   jira: FEAT-352   # 예시
inputs: [BUD-RCV-001, HSI-RCV-010]
intent: soft 경로는 host 우선, 예산 안에서 처리
uarch:                   # 설계자가 정함
  - 상태: IDLE·RETRY·SOFT_RD·SOFT_DEC·DONE
  - 큐 깊이 64 · decoder 앞 pipeline 1단
invariant:
  - host 요청이 gc 요청보다 먼저
  - gc는 host 4건당 1건 이상 (기아 없음)
pass: formal 증명, 계약 assertion, 예산 표
forbid: 예산, 계약, sva/ 완화, 신규 waiver
stop: 예산을 못 지키면 멈추고 보고
```

`uarch` 는 구조가 넘겨준 출발점(상태, 큐 깊이, decoder 수)에서 설계자가 고른 것이다. `forbid` 는 검증의 경우와 같이 부탁이 아니라 권한이다. `rtl-agent` 는 예산표, 계약, 계약에서 나온 assertion에 쓸 수 없다. `stop` 이 중요하다. 예산을 못 지킬 때 에이전트가 할 일은 assertion을 완화하거나 다른 블록의 여유를 끌어 쓰는 것이 아니라 멈추고 보고하는 것이다.

**에이전트가 하는 것.** RTL을 만들고 lint, CDC, formal, 합성을 통과할 때까지 반복한다. 끝나면 댓글 한 건에 요약과 증거 경로를 적고 "검토 대기"로 옮긴다. 에이전트가 갈 수 있는 상태는 여기까지다.

**증거로 판단하는 것.** 증거 묶음의 요약과 MR에 붙는 예산 대비 표다. 수치는 tool 출력에서 온다.

```yaml
task: RTL-RCV-021  rtl: 8d2e5b7      # 예시
lint:    신규 경고 0
cdc:     신규 경고 0 · 신규 waiver 0
formal:  a_host_first     proven
         a_gc_no_starve   proven
changed: rtl/soft_path/ 만 변경. 금지 경로 0건
agent:   "구현 완료"   # 판정 근거 아님
```

```text
MR !2207  FEAT-352 soft 경로 · 예산 검사 (예시)
항목                예산      측정      판정
rcv_ctrl 단계 전환  2 µs      1.4 µs    통과
soft decode (최대)  250 µs    236 µs    통과
timing slack        ≥ 0 ns    +0.06 ns  통과
ECC 블록 면적       +15%      +17%      초과
```

설계자는 RTL 줄을 전부 읽지 않는다. 불변식이 증명됐는지(vacuous 통과가 아닌지), 계약 assertion이 그대로인지, 측정이 예산 안인지를 먼저 본다. 그리고 증거가 덮지 못하는 곳을 골라 직접 읽는다. CDC 경계, reset 순서, 큐가 차거나 비는 경계다. 3장의 등급으로는 B에 해당한다. Microarchitecture가 지시서의 `uarch` 대로인지도 이때 본다.

**예산을 넘으면 구조로 올린다.** 위 표에서 ECC 블록 면적이 +17%로 예산 +15%를 넘었다. 원인은 soft decoder 3기라는 구조 결정에 있다. 설계자는 RTL을 깎아 혼자 끼워 맞추지 않고, 구조 결정 이슈에 변경 요청을 올린다.

```text
FEAT-330 댓글  RTL 설계자  [구조 변경 요청]  (예시)
ECC 블록 면적 +17% (예산 +15%)
soft_dec 3 → 2 검토 요청
→ 구조 모델 재실행: soft_dec 3 → 2
  host P99.99 1.74 ms (판정선 1.78) · 통과
  ECC 블록 면적 +13%
→ ADR-RCV-003 개정 2 · 아키텍트 승인
```

에이전트가 구조 모델을 다시 돌리고, 아키텍트가 결정 기록을 개정한다. 예산 자체를 바꾸는 것은 아키텍트의 결정이다. 그 예산을 지키는 방법과 지켰다는 판단의 책임은 설계자에게 있다.

이 예제에서 `RTL-RCV-021`, `rtl-agent`, `8d2e5b7`, timing slack 줄, pipeline 1단은 이 문서에서 더한 가상 값이다. 나머지 ID와 수치는 `docs/06` 의 것 그대로다.

### 4.5 FW 엔지니어의 경우

Read 오류 복구 정책을 고칠 때 FW 엔지니어가 요구하는 증거는 불변식 시험 결과다. "정정 실패를 주입한 read 가운데 host에 데이터가 반환된 것 0건". Host 쪽 data compare는 사람이 소유한 경로로 돌고, FW를 만든 에이전트는 그것을 고칠 수 없다. 복구 정책 코드에도 bug를 심어 불변식 시험이 잡는지 확인한다. 그리고 데이터 무결성 경로의 diff는 증거와 별개로 사람이 전부 직접 읽는다.

## 5. 전환 전략

1. **분리 규칙부터.** Reference model, 통과 기준, 심어 둔 bug 세트를 사람 소유로 지정하고 권한으로 막는다. Jira에서는 승인 계열 전환을 사람 역할에만 둔다. 양식이나 tool보다 먼저다. 이 규칙이 없으면 뒤의 증거가 모두 자기 채점이 된다.
2. **블록 하나에서 작업 지시서를 쓴다.** 되돌리기 쉬운 IP 검증 작업 하나를 고른다. 지시는 Test Plan 할당으로 한다. 양식은 써 보면서 고친다.
3. **증거 묶음을 tool 출력에서 조립한다.** 에이전트가 요약을 쓰게 두지 않고, 파이프라인이 simulator·formal·coverage 출력에서 정해진 형식으로 모은다.
4. **Mutation으로 검증 품질을 잰다.** 기존에 사람이 만든 환경에도 먼저 돌려 기준선을 얻는다. 이 수치가 있어야 에이전트가 만든 환경을 비교할 수 있다.
5. **리뷰 방식을 바꾼다.** 위험 등급과 표본 규칙, 승인 기록을 정한다. 4번의 측정이 쌓인 뒤에 한다. 증거를 믿을 근거 없이 줄 단위 리뷰부터 줄이면 통제만 사라진다.

## 6. 실행 계획

| 단계 | 누가 | 무엇을 만드는가 | 완료 판단 |
|---|---|---|---|
| 1 분리 규칙 | 검증 리드, 인프라 담당 | 사람 소유 경로 목록, 저장소 권한 설정, 금지 경로 변경을 막는 검사 | 에이전트 계정으로 금지 경로에 쓰기를 시도하면 거부되고 기록이 남음 |
| 2 작업 지시서 | 검증 엔지니어(시범 블록), 설계자 | 지시서 양식 v0, 시범 블록의 지시서 | 작성자가 아닌 엔지니어가 지시서만 읽고 통과 기준을 같은 뜻으로 설명함 |
| 3 증거 묶음 | 인프라 담당, 검증 엔지니어 | 요약 형식, tool 출력 수집 스크립트, 재현 seed와 파형 구간 보관 규칙 | 묶음의 모든 수치에서 원본 로그로 갈 수 있고, 같은 commit·seed로 재현됨 |
| 4 Mutation 측정 | 검증 엔지니어 | Mutation 실행 환경, 과거 bug 유형 세트, 기존 환경의 기준선 | 시범 블록에서 기존 환경과 에이전트 생성 환경의 검출률, 미검출 사유가 나란히 기록됨 |
| 5 리뷰 전환 | 리드, 전 엔지니어 | 위험 등급표, 증거 리뷰 체크리스트, 승인 기록 양식, 주니어의 직접 debug 과제 | 등급별 리뷰 시간과 escape가 측정되고, A 등급 변경에 사람의 직접 확인 기록이 빠짐없이 있음 |

증거 리뷰 체크리스트의 뼈대는 다음과 같다. ① 통과 기준 항목마다 대응하는 증거가 있는가 ② 금지 경로가 바뀌지 않았는가 ③ 미검출 mutation 전건에 사유가 있고 "동등" 판정은 tool로 확인됐는가 ④ Formal 결과에 vacuous 통과나 inconclusive가 남아 있지 않은가 ⑤ 에이전트의 질문이 답해졌는가 ⑥ Waiver와 exclusion이 늘지 않았는가 ⑦ 재현 seed로 실제로 재현되는가.

## 7. 기술 요소

| 요소 | 내용 | 성숙도 |
|---|---|---|
| 작업 지시서 양식 | YAML 등 저장소에서 버전 관리되는 형식. 요구사항 카드에 연결 | 직접 구축 (형식만 정하면 됨) |
| 증거 묶음 형식과 수집기 | Tool 출력을 요약 형식으로 모으는 스크립트. Coverage DB와 regression DB는 기존 것을 씀 | 직접 구축. 원본을 내는 tool은 상용 |
| RTL mutation tool | Synopsys Certitude(상용, functional qualification), YosysHQ MCY(오픈소스, 동등 변형을 formal로 걸러 냄) | 상용·오픈소스 모두 있음. 에이전트 루프에 묶는 일은 직접 구축 |
| FW mutation tool | Mull(오픈소스, C/C++, LLVM 기반) | 오픈소스. Clang 빌드와 host에서 도는 단위 테스트가 전제라서 FW 빌드 체계에 따라 적용 범위가 제한됨 |
| Formal, vacuity 검사 | 기존 formal tool의 기능 | 상용 |
| 독립 검증 경로 | 사람 소유 reference model, 에이전트가 본 적 없는 hold-back test, 생성 에이전트와 분리된 정보·권한 | 직접 구축 |
| Jira (Data Center, Xray) | Test Plan이 작업 지시의 단위, Test Execution이 실행 결과, 댓글이 질문과 증거 보고, 워크플로 전환이 승인 기록. 에이전트는 사내 MCP 서버를 거쳐 조회·댓글·"검토 대기"까지의 전환만 한다 | Jira와 Xray는 상용. 워크플로·역할 설정과 MCP 서버는 직접 구축 |
| 권한과 승인 기록 | 저장소 경로별 쓰기 권한, Jira 전환의 역할 조건, 승인·반려 기록(전환 이력). 에이전트 플랫폼의 RBAC·감사 기록(벤더 발표)과 연결 | 저장소 기능은 상용, 연결은 직접 구축 |

Mutation은 비용이 든다. 변형마다 테스트를 다시 돌리므로 전체 regression이 아니라 그 변형을 잡을 가능성이 있는 테스트부터 돌리고, 블록 단위로 적용한다.

## 8. 리스크와 지키는 선

| 리스크 | 대응 |
|---|---|
| 증거 묶음이 형식이 된다. 숫자만 보고 승인 | 승인자는 미검출 한 건 이상을 직접 따라가 보고 기록한다. 승인 기록을 표본 감사한다 |
| Mutation 검출률이 목표가 되어 조작된다 | 세트는 사람이 소유하고 에이전트에게 목록을 미리 주지 않는다. Hold-back test를 따로 둔다 |
| Mutation 검출률을 실제 bug 검출률로 오해 | 대리 지표임을 명시한다. 실제 escape와 함께 본다 |
| 지시서가 부실하면 결과도 부실 | 지시서도 리뷰 대상이다. 통과 기준은 설계·FW 담당이 함께 본다 |
| 리뷰 부담이 다시 시니어에게 몰림 | 증거 리뷰는 체크리스트로 분담하고, 시니어는 A 등급과 통과 기준에 집중 |
| 주니어의 역량 공동화 | 직접 debug 구간을 유지한다. 미검출 mutation 분석과 지시서 작성을 주니어 과제로 둔다. 한 통제 실험에서 AI 사용 그룹의 이해도 점수는 50%, 수작업 그룹은 67%였고 격차는 debugging 문항에서 가장 컸다 |
| 같은 모델도 실행마다 결과가 다름 | 판정은 결정론적 tool의 출력으로만 한다 |

**지키는 선.**

- Sign-off는 사람 명의다. 에이전트의 완료 선언은 증거로 인정하지 않는다. Jira에서 에이전트가 갈 수 있는 마지막 상태는 "검토 대기"이고, 승인 전환은 사람 역할에만 있다.
- Jira에는 경로와 commit만 적는다. 통과 기준과 증거를 이슈에 옮겨 적으면 원본이 둘이 된다.
- 데이터 무결성 경로는 증거와 별개로 사람이 직접 확인한다.
- Reference model, 통과 기준, 심어 둔 bug 세트는 사람이 소유한다.
- Assertion 완화, waiver, exclusion은 사람의 승인 없이 늘지 않는다.

## 9. 근거

| 내용 | 출처 | 시점 | 확인 수준 |
|---|---|---|---|
| 설계 25개, 심어 둔 bug 806개. 검출률 79.2 / 76.2 / 62.8%. 세 모델 모두 자체 목표 100% 달성 후 sign-off 선언. ECC memory·GPIO·AXI DMA에서 누락이 많음. 모호한 스펙에 질문 없이 진행. 실행마다 결과가 다름. Hold-back test 권고 | https://semiengineering.com/putting-ai-to-the-test/ | 2026-11-02 | 원문 열람(2026-11-11 재확인). Arm 소속 엔지니어의 실험, RTL 비공개 |
| 첫 리뷰까지 시간 +156.6%, 리뷰 없이 반영 +31.3%, "senior engineer tax" | https://www.faros.ai/blog/ai-acceleration-whiplash-takeaways | 2026-04 | 원문 열람. Faros AI 자사 발표, 소프트웨어 조직 대상 |
| AI 사용 그룹 50% 대 수작업 67%, debugging 문항에서 격차 최대. 설명을 요구하며 쓴 참가자는 높은 점수 | https://www.anthropic.com/research/AI-assistance-coding-skills | 2026-01-29 | 원문 열람. 52명 대상 통제 실험, Python 과제(HW 아님) |
| 문법상 유효하지만 느슨한 assertion의 거짓 확신 | https://semiengineering.com/from-spec-to-formal-properties/ | 2026-08-27 | 기존 리서치(`research/02-verification.md`)에서 확인. 인용 의견 |
| Testbench를 통과한 LLM 생성 RTL 후보의 14.5%가 기능 오류 | https://neurips.cc/virtual/2026/161622 | 2026 | 기존 리서치에서 확인. Workshop 논문 |
| MCY: 변형을 만들고 동등 변형을 걸러 testbench coverage를 측정 | https://mcy.readthedocs.io/ | 열람 2026-11-11 | 검색 요약과 문서 확인. 오픈소스 |
| Certitude: 설계에 fault를 주입해 검증 환경이 잡는지 측정 | https://www.techdesignforums.com/practice/?p=2269 | 자료는 2009~2016년 | 검색 요약. 현재 제품 구성은 미확인 |
| Mull: LLVM 기반 C/C++ mutation testing | https://github.com/mull-project/mull | 열람 2026-11-11 | 검색 요약. 최신 판 번호는 미확인 |
| 리뷰 대상이 코드에서 결과와 증거로 바뀐다는 방향 | `research/04-ax-strategy.md` 3절 | 2026-11-10 | 기존 리서치 |

**확인하지 못한 것.**

- 같은 모델이 설계와 검증을 함께 만들 때의 공통 오류를 직접 측정한 연구는 찾지 못했다. 분리 규칙은 위 실험과 검증 독립성의 일반 원칙에 근거한 판단이다.
- 작업 지시서와 증거 묶음이라는 형식을 칩 설계 조직이 운영한 공개 사례는 찾지 못했다. 이 문서의 제안이다.
- 증거 리뷰가 줄 단위 리뷰보다 escape를 줄인다는 실증은 없다. 그래서 5단계는 측정이 쌓인 뒤에 둔다.
- 팀의 현재 리뷰 규칙, mutation tool 보유 여부, FW의 host 단위 테스트 범위는 확인이 필요하다.
