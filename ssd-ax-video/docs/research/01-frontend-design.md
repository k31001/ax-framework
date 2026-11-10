# 01. 프런트엔드 설계 도메인 리서치 (요구사항 → 아키텍처 → IP 설계·조합 → PPA)

조사일 2026-11-10. 웹 접근은 가능했다. 범위는 SSD 컨트롤러 SoC의 프런트엔드 설계이며 검증·FW·조직 전략은 다루지 않는다.

**표기 규칙**
- **[W]** 이번 조사에서 원문 또는 기사 본문을 읽고 확인
- **[S]** 검색 결과 요약만 확인 (본문 미확인)
- **[P]** 사전 지식 (웹 미확인)
- 수치는 별도 언급이 없으면 전부 **벤더·저자 주장**이다. 독립 검증된 수치는 찾지 못했다.
- 각 단계의 **L3 서술은 근거에서 끌어낸 제안**이다. 업계에서 이미 실현된 모습이 아니다.

## 0. 논지에 직접 쓰이는 발견

1. EDA 3사는 2026년에 워크플로 에이전트(L2)를 발표하고 평가·early access 단계까지 올렸다 (Synopsys GA는 2026년 말 예정) [E3][E4][E6][E9]. 그런데 이 에이전트들은 모두 **spec·design intent를 입력으로 전제**한다 [E5][E7]. 스펙이 Word/PDF·엑셀·메일에 흩어진 팀은 툴을 사도 L1에 머문다 (이 문장은 추론이다).
2. 같은 LLM도 단독 호출과 "생성–테스트–반성" 루프의 차이가 크다. CVDP 디버깅 항목에서 한 모델이 44.0% → 94.3% (NVIDIA 자체 평가 [E13]). 차이를 만드는 것은 모델이 아니라 **툴 접근, 피드백 루프, 맥락 데이터**다.
3. 요구사항·아키텍처 단계는 상용 에이전트가 가장 얕은 구간이다. Synopsys AgentEngineer 7종에 architecture 전용은 없고 [E4], Siemens는 architectural exploration 지원을 언급하지만 구체 내용과 수치가 없다 [E9]. 요구사항 그래프를 다루는 EDA 벤더 에이전트는 찾지 못했다. 이 구간은 팀이 직접 재설계해야 한다.
4. 업계도 병목을 스펙으로 지목한다. "The new bottleneck is clarity of specification" (Synopsys Frank Schirrmeister [E18]).
5. 벤더의 자율성 등급(L1~L5)은 "툴이 얼마나 혼자 하는가"의 축이다. 본 전략의 L3는 "산출물·순서·역할을 바꿨는가"의 축이다. 둘은 다르다.

## 1. 요구사항 취합·분석

- **구조적 병목**: 고객 요구서, 표준(NVMe·PCIe·ONFI/Toggle·TCG), 내부 로드맵이 서로 다른 문서와 주기로 바뀐다 [P]. 요구사항 간 의존은 문서 전체에 걸친 다단계 논리 사슬이어서 [E15], 개인이 챗봇으로 조항 하나를 요약해도 충돌·누락은 잡히지 않는다. 추적성은 엑셀 수작업이라 스펙이 바뀌는 순간 낡는다. ASIC 기능 결함의 약 45%가 스펙 오류·불완전, 약 30%가 스펙 변경에서 나온다는 조사가 있다 (Wilson Research 2024, 벤더 페이지의 2차 인용 [E19]).
- **L1**: 표준 조항 Q&A, 개정판 요약, 요구사항 문장 정리.
- **L2**: 에이전트가 표준 개정판과 고객 요구서를 조항 단위로 추출하고, 기존 요구사항과 대조해 충돌·누락 후보와 영향 블록을 보고한다. Intel의 스펙 공백 탐지 파이프라인이 가까운 실례다 [E17].
- **L3**: 요구사항이 문서가 아니라 **그래프**(요구사항–조항–블록–레지스터–테스트)로 존재한다. 변경은 이벤트가 되어 영향 범위가 계산되고 하류 에이전트에 작업이 발행된다. 사람은 작성자에서 의도·우선순위 결정자와 충돌 중재자로 바뀐다.
- **바뀌는 산출물·기반**: requirement graph, 조항별 실행 가능한 수용 기준, 표·상태머신 그림까지 읽는 파서와 knowledge graph [E15][E17], 고객·표준 문서별 접근 통제.
- **근거**: [E15][E16][E17][E18]
- **리스크**: 조항 오독·환각과 비결정적 출력 때문에 전문가 검증이 필수다 [E17]. 표준 문서와 고객 요구서를 외부 모델에 넣는 문제(라이선스·NDA) [P]. 요구사항과 구현을 자동으로 잇는 기능은 현재 툴에 없다 [E18].
- **Before → After**: 수천 쪽 PDF와 엑셀 추적표를 사람이 눈으로 대조한다 → 요구사항 한 줄을 고치면 그래프에서 영향받는 블록·레지스터·테스트 노드가 연쇄로 점등된다.

