# 전환 1. 산출물: 사람용 문서 → 실행 가능한 스펙

> 상태: 초안 (2026-11-11). 상세 영상 `shift1` 의 원본이다.
> 이 문서의 코드·ID·수치는 흐름을 보여 주기 위한 예시다. 블록 이름(`rcv_ctrl`), register 이름, 계약 ID는 실제 과제 값이 아니다.

## 1. 한 줄 요약

API 문서에 문장으로 남아 있는 동작 규약을 **ID와 판정 방법이 있는 계약**으로 옮기고, assertion·driver 테스트·문서를 그 계약에서 만들어 낸다. 사람은 문서를 읽고 맞추는 대신 계약을 정한다. 계약과 수용 기준의 원본은 git에 두고, 요구사항에서 설계 기능, 검증 항목, bug까지의 링크와 상태, 논의는 팀이 이미 쓰는 Jira(R4J, Xray)에 둔다(`docs/05-jira-traceability.md`).

## 2. 지금 무엇이 문제인가

이 팀의 register는 이미 SystemRDL이다. 주소, 비트 위치, 접근 방식은 한 원본에서 나오므로 HW와 FW가 어긋나지 않는다. 문제는 그다음 층이다.

- **동작 규약은 문장이다.** Interrupt를 지우는 규칙, 접근 순서, 초기화 순서, errata는 API 문서의 서술이다. 설계자는 그 문장을 읽고 RTL을, 검증 엔지니어는 sequence와 assertion을, FW 엔지니어는 driver를 각자 만든다. 같은 문장에 해석이 셋이다.
- **문장은 빠진 경우를 드러내지 않는다.** "읽은 뒤 1을 써서 지운다"는 문장은 틀리지 않았다. 다만 "지우기 전에 같은 사건이 또 오면"에 대한 답이 없고, 답이 없다는 사실을 아무도 알아채지 못한다.
- **본편 사례의 bug가 여기서 났다.** 복구 완료가 짧은 간격으로 두 번 오자 두 번째 완료가 같은 status 비트에 겹쳐 한 건이 사라졌다(`03-workflow-case.md` 6장). IP 시뮬레이션에서는 FW 역할의 sequence가 status를 바로 지워서 드러나지 않았고, emulation의 장시간 부하에서 command timeout으로 나왔다.
- **다른 산출물도 같은 형태다.** 요구사항은 엑셀의 한 줄이고 수용 기준의 판정 방법은 담당자의 머릿속에 있다. Bug report는 자유 서술이라 "같은 원인인가"를 사람이 읽어서 가린다.

산출물별로 지금의 형태와 그 형태로는 할 수 없는 일을 적으면 이렇다.

| 산출물 | 지금의 형태 | 할 수 없는 일 |
|---|---|---|
| Register 정의 | SystemRDL | (이미 실행 가능하다. RTL과 header가 여기서 나온다) |
| 동작 규약 | API 문서의 문장, 번호 목록, 구두 전달 | RTL이나 driver가 규약을 지키는지 자동으로 판정하기 |
| 요구사항과 수용 기준 | 엑셀의 행, 판정 방법은 담당자가 앎 | 요구사항 하나를 고쳤을 때 영향받는 블록과 테스트를 계산하기 |
| 추적 | 엑셀 추적표를 사람이 갱신. Jira 티켓에는 링크가 없다 | 어떤 요구사항이 지금 어떤 테스트로, 어떤 결과로 덮였는지 조회하기 |
| Bug 기록 | 자유 서술과 첨부 파일 | 같은 원인의 bug를 묶기, 어느 단계에서 왜 빠져나왔는지 집계하기 |

사람이 읽기에는 충분하지만, 툴과 에이전트가 실행하거나 대조할 수 없는 형태다. EDA 3사의 워크플로 에이전트가 모두 스펙을 입력으로 전제한다는 점(`research/01-frontend-design.md`)에서, 이 층이 비어 있으면 에이전트를 들여도 사람이 사이를 이어야 한다.

