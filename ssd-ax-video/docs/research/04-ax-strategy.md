# 04. AX 전략 프레임 · 프로세스 혁신 · 시스템 · 일하는 방식 · 문화

> 조사일 2026-11-10. 웹 접근 가능(일부 사이트는 차단).
> 확인 수준 표기 — **[W]** 이번 조사에서 원문 페이지를 직접 열람 / **[W-2차]** 직접 열람했으나 그 기사 자체가 타 매체를 인용한 보도 / **[S]** 검색 요약·2차 보도로만 확인 / **[K]** 사전 지식(웹 미확인).
> 기관·벤더 수치는 모두 "○○ 주장"이며, 목표 수치는 제시하지 않았다.

## 0. 한 줄 결론

논지는 **대체로 지지되지만 두 가지 단서**가 붙는다. (1) 작업 단위 도입이 무가치한 것이 아니라, 그 이득이 **병목 이동** 때문에 조직 지표에서 사라지기 쉽다. (2) 하드웨어에서 다시 설계할 대상은 gate 사이의 흐름이지 **sign-off gate 자체가 아니다**. 칩 설계에서 "AI-native 프로세스가 tape-out 성과를 개선했다"는 독립 실증은 아직 찾지 못했다.

## 1. 왜 작업 단위 도입만으로는 조직 성과가 안 나는가

| 근거 | 내용 | 확인 |
|---|---|---|
| McKinsey State of AI 2026 (설문 2026-05~06, 1,719명) | 응답자 80%가 개인 생산성 향상을 보고했으나 EBIT 기여를 말한 곳은 37%로 전년 수준. high performer(EBIT 5% 이상 기여)는 약 6%이며, 이들 중 약 3/4이 workflow를 근본적으로 재설계했다고 응답(나머지는 약 1/4) | [S] |
| DORA 2025 (2025-09, 약 5,000명) | AI 도입은 throughput·product performance와 양(+), delivery stability와는 음(−)의 관계. "AI doesn't fix a team; it amplifies what's already there." 내부 platform 품질과 value stream management가 증폭 조건 | [W] (VSM은 [S]) |
| Faros AI 텔레메트리 (2026-04, 개발자 22,000명) | Faros 주장: task throughput/dev +33.7%인 동시에 first PR review까지의 median 시간 +156.6%, bugs/dev +54%, 리뷰 없이 merge된 PR +31.3% | [W] |
| Bain Technology Report 2025 | Bain 주장: assistant 도입 팀 생산성 +10~15%. 코드 작성·테스트는 idea→launch 시간의 25~35%. end-to-end process 전환을 병행한 일부 기업은 +25~30% | [S] |
| Atlassian DevEx 2025 (3,500명) | 68%가 AI로 주 10시간 이상 절약, 50%가 조직 비효율로 주 10시간 이상 손실 | [S] |
| BCG 10-20-70 | 노력의 70%는 사람·조직·프로세스에 써야 한다는 주장 | [S] |
| NBER w34836 (2026-02, 임원 약 6,000명) | 기업의 80% 이상이 지난 3년간 AI가 고용·생산성에 영향이 없었다고 응답 | [S] |

**메커니즘 세 가지.** ① 작성은 전체 리드타임의 일부다(Amdahl). ② 생성 속도가 오르면 병목이 review·verification·integration으로 옮겨간다. ③ 절약된 시간이 고가치 업무로 재배치되지 않는다(Bain 지적).
**하드웨어 함의(추론, [K]).** SoC 일정은 RTL 작성보다 verification 수렴·FW bring-up·qual이 지배하므로 "작성 가속 → 검증 대기열 증가" 패턴이 더 강하게 나타날 가능성이 높다.

### 논지에 불리하거나 주의가 필요한 근거

