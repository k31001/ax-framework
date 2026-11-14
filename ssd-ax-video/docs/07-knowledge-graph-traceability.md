# 추적성 편: 이슈 수준 연결 → 코드 · 문서 수준 지식 그래프

> 상태: 초안 (2026-11-14). `05-jira-traceability.md` 의 Jira 모델 **아래 계층**을 다룬다. 대본은 `src/shifts/trace/script.json`.
> 예제는 구조 설계 편(`06-architecture-exploration.md`)의 과제를 잇는다. 차세대 데이터센터 SSD 컨트롤러, read 오류 복구, host 우선 큐다.
> 이슈 키, 경로, 코드, 질의 결과, 건수는 모두 흐름을 보여 주기 위한 예시다. 팀의 실제 Jira와 저장소는 조회하지 않았다. 공개 자료에서 온 내용은 9장에 출처와 확인 수준을 적었다.
> `REQ-207` 처럼 접두어와 숫자만 있으면 Jira 키, `HSI-RCV-010` 처럼 영역 약어가 있으면 git 산출물의 ID다. 이 문서에서 `#` 뒤는 그 산출물 안의 조항이다(`HSI-RCV-010#order`).

## 1. 한 줄 요약

Jira의 링크는 이슈와 이슈를 잇는다. 그 아래, 곧 **문서의 조항과 코드의 심볼** 사이는 사람의 기억과 grep이 잇고 있다. 이 틈을 지식 그래프로 메운다. 그래프는 Jira와 git에서 **도구가 뽑아 만드는 파생물**이고, 원본이 아니다. 일의 대부분은 그래프 DB를 고르는 것이 아니라 스키마를 정하고 그래프를 채우는 파이프라인을 만드는 데 있다.

## 2. Jira 추적성의 틈

`05` 의 모델로 Jira는 이렇게 답한다.

```text
REQ-207  요구사항  REQ-QOS-07 · P99.99 read ≤ 2 ms
 └─ is implemented by ─ FEAT-338  우선 큐
      │                  계약 HSI-RCV-010
      ├─ tested by ─ VER-541  a_host_first
      ├─ tested by ─ VER-542  a_gc_no_starve
      └─ tested by ─ VER-543  prio_q_ratio_test
```

"`FEAT-338` 이 `REQ-207` 을 구현하고 Test 세 건이 그것을 시험한다"까지가 Jira가 아는 것이다. 이슈 하나는 며칠에서 몇 주의 일이고, 그 안에 파일 수십 개가 있다. 아래 질문에는 Jira가 답하지 못한다.

| 질문 | 지금 답이 있는 곳 |
|---|---|
| 계약의 어느 조항을 어느 RTL module과 assertion이 맡는가 | 설계자의 기억, 코드 주석 |
| 이 register field를 어느 FW 함수가 읽고 쓰는가 | grep, FW 담당에게 묻기 |
| 이 FW 함수는 어느 요구사항 때문에 있는가 | commit 메시지를 거슬러 읽기 |
| 조항마다 검증이 있고 실행된 적이 있는가 | testplan 엑셀과 regression 결과를 눈으로 대조 |

**팀의 장면.** 구조 설계 편의 끝에서 soft decoder를 셋에서 둘로 줄였다. GC 구간의 처리량이 빠듯해져, FW 리드가 host 우선 큐의 비율을 host 4 : gc 1에서 3 : 1로 바꾸자고 한다. RTL 리드가 묻는다. "그 4가 어디어디에 있지?"

- Jira에서는 `FEAT-338` 과 Test 세 건이 나온다. 이슈 네 건이다.
- 저장소에서 `4` 를 grep할 수는 없다. `HOST_BURST` 를 grep하면 생성된 header, 문서, 로그까지 섞여 나온다.
- 실제로 고치거나 다시 봐야 하는 것은 계약의 `order` 조항, 구조 기술의 `prio_q.order`, SystemRDL field의 reset 값, `prio_q` 의 assertion 둘, 기대값이 비율로 박혀 있는 테스트 하나, 그 field를 쓰는 FW 함수 둘이다. FW 함수 하나는 GC 담당의 코드에 있고 복구 블록의 누구도 그 존재를 모른다.

같은 틈은 반대 방향에도 있다. FW 담당이 register 하나를 통째로 쓰는 코드를 고칠 때, 그 register의 다른 field가 어느 계약에 걸려 있는지 알 길이 없다. 5.3의 버그가 여기서 난다.

이 문서가 Jira 모델을 바꾸는 것은 없다. Jira는 그대로 정체, 상태, 링크, 논의, 승인의 창구다. 그래프는 Jira 이슈를 노드로 포함하고 그 아래를 잇는다. `02-process.md` 의 `impact: {graph: trace}` 한 줄이 가리키던 "추적 그래프"의 내용이 이 문서다.

## 3. 그래프의 구성

### 3.1 노드: 심볼 단위로 쪼갠다

| 노드 | 무엇 | 식별자 (예) | 주요 속성 | 원본 |
|---|---|---|---|---|
| `Clause` | 요구사항·계약·결정 기록·예산의 조항 | `REQ-QOS-07#AC-1`, `HSI-RCV-010#order`, `ADR-RCV-003#전제` | 종류, 파일 경로, 문서 안 위치(키 또는 절 번호), 본문 hash | git |
| `Issue` | Jira 이슈 (요구사항, 설계 기능, Xray Test, 버그) | `REQ-207`, `FEAT-338`, `VER-541`, `BUG-2317` | 유형, 상태, 담당, R4J 트리 위치 | Jira |
| `Exec` | Xray Test Execution | `VER-631` | revision, 환경, 올린 계정 | Jira (Xray) |
| `Reg`, `Field` | SystemRDL register와 field | `rcv_ctrl.PRIOQ_CFG.HOST_BURST` | 주소, bit 범위, 접근 속성, reset 값 | git |
| `Module`, `Port` | RTL module 정의와 port | `prio_q`, `prio_q.cfg_host_burst` | 파일, 줄 범위, parameter | git |
| `Assertion` | assert, cover property | `prio_q.a_host_first` | 종류(assert, cover), 파일, 줄 범위 | git |
| `CSymbol` | C++ header의 상수·형·함수 | `rcv_ctrl::set_host_burst` | 종류, 생성물 여부 | git |
| `Func` | FW 함수 | `gc::throttle_update` | 파일, 줄 범위, 소유 팀 | git |
| `Test` | 테스트 코드 | `prio_q_ratio_test` | 환경(sim, formal, vp, emu) | git |
| `Commit`, `MR` | 변경 | `9f3c2e1`, `MR !2334` | 작성자, 시각, 제목의 이슈 키 | git |