## 3. 전환 후의 모습

같은 장면이 이렇게 달라진다.

| 장면 | 지금 | 전환 후 |
|---|---|---|
| 규약을 정할 때 | API 문서에 문장을 쓴다 | 계약 카드를 쓴다. 필수 칸(지우는 방법, 접근 순서, **처리 전 재발생 시 동작**, 가득 찼을 때)을 채워야 등록된다 |
| 규약을 확인할 때 | 리뷰에서 문서를 읽는다 | 계약에서 나온 assertion이 formal과 regression에서 돈다 |
| FW가 규약을 받을 때 | Header와 문서를 읽고 구현한다 | 생성된 header와, 계약의 동작을 흉내 내는 모델 위에서 도는 driver 테스트를 받는다 |
| 규약에 빈칸이 있을 때 | 아무도 모른다 | 양식 검사기가 막고, 질문이 설계 기능 이슈(`FEAT-341`)의 댓글로 HW·FW 담당에게 간다 |
| 규약이 바뀔 때 | 문서 개정 후 메일로 알린다 | 계약 변경이 PR이다. 제목에 이슈 키를 쓰므로 Jira의 설계 기능 이슈에 나타나고, 재생성된 assertion·header·테스트가 같은 PR에서 깨지거나 통과한다 |
| Bug의 원인을 따질 때 | HW와 FW가 각자의 trace를 든다 | 실패한 검증 항목(Xray Test)에 붙은 bug 이슈에서, 어느 계약의 어느 칸이 비었거나 어겨졌는지를 본다 |

역할별로 보면 하루가 이렇게 달라진다.

- **RTL 설계자.** 지금은 interface가 바뀌면 RDL을 고치고, API 문서의 해당 문단을 찾아 고치고, FW 담당에게 알린다. 전환 후에는 계약 카드와 RDL을 고쳐 PR을 올린다. 문서와 header는 따라 나오고, 설계자는 자기 RTL이 생성된 assertion을 통과하는지를 그 PR에서 바로 본다.
- **검증 엔지니어.** 지금은 API 문서를 읽고 규약마다 assertion을 손으로 쓰고, FW 역할 sequence의 응답 시점을 스스로 정한다. 전환 후에는 규약 checker를 쓰는 대신 계약 양식의 필수 칸과 생성 템플릿을 관리하고, 생성물이 심어 둔 위반을 잡는지를 잰다. 손으로 쓰는 assertion은 블록 내부 동작 쪽으로 옮겨 간다.
- **FW 엔지니어.** 지금은 header와 API 문서를 읽고 driver를 쓴 뒤 보드나 emulator 순서를 기다려 확인한다. 전환 후에는 계약 모델 위에서 도는 테스트가 driver와 같이 오므로, 규약을 지켰는지는 자기 자리에서 빌드할 때 확인된다. 계약이 바뀌면 깨진 테스트와 변경안이 먼저 도착한다.

**어디까지가 "스펙에서 파생"인가.** 파생되는 것은 interface 층이다: register RTL, header, register model, 규약 checker, 문서. 데이터 경로와 FSM의 RTL, FW의 정책 코드는 파생물이 아니다. 사람이나 에이전트가 쓰고, 계약에서 나온 checker가 그것을 판정한다.

## 4. 실제 예제: 문장 하나가 계약이 되기까지

대상은 본편의 오류 복구 제어 블록(`rcv_ctrl`)의 복구 완료 interrupt다.

### 4.1 지금: 산출물 셋, 해석 셋

API 문서의 문장:

> 복구 완료 interrupt는 `IRQ_STATUS`를 읽은 뒤 `RCV_DONE`에 1을 써서 지운다. 완료된 command의 tag는 `RCV_RESULT`에서 읽는다.

SystemRDL은 이 중 "어디에 있고 어떻게 지워지는가"까지만 말한다.