- **조직 단위 output 자체는 늘었다.** DORA 2025는 전년과 달리 throughput과 양의 관계를 보고[W], Faros 2026은 epics/dev +66% 주장[W]. 사라지는 것은 output이 아니라 품질·안정성이다.
- **Faros 2026은 "기반이 좋은 조직도 같은 하류 악화를 겪는다"고 주장**해 DORA의 amplifier 결론과 충돌한다[W]. 즉 "재설계하면 해결된다"도 텔레메트리로 입증된 명제는 아니다.
- **컨설팅 설문은 상관관계다.** workflow redesign과 성과의 관계는 자기보고이며 역인과(역량 있는 조직이 재설계도 한다) 가능성이 있다[S].
- **개인 단위 수치는 빠르게 낡는다.** METR의 "19% 느려짐"(2025 초, CI +2%~+39%)은 2026-02 갱신에서 작업 시간 변화 추정 −18%(기존 참가자, CI −38%~+9%), −4%(신규 참가자, CI −15%~+9%)로 단축 방향으로 바뀌었다(음수 = 시간 단축). 다만 METR 스스로 selection effect 때문에 신뢰할 수 없는 신호이며 실제 효과의 하한일 것이라고 밝혔다[W].
- **MIT NANDA "95% 무수익"**은 표본이 작고 예비 보고서라 근거로 쓰기 약하다[S]. NBER w34984(CFO 설문)는 오히려 양의 생산성 효과를 보고한다[S].
- **task 단위에서도 큰 효과가 있다.** NVIDIA Bill Dally는 standard cell library 포팅(8명·약 10개월)을 하룻밤에 끝낸다고 발표하면서도 AI 단독 칩 설계는 "a long way"라고 했다[S]. low-hanging fruit는 버릴 대상이 아니라 **재투자 재원**이다.
- **Gartner 예측**: agentic AI 프로젝트의 40% 이상이 2027년 말까지 취소(비용·불명확한 가치·리스크 통제 미흡)[S]. 1990년대 BPR의 높은 실패율도 같은 경고다[K, 확신도 중].

**영상용 논지 보정 제안.** "작업 단위 AI는 효과가 없다"가 아니라 "개인은 빨라졌는데 조직 지표는 제자리"라는 격차(McKinsey 2026: 80% 대 37%[S])를 출발점으로 삼는 편이 근거와 맞는다.

## 2. 성숙도 모델

**실제로 쓰이는 틀**

- **자율 수준 L1~L5 (EDA 벤더).** Synopsys AgentEngineer: L2 단일 agent의 step 수행 → L3 multi-agent → L4 동적 flow 최적화 → L5 자율 의사결정(2025-05)[W]. Cadence도 ChipStack에 "Level 5"를 주장하지만 벤더별 척도가 달라 비교 불가[S].
- **Microsoft Frontier Firm 3단계**: assistant → 사람-agent 팀 → 사람이 agent 팀을 관리[S]. ("human-led, agent-operated"라는 정확한 문구는 미확인)
- **BCG Deploy → Reshape (→ Invent)**: 생산성 도입에서 workflow 재설계로[S, Invent는 K].
- **SK hynix 사내 로드맵**: Native RAG + LLM(2023) → Agents·Work Tools(2024) → Agentic AI → Agent Orchestration(2025)[W].
- **SDLC 계열**: ELEKS 5단계(AI-supported → AI-assisted → AI-native → AI-autonomous), IBM Research ACMM(자율도가 아니라 feedback loop 구조로 성숙도 정의)[S].

주의: 벤더의 L1~L5는 **도구의 자율도**를 재는 척도다. 조직 성숙도는 자율도가 아니라 측정·추적성·검증 독립성이 갖춰졌는지로 판단해야 한다.

**하드웨어/반도체용 3단계 제안**

| | 1. AI-assisted | 2. AI-automated | 3. AI-native |
|---|---|---|---|
| 적용 단위 | Atomic (개인 작업) | Process (workflow) | Project (value stream) |
| AI의 일 | 초안·요약·질의응답 | tool을 호출하며 닫힌 루프 수행 | 프로세스가 agent를 전제로 설계됨 |
| 사람의 일 | 작성자 | checkpoint 승인자 | 의도 정의·검증 설계·sign-off |
| 산출물 | 기존 문서 그대로 | 일부 machine-readable | executable spec이 single source |
| 승급 조건 | 사용 로그·baseline 확보 | workflow별 eval·추적성 확보 | 독립 검증 경로와 gate 증빙 자동화 |

원칙: **자율 수준은 조직 전체가 아니라 작업의 비가역성으로 정한다.** 되돌릴 수 있는 일(triage, 스크립트, 초안)은 자율로, 되돌릴 수 없는 일(tape-out, 고객 출하 FW)은 gate로 둔다.

## 3. 5개 전환 축: 지금 → 지향점

