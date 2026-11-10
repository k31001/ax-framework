// 글자 폭 추정과 줄 나눔.
// 흐름도와 진행 표시는 카드 위치를 미리 계산해야 하므로(애니메이션에서도 같은 좌표를 쓴다)
// DOM 측정 대신 Pretendard의 글자 폭 표로 폭을 추정한다. 값은 100px 기준 실측(굵기 600~800 평균).

const LATIN: Record<string, number> = {
  a: 56, b: 61, c: 57, d: 61, e: 58, f: 37, g: 61, h: 60, i: 26, j: 26, k: 56, l: 26, m: 88,
  n: 60, o: 59, p: 61, q: 61, r: 39, s: 54, t: 37, u: 60, v: 56, w: 82, x: 55, y: 56, z: 55,
  A: 72, B: 64, C: 72, D: 71, E: 59, F: 56, G: 73, H: 72, I: 27, J: 55, K: 67, L: 55, M: 88,
  N: 71, O: 75, P: 63, Q: 75, R: 63, S: 63, T: 64, U: 70, V: 72, W: 100, X: 69, Y: 70, Z: 65,
  "0": 66, "1": 47, "2": 61, "3": 64, "4": 66, "5": 63, "6": 64, "7": 58, "8": 65, "9": 64,
  " ": 23.5, "·": 28, ":": 28, ",": 28.5, ".": 28, "%": 96, "→": 92, "≤": 65, "(": 39, ")": 39,
  "-": 45, "/": 40, "+": 62,
};

const isHangul = (ch: string) => {
  const c = ch.charCodeAt(0);
  return (c >= 0xac00 && c <= 0xd7a3) || (c >= 0x3130 && c <= 0x318f);
};

/** Pretendard로 조판한 한 줄의 폭(px) 추정. 오차는 대략 ±2%. */
export const estimateWidth = (text: string, fontSize: number, letterSpacingEm = -0.01) => {
  let units = 0;
  for (const ch of text) {
    units += isHangul(ch) ? 86.4 : (LATIN[ch] ?? 60);
    units += letterSpacingEm * 100;
  }
  return (units / 100) * fontSize;
};

/**
 * 한 줄에 안 들어가는 문구를 낱말 경계에서 나눈다.
 * 두 줄로 나눌 때는 긴 쪽이 가장 짧아지는 자리를 고르고, "·" 이나 ":" 뒤에서 끊는 쪽을 우선한다.
 * 줄이 "·" 으로 시작하는 나눔은 쓰지 않는다.
 */
export const wrapBalanced = (text: string, fontSize: number, maxWidth: number): string[] => {
  if (estimateWidth(text, fontSize) <= maxWidth) return [text];
  const words = text.split(" ");
  let best: { lines: string[]; cost: number } | null = null;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === "·") continue;
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const widest = Math.max(estimateWidth(a, fontSize), estimateWidth(b, fontSize));
    const last = words[i - 1];
    const natural = last === "·" || last.endsWith(":") || last.endsWith(",");
    const cost = widest * (natural ? 0.75 : 1);
    if (!best || cost < best.cost) best = { lines: [a, b], cost };
  }
  if (!best) return [text];
  // 두 줄로도 넘치면 뒤쪽 줄을 한 번 더 나눈다.
  const [a, b] = best.lines;
  if (estimateWidth(b, fontSize) > maxWidth && b.includes(" ")) {
    return [a, ...wrapBalanced(b, fontSize, maxWidth)];
  }
  return best.lines;
};
