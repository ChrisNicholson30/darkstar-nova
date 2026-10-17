import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolve(
  fileURLToPath(new URL("../../", import.meta.url)),
);

async function readJson(path) {
  return JSON.parse(await readFile(resolve(repositoryRoot, path), "utf8"));
}

export async function loadDesign() {
  const [tokens, syntax] = await Promise.all([
    readJson("design/tokens.json"),
    readJson("design/syntax.json"),
  ]);
  const variants = await Promise.all(
    tokens.variant_order.map((id) => readJson(`design/variants/${id}.json`)),
  );

  return { tokens, syntax, variants };
}

export function paletteColor(palette, token) {
  const color = palette[token];
  if (!color) throw new Error(`Missing palette token: ${token}`);
  return color;
}

export function semanticColor(palette, syntax, role) {
  const token = syntax.semantic_roles[role];
  if (!token) throw new Error(`Missing semantic role: ${role}`);
  return paletteColor(palette, token);
}

export function hexToRgb(hex) {
  if (!/^#[\da-f]{6}$/i.test(hex)) {
    throw new Error(`Expected a six-digit hex color, got ${hex}`);
  }
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

export function withAlpha(hex, alphaByte) {
  return `${hex}${alphaByte.toString(16).padStart(2, "0")}`;
}

export function xcodeColor(hex) {
  const components = hexToRgb(hex).map((component) => (component / 255).toFixed(6));
  return `${components.join(" ")} 1`;
}

export function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