| 축 | 지금 | 지향점 | 선행 사례 |
|---|---|---|---|
| **산출물** | 사람이 읽는 Word/PPT spec, 회의록, 암묵지 | 기계가 읽고 실행하는 spec, requirement–RTL–test–coverage 추적성, AI 산출물 provenance 표시 | Solidigm "Feature Breakdown Tool"(spec을 test case에 매핑)[W]; SVA를 executable specification으로 다루는 연구, spec 기반 knowledge graph·traceability 연구(VeriGraphi, IncreRTL, UCAgent)[S]; Jama·PTC의 digital thread(벤더 자료)[S] |
| **프로세스** | 순차 handoff, 일괄 리뷰, 야간 regression 후 수동 triage | gate는 유지하되 gate 사이를 agent 루프가 연속으로 메움. spec 변경이 영향 분석·재검증을 자동 촉발. 작은 batch, 병목(review 용량) 관리 | AMD "Shift Left AI" 팀: 고립된 task 보조에서 연결된 agentic workflow로(2026-04)[S]; Synopsys "re-engineer engineering"[W]; DORA의 small batches·VSM[S] |
| **일하는 방식** | 엔지니어가 작성하고 동료가 전수 리뷰 | 의도 정의 → agent 오케스트레이션 → 증거 기반 검토. 생성자와 검증자 분리, risk 기반 샘플링, sign-off 책임은 사람 | Synopsys: "decision making → decision validation", "human engineers will and must always be in the loop"[W]; Microsoft "agent boss"[S] |
| **시스템** | 개인별 chatbot, tool 미연동 | 아래 6요소를 갖춘 사내 platform | 아래 표 |
| **문화** | 개인 요령, 사용량 미측정 | 측정·공유·학습 루프, 실패 허용 실험, 평가·보상 연동, 역량 전환 | Shopify: "reflexive AI usage"를 기본 기대치로, 평가 문항 반영(2025-04)[S]; SK hynix: 장비 검증 인력 KPI를 AI software 검증·배포와 연동(보도)[W-2차]; BCG: 5시간 이상 교육·리더 지원이 정착과 상관[S] |

**산출물 보충.** agent가 읽는 것은 문서가 아니라 context다. 선행 조직의 공통 행동은 (a) spec을 구조화해 test·coverage 항목과 연결하고, (b) 과거 bug와 해결 사례를 검색 가능한 지식으로 만들고(Solidigm DALA[W]), (c) AI가 만든 산출물에 출처 표시를 남기는 것이다. register map·interface 정의처럼 이미 machine-readable 형식(SystemRDL, IP-XACT 등[K])이 있는 영역이 출발점으로 적합하다.

**프로세스 보충.** 순차 handoff를 대체하는 것은 무질서한 병렬이 아니라 **gate가 있는 연속 흐름**이다. 생성만 빨라지면 review가 막히므로(Faros[W]), 재설계의 첫 대상은 작성 단계가 아니라 대기열이 쌓이는 지점(regression triage, review, 영향 분석)이다. Samsung의 schematic agent–layout agent 연동(layout 전 PPA 예측, schematic 변경에 layout이 자동 반응)[W]은 단계 간 handoff를 feedback loop로 바꾼 공개 사례다.

**일하는 방식 보충.** 리뷰 대상이 "사람이 쓴 코드"에서 "agent가 낸 결과와 그 증거"로 바뀐다. 그래서 (a) 전수 line 리뷰 대신 증거(coverage, formal 결과, 변경 영향 범위) 리뷰, (b) 생성 agent와 검증 경로의 분리, (c) agent의 자기 선언을 sign-off 근거로 쓰지 않는 규칙이 필요하다(5절 실험이 직접 근거). Faros는 리뷰 부담이 senior에게 몰리는 "senior engineer tax"를 경고한다[W].

**문화 보충.** Anthropic RCT는 AI를 쓰느냐보다 어떻게 쓰느냐가 학습을 가른다고 보고했다[S]. Atlassian 조사에서는 개발자의 63%가 리더가 자신의 pain point를 모른다고 답했다[S]. 측정 없이 도입만 밀면 신뢰를 잃는다.

**시스템(플랫폼) 구성 요소**

