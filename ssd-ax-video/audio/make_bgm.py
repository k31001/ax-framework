#!/usr/bin/env python3
"""SSD AX 영상 배경음악 합성기.

    python3 audio/make_bgm.py            # 합성 → loudnorm → mp3 → 확인 수치 출력
    python3 audio/make_bgm.py --table    # 화음 진행·사용 음 표와 불협 점검만 출력 (합성 안 함)
    python3 audio/make_bgm.py --layers   # 합성하면서 층별·구간별 RMS 표도 출력 (편성 조정용)

만드는 파일
    out/audio/bgm_mix.wav       합성 원본 (24bit, 48kHz, 스테레오)
    out/audio/bgm_master.wav    loudnorm 적용본
    out/audio/spec.png          최종 mp3의 스펙트로그램 (spec_log.png 은 로그 주파수 축)
    public/audio/bgm.mp3        최종 (192kbps)

numpy와 표준 라이브러리만 쓴다. 인코딩·음량 맞춤·측정은 ffmpeg/ffprobe를 부른다.

곡의 뼈대
    - D장조, 120 BPM 격자(박 0.5초). 화음은 대체로 4초에 하나라 체감은 느리다.
    - 구간 경계는 src/video/timeline.ts 의 SCENES 와 같다. 길이를 바꾸면 아래
      SECTIONS / PROG / 표시 시각을 같이 고친다.
    - 음색은 전부 사인파를 더해 만든다(배음 수를 제한해 필터를 대신한다).
      모든 음에 attack/release 가 있어 클릭이 나지 않는다.
"""

from __future__ import annotations

import json
import math
import os
import re
import subprocess
import sys
import wave

import numpy as np

# --------------------------------------------------------------------------
# 1. 시간표
# --------------------------------------------------------------------------

SR = 48000
TOTAL = 187.0
N = int(round(TOTAL * SR))
BEAT = 0.5  # 120 BPM
SEED = 20261110

TARGET_LUFS = -18.0
TARGET_TP = -1.5

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "out", "audio")
PUB_DIR = os.path.join(ROOT, "public", "audio")
MIX_WAV = os.path.join(OUT_DIR, "bgm_mix.wav")
MASTER_WAV = os.path.join(OUT_DIR, "bgm_master.wav")
SPEC_PNG = os.path.join(OUT_DIR, "spec.png")
SPEC_LOG_PNG = os.path.join(OUT_DIR, "spec_log.png")
MP3 = os.path.join(PUB_DIR, "bgm.mp3")

SECTIONS = [
    ("S1", 0, 8), ("S2", 8, 20), ("S3", 20, 30), ("S4", 30, 40),
    ("S5-1", 40, 51), ("S5-2", 51, 68), ("S5-3", 68, 80), ("S5-4", 80, 98),
    ("S5-5", 98, 114), ("S5-6", 114, 124), ("S5-7", 124, 144),
    ("S6", 144, 158), ("S7", 158, 167), ("S8", 167, 177), ("S9", 177, 187),
]

HIT = 22.2      # S3 "AI 중심 재설계"
FINAL = 183.6   # S9 마지막 핵심 문구 → 으뜸화음
FADE_OUT = 185.0

# 사례 구간의 (문제, 해결) 시각과, 해결 순간에 울리는 밝은 음.
# 해결음은 A5 → B5 → D6 → E6 → F#6 으로 사례가 진행될수록 한 계단씩 올라간다.
PROBLEMS = [
    (60.2, 63.2, 81),
    (74.8, 76.6, 83),
    (86.4, 94.0, 86),
    (103.6, 111.4, 88),
    (126.8, 137.6, 90),
]

# --------------------------------------------------------------------------
# 2. 화성
# --------------------------------------------------------------------------
# MIDI 번호 (69 = A4 = 440Hz). 전부 D장조 음계 안의 음이다.
#   bass : 낮은 음 하나
#   pad  : 가운데 음역의 지속음
#   arp  : 짧은 음으로 훑는 네 음 (낮은 음 → 높은 음)
#   hi   : 밝은 구간에서만 얹는 윗 pad

CHORDS = {
    "Dadd9": dict(bass=38, pad=[50, 57, 64, 66], arp=[62, 69, 76, 78], hi=[74, 78, 81]),
    "D69": dict(bass=38, pad=[50, 57, 64, 66, 71], arp=[62, 69, 76, 78], hi=[74, 78, 83]),
    "Gmaj7": dict(bass=43, pad=[55, 59, 62, 66], arp=[69, 71, 74, 78], hi=[74, 78, 83]),
    "Gmaj9": dict(bass=43, pad=[55, 59, 62, 66, 69], arp=[69, 71, 74, 78], hi=[74, 78, 83]),
    "Bm7": dict(bass=35, pad=[47, 57, 62, 66], arp=[69, 71, 74, 78], hi=[74, 78, 81]),
    "Em7": dict(bass=40, pad=[52, 59, 62, 67], arp=[64, 67, 71, 74], hi=[74, 79, 83]),
    "F#m7": dict(bass=42, pad=[54, 57, 61, 64], arp=[66, 69, 73, 76], hi=[73, 76, 81]),
    "Asus": dict(bass=45, pad=[52, 57, 62, 64, 71], arp=[64, 69, 71, 74], hi=[74, 76, 81]),
    "Aadd9": dict(bass=45, pad=[52, 57, 61, 64, 71], arp=[64, 69, 73, 76], hi=[73, 76, 81]),
}

# (시작 초, 화음, bass 음을 바꿀 때만 MIDI 번호)
# "문제" 시각에는 bass가 단3도 아래로 내려가 관계단조로 바뀌고(D→Bm, G→Em, A→F#m),
# "해결" 시각에는 떠났던 화음으로 돌아온다.
PROG = [
    # S1 Hook — 조용한 시작
    (0.0, "Dadd9"), (4.0, "Gmaj7"),
    # S2 문제 — 단조 쪽으로 살짝 어두워짐
    (8.0, "Bm7"), (12.0, "Gmaj7"), (16.0, "Em7"),
    # S3 전환 선언 — 20초 걸림화음에서 숨을 고르고 22.2초에 으뜸화음으로 열림
    (20.0, "Asus"), (HIT, "Dadd9"), (26.0, "Gmaj9"),
    # S4 사례 소개 — 가라앉음
    (30.0, "Bm7"), (34.0, "Em7"), (38.0, "Asus"),
    # S5-1 요구사항 분석
    (40.0, "Dadd9"), (44.0, "Gmaj7"), (48.0, "Dadd9", 42),
    # S5-2 아키텍처 설계 (문제 60.2 → 해결 63.2)
    (51.0, "Gmaj7"), (55.0, "Dadd9"), (60.2, "Bm7"), (63.2, "Dadd9"), (66.0, "Asus"),
    # S5-3 IP 설계 · PPA (문제 74.8 → 해결 76.6)
    (68.0, "Bm7"), (72.0, "Gmaj7"), (74.8, "Em7"), (76.6, "Gmaj7"),
    # S5-4 시뮬레이션 검증 (문제 86.4 → 해결 94.0)
    (80.0, "Dadd9"), (84.0, "Gmaj7"), (86.4, "Em7"), (90.0, "F#m7"), (94.0, "Gmaj9"),
    # S5-5 Emulation · FPGA (문제 103.6 → 해결 111.4)
    (98.0, "Aadd9"), (103.6, "F#m7"), (107.5, "Bm7"), (111.4, "Aadd9"),
    # S5-6 FW 개발
    (114.0, "Dadd9"), (118.0, "Gmaj7"), (122.0, "Aadd9"),
    # S5-7 제품 테스트 · 퀄 (문제 126.8 → 해결 137.6)
    (124.0, "Dadd9"), (126.8, "Bm7"), (130.5, "Em7"), (134.0, "Asus"),
    (137.6, "Dadd9"), (140.0, "Gmaj9"), (142.0, "Aadd9"),
    # S6 5대 전환 — 가장 밝고 풍성함
    (144.0, "D69"), (148.0, "Gmaj9"), (152.0, "D69", 42), (155.0, "Aadd9"),
    # S7 책임 — pad만
    (158.0, "Bm7"), (162.5, "Gmaj7"),
    # S8 로드맵 — bass가 한 계단씩 올라감 (D → E → F#)
    (167.0, "Dadd9"), (170.5, "Em7"), (174.0, "F#m7"),
    # S9 Closing — G → A 걸림화음 → 183.6초에 으뜸화음
    (177.0, "Gmaj9"), (181.0, "Asus"), (FINAL, "Dadd9"),
]