**줄이 아니라 심볼이 단위다.** 이유는 셋이다.

1. 줄 번호는 commit마다 움직인다. `prio_q.a_host_first` 라는 이름은 파일이 옮겨져도 남는다. 줄 범위는 속성으로만 둔다.
2. 파일 단위는 너무 굵다. FW 파일 하나에 함수가 수십 개 있고, 그중 둘만 이 field를 건드린다.
3. 사람이 리뷰하고 책임지는 단위가 심볼이다. 승인할 링크는 "이 함수가 이 조항을 구현한다"여야 한다.

더 쪼개지 않는 것도 정한다. RTL의 모든 net, 펼쳐진 instance 전부, coverage bin은 노드로 만들지 않는다. 신호는 assertion이나 계약이 가리키는 것만 `Port` 로 둔다. Seed별 run도 넣지 않는다(`05` 의 "결과는 Test 단위로만"과 같다).

**문서의 위치.** 요구사항과 계약은 이미 YAML이고 키가 조항의 닻이다. `HSI-RCV-010` 의 `order:` 줄이 `HSI-RCV-010#order` 다. 고객 요구서처럼 PDF로 오는 문서는 절 번호와 문서 개정판을 속성으로 싣는다(`source: 고객 요구서 §4.2`, `rev: B`).

### 3.2 엣지: 종류와 출처

| 엣지 | 방향 | 뜻 | 어디서 오나 |
|---|---|---|---|
| `TRACKS` | Issue → Clause, Issue → Assertion·Test | Jira 이슈와 git 산출물이 같은 것 | 이슈의 필드, 산출물의 `jira:` 줄, Xray의 Generic Test Definition |
| `IMPLEMENTS_ISSUE`, `TESTS` | Issue → Issue | Jira의 `Implements`, `Tests` 링크 | Jira REST |
| `DERIVES_FROM` | Clause → Clause | 조항이 위 조항에서 유도됨 | 산출물의 `req:` 줄, 구조 기술의 참조 |
| `IMPLEMENTS` | Field·Module·Func → Clause | 이 심볼이 이 조항을 구현 | 추적 태그 |
| `VERIFIES` | Assertion·Test → Clause | 이 검사가 이 조항을 판정 | 추적 태그, 계약의 `verify:` 목록 |
| `GENERATED_FROM` | CSymbol → Field | header 심볼이 이 field에서 생성됨 | 생성기 |
| `READS`, `WRITES` | Module·Func → Field | register 접근 | RTL elaboration, FW 색인 |
| `CALLS`, `INSTANTIATES` | Func → Func, Module → Module | 호출, 계층 | FW 색인, RTL elaboration |
| `RESULT` | Exec → Issue(Test) | 실행 결과(PASS, FAIL) | Xray |
| `OBSERVED_AT` | Issue(버그) → Field·Assertion·Module | 버그가 관측된 곳 | 버그 이슈의 signature 필드 |
| `HAS_FIELD` | Reg → Field | register의 구성 | SystemRDL 컴파일러 |
| `CHANGES` | Commit → 심볼 | 이 commit이 이 심볼을 고침 | git diff와 심볼의 줄 범위 |
| `PROPOSED` | 심볼 → Clause | 에이전트가 낸 링크 후보. 확정이 아님 | 에이전트 (3.3의 ③) |

**엣지마다 출처를 싣는다.** 그래프의 값은 "이 링크를 얼마나 믿어도 되는가"를 엣지가 스스로 말하는 데 있다.

```text
(:Func {name:'rcv::policy_init'})
  -[:IMPLEMENTS {
      method:      'tag',              // extract | tag
      tool:        'trace-scan 0.3',
      commit:      '9f3c2e1',          // 이 링크가 확인된 commit
      approved_by: 'FW 복구 담당',      // 태그를 넣은 MR의 승인자
      mr:          '!2334' }]->
(:Clause {id:'HSI-RCV-010#fw_role'})
```

`method` 는 둘뿐이다. `extract` 는 도구가 코드의 구조에서 읽은 것이고 틀릴 여지가 거의 없다. `tag` 는 사람이 코드에 적고 리뷰로 승인한 것이다. LLM이 제안한 링크는 이 엣지 종류에 넣지 않는다. 따로 `PROPOSED` 엣지로 둔다(3.3의 ③).

### 3.3 어떻게 채우는가

순서가 중요하다. 틀릴 수 없는 것부터 채우고, 사람의 손은 도구가 알 수 없는 곳에만 쓴다.

**① 결정론적 추출.** 코드와 Jira에 이미 있는 구조를 도구로 읽는다. 여기서 나오는 엣지는 `method: extract` 다.

| 원천 | 무엇으로 | 나오는 것 |
|---|---|---|
| Jira | REST API(v2)로 이슈·링크·변경 이력, R4J REST로 트리 위치, Xray REST와 JQL 함수로 Test와 Test Execution 결과 | `Issue`, `Exec`, `IMPLEMENTS_ISSUE`, `TESTS`, `RESULT` |
| git | log와 diff, MR 제목의 이슈 키 | `Commit`, `MR`, `CHANGES` |
| YAML 산출물 | 요구사항, 계약, 예산, 구조 기술의 키와 `jira:`·`req:`·`verify:` 줄 | `Clause`, `TRACKS`, `DERIVES_FROM` |
| SystemRDL | SystemRDL 컴파일러의 Python API로 register 모델을 순회 | `Reg`, `Field`, 속성 |
| RTL | SystemVerilog 프런트엔드로 elaboration | `Module`, `Port`, `Assertion`, `INSTANTIATES`, register block의 hwif 신호를 읽는 module(`READS`) |
| FW | 빌드가 내는 compile DB와 clang 계열 색인 | `Func`, `CSymbol`, `CALLS`, header 심볼 참조 |
| 생성기 | header 생성기가 심볼마다 남기는 원천 field | `GENERATED_FROM` |

FW 함수가 어느 field를 읽고 쓰는지는 header를 거쳐 정해진다. 생성된 접근 함수(`set_host_burst`)를 부르면 field 단위의 `WRITES` 다. `bus.write(PRIOQ_CFG, v)` 처럼 register를 통째로 쓰면 그 register의 모든 field에 `WRITES {via:'reg'}` 를 건다. 통째 쓰기를 따로 표시해 두는 것이 5.3에서 쓰인다.

**② 추적 태그.** "이 코드가 왜 있는가"는 구조에서 읽을 수 없다. 사람이 코드에 한 줄로 적는다.

```text
@trace <관계> <ID>#<조항>
관계: implements | verifies
```