| 요소 | 역할 | 공개 사례 |
|---|---|---|
| 사내/프라이빗 LLM | 설계 데이터가 외부로 나가지 않는 추론 | Samsung DS Assistant, Code Mate(on-prem)[S/W]; SK hynix GaiA[W]; NVIDIA ChipNeMo(2023)[K/S] |
| agent 오케스트레이션 | supervisor–worker, 실패 복구 루프 | Siemens Fuse EDA AI Agent[S]; SK hynix Agent Orchestration 단계[W] |
| EDA·사내 tool 연동 | agent가 simulator·formal·issue tracker를 호출 | Samsung Code Mate와 Siemens Fuse 모두 MCP 사용[W/S] |
| 설계 데이터 RAG·knowledge graph | spec·bug·waiver·과거 해결 사례 검색 | Solidigm SENTA(RAG), DALA(debug)[W]; DORA "AI-accessible internal data"[S] |
| 평가(eval) 체계 | 실제 과제 기반 회귀 평가, held-out set | Samsung: 실제 개발 과제 기반 평가 환경 구축 "계획"[W]; ESD Alliance 패널: 업계 공통 benchmark 부재 지적[S] |
| 권한·감사 | RBAC, audit trail, human checkpoint, sandbox | Siemens Fuse(air-gapped 지원)[S]; Cadence ChipStack의 sandbox 실행[S] |

추가로 **비용 관측**이 필요하다. McKinsey 2026 응답자의 약 20%가 token 등 운영비 때문에 사용이 제약됐다고 답했고[S], Samsung Code Mate는 월 약 1.45조 token 사용을 밝혔다[W]. 비용도 처음부터 지표로 관리해야 한다.

## 4. 반도체 업계의 조직 차원 사례

| 조직 | 내용 | 시점 | 출처 | 확인 |
|---|---|---|---|---|
| Samsung DS | Code Mate: on-prem coding agent, MCP로 사내 코드·문서 연동, 개발자 10,000명 이상 사용, "3~4일 → 1일" 현장 피드백(통제 실험 아님) | 2023~, 게시 2026-10 추정 | semiconductor.samsung.com tech-blog | [W] |
| Samsung DS | GTC 2026 발표: schematic·layout multi-agent workflow, design TAT 약 50% 단축 주장 | 2026-03-17 | semiconductor.samsung.com tech-blog | [W] |
| Samsung (System LSI) | 고객 맞춤 SoC 검증이 "한 달 이상 예상 → 이틀" 보도. 단일 사례, 방법론 미공개 | 2026-08 | TrendForce(조선일보 인용) | [W-2차] |
| SK hynix | GaiA platform, 2024년 AIX 전담 조직, 장비 보전·정책 분석·회의 agent beta, 전 구성원 LLM Chat | 2025-08-14 | asiae.co.kr | [W] |
| SK hynix | 청주 back-end에 agent 단계 도입, KPI 연동, 2030 자율 fab 목표(보도) | 2026-08-13 | trendforce.com | [W-2차] |
| Solidigm (SSD) | SENTA, DALA, BETT(BOM agent), Athena(FW tuning) 등 사내 tool 공개. 수치 없음 | 2026-01-13 | solidigm.com | [W] |
| Micron (SSD) | controller 개발 50%, SSD 전체 60% 단축 주장 | 2026-10-21 webinar | 2차 보도만 | **미확인** |
| NVIDIA | Agent Toolkit·Nemotron을 자사 EDA workflow에 적용. 사내 사용 규모 수치 없음 | 2026-07-27 | nextplatform.com | [W] |
| AMD | Shift Left AI 팀(Alex Starr). 야간 simulation log 분석 사례는 2차 요약 | 2026-04 | amd.com blog | [S] |
| Synopsys | AgentEngineer·Autopilot, 50건 이상 engagement, GA 2026년 말 계획 주장 | 2026 | synopsys.com, Tom's Hardware | [S] |
| Cadence | ChipStack AI Super Agent 첫 출시(초기 고객 Altera·NVIDIA·Qualcomm·Tenstorrent), 이후 Level-5 버전 발표, early access 2026 H2 | 2026-02 / 2026-05~06 | businesswire.com | [S] |
| Siemens | Fuse EDA AI Agent: RBAC·audit trail·human checkpoint, air-gapped | 2026-03-16 | news.siemens.com | [S] |

관찰: 공개 사례의 대부분은 **2단계(workflow agent화) 진입**이며, 프로세스 전체를 재설계했다는 공개 증거는 드물다. 수치는 거의 전부 자사 발표다. SSD controller 전문 업체(Phison, Silicon Motion, Kioxia, Marvell, SanDisk)의 조직 차원 사내 AI 도입 공개 자료는 찾지 못했다.

## 5. 거버넌스와 리스크

