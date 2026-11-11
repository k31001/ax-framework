# Jira 추적성 모델: 6편 공통 기준

> 상태: 초안 (2026-11-11). 본편과 상세 5편이 같은 Jira 모델을 쓰기 위한 기준 문서다.
> 전제: 팀은 **Jira Data Center**를 쓰고, 앱으로 **R4J**(지금 이름은 easeRequirements)와 **Xray**를 쓸 예정이다. 이 문서는 모두 Data Center 기준이다.
> 이슈 키, 번호, 계정 이름, 수치는 모두 예시다. 팀의 실제 Jira는 조회하지 않았다.

## 1. 한 줄 요약과 원칙

**Jira는 추적과 소통의 기준 시스템이고, 실행 가능한 산출물의 원본은 git이다.** Jira 안에서는 R4J가 요구사항과 설계 기능의 구조를, Xray가 검증 항목과 실행 결과를 맡는다.

| | Jira에 산다 | git에 산다 |
|---|---|---|
| 내용 | 이슈 키, 상태, 링크, 담당, 논의(댓글), 승인 기록(전환 이력), 요구 문장과 출처, Test 단위의 실행 결과 | 기계가 읽는 수용 기준, 계약 YAML, SystemRDL, assertion, 작업 지시서, 증거 묶음, gating 정책 |
| 답하는 질문 | 누가, 무엇을, 왜, 지금 어디까지 | 정확히 무엇이 통과인가, 실제로 통과했는가 |
| 바꾸는 방법 | 워크플로 전환과 댓글 | MR과 리뷰 |

둘을 잇는 규칙은 세 가지다.

1. **git → Jira.** Commit 메시지, branch 이름, MR 제목에 이슈 키를 쓴다. 연동이 켜져 있으면 이슈의 개발 패널에 나타난다. 실행 결과는 파이프라인이 Xray로 올린다. YAML 산출물에는 `jira:` 줄을 둔다(예: `jira: FEAT-341`).
2. **Jira → git.** 이슈에는 내용을 복사하지 않고 경로와 commit을 적는다. 수용 기준이나 통과 기준을 이슈 설명에 옮겨 적으면 원본이 둘이 된다.
3. **ID 읽는 법.** `REQ-207` 처럼 접두어와 숫자만 있으면 Jira 키다. `REQ-QOS-07`, `HSI-RCV-012`, `VER-REC-012` 처럼 가운데에 영역 약어가 있으면 git 산출물의 ID다. Jira 키는 `프로젝트 키-일련번호` 형식만 가능해서 `REQ-QOS-07` 은 키가 될 수 없다. 그래서 기존 ID는 그대로 두고 이슈의 필드에 싣는다.

이렇게 나누면 1편의 "실행 가능한 스펙이 원본"과 부딪히지 않는다. 1편의 문장 "추적은 표가 아니라 링크다"도 그대로다. 링크가 보이는 곳이 Jira가 될 뿐이다.

## 2. 이슈 유형 4가지

화면에서는 유형별 프로젝트 키를 쓴다. 요구사항과 설계 기능은 사용자 정의 이슈 유형이고 R4J의 트리에 놓인다. 검증 항목은 Xray의 Test 이슈다. 요구사항과 설계 기능은 Xray 설정에서 coverage 대상(Requirement) 유형으로 지정한다.

| 유형 | 키 | 필수 필드 | 워크플로 | 본편 사례의 예 |
|---|---|---|---|---|
| 요구사항 | `REQ-n` | 요구사항 ID, 출처 조항, 수용 기준 경로(git), 영향 블록(Component) | 제안 → 분석 중 → 승인 → 충족 확인. 반려 | `REQ-207` 수명 말기 read 지연 보장. ID `REQ-QOS-07` |
| 설계 기능 | `FEAT-n` | 블록(Component), 계약 ID와 경로, HW 담당, FW 담당 | 정의 중 → 구현 중 → 검토 대기 → 승인. 재확인 필요 | `FEAT-341` rcv_ctrl 복구 완료 전달. 계약 `HSI-RCV-012` |
| 검증 항목 (Xray Test) | `VER-n` | Test 유형, 판정 도구의 식별자(Generic Test Definition), 판정 장소, 통과 기준의 출처(계약 또는 수용 기준) | 정의 중 → 검토 대기 → 승인. 재확인 필요 | `VER-512` a_no_drop, `VER-513` two_done_b2b, `VER-514` rcv_cpl_burst_test, `VER-530` 혼합 부하 P99.99 |
| 버그 | `BUG-n` | signature, 발견 단계, 재현(테스트와 seed), 근거(파형·로그), 유출 단계(종결 때) | 초안 → 등록 → 수정 중 → 검토 대기 → 종결 | `BUG-2291` 완료 2건이 한 비트에 겹침. `BUG-2304` full 직후 push 1건 유실 |

