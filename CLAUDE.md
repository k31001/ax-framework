# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 이 레포의 모든 사용자용 문구는 한국어다. 본 CLAUDE.md도 한국어로 작성한다.

## 이 레포의 성격

**AX(AI Transformation) Framework** 의 랜딩 페이지 + 모니터링 시스템 인터랙티브 목업이다. 프레임워크의 한 줄 요약은 다음과 같다.

```
AX 종합 지수 = Coverage × Success × (1 / Cost)
```

사이트 자체는 **문서·개념 전달용 정적 페이지**이며, 백엔드·빌드 시스템·패키지 매니저·테스트 스위트가 **없다**. 프레임워크의 "본문"(KPI 정의, 성공률 측정 방법론, 모니터링 시스템 설계)은 `PLAN.md` 에 있다.

## 디렉토리 구조

레포 루트가 곧 GitHub Pages의 서빙 루트다. 사이트 자산은 모두 루트에 있다.

```
index.html      ← 랜딩 페이지 + 인터랙티브 목업
styles.css      ← 전체 스타일
script.js       ← 4개의 DOM 인터랙션 (아래 참조)
.nojekyll       ← Pages가 Jekyll 처리하지 않도록 함
README.md       ← 프로젝트 개요
DEPLOY.md       ← GitHub Pages 배포 절차
PLAN.md         ← 프레임워크 본문 (KPI / 성공률 / 모니터링 설계)
```

## 로컬 실행

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

install / build / lint / format / test 명령은 존재하지 않는다. `.html` / `.css` / `.js` 수정은 브라우저 새로고침으로 바로 반영된다.

## 배포

GitHub Pages가 이 레포의 `main` 브랜치 루트(`/`)를 서빙한다 (자세한 절차는 `DEPLOY.md`). `main` 에 푸시하면 1~2분 안에 재빌드된다. `index.html` 은 `styles.css` / `script.js` 를 **상대 경로**로 참조하므로 자산을 옮기거나 이름을 바꿀 때 링크도 같이 갱신한다. CI는 없다.

## 아키텍처 / 핵심 개념

카피를 일관되게 편집하려면 아래 개념과 용어를 보존해야 한다.

- **3-축 AX 지수**: `Coverage × Success × (1 / Cost)`
  - **Coverage** — AI가 수행하는 업무 비중
  - **Success** — 그 작업들의 품질·성공률
  - **Cost** — 단위 작업당 운영 비용
  - 세 단어는 `index.html` 과 `PLAN.md` 전반에 고정 용어로 등장한다. 함부로 번역하거나 동의어로 치환하지 말 것.
- **계층적 성공률**: Project → Process → Atomic. 단계가 곱해질수록 누적 성공률이 급락(예: 0.9⁵ ≈ 0.59)하므로 측정의 무게중심은 **프로세스 단위**다.
- **작업 유형별 성공 정의** (4분류): 결정론적(자동 검증) / 생성형(인간 평가·LLM-as-Judge) / 의사결정(정답 대비 정확도) / 에이전트(최종 목표 + 중간 단계 통과율). 성공 루브릭 섹션을 편집할 때는 이 4분할을 유지한다.
- **DDEL 개선 루프**: 진단(Diagnose) → 개선안 도출(Design) → 실험(Experiment) → 적용·학습(Deploy & Learn). 순서와 명칭을 그대로 유지한다.
- **그래프 네트워크 모니터링 메타포**: 노드=프로세스 단계, 엣지=흐름. 노드 색상은 성공률(녹/황/적), 노드 크기는 토큰 사용량, 펄스 애니메이션은 활성 작업. `index.html` 의 SVG 그래프와 `script.js` 의 호버·스크롤 동작이 이 메타포를 구현한다.

## `script.js` 동작 요약

DOM 기반 인터랙션 4가지가 전부다.

1. `.graph-svg .node` 호버 시 `scale(1.08)` 확대.
2. `IntersectionObserver` 가 `.section` / `.app-mockup` 에 `.in-view` 클래스 부여(스크롤 리빌).
3. `scrollY < 800` 구간에서 `.hero-metrics` 에 `translateY` 패럴랙스.
4. `.env-pill` 의 "live sessions" 숫자를 3.5초마다 `847 ± random` 으로 갱신(가짜 라이브 카운터).

HTML에서 위 셀렉터를 변경하면 `script.js` 도 같이 수정한다.