| 리스크 | 근거 | 통제 방향 |
|---|---|---|
| 설계 IP 유출 | Samsung DS는 유출 우려로 외부 chatbot을 금지하고 사내 도구를 구축(2023~24 보도)[S]. EDA 3사 모두 on-prem·air-gapped 옵션 제시[S] | 데이터 등급별 모델 경로(공개/사내/격리), 학습 데이터 provenance 관리 |
| AI 산출물 책임·sign-off | Arm 소속 엔지니어의 독립 실험: 806개 seeded bug 중 최고 모델도 20.8% 누락, 세 모델 모두 자기 목표 100% 달성 후 sign-off 선언(SemiEngineering 2026-11-02)[W]. "You can automate the work of verification. You cannot automate the responsibility for it." | sign-off는 사람 명의, agent의 "완료 선언"은 증거로 인정하지 않음, 생성과 검증의 독립 경로 |
| 환각 | 위 실험에서 모호한 spec을 질문 없이 진행[W] | 결정론적 tool(simulator·formal·lint)로 판정, 모호성 발견 시 중단·질의 규칙, held-out eval |
| 수출통제·고객 기밀 | EAR deemed export(15 CFR 734.13(b)) 일반론[S]. 반도체 설계의 cloud LLM 사용에 대한 구체 지침은 **미확인**. 국내 국가핵심기술 규제는 [K] | 법무 검토 선행, 고객 NDA·foundry PDK 조항별 허용 경로 정의 |
| 과의존·역량 공동화 | Anthropic RCT(2026-01, 52명): AI 사용 그룹 quiz 약 50% vs 수작업 약 67%, debugging에서 격차 최대. 단 질문형 사용자는 높은 점수[S] | junior의 수작업 debug 구간 유지, "설명 요구" 사용 패턴 교육, 역량 지표 추적 |
| 속도 지표 착시 | Faros 주장: throughput 상승과 bugs·incident 증가가 동시에 발생[W]. 업계 기준선도 악화 중이다 — first-silicon success 14.4%(2024) → 5%(2026), 단일 원인은 규명되지 않음(Siemens/Wilson)[W] | throughput 지표와 품질 guardrail 지표를 항상 쌍으로 보고 |

## 6. 로드맵과 지표

**12~36개월 3단계 (전형적 구성)**

| 단계 | 핵심 | 종료 조건(수치 아님) |
|---|---|---|
| ① 기반 구축 (0~12개월) | 프라이빗 LLM·tool 연동·RAG, 데이터 등급 정책, baseline 측정, low-hanging fruit 정리 | 주요 workflow의 baseline과 eval set이 존재 |
| ② workflow agent화 (12~24개월) | 병목 workflow부터 닫힌 루프화(triage, 영향 분석, test 생성), checkpoint·audit, 산출물의 machine-readable화 | workflow 단위 Success·Cost가 상시 측정됨 |
| ③ 프로세스 재설계 (24~36개월) | executable spec 중심 흐름, 연속 검증, 역할·평가 체계 개편 | project 단위 지표가 개선 추세, gate 증빙 자동 생성 |

각 단계는 진단 → 개선안 도출 → 실험 → 적용·학습의 순환으로 굴린다. SK hynix의 4단계 로드맵[W]이 ①→② 구성과 유사하다.

**순서 원칙.** (a) 병목 먼저 — 작성이 아니라 대기열. (b) 되돌릴 수 있는 작업 먼저. (c) 측정이 자율보다 먼저 — 초기에는 adoption·enablement, 이후 delivery·autonomy 지표로 옮긴다[S]. (d) ①에서 절약한 시간을 ② 구축에 명시적으로 재투자한다.

**지표 후보**

- **적용 범위**: agent가 수행한 workflow 비율, machine-readable spec 비율, requirement–test 추적성 비율
- **품질**: agent 작업의 first-pass 통과율, seeded-bug 검출률, 사람 재작업률
- **비용**: 단위 작업당 token·compute·license 비용, review에 쓰인 엔지니어 시간
- **흐름**: spec 변경→검증 완료 TAT, regression triage 시간, 검증 수렴 기간(coverage closure), review 대기 시간
- **결과**: pre-silicon bug escape, re-spin 횟수와 원인, FW 결함의 qual·고객 유출, 퀄 통과율(1회차), 일정 준수
- **사람**: 엔지니어 시간 배분(작성·검토·debug·대기), 역량 평가, 교육 이수
- **guardrail**: 리뷰 없이 반영된 변경 비율, waiver 증가율, incident 수

## 7. 영상용 메시지·메타포 후보

