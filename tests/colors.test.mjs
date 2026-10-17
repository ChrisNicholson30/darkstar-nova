import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  loadDesign,
  repositoryRoot,
} from "../generators/lib/design.mjs";

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test("all declared variants use valid palette tokens", async () => {
  const { tokens, variants } = await loadDesign();
  assert.deepEqual(variants.map(({ id }) => id), tokens.variant_order);

  for (const variant of variants) {
    for (const token of tokens.required_palette_tokens) {
      assert.match(variant.palette[token], /^#[\da-f]{6}$/i, `${variant.id}: ${token}`);
    }
  }
});

test("important syntax colors meet AA contrast where practical", async () => {
  const { variants } = await loadDesign();
  const syntaxTokens = Object.keys(variants[0].palette).filter((token) =>
    token.startsWith("syntax."),
  );

  for (const variant of variants) {
    for (const token of ["foreground.primary", "foreground.secondary", ...syntaxTokens]) {
      const ratio = contrastRatio(
        variant.palette[token],
        variant.palette["background.primary"],
      );
      assert.ok(ratio >= 4.5, `${variant.id}: ${token} contrast is ${ratio.toFixed(2)}:1`);
    }
  }
});

test("platform generated artifacts are present for all variants", async () => {
  const { variants } = await loadDesign();
  const zed = JSON.parse(
    await readFile(resolve(repositoryRoot, "themes/darkstar-nova.json"), "utf8"),
  );
  assert.equal(zed.themes.length, variants.length);

  for (const variant of variants) {
    const id = variant.id;
    const xcode = resolve(repositoryRoot, "themes/xcode", `${variant.name}.xccolortheme`);
    const theme = resolve(
      repositoryRoot,
      "themes/jetbrains/src/main/resources",
      `darkstar-nova-${id}.theme.json`,
    );
    const scheme = resolve(
      repositoryRoot,
      "themes/jetbrains/src/main/resources",
      `darkstar-nova-${id}.xml`,
    );
    await Promise.all([readFile(xcode), readFile(theme), readFile(scheme)]);
  }
});
