import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadDesign, repositoryRoot } from "../generators/lib/design.mjs";
import { workspaceColor } from "../generators/xcode/workspace.mjs";

function hexFromWorkspaceColor(color) {
  const lightness = color.lightness.exact;
  const a = color.chroma.exact * Math.cos(color.hue.radians);
  const b = color.chroma.exact * Math.sin(color.hue.radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ].map((linear) => {
    const srgb = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, srgb)) * 255).toString(16).padStart(2, "0");
  });
  return `#${channels.join("")}`.toUpperCase();
}

test("Xcode workspace conversion matches reference OKLCH colors", () => {
  const black = workspaceColor("#000000");
  assert.equal(black.lightness.exact, 0);
  assert.equal(black.chroma.exact, 0);
  assert.equal(black.hue.radians, 0);
  const red = workspaceColor("#FF0000");
  assert.ok(Math.abs(red.lightness.exact - 0.62795536) < 1e-7);
  assert.ok(Math.abs(red.chroma.exact - 0.25768331) < 1e-7);
  assert.ok(Math.abs(red.hue.radians - 0.51022755) < 1e-7);
  assert.throws(() => workspaceColor("#invalid"), /six-digit hex color/);
});

test("Xcode 27 artifacts preserve palette colors and the selection encoding", async () => {
  const { variants } = await loadDesign();
  for (const variant of variants) {
    const theme = JSON.parse(await readFile(
      resolve(repositoryRoot, "themes/xcode", `${variant.name}.xcworkspacecolortheme`),
      "utf8",
    ));
    assert.equal(theme.fileVersion, 1);
    assert.equal(theme.recipe.colorScheme, "dark");
    assert.equal(hexFromWorkspaceColor(theme.recipe.background.customColor), variant.palette["background.primary"]);
    assert.equal(hexFromWorkspaceColor(theme.recipe.palette.primary.custom), variant.palette["background.primary"]);
    assert.equal(hexFromWorkspaceColor(theme.recipe.palette.secondary.custom), variant.palette["background.secondary"]);

    const overrides = theme.recipe.palette.colorOverrides;
    for (const [scope, token] of Object.entries({
      plainText: "foreground.primary",
      keyword: "syntax.keyword",
      memberDeclaration: "syntax.function",
      "projectMember.function": "syntax.function",
      "otherMember.function": "syntax.function",
      string: "syntax.string",
      "string.regex": "syntax.regex",
      comment: "syntax.comment",
      commentEmphasized: "syntax.doc_comment",
      number: "syntax.number",
      insertionPointColor: "syntax.type",
      currentLineHighlight: "line.active",
      diffAddition: "git.added",
      diffDeletion: "git.deleted",
    })) {
      assert.equal(hexFromWorkspaceColor(overrides[scope].color), variant.palette[token], `${variant.id}: ${scope}`);
    }
    assert.equal(
      hexFromWorkspaceColor(overrides.selectedTextBackgroundColor.colorWithOpacity),
      variant.palette["selection.background"],
    );
    assert.equal(overrides.selectedTextBackgroundColor.color, undefined);
  }
});