- SystemVerilog와 C++에서는 심볼 바로 위의 주석이다. 스캐너가 주석을 그다음에 선언된 심볼에 붙인다.
- SystemRDL에서는 사용자 정의 property다. 컴파일러가 모델에 실어 준다.
- YAML 산출물은 이미 `jira:`, `req:`, `verify:` 줄이 태그다. 새로 만들 것이 없다.

태그의 부담을 줄이는 규칙이 둘 있다. 첫째, **모든 함수에 달지 않는다.** 태그가 필수인 곳은 계약이 걸린 경계다: 계약의 `verify:` 에 오른 검사, register field, 계약 대상 module, 그 field를 쓰는 FW 함수. 둘째, 생성물은 생성기가 단다(`generated-from`).

CI의 검사(`trace-lint`)는 넷이다. MR마다 돌고, 어기면 merge가 막힌다.

```text
trace-lint · MR !2334 (예시)
1 깨진 태그      태그가 가리키는 ID·조항이 없다         0
2 verify 불일치  계약 verify 목록 ↔ 태그 달린 검사       0
3 태그 없는 접근 계약 걸린 field를 쓰는 함수에 태그 없음  1
                 fw/gc/gc_throttle.cpp gc::throttle_update
4 Jira 불일치    태그의 계약(FEAT-338) ↔ MR 제목의 이슈 키  0
결과 실패 (3번) → 태그를 달거나 trace/ignore.yaml 에 사유
```

4번은 `05` 의 "링크는 산출물의 `jira:` 줄과 주기적으로 대조한다"를 구현한 것이다.

**③ 남는 틈은 에이전트가 제안하고 사람이 승인한다.** 기존 코드에는 태그가 없다. 에이전트(`trace-agent`)가 조항의 문장, 코드, commit 메시지, 이미 확정된 이웃 링크를 읽고 후보를 낸다. 후보는 `PROPOSED` 라는 다른 종류의 엣지로 저장한다. 종류를 나누는 이유는, 질의에서 조건 하나를 빠뜨려도 제안이 사실과 섞이지 않게 하기 위해서다.

```text
[에이전트 · trace-agent · 초안]  FEAT-338      ai-authored
링크 후보 3건 (rcv 블록, 태그 없는 심볼 대상)
 1 rcv::stats_dump      implements? HSI-RCV-010#fw_role
   근거: PRIOQ_CFG 를 읽어 정책 상태를 로그로 냄
 2 gc::throttle_update  implements? HSI-RCV-010#order
   근거: PRIOQ_CFG 를 통째로 씀 (extract 로 확인)
 3 a_full_gc_bp         verifies?   HSI-RCV-010#full
   근거: 이름과 조건식이 full 조항과 일치
확인 못 한 것  1번은 조항과의 관계가 약함
요청  블록 담당: MR !2341 에서 승인 또는 반려
```

**승인은 그래프에 쓰는 것이 아니다.** 에이전트가 태그를 넣는 MR을 올리고, 블록 담당이 그 MR을 승인하면 태그가 코드에 들어간다. 다음 추출에서 그 링크는 `method: tag` 로 다시 만들어진다. 반려한 후보는 `trace/rejected.yaml` 에 사유와 함께 남겨 다시 제안되지 않게 한다. 이렇게 하면 확정된 사실은 전부 git과 Jira에 있고, 그래프를 지워도 잃는 것이 없다.

**④ commit마다 증분 갱신한다.**

- main에 merge될 때 바뀐 파일만 다시 추출한다. RDL이 바뀌면 그 register block, FW는 바뀐 번역 단위, RTL은 그 블록의 top에서 다시 elaboration한다.
- MR 단계에서는 CI가 MR head의 그래프를 임시로 만들어 main과 비교한다. 사라진 노드를 가리키는 태그가 "깨진 링크"다. 함수 이름이 바뀌면 여기서 걸린다.
- 밤마다 전체를 처음부터 다시 만들어 증분 결과와 비교한다. 차이가 있으면 증분 추출기의 결함이다.
- Jira 쪽은 주기적으로 변경된 이슈만 읽는다. 모든 노드와 엣지에 `commit` 또는 읽은 시각을 실어, 질의 결과가 어느 시점의 그래프인지 항상 적는다.

### 3.4 그래프 DB 선택

**규모부터 추정한다.** 아래는 SoC 과제 하나에 대한 자릿수 가정이다. 팀의 실제 수는 세어 보지 않았다.

| 종류 | 가정 | 노드 수 |
|---|---|---|
| Jira 이슈 (요구사항, 설계 기능, Test, 버그) | 과제 전체 | 10⁴ ~ 10⁵ |
| 조항 | 요구사항·계약·결정 기록 | 10³ ~ 10⁴ |
| Register, field | register 수천, register당 field 몇 개 | 10⁴ ~ 10⁵ |
| RTL module, port, assertion | module 정의 수천, module당 port 수십 | 10⁵ 안팎 |
| FW 함수, header 심볼 | FW 수십만 ~ 100만 줄, 수십 줄에 함수 하나 | 10⁴ ~ 10⁵ |
| 테스트, commit, MR | 과제 기간 누적 | 10⁴ ~ 10⁵ |

합쳐서 노드 10⁵ ~ 10⁶, 엣지는 호출과 변경 이력 때문에 그 열 배인 10⁶ ~ 10⁷ 정도다. 그래프 DB에게는 작은 규모다. 서버 한 대로 충분하고, 분산이나 sharding은 필요 없다. Neo4j 문서가 밝힌 기본 저장 형식의 한계(노드와 관계 각각 340억)와는 몇 자릿수 떨어져 있다.

**Neo4j를 기본안으로 본다.**

| 항목 | 내용 | 확인 |
|---|---|---|
| 모델과 질의 | 속성 그래프. 노드와 엣지 모두 속성을 가진다. 엣지에 출처를 싣는 이 설계와 맞는다. 질의어는 Cypher | [원문] |
| 판 | 직접 설치하는 판은 Community와 Enterprise. Community는 GPLv3, 단일 서버 | [원문] |
| Enterprise에만 있는 것 | Clustering, online backup, 역할 기반 접근 제어(RBAC), LDAP 연동. Property 존재·형 제약과 key 제약도 Enterprise 표시 | [원문] |
| Community에도 있는 것 | 유일성 제약, 전문 색인, vector 색인 | 제약·vector는 [원문], 나머지 [K] |
| Vector 색인 | 두 판 모두 지원. 최대 4096차원, cosine과 euclidean. 2026.01부터 Cypher의 `SEARCH` 절이 권장 | [원문] |
| GraphRAG | 공식 Python 패키지(`neo4j-graphrag`)에 vector 검색 뒤 Cypher로 이웃을 붙이는 retriever가 있다. 사내 모델에 붙일 수 있다고 한다 | [S] |
| 폐쇄망 설치 | 배포 파일과 Java 실행 환경을 반입해 설치하는 일반적인 방식. 반입 절차는 팀 확인 | [K] |

