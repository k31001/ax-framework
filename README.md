# AX Framework

> AI Transformation 시대의 업무 운영 체계 — KPI · 성공률 관리 · 실시간 모니터링

AI가 단순 도구를 넘어 업무 수행의 주체가 되면서, 인간의 역할은 멀티 세션으로 실행되는 AI 업무에 빠르게 개입하고 피드백하는 **감독자**로 전환된다. 이 레포는 그 변화를 측정·운영·개선하기 위한 통합 프레임워크다.

## 핵심 명제

> **"AI가 할 수 있다"** 와 **"AI가 안정적으로 해낸다"** 는 다른 차원의 문제다.

```
AX 종합 지수 = Coverage × Success × (1 / Cost)
```

- **Coverage** — 얼마나 많은 일을 AI에게 맡길 수 있는가
- **Success** — 그 일들을 얼마나 잘 해내는가
- **Cost** — 그것을 얼마의 비용으로 해내는가

## 구성

- **`index.html`** — 프레임워크 전체를 설명하는 랜딩 페이지 + 모니터링 시스템 인터랙티브 목업
- **`docs/PLAN.md`** — 최종 통합 기획안 (마크다운 전문)
- **`styles.css` / `script.js`** — 페이지 스타일과 최소 인터랙션

## 라이브 데모

GitHub Pages 활성화 후 다음 주소에서 확인할 수 있다.

```
https://<your-username>.github.io/ax-framework/
```

## 로컬에서 열기

```bash
# 단순히 index.html을 브라우저로 열거나
open index.html

# 또는 간단한 정적 서버로 띄운다
python3 -m http.server 8000
# → http://localhost:8000
```

## GitHub Pages 활성화

1. 이 레포를 GitHub에 푸시 (아래 `DEPLOY.md` 참고)
2. 레포 → **Settings** → **Pages**
3. **Source**: `Deploy from a branch`
4. **Branch**: `main` / `/ (root)` 선택 → **Save**
5. 1~2분 후 위 URL로 접속 가능

## 라이선스

MIT
