"""나레이션 길이에 맞춰 화면 시점과 씬 길이를 다시 잡는다.

    python3 audio/retime.py

입력: audio/narration_durations.json (audio/narration.py 가 만든다)
출력:
  - src/video/content.ts 의 등장 시점(at 등)을 고쳐 쓴다
  - src/video/timeline.ts 의 씬 길이를 고쳐 쓴다
  - src/video/narration.ts 에 문장별 시작 시점을 쓴다 (Main 이 음성을 이 시점에 놓는다)

규칙: 각 문장은 정해진 화면 항목(anchor)이 나타난 직후(LEAD 초)에 시작한다. 앞 문장이 아직 끝나지 않았으면
그 항목과 그 뒤의 모든 항목을 같은 만큼 늦춘다. 화면 시점의 기준값(BASE)은 이 파일에 있으므로 여러 번 돌려도 같다.
"""

import json
import math
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "src", "video", "content.ts")
TIMELINE = os.path.join(ROOT, "src", "video", "timeline.ts")
NARR_TS = os.path.join(ROOT, "src", "video", "narration.ts")
DUR_JSON = os.path.join(ROOT, "audio", "narration_durations.json")

LEAD = 0.15  # 항목이 나타나고 목소리가 시작될 때까지
GAP = 0.35  # 문장 사이 최소 쉼
TAIL = 1.2  # 마지막 문장 뒤 여유

# 씬별 기준 길이(초)와 기준 시점. (이름, 기준 시점, 붙는 문장 번호 또는 None, content.ts 를 고칠 정규식)
# 정규식은 그 씬의 블록 안에서 첫 번째로 맞는 곳의 숫자 하나를 바꾼다.
def cap(text):
    return r'at: ([\d.]+), text: "' + re.escape(text) + '"'


def field(name):
    return r"\b" + name + r": ([\d.]+)"


def obj_at(name):
    return r"\b" + name + r": \{\s*at: ([\d.]+)"


BASE = {
    "S1": (8, [
        ("c1", 0.3, 1, cap("AI 활용, 이미 일상")),
        ("c2", 2.6, 2, cap("코드 초안 · 로그 요약 · 스크립트")),
        ("c3", 5.2, 3, cap("쉬운 열매는 수확 완료")),
    ]),
    "S2": (12, [
        ("c1", 0.3, 1, cap("개인 속도 향상, 과제 일정은 제자리")),
        ("c2", 4.2, 2, cap("작성 가속 → 병목 이동")),
        ("stat", 8.0, 3, obj_at("stat")),
    ]),
    "S3": (10, [
        ("lead", 0.3, 1, obj_at("lead")),
        ("headline", 2.2, 2, obj_at("headline")),
        ("ladder", 5.2, 3, obj_at("ladder")),
    ]),
    "S4": (10, [
        ("title", 0.3, 1, obj_at("title")),
        ("setting", 1.2, None, obj_at("setting")),
        ("card", 3.0, 2, field("cardAt")),
        ("recovery", 6.0, 3, obj_at("recovery")),
    ]),
    "S7": (9, [
        ("headline", 0.4, 1, obj_at("headline")),
        ("stat", 3.6, 2, obj_at("stat")),
    ]),
}

# 사례 7단계. 항목 문구로 찾는다. (문구, 기준 시점, 문장 번호)
STAGES = {
    "S5-1": (11, 9.4, None, None, [
        ("문서 수작업 대조, 충돌은 뒤늦게 발견", 0.8, 1),
        ("조항 단위 추출 · 충돌 위험 탐지", 3.4, 2),
        ("우선순위 결정 · 수용 기준 확정", 6.6, 3),
    ]),
    "S5-2": (17, 15.4, None, None, [
        ("소수 후보, 회의로 결정", 0.8, None),
        ("보정된 성능 모델로 수백 구성 탐색", 3.2, 1),
        ("선택: 오류 복구 제어를 FW에서 HW로", 6.2, 2),
        ("구조 검증: GC 중 P99.99 초과", 9.2, 3),
        ("host read 우선 큐 추가 · RTL 작성 전 발견", 12.2, 4),
    ]),
    "S5-3": (12, 10.6, (9.6, 4), None, [
        ("register는 SystemRDL, 동작 규약은 API 문서", 0.8, None),
        ("동작 규약을 실행 가능한 계약으로 정의", 2.8, 1),
        ("계약 기반 RTL 생성 · commit마다 PPA 추정", 4.8, 2),
        ("ECC 블록 면적 초과", 6.8, 3),
        ("축소안 · 구조 모델로 지연 재확인", 8.6, None),
    ]),
    "S5-4": (18, 16.6, (15.0, 6), None, [
        ("실패 수백 건, 원인 분석은 수작업", 0.8, None),
        ("통과 기준 정의 · reference model 소유", 2.8, 1),
        ("testplan · testbench 생성", 4.6, None),
        ("야간 regression 실패 312건", 6.4, 2),
        ("원인 4개로 분류", 8.4, 3),
        ("원인 가설: FSM의 완료 신호 누락", 10.2, 4),
        ("가설 확인 · 수정 승인", 12.2, 5),
        ("assertion 추가 · 전체 regression 재확인", 14.0, None),
    ]),
    "S5-5": (16, 14.6, None, None, [
        ("RTL과 FW의 첫 통합은 FPGA · emulator 준비 이후", 0.8, None),
        ("가상 플랫폼에서 선행 통합, 이후 매일 RTL + FW 구동", 3.0, 1),
        ("장시간 부하 중 command timeout", 5.6, 2),
        ("파형 · FW trace 교차 분석", 7.6, 3),
        ("원인 가설: interrupt 1건 유실", 9.4, None),
        ("HW · FW 공동 결정: 완료 전달을 큐 방식으로", 11.4, 4),
        ("interface 계약 개정", 13.4, None),
    ]),
    "S5-6": (10, 8.8, None, None, [
        ("API 문서 해석 후 driver 수작업 구현", 0.8, None),
        ("불변식 정의: 정정 실패 데이터 반환 금지", 2.6, 1),
        ("가상 플랫폼 · 보드에서 빌드 · 실행 · 수정 반복", 4.6, 2),
        ("실제 NAND로 read retry table 승인", 6.8, 3),
    ]),
    "S5-7": (20, 15.6, (15.0, None), (17.0, 7), [
        ("로그 수동 분석, 막바지 증빙 취합", 0.8, None),
        ("고온 방치 후 특정 NAND lot, 지연 기준 초과", 2.8, 1),
        ("신규 불량 후보 제시 · 수정안 비교", 5.0, 2),
        ("처분 결정 · 재시험 범위 승인", 7.2, 3),
        ("시험 시간은 그대로, 단축은 원인 분석과 취합", 9.4, 4),
        ("퀄 패키지 조립", 12.0, 5),
        ("판정 · 서명", 13.6, 6),
    ]),
}

