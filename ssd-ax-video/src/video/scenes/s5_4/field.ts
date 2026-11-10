// S5-4 그림의 점 배치. 실패 312건의 점마다 자리 두 곳을 미리 정해 둔다.
//   흩어진 자리  문제 직후. 띠 전체에 고르게, 그러나 줄지어 보이지 않게 흩는다.
//   묶음의 자리  분류 뒤. 해바라기 씨앗 배열(황금각)로 묶음마다 고르게 찬다(승인 스틸과 같은 방식).
// 난수는 쓰지 않는다. 같은 프레임은 언제나 같은 그림이다.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** 0~1 의 결정적 값 */
export const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export type Cluster = { count: number; cx: number; cy: number; r: number };

export type Dot = {
  /** 묶음 번호 (FIG 의 순서) */
  cluster: number;
  /** 묶음 안에서의 순서 0~1. 안쪽 점이 0 */
  rank: number;
  /** 흩어진 자리 */
  sx: number;
  sy: number;
  /** 묶음 안의 자리 */
  tx: number;
  ty: number;
};

export type Field = {
  clusters: Cluster[];
  dots: Dot[];
  /** 원인 가설로 이어지는 묶음(가장 큰 묶음). 화면에서는 맨 오른쪽, 파형 옆에 놓인다. */
  suspect: number;
};

export const buildField = (
  counts: readonly number[],
  o: {
    width: number;
    height: number;
    /** 첫 묶음의 왼쪽 끝 */
    left: number;
    /** 묶음 사이의 간격 */
    gap: number;
    /** 묶음 반지름 = spacing × √count */
    spacing: number;
    /** 흩어진 점이 띠의 가장자리에서 떨어지는 거리 */
    margin: number;
  },
): Field => {
  const total = counts.reduce((sum, n) => sum + n, 0);

  // 화면에 놓는 순서: 가장 큰 묶음을 맨 오른쪽에, 나머지는 크기가 번갈아 보이게.
  const bySize = counts.map((_, i) => i).sort((a, b) => counts[b] - counts[a]);
  const [largest, ...rest] = bySize;
  const order = rest.length > 0 ? [rest[0], ...rest.slice(1).reverse(), largest] : [largest];

  const clusters: Cluster[] = counts.map((count) => ({ count, cx: 0, cy: o.height / 2, r: o.spacing * Math.sqrt(count) }));
  let cursor = o.left;
  for (const ci of order) {
    clusters[ci].cx = cursor + clusters[ci].r;
    cursor += clusters[ci].r * 2 + o.gap;
  }

  // 흩어진 자리: 6줄 격자의 칸마다 점 하나, 칸 안에서 결정적으로 흔든다.
  const rows = 6;
  const cols = Math.ceil(total / rows);
  const colW = (o.width - o.margin * 2) / cols;
  const rowH = (o.height - o.margin * 2) / rows;
  // 묶음과 흩어진 자리가 서로 무관하도록 칸을 건너뛰며 나눠 준다.
  let step = Math.round(total * 0.618);
  while (gcd(step, total) !== 1) step++;

  const dots: Dot[] = [];
  let n = 0;
  counts.forEach((count, ci) => {
    for (let k = 0; k < count; k++, n++) {
      const slot = (n * step + 31) % total;
      const col = Math.floor(slot / rows);
      const row = slot % rows;
      const r = o.spacing * Math.sqrt(k + 0.5);
      const a = k * GOLDEN_ANGLE + ci * 1.3;
      dots.push({
        cluster: ci,
        rank: k / count,
        sx: o.margin + (col + 0.5 + (hash(slot * 2 + 1) - 0.5) * 0.9) * colW,
        sy: o.margin + (row + 0.5 + (hash(slot * 2 + 2) - 0.5) * 0.9) * rowH,
        tx: clusters[ci].cx + r * Math.cos(a),
        ty: clusters[ci].cy + r * Math.sin(a),
      });
    }
  });

  return { clusters, dots, suspect: largest };
};

/** 두 색 사이의 색. #RRGGBB 두 개와 0~1 */
export const mix = (from: string, to: string, t: number): string => {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (shift: number): number => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};