```systemrdl
reg {
  default sw = rw; default hw = w;
  field { level intr; woclr; } RCV_DONE[0:0] = 0;
} IRQ_STATUS @ 0x40;
```

`intr` field는 기본이 sticky라서, 비트가 1인 동안 완료가 한 번 더 와도 1 그대로다. 순서(읽고 나서 지운다), `RCV_RESULT`와의 관계, 재발생 시 동작은 RDL에 없다. IP 시뮬레이션의 FW 역할 sequence는 interrupt가 뜨면 다음 cycle에 지웠고, 실제 FW는 다른 일을 마치고 나서 지웠다.

### 4.2 계약으로 옮긴다: 빈칸이 드러난다

계약은 YAML 카드다. 대상은 SystemRDL의 계층 경로로 가리키고, 규칙 본문은 여기에 둔다(형식 선택의 이유는 7장).

```yaml
id: HSI-RCV-012            # 계약 v1: 문장을 그대로 옮김
jira: FEAT-341             # 이 계약이 이어진 Jira 설계 기능 이슈
req: REQ-QOS-07
target: rcv_ctrl.IRQ_STATUS.RCV_DONE
event: 복구 한 건 완료
clear: W1C
order: [read IRQ_STATUS, read RCV_RESULT, clear RCV_DONE]
fw_latency: unbounded      # FW가 언제 처리할지 HW는 가정하지 않음
on_overlap: ???            # 처리 전에 완료가 또 오면?  ← 필수 칸
```

양식 검사기는 `on_overlap`이 비면 등록을 거부한다. 문장에는 없던 질문이 여기서 강제된다. 질문은 메일이나 구두가 아니라 `FEAT-341` 의 댓글로 간다. 에이전트가 옮기던 중이면 댓글 머리말은 `[에이전트 · dv-agent · 질문]` 이고, 끝에 "요청: HW 담당, FW 담당: 값 결정"을 적는다. 답과 결정의 이력이 이슈에 남는다. 가장 단순한 답("겹치지 않는다")을 적으면 생성기가 이 assertion을 만든다.

```systemverilog
// HSI-RCV-012.on_overlap = never 에서 생성
a_no_overlap: assert property (
  @(posedge clk) disable iff (!rst_n)
  rcv_done_set |-> !irq_status_rcv_done);
```

복구 엔진이 완료를 연속으로 낼 수 있는 한 이 property는 formal에서 몇 cycle짜리 반례로 깨진다. 본편에서는 emulation 장시간 부하에서 만난 bug를, 여기서는 RTL 단계에서 만난다. 같은 `fw_latency: unbounded`에서 FW 역할 sequence의 응답 지연도 randomize되므로, "바로 지워서 안 보였다"는 구멍도 같이 닫힌다.

### 4.3 계약을 고친다: 사람의 결정

HW와 FW 담당이 함께 정한다(본편 6장의 결정 그대로). 계약 확정은 `FEAT-341` 을 "정의 중"에서 "구현 중"으로 옮기는 전환이고, 이 전환은 사람만 할 수 있다. 완료는 큐로 전달하고, 큐가 차면 엔진이 새 완료를 내지 않고 기다린다.

```yaml
id: HSI-RCV-012            # 계약 v2
jira: FEAT-341
event: 복구 한 건 완료
deliver: queue(depth=16)   # 완료 한 건 = 항목 한 개
irq: level, CPL_STATUS.CNT != 0 인 동안 유지
order: [read CPL_STATUS, read CPL_POP until CNT == 0]
on_overlap: enqueue
on_full: backpressure      # 엔진이 완료를 보류. 유실 금지
verify: {sva: [a_no_drop, a_irq_level], fw_test: two_done_b2b}
```

### 4.4 같은 계약에서 나오는 것들

**SystemRDL (사람이 고치고, 계약과 검사기로 대조).** `swacc`는 FW가 읽는 순간의 strobe를 만들어 큐의 pop으로 쓴다.