**검증 항목의 단위는 "통과 기준 한 줄"이다.** Seed나 run 하나가 아니다. 종류별 대응은 이렇다.

| 우리의 검증 | Xray Test 유형 | 식별자 | Test Environment |
|---|---|---|---|
| 시뮬레이션 테스트 | Generic | 테스트 이름 (`rcv_cpl_burst_test`) | sim |
| Assertion, formal property | Generic | property 이름 (`sva:a_no_drop`) | sim, formal |
| FW driver 테스트 | Generic | `RcvDriver.two_done_b2b` | vp, board |
| Emulation·FPGA 시나리오 | Generic | 시나리오 이름 | emu, fpga |
| 제품 테스트, 퀄 시험 | Manual (조건과 판정을 단계로) | 시험 항목 번호 | product |

Xray의 나머지 유형은 그릇으로 쓴다.

| Xray 유형 | 여기서의 쓰임 | 예 |
|---|---|---|
| Test Plan | **작업 지시의 Jira 쪽 단위.** 지시서 한 장이 Test Plan 하나다. 에이전트 계정에 할당한다 | `VER-510` rcv_ctrl 완료 큐 재검증 (`tasks/VER-REC-012.yaml`) |
| Test Execution | 실행 한 회차의 결과. 파이프라인이 만든다. Revision과 환경이 붙는다 | `VER-604` MR !2291 선택 실행. `VER-620` 야간 regression |
| Test Set | 계약 하나의 `verify` 목록처럼 다시 쓰는 묶음 | `HSI-RCV-012` 의 Test 셋 |
| Pre-Condition | 수명 말기 NAND 모델, 고온 방치 시료 같은 시험 조건 | 수명 말기 조건 |

Test Run은 이슈가 아니다. Test Execution 안에서 Test 하나의 결과(PASS, FAIL, TODO 등)를 담는 Xray 내부 기록이다.

**작업 지시는 별도 유형으로 만들지 않는다.** 검증 지시는 Test Plan, 설계 지시는 설계 기능 이슈가 단위다. Test Plan의 워크플로는 정의 중 → 지시됨 → 진행 중 → 검토 대기 → 승인이다. 지시서 원본은 git에 있고 이슈에는 `intent` 한 줄과 경로·commit만 적는다. `pass` 와 `forbid` 는 저장소 권한으로 지켜야 하므로 Jira로 옮기지 않는다.

| 유형 | 에이전트가 할 수 있는 전환 | 사람만 할 수 있는 전환 |
|---|---|---|
| 요구사항 | 제안 생성, 제안 → 분석 중 | 승인, 반려, 충족 확인 |
| 설계 기능 | 구현 중 → 검토 대기 | 정의 중 → 구현 중 (계약 확정), 승인 |
| Test, Test Plan | Test 초안 생성, 지시됨 → 진행 중 → 검토 대기 | 정의 중 → 지시됨, 승인, 반려 |
| 버그 | 초안 생성, 수정 중 → 검토 대기 | 초안 → 등록, 수정 승인, 종결 |

"검토 대기"는 공통이고 에이전트가 갈 수 있는 마지막 상태다. 화면에서 사람의 전환은 호박색, 에이전트의 전환은 청록으로 그린다.

## 3. 링크 유형과 추적 사슬