Community 판에 없는 것이 이 용도에서 얼마나 아픈지 따져 본다.

- **Online backup, clustering.** 그래프는 파생물이라 지워져도 다시 만든다. 아프지 않다.
- **RBAC.** 아프다. `04-system.md` 는 고객별 자료를 권한으로 가른다. Community 판에서는 DB에 직접 붙이지 않고, 사내 MCP 서버가 정해진 질의만 대신 실행하며 요청자의 권한으로 결과를 거르게 한다. 사람이 자유 질의를 넓게 쓰게 되면 Enterprise를 검토한다.
- **형·존재 제약.** 스키마 검사는 적재 파이프라인에서 한다.
- **GPLv3.** 사내에서 서버로 쓰는 것은 일반적으로 배포가 아니지만, 판단은 법무의 몫이다.

**대안과 한 줄 비교.**

| 대안 | 한 줄 | 확인 |
|---|---|---|
| Memgraph | Cypher 호환, 메모리 기반. Community는 BSL(소스 공개이나 오픈소스는 아님), RBAC·감사 로그는 Enterprise | [S] |
| Kùzu | 내장형. 공식 저장소가 2025-10-10에 보관 처리됐다. 후속 fork가 있으나 새로 고르기에는 이르다 | [S] |
| Apache AGE | PostgreSQL 확장. 이미 PostgreSQL을 운영하면 서버를 늘리지 않는다. 2026-08의 1.8.0은 PostgreSQL 18용 | [S] |
| RDF 저장소와 SPARQL | 표준과 온톨로지에 강하다. 엣지마다 속성을 싣는 일이 번거로워 출처 기록이 무거워진다 | [K] |
| DB 없이 파일 | 노드·엣지를 파일로 내고 CI에서 메모리에 올려 검사. 이 규모에서는 된다 | [제안] |

**결론.** 시작은 Neo4j Community 판 한 대다. 이유는 속성 그래프가 엣지 출처와 맞고, Cypher를 아는 사람과 자료가 많고, vector 색인이 같은 서버에 있어서다. 그런데 DB는 갈아 끼울 수 있게 둔다. 추출기는 DB가 아니라 중립적인 파일(노드와 엣지의 목록)을 내고, 적재기가 그것을 DB에 넣는다. 첫 블록의 CI 검사는 DB 없이 파일만으로도 돈다. **DB를 고르는 데 쓸 시간은 스키마와 추출 파이프라인에 써야 한다.**

## 4. 예제 한 줄기

조항 하나에서 버그까지 실제 조각으로 따라간다. `HOST_BURST` 는 "gc 1건을 처리하기 전에 먼저 처리할 host 건수"다.

**계약 (기존).** 키가 조항이다.

```yaml
id: HSI-RCV-010            # hsi/contracts/HSI-RCV-010.yaml
jira: FEAT-338
req: REQ-QOS-07
order: host 먼저. gc는 host 4건당 1건 이상   # → #order
full: 큐가 차면 gc 요청부터 backpressure     # → #full
bound: 모든 요청은 성공 또는 실패로 한 번 종료
fw_role: 정책과 retry table 설정, parity 복구
verify: [sva:a_host_first, sva:a_gc_no_starve]
```

**SystemRDL.** 태그는 사용자 정의 property다.

```systemrdl
// hsi/rdl/rcv_ctrl.rdl (예시)
property trace { type = string; component = reg | field; };
reg {
  field { sw = rw; hw = r;
    trace = "implements HSI-RCV-010#order";
  } HOST_BURST[3:0] = 4;      // gc 1건 전에 처리할 host 건수
  field { sw = rw; hw = r; } GC_BOOST[8:8] = 0;
} PRIOQ_CFG @ 0x60;
```

**RTL과 assertion.**

```systemverilog
// rtl/rcv/prio_q_sva.sv (예시)
// @trace verifies HSI-RCV-010#order
a_host_first: assert property (@(posedge clk) disable iff (!rst_n)
  host_req && gc_req && host_cnt < cfg_host_burst |-> !gc_gnt);
// @trace verifies HSI-RCV-010#order
a_gc_no_starve: assert property (@(posedge clk) disable iff (!rst_n)
  gc_req |-> s_eventually gc_gnt);
```

**C++ header와 FW.** Header는 생성물이고 원천 field가 적힌다. FW 함수 둘 가운데 하나에만 태그가 있다.

```cpp
// fw/include/rcv_ctrl_hsi.hpp — rcv_ctrl.rdl 에서 생성
// @trace generated-from rcv_ctrl.PRIOQ_CFG.HOST_BURST
template <class Bus> void set_host_burst(Bus& bus, uint8_t n);

// fw/rcv/rcv_policy.cpp
// @trace implements HSI-RCV-010#fw_role
void rcv::policy_init(Bus& bus) {
  rcv_ctrl::set_host_burst(bus, kHostBurst);        // 4
}
// fw/gc/gc_throttle.cpp — 태그 없음
void gc::throttle_update(Bus& bus, uint32_t backlog) {
  bus.write(rcv_ctrl::PRIOQ_CFG, (backlog > kHigh) << 8);
}
```

**그래프로 옮긴 모습.** 실선은 도구 추출, 굵은 선은 태그, 점선은 제안이다.

```text
고객 요구서 §4.2 ── REQ-QOS-07#AC-1 ══ REQ-207 (Jira)
                        ▲ derives          ▲ Implements
ADR-RCV-003 ─ rcv.arch.yaml#prio_q.order   FEAT-338 (Jira)
                        ▲ derives          ║ tracks
                   HSI-RCV-010#order ══════╝
        implements ▲    ▲ verifies         ▲ verifies
  PRIOQ_CFG.HOST_BURST  a_host_first ══ VER-541 ─ PASS @ VER-631
     ▲ writes           a_gc_no_starve ══ VER-542 ─ PASS @ VER-631
  rcv::policy_init      prio_q_ratio_test ══ VER-543
  gc::throttle_update   (via: reg, 태그 없음) ··· 제안
     ▲ observed_at
  BUG-2317 ─ defect ─ VER-530 FAIL @ VER-640 (emulation)
```

## 5. 효과: 질의와 결과