## 2. 아키텍처·구조 설계

- **구조적 병목**: 성능·전력 모델을 만들고 보정하는 비용이 커서 검토 후보가 소수에 그친다 [P]. HW/FW partitioning(예: ECC·FTL 가속 경계)은 초기에 정해진 뒤 다시 평가되지 않는다 [P]. 판단 근거인 과거 과제의 실측 PPA는 개인 기억과 흩어진 리포트에 있다 [P].
- **L1**: 아키텍처 문서 초안, 모델 코드 조각, 과거 문서 검색.
- **L2**: 에이전트가 시뮬레이터를 직접 돌려 파라미터를 탐색하고 Pareto 리포트를 낸다 [E21][E22]. 데이터시트에서 SystemC 모델을 생성한다 [E23].
- **L3**: 아키텍처 스펙이 "문서와 그림"에서 **실행 가능한 모델과 결정 기록**으로 바뀌고 요구사항 그래프에 연결된다. HW/FW 경계는 한 번의 회의 결정이 아니라 워크로드가 바뀔 때마다 재평가된다. 아키텍트는 후보를 그리는 사람에서 목적함수·제약을 정하고 Pareto 위에서 고르는 사람이 된다.
- **바뀌는 산출물·기반**: 보정된 성능·전력 모델, 호스트 워크로드 trace 라이브러리, 과거 과제 PPA DB, RTL 이전 단계의 PPA 추정 [E10][E25].
- **근거**: [E9][E10][E21][E22][E23]
- **리스크**: 학술 근거는 CPU microarchitecture와 DNN accelerator 대상이다. SSD 컨트롤러의 HW/FW partitioning에 적용한 공개 사례는 **미확인**. 모델 충실도가 낮으면 탐색 결과는 그럴듯한 오답이 된다.
- **Before → After**: 화이트보드의 블록도 3안 중 하나를 회의로 고른다 → 수백 개 후보가 성능–전력–면적 Pareto 곡선 위 점으로 찍히고 사람은 한 점을 고른다.

## 3. IP 설계와 조합