| 관계 | 무엇으로 잇나 | 방향 | 누가 보여 주나 |
|---|---|---|---|
| 요구사항의 상하위, 영역 | R4J 트리의 폴더와 위치 (링크가 아니다) | 폴더 `QoS/` 아래 `REQ-207` | R4J Reading View |
| 요구사항 → 설계 기능 | 사용자 정의 링크 `Implements` | FEAT `implements` REQ, REQ `is implemented by` FEAT | R4J Traceability Matrix, Coverage View |
| 설계 기능·요구사항 → 검증 항목 | Xray가 설치하는 링크 `Tests` | Test `tests` FEAT 또는 REQ, 반대는 `tested by` | Xray coverage, R4J Coverage View |
| 검증 항목 → 버그 | 실패한 Test Run에 붙는 defect | Test Execution의 FAIL 행에 BUG | Xray, JQL |
| 비슷한 과거 버그 | 기본 링크 `relates to` | | Jira |

블록 수준 기준의 Test는 설계 기능에, 시스템 수준 수용 기준(P99.99)의 Test는 요구사항에 직접 건다. MR과 commit은 링크가 아니라 개발 패널에 나타난다.

본편 사례의 사슬이다. 화면에 그대로 옮긴다.

```text
REQ-207  요구사항  REQ-QOS-07 · P99.99 read ≤ 2 ms
 ├─ is implemented by ─ FEAT-341  rcv_ctrl 복구 완료 전달
 │    │                  계약 HSI-RCV-012 · MR !2291
 │    ├─ tested by ─ VER-512  a_no_drop (formal)
 │    ├─ tested by ─ VER-513  two_done_b2b (FW)
 │    └─ tested by ─ VER-514  rcv_cpl_burst_test (sim)
 │         └─ FAIL @ VER-604 ─ defect ─ BUG-2304
 └─ tested by ─ VER-530  혼합 부하 P99.99 (emulation)
      └─ FAIL @ VER-588 ─ defect ─ BUG-2291
```

Emulation의 `VER-530` 이 `BUG-2291` 로 실패했고, 그 수정이 계약 v2와 MR !2291이며, 그 MR의 선택 실행 `VER-604` 에서 `VER-514` 가 `BUG-2304` 를 잡았다.

**Coverage는 둘로 나눠 본다.** R4J와 Xray 모두 요구사항 coverage를 보여 주기 때문이다.

- **"이어져 있는가"는 R4J.** 요구사항에 설계 기능이 있는가, 설계 기능에 Test가 있는가. 링크의 유무를 계층 전체에서 본다. Baseline과 변경 시 재검토 표시(suspect)도 R4J다.
- **"통과했는가"는 Xray.** Xray의 coverage 상태(OK, NOK, NOTRUN, UNKNOWN, UNCOVERED)는 실행 결과에서 계산되고, 버전·Test Plan·환경으로 범위를 좁힐 수 있다. Gate와 sign-off의 근거는 이쪽이다.

이유는 하나다. 링크가 있다는 것과 통과했다는 것은 다른 사실이고, 실행 결과를 아는 쪽은 Xray다. 두 화면의 숫자가 다르면 Xray를 따른다.

## 4. 사람과 AI가 Jira를 쓰는 방식

**(a) 현황 파악.** 사람은 보드, R4J의 트리와 Coverage View, Xray의 Test Plan 화면을 본다. 에이전트는 같은 내용을 JQL로 읽는다.

```text
# 1. Test가 하나도 없는 설계 기능
issue in requirements('UNCOVERED', 'FEAT')

# 2. REQ-207과 그 설계 기능의 시험에서 나온 열린 버그
issue in defectsCreatedForRequirement("REQ-207-trace")
  AND statusCategory != Done

# 3. 나에게 지시된 일 (에이전트 계정으로 실행)
assignee = currentUser() AND status in (지시됨, "진행 중")
  ORDER BY priority DESC
```

1번과 2번은 Xray가 Data Center에 더하는 JQL 함수다. 2번의 `REQ-207-trace` 는 저장한 필터다(`key = REQ-207 OR issue in linkedIssues("REQ-207", "is implemented by")`). 3번은 기본 JQL이다. 특정 회차의 실패는 `issue in testExecutionTests('VER-604', 'FAIL')` 로 읽는다.

**(b) 업무 지시.**