```systemrdl
reg { field { sw=r; hw=w; } CNT[4:0]; } CPL_STATUS @ 0x40;
reg {
  field { sw=r; hw=w; swacc; } TAG[15:0];   // 읽으면 한 건 pop
  field { sw=r; hw=w; } RESULT[19:16];
} CPL_POP @ 0x44;
```

**SVA (생성, 직접 고치지 않음).**

```systemverilog
// HSI-RCV-012 에서 생성
a_no_drop:   assert property (@(posedge clk) disable iff (!rst_n)
  cpl_push |-> !cpl_full);            // 가득 찼을 때 밀어 넣지 않음
a_irq_level: assert property (@(posedge clk) disable iff (!rst_n)
  (cpl_cnt != 0 && irq_en) |-> irq_rcv_done);
c_overlap:   cover  property (@(posedge clk)
  cpl_push && cpl_cnt != 0);          // 겹침이 실제로 시험됐는가
```

`cover`가 같이 나오는 이유는 assertion이 조건을 한 번도 만나지 못한 채 통과하는 것을 막기 위해서다.

**C++ header (상수와 형은 생성, 함수는 골격을 생성하고 FW가 검토).**

```cpp
// rcv_ctrl_hsi.hpp — HSI-RCV-012 에서 생성
namespace rcv_ctrl {
inline constexpr uint32_t CPL_STATUS = 0x40;  // CNT[4:0]
inline constexpr uint32_t CPL_POP    = 0x44;  // 읽으면 pop
struct Completion { uint16_t tag; uint8_t result; };
// 계약 order: CNT 가 0 이 될 때까지 꺼낸다
template <class Bus, class Fn>
void drain_completions(Bus& bus, Fn&& handle) {
  while (bus.read(CPL_STATUS) & 0x1F)
    handle(decode(bus.read(CPL_POP)));
}
}  // namespace rcv_ctrl
```

**Driver 테스트 (생성, 보드 없이 host에서 실행).** `HsiModel`은 계약의 동작(큐, pop, level interrupt)만 흉내 내는 작은 모델이다.

```cpp
TEST(RcvDriver, two_done_b2b) {        // HSI-RCV-012
  HsiModel hw;
  hw.push_completion({.tag = 7});
  hw.push_completion({.tag = 9});      // 첫 건 처리 전에 도착
  std::vector<uint16_t> seen;
  rcv_isr(hw, [&](auto c) { seen.push_back(c.tag); });
  EXPECT_EQ(seen, (std::vector<uint16_t>{7, 9}));
}
```

**API 문서.** 같은 카드에서 표와 문장으로 다시 만든다. 손으로 고치지 않는다.

### 4.5 같은 방식의 다른 산출물

초기화 순서와 errata도 같은 양식의 다른 패턴이다. 지금은 API 문서의 번호 목록과 구두로 전해지는 것들이다.

```yaml
id: HSI-RCV-003            # 패턴: 초기화 순서 (예시)
target: rcv_ctrl
sequence:
  - write CTRL.SOFT_RESET = 1
  - wait  STATUS.RESET_DONE == 1
  - write QUEUE_CFG, RETRY_CFG      # ENABLE 전에만 허용
  - write CTRL.ENABLE = 1
violation: ENABLE == 1 인 동안 QUEUE_CFG 쓰기 금지
applies_to: [rev A, rev B]          # errata 는 revision 을 적는다
```

`violation` 줄은 그대로 assertion 하나(`CTRL.ENABLE` 이 1일 때 `QUEUE_CFG` 쓰기 strobe가 없을 것)와 driver 쪽 테스트 하나(순서를 어기면 계약 모델이 오류를 낸다)가 된다.

요구사항. Jira에는 요구사항 이슈 `REQ-207`(R4J 트리의 `QoS/` 아래, 상태 "승인")이 있고, 이슈에는 요구사항 ID와 수용 기준 파일의 경로만 적는다. 수용 기준 자체는 git의 파일이고, 판정 방법과 판정 장소가 붙는다.

