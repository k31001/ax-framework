# 02. 검증(Verification) 도메인 AX 리서치 — SSD 컨트롤러 SoC

> 조사일 2026-11-10. 웹 접근 가능.
> 표기: **[W]** 이번에 웹에서 확인 · **[K]** 사전 지식(웹 미확인, 확신도 병기) · **[V]** 벤더·저자 자체 주장 수치(독립 검증 없음)
> 용어 주의: 이 문서의 coverage는 모두 검증의 functional/code coverage를 뜻한다. "AI가 수행하는 업무 비중"이라는 뜻으로 쓰지 않는다.
> 이 문서의 L1~L3은 사용자 논지의 3수준이다. 벤더가 쓰는 "L4/L5 autonomy"와는 다른 척도이고, 벤더는 그 정의를 공개 자료에서 밝히지 않았다 [W].

## 1. 결론 먼저

- 검증은 L2(에이전트가 tool을 돌리고 반복)가 2026년에 제품으로 나온 영역이다. 다만 대부분 early access·고객 평가 단계다. Synopsys와 Cadence는 "testplan → TB → regression → coverage closure → debug" 폐루프를, Siemens는 planning·debug 등 task 단위 agent를 발표했고 스타트업도 같은 방향이다 [W].
- 그러나 공개 수치는 거의 전부 벤더 주장이고 독립 benchmark가 없다. 유일하게 찾은 독립 실험에서는 에이전트가 **스스로 정한 목표를 100% 달성하고 sign-off를 선언했지만 심어둔 bug의 21~37%를 놓쳤다** [W].
- 따라서 L3의 핵심은 "더 강한 에이전트"가 아니라 **산출물과 역할의 재설계**다. spec이 원본이 되고, 사람은 test 작성자에서 검증 의도·독립 오라클·sign-off 기준의 소유자로 이동한다.
- 성숙도는 IP simulation/formal·regression triage > SoC 통합 > emulation·HW/SW co-verification 순이다. 뒤로 갈수록 제품보다 논문 단계다.

## 2. 왜 검증인가 (공통 수치)

- 2024 Wilson Research Group/Siemens EDA 조사: first-silicon success **14%**(20여 년 중 최저), 검증이 칩 프로젝트 엔지니어링 노력의 **60~70%** [W, Siemens 블로그 2025-09-03].
- 검증 엔지니어 시간 중 debug 비중 약 47% — 2차 출처(Sigasi, SemiWiki)로만 확인, 원 보고서 미확인.

## 3. 단계별 정리

### 3.1 IP 단위 시뮬레이션·formal 검증

| 항목 | 내용 |
|---|---|
| 구조적 병목 | ① spec → testplan → TB → assertion이 사람 손을 거치는 직렬 번역이라 spec이 바뀌면 각각 따로 고쳐야 하고 drift가 생긴다 [K 높음]. ② coverage closure의 last mile: 남은 bin은 random으로 잘 맞지 않고 unreachable 판별·exclusion 심사가 수작업이다 [W]. ③ regression triage: 실패 로그에서 signature 추출, owner 배정, duplicate 판별을 사람이 하고 관리자가 결과를 중계한다 [W, Samsung DVCon 2026]. ④ formal은 property 작성과 수렴이 전문가에게 의존한다 [K 높음]. ⑤ SSD 맥락: NVMe/PCIe 상태 공간, LDPC·암호화 datapath의 reference model 대비 bit-exact 비교, NAND interface timing 조합 [K 중간]. |
| L1 작업 보조 | 챗봇·Copilot으로 sequence·SVA 초안, 로그 요약, 스크립트 작성. tool 실행과 결과 해석은 사람이 한다. |
| L2 워크플로 에이전트 | 에이전트가 spec·RTL·기존 test를 읽고 testplan 초안 → TB 생성 → simulator 실행 → coverage hole 분석 → test 추가를 반복한다. 실패는 binning → 대표(witness) seed만 waveform dump로 재실행 → RCA → ticket. formal은 SVA 생성 후 proof 결과로 스스로 고친다. |
| L3 프로세스 재설계 | spec 하나에서 testplan·TB·assertion·coverage model이 **함께 파생·재생성**된다. regression은 야간 배치가 아니라 commit마다 영향 분석 → 선택 실행 → triage → 다음 계획으로 이어지는 **closed-loop 상시 검증**이 된다. |
| Before → After | 아침마다 빨간 regression 리포트를 사람이 한 줄씩 분류 → 밤새 도는 검증 루프가 원인 가설과 재현 seed가 붙은 티켓 몇 장만 남긴다. |