1. 사람이 Test Plan이나 설계 기능 이슈를 에이전트 계정에 할당하고 "지시됨"으로 옮긴다. 작은 지시는 댓글에서 계정을 언급한다.
2. 에이전트가 "진행 중"으로 옮기고 일한다. 스펙이 모호하면 멈추고 댓글로 질문한다.
3. 실행 결과는 에이전트가 아니라 파이프라인 계정 `ci-import` 가 Test Execution으로 올린다.
4. 에이전트는 댓글 한 건에 결과 요약, Test Execution 키, 증거 경로와 commit, 확인하지 못한 것을 적고 "검토 대기"로 옮긴다.
5. 사람이 증거를 보고 "승인" 또는 "반려"로 전환한다. 전환 이력이 승인 기록이다.

**Regression 결과가 올라오는 흐름.** 파이프라인이 run 단위 결과를 Test 단위로 집계해 JUnit XML이나 Xray JSON으로 만들고, Xray의 REST(`/rest/raven/1.0/import/execution/junit` 등)로 올린다. 이때 Test Plan 키, revision, Test Environment를 함께 준다. Test Execution이 만들어지고 Test Plan의 진행과 coverage 상태가 갱신된다. Seed별 run 1,840건은 regression DB에 남고 Jira에는 올리지 않는다. FAIL이 나면 triage 에이전트가 버그 초안을 만들어 그 Test Run의 defect로 붙이고, 사람이 "등록"한다.

**(c) 신규 요구사항.** 누구나 요구사항 이슈를 "제안" 상태로 만든다. 자동화 규칙이 에이전트를 부르고, 에이전트가 영향 분석을 댓글로 단다. 요구사항 담당이 승인하면 R4J 트리의 자리가 정해지고, 요구사항 ID가 붙고, 수용 기준 파일이 MR로 만들어진다. Gate 시점에는 R4J baseline으로 요구사항 집합을 고정한다. 필드에서 온 후보도 같은 길로 들어온다.

**(d) 에이전트의 권한.**

| 할 수 있다 | 할 수 없다 |
|---|---|
| 조회, 댓글, 링크 추가 | 승인, 종결, 충족 확인, sign-off 전환 |
| "검토 대기"까지의 전환 | 요구사항의 승인·반려, R4J baseline 생성 |
| 버그와 Test를 "초안"으로 생성 | 버그 초안의 "등록", waiver 등록 |
| 요구사항을 "제안"으로 생성 | 실행 결과 올리기, Test Run 상태 변경 |
| | 수용 기준, 통과 기준, gating 정책 변경 (git에서 사람 소유) |

권한은 두 곳에서 건다. Jira에서는 승인 계열 전환에 프로젝트 역할 조건을 두고, 에이전트 역할에는 삭제 권한을 주지 않는다. git에서는 3편의 `forbid` 경로를 저장소 권한으로 막는다. 결과를 올리는 계정을 에이전트와 분리하는 이유는 "판정은 tool이 한다"는 원칙 때문이다.

**(e) 에이전트가 Jira에 닿는 길.** Atlassian이 운영하는 MCP 서버는 Cloud용이다. Data Center에서는 Jira REST API(v2), Xray REST API, R4J REST API를 감싼 **사내 MCP 서버**를 4편의 도구 연결 계층에 둔다. 인증은 에이전트 계정의 personal access token이다. 에이전트에게 주는 동작은 넷이다: `jira.search` (JQL), `jira.comment`, `jira.link`, `jira.draft` (초안 생성과 허용된 전환). 호출은 4편의 감사 기록에 남는다.

에이전트가 쓴 것은 세 가지로 드러낸다.

- **전용 계정.** `req-agent`, `dv-agent`, `triage-agent` (4편과 5편의 이름 그대로). 사람 계정을 빌려 쓰지 않는다.
- **라벨.** 에이전트가 만든 이슈에는 `ai-authored` 가 붙고, 사람이 등록해도 떼지 않는다.
- **댓글 머리말.** 첫 줄은 `[에이전트 · 계정 · 종류]` 다. 종류는 질문, 증거, 영향 분석, 초안 넷이다. 끝에는 "확인 못 한 것"과 "요청"을 적는다.