```yaml
id: REQ-QOS-07
jira: REQ-207
title: 수명 말기 NAND 조건에서 read 지연 보장
source: 고객 요구서 §4.2 (예시)
acceptance:
  - id: AC-1
    metric: P99.99 read latency
    limit: "<= 2 ms"
    judged_at: [구조 모델, emulation, 제품 테스트]
impacts: [ECC, NAND_IF, FW.read_recovery]
```

추적은 표가 아니라 링크다. 링크가 보이는 곳은 Jira다.

```text
REQ-207  요구사항  REQ-QOS-07
 ├─ is implemented by ─ FEAT-341  rcv_ctrl 복구 완료 전달 (계약 HSI-RCV-012)
 │    ├─ tested by ─ VER-512  a_no_drop      PASS @ VER-604
 │    └─ tested by ─ VER-513  two_done_b2b   PASS @ VER-604
 └─ tested by ─ VER-530  혼합 부하 P99.99 (emulation)
      └─ FAIL ─ defect ─ BUG-2291
```

계약의 `verify:` 목록이 Xray Test(`VER-512`, `VER-513`)가 되고, "최근 실행 결과"는 파이프라인이 올린 Test Execution의 값이다. 계약의 `jira:`·`req:` 칸과 생성물의 머리말 주석을 Jira 링크와 주기적으로 대조하므로 따로 관리하는 추적표가 없다. 엑셀 추적표가 하던 "빠진 곳 찾기"는 R4J의 Coverage View가 한다(설계 기능이 없는 요구사항, Test가 없는 설계 기능이 빈칸으로 보인다).

Bug 기록. 자유 서술 대신 칸이 있다. Jira의 버그 이슈 `BUG-2291` 의 필드이고, 이 이슈는 실패한 Test(`VER-530`)의 defect로 붙는다.

```yaml
id: BUG-2291                       # 예시
signature: cmd_timeout / rcv_ctrl / 완료 병합
found_at: emulation, 장시간 혼합 부하
repro: tests/rcv/two_done_b2b (sim)
waveform: emu_run_118, 완료 2건 구간
root_cause: 완료 2건이 RCV_DONE 한 비트에 겹침
contract: HSI-RCV-012 (on_overlap 미정의)
escaped_from: IP sim, FW 역할 sequence 가 즉시 clear
fix: [contract v2, rdl, rtl, fw]
```

`escaped_from`과 `contract` 칸이 다음 계약 양식을 고치는 입력이 된다.

## 5. 전환 전략

1. **규약 목록부터.** 블록 하나(예: `rcv_ctrl`)의 API 문서에서 동작 규약 문장을 뽑아 ID를 붙인다. 에이전트가 후보를 추출하고 HW·FW 담당이 확정한다. 지난 과제의 통합 bug가 났던 규약을 먼저 고른다. 이유: 효과를 설명할 사례가 이미 있고, 생성기 없이도 "빈칸 찾기"만으로 값을 낸다.
2. **계약 양식과 검사기.** 패턴을 넷으로 한정한다: interrupt 전달과 지우기, 접근 순서, 초기화 순서, errata(적용 revision 포함). 패턴마다 필수 칸을 정한다. 이유: 양식이 질문을 강제하는 것이 이 전환의 핵심이고, 범용 언어를 만들려 들면 끝나지 않는다.
3. **파생기.** 패턴별 템플릿으로 SVA와 bind 파일, sequence의 지연 제약, header, 계약 모델, driver 테스트, 문서를 만든다. 패턴에 안 맞는 규약은 에이전트가 SVA 초안을 쓰고 사람이 검토한다. 이유: 고정 패턴은 결정론적으로 생성해야 믿을 수 있다.
4. **CI에 넣는다.** 계약 변경은 PR이다. 재생성 → formal·sim·driver 테스트 → FW 변경안 순으로 돈다. 생성 파일을 손으로 고치면 재생성 diff 검사에서 걸린다.
5. **옆으로 넓힌다.** 요구사항 이슈와 수용 기준 파일, Jira 링크(`Implements`, `Tests`), 버그 이슈의 필드. 이유: 계약에 `jira:`, `req:`, `verify:` 칸이 생기면 추적 사슬의 절반은 이미 있다. 새 도구를 들이지 않고 팀이 쓰는 Jira에 R4J와 Xray를 더한다.