### 3.2 SoC 통합 검증

| 항목 | 내용 |
|---|---|
| 구조적 병목 | ① connectivity: 수천 개 연결을 스프레드시트·IP-XACT와 대조하고 늦은 변경에 취약하다 [K 높음]. ② low-power(UPF): power state 조합이 폭발하고 isolation/retention 누락은 느린 power-aware simulation에서야 드러난다 [K 높음]. ③ SoC simulation이 느려 hang/timeout의 원인 계층을 찾는 데 며칠이 걸린다 [W, Google 2026]. ④ 검증되지 않은 블록이 chip regression에 올라와 noise를 만든다. 33개 블록·2만여 test 중 약 14%가 central regression 전에 한 번도 실행되지 않았다 [W, Samsung DVCon 2026 슬라이드]. |
| L1 | UPF·연결 spec 리뷰 보조, 실패 로그 요약. |
| L2 | 에이전트가 연결 spec에서 formal connectivity check를 생성·실행하고, deadlock·X-propagation monitor를 SoC 계층에 자동 bind하며, RTL release note에서 영향받는 test를 골라 실행한다. |
| L3 | 연결·power intent·memory map을 machine-readable **integration spec**으로 관리하고 connectivity check, power-aware 시나리오, 시스템 시나리오를 여기서 파생한다. User → Block → Central **계층형 gating**: 블록 pass rate가 버전 관리되는 정책 임계값을 넘어야 칩 regression에 진입한다. |
| Before → After | 수천 줄 연결표를 눈으로 대조하고 칩 레벨에서 한꺼번에 터지는 실패 → 블록이 게이트를 하나씩 통과해 올라오고, 통합 spec에서 체크가 자동으로 펼쳐진다. |

### 3.3 Emulator / FPGA 활용

| 항목 | 내용 |
|---|---|
| 구조적 병목 | ① 고가 공유 자원이라 대기열이 생기고 compile·bring-up이 길다 [K 높음, 수치 미확인]. ② 가시성이 제한돼 긴 워크로드 끝의 실패를 waveform으로 잡으려면 다시 돌려야 한다 [K 높음]. ③ silicon에서 본 실패를 pre-silicon에서 재현하려면 stimulus를 수작업으로 튜닝해야 하고 "weeks or even months"가 걸린다 [W, Samsung DVCon 2026]. ④ SSD 맥락: precondition·garbage collection 같은 긴 워크로드, NAND model과 host 연결(speed adapter/virtual host) 준비 [K 중간]. |
| L1 | compile error·로그 요약, trigger 스크립트 작성 보조. |
| L2 | 에이전트가 실패 signature를 받아 trigger·probe 설정 → 재실행 → waveform 구간 추출 → 작은 simulation test로 축소 재현한다. |
| L3 | emulator를 **상시 가동 워크로드 팜**으로 운영한다. 변경 영향과 위험도로 큐를 배정하고, 모든 run의 telemetry를 data lake에 쌓으며, 실패는 자동으로 "최소 재현 케이스"가 되어 IP regression과 testplan에 편입된다(실패가 계획을 갱신하는 역방향 흐름). |
| Before → After | 에뮬레이터 앞에 줄 서서 몇 시간 뒤 실패를 보고 다시 줄 서기 → 24시간 도는 워크로드 팜에서 실패가 작은 재현 캡슐로 줄어 시뮬레이션으로 내려온다. |