PROBLEM_TIMES = {p[0] for p in PROBLEMS}
RESOLVE_TIMES = {p[1] for p in PROBLEMS}

# 사례 모티프: A4 D5 E5 → F#5. 앞의 세 음은 0.5초 간격으로 올라가고
# 마지막 음이 구간 경계(또는 핵심 문구 시각)에 떨어진다.
M_UP = (69, 74, 76, 78)      # A  D  E  F#
M_OPEN = (69, 74, 78, 76)    # A  D  F# E   (열린 채로 끝남)
M_FROM_A = (69, 73, 76, 78)  # A  C# E  F#  (A 화음 위에서 D를 피함)
M_TO_A = (69, 71, 74, 76)    # A  B  D  E   (A 화음에 도착)


def chord_span(i: int) -> tuple[float, float]:
    t0 = PROG[i][0]
    t1 = PROG[i + 1][0] if i + 1 < len(PROG) else TOTAL
    return t0, t1


def chord_index_at(t: float) -> int:
    idx = 0
    for i, row in enumerate(PROG):
        if row[0] <= t + 1e-6:
            idx = i
    return idx


def bass_of(row) -> int:
    return row[2] if len(row) > 2 else CHORDS[row[1]]["bass"]


def hz(midi: float) -> float:
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def note_name(midi: int) -> str:
    return f"{NOTE_NAMES[midi % 12]}{midi // 12 - 1}"


# --------------------------------------------------------------------------
# 3. 공통 도구
# --------------------------------------------------------------------------

_T = None


def time_axis() -> np.ndarray:
    global _T
    if _T is None:
        _T = np.arange(N, dtype=np.float64) / SR
    return _T


def rcos_up(n: int) -> np.ndarray:
    return 0.5 - 0.5 * np.cos(np.pi * np.arange(n) / max(n, 1))


def rcos_down(n: int) -> np.ndarray:
    return 0.5 + 0.5 * np.cos(np.pi * (np.arange(n) + 1) / max(n, 1))


def box_smooth(y: np.ndarray, seconds: float) -> np.ndarray:
    w = max(1, int(seconds * SR)) | 1
    pad = w // 2
    yp = np.concatenate([np.full(pad, y[0]), y, np.full(pad, y[-1])])
    c = np.concatenate([[0.0], np.cumsum(yp, dtype=np.float64)])
    return (c[w:] - c[:-w]) / w


def curve(points, smooth: float = 0.12) -> np.ndarray:
    """(초, 값) 꺾은선을 표본 단위 곡선으로. 모서리는 조금 둥글린다."""
    ts = [p[0] for p in points]
    vs = [p[1] for p in points]
    y = np.interp(time_axis(), ts, vs)
    if smooth > 0:
        y = box_smooth(y, smooth)
    return y.astype(np.float32)


def tension_curve() -> np.ndarray:
    """문제~해결 사이에서 1, 그 밖에서 0. 문제 시각부터 0.3초에 걸쳐 올라간다."""
    y = np.zeros(N)
    for a, b, _ in PROBLEMS:
        y[int((a + 0.15) * SR):int((b + 0.15) * SR)] = 1.0
    return box_smooth(y, 0.3).astype(np.float32)


class Bus:
    """스테레오 한 층."""

    def __init__(self):
        self.x = np.zeros((N, 2), dtype=np.float32)

    def add(self, t0: float, sig: np.ndarray, pan: float = 0.0, gain: float = 1.0):
        i0 = int(round(t0 * SR))
        j0 = 0
        if i0 < 0:
            j0, i0 = -i0, 0
        n = min(len(sig) - j0, N - i0)
        if n <= 0:
            return
        if sig.ndim == 1:
            ang = (pan + 1.0) * math.pi / 4.0
            self.x[i0:i0 + n, 0] += sig[j0:j0 + n] * (math.cos(ang) * gain)
            self.x[i0:i0 + n, 1] += sig[j0:j0 + n] * (math.sin(ang) * gain)
        else:
            self.x[i0:i0 + n] += sig[j0:j0 + n] * gain


# 불협 점검용 기록: (층, MIDI, 울리기 시작, 사실상 사라지는 시각)
NOTES: list[tuple[str, int, float, float]] = []

RENDER = True  # False면 소리는 만들지 않고 음 기록만 남긴다 (--table)
_SILENT = np.zeros(1, dtype=np.float32)

# --------------------------------------------------------------------------
# 4. 악기
# --------------------------------------------------------------------------