ORDER = ["S1", "S2", "S3", "S4", "S5-1", "S5-2", "S5-3", "S5-4", "S5-5", "S5-6", "S5-7", "S6", "S7", "S8", "S9"]


def r2(x):
    return round(x + 1e-9, 2)


def ceil_half(x):
    return math.ceil(x * 2 - 1e-9) / 2


def place(events, durs, scene):
    """events: [(key, base, line|None)] → ({key: new}, [(line, start)], shift, last_end)"""
    shift, prev_end = 0.0, -GAP
    new, starts = {}, []
    for key, base, line in sorted(events, key=lambda e: e[1]):
        t = base + shift
        if line is not None:
            need = prev_end + GAP - LEAD
            if t < need:
                shift += need - t
                t = need
            start = t + LEAD
            starts.append((line, start))
            prev_end = start + durs[f"{scene}_{line}"]
        new[key] = t
    return new, starts, shift, prev_end


def main():
    durs = json.load(open(DUR_JSON))
    content = open(CONTENT).read()
    scene_len, narration = {}, []

    def block(name_start, name_end=None):
        s = content.index(name_start)
        e = content.index(name_end, s + 1) if name_end else len(content)
        return s, e

    def patch(span, pattern, value):
        nonlocal content
        s, e = span
        m = re.search(pattern, content[s:e])
        if not m:
            raise SystemExit(f"pattern not found: {pattern}")
        a, b = s + m.start(1), s + m.end(1)
        content = content[:a] + f"{r2(value):g}" + content[b:]

    def export_span(name):
        nxt = re.search(r"\nexport const ", content[content.index(f"export const {name} ") + 1:])
        s = content.index(f"export const {name} ")
        e = s + 1 + nxt.start() if nxt else len(content)
        return s, e

    # ── 일반 씬 ──
    for scene, (base_len, items) in BASE.items():
        new, starts, shift, last = place([(k, b, l) for k, b, l, _ in items], durs, scene)
        for k, b, l, pat in items:
            patch(export_span(scene), pat, new[k])
        scene_len[scene] = max(base_len + shift, last + TAIL)
        narration += [(scene, l, s) for l, s in starts]

    # ── 사례 7단계 ──
    for scene, (base_len, record, principle, closing, beats) in STAGES.items():
        events = [(text, at, line) for text, at, line in beats]
        events.append(("__record", record, None))
        if principle:
            events.append(("__principle", principle[0], principle[1]))
        if closing:
            events.append(("__closing", closing[0], closing[1]))
        new, starts, shift, last = place(events, durs, scene)
        s = content.index(f'id: "{scene}"')
        nxt = content.find('\n  {\n    id: "S5-', s + 1)
        e = nxt if nxt != -1 else content.index("export const LANES")
        for text, at, line in beats:
            patch((s, e), cap(text), new[text])
        patch((s, e), field("recordAt"), new["__record"])
        if principle:
            patch((s, e), obj_at("principle"), new["__principle"])
        if closing:
            patch((s, e), obj_at("closing"), new["__closing"])
        scene_len[scene] = max(base_len + shift, last + TAIL, new["__record"] + 1.0)
        narration += [(scene, l, st) for l, st in starts]

    # ── S6: 제목과 다섯 줄. 줄 간격은 하나로 고정돼 있다 ──
    d = lambda n: durs[f"S6_{n}"]
    t1 = 0.3
    rows_at = max(1.6, t1 + LEAD + d(1) + GAP - LEAD)
    row_step = max(2.1, (sum(d(n) for n in range(2, 7)) + 4 * GAP) / 5)
    narration.append(("S6", 1, t1 + LEAD))
    prev_end = t1 + LEAD + d(1)
    for i in range(5):
        start = max(rows_at + i * row_step + LEAD, prev_end + GAP)
        narration.append(("S6", i + 2, start))
        prev_end = start + d(i + 2)
    span = export_span("S6")
    patch(span, field("rowsAt"), rows_at)
    patch(span, field("rowStep"), row_step)
    scene_len["S6"] = max(14, rows_at + 4 * row_step + 4.0, prev_end + 2.0)

    # ── S8: 제목, 세 단계를 한 문장으로, 마무리 ──
    d = lambda n: durs[f"S8_{n}"]
    narration.append(("S8", 1, 0.3 + LEAD))
    steps_at = max(1.2, 0.3 + LEAD + d(1) + GAP - LEAD)
    step_gap = max(1.8, d(2) / 3)
    narration.append(("S8", 2, steps_at + LEAD))
    reference = steps_at + 4.4 * step_gap / 1.8
    closing = max(reference + 1.6, steps_at + LEAD + d(2) + GAP - LEAD)
    narration.append(("S8", 3, closing + LEAD))
    span = export_span("S8")
    patch(span, field("stepsAt"), steps_at)
    patch(span, field("stepGap"), step_gap)
    patch(span, obj_at("reference"), reference)
    patch(span, obj_at("closing"), closing)
    scene_len["S8"] = max(10, closing + LEAD + d(3) + TAIL)

    # ── S9: 역할 네 줄, 전환 문구, 핵심 문구, 엔드 카드 ──
    d = lambda n: durs[f"S9_{n}"]
    roles_at = 0.4
    role_gap = max(0.8, d(1) / 4)
    narration.append(("S9", 1, roles_at + LEAD))
    shift_at = max(roles_at + 3 * role_gap + 2.5, roles_at + LEAD + d(1) + GAP - LEAD)
    narration.append(("S9", 2, shift_at + LEAD))
    headline = max(shift_at + 1.3, shift_at + LEAD + d(2) + GAP - LEAD)
    narration.append(("S9", 3, headline + LEAD))
    end_card = max(headline + 1.8, headline + LEAD + d(3) + GAP - LEAD)
    narration.append(("S9", 4, end_card + LEAD))
    span = export_span("S9")
    patch(span, field("roleGap"), role_gap)
    patch(span, obj_at("shift"), shift_at)
    patch(span, obj_at("headline"), headline)
    patch(span, obj_at("endCard"), end_card)
    scene_len["S9"] = max(10, end_card + LEAD + d(4) + 2.5)

    open(CONTENT, "w").write(content)

    # ── 씬 길이 ──
    tl = open(TIMELINE).read()
    for scene in ORDER:
        sec = ceil_half(scene_len[scene])
        scene_len[scene] = sec
        tl, n = re.subn(r'(\{ id: "' + re.escape(scene) + r'", name: "[^"]*", seconds: )[\d.]+', r"\g<1>" + f"{sec:g}", tl)
        if n != 1:
            raise SystemExit(f"timeline: {scene}")
    tl = re.sub(r"export const TOTAL_SECONDS = .*", "export const TOTAL_SECONDS = SCENES.reduce((sum, s) => sum + s.seconds, 0);", tl)
    tl = re.sub(r"export const TOTAL_FRAMES = .*", "export const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * FPS);", tl)
    tl = tl.replace("return scene.seconds * FPS;", "return Math.round(scene.seconds * FPS);")
    tl = tl.replace("frames += scene.seconds * FPS;", "frames += Math.round(scene.seconds * FPS);")
    open(TIMELINE, "w").write(tl)

    # ── 나레이션 시점 ──
    rows = "\n".join(
        f'  {{ scene: "{s}", file: "audio/narration/{s}_{l}.mp3", at: {r2(t):g}, duration: {durs[f"{s}_{l}"]:g} }},'
        for s, l, t in sorted(narration, key=lambda x: (ORDER.index(x[0]), x[2]))
    )
    open(NARR_TS, "w").write(
        "// audio/retime.py 가 만든다. 직접 고치지 않는다.\n"
        "// at: 씬 시작 후 몇 초에 목소리가 시작되는가. duration: 음성 길이(초).\n"
        'import type { SceneId } from "./timeline";\n\n'
        "export type NarrationLine = { scene: SceneId; file: string; at: number; duration: number };\n\n"
        f"export const NARRATION: NarrationLine[] = [\n{rows}\n];\n"
    )

    total = sum(scene_len.values())
    t = 0.0
    for scene in ORDER:
        print(f"{scene:5s} {t:6.1f}  {scene_len[scene]:5.1f}s")
        t += scene_len[scene]
    print(f"total {total:.1f}s ({int(total // 60)}:{total % 60:04.1f})")


if __name__ == "__main__":
    main()