- **구조적 병목**: 스펙, RTL, register map, FW 헤더, 문서가 각각 사람 손으로 유지되어 서로 어긋난다. IP 설정 지식은 담당자에게 있고, SoC integration(connectivity, CDC/RDC, lint)은 후반에 몰려 대량의 위반을 사람이 분류한다 [P]. 코파일럿으로 모듈 하나를 빨리 써도 통합 대기열은 줄지 않는다.
- **L1**: 모듈·SVA·스크립트 초안, lint 메시지 해설 [E2].
- **L2**: 에이전트가 생성 → lint/sim/formal → 수정을 반복한다. spec-to-RTL [E3][E7][E14], register spec에서 RTL·헤더·UVM 동시 생성 [E19], 위반 묶음과 waiver 제안.
- **L3**: **스펙이 원본이고 RTL은 재생성 가능한 파생물이다.** 요구사항이 바뀌면 추적 링크를 따라 영향받는 RTL만 다시 생성한다 [E16][E7]. 순서가 "RTL 작성 후 검증"에서 "수용 기준과 인터페이스 계약 먼저, 그다음 생성"으로 뒤집힌다. 엔지니어는 RTL 작성자에서 스펙·계약 설계자 겸 승인자가 된다.
- **바뀌는 산출물·기반**: 구조화된 design intent (Cadence가 "mental model"이라 부르는 것 [E5]), IP-XACT/SystemRDL 기반 IP 카탈로그 [E18][E20], 에이전트가 호출하는 EDA 툴 API와 격리 실행 환경 [E6][E9], waiver·리뷰 이력 DB.
- **근거**: [E2][E3][E4][E5][E6][E7][E12][E13][E14]
- **리스크**: LLM이 생성한 SystemVerilog의 약 60%가 CWE에 취약했다 [R1]. 기능 테스트를 통과해도 보안 의도를 어길 수 있어 TCG 관련 로직에 특히 위험하다 [R2]. Cadence의 area·power 개선치는 사람이 쓴 RTL이 아니라 foundation model 생성 코드 대비다 [E7]. 생성량이 늘면 검증 부담이 하류로 넘어간다.
- **Before → After**: 엔지니어가 스펙 PDF 옆에 에디터를 띄우고 RTL을 타이핑한다 → 스펙 그래프 하나에서 RTL·레지스터 헤더·SVA가 동시에 출력되고 사람은 승인 도장을 찍는다.

## 4. PPA 최적화

- **구조적 병목**: synthesis/P&R 레시피를 숙련자가 블록마다 반복 조정한다. RTL·floorplan 품질 문제가 backend에서 늦게 드러나, congestion 해결에 반복당 최대 1주가 걸렸다는 사례가 있다 (Kioxia [E10]). 블록 수만큼 사람이 필요하다.
- **L1**: 리포트 요약, Tcl 스크립트 생성.
- **L2**: 강화학습 기반 파라미터 탐색(DSO.ai, Cerebrus)과 implementation 에이전트가 QoR closure를 자동 반복한다 [E3][E8][E26]. LLM 에이전트가 flow 파라미터를 직접 조정한다 [E24].
- **L3**: PPA가 "후공정 결과"에서 **RTL commit마다 돌아오는 피드백 신호**로 바뀐다. 조기 PPA 추정이 아키텍처·RTL 단계로 되돌아가고, 과제 간 학습이 쌓인다. 한 엔지니어가 여러 블록을 감독하고 [E8], 사람은 레시피 장인에서 목표·제약 설정자와 예외 해결자가 된다.
- **바뀌는 산출물·기반**: 과거 run의 설정·결과·로그 DB, compute·라이선스 예산 관리, RTL 단계 PPA 예측 모델 [E10][E25].
- **근거**: [E3][E4][E8][E10][E11][E24][E26][E27]
- **리스크**: 탐색 compute 비용이 는다. Kioxia는 DSO.ai가 PPA는 개선했지만 자원 비용이 늘었다고 보고했다 [E10]. 벤더 수치는 baseline이 공개되지 않았다 [E4]. 최종 sign-off 주체는 벤더 자료에도 명시되지 않았다 [E4]. 플랫폼 lock-in [E4].
- **Before → After**: 엔지니어 한 명이 블록 하나의 레시피를 몇 주 동안 돌린다 → 한 명이 대시보드에서 수십 블록의 탐색을 감독하고 PPA 곡선이 RTL commit마다 갱신된다.

## 5. L3로 가기 위한 공통 기반 (4개 단계 종합, 제안)

- **하나의 그래프**: 요구사항 → 아키텍처 결정 → 블록·레지스터 → RTL → PPA 결과가 한 그래프의 노드와 엣지로 이어진다. 네 단계의 Before → After가 모두 이 그래프 위에서 그려진다.
- **에이전트가 부를 수 있는 툴 계층**: simulator, lint/CDC, synthesis를 API로 호출하고 격리된 환경에서 실행한다 [E6][E9].
- **과거 과제의 자산화**: run 설정·결과, waiver 판단, 아키텍처 결정 기록이 검색·학습 가능한 데이터로 남는다.
- **사내 배치와 접근 통제**: 고객·표준·IP 문서별 권한, audit trail, 필요 시 air-gapped 운용 [E9].