## 5. 화면에 띄울 조각

**이슈 한 건 (Test Plan).**

```text
VER-510  Test Plan                  상태: 검토 대기
rcv_ctrl 완료 큐 재검증
담당: dv-agent   검토: 검증 리드   라벨: ai-authored
지시서: tasks/VER-REC-012.yaml @ a71b04d
Test 14건   PASS 13 · TODO 1      실행: VER-620
링크   relates to FEAT-341  rcv_ctrl 복구 완료 전달
댓글
  검증 리드  11-10 18:02  완료 큐 변경분을 재검증해
                          주세요. 기준은 지시서대로.
  dv-agent   11-11 07:40  [에이전트 · 증거] fail 0,
              mutation 공백 7, 질문 1 → 검토 대기
```

**에이전트의 댓글: 영향 분석.**

```text
[에이전트 · req-agent · 영향 분석]  REQ-231 (제안)
요지  고온 방치 뒤 전원 인가 직후에도 지연 보장
겹침  REQ-207 (REQ-QOS-07) AC-1의 조건 확장
영향  FEAT-341 변경 없음
      FW read retry table 변경
      VER-530 재확인 필요, 제품 테스트 1건 신규
근거  NAND 특성 데이터 lot 3종 (예시)
확인 못 한 것  방치 시간의 고객 기준
요청  요구사항 담당: 승인 또는 반려
```

**JQL과 결과.**

```text
issue in defectsCreatedForRequirement("REQ-207-trace")
  AND statusCategory != Done

키        요약                     상태     담당
BUG-2291  완료 2건이 한 비트에 겹침  수정 중  설계자
BUG-2304  full 직후 push 유실       초안     triage-agent
```

**R4J Coverage View.** 링크가 비어 있는 자리가 보인다.

```text
R4J · Coverage View · 요구사항 → 설계 기능 → Test
QoS/
  REQ-207 read 지연 보장    FEAT-341 완료 전달   3
                            FEAT-338 우선 큐     2
                            FEAT-352 soft 경로   없음
  REQ-231 방치 후 지연      없음 (제안)
신뢰성/
  REQ-214 무결성 경로       FEAT-347 보호 검사   4
연결 없음 2건
```

**Xray Test Execution.** 결과를 올린 것은 파이프라인이다.

```text
VER-604  Test Execution   MR !2291 선택 실행
revision 9b1d7a4 · 환경 sim · 올린 계정 ci-import
Test Plan VER-510 · run 61건을 Test 14건으로 집계
PASS 12   FAIL 1   TODO 1
키       Test                  결과  defect
VER-512  a_no_drop             PASS
VER-513  two_done_b2b          PASS
VER-514  rcv_cpl_burst_test    FAIL  BUG-2304 (초안)
VER-515  큐 full 중 abort       TODO  질문 대기
```

**자동화 규칙.**

```text
규칙  새 요구사항 제안에 영향 분석을 부른다
WHEN  이슈 생성됨
IF    이슈 유형 = 요구사항 AND 상태 = 제안
THEN  웹 요청 보내기 → 사내 에이전트 실행기
        { "issue": "{{issue.key}}", "task": "impact" }
THEN  댓글 "영향 분석을 요청했습니다. (req-agent)"
실행 계정  Automation (사람도 에이전트도 아님)
```

## 6. 기존 6편과의 대응