**하지 않는 것.** API 문서 전체를 한 번에 계약으로 옮기지 않는다. 규약이 아닌 설명 문단은 문서에 그대로 둔다. 무엇이든 적을 수 있는 범용 언어를 만들지 않는다. 패턴에 안 맞는 규약은 당분간 문장으로 두되 ID를 붙이고, 사람이 쓴 assertion이나 테스트를 `verify:` 칸에 연결한다. 이것만으로도 "이 규약은 무엇으로 확인되는가"에 답이 생긴다.

## 6. 실행 계획

| 단계 | 누가 | 만드는 것 | 완료 판단 |
|---|---|---|---|
| 1 규약 목록 | RTL 설계자, FW 엔지니어 (에이전트가 추출) | 블록 하나의 규약 목록과 ID, 과거 통합 bug와의 대응표 | 대상 블록의 API 문서 문장이 모두 "규약 / 설명"으로 분류됨 |
| 2 양식·검사기 | 검증 엔지니어, 플랫폼 담당 | 패턴 4종의 YAML schema, 검사기, RDL 경로 대조 | 과거 통합 bug 사례를 양식에 넣었을 때 빈칸이나 위반으로 드러남 |
| 3 파생기 | 검증 엔지니어(SVA·sequence), FW 엔지니어(header·테스트) | 템플릿 생성기, 계약 모델, 문서 생성 | 심어 둔 규약 위반 RTL과 driver를 생성물이 잡음 |
| 4 CI | 플랫폼 담당 | 계약 PR 파이프라인, 재생성 diff 검사 | 계약 한 줄 변경이 사람 손 없이 assertion·header·테스트에 반영됨 |
| 5 확장 | 요구사항·시스템 담당, 테스트·퀄 담당 | Jira의 요구사항·설계 기능 유형과 링크, Xray Test, 버그 이슈 필드 | `REQ-207` 하나로 계약·Test·최근 결과·bug가 조회되고, R4J Coverage View의 빈칸이 0 |

**지켜볼 지표.** 계약으로 옮긴 규약의 비율, `verify:` 칸이 채워진 계약의 비율, 통합 단계(emulation·FPGA 이후)에서 나온 interface bug 가운데 계약의 빈칸이나 위반으로 설명되는 것의 비율, 계약 변경에서 FW 쪽 테스트 통과까지의 시간. 목표 수치는 기준선을 잰 뒤에 정한다.

## 7. 기술 요소

| 요소 | 쓰임 | 성숙도 |
|---|---|---|
| SystemRDL 2.0 + PeakRDL 계열(regblock, cheader, uvm, html, ipxact) | Register RTL, C header, UVM register model, 문서 | 오픈소스. `intr`, `woclr`, `swacc` 등 지원 확인 |
| Agnisys IDesignSpec·ISequenceSpec, Arteris Magillem | Register와 접근 sequence에서 UVM·C 생성 | 상용. 기능은 벤더 설명 |
| IP-XACT (IEEE 1685-2022) | IP 포장과 툴 간 교환 | 표준. Register와 연결 중심이고 동작 규약은 담지 않음 |
| SVA와 formal | 계약의 판정 | 상용 |
| **동작 계약 형식** | 규약 본문 | **표준 없음. 직접 구축** |
| 계약 → SVA·테스트 생성기 | 패턴별 템플릿 | 직접 구축. 자유 형식 규약의 LLM 생성은 연구 단계 |
| **Jira Data Center + R4J + Xray** | 추적과 소통의 기준: 요구사항·설계 기능 이슈와 트리(R4J), 검증 항목과 실행 결과(Xray), 버그, 댓글과 전환 이력 | 상용. 팀이 이미 쓰는 Jira에 앱을 더함. 상세는 `docs/05-jira-traceability.md` |
| Requirements-as-code (sphinx-needs, StrictDoc, Doorstop) | git 쪽 수용 기준 파일의 형식 참고, ReqIF 교환 | 오픈소스. 추적의 기준으로는 쓰지 않는다 |
| Docs-as-code | 계약에서 API 문서 생성 | 오픈소스 조합 |

