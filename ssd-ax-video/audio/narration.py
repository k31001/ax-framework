"""나레이션 음성 합성.

docs/04-narration.md 의 대본을 문장 단위로 ElevenLabs(Sola 음성)로 합성해
public/audio/narration/<씬>_<번호>.mp3 로 저장하고, 길이를 audio/narration_durations.json 에 적는다.

    python3 audio/narration.py            # 없는 파일만 만든다
    python3 audio/narration.py --force    # 전부 다시 만든다
    python3 audio/narration.py S5-4       # 한 씬만 다시 만든다

API 키는 이 스크립트가 다루지 않는다. 실행 환경의 프록시가 api.elevenlabs.io 요청에 키를 넣어 준다.
다른 환경에서는 ELEVENLABS_API_KEY 환경 변수를 두면 그 값을 xi-api-key 헤더로 보낸다.

각 줄의 `say` 는 음성으로 읽힐 문장이다. 영문 약어와 숫자는 발음을 고정하려고 한글로 적었다.
`show` 는 대본 문서에 실리는 표기다(없으면 say 와 같다).
"""

import json
import os
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "audio", "narration")
DUR_JSON = os.path.join(ROOT, "audio", "narration_durations.json")

VOICE_ID = "KlstlYt9VVf3zgie2Oht"  # Sola - Warm, Clear and Rich (한국어, ElevenLabs 음성 라이브러리)
MODEL_ID = "eleven_multilingual_v2"
VOICE_SETTINGS = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True}

# (씬, 읽을 문장). 순서가 곧 번호다.
LINES = {
    "S1": [
        "우리는 이미 AI를 쓰고 있습니다.",
        "코드 초안, 로그 요약, 스크립트.",
        "손 닿는 열매는 꽤 땄습니다.",
    ],
    "S2": [
        "개인은 빨라졌어도, 과제 일정은 그대로입니다.",
        "작성이 빨라지면, 병목은 검증과 통합으로 옮겨갈 뿐입니다.",
        "칩 개발 공수의 육십에서 칠십 퍼센트가 검증입니다.",
    ],
    "S3": [
        "AI 도입을 넘어서,",
        "AI를 중심으로, 일을 다시 설계해야 합니다.",
        "작업 보조에서 워크플로 에이전트로, 그리고 프로세스 재설계로.",
    ],
    "S4": [
        "요구사항 하나를 따라가 보겠습니다.",
        "수명 말기 낸드에서도, 리드 지연을 지키는 것.",
        "복구 단계가 깊어질수록, 지연은 길어집니다.",
    ],
    "S4J": [
        "이 요구사항은, 지라의 이슈입니다.",
        "요구사항에서 설계 기능, 검증 항목, 버그까지, 링크로 이어집니다.",
        "사람도 에이전트도, 여기서 현황을 읽고,",
        "업무 지시와 새 요구사항도, 여기에 남깁니다.",
    ],
    "S5-1": [
        "지금은 문서를 사람이 대조해서, 충돌을 늦게 발견합니다.",
        "에이전트가 조항을 추출해, 충돌 위험을 먼저 찾고,",
        "사람은 우선순위와 수용 기준을 정합니다.",
    ],
    "S5-2": [
        "에이전트가 보정된 모델로 수백 개 구성을 탐색하고,",
        "사람이, 오류 복구를 하드웨어로 옮기는 안을 고릅니다.",
        "그런데 구조 검증에서, 가비지 컬렉션 중에 지연 기준을 넘는 문제가 드러납니다.",
        "호스트 리드 우선 큐를 더해 해결합니다. RTL을 쓰기도 전에요.",
    ],
    "S5-3": [
        "API 문서로 남던 동작 규약을, 실행 가능한 계약으로 정의합니다.",
        "에이전트는 그 계약에서 RTL을 생성하고,",
        "면적이 예산을 넘으면, 축소안을 구조 모델로 다시 확인합니다.",
        "스펙이 원본이 됩니다.",
    ],
    "S5-4": [
        "통과 기준은 사람이, 테스트벤치는 에이전트가 만듭니다.",
        "밤사이 실패가 삼백십이 건.",
        "에이전트가 원인을 넷으로 묶고,",
        "완료 신호 누락이라는 가설을, 지라 버그로 올립니다.",
        "사람이 승인하면, 어서션을 더해 다시 검증합니다.",
        "루프를 닫으면, 같은 모델의 디버깅 통과율이 사십사에서 구십사 퍼센트로 오릅니다.",
    ],
    "S5-5": [
        "장비가 준비되기 전에는 가상 플랫폼에서 먼저 통합하고, 이후엔 매일 함께 돌립니다.",
        "장시간 부하에서 멈춤이 생기자,",
        "에이전트가 파형과 트레이스를 겹쳐 보고, 인터럽트 한 건의 유실을 찾습니다.",
        "하드웨어와 펌웨어 담당이 함께, 완료 전달을 큐 방식으로 바꿉니다.",
    ],
    "S5-6": [
        "정정에 실패한 데이터는 내보내지 않는다. 이런 불변식은 사람이 정의하고,",
        "에이전트는 가상 플랫폼과 보드에서, 빌드와 수정을 반복합니다.",
        "리드 리트라이 테이블은, 실제 낸드로 사람이 승인합니다.",
    ],
    "S5-7": [
        "고온 방치 후, 특정 랏에서 지연 기준을 넘었습니다.",
        "에이전트가 신규 불량 후보와 수정안을 내고,",
        "처분과 재시험 범위는 사람이 정합니다.",
        "시험 시간은 줄지 않습니다. 줄어드는 건, 원인 분석과 증빙 취합입니다.",
        "퀄 패키지는 에이전트가 조립하고,",
        "판정과 서명은 사람이 합니다.",
        "필드 데이터는, 지라의 새 요구사항으로 돌아옵니다.",
    ],
    "S6": [
        "정리하면, 다섯 가지가 바뀝니다.",
        "문서는, 실행 가능한 스펙으로.",
        "순차 핸드오프는, 상시 루프로.",
        "직접 작성에서, 의도 정의와 증거 기반 판단으로.",
        "개인 챗봇은, 통합 플랫폼으로.",
        "개인의 요령은, 팀의 학습으로.",
    ],
    "S7": [
        "작업은 자동화해도, 책임은 사람에게 있습니다.",
        "한 실험에서 AI는 검증 완료를 선언했지만, 심어 둔 버그의 이십일 퍼센트를 놓쳤습니다.",
    ],
    "S8": [
        "순서는 세 단계입니다.",
        "기반을 깔고, 병목부터 에이전트에게 맡기고, 프로세스를 다시 그립니다.",
        "얻은 성과는, 다음 단계에 재투자합니다.",
    ],
    "S9": [
        "설계, 검증, 펌웨어, 테스트와 퀄.",
        "모두, 작성하는 사람에서 설계하는 사람으로 바뀝니다.",
        "AI 중심 재설계.",
        "우리 팀의 다음 단계입니다.",
    ],
}