질의는 모두 확정 엣지만 쓴다. `PROPOSED` 는 엣지 종류가 달라서 아래 패턴에 걸리지 않는다.

### 5.1 변경 영향: "그 4가 어디에 있지?"

```cypher
MATCH (c:Clause {id:'HSI-RCV-010#order'})
      <-[:IMPLEMENTS|VERIFIES]-(s)
OPTIONAL MATCH (s)<-[:READS|WRITES|GENERATED_FROM]-(u)
WITH collect(DISTINCT s) + collect(DISTINCT u) AS hit
UNWIND hit AS n
RETURN DISTINCT labels(n)[0] AS kind, n.name AS name,
       n.path AS path
ORDER BY kind, name
```

```text
graph@9f3c2e1 (예시)
kind       name                    path
Assertion  a_gc_no_starve          rtl/rcv/prio_q_sva.sv
Assertion  a_host_first            rtl/rcv/prio_q_sva.sv
CSymbol    rcv_ctrl::set_host_burst fw/include/rcv_ctrl_hsi.hpp
Field      PRIOQ_CFG.HOST_BURST    hsi/rdl/rcv_ctrl.rdl
Func       gc::throttle_update     fw/gc/gc_throttle.cpp
Func       rcv::policy_init        fw/rcv/rcv_policy.cpp
Func       rcv::stats_dump         fw/rcv/rcv_stats.cpp
Module     prio_q                  rtl/rcv/prio_q.sv
Test       prio_q_ratio_test       dv/rcv/tests/
```

위쪽은 `DERIVES_FROM` 을 한 번 더 따라가면 나온다. 구조 기술의 `prio_q.order`(값의 원본이고 성능 모델과 formal 모델이 거기서 나온다), 결정 기록 `ADR-RCV-003`, 수용 기준 `REQ-QOS-07#AC-1` 이다.

| | Jira만 | 그래프 |
|---|---|---|
| 나오는 것 | 이슈 4건 (`FEAT-338`, Test 3건) | 심볼 9개, 파일 8개, 위쪽 조항 3개 |
| 빠지는 것 | FW 함수, register field, 구조 기술 | 태그도 접근도 없는 코드 |
| 걸리는 일 | 이슈에서 MR을 열어 파일을 훑고 담당에게 묻는다 | 질의 한 번. 결과를 사람이 확인한다 |

걸리는 시간이 얼마나 줄어드는지는 재지 않았다. 6장에서 재는 항목이다.

### 5.2 빈틈 검출

**검증이 없거나, 검사는 있는데 실행 증거가 없는 조항.**

```cypher
MATCH (c:Clause {doc:'HSI-RCV-010'})
OPTIONAL MATCH (c)<-[:VERIFIES]-(v)
OPTIONAL MATCH (v)<-[:TRACKS]-(t:Issue)
               <-[:RESULT {status:'PASS'}]-(:Exec)
RETURN c.id AS clause, count(DISTINCT v) AS checks,
       count(DISTINCT t) AS passed
ORDER BY clause
```

```text
clause               checks  passed
HSI-RCV-010#bound    0       0    ← 검증 없음
HSI-RCV-010#full     1       0    ← a_full_gc_bp, 실행 증거 없음
HSI-RCV-010#fw_role  0       0    ← 구현 태그만 있음
HSI-RCV-010#order    3       3
HSI-RCV-010#request  0       0    ← 형식 정의. 예외로 등록
```

R4J의 Coverage View에서 `FEAT-338` 은 Test가 셋이라 채워진 칸이다. Xray에서도 세 건이 모두 PASS라 OK다. 조항으로 내려가야 `bound` 에 검사가 없고, `full` 의 assertion은 Xray Test로 등록된 적이 없다는 것이 보인다. 판정은 여전히 Xray의 결과다. 그래프는 그 결과를 조항 옆에 놓을 뿐이다.

**어느 조항에도 닿지 않는데 계약 걸린 field를 쓰는 코드.**

```cypher
MATCH (f:Func)-[w:WRITES]->(:Field)-[:IMPLEMENTS]->(c:Clause)
WHERE NOT (f)-[:IMPLEMENTS]->(:Clause)
RETURN f.name AS func, f.owner AS owner, w.via AS via, c.id AS clause
```

```text
func                 owner   via  clause
gc::throttle_update  FW GC   reg  HSI-RCV-010#order
```

### 5.3 버그 역추적

Emulation에서 혼합 부하 시험 `VER-530` 이 실행 `VER-640` 에서 실패한다. GC 구간의 host P99.99가 2.4 ms다(예시). triage 에이전트의 버그 초안 `BUG-2317` 의 signature에 실패 시점의 register 값 `PRIOQ_CFG.HOST_BURST = 0` 이 적힌다. 그 이름이 `Field` 노드와 정확히 일치하므로 `OBSERVED_AT` 엣지가 추출된다.

```cypher
MATCH (b:Issue {key:'BUG-2317'})-[:OBSERVED_AT]->(f:Field)
MATCH (f)-[:IMPLEMENTS]->(c:Clause)
MATCH (fn:Func)-[x:READS|WRITES]->(f)
RETURN c.id AS clause, type(x) AS access, x.via AS via,
       fn.name AS func, fn.owner AS owner
```

```text
clause             access  via       func                 owner
HSI-RCV-010#order  WRITES  accessor  rcv::policy_init     FW 복구
HSI-RCV-010#order  WRITES  reg       gc::throttle_update  FW GC
HSI-RCV-010#order  READS   accessor  rcv::stats_dump      FW 복구
```

원인은 둘째 줄이다. GC가 밀리면 `GC_BOOST` 를 켜려고 register를 통째로 쓰는데, 그때 `HOST_BURST` 가 0으로 덮인다. 0이면 host 우선이 사라지고, 구조 설계 편에서 모델이 찾았던 GC 경쟁이 그대로 돌아온다. `a_host_first` 는 `host_cnt < 0` 이 성립하지 않아 조건을 만나지 못한 채 통과한다. 계약의 `order` 조항에는 값의 범위가 없었다. 계약의 빈칸이다.

**같은 문제의 다른 후보.** 같은 형태, 곧 field가 둘 이상인 register를 통째로 쓰는 FW 함수를 찾는다.

```cypher
MATCH (fn:Func)-[:WRITES {via:'reg'}]->(f:Field)<-[:HAS_FIELD]-(r:Reg)
WITH fn, r, count(f) AS fields WHERE fields > 1
RETURN fn.name AS func, r.name AS reg, fields
```

```text
func                    reg        fields
gc::throttle_update     PRIOQ_CFG  2
nand::retry_cfg_apply   RETRY_CFG  3
```