## 6. 공통 리스크·한계

- **수치 신뢰도**: 인용한 생산성·PPA 수치는 벤더 발표이며 대상 설계, 공정, 기준선이 없다. 애널리스트도 "pre-GA 제품의 벤더 보고 수치"라고 지적한다 [E4].
- **자율성 등급 비교 불가**: Synopsys는 L2 단일 에이전트 step, L3 멀티 에이전트, L4 동적 flow 최적화, L5 자율 의사결정으로 정의한다 [E1]. Cadence는 자체 척도로 "Level 5"를 선언했다 [E6]. Cadence 임원이 이를 "bounded Level 5 in one domain"이라 했다는 보도가 있다 [E28].
- **Sign-off 책임**: Synopsys는 사람 checkpoint 수준을 조절할 수 있다고만 한다 [E4]. NVIDIA는 prompt 하나로 GPU를 end-to-end 설계하는 것은 "distant goal"이라고 했다 [E11].
- **IP 보안**: Siemens는 범용 에이전트 플랫폼의 접근 통제 미비와 외부 노출을 리스크로 명시하고 RBAC, audit trail, air-gapped 운용을 내세운다 [E9]. open-weight 모델의 사내 배치도 선택지다 [E5][E24].
- **데이터 부족**: 사내 설계 데이터는 양이 적고 흩어져 있다 [P]. 현실 문제에 가까운 CVDP에서 초기 모델 단독 pass@1은 34% 이하였다 [E12].
- **근본 한계 논의**: ICCAD'25 초청 논문은 reliability, scalability, interpretability를 쟁점으로 든다 [R3].

## 7. 근거 목록