**계약 형식의 선택.** 후보는 셋이다.

- SystemRDL의 user-defined property만 쓰는 방법: field 하나에 붙는 속성에는 맞지만 여러 register에 걸친 순서를 적기 어렵다.
- PSS: 3.0에 장치의 programmer's view를 담는 초기 기능이 들어갔지만, 표준 스스로 preliminary라 하고 툴이 필요하다.
- YAML 카드 + RDL 경로 참조: 검사기와 생성기를 직접 만들어야 하지만 작고, 사람이 리뷰하기 쉽고, 에이전트가 읽고 쓰기 쉽다.

이 문서는 셋째를 제안하고, RDL에는 계약 ID를 가리키는 user-defined property 하나만 둔다.

**어디까지 현실이고 어디부터 제안인가.**

- 지금 쓸 수 있는 것: register 정의에서 RTL·header·register model·문서를 만드는 일. 오픈소스와 상용 제품이 있고 이 팀도 이미 절반은 하고 있다. 요구사항을 텍스트 파일과 ID로 관리하는 도구도 그대로 쓸 수 있다.
- 만들면 되는 것: 계약 양식, 검사기, 패턴별 템플릿 생성기, 계약 모델. 기술적으로 새로운 것은 없고 팀의 패턴에 맞춘 작은 사내 도구다. 공개된 완성 사례는 찾지 못했다.
- 아직 믿고 맡길 수 없는 것: 자유 형식의 규약 문장에서 LLM이 SVA를 써 내는 일. 문법상 맞지만 아무것도 확인하지 않는 property가 나온다는 보고가 있어, 초안으로만 쓰고 사람의 검토와 심어 둔 위반으로 거른다.
- 이 문서가 주장하지 않는 것: 로직 RTL과 FW 정책 코드가 스펙에서 자동으로 나온다는 것.

**공개된 선례.** OpenTitan은 IP마다 Hjson 하나에서 register RTL, C header, 문서를 만들고, Hjson testplan의 항목에 시뮬레이션 결과를 붙여 보여 준다. 다만 여기서도 접근 순서 같은 동작 규약은 사람이 쓴 문서와 코드에 있다.

## 8. 리스크와 지키는 선

| 리스크 | 지키는 선 |
|---|---|
| 계약이 틀리면 파생물이 전부 같이 틀린다 | 계약은 HW와 FW 담당이 함께 승인한다. Reference model과 수용 기준은 계약에서 파생하지 않고 사람이 따로 소유한다 |
| 통과하지만 아무것도 보지 않는 assertion | Assertion마다 cover를 같이 생성하고, 규약을 어긴 RTL·driver를 심어 실제로 잡는지 잰다 |
| API 문서와 계약이 둘 다 원본이 된다 | 블록 단위로 넘어간다. 넘어간 블록의 문서는 생성물이고 손으로 고치지 않는다 |
| Jira 이슈와 git 파일이 둘 다 원본이 된다 | 이슈에는 계약이나 수용 기준의 내용을 옮겨 적지 않고 ID, 경로, commit만 적는다. 상태·링크·논의는 Jira, 기준과 계약은 git |
| 양식이 커져 아무도 쓰지 않는다 | 패턴 4종으로 시작하고, bug 기록의 `contract` 칸에 근거가 쌓일 때만 칸을 늘린다 |
| "스펙에서 다 나온다"는 과장 | 파생 범위는 interface 층이다. 로직 RTL과 FW 정책은 계약이 판정할 뿐 만들어 내지 않는다 |
| 에이전트가 계약을 고쳐 테스트를 통과시킨다 | 계약과 수용 기준의 변경 권한은 사람에게만 있다. Jira에서도 에이전트는 댓글과 "검토 대기"까지의 전환만 하고, 계약 확정과 승인 전환은 사람 역할에만 있다 |