성숙도: 3사의 agentic 발표는 simulation·formal 중심이다. Siemens가 Veloce 연동을 언급했지만 emulation 전용 에이전트의 기능과 결과는 확인하지 못했다. 근거는 논문과 debug tool 통합 수준이다 [W].

### 3.4 HW/SW co-verification

| 항목 | 내용 |
|---|---|
| 구조적 병목 | ① 실제 FW는 RTL이 안정된 뒤에야 HW 위에서 돌아 통합 bug가 늦게 나온다 [K 높음]. ② HW bug인지 FW bug인지 가리려고 두 팀의 trace를 사람이 맞춰 본다 [K 높음]. ③ virtual platform 모델 개발은 SystemC 등 희소 스킬이라 도입 장벽이 된다 [W, Vayavya DVCon 2026]. ④ 성능·전력은 실제 워크로드가 있어야 보이는데 그 시점이 늦다 [K 중간]. |
| L1 | FW log·trace 요약, register 접근 코드 초안. |
| L2 | 에이전트가 FW build → emulation/virtual platform 실행 → HW waveform과 FW trace 교차 분석으로 귀책 가설을 낸다. |
| L3 | register map·HW/SW interface·성능/전력 budget을 **HW/SW 공통 계약**으로 두고 virtual platform 모델, driver stub, co-simulation test를 함께 생성한다. RTL commit과 FW commit이 같은 파이프라인에서 매일 만나 "실제 FW로 boot + I/O"를 돌리고 성능·전력 리포트를 낸다. |
| Before → After | 실리콘이 도착한 뒤에야 만나는 HW와 FW → 첫 RTL commit부터 실제 FW가 매일 부팅된다. |

## 4. L3를 위해 바뀌어야 하는 산출물

| 산출물 | 지금 | L3 |
|---|---|---|
| Spec | PDF·Word, 사람이 해석 | 요구사항 ID가 달린 machine-readable 원본. 변경이 RTL·assertion·TB·문서로 전파 [W, SemiEngineering 2026-06-29] |
| Testplan | 문서·스프레드시트 | feature ↔ test ↔ coverage ↔ assertion ↔ bug가 연결된 live 데이터 |
| TB·assertion·coverage model | 손으로 쓴 코드 | spec에서 재생성되는 파생물 + 사람이 소유하는 독립 reference model |
| Regression | 야간 배치와 사람의 해석 | closed-loop 제어. gating 정책을 버전 관리해 결정을 재현 가능하게 [W, Samsung] |
| Bug report | 자유 서술 | signature, witness seed, waveform 구간, RCA, fix를 담은 구조화된 evidence bundle |
| Sign-off | coverage 숫자 | mutation·seeded-bug 결과, hold-back test, formal proof, 독립성 기록을 묶은 증거 패키지 |

## 5. 필요한 시스템·데이터 기반

- **Regression DB**: run·seed·config·commit·결과. 공식 기록용 relational과 근거·payload용 NoSQL의 hybrid 구조 사례가 있다 [W, Samsung].
- **Waveform/log data lake**: 전량 dump가 아니라 witness만 재실행해 선택적으로 저장 [W, ChipAgents 기고].
- **Failure signature·bug 지식베이스**: 의미 검색과 exact keyword(register 이름·값) 검색이 모두 필요하다 [W, Samsung Elasticsearch 논문].
- **Coverage DB와 spec traceability graph** [K 높음].
- **Tool 접근 계층**: simulator·formal·debug·emulator 큐를 에이전트가 호출하는 인터페이스. 벤더가 MCP 서버를 내놓고 있다 [W, Siemens].
- **Sandbox와 on-prem 모델 운용**: 에이전트가 RTL 전체를 읽으므로 IP 보안이 도입 조건이다 [W].
- **평가 인프라**: 사내 설계에 bug를 심은 benchmark와 에이전트가 본 적 없는 hold-back set.

