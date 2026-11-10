// S5-5 그림의 자리(그림 자리 1012×280 의 좌표)와 결정적으로 만든 파형·trace 무늬.
//
//   왼쪽  장시간 구동: HW 파형과 FW trace 두 줄, 그 사이에 둘이 함께 쓰는 시간축
//   오른쪽 확대 창: 고장 시점을 시간축으로만 늘린 것. 줄의 높이가 왼쪽과 같다.
//          두 줄 사이(HW 와 FW 의 경계)에 status 비트, 뒤에 큐가 놓인다.

/** 세 줄의 세로 중심 */
export const Y = { hw: 92, mid: 150, fw: 208 } as const;

/** 장시간 구동 쪽의 가로 자리 */
export const X = {
  start: 136, // 시간축이 시작하는 곳 (줄 이름의 오른쪽)
  divide: 292, // 가상 플랫폼 → emulator · FPGA
  stall: 508, // FW 가 멈춘 command 를 시작한 곳
  cut: 522, // 완료 두 건이 온 시점. 교차 분석의 세로선
  end: 560, // timeout
  tick: 18, // 매일 구동의 눈금 간격
} as const;

/** 파형의 높낮이 (줄 중심에서) */
export const LEVEL = { low: 10, high: -10 } as const;
/** FW trace 한 칸의 높이 */
export const SPAN_H = 16;

/** 확대 창 */
export const ZOOM = { w: 400, y: 52, h: 220 } as const;

/** 0~1 의 결정적 값 */
export const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** HW 파형(emulator · FPGA 구간). 끝에 완료 펄스 두 개가 바짝 붙어 온다. */
export const hwWavePath = (): string => {
  const low = Y.hw + LEVEL.low;
  const high = Y.hw + LEVEL.high;
  let x = X.divide + 6;
  let d = `M ${X.divide} ${low}`;
  for (let i = 0; x < X.cut - 26; i++) {
    const up = 4 + Math.floor(hash(i * 2) * 3) * 3;
    const down = 4 + Math.floor(hash(i * 2 + 1) * 4) * 3;
    d += ` H ${x} V ${high} H ${x + up} V ${low}`;
    x += up + down;
  }
  d += ` H ${X.cut - 7} V ${high} H ${X.cut - 3} V ${low} H ${X.cut + 3} V ${high} H ${X.cut + 7} V ${low} H ${X.end}`;
  return d;
};

export type Span = { x: number; w: number };

/** FW trace: 처리한 일마다 한 칸. 멈추기 전까지. */
export const fwSpans = (): Span[] => {
  const spans: Span[] = [];
  let x = X.start;
  for (let i = 0; x < X.stall - 8; i++) {
    const w = Math.min(10 + Math.floor(hash(100 + i) * 3) * 6, X.stall - 4 - x);
    spans.push({ x, w });
    x += w + 4;
  }
  return spans;
};

/** 고친 뒤 멈췄던 자리에 이어지는 칸 */
export const RESUMED: Span[] = [
  { x: X.stall, w: 16 },
  { x: X.stall + 20, w: 10 },
  { x: X.stall + 34, w: 18 },
];

/** 매일 구동의 눈금 자리 */
export const dayTicks = (): number[] => {
  const ticks: number[] = [];
  for (let x: number = X.divide; x <= X.stall; x += X.tick) ticks.push(x);
  return ticks;
};

/** 두 색 사이의 색. #RRGGBB 두 개와 0~1 */
export const mix = (from: string, to: string, t: number): string => {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (shift: number): number => {
    const p = (a >> shift) & 255;
    const q = (b >> shift) & 255;
    return Math.round(p + (q - p) * t);
  };
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};