둘째 줄은 아직 실패하지 않은 같은 종류의 코드다. 수정은 MR !2334로 간다. 계약에 `HOST_BURST` 의 범위(1~8)를 넣고, FW는 접근 함수를 쓰게 고치고, `gc::throttle_update` 에 태그를 단다.

### 5.4 에이전트의 맥락과 Jira에 보이는 결과

에이전트는 지금 grep과 의미 검색으로 파일을 긁는다. 그래프가 있으면 출발점 하나에서 **부분 그래프**를 받아 거기 적힌 파일의 줄 범위만 읽는다. 사내 MCP 서버의 도구로 준다.

```text
trace.subgraph(seed='rcv_ctrl.PRIOQ_CFG.HOST_BURST', hops=2)
→ 노드 14 · 엣지 19 · 파일 8 (graph@9f3c2e1, 예시)
   각 노드: 종류, 이름, 경로, 줄 범위, 엣지의 method
trace.query(name='impact_v1', clause='HSI-RCV-010#order')
trace.propose(from, relation, to, 근거)   # PROPOSED 만 생성
```

에이전트에게 자유로운 Cypher 쓰기 권한은 주지 않는다. 이름 붙은 질의와 부분 그래프 조회, 제안 생성만 연다.

리뷰 봇은 MR이 올라오면 바뀐 심볼에서 위로 올라가 닿는 조항과 요구사항을 댓글로 단다. 같은 내용이 Jira 이슈에도 달린다. 사람은 그래프 DB를 열지 않고 Jira에서 본다.

```text
[에이전트 · req-agent · 영향 분석]  FEAT-338   ai-authored
변경      MR !2334  gc::throttle_update (fw/gc/)
닿는 조항 HSI-RCV-010#order (HOST_BURST 쓰기, via reg)
요구사항  REQ-207 (REQ-QOS-07 AC-1)
다시 볼 것 a_host_first · a_gc_no_starve · prio_q_ratio_test
          → VER-541 · VER-542 · VER-543 선택 실행
근거      graph@9f3c2e1 · 질의 impact_v1
확인 못 한 것  제안 링크 2건은 결과에서 제외함
요청      FW GC 담당, prio_q 담당: 리뷰
```

이슈에는 "추적 그래프에서 보기" remote link도 붙인다. 누르면 그 이슈를 가운데에 둔 부분 그래프가 사내 화면에 열린다.

**공개 근거의 수준.** 코드 저장소를 그래프 DB에 넣고 에이전트가 질의하게 한 연구(CodexGraph)는 있다. 검색 요약으로 본 결과는 "경쟁력이 있다"이지 뚜렷한 우위가 아니고, 토큰은 키워드 검색보다 훨씬 많이 썼다. 스펙과 RTL에서 지식 그래프를 만들어 assertion 생성에 쓴 연구(AssertionForge)도 있다. SSD 컨트롤러나 SoC의 요구사항–RTL–FW 추적 그래프로 에이전트의 정확도나 시간을 잰 공개 수치는 찾지 못했다. 이 절의 효과는 방향에 대한 주장이고, 팀이 재야 한다.

**퀄·감사 증적.** 요구사항 하나에서 조항, 구현 심볼, 검사, 통과한 Test Execution과 revision까지 한 질의로 묶인다. 증빙 묶음의 목차를 손으로 만들지 않는다. 증빙 자체는 여전히 Xray의 결과와 git의 증거 묶음이다.

## 6. 실행 순서

| # | 무엇을 | 누가 | 완료 판단 |
|---|---|---|---|
| 1 | 블록 하나(read 오류 복구: `rcv_ctrl`, `prio_q`)의 스키마를 정한다. 노드 13종, 엣지 16종에서 시작하고 함부로 늘리지 않는다 | 블록의 HW·FW·검증 담당, 인프라 담당 | 4장의 한 줄기를 손으로 그릴 수 있다 |
| 2 | 결정론적 추출기를 만든다. Jira, git, YAML, SystemRDL, RTL, FW 순서 | 인프라 담당, CAD 담당 | 추출만으로 5.3의 "누가 이 field를 쓰는가"가 나온다. 밤의 전체 재생성과 증분 결과가 같다 |
| 3 | 태그 관례와 `trace-lint` 를 켠다. 처음에는 경고만, 새 코드부터 | 블록 담당들, 검증 리드 | 그 블록의 계약 `verify:` 목록과 태그가 일치한다 |
| 4 | 영향 분석 댓글을 MR과 Jira에 단다 | 인프라 담당, 에이전트 | 실제 변경 요청 몇 건에서 사람이 한 분석과 대조했다 |
| 5 | 에이전트의 링크 제안을 연다. 기존 코드의 태그를 채운다 | `trace-agent`, 블록 담당 | 제안의 승인율과 반려 사유가 기록된다 |
| 6 | 블록을 넓힌다 | 팀 | 3번까지의 측정값이 유지된다 |

1~3번에는 LLM이 필요 없다. 5.1~5.3의 결과 대부분도 추출과 태그만으로 나온다. LLM 제안을 뒤에 두는 이유는, 확정 링크가 쌓여 있어야 제안의 품질을 잴 기준이 생기기 때문이다.

**측정.**

- **링크 정밀도.** 확정 엣지에서 표본을 뽑아 블록 담당이 맞는지 본다. 제안 엣지는 따로 잰다.
- **링크 재현율.** 블록 하나에서 담당들이 "있어야 하는 링크"를 손으로 적은 정답 목록을 만들고, 그래프가 그중 몇을 갖고 있는지 본다.
- **영향 분석에 걸리는 시간.** 같은 변경 요청을 지금 방식과 그래프로 각각 처리해 잰다. 놓친 항목 수도 함께 센다.
- **빈틈의 추이.** 검증 없는 조항, 태그 없는 접근의 수를 주간 지표에 넣는다(5편의 주간 공유).

## 7. 기술 요소와 성숙도

