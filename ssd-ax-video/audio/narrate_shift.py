"""5대 전환 상세 영상의 나레이션 합성.

    python3 audio/narrate_shift.py shift1            # 없는 문장만 만든다
    python3 audio/narrate_shift.py shift1 --force    # 전부 다시
    python3 audio/narrate_shift.py shift1 s3.2 s4.1  # 지정한 문장만 다시

src/shifts/<key>/script.json 의 문장(say)을 ElevenLabs(Sola 음성)로 합성해
public/audio/shifts/<key>/<문장 id>.mp3 로 저장하고, 길이를 src/shifts/<key>/durations.json 에 적는다.
영상의 시간은 이 길이로 정해진다(src/shifts/lib/timing.ts).
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import narration as base  # synth, normalize, duration 을 같이 쓴다

ROOT = base.ROOT


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        raise SystemExit(__doc__)
    key, only = args[0], set(args[1:])
    force = "--force" in sys.argv
    src = os.path.join(ROOT, "src", "shifts", key)
    out = os.path.join(ROOT, "public", "audio", "shifts", key)
    os.makedirs(out, exist_ok=True)
    script = json.load(open(os.path.join(src, "script.json")))
    durations, chars = {}, 0
    for scene in script["scenes"]:
        lines = scene["lines"]
        for i, line in enumerate(lines):
            path = os.path.join(out, f"{line['id']}.mp3")
            chars += len(line["say"])
            if force or line["id"] in only or not os.path.exists(path):
                prev = lines[i - 1]["say"] if i > 0 else ""
                nxt = lines[i + 1]["say"] if i + 1 < len(lines) else ""
                print(f"{line['id']}: {line['say']}")
                base.synth(line["say"], prev, nxt, path)
                base.normalize(path)
            durations[line["id"]] = round(base.duration(path), 3)
    with open(os.path.join(src, "durations.json"), "w") as fh:
        json.dump(durations, fh, ensure_ascii=False, indent=2)
    print(f"{key}: {len(durations)} lines, {sum(durations.values()):.1f} s of speech, {chars} chars")


if __name__ == "__main__":
    main()