**핵심 메시지**
1. "AI를 일에 끼워 넣지 말고, AI를 전제로 일을 다시 그린다."
2. "빨라진 것은 작성이다. 이제 흐름을 바꿀 차례다."
3. "병목은 사라지지 않는다. 옮겨갈 뿐이다. 그래서 프로세스를 설계한다."
4. "검증하는 일은 자동화해도, 책임은 자동화하지 않는다."
5. "사람은 작성자에서 의도와 판단의 설계자로."

**시각 메타포**
1. **낮은 가지에서 과수원으로** — 손 닿는 열매를 따던 화면이 줌아웃되며 나무 배치·관수로가 다시 그려진다.
2. **마차에 엔진 달기 vs 자동차 설계** — 같은 엔진, 다른 구조.
3. **한 차선만 넓힌 도로** — 다음 교차로(검증·review)에서 정체가 생기고, 이어 도로망 전체가 재배치된다.
4. **릴레이에서 오케스트라로** — 순차 handoff의 바통이 지휘자와 동시 연주로 전환된다.
5. **그래프 네트워크** — 한 노드만 빛나다가 엣지 전체에 펄스가 흐른다.

## 8. 확신이 낮거나 미확인인 항목

- McKinsey 2025·2026, BCG, Bain 수치: 원문 사이트 열람 실패, 검색 요약 기준[S].
- Micron 50%/60% 단축: 1차 출처 미확인.
- Cadence ChipStack 발표 일자(2026-02 첫 출시, 2026-05~06 Level-5 발표)와 Samsung Code Mate 게시일: 추정.
- Samsung "한 달 → 이틀", SK hynix KPI 연동: 국내 언론을 인용한 2차 보도, 방법론 미공개.
- Cadence·Synopsys·Siemens의 성능·자율 수준 주장: 독립 검증 없음.
- 반도체 설계에 cloud LLM을 쓸 때의 수출통제 지침: 찾지 못함.
- "AI-native 프로세스 재설계가 tape-out 성과를 개선했다"는 독립 실증: 찾지 못함.
- BPR 실패율, SoC 일정에서 검증·FW·qual이 차지하는 비중: 사전 지식[K].

## 9. 주요 출처

- DORA 2025: https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report
- Faros AI 2026: https://www.faros.ai/blog/ai-acceleration-whiplash-takeaways
- METR 2026-02: https://metr.org/blog/2026-02-24-uplift-update/
- McKinsey State of AI 2026: https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai
- Bain 2025: https://www.bain.com/insights/from-pilots-to-payoff-generative-ai-in-software-development-technology-report-2025/
- NBER w34836: https://www.nber.org/papers/w34836
- Gartner 2025-06: https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
- Synopsys AgentEngineer: https://www.synopsys.com/blogs/chip-design/agentengineer-technology-transforming-engineering-workflows.html
- Samsung Code Mate: https://semiconductor.samsung.com/news-events/tech-blog/faster-and-secure-how-code-mate-is-transforming-semiconductor-software-development/
- Samsung GTC 2026: https://semiconductor.samsung.com/news-events/tech-blog/samsung-showcases-agentic-ai-driven-semiconductor-engineering-innovation-at-nvidia-gtc-2026
- SK hynix GaiA: https://www.asiae.co.kr/en/article/2025081410122182087
- TrendForce 2026-08-13: https://www.trendforce.com/news/2026/08/13/news-ai-agents-enter-chipmaking-sk-hynix-tests-back-end-deployment-samsung-cuts-soc-verification-to-2-days/
- Solidigm: https://www.solidigm.com/products/technology/solidigm-ai-innovation-internal-excellence.html
- NVIDIA(Next Platform): https://www.nextplatform.com/hpc/2026/07/27/nvidia-accelerates-chip-engineering-with-ai-agents/5279125
- AMD: https://www.amd.com/en/blogs/2026/how-agentic-ai-is-reshaping-chip-design.html
- Siemens Fuse: https://news.siemens.com/en-us/siemens-fuse-eda-ai-agent/
- Cadence ChipStack: https://www.businesswire.com/news/home/20260531072918/en/Cadence-Announces-ChipStack-AI-Super-Agent
- SemiEngineering 2026-11-02: https://semiengineering.com/putting-ai-to-the-test/
- Siemens/Wilson 2026: https://blogs.sw.siemens.com/verificationhorizons/2026/09/08/the-2026-functional-verification-study/
- Anthropic 2026-01: https://www.anthropic.com/research/AI-assistance-coding-skills