| 요소 | 내용 | 성숙도 | 확인 |
|---|---|---|---|
| Jira 추출 | Jira DC REST(v2)로 이슈와 링크, remote link. Xray DC의 REST와 JQL 함수. R4J REST | 상용. 연결은 직접 구축 | Xray는 `05` 에서 [원문]. R4J의 트리 조회 endpoint는 미확인 |
| SystemRDL | `systemrdl-compiler`(PeakRDL). Python API로 모델을 순회하고 field의 property를 읽는다. 사용자 정의 property 지원 | 오픈소스 | [S] |
| SystemVerilog | slang과 Python 바인딩 pyslang. Parse와 elaboration. 계층을 보는 도구(`slang-hier`) 포함. Verible, Surelog/UHDM은 이번에 확인 못 함 | 오픈소스 | pyslang [S]. Assertion과 elaborated 계층의 Python API 범위는 미확인 |
| 팀의 EDA 도구 | 시뮬레이터·formal 도구의 elaboration DB에서 계층과 assertion 목록을 내는 길 | 상용 | 미확인. 팀 확인 |
| FW 심볼과 호출 | compile DB와 clang 계열 색인. SCIP 형식의 C/C++ 색인기(`scip-clang`)는 beta 표기. tree-sitter는 문법 수준이라 호출 해석이 약하다 | 오픈소스 | scip-clang [S], 나머지 [K] |
| 추적 태그 도구 | OpenFastTrace(코드의 coverage 태그를 읽는 추적 도구, GPL-3.0), StrictDoc(문서와 소스 파일·테스트 사이 링크, C/C++·Python 언어 인식), Sphinx-Needs와 sphinx-codelinks(주석 한 줄로 need 정의) | 오픈소스 | [S]. SystemVerilog와 SystemRDL 지원은 어느 도구에서도 확인 못 함 |
| 태그 스캐너와 `trace-lint` | 위 도구가 HDL을 직접 다루지 않으면 주석 스캐너를 짓는다. 주석을 심볼에 붙이는 데 위 파서를 쓴다 | 직접 구축 | [제안] |
| 검증 도구의 요구사항 추적 | Siemens Questa Verification IQ(Polarion·Jama와 연동, testplan과 coverage 연결), ReqTracer | 상용 | [S] 벤더 자료. Jira DC·R4J와의 연동, FW 심볼까지의 연결은 미확인 |
| 그래프 DB | 3.4 | 오픈소스·상용 | 3.4 |
| 링크 제안 에이전트 | 요구사항–코드 링크 복원 연구. 검색 요약으로는 LLM 단독의 정밀도·재현율이 높지 않고(한 프로젝트 요약에 정밀도 약 0.18, 재현율 약 0.38), 기존 정보 검색 기법보다 못하다는 보고도 있다 | 논문 | [S]. 원문 미확인. 공개 SW 데이터셋 대상 |
| 부분 그래프 조회 | 사내 MCP 서버의 도구. vector 검색으로 출발점을 찾고 그래프로 이웃을 붙인다 | 직접 구축 | [제안] |

## 8. 리스크와 지키는 선

| 리스크 | 대응 |
|---|---|
| 낡은 링크 | commit마다 증분 갱신, 밤마다 전체 재생성. 깨진 태그는 merge를 막는다. 모든 결과에 그래프의 commit을 적는다 |
| 틀린 LLM 링크가 사실처럼 굳는다 | 제안은 다른 엣지 종류로 저장하고 기본 질의에서 빠진다. 확정은 사람이 승인한 MR로 태그가 들어갈 때뿐이다. 반려는 기록한다 |
| 태그 부담 | 계약이 걸린 경계에만 필수. 생성물은 생성기가 단다. 기존 코드는 에이전트가 MR로 제안한다 |
| 태그가 거짓말을 한다 | 태그는 리뷰 대상이다. 표본 검사로 정밀도를 잰다. 태그가 있다는 것은 통과했다는 뜻이 아니다 |
| 스키마 팽창 | 노드·엣지 종류를 더할 때는 그것으로 답할 질의를 함께 적는다. 질의가 없으면 더하지 않는다 |
| 그래프를 원본으로 착각 | 그래프에 직접 쓰는 길을 두지 않는다. 고치려면 Jira나 git을 고친다 |
| 추출의 사각 | 매크로, 함수 포인터, generate 문, 간접 register 접근은 추출이 놓친다. 놓치는 종류를 문서에 적고 표본으로 잰다 |
| 권한 | 그래프는 여러 고객 자료의 연결을 한곳에 모은다. 조회는 요청자의 권한으로 거른다 |

**지키는 선.**

- **원본은 Jira와 git이다.** 그래프는 언제든 지우고 다시 만들 수 있어야 한다. 그렇게 할 수 없게 되는 순간 설계가 틀어진 것이다.
- **확정 링크는 사람이 승인한다.** 에이전트는 제안까지다. 승인은 MR 승인으로 남는다.
- **요구사항 충족의 판정은 그래프가 하지 않는다.** PASS와 FAIL은 Xray에 올라온 실행 결과이고, "충족 확인" 전환은 사람만 한다(`05`). 그래프는 무엇을 볼지를 알려 준다.
- **영향 목록은 출발점이다.** 그래프에 없는 영향이 있을 수 있다. 결과에는 항상 "확인 못 한 것"을 적는다.
- **Jira가 창구다.** 지시, 질문, 승인은 Jira에서 한다. 그래프의 결과는 댓글과 링크로 Jira에 나타난다.

## 9. 근거와 미확인, 팀 확인이 필요한 가정

2026-11-14에 확인했다. [원문]은 공식 문서를 직접 읽은 것, [S]는 검색 요약에 기댄 것, [K]는 사전 지식, [제안]은 공개 근거 없이 이 문서가 제안한 것이다.