def pad_note(midi: int, dur: float, atk: float, rel: float, rng, kmax: int = 16,
             fmax: float = 7000.0):
    """따뜻한 지속음. 조금씩 어긋난 세 목소리를 좌우로 벌린다.

    기음·2배음(body)과 3배음 이상(air)을 따로 돌려준다. air 쪽 음량을 시간에 따라
    바꾸면 저역 통과 필터를 여닫는 것과 같은 효과가 난다. 배음은 k^-1.5 로 줄고
    3.5kHz 위에서 한 번 더 완만하게 깎인다(톱니파보다 훨씬 무르다).
    """
    if not RENDER:
        return _SILENT, _SILENT
    f0 = hz(midi)
    n = int(round((dur + rel) * SR))
    t = np.arange(n) / SR
    env = np.ones(n)
    a = min(int(atk * SR), n)
    env[:a] = rcos_up(a)
    r = min(int(rel * SR), n)
    env[n - r:] *= rcos_down(r)
    body = np.zeros((n, 2))
    air = np.zeros((n, 2))
    kmax = max(2, min(kmax, int(fmax // f0)))
    # (cent, 좌우, body 세기, air 세기). 양옆 목소리는 body에는 조금만, air에는 넉넉히 섞는다.
    # 낮은 배음까지 똑같이 겹치면 음량과 좌우 위치가 1~3초 주기로 크게 울렁인다.
    for cents, pan, wb, wa in ((0.0, 0.0, 1.0, 0.8), (-5.0, -0.8, 0.22, 0.6), (5.0, 0.8, 0.22, 0.6)):
        f = f0 * 2.0 ** (cents / 1200.0)
        ph = 2 * np.pi * f * t + rng.uniform(0, 2 * np.pi)
        lfo = 1.0 + 0.06 * np.sin(2 * np.pi * rng.uniform(0.07, 0.15) * t + rng.uniform(0, 2 * np.pi))
        e = env * lfo
        b = np.sin(ph) + 0.24 * np.sin(2 * ph + rng.uniform(0, 2 * np.pi))
        s = np.zeros(n)
        for k in range(3, kmax + 1):
            amp = (0.7 if k % 2 == 0 else 1.0) * k ** -1.5 / math.sqrt(1.0 + (k * f0 / 3500.0) ** 2)
            s += amp * np.sin(k * ph + rng.uniform(0, 2 * np.pi))
        ang = (pan + 1.0) * math.pi / 4.0
        gl, gr = math.cos(ang), math.sin(ang)
        b *= e * wb
        s *= e * wa
        body[:, 0] += b * gl
        body[:, 1] += b * gr
        air[:, 0] += s * gl
        air[:, 1] += s * gr
    return body.astype(np.float32), air.astype(np.float32)


def _partials(f: float, partials, atk: float, dur: float, fmax: float = 6000.0,
              phase: float = 0.0) -> np.ndarray:
    """(배수, 세기, 감쇠 시간) 목록으로 만드는 짧은 음."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for ratio, amp, tau in partials:
        if ratio * f > fmax or amp <= 0:
            continue
        y += amp * np.exp(-t / tau) * np.sin(2 * np.pi * ratio * f * t + phase)
    a = int(atk * SR)
    y[:a] *= rcos_up(a)
    r = int(0.03 * SR)
    y[-r:] *= rcos_down(r)
    return y


# 모티프와 맑은 음은 arp·pulse와 위상을 90도 어긋나게 시작한다. 같은 음이 같은 시각에
# 겹칠 때 진폭이 두 배로 튀지 않고 따로 연주한 것처럼 더해진다.
QUARTER = math.pi / 2


def ring(kind: str, f: float) -> float:
    """기음의 감쇠 시간(초)."""
    if kind == "pluck":
        return 0.38 * (440.0 / f) ** 0.25
    if kind == "mallet":
        return 0.30 * (440.0 / f) ** 0.30
    if kind == "ep":
        return 0.80 * (440.0 / f) ** 0.30
    if kind == "bell":
        return 1.50 * (880.0 / f) ** 0.30
    if kind == "soft":
        return 0.45
    if kind == "pulse":
        return 0.075
    raise ValueError(kind)


def make_tone(kind: str, midi: int, bright: float) -> np.ndarray:
    f = hz(midi)
    tau = ring(kind, f)
    if kind == "pluck":  # 부드러운 pluck: 배음이 높을수록 빨리 사라진다
        p = 2.0 - 1.0 * bright
        parts = [(k, k ** -p, tau / k) for k in range(1, 13)]
        return _partials(f, parts, 0.004, 6 * tau, fmax=9000.0)
    if kind == "mallet":  # 둥근 mallet: 기음 + 옥타브 + 짧은 4배음과 10배음
        parts = [(1, 1.0, tau), (2, 0.20, tau * 0.45), (4, 0.08 + 0.12 * bright, tau * 0.20),
                 (10, 0.02 + 0.03 * bright, tau * 0.07)]
        return _partials(f, parts, 0.006, 6 * tau, fmax=8000.0)
    if kind == "pulse":  # 아주 짧은 음
        parts = [(1, 1.0, tau), (2, 0.30 + 0.20 * bright, 0.045), (3, 0.10 + 0.10 * bright, 0.030),
                 (4, 0.08 * bright, 0.022), (6, 0.05 * bright, 0.015)]
        return _partials(f, parts, 0.003, 0.5)
    if kind == "bell":  # 맑은 음: 배음 네 개, attack 14ms
        parts = [(1, 1.0, tau), (2, 0.30, tau * 0.55), (3, 0.12, tau * 0.30),
                 (4, 0.08 * bright, tau * 0.18)]
        return _partials(f, parts, 0.014, min(6 * tau, 6.0), fmax=8000.0, phase=QUARTER)
    if kind == "soft":  # 문제 표시용: attack이 느린 둥근 음
        parts = [(1, 1.0, tau), (2, 0.15, tau * 0.5)]
        return _partials(f, parts, 0.035, 6 * tau)
    if kind == "ep":  # 모티프용: 약한 FM. 처음에만 배음이 살짝 열렸다 닫힌다
        dur = min(5.5 * tau, 4.5)
        n = int(dur * SR)
        t = np.arange(n) / SR
        w = 2 * np.pi * f * t + QUARTER
        idx = 0.30 + 1.6 * bright * np.exp(-t / 0.12)
        y = np.sin(w + idx * np.sin(w)) * np.exp(-t / tau)
        if 4 * f < 7000:  # 처음 0.1초만 스치는 맑은 윗소리
            y += 0.05 * bright * np.sin(4 * w) * np.exp(-t / 0.07)
        a = int(0.008 * SR)
        y[:a] *= rcos_up(a)
        r = int(0.03 * SR)
        y[-r:] *= rcos_down(r)
        return y
    raise ValueError(kind)


_tone_cache: dict = {}


def tone(kind: str, midi: int, bright: float) -> np.ndarray:
    if not RENDER:
        return _SILENT
    key = (kind, midi, int(round(bright * 8)))
    if key not in _tone_cache:
        _tone_cache[key] = make_tone(kind, midi, key[2] / 8.0).astype(np.float32)
    return _tone_cache[key]


def play(bus: Bus, layer: str, kind: str, midi: int, t: float, amp: float, bright: float,
         pan: float = 0.0, echo: float = 0.0):
    """짧은 음 하나. echo > 0 이면 점8분(0.375초) 간격으로 좌우를 오가며 두 번 되울린다."""
    bus.add(t, tone(kind, midi, bright), pan, amp)
    tail = 1.5 * ring(kind, hz(midi))
    NOTES.append((layer, midi, t, t + tail))
    if echo > 0:
        side = 1.0 if pan <= 0 else -1.0
        for j, g in ((1, echo), (2, echo * 0.42)):
            te = t + 0.375 * j
            bus.add(te, tone(kind, midi, max(0.0, bright - 0.25 * j)),
                    0.55 * side * (1 if j == 1 else -1), amp * g)
            if j == 1:
                NOTES.append((layer + "-echo", midi, te, te + 0.6 * tail))


def make_hats(rng, count: int = 6) -> list[np.ndarray]:
    """5~9.5kHz 대역의 아주 짧은 잡음. hi-hat 대신 쓰는 작은 tick."""
    n = int(0.07 * SR)
    f = np.fft.rfftfreq(n, 1 / SR)
    lo = np.clip((f - 4500) / 1200, 0, 1)
    hi = np.clip((10500 - f) / 1500, 0, 1)
    mask = (0.5 - 0.5 * np.cos(np.pi * lo)) * (0.5 - 0.5 * np.cos(np.pi * hi))
    t = np.arange(n) / SR
    env = np.exp(-t / 0.011)
    env[:48] *= rcos_up(48)
    env[-240:] *= rcos_down(240)
    out = []
    for _ in range(count):
        y = np.fft.irfft(np.fft.rfft(rng.standard_normal(n)) * mask, n) * env
        out.append((y / np.max(np.abs(y))).astype(np.float32))
    return out


def bass_voice() -> np.ndarray:
    """단선율 bass. 한 발진기의 음높이와 음량을 곡선으로 움직인다.

    보통의 화음 바뀜: 음량이 잠깐 내려갔다 올라오는 사이에 음높이를 옮긴다.
    문제 시각: 음량을 유지한 채 0.45초에 걸쳐 미끄러져 내려간다("낮은 음이 내려감").
    """
    T = time_axis()
    spans = [(HIT, 158.0), (167.0, TOTAL + 1.0)]  # bass가 울리는 범위

    def level_at(t: float) -> float:
        if t < 30:
            return 1.0
        if t < 40:
            return 0.80
        if t < 80:
            return 0.88
        if t < 144:
            return 0.95
        if t < 158:
            return 1.0
        if t < 170.5:   # S8: 화음이 한 계단 오를 때마다 조금씩 커진다
            return 0.62
        if t < 174:
            return 0.78
        if t < 177:
            return 0.90
        return 0.97

    rows = [r for r in PROG if any(a <= r[0] < b for a, b in spans)]
    logf = np.full(N, math.log(hz(bass_of(rows[0]))))
    lev_pts = [(0.0, 0.0)]
    dip = np.ones(N)
    prev_f = None
    for k, row in enumerate(rows):
        t0 = row[0]
        f = hz(bass_of(row))
        nxt = rows[k + 1][0] if k + 1 < len(rows) else TOTAL + 1.0
        span = next(s for s in spans if s[0] <= t0 < s[1])
        starts = abs(t0 - span[0]) < 1e-9
        ends = nxt >= span[1]
        lv = level_at(t0)
        if starts:
            lev_pts += [(t0 - 0.005, 0.0), (t0 + 0.10, lv)]
            logf[int((t0 - 1.0) * SR):] = math.log(f)
        else:
            lev_pts += [(t0, lev_pts[-1][1]), (t0 + 0.15, lv)]
            if t0 in PROBLEM_TIMES:
                i0, i1 = int(t0 * SR), int((t0 + 0.45) * SR)
            else:
                i0, i1 = int((t0 - 0.02) * SR), int((t0 + 0.03) * SR)
                g = np.exp(-0.5 * ((T[i0 - 9600:i1 + 9600] - t0) / 0.035) ** 2)
                dip[i0 - 9600:i1 + 9600] *= 1.0 - 0.55 * g
            x = np.linspace(0, 1, i1 - i0)
            s = x * x * (3 - 2 * x)
            logf[i0:i1] = math.log(prev_f) + (math.log(f) - math.log(prev_f)) * s
            logf[i1:] = math.log(f)
        if ends:
            end = min(span[1], TOTAL)
            lev_pts += [(end, lv), (end + 0.6, 0.0)]
        NOTES.append(("bass", bass_of(row), t0, min(nxt, span[1], TOTAL)))
        prev_f = f
    lev_pts.append((TOTAL + 2.0, 0.0))
    lev_pts.sort(key=lambda p: p[0])
    level = box_smooth(np.interp(T, [p[0] for p in lev_pts], [p[1] for p in lev_pts]), 0.02)

    # 느린 맥박: 뒤로 갈수록 2초마다, S6에서는 1초마다 아주 약하게 눌러 준다
    bump = np.zeros(N)
    shape_n = int(2.5 * SR)
    ts = np.arange(shape_n) / SR
    shape = np.exp(-ts / 0.45)
    shape[:1200] *= rcos_up(1200)
    for a, b, step in ((80.0, 144.0, 2.0), (144.0, 158.0, 1.0), (170.0, 181.0, 2.0)):
        for k in range(int(round((b - a) / step))):
            i0 = int((a + k * step) * SR)
            n = min(shape_n, N - i0)
            bump[i0:i0 + n] = np.maximum(bump[i0:i0 + n], shape[:n])
    amp = level * dip * (0.84 + 0.16 * bump)

    ph = 2 * np.pi * np.cumsum(np.exp(logf)) / SR
    # 2~4배음을 넉넉히 섞어 작은 스피커에서도 음높이가 들리게 한다
    y = np.sin(ph) + 0.45 * np.sin(2 * ph + 0.3) + 0.20 * np.sin(3 * ph) + 0.08 * np.sin(4 * ph)
    return (y * amp).astype(np.float32)


# --------------------------------------------------------------------------
# 5. 편성
# --------------------------------------------------------------------------

# 층별 기본 음량(선형). 구간별 변화는 arrange() 안의 곡선이 맡는다.
LV = dict(pad=0.074, padhi=0.050, bass=0.15, pulse=0.110, arp=0.140, lead=0.190,
          bell=0.100, sigh=0.085, hat=0.050)

# reverb로 보내는 양
SEND = dict(pad=0.30, padhi=0.50, bass=0.0, pulse=0.16, arp=0.34, lead=0.45, bell=0.60, hat=0.15)
# 잔향을 되돌려 섞는 양. 잔향 대역(160Hz~9kHz) 안에서 원음보다 약 10dB 아래가 되게 맞췄다.
WET = 0.55

PADHI_RANGES = [(HIT, 33.0), (137.6, 159.0), (174.0, TOTAL)]
PULSE_RANGES = [(8.0, 20.0), (24.0, 158.0), (167.5, 181.5)]
GHOST_RANGES = [(68.0, 158.0), (174.0, 181.5)]   # 8분음 뒷박의 아주 약한 pulse
HAT_RANGES = [(80.0, 114.0), (124.0, 158.0), (174.0, 181.0)]

# (시작, 끝, 음 간격, 음색, 한 옥타브 위 겹침, echo)
ARP_PLAN = [
    (40.0, 51.0, 0.5, "pluck", 0.0, 0.30),     # S5-1 4분음, 담백하게
    (51.0, 68.0, 0.5, "pluck", 0.0, 0.50),     # S5-2 echo가 늘어 빈 박을 채움
    (68.0, 80.0, 0.25, "mallet", 0.0, 0.30),   # S5-3 8분음, 둥근 mallet
    (80.0, 98.0, 0.25, "pluck", 0.0, 0.40),    # S5-4 pluck 8분음 + tick
    (98.0, 114.0, 0.25, "pluck", 0.35, 0.40),  # S5-5 옥타브 위가 겹침
    (114.0, 124.0, 0.5, "mallet", 0.0, 0.50),  # S5-6 한숨 돌림
    (124.0, 144.0, 0.25, "pluck", 0.40, 0.40),  # S5-7
    (144.0, 158.0, 0.25, "pluck", 0.60, 0.45),  # S6 가장 풍성
    (167.0, 170.5, 0.5, "pluck", 0.0, 0.40),   # S8 다시 쌓기
    (170.5, 181.5, 0.25, "pluck", 0.30, 0.40),
]
ARP_Q = (0, 1, 2, 3, 1, 2, 3, 2)   # 4분음용 순서
ARP_E = (0, 1, 2, 3, 2, 1, 2, 3)   # 8분음용 순서


def lead_events():
    """(시각, MIDI, 세기, 음색, echo). 드문 pluck과 모티프."""
    ev = []

    def add(t, midi, vel, kind="ep", echo=0.32):
        ev.append((t, midi, vel, kind, echo))

    def motif(land: float, notes, vel: float = 0.8, octave: float = 0.0):
        """세 음이 0.5초 간격으로 올라가 land 시각에 마지막 음이 떨어진다."""
        for k, m in enumerate(notes[:3]):
            add(land - 1.5 + 0.5 * k, m, vel * (0.62 + 0.08 * k))
        add(land, notes[3], vel)
        if octave > 0:
            add(land, notes[3] + 12, vel * octave, kind="bell", echo=0.0)

    # S1: 드문 pluck (모티프에 나올 음을 미리 흩어 놓는다)
    for t, m, v in ((1.0, 69, 0.56), (2.5, 76, 0.48), (4.5, 74, 0.56), (6.0, 78, 0.48), (7.0, 71, 0.40)):
        add(t, m, v, kind="pluck", echo=0.45)
    # S2: 내려가는 3도 — 묻는 듯한 음형
    for t, m, v in ((9.0, 74, 0.56), (10.0, 71, 0.48), (13.0, 74, 0.56), (14.0, 71, 0.48),
                    (17.0, 76, 0.56), (18.0, 74, 0.48), (19.0, 71, 0.40)):
        add(t, m, v, kind="pluck", echo=0.45)
    # S3: 모티프가 처음 완성되는 곳. 마지막 음이 22.2초 핵심 문구에 떨어진다
    motif(HIT, M_UP, vel=1.0)
    for k, m in enumerate((62, 69, 74)):  # 직전에 아래에서 위로 굴리는 화음
        add(HIT - 0.09 + 0.03 * k, m, 0.45, kind="pluck", echo=0.0)
    for t, m, v in ((26.0, 78, 0.70), (26.5, 76, 0.60), (27.0, 74, 0.60), (28.0, 69, 0.65)):
        add(t, m, v)  # 내려오는 대답
    # S4: 사례 모티프 제시
    motif(31.5, M_UP, vel=0.80)
    motif(35.5, M_OPEN, vel=0.75)
    # S5: 단계가 바뀔 때마다 모티프가 경계에 도착한다
    motif(40.0, M_UP, vel=0.85)
    motif(51.0, M_UP, vel=0.80)
    motif(68.0, M_UP, vel=0.80)
    motif(80.0, M_UP, vel=0.85)
    motif(98.0, M_TO_A, vel=0.85)
    motif(114.0, M_FROM_A, vel=0.85)
    motif(124.0, M_FROM_A, vel=0.90)
    # S6: 화음이 바뀔 때마다 도착
    motif(144.0, M_FROM_A, vel=1.0, octave=0.35)
    motif(148.0, M_UP, vel=0.90)
    motif(152.0, M_UP, vel=0.90)
    motif(155.0, M_OPEN, vel=0.90)
    # S8: 올라가는 bass 위에서 같은 음(F#5)에 계속 도착
    motif(170.5, M_UP, vel=0.75)
    motif(174.0, M_UP, vel=0.85)
    motif(177.0, M_FROM_A, vel=0.90)
    # S9: 마지막 도착
    motif(FINAL, M_UP, vel=0.9)
    for k, m in enumerate((62, 69, 74)):
        add(FINAL - 0.09 + 0.03 * k, m, 0.45, kind="pluck", echo=0.0)
    return ev


def arrange(rng) -> dict[str, Bus]:
    B = {k: Bus() for k in ("pad_body", "pad_air", "padhi", "bass", "pulse", "arp", "lead",
                            "bell", "hat")}

    # ---- pad
    for i, row in enumerate(PROG):
        t0, t1 = chord_span(i)
        c = CHORDS[row[1]]
        atk, rel = 0.5, 1.2
        if t0 == 0.0:
            atk = 1.2
        elif t0 in (HIT, FINAL):
            atk = 0.16
        elif t0 in PROBLEM_TIMES or t0 in RESOLVE_TIMES:
            atk = 0.4
        for j, m in enumerate(c["pad"]):
            w = 1.0 if j == 0 else (0.9 if j < 3 else 0.75)
            body, air = pad_note(m, t1 - t0, atk, rel, rng)
            B["pad_body"].add(t0, body, gain=LV["pad"] * w)
            B["pad_air"].add(t0, air, gain=LV["pad"] * w)
            NOTES.append(("pad", m, t0 + 0.4 * atk, min(t1 + 0.4 * rel, TOTAL)))
        if any(t0 < b and t1 > a for a, b in PADHI_RANGES):
            for m in c["hi"]:
                body, air = pad_note(m, t1 - t0, max(atk, 0.3), 1.4, rng, kmax=5)
                B["padhi"].add(t0, body + 0.6 * air, gain=LV["padhi"])

    # ---- bass
    B["bass"].add(0.0, bass_voice(), 0.0, LV["bass"])

    # ---- pulse: A4와 E4를 번갈아. 두 음은 모든 화음에 어울린다
    for a, b in PULSE_RANGES:
        for k in range(int(round((b - a) / BEAT))):
            t = a + k * BEAT
            beat = int(round(t / BEAT)) % 4
            vel = (1.0, 0.6, 0.8, 0.6)[beat]
            play(B["pulse"], "pulse", "pulse", 69 if beat % 2 == 0 else 64, t,
                 LV["pulse"] * vel, 0.4, pan=-0.12)
            if any(x <= t < y for x, y in GHOST_RANGES):
                play(B["pulse"], "pulse", "pulse", 69, t + 0.25, LV["pulse"] * 0.32, 0.2, pan=0.12)

    # ---- arp
    arp_bright = curve([(0, 0.45), (80, 0.5), (124, 0.6), (144, 0.72), (158, 0.72), (167, 0.5),
                        (177, 0.65), (187, 0.6)])
    tens = tension_curve()
    for a, b, step, kind, octave, echo in ARP_PLAN:
        pattern = ARP_Q if step == 0.5 else ARP_E
        base = LV["arp"] * (1.0 if step == 0.5 else 0.78) * (1.10 if kind == "mallet" else 1.0)
        for k in range(int(round((b - a) / step))):
            t = a + k * step
            ci = chord_index_at(t)
            first = math.ceil(PROG[ci][0] / step - 1e-9) * step
            i = int(round((t - first) / step))
            m = CHORDS[PROG[ci][1]]["arp"][pattern[i % 8]]
            vel = 1.0 if i % 4 == 0 else (0.72 if i % 2 else 0.82)
            n = int(t * SR)
            bright = float(arp_bright[n]) * (1.0 - 0.35 * float(tens[n]))
            pan = -0.28 if i % 2 == 0 else 0.28
            play(B["arp"], "arp", kind, m, t, base * vel, bright, pan=pan, echo=echo)
            if octave > 0 and i % 2 == 0:
                play(B["arp"], "arp-oct", kind, m + 12, t, base * vel * octave, bright * 0.8,
                     pan=-pan, echo=echo * 0.6)

    # ---- 드문 pluck과 모티프
    for t, m, vel, kind, echo in lead_events():
        play(B["lead"], "lead", kind, m, t, LV["lead"] * vel, 0.7, pan=0.0, echo=echo)

    # ---- 맑은 음: 22.2초, S6 시작, 마지막 화음
    play(B["bell"], "bell", "bell", 81, HIT, LV["bell"] * 0.9, 0.6, pan=0.0)
    play(B["bell"], "bell", "bell", 86, 144.0, LV["bell"] * 0.8, 0.6, pan=0.0)
    play(B["bell"], "bell", "bell", 81, FINAL, LV["bell"] * 0.75, 0.6, pan=-0.2)
    play(B["bell"], "bell", "bell", 86, FINAL, LV["bell"] * 0.55, 0.6, pan=0.2)

    # ---- 문제와 해결 표시
    for k, (tp, tr, bell_note) in enumerate(PROBLEMS):
        side = 0.2 if k % 2 == 0 else -0.2
        root = CHORDS[PROG[chord_index_at(tp)][1]]["bass"]
        fifth = root + 7
        while fifth < 66:
            fifth += 12
        # 문제: 단6도가 반음 아래 5도로 내려앉는 짧은 꾸밈음 (불협이 0.36초 스친다)
        play(B["bell"], "sigh", "soft", fifth + 1, tp, LV["sigh"] * 0.85, 0.0, pan=-side)
        play(B["bell"], "sigh", "soft", fifth, tp + 0.36, LV["sigh"], 0.0, pan=-side)
        # 해결: 밝은 음 하나
        play(B["bell"], "bell", "bell", bell_note, tr, LV["bell"], 0.6, pan=side)

    # ---- tick: 8분음 뒷박
    hats = make_hats(rng)
    for a, b in HAT_RANGES:
        for k in range(int(round((b - a) / BEAT))):
            t = a + k * BEAT + 0.25
            B["hat"].add(t, hats[k % len(hats)], 0.15, LV["hat"] * (1.0 if k % 2 == 0 else 0.6))

    return B


def automate(B: dict[str, Bus]) -> dict[str, np.ndarray]:
    """층마다 구간별 음량 곡선을 곱한다. 층은 끊기지 않고 들어오고 빠진다."""
    tens = tension_curve()
    relax = 1.0 - tens

    g_pad = curve([(0, 1.0), (19.5, 1.0), (20.5, 0.92), (22.0, 0.92), (22.3, 1.15), (27, 1.05),
                   (30, 1.0), (40, 0.95), (144, 1.0), (157.6, 1.0), (159.2, 0.82), (166.5, 0.82),
                   (168, 0.95), (177, 1.0), (183.4, 1.0), (183.8, 1.05), (187, 1.05)])
    g_air = curve([(0, 0.50), (8, 0.42), (19.5, 0.42), (22.0, 0.75), (22.3, 1.0), (27, 0.85),
                   (30, 0.70), (33, 0.50), (40, 0.50), (80, 0.60), (124, 0.70), (137.6, 0.75),
                   (144, 0.95), (157.6, 0.95), (159.2, 0.40), (166, 0.40), (170, 0.55),
                   (177, 0.80), (183.6, 0.85), (187, 0.70)]) * (1.0 - 0.30 * tens)
    g_padhi = curve([(0, 0), (22.1, 0), (22.4, 0.9), (26, 0.6), (30, 0.25), (33, 0),
                     (137.4, 0), (139, 0.5), (144, 0.9), (157.5, 0.9), (159.2, 0),
                     (173.9, 0), (177, 0.6), (183.5, 0.6), (183.8, 0.7), (187, 0.7)])
    g_pulse = curve([(0, 0), (8.0, 0), (10, 0.8), (18, 0.8), (20, 0), (23.9, 0), (26, 0.6),
                     (30, 0.6), (40, 0.8), (51, 0.9), (144, 1.0), (156.0, 1.0), (157.8, 0.45),
                     (158.4, 0), (167.4, 0), (169, 0.8), (177, 0.9), (180, 0.7), (181.7, 0),
                     (187, 0)])
    g_arp = curve([(0, 0), (39.9, 0), (41.5, 0.8), (51, 0.9), (80, 1.0), (144, 1.1),
                   (156.0, 1.1), (157.8, 0.45), (158.4, 0), (166.9, 0), (170, 0.7), (177, 0.95),
                   (180, 0.7), (181.8, 0), (187, 0)]) * (1.0 - 0.25 * tens)
    g_hat = curve([(0, 0), (79.9, 0), (82, 1), (113.5, 1), (114.5, 0), (123.5, 0), (125, 1),
                   (156.0, 1), (157.6, 0), (173.9, 0), (175, 0.8), (180, 0.6), (181, 0),
                   (187, 0)]) * relax

    def mul(x, g):
        return x * g[:, None]

    return {
        "pad": mul(B["pad_body"].x + mul(B["pad_air"].x, g_air), g_pad),
        "padhi": mul(B["padhi"].x, g_padhi),
        "bass": B["bass"].x,
        "pulse": mul(B["pulse"].x, g_pulse),
        "arp": mul(B["arp"].x, g_arp),
        "lead": B["lead"].x,
        "bell": B["bell"].x,
        "hat": mul(B["hat"].x, g_hat),
    }


# --------------------------------------------------------------------------
# 6. 공간과 마무리
# --------------------------------------------------------------------------


def reverb_ir(seed: int) -> np.ndarray:
    """어두운 잔향. 대역별로 길이가 다른 감쇠 잡음 (160Hz 아래와 9kHz 위는 비움)."""
    n = int(2.8 * SR)
    rng = np.random.default_rng(seed)
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.maximum(np.fft.rfftfreq(n, 1 / SR), 1.0)
    t = np.arange(n) / SR

    def edge(x):
        x = np.clip(x, 0, 1)
        return x * x * (3 - 2 * x)

    ir = np.zeros(n)
    for lo, hi, rt60 in ((160, 600, 2.5), (600, 2200, 2.1), (2200, 9000, 1.2)):
        mask = edge(np.log2(f / lo) / 0.6 + 0.5) * (1.0 - edge(np.log2(f / hi) / 0.6 + 0.5))
        ir += np.fft.irfft(spec * mask, n) * np.exp(-6.908 * t / rt60)
    ir *= 1.0 - np.exp(-t / 0.012)
    ir = np.concatenate([np.zeros(int(0.02 * SR)), ir])
    return ir / math.sqrt(float(np.sum(ir * ir)))


def convolve(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    m = 1 << int(math.ceil(math.log2(N + len(ir))))
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:N]


def master(stems: dict[str, np.ndarray]) -> np.ndarray:
    dry = np.zeros((N, 2), dtype=np.float64)
    send = np.zeros((N, 2), dtype=np.float64)
    for name, x in stems.items():
        dry += x
        if SEND[name] > 0:
            send += x * SEND[name]
    wet = np.stack([convolve(send[:, 0], reverb_ir(SEED + 1)),
                    convolve(send[:, 1], reverb_ir(SEED + 2))], axis=1)
    mix = dry + WET * wet

    # 30Hz 아래와 13kHz 위를 완만하게 덜어 내고, 3kHz 위를 2.5dB 들어 준다 (위상 변화 없음)
    f = np.maximum(np.fft.rfftfreq(N, 1 / SR), 1e-9)
    g = 1.0 / np.sqrt(1.0 + (28.0 / f) ** 4) / np.sqrt(1.0 + (f / 13000.0) ** 8)
    g *= 1.0 + (10 ** (2.5 / 20) - 1.0) * f ** 2 / (f ** 2 + 3000.0 ** 2)
    mix = np.fft.irfft(np.fft.rfft(mix, axis=0) * g[:, None], N, axis=0)

    # 좌우 균형: 지속음과 잔향이 겹치면서 한쪽으로 1dB 가까이 치우치는 것을 전체 gain으로 바로잡는다
    pl, pr = rms(mix[:, 0]), rms(mix[:, 1])
    mix[:, 0] *= math.sqrt(pr / pl)
    mix[:, 1] *= math.sqrt(pl / pr)

    # 시작 0.5초 fade-in, 185초부터 2초 fade-out (187.0초에 정확히 0)
    n_in = int(0.5 * SR)
    mix[:n_in] *= rcos_up(n_in)[:, None]
    i0 = int(FADE_OUT * SR)
    mix[i0:] *= rcos_down(N - i0)[:, None]

    peak = float(np.max(np.abs(mix)))
    return mix * (10 ** (-6.0 / 20) / peak)  # 합성 원본은 peak -6dBFS. 최종 음량은 loudnorm이 맞춘다


def write_wav(path: str, x: np.ndarray):
    ints = np.round(np.clip(x, -1.0, 1.0) * 8388607.0).astype("<i4")
    data = np.ascontiguousarray(ints).view(np.uint8).reshape(-1, 4)[:, :3]
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# --------------------------------------------------------------------------
# 7. 음량 맞춤과 인코딩 (ffmpeg)
# --------------------------------------------------------------------------


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, capture_output=True)


def last_json(text: str) -> dict:
    return json.loads(re.findall(r"\{[^{}]*\}", text, re.S)[-1])


def loudnorm_and_encode():
    base = f"loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA=20"
    # 1차: 측정
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MIX_WAV, "-af",
             base + ":print_format=json", "-f", "null", "-"])
    m = last_json(r.stderr.decode())
    # 2차: 측정값을 넣고 linear=true → 전체에 같은 gain만 곱한다 (구간 간 음량 차를 건드리지 않음)
    af = (base + f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
          f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
          f":offset={m['target_offset']}:linear=true:print_format=json")
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", MIX_WAV, "-af", af,
             "-ar", str(SR), "-c:a", "pcm_s24le", MASTER_WAV])
    m2 = last_json(r.stderr.decode())
    if m2.get("normalization_type") != "linear":
        raise SystemExit("loudnorm이 linear로 동작하지 않았다: " + json.dumps(m2))

    def encode(trim_db: float):
        run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", MASTER_WAV, "-map_metadata", "-1",
             "-af", f"volume={trim_db:.2f}dB", "-c:a", "libmp3lame", "-b:a", "192k",
             "-ar", str(SR), "-ac", "2", MP3])

    # LAME은 192kbps에서 입력을 조금(약 0.2dB) 줄여 인코딩한다. 한 번 재 보고 그만큼 올려 다시 만든다.
    encode(0.0)
    trim = TARGET_LUFS - measure_loudness(MP3)[0]
    if abs(trim) >= 0.05:
        encode(trim)
    return m, m2, trim


def measure_loudness(path: str) -> tuple[float, float, float]:
    """(통합 LUFS, LRA, true peak dBTP) — EBU R128."""
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true",
             "-f", "null", "-"])
    summary = r.stderr.decode().split("Summary:")[-1]

    def val(pat: str) -> float:
        return float(re.search(pat, summary).group(1))

    return val(r"I:\s+(-?[\d.]+) LUFS"), val(r"LRA:\s+(-?[\d.]+) LU"), val(r"Peak:\s+(-?[\d.]+) dBFS")


# --------------------------------------------------------------------------
# 8. 확인
# --------------------------------------------------------------------------


def db(x: float) -> float:
    return 20 * math.log10(max(x, 1e-9))


def rms(x: np.ndarray) -> float:
    return float(np.sqrt(np.mean(np.square(x, dtype=np.float64)))) if len(x) else 0.0


def decode(path: str) -> np.ndarray:
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-f", "f32le", "-ac", "2",
             "-ar", str(SR), "-"])
    return np.frombuffer(r.stdout, dtype="<f4").reshape(-1, 2)


def check(path: str):
    print(f"\n== 확인: {os.path.relpath(path, ROOT)}")
    r = run(["ffprobe", "-v", "error", "-show_entries",
             "format=duration,bit_rate:stream=codec_name,sample_rate,channels",
             "-of", "json", path])
    info = json.loads(r.stdout.decode())
    st = info["streams"][0]
    dur = float(info["format"]["duration"])
    print(f"형식    {st['codec_name']} {st['sample_rate']}Hz {st['channels']}ch "
          f"{int(info['format']['bit_rate']) // 1000}kbps")
    print(f"길이    {dur:.3f}초 (목표 {TOTAL:.1f} ±0.05) {'OK' if abs(dur - TOTAL) <= 0.05 else 'NG'}")

    x = decode(path)
    peak = float(np.max(np.abs(x)))
    clipped = int(np.sum(np.abs(x) >= 0.999))
    print(f"표본    {len(x)}개 = {len(x) / SR:.3f}초, sample peak {db(peak):.2f} dBFS, "
          f"0dBFS에 닿은 표본 {clipped}개, 좌우 RMS 차 {db(rms(x[:, 0])) - db(rms(x[:, 1])):+.2f} dB")
    tail = x[int(186.9 * SR):int(TOTAL * SR)]
    print(f"끝      186.9~187.0초 RMS {db(rms(tail)):.1f} dBFS, "
          f"시작 0~0.05초 RMS {db(rms(x[:int(0.05 * SR)])):.1f} dBFS")

    lufs, lra, tp = measure_loudness(path)
    print(f"음량    통합 {lufs:.1f} LUFS (목표 {TARGET_LUFS}), LRA {lra:.1f} LU, "
          f"true peak {tp:.1f} dBTP (한도 {TARGET_TP}) {'OK' if tp <= TARGET_TP else 'NG'}")

    print("\n구간별 RMS (dBFS)")
    sec_rms = {}
    for name, a, b in SECTIONS:
        v = db(rms(x[int(a * SR):int(b * SR)]))
        sec_rms[name] = v
        print(f"  {name:5s} {a:5.0f}–{b:<5.0f} {v:6.1f}  " + "#" * max(0, int(round((v + 45) * 1.5))))
    lo = min(sec_rms, key=sec_rms.get)
    hi = max(sec_rms, key=sec_rms.get)
    print(f"  가장 조용한 구간 {lo} ({sec_rms[lo]:.1f}), 가장 큰 구간 {hi} ({sec_rms[hi]:.1f})")

    secs = int(TOTAL)
    r1 = np.array([db(rms(x[k * SR:(k + 1) * SR])) for k in range(secs)])
    d = np.diff(r1)
    print("\n구간 경계의 앞뒤 1초 RMS 차이 (dB)")
    print("  " + "  ".join(f"{b}s:{r1[b] - r1[b - 1]:+.1f}" for _, _, b in SECTIONS[:-1]))
    body = slice(1, int(FADE_OUT) - 1)  # fade-in/out 제외
    order = np.argsort(-np.abs(d[body]))[:6] + 1
    print("  가장 큰 변화: " + ", ".join(f"{k + 1}s {d[k]:+.1f}" for k in sorted(order)))
    quiet = np.argsort(r1[1:int(FADE_OUT)])[:3] + 1
    print("  가장 조용한 1초: " + ", ".join(f"{k}s {r1[k]:.1f}" for k in quiet))

    # 대역별 에너지 비율: 고역이 과하지 않은지
    spec = np.abs(np.fft.rfft(x.mean(axis=1))) ** 2
    f = np.fft.rfftfreq(len(x), 1 / SR)
    tot = spec.sum()
    bands = ((20, 150), (150, 600), (600, 2500), (2500, 6000), (6000, 12000), (12000, 24000))
    print("\n대역별 에너지 (전체 대비 dB)")
    print("  " + "  ".join(f"{a}-{b}Hz:{10 * math.log10(max(spec[(f >= a) & (f < b)].sum() / tot, 1e-12)):.1f}"
                           for a, b in bands))

    run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", path, "-lavfi",
         "showspectrumpic=s=1600x600:legend=1", SPEC_PNG])
    run(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", path, "-lavfi",
         "showspectrumpic=s=1600x600:legend=1:fscale=log", SPEC_LOG_PNG])
    print(f"\n스펙트로그램 {os.path.relpath(SPEC_PNG, ROOT)} (선형 축), "
          f"{os.path.relpath(SPEC_LOG_PNG, ROOT)} (로그 축)")


def print_layers(stems: dict[str, np.ndarray]):
    print("\n층별·구간별 RMS (dB, 합성 원본 기준)")
    names = list(stems)
    print("        " + "".join(f"{n:>8s}" for n in names))
    for name, a, b in SECTIONS:
        row = "".join(f"{db(rms(stems[n][int(a * SR):int(b * SR)])):8.1f}" for n in names)
        print(f"  {name:5s} {row}")


def print_table():
    """화음 진행과 사용 음. 듣지 않고 점검할 수 있게 음 이름과 주파수를 적는다."""
    print("화음 진행")
    print("  시작     길이  화음    bass          pad                              비고")
    for i, row in enumerate(PROG):
        t0, t1 = chord_span(i)
        c = CHORDS[row[1]]
        b = bass_of(row)
        note = ""
        if t0 in PROBLEM_TIMES:
            note = "문제: bass 단3도 아래로"
        elif t0 in RESOLVE_TIMES:
            bell = next(p[2] for p in PROBLEMS if p[1] == t0)
            note = f"해결: {note_name(bell)} {hz(bell):.0f}Hz"
        elif t0 == HIT:
            note = "핵심 문구: bass 진입"
        elif t0 == FINAL:
            note = "마지막 으뜸화음"
        sec = next((n for n, a, _ in SECTIONS if a == t0), "")
        pad = " ".join(note_name(m) for m in c["pad"])
        print(f"  {t0:6.1f} {t1 - t0:5.1f}  {row[1]:7s} {note_name(b):3s} {hz(b):6.1f}Hz  {pad:32s} "
              f"{sec + ' ' if sec else ''}{note}")
    used = sorted({m for c in CHORDS.values() for k in ("pad", "arp", "hi") for m in c[k]}
                  | {bass_of(r) for r in PROG} | {64, 69} | {p[2] for p in PROBLEMS})
    print("\n사용 음 (D장조 음계: D E F# G A B C#)")
    print("  " + "  ".join(f"{note_name(m)}={hz(m):.1f}" for m in used))
    print("  음계 밖의 음: 문제 표시의 C5(523.3Hz) — Em7 위에서 0.36초만 울리고 B4로 내려간다")


def audit():
    """동시에 울리는 음 가운데 반음(단2도·단9도)으로 부딪히는 쌍을 찾는다."""
    ev = sorted(NOTES, key=lambda e: e[2])
    hits = []
    for i, (la, ma, a0, a1) in enumerate(ev):
        for lb, mb, b0, b1 in ev[i + 1:]:
            if b0 >= a1:
                break
            iv = abs(ma - mb)
            if iv % 12 == 1 and iv < 30:
                ov = min(a1, b1) - b0
                if ov > 0.05:
                    hits.append((ov, b0, la, ma, lb, mb))
    by_kind: dict = {}
    for ov, t, la, ma, lb, mb in hits:
        key = tuple(sorted((la.replace("-echo", "*").replace("-oct", ""), lb.replace("-echo", "*").replace("-oct", ""))))
        by_kind.setdefault(key, []).append((ov, t, ma, mb))
    print("\n반음 충돌 점검 (같은 시각에 단2도/단9도로 겹치는 음. * 는 echo)")
    print("  층 조합                 건수   합계(초)  가장 긴 것")
    for key, lst in sorted(by_kind.items(), key=lambda kv: -max(v[0] for v in kv[1])):
        ov, t, ma, mb = max(lst)
        print(f"  {key[0] + ' / ' + key[1]:22s} {len(lst):5d}  {sum(v[0] for v in lst):7.1f}   "
              f"{ov:.2f}초 @ {t:.1f}s ({note_name(ma)}–{note_name(mb)})")
    long = sorted((h for h in hits if h[0] >= 0.6 and "echo" not in h[2] + h[4]), key=lambda h: h[1])
    print("  0.6초 이상 겹치는 것 (echo 제외):")
    for ov, t, la, ma, lb, mb in long:
        print(f"    {t:6.1f}s  {ov:.2f}초  {la}:{note_name(ma)} – {lb}:{note_name(mb)}  "
              f"[{PROG[chord_index_at(t)][1]}]")
    if not long:
        print("    없음")


# --------------------------------------------------------------------------


def main():
    args = set(sys.argv[1:])
    if "--table" in args:
        global RENDER
        RENDER = False
        print_table()
        arrange(np.random.default_rng(SEED))
        audit()
        return
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(PUB_DIR, exist_ok=True)
    rng = np.random.default_rng(SEED)
    print("합성 중 …")
    stems = automate(arrange(rng))
    if "--layers" in args:
        print_layers(stems)
    mix = master(stems)
    write_wav(MIX_WAV, mix)
    print(f"합성 원본 {os.path.relpath(MIX_WAV, ROOT)}")
    m, m2, trim = loudnorm_and_encode()
    print(f"loudnorm  입력 {m['input_i']} LUFS / {m['input_tp']} dBTP → "
          f"출력 {m2['output_i']} LUFS / {m2['output_tp']} dBTP ({m2['normalization_type']}), "
          f"mp3 보정 {trim:+.2f} dB")
    print(f"최종      {os.path.relpath(MP3, ROOT)}")
    check(MP3)


if __name__ == "__main__":
    main()
