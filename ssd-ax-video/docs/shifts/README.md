# 5대 전환 상세 영상

본편(`video/ssd-ax-strategy.mp4`)의 S6 "5대 전환"을 축마다 약 3분 영상으로 풀어 쓴다.

| # | 축 | 현재 → 전환 후 | 문서 | 대본 |
|---|---|---|---|---|
| 1 | 산출물 | 사람용 문서 → 실행 가능한 스펙 | `01-artifacts.md` | `src/shifts/shift1/script.json` |
| 2 | 프로세스 | 순차 handoff → 상시 루프 | `02-process.md` | `src/shifts/shift2/script.json` |
| 3 | 업무 방식 | 직접 작성 → 의도 정의 · 증거 기반 판단 | `03-way-of-working.md` | `src/shifts/shift3/script.json` |
| 4 | 시스템 | 개인별 챗봇 → 통합 AI 플랫폼 | `04-system.md` | `src/shifts/shift4/script.json` |
| 5 | 문화 | 개인 요령 → 측정 · 공유 · 학습 | `05-culture.md` | `src/shifts/shift5/script.json` |

## script.json 형식

영상은 나레이션이 시간을 정한다. 씬은 문장(line)들의 묶음이고, 화면 요소는 문장 id에 맞춰 나타난다.

```json
{
  "key": "shift1",
  "axis": "산출물",
  "from": "사람용 문서",
  "to": "실행 가능한 스펙",
  "scenes": [
    {
      "id": "s1",
      "name": "씬 이름",
      "visual": "제작자를 위한 화면 설명. 무엇이 어떤 순서로 보이는지.",
      "lines": [
        {
          "id": "s1.1",
          "text": "대본 표기 그대로의 문장.",
          "say": "음성 합성용 문장. 영문 약어와 숫자는 한글 발음으로 적는다.",
          "caption": "화면 자막 (명사형, 선택)"
        }
      ]
    }
  ]
}
```