| 내용 | 출처 | 확인 |
|---|---|---|
| Neo4j의 판: Community(GPLv3, 단일 서버), Enterprise(clustering, online backup, RBAC, LDAP), Infinigraph. 현재 문서 판 2026.10, LTS 5.26. 저장 형식의 한계(aligned 340억) | https://neo4j.com/docs/operations-manual/current/introduction/ | [원문]. 기능 표의 판별 표시는 본문 서술로만 확인 |
| Neo4j 제약: 존재·형·key 제약은 Enterprise 표시, 유일성 제약은 표시 없음 | https://neo4j.com/docs/cypher-manual/current/constraints/ | [원문] |
| Neo4j vector 색인: 두 판 모두, 5.13에 정식, 최대 4096차원, `SEARCH` 절(2026.01), 기존 procedure는 2026.04에 deprecated | https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes/ | [원문] |
| `neo4j-graphrag` Python 패키지의 retriever, 로컬 모델 연결 | https://neo4j.com/docs/neo4j-graphrag-python/current/ , Neo4j 블로그 | [S] 벤더 자료 |
| Memgraph: Community는 BSL, Enterprise에 RBAC·감사 로그·multi-tenancy | https://memgraph.com/legal , 문서 | [S] |
| Kùzu 저장소 보관(2025-10-10, 마지막 0.11.3), fork(Ladybug, RyuGraph) | https://www.theregister.com/2025/10/14/kuzudb_abandoned/ 외 | [S] |
| Apache AGE 1.8.0(2026-08), PostgreSQL 18 | https://age.apache.org/release-notes , EDB 문서 | [S]. 출처마다 날짜가 다름 |
| OpenFastTrace: 요구사항 추적 도구, 코드의 coverage 태그 import, GPL-3.0 | https://github.com/itsallcode/openfasttrace | 저장소 첫 화면 [원문]. 태그 문법과 지원 파일 형식은 미확인 |
| StrictDoc: 요구사항과 소스 파일의 추적(문서에 experimental 표기), C/C++·Python 언어 인식 | https://strictdoc.readthedocs.io | [S] |
| Sphinx-Needs, sphinx-codelinks: 소스 주석에서 need 생성, C++ 주석은 tree-sitter 기반 | https://pypi.org/project/sphinx-codelinks/ | [S] |
| `systemrdl-compiler`: 순회 API와 listener, property 조회 | https://systemrdl-compiler.readthedocs.io | [S] |
| slang·pyslang: SystemVerilog parse와 elaboration, Python 바인딩 | https://pypi.org/project/pyslang/ , https://sv-lang.com | [S] |
| `scip-clang`: C/C++ SCIP 색인기, beta 표기 | https://github.com/sourcegraph/scip-clang | [S] |
| Jira DC REST의 remote link | https://developer.atlassian.com/server/jira/platform/jira-rest-api-for-remote-issue-links/ | [S] |
| Questa Verification IQ, ReqTracer의 요구사항 추적 | Siemens 자료 (verificationacademy.com) | [S] 벤더 주장 |
| CodexGraph: 코드 저장소를 그래프 DB로, 에이전트가 질의. 결과는 경쟁력 있는 수준, 토큰 사용은 많음 | https://arxiv.org/abs/2408.03910 (NAACL 2025) | [S] |
| AssertionForge: 스펙과 RTL에서 지식 그래프를 만들어 SVA 생성 | https://arxiv.org/abs/2503.19174 | [S] |
| 지식 그래프와 에이전트 기반 formal 검증 | https://arxiv.org/abs/2605.06434 | [S] 초록 요약만 |
| LLM 기반 요구사항–코드 링크 복원(LiSSA 등) | ICSE 2025, arXiv 2604.22432 외 | [S]. 수치는 프로젝트 요약에서 옴 |
| Atlassian Data Center 제품의 지원 종료 공지(2029-03-28) | https://www.atlassian.com/licensing/data-center-end-of-life | [S] |

**확인하지 못한 것.**

- SoC나 SSD 컨트롤러에서 요구사항–RTL–FW 지식 그래프의 효과(영향 분석 시간, 누락 감소)를 잰 공개 수치는 없다.
- 그래프 조회가 grep·vector 검색보다 에이전트의 작업 품질을 얼마나 올리는지 HW/FW 대상으로 잰 자료는 없다.
- 3.4의 규모는 가정에서 나온 자릿수다.
- OpenFastTrace, StrictDoc, sphinx-codelinks가 SystemVerilog와 SystemRDL을 다루는지 확인하지 못했다. 그래서 스캐너를 직접 구축으로 적었다.
- pyslang의 Python API로 assertion과 elaborated 계층을 어디까지 읽을 수 있는지 문서로 확인하지 못했다.
- R4J REST API의 트리 조회 endpoint, Neo4j Community 판의 폐쇄망 설치 절차.

**팀 확인이 필요한 가정.**

| 가정 | 확인할 것 |
|---|---|
| 요구사항과 계약이 YAML로 git에 있다 | 1편의 전환이 그 블록에서 되어 있는지. 안 되어 있으면 조항 ID를 문서 절 번호로 시작한다 |
| FW는 생성된 접근 함수나 header 상수로 register에 접근한다 | 실제 접근 방식. 주소를 직접 계산하는 코드가 많으면 `READS`·`WRITES` 추출이 약해진다 |
| FW 빌드가 compile DB를 낼 수 있다 | 빌드 시스템과 컴파일러 |
| RTL을 오픈소스 프런트엔드나 EDA 도구로 elaboration해 계층과 assertion 목록을 낼 수 있다 | 벤더 고유 구문, 암호화 IP, 팀의 EDA 도구가 주는 출력 |
| 버그 이슈의 signature에 register·assertion 이름이 정확히 적힌다 | triage 에이전트의 초안 양식(1편의 bug 기록) |
| Emulation 실패 시점의 register 값을 로그로 얻는다 | Emulator의 dump 방식 |
| GPLv3 서버를 사내에서 쓸 수 있다 | 법무와 보안의 반입 기준 |
| Jira Data Center를 계속 쓴다 | 지원 종료 공지에 대한 회사의 계획. 그래프가 파생물이면 추적 창구가 바뀌어도 추출기 하나를 바꾸면 된다 |

**이 편에서 새로 생긴 식별자.**

| 식별자 | 무엇 |
|---|---|
| `VER-541`, `VER-542`, `VER-543` | Xray Test. `a_host_first`, `a_gc_no_starve`, `prio_q_ratio_test` |
| `VER-631`, `VER-640` | Test Execution. 야간 regression, emulation 혼합 부하 |
| `BUG-2317` | GC 구간에서 `HOST_BURST` 가 0으로 덮여 host P99.99 초과 |
| `MR !2334`, `MR !2341` | `BUG-2317` 수정, 태그 제안 |
| `PRIOQ_CFG` (`HOST_BURST`, `GC_BOOST`) | `rcv_ctrl` 의 우선 큐 설정 register, 0x60 |
| `a_full_gc_bp` | `HSI-RCV-010#full` 의 assertion (실행 증거 없음) |
| `rcv::policy_init`, `rcv::stats_dump`, `gc::throttle_update`, `nand::retry_cfg_apply`, `rcv_ctrl::set_host_burst` | FW 함수와 header 심볼 |
| `trace-agent` | 링크 후보를 제안하는 에이전트 계정 |
| `trace-lint`, `trace-scan`, `trace.subgraph`, `trace.query`, `trace.propose` | CI 검사, 태그 스캐너, 사내 MCP 도구 |
| `trace/ignore.yaml`, `trace/rejected.yaml` | 태그 예외, 반려한 제안 |
| 경로 | `hsi/contracts/`, `hsi/rdl/rcv_ctrl.rdl`, `rtl/rcv/prio_q.sv`, `rtl/rcv/prio_q_sva.sv`, `fw/include/rcv_ctrl_hsi.hpp`, `fw/rcv/rcv_policy.cpp`, `fw/rcv/rcv_stats.cpp`, `fw/gc/gc_throttle.cpp`, `dv/rcv/tests/` |
| commit `9f3c2e1` | 예제 그래프의 기준 commit |