| 영상 | 지금의 요소 → Jira의 무엇 | 새로 보여 줄 것 |
|---|---|---|
| 본편 | 요구사항 카드 → 요구사항 이슈 `REQ-207` (카드 머리의 `REQ-QOS-07` 은 유지). 단계마다 카드에 붙던 "기록" → 링크된 이슈와 Test Execution. 퀄 패키지 → Xray의 결과와 R4J baseline | 카드 머리에 Jira 키와 상태 칩("승인"). 기록이 붙을 때마다 링크 이름이 한 번 보인다. 시뮬레이션 단계의 티켓은 `BUG-2268` 초안이고 설계자가 "등록"으로 옮긴다. 사람이 댓글로 지시하고 에이전트가 댓글로 답하는 장면 한 번. 요구사항 단계에 R4J 트리, 검증 단계에 Test Execution 한 컷. 필드 환류는 `REQ-231` 제안으로 돌아온다 |
| 1편 산출물 | 추적 그래프 한 줄 → 3장의 사슬. 계약의 `verify:` 목록 → Xray Test(`VER-512`, `VER-513`). Bug 기록 카드 → 버그 이슈의 필드 | 계약 YAML에 `jira: FEAT-341` 한 줄. s6의 링크 글자 `req:`, `verify:` 옆에 Jira 링크 이름. "원본은 git, 링크와 상태는 Jira"를 말하는 문장 하나. "최근 실행 결과"는 Test Execution의 PASS. Bug 카드는 `VER-530` 의 FAIL에 붙은 defect. 엑셀 추적표가 사라지는 자리에 R4J Coverage View |
| 2편 프로세스 | 영향 분석의 MR 댓글 → 이슈 키로 Jira에도 나타남. 선택 실행 결과 → Test Execution `VER-604`. 가설 티켓 `RCV-1432` → `BUG-2304` 초안. `allow_known_issues` → 등록된 버그가 defect로 붙은 실패만 | MR 제목에 `FEAT-341` 과 `BUG-2291`. 11:20에 5장의 Test Execution 조각(`ci-import` 가 올림). 11:45 티켓 머리에 "초안 · triage-agent · ai-authored". 16:10에 설계자가 "등록"과 수정 승인을 전환으로 남긴다. Gate 판정 기록에 이슈 키 |
| 3편 업무 방식 | 작업 지시서 → Test Plan `VER-510` (원본은 git). 증거 묶음 요약 → Test Execution `VER-620` 과 에이전트의 댓글. 반려·승인 → 워크플로 전환 | s4에서 지시서 패널 위에 `VER-510` 머리와 "담당: dv-agent, 지시됨". s5의 regression 줄은 `VER-620` 에서 온 값이고 요약은 5장의 댓글 한 건으로 접힌다. 에이전트의 "검증 완료" 줄 옆에 상태 "검토 대기". 승인과 반려 버튼은 사람 화면에만 있다. 4.1의 "전"에는 링크 없는 티켓 |
| 4편 시스템 | 도구 `tracker` → Jira(사내 MCP 서버가 REST를 감쌈). `tracker.draft` → `jira.draft`. 유사 bug 검색 결과 → `BUG-1187` 과 `relates to` | 호출 기록 맨 앞에 `00 jira.search` (4장의 3번 JQL로 지시를 읽음). 08줄은 `jira.draft BUG-2268 (REQ-207) -> 승인 대기`. 권한 정책에 `jira: draft` 와 deny의 `jira.approve`. 구조도의 "tracker 연결"은 "Jira 연결". "티켓은 초안까지" 문장은 그대로 |
| 5편 문화 | "티켓 이력" → Jira의 변경 이력. 재분류 → 사람이 고친 링크와 필드 | 기준선 지표(배정까지의 시간, 재분류율)를 Jira 변경 이력에서 뽑고 `ai-authored` 로 거른다. 주간 공유 안건에 연결 공백(R4J)과 coverage 상태(Xray) 한 줄. `F-007` 은 git에 그대로 두고, 잘못 묶인 버그 이슈에 댓글로 연결한다. "지키는 선"에 개인별 Jira 통계를 보지 않는다는 줄 |

**새로 생기는 식별자.** 여섯 편이 같은 값을 쓴다.