## 6. 업계 근거 (2024~2026)

| 시점 | 주체 | 내용 | 출처 |
|---|---|---|---|
| 2024-10 | NVIDIA 연구진(소속은 K) | FVEval: LLM의 SVA 생성·formal 추론 능력 benchmark | https://arxiv.org/abs/2410.23299 |
| 2025-04 (ICCAD 2025) | 학계 | UVM²: LLM 기반 UVM TB 생성과 coverage 피드백. 평균 code coverage 87.44%, function coverage 89.58%, 설계 규모 최대 1.6K 줄 [V] | https://arxiv.org/abs/2504.19959 |
| 2025-09-03 | Synopsys | Synopsys.ai Copilot formal assertion generation(early access). 익명 고객 formal 생산성 35% 향상 [V] | https://news.synopsys.com/2025-09-03-Synopsys-Announces-Expanding-AI-Capabilities-for-its-Leading-EDA-Solutions |
| 2026-02-10 | Cadence | ChipStack AI Super Agent: spec에서 "mental model"을 만들고 testplan·TB·regression·debug 수행. 최대 10x [V]. Altera "일부 영역에서 약 10X"(검색 요약으로 확인) [V]. on-prem 배포 가능 | https://theregister.com/2026/02/10/cadences_agentic_chip_design_tool , https://futurumgroup.com/insights/can-cadence-shorten-chip-design-timelines-with-chipstack-ai/ |
| 2026-02-27 | Siemens | Questa One Agentic Toolkit: Verification Planning·Debug·Lint·CDC·RTL Code agent, MCP 인터페이스, early access. 정량 수치 없음 | https://news.siemens.com/ko-kr/questa-one-agentic-ai-toolkit/ |
| 2026-03-11 | Synopsys | AgentEngineer 기반 "L4" 설계·검증 workflow. 2x, 일부 5x [V] | https://news.synopsys.com/2026-03-11-Synopsys-Outlines-Vision-for-Engineering-the-Future |
| 2026-06-09 | Cadence | ChipStack "Level-5": RTL validation 40x 이상, 5주 → 1일 미만 [V] | https://www.eetasia.com/?p=74689 |
| 2026-07-26 (DAC) | Synopsys | long-running DV orchestrator agent: testplan → coverage closure → debug. 최대 50X, coverage +20% [V]. 고객 평가 중, 2026 하반기 예정 | https://news.synopsys.com/2026-07-26-Synopsys-Showcases-Comprehensive-Autonomous-Engineering-Workflows-from-Silicon-to-Systems,-Developed-with-NVIDIA-Technology |
| 2026-09-10 | Synopsys | 위 demo 상세: 285,000줄 SoC에서 code coverage +8%, functional +4% 이상 [V] | https://www.synopsys.com/blogs/chip-design/agentic-ai-drives-verification-closure-thermal-analysis.html |
| 2026-07-27 | Synopsys·Microsoft·AMD | debug closure workflow. 초기 평가에서 debug cycle 25~40% 단축 [V]. AMD는 평가 단계 | https://news.synopsys.com/2026-07-27-Synopsys-Advances-Agentic-AI-Chip-Design-with-AMD-and-Microsoft |
| 2026-07-29 | ChipAgents | Series A를 1.34억 달러로 확대, 120여 반도체사 배포 주장 [V] | https://unite.ai/chipagents-expands-series-a-to-134-million-as-ai-agents-move-deeper-into-semiconductor-design/ |
| 2026-10-29 | ChipAgents(기고) | binning → witness 재실행 → 자동 RCA → 전체 재검증 workflow. 수치 없음 | https://semiengineering.com/scaling-autonomous-root-cause-analysis-for-regression-triage/ |
| DVCon U.S. 2026 | Samsung Electronics | multi-agent regression triage. 통제된 150건 benchmark에서 owner 정확도 28.7%(legacy) → 76.7%, duplicate micro-F1 96.0% [V]. single-agent 대비 향상은 Bonferroni 보정 후 유의하지 않음 | https://dvcon-proceedings.org/wp-content/uploads/submission_53.pdf |
| DVCon U.S. 2026 | Samsung Electronics | 3-Tiered Agentic Regression Framework(User/Block/Central, gating, hybrid DB) | https://dvcon-proceedings.org/wp-content/uploads/54-A-3-Tiered-Agentic-AI-Framework-for-Verification-Regression.pdf |
| DVCon U.S. 2026 | Samsung Semiconductor India Research | AI-orchestrated emulation으로 silicon 실패 재현(Palladium). 반복 약 34 → 4회, waveform 16~18시간 → 20~22분 [V] | https://dvcon-proceedings.org/wp-content/uploads/submission_79.pdf |
| DVCon U.S. 2026 | Samsung Electronics | Elasticsearch hybrid search 기반 post-silicon debug agent. 정량 수치 없음 | https://dvcon-proceedings.org/wp-content/uploads/submission_69.pdf |
| 2026 | Google | LLM으로 deadlock·X-prop monitor를 생성해 SoC에 bind. SoC regression "hang" bucket 80% 감소 [V] | https://research.google/pubs/from-prompt-to-probe-left-shifting-soc-debug-with-generative-ai/ |
| 2026-09-21 | Microsoft(SNUG 2026) | ZeBu virtual host로 PCIe SR-IOV production SW stack을 tape-out 수개월 전에 bring-up. AI 미사용, shift-left baseline 사례 | https://www.synopsys.com/blogs/chip-design/pcie-sriov-validation-zebu-vhs.html |
| 2026-05-21 | Intel | NVMe Base Spec을 예로 든 spec mining: multimodal ingestion → knowledge graph → multi-agent rule 생성 | https://www.intel.com/content/www/us/en/security/security-practices/blogs/how-ai-automates-security-gap-detection.html |
| 2026-11-02 | Arm 소속 엔지니어의 독립 실험 | 25개 설계, 806개 seeded bug. 검출률 79.2% / 76.2% / 62.8%. 세 모델 모두 자체 목표 100% 달성 후 sign-off 선언. ECC memory·AXI DMA에서 누락이 많음 | https://semiengineering.com/putting-ai-to-the-test/ |