def file_for(scene: str, i: int) -> str:
    return os.path.join(OUT_DIR, f"{scene}_{i + 1}.mp3")


def normalize(path: str) -> None:
    """목소리 음량을 -16 LUFS 로 맞춘다(배경음악은 -18 LUFS 에서 목소리 구간에 낮춘다)."""
    tmp = path + ".tmp.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
         "-ar", "44100", "-b:a", "128k", tmp],
        check=True,
    )
    os.replace(tmp, path)


def duration(path: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def synth(text: str, prev: str, nxt: str, path: str) -> None:
    body = {"text": text, "model_id": MODEL_ID, "voice_settings": VOICE_SETTINGS, "language_code": "ko"}
    if prev:
        body["previous_text"] = prev
    if nxt:
        body["next_text"] = nxt
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128"
    headers = {"Content-Type": "application/json"}
    if os.environ.get("ELEVENLABS_API_KEY"):
        headers["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=90) as res:
                data = res.read()
            with open(path, "wb") as fh:
                fh.write(data)
            return
        except Exception as exc:  # 네트워크 오류는 잠깐 쉬고 다시
            if attempt == 3:
                raise
            print(f"  retry ({exc})")
            time.sleep(2 ** (attempt + 1))


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)
    durations = {}
    if os.path.exists(DUR_JSON):
        with open(DUR_JSON) as fh:
            durations = json.load(fh)
    for scene, lines in LINES.items():
        for i, text in enumerate(lines):
            path = file_for(scene, i)
            redo = force or (args and scene in args) or not os.path.exists(path)
            if redo:
                prev = lines[i - 1] if i > 0 else ""
                nxt = lines[i + 1] if i + 1 < len(lines) else ""
                print(f"{scene}_{i + 1}: {text}")
                synth(text, prev, nxt, path)
                normalize(path)
            durations[f"{scene}_{i + 1}"] = round(duration(path), 3)
    # 대본에서 지운 줄의 길이는 남기지 않는다
    keep = {f"{s}_{i + 1}" for s, ls in LINES.items() for i in range(len(ls))}
    durations = {k: v for k, v in durations.items() if k in keep}
    with open(DUR_JSON, "w") as fh:
        json.dump(durations, fh, ensure_ascii=False, indent=2)
    total = sum(durations.values())
    chars = sum(len(t) for ls in LINES.values() for t in ls)
    print(f"{len(durations)} lines, {total:.1f} s of speech, {chars} chars")


if __name__ == "__main__":
    main()
