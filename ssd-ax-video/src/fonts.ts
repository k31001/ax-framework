import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const SANS = "Pretendard";
export const MONO = "JetBrains Mono";

export const fontsReady = Promise.all([
  loadFont({
    family: SANS,
    url: staticFile("fonts/PretendardVariable.woff2"),
    weight: "100 900",
  }),
  ...(["400", "500", "700"] as const).map((weight) =>
    loadFont({
      family: MONO,
      url: staticFile(`fonts/jetbrains-mono-latin-${weight}-normal.woff2`),
      weight,
    }),
  ),
]);