본문에서 인용한 그 밖의 출처:

- Wilson 조사 수치(2025-09-03): https://blogs.sw.siemens.com/verificationhorizons/2025/09/03/why-first-silicon-success-is-getting-harder-for-system-companies
- coverage "Last Mile" 문제(게시일 미확인): https://verificationacademy.com/topics/coverage/close-coverage-faster-with-questa-one-sim-unreachability-analysis/
- spec을 원본으로 삼는 검증 재설계 논의(2026-06-29): https://semiengineering.com/rethinking-chip-verification/
- agentic virtual platform 모델 생성, Vayavya Labs(DVCon 2026 발표 자료): https://dvcon-proceedings.org/wp-content/uploads/199-TvastaaVP-An-Agentic-AI-Approach-to-SystemC.pdf
- 3사 DAC 2026 발표 비교와 분석가 유보 의견(2026-07-29): https://futurumgroup.com/insights/synopsys-cadence-and-siemens-take-agentic-chip-design-autonomous-at-dac/

## 7. 리스크·한계

1. **의미 없는 coverage와 자기 채점**: 에이전트가 목표를 정하고 달성 여부도 판정하면 100%는 아무것도 보증하지 않는다(위 독립 실험). ECC memory에서 누락이 많았다는 점은 SSD 컨트롤러에 직접 해당한다 [W]. 검증에서 에이전트의 성공 여부를 재려면 에이전트의 자기 보고가 아니라 seeded-bug 검출률 같은 외부 오라클이 필요하다.
2. **잘못된·vacuous assertion**: 문법상 유효하지만 너무 느슨한 SVA는 "green proof"로 거짓 확신을 주고, 리뷰 부담이 초안 작성에서 아낀 시간을 넘을 수 있다 [W, Axiomise CEO 인용, 2026-08-27, https://semiengineering.com/from-spec-to-formal-properties/].
3. **TB 통과 판정의 신뢰성**: LLM 생성 RTL 중 TB를 통과한 후보의 14.5%가 기능적으로 틀렸다는 감사 결과가 있다 [W, NeurIPS 2026 workshop, https://neurips.cc/virtual/2026/161622].
4. **검증 독립성(common-mode 오류)**: 같은 모델이 같은 spec 해석으로 RTL과 TB를 만들면 같은 오해를 공유해 서로 통과시킨다. 이를 직접 측정한 연구는 찾지 못했다(미확인). 대응은 모델·프롬프트·정보의 분리, 사람이 소유한 reference model, formal equivalence, mutation testing이다 [K 중간].
5. **벤더 수치의 근거 부족**: 50X·40x·10x는 설계명·baseline·투입 시간이 없다. 같은 회사가 4개월 사이 2x에서 50X로 올린 근거도 설명되지 않았다 [W, https://www.unite.ai/synopsys-hands-chip-verification-to-autonomous-ai-agents/].
6. **비결정성**: 같은 모델도 실행마다 결과가 다르다 [W]. sign-off 증거는 결정론적 engine이 내야 한다는 주장이 있다 [W, 벤더 기고, 2026-02-13, https://semiengineering.com/formal-verification-first-how-ai-supports-but-cannot-replace-it/].
7. **책임**: "You can automate the work of verification. You cannot automate the responsibility for it." [W]
8. **자원 소모**: 에이전트가 emulator·license를 무제한 쓰지 않도록 예산 guardrail이 필요하다 [K 중간].

## 8. 영상용 Before → After 모음

1. IP 검증: 빨간 리포트를 한 줄씩 분류하는 사람 → 밤새 도는 루프가 남긴 티켓 몇 장.
2. SoC 통합: 눈으로 대조하는 연결표 → 게이트를 통과해 올라오는 블록.
3. Emulation/FPGA: 에뮬레이터 앞의 줄 → 24시간 워크로드 팜과 재현 캡슐.
4. HW/SW: 실리콘 이후의 첫 만남 → 첫 commit부터 매일 부팅.
5. (전체) 직렬로 이어진 spec → testplan → TB → debug → spec 하나에서 부채꼴로 펼쳐지는 파생물과 그 위를 도는 상시 루프.

## 9. 확신도·미확인 항목

- 미확인: debug 47% 원출처, emulator 대기·compile 시간의 정량 수치, SSD 컨트롤러 회사의 AI 검증 공개 사례(찾지 못함), UPF 대상 agentic 사례의 내용(DVCon Taiwan 2025 발표 제목만 확인), Bronco AI의 "RCA 15분·성공률 70%"(검색 요약으로만 확인), Synopsys DAC 발표일(보도자료 URL은 07-26, 분석 기사는 07-27), Samsung regression 논문 2편(submission 53·54)의 학회 연도(같은 저자·제출 번호 체계의 다른 논문이 DVCon U.S. 2026으로 등재된 데서 추정), Google 논문의 게재 학회.
- 검색 요약으로만 확인하고 원문을 열지 못한 것: ChipAgents 투자·고객 수, Synopsys·Microsoft·AMD 보도자료의 25~40%, Altera 인용.
- 확신 낮음: emulation·HW/SW 단계의 L2/L3 모습은 공개 제품이 아니라 논문과 논리적 확장에 근거한다.
- 3장의 병목 서술 중 [K]는 일반적인 업계 관행에 대한 사전 지식이며 이 팀의 실제 상황과 대조가 필요하다.
