import { hexToRgb, paletteColor, semanticColor } from "../lib/design.mjs";

// Xcode 27 workspace recipes store sRGB colors as OKLCH coordinates.
// Workspace themes: https://developer.apple.com/documentation/xcode/customizing-your-workspace-using-themes
export function workspaceColor(hex) {
  const [red, green, blue] = hexToRgb(hex).map((byte) => {
    const channel = byte / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const lightness = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const chroma = Math.hypot(a, b);
  const radians = chroma > 1e-12 ? (Math.atan2(b, a) + 2 * Math.PI) % (2 * Math.PI) : 0;

  return {
    chroma: { exact: chroma },
    gamut: "sRGB",
    hue: { radians },
    lightness: { exact: lightness },
    opacity: 1,
  };
}

export function workspaceTheme(variant, syntax) {
  const palette = variant.palette;
  const color = (token) => workspaceColor(paletteColor(palette, token));
  const colorOverrides = Object.fromEntries(
    Object.entries(syntax.xcode_workspace).map(([scope, role]) => [
      scope,
      { color: workspaceColor(semanticColor(palette, syntax, role)) },
    ]),
  );
  for (const [scope, token] of Object.entries({
    debugger: "syntax.function",
    diffAddition: "git.added",
    diffDeletion: "git.deleted",
    insertionPointColor: "syntax.type",
    invisibles: "foreground.muted",
    currentLineHighlight: "line.active",
  })) {
    colorOverrides[scope] = { color: color(token) };
  }
  colorOverrides.selectedTextBackgroundColor = {
    colorWithOpacity: color("selection.background"),
  };

  return {
    fileVersion: 1,
    recipe: {
      background: { customColor: color("background.primary") },
      colorScheme: "dark",
      palette: {
        colorOverrides,
        primary: { custom: color("background.primary") },
        secondary: { custom: color("background.secondary") },
      },
    },
  };
}