## 9. 근거

확인일은 모두 2026-11-11. "원문"은 페이지를 직접 읽은 것, "검색 요약"은 검색 결과의 요약만 본 것이다.

| 내용 | 출처 | 확인 수준 |
|---|---|---|
| PeakRDL-regblock의 `intr`(level·edge, sticky), `woclr`, `swacc`, `hwset` 지원 | https://peakrdl-regblock.readthedocs.io/en/latest/props/field.html | 원문 |
| PeakRDL C header 생성기와 bit-field 옵션, HTML·IP-XACT·UVM 출력 | https://peakrdl-cheader.readthedocs.io/ , https://peakrdl.readthedocs.io/ | 검색 요약 |
| SystemRDL의 `stickybit`, `woclr` 정의 | https://systemrdl-compiler.readthedocs.io/en/latest/property_reference.html | 검색 요약 |
| Agnisys ISequenceSpec: 초기화·설정 sequence에서 UVM과 C 생성 | https://www.agnisys.com/blog/system-level-register-and-sequence-verification-with-uvm-and-embedded-cc/ | 검색 요약. 벤더 주장 |
| IEEE 1685-2022가 현행 IP-XACT 판 | https://standards.ieee.org/ieee/1685/10583 | 검색 요약 |
| PSS 3.0의 "programmer's view" 초기 기능 | https://accellera.org/news/press-releases/402-accellera-unveils-portable-test-and-stimulus-standard-3-0-ushering-in-a-new-era-of-verification-efficiency | 검색 요약 |
| OpenTitan reggen: Hjson에서 RTL·C header·문서, `rw1c` 접근 | https://opentitan.org/book/util/reggen/index.html | 검색 요약 |
| OpenTitan testplanner: Hjson testpoint에 시뮬레이션 결과 대응 | https://opensecura.googlesource.com/3p/lowrisc/opentitan/+/refs/heads/master/util/dvsim | 검색 요약 (mirror) |
| sphinx-needs, StrictDoc, Doorstop의 관계와 ReqIF 지원 | https://strictdoc.readthedocs.io/en/stable/strictdoc_01_user_guide.html | 검색 요약 |
| LLM이 만든 SVA의 vacuous 문제와 스펙 대조 연구 | https://arxiv.org/abs/2506.17865 , https://arxiv.org/abs/2605.25181 | 검색 요약 |
| SystemRDL·IP-XACT는 register 중심에 머문다는 업계 평가, vacuous assertion 경고 | `research/01-frontend-design.md` E18, `research/02-verification.md` | 기존 리서치 |

**미확인·제안.**

- 동작 규약 계약에서 SVA, driver 테스트, 문서를 함께 생성해 운영한 공개 사례는 찾지 못했다. 4장의 흐름은 제안이다.
- "formal이 몇 cycle짜리 반례를 낸다"는 4.2절의 property 구조에서 나오는 추론이고 측정값이 아니다.
- 팀 확인이 필요한 것: C++ header가 지금 RDL에서 생성되는지 손으로 쓰는지, API 문서의 형식, formal 툴 사용 여부, 읽으면 pop되는 register가 팀 규칙에 맞는지(맞지 않으면 FW가 ack를 쓰는 방식으로 바꾼다), 현재 bug tracker의 필드.