| 식별자 | 무엇 | 처음 나오는 곳 |
|---|---|---|
| `REQ-207` | `REQ-QOS-07` 의 Jira 이슈 | 본편 S4의 요구사항 카드 |
| `FEAT-341` | rcv_ctrl 복구 완료 전달. 계약 `HSI-RCV-012` | 1편 s3의 계약 카드 |
| `VER-510` | Test Plan. rcv_ctrl 완료 큐 재검증, 지시서 `VER-REC-012` | 3편 s4 |
| `VER-512`, `VER-513`, `VER-514` | Test. a_no_drop, two_done_b2b, rcv_cpl_burst_test | 1편 s6, 2편 s5 |
| `VER-604`, `VER-620`, `VER-588` | Test Execution. MR !2291 선택 실행, 야간 regression, emulation | 2편 s5, 3편 s5, 본편 |
| `VER-530` | Test. 혼합 부하 P99.99, emulation 판정 | 본편 emulation 단계, 1편 s6 |
| `BUG-2268` | 요청과 완료가 같은 cycle에 오면 완료 유실 (sim, 312건의 묶음) | 본편 시뮬레이션 단계, 4편 s5의 초안 |
| `BUG-2304` | full 직후 push 1건 유실 | 2편 s5 |
| `BUG-1187` | 이전 과제의 유사 bug | 4편 s5의 검색 결과 |
| `REQ-231` | 고온 방치 뒤 전원 인가 직후 지연 (제안) | 본편 퀄 단계의 환류, 5장의 댓글 조각 |

**바꿀 이름.**

| 지금 | 바꿈 | 위치 | 이유 |
|---|---|---|---|
| `RCV-1432` | `BUG-2304` | 2편 | 버그 키 형식 통일 (필수) |
| `BUG-2291` (이전 과제의 유사 bug) | `BUG-1187` | 4편 | 1편의 `BUG-2291` 은 현 과제의 emulation bug다 (필수) |
| `tracker.draft`, `tracker: draft` | `jira.draft`, `jira: draft` | 4편 | 도구가 Jira임을 드러냄 (필수) |
| `C-RCV-02`, `C-RCV-03` | `HSI-RCV-012`, `HSI-RCV-013` | 2편 | 1편과 계약 ID 체계 통일 (권장) |
| `rec_ctrl` | `rcv_ctrl` | 3편 | Component 이름 하나 (권장) |

그대로 두는 것: `REQ-QOS-07`, `AC-1`, `HSI-RCV-012`, `VER-REC-012`, 1편의 `BUG-2291`, `MR !2291`, `F-007`, `tasks/`, `evidence/`, assertion과 테스트 이름. `BUG-2291` 과 `MR !2291` 은 번호가 같지만 체계가 다르다. 우연이고 의미를 두지 않는다.

## 7. 도입 순서와 지키는 선

1. **유형과 링크.** 요구사항·설계 기능 유형, `Implements` 링크, 워크플로, 에이전트 계정과 역할을 만들고 Xray의 coverage 대상 유형을 지정한다. 블록 하나(`rcv_ctrl`)의 요구사항과 기능을 R4J 트리에 옮긴다.
2. **결과를 올린다.** 그 블록의 통과 기준을 Xray Test로 만들고, 파이프라인이 regression 결과를 Test Execution으로 올린다. 이슈 키 규칙과 개발 도구 연동을 켠다. Commit 메시지로 이슈 상태를 바꾸는 기능은 끈다.
3. **에이전트는 읽기부터.** 사내 MCP 서버로 JQL 조회와 댓글만 허용한다. 영향 분석 댓글과 버그 초안으로 시작한다.
4. **지시와 전환을 연다.** Test Plan 할당으로 지시하고 "검토 대기"까지 전환을 허용한다. R4J의 연결 공백과 Xray의 coverage 상태를 주간 지표로 본다.

**지키는 선.**

- **Jira는 문서 창고도 regression DB도 아니다.** 기준과 증거는 경로와 commit만 적는다. 결과는 Test 단위로만 올린다.
- **링크는 검사된다.** R4J의 Coverage View에 빈칸이 있거나 Xray 상태가 UNCOVERED인 항목은 gate 전에 0이어야 한다. 링크는 산출물의 `jira:` 줄과 주기적으로 대조한다.
- **댓글은 전환당 한 건.** 에이전트는 진행 상황을 댓글로 흘리지 않는다. 질문, 증거, 영향 분석, 초안만 쓴다.
- **승인은 사람 명의, 판정은 tool.** 승인 계열 전환, baseline, waiver는 사람 역할에만 있다. PASS와 FAIL은 파이프라인이 올린 것만 인정한다. 에이전트의 "검토 대기"는 완료 선언이 아니다.

## 8. 근거와 미확인