| ID | 시점 | 내용 | 출처 | 확인 |
|---|---|---|---|---|
| E1 | 2025-05-06 | Synopsys AgentEngineer L1~L5 정의 (2025-03 SNUG 공개) | https://www.synopsys.com/blogs/chip-design/agentengineer-technology-transforming-engineering-workflows.html | W |
| E2 | 2025-09-03 | Synopsys.ai Copilot: RTL·formal assertion 생성, "days to hours", 익명 고객 formal 생산성 35% | https://news.synopsys.com/2025-09-03-Synopsys-Announces-Expanding-AI-Capabilities-for-its-Leading-EDA-Solutions | S |
| E3 | 2026-07-27 | Synopsys·Microsoft·AMD: 자율 debug·implementation closure. debug cycle 25~40% 단축, implementation은 수치 없음. spec-to-RTL workflow는 기발표 | https://news.synopsys.com/2026-07-27-Synopsys-Advances-Agentic-AI-Chip-Design-with-AMD-and-Microsoft | W |
| E4 | 2026-09-28 | Synopsys Autopilot Platform과 AgentEngineer 7종, GA 2026년 말 예정, "50+ customer engagements", RTL 생성 생산성 10~30% (고객 1곳). Futurum: lock-in, 미검증 지적 | https://www.synopsys.com/blogs/chip-design/long-horizon-agentengineer-solutions.html , https://futurumgroup.com/insights/synopsys-autopilot-aims-to-consolidate-chip-design-around-one-stack/ | W |
| E5 | 2026-02-10 | Cadence ChipStack AI Super Agent: 스펙·설계 파일로 "mental model" 구축, 최대 10x 생산성, NVIDIA·Qualcomm·Altera 시험 | https://theregister.com/2026/02/10/cadences_agentic_chip_design_tool | W |
| E6 | 2026-06-02 | Cadence "Level 5" 선언: RTL validation 40x, 5주 loop를 1일 미만으로. NVIDIA OpenShell sandbox, early access 2026 하반기 | https://www.electronicspecifier.com/?p=206457 | W |
| E7 | 2026-09-23 | Cadence RTL Generation Agent: spec-to-RTL과 RTL upgrade flow. foundation model 생성 코드 대비 area 평균 24%, power 18% 감소. Honda R&D 평가 | https://www.eetasia.com/cadence-strengthens-chipstack-ai-with-rtl-generation-agent/ | W |
| E8 | 2025-05-20 | Cadence Cerebrus AI Studio: agentic multi-block SoC implementation. 최대 5X TTM, 초기 고객 PPA 8~11%, 생산성 4X | https://www.electronicsforu.com/news/first-agentic-ai-multi-block-soc-platform | W |
| E9 | 2026-03-16 | Siemens Fuse EDA AI Agent: architectural exploration, design planning, RTL coding. RBAC·audit·air-gapped. 성능 수치 없음. Samsung·NVIDIA 인용 | https://news.siemens.com/en-us/siemens-fuse-eda-ai-agent/ | W |
| E10 | 2026-04-10 | Kioxia (SNUG Japan 2025): RTL Architect feasibility 실행 시간 80% 단축, 주당 floorplan 10안. AI Fusion leakage 최대 10% 감소. DSO.ai는 자원 비용 증가. SSD 컨트롤러인지는 명시 없음 | https://www.synopsys.com/blogs/chip-design/kioxia-innovates-soc-design-eda-ai-technologies.html | W |
| E11 | 2026-05-08 | NVIDIA Bill Dally (GTC 2026): NVCell(standard cell layout)로 8명 약 10개월 작업을 하룻밤으로. end-to-end 설계는 "distant goal" | https://www.deeplearning.ai/the-batch/chipmakers-models-design-circuits-verify-designs-and-test-new-layouts | W |
| E12 | 2025-06-17 | CVDP benchmark (NVIDIA): 783문제 13분류, 최고 모델 pass@1 34% 이하 | https://arxiv.org/abs/2506.14074 | W |
| E13 | 2026-07-26 | NVIDIA: ACE-RTL 에이전트와 Nemotron 3 Ultra로 CVDP 9분류 평균 97.1%. 디버깅 단독 44.0~68.6% → 에이전트 94.3~100%. E12와 조건이 달라 직접 비교 불가 | https://developer.nvidia.com/blog/nvidia-nemotron-3-ultra-leads-open-models-on-accuracy-and-efficiency-in-agentic-rtl-coding/ | W |
| E14 | 2025-06-16 | Spec2RTL-Agent: 비정형 스펙 문서에서 RTL. 사람 개입 최대 75% 감소 (스펙 3건) | https://arxiv.org/abs/2506.13905 | W |
| E15 | 2025-12-05 | ChipMind (AAAI-26): 스펙을 knowledge graph로 바꿔 다단계 추론. 평균 34.59% 개선 | https://arxiv.org/abs/2512.05371 | W |
| E16 | 2026-03-26 | IncreRTL: 요구사항–코드 추적 링크로 영향 부분만 재생성. 초록에 수치 없음 | https://arxiv.org/abs/2603.25769 | W |
| E17 | 2026-05-21 | Intel: knowledge graph와 멀티 에이전트로 스펙의 보안 공백 탐지. 1,000쪽 이상 처리, 초기 식별 "days → hours". 정확도 수치 없음 | https://www.intel.com/content/www/us/en/security/security-practices/blogs/how-ai-automates-security-gap-detection.html | W |
| E18 | 2026-06-29 | SemiEngineering: specification engineering 부상. SystemRDL·IP-XACT는 register 중심에 머묾. 툴 체인 미연결 | https://semiengineering.com/rethinking-chip-verification/ | W |
| E19 | 날짜 없음 | Agnisys IDS-AI: golden spec을 source of truth로 RTL·UVM·헤더·IP-XACT 생성. Wilson Research 2024 수치 인용 | https://www.agnisys.com/products/ids-ai/ | W (인용 원문은 미확인) |
| E20 | 2025-03 | Arteris Magillem Registers: IP-XACT·SystemRDL 기반 HW/SW 인터페이스 단일 원본. 생성형 AI 기능 발표는 못 찾음 | https://www.arteris.com/products/platform/magillem/ | S |
| E21 | 2026-04-28 | Agentic Architect: LLM 코드 진화와 cycle-accurate simulation. branch predictor가 TAGE-SC-L IPC의 97.62%를 면적 10.58%로 | https://arxiv.org/abs/2604.25083 | W |
| E22 | 2025-10 / 2026 | gem5 Co-Pilot, AgentDSE: simulator-in-the-loop DSE 에이전트 | https://arxiv.org/abs/2510.19577 , https://neurips.cc/virtual/2026/161598 | S |
| E23 | 2026-03 | DS2SC-Agent: 데이터시트에서 SystemC 모델 생성 | https://arxiv.org/abs/2603.21190 | S |
| E24 | 2025-06-10 (v3 2026-04-30) | ORFS-agent: LLM이 OpenROAD flow 파라미터 조정. OR-AutoTuner 대비 최대 1.0~2.7% 개선, 반복 40% 감소. open-weight 모델도 근접 | https://arxiv.org/abs/2506.08332 | W |
| E25 | 2023-11 (TCAD 2025-01) | MasterRTL: synthesis 이전 PPA 추정 | https://arxiv.org/abs/2311.08441 | S |
| E26 | 2024-03 | Synopsys.ai·DSO.ai: 수백 건 tape-out, PPA 10% 이상 | https://www.eejournal.com/industry_news/synopsys-announces-new-ai-driven-eda-ip-and-systems-design-solutions-at-snug-silicon-valley | S |
| E27 | 2024-09-26 | Google AlphaChip: TPU 3세대 layout, MediaTek 채택 | https://deepmind.google/blog/how-alphachip-transformed-computer-chip-design/ | S |
| E28 | 2026 | Tom's Hardware: 3사 agentic 현황 정리, "bounded Level 5" 발언, 벤더 간 등급 비교 불가 | https://www.tomshardware.com/tech-industry/semiconductors/the-state-of-agentic-ai-in-chip-design-tools-in-2026-cadence-synopsys-and-siemens-all-pitch-autonomous-engineers | S |
| R1 | 2024-03-25 | 생성 SystemVerilog 6만 건 중 약 60%가 CWE 취약 | https://arxiv.org/abs/2403.16750 | W |
| R2 | 2026 | HardSecBench (IJCAI 2026): 기능 통과 코드의 보안 결함 | https://www.ijcai.org/proceedings/2026/0057.pdf | S |
| R3 | 2025-09-05 | "Revolution or Hype?" (ICCAD'25 invited) | https://arxiv.org/abs/2509.04905 | W (초록만) |

## 8. 확신이 낮거나 미확인인 항목

- SSD 컨트롤러 SoC에 agentic 설계를 적용한 공개 사례: **미확인**. 가장 가까운 것은 E10이며 대상 SoC의 용도는 명시되지 않았다.
- NVMe·ONFI/Toggle·TCG 표준을 LLM으로 요구사항화한 동료 평가 논문: **미확인** (PCIe 대상 DVCon 논문과 학부 프로젝트만 검색됨).
- HW/FW partitioning을 에이전트로 자동화한 산업 사례: **미확인**.
- CDC/RDC·lint waiver를 LLM 에이전트로 분류한 2025~2026 벤더 발표: **미확인** (2023년 ML 기반 root-cause clustering 자료만 검색됨).
- Synopsys spec-to-RTL workflow의 최초 발표 시점과 수치: **미확인** (E3이 "기발표"라고만 언급).
- E19의 스펙 기인 결함 비율은 벤더 페이지의 2차 인용이다. 원 조사 보고서는 확인하지 않았다.
- [S] 표기 항목의 수치와 [P] 표기 서술은 영상에 쓰기 전에 원문 확인이 필요하다.
- 각 단계의 "구조적 병목" 서술은 대부분 [P]다 (확신도 중상). 팀 실제 상황과의 대조가 필요하다.