2026-11-11에 확인했다. [원문]은 공식 문서를 직접 읽은 것, [S]는 검색 요약에 기댄 것이다.

| 내용 | 출처 | 확인 |
|---|---|---|
| 이슈 키는 `프로젝트 키-번호`. 프로젝트 키에 하이픈은 쓸 수 없다 | Atlassian DC 관리 문서 "Changing the project key format" | [S] |
| `linkedIssues(키, 링크 유형)` 은 기본 JQL | Atlassian KB | [원문] Cloud용 문서. DC 동작은 팀 환경에서 확인 |
| 전환 조건으로 프로젝트 역할 검사, 자동화 규칙의 실행 계정, DC 9.0부터 자동화 기본 포함 | 커뮤니티 답변, DC release notes | [S] |
| 이슈 키를 쓴 commit·MR이 개발 패널에 연결 (DC는 DVCS connector) | GitLab 문서 | [S] |
| Atlassian MCP 서버는 Atlassian이 운영하는 원격 서버(`mcp.atlassian.com`), OAuth 2.1 | Atlassian Support | [원문] DC 미지원은 [S] |
| R4J(easeRequirements) DC: 폴더 구조, Reading View, 변경 이력, baseline, 재사용, Traceability Matrix, Coverage 분석, suspect 표시, REST API, Word·Excel export | 제조사 문서 개요 | [원문] |
| R4J Traceability Matrix는 2차원 행렬이고 기본 20×20. Coverage View는 열(level)을 더해 만든다 | 제조사 문서 | [S] |
| Xray 이슈 유형: Test, Pre-Condition, Test Set, Test Plan, Test Execution, Sub-Test Execution. Test Run은 이슈가 아님 | Xray DC 문서 "Terms and Concepts" | [원문] |
| Xray coverage 상태 OK·NOK·NOTRUN·UNKNOWN·UNCOVERED, 버전·Test Plan·환경별 분석 | Xray DC 문서 | [원문] |
| 결과 import REST: `/rest/raven/1.0/import/execution` 과 `/junit`, `/testng`, `/nunit`, `/robot` 등. 인자 `projectKey`, `testExecKey`, `testPlanKey`, `testEnvironments`, `revision` | Xray DC 문서 | [원문] |
| JQL 함수 `requirements()`, `requirementTests()`, `testExecutionTests()`, `defectsCreatedForRequirement()` | Xray DC 문서 "Enhanced querying with JQL" | [원문] |
| Test 유형 Manual·Generic·Cucumber, Generic Test Definition, 링크 `Tests` (tests / tested by), 요구사항·결함 유형 지정 | Xray 문서와 커뮤니티 | [S] |

**확인하지 못한 것과 팀 확인이 필요한 것.**

- R4J: 트리에 여러 프로젝트의 이슈를 함께 놓을 수 있는지, Coverage View가 프로젝트를 넘는 링크와 Xray Test를 열로 보여 주는지, suspect 표시를 워크플로 상태("재확인 필요")와 연동할 수 있는지. 안 되면 요구사항과 설계 기능을 한 프로젝트에 둔다(키 접두어만 바뀐다).
- R4J의 Marketplace 설명에는 Jira DC 10.x 지원이 적혀 있다. 팀의 Jira 버전과 맞는지 확인이 필요하다.
- Xray: `Implements` 로 이어진 설계 기능의 결과가 요구사항의 coverage 상태로 올라오는지(하위 요구사항 설정). 그래서 2번 JQL은 저장한 필터를 썼다. 필터를 이름으로 줄 수 있는지도 확인이 필요하다.
- Xray: 에이전트가 REST로 Test Run에 defect를 붙일 수 있는지, 결과 import를 특정 계정으로만 제한할 수 있는지. JUnit import는 Generic Test Definition을 지정할 수 없다고 문서에 있어, 기존 Test와의 대응 규칙은 실제로 올려 보고 정해야 한다.
- 전환 때의 필수 필드 검사와 필드 단위 편집 제한. 이 문서는 git 쪽 권한에 기대도록 설계했다.
- 에이전트 계정과 `ci-import` 계정의 라이선스, 팀이 이미 쓰는 이슈 유형·워크플로와의 충돌.
