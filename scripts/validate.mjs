import { readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { repositoryRoot } from "../generators/lib/design.mjs";

const errorList = [];

function check(condition, message) {
  if (!condition) errorList.push(message);
}

function isHexColor(value) {
  return typeof value === "string" && /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value);
}

async function json(path) {
  return JSON.parse(await readFile(resolve(repositoryRoot, path), "utf8"));
}

const designTokens = await json("design/tokens.json");
const semanticSyntax = await json("design/syntax.json");
const zedSchema = await json("design/zed-theme-schema-v0.2.0.json");
const variantIds = designTokens.variant_order;
const variants = await Promise.all(
  variantIds.map((id) => json(`design/variants/${id}.json`)),
);

check(
  JSON.stringify(variants.map((variant) => variant.id)) === JSON.stringify(variantIds),
  "Variant file IDs must match design/tokens.json order.",
);

for (const variant of variants) {
  for (const token of designTokens.required_palette_tokens) {
    check(
      isHexColor(variant.palette[token]),
      `${variant.id}: ${token} must be a six-digit hex color.`,
    );
  }

  for (const [role, token] of Object.entries(semanticSyntax.semantic_roles)) {
    check(
      isHexColor(variant.palette[token]),
      `${variant.id}: semantic role ${role} resolves to missing/invalid ${token}.`,
    );
  }

  for (const [platform, mappings] of Object.entries(semanticSyntax)) {
    if (!["zed", "xcode", "xcode_workspace", "jetbrains"].includes(platform)) continue;
    for (const [scope, role] of Object.entries(mappings)) {
      check(
        typeof semanticSyntax.semantic_roles[role] === "string",
        `${platform}.${scope} refers to unknown semantic role ${role}.`,
      );
    }
  }
}

const ultra = variants.find(({ id }) => id === "ultra");
const ultraSignatures = {
  "background.primary": "#171B26",
  "background.secondary": "#11151E",
  "foreground.primary": "#E8EDF7",
  "syntax.keyword": "#C792EA",
  "syntax.function": "#82AAFF",
  "syntax.string": "#C3E88D",
  "syntax.type": "#89DDFF",
  "syntax.number": "#FFC777",
  "syntax.constant": "#FF7AB6",
  "syntax.error": "#FF647C",
  "syntax.comment": "#8290A5",
};
for (const [token, expected] of Object.entries(ultraSignatures)) {
  check(ultra.palette[token] === expected, `Ultra signature token ${token} must be ${expected}.`);
}

const zedTheme = await json("themes/darkstar-nova.json");
check(zedTheme.$schema === "https://zed.dev/schema/themes/v0.2.0.json", "Zed theme must target the official v0.2.0 schema.");
check(zedSchema.source === zedTheme.$schema, "Offline Zed schema contract must match the theme's schema URL.");
for (const key of zedSchema.family_required) {
  check(Object.hasOwn(zedTheme, key), `Zed theme family is missing required property ${key}.`);
}
check(zedTheme.name === designTokens.family, "Zed theme family name must match design tokens.");
check(zedTheme.themes.length === variantIds.length, "Zed theme must include all three variants.");
for (const theme of zedTheme.themes) {
  for (const key of zedSchema.theme_required) {
    check(Object.hasOwn(theme, key), `${theme.name}: missing required property ${key}.`);
  }
  check(zedSchema.appearance_values.includes(theme.appearance), `${theme.name}: invalid appearance.`);
  check(theme.appearance === "dark", `${theme.name}: appearance must be dark.`);
  check(typeof theme.style === "object", `${theme.name}: style must be an object.`);
  for (const key of Object.keys(theme.style)) {
    check(
      zedSchema.style_properties.includes(key),
      `${theme.name}: ${key} is not a property in the official Zed theme schema.`,
    );
  }
  check(theme.style["background.appearance"] === "opaque", `${theme.name}: background appearance must use the supported opaque value.`);
  check(
    isHexColor(theme.style["editor.background"]),
    `${theme.name}: editor.background must be a hex color.`,
  );
  check(
    isHexColor(theme.style.syntax.keyword?.color),
    `${theme.name}: syntax.keyword.color must be a hex color.`,
  );
  check(
    isHexColor(theme.style.syntax["punctuation.bracket"]?.color),
    `${theme.name}: bracket punctuation must have a readable neutral color.`,
  );
  if (Array.isArray(theme.style.accents)) {
    for (const accent of theme.style.accents) {
      check(isHexColor(accent), `${theme.name}: accents must contain valid colors.`);
    }
  }
  if (theme.style.syntax && typeof theme.style.syntax === "object") {
    for (const [scope, highlight] of Object.entries(theme.style.syntax)) {
      check(
        highlight && typeof highlight === "object" && !Array.isArray(highlight),
        `${theme.name}: syntax.${scope} must be a highlight style.`,
      );
      if (!highlight || typeof highlight !== "object") continue;
      for (const [key, value] of Object.entries(highlight)) {
        check(
          zedSchema.highlight_style_properties.includes(key),
          `${theme.name}: syntax.${scope}.${key} is not a supported highlight property.`,
        );
        if (["color", "background_color"].includes(key) && value !== null) {
          check(
            isHexColor(value),
            `${theme.name}: syntax.${scope}.${key} must be a hex color.`,
          );
        }
      }
    }
  }
  for (const [key, color] of Object.entries(theme.style)) {
    if (key === "syntax" || key === "accents" || key === "players") continue;
    if (typeof color === "string" && color.startsWith("#")) {
      check(isHexColor(color), `${theme.name}: ${key} has invalid color ${color}.`);
    }
  }
}

const xcodeThemes = (await readdir(resolve(repositoryRoot, "themes/xcode"))).filter((file) =>
  file.endsWith(".xccolortheme"),
);
check(xcodeThemes.length === variantIds.length, "Expected one Xcode theme per variant.");
const workspaceThemes = (await readdir(resolve(repositoryRoot, "themes/xcode"))).filter((file) =>
  file.endsWith(".xcworkspacecolortheme"),
);
check(workspaceThemes.length === variantIds.length, "Expected one Xcode 27 workspace theme per variant.");
for (const variant of variants) {
  const theme = await json(`themes/xcode/${variant.name}.xcworkspacecolortheme`);
  check(theme.fileVersion === 1, `${variant.id}: unsupported workspace theme file version.`);
  check(theme.recipe?.colorScheme === "dark", `${variant.id}: workspace theme must use dark colors.`);
  const palette = theme.recipe?.palette;
  const colors = [
    ["background", theme.recipe?.background?.customColor],
    ["primary", palette?.primary?.custom],
    ["secondary", palette?.secondary?.custom],
  ];
  const overrides = palette?.colorOverrides ?? {};
  for (const scope of [
    ...Object.keys(semanticSyntax.xcode_workspace),
    "debugger", "diffAddition", "diffDeletion", "insertionPointColor",
    "invisibles", "currentLineHighlight", "selectedTextBackgroundColor",
  ]) {
    const encoding = scope === "selectedTextBackgroundColor" ? "colorWithOpacity" : "color";
    colors.push([scope, overrides[scope]?.[encoding]]);
  }
  for (const [scope, color] of colors) {
    check(
      color?.gamut === "sRGB" &&
        Number.isFinite(color.lightness?.exact) && color.lightness.exact >= 0 && color.lightness.exact <= 1 &&
        Number.isFinite(color.chroma?.exact) && color.chroma.exact >= 0 &&
        Number.isFinite(color.hue?.radians) && color.hue.radians >= 0 && color.hue.radians < 2 * Math.PI &&
        color.opacity === 1,
      `${variant.id}: ${scope} must be an opaque sRGB OKLCH workspace color.`,
    );
  }
}

const jetbrainsResources = resolve(repositoryRoot, "themes/jetbrains/src/main/resources");
const pluginXml = await readFile(resolve(jetbrainsResources, "META-INF/plugin.xml"), "utf8");
for (const attribute of Object.keys(semanticSyntax.jetbrains)) {
  check(attribute.startsWith("DEFAULT_"), `JetBrains attribute ${attribute} must use a standard DEFAULT_* scope.`);
}
for (const id of variantIds) {
  check(
    (await readFile(resolve(jetbrainsResources, `darkstar-nova-${id}.theme.json`), "utf8")).length > 0,
    `Missing JetBrains ${id} theme description.`,
  );
  check(
    (await readFile(resolve(jetbrainsResources, `darkstar-nova-${id}.xml`), "utf8")).length > 0,
    `Missing JetBrains ${id} editor scheme.`,
  );
  check(pluginXml.includes(`/darkstar-nova-${id}.theme.json`), `Plugin descriptor is missing ${id} theme provider.`);
  check(
    pluginXml.includes(`path="darkstar-nova-${id}" id="`),
    `Plugin descriptor is missing ${id} bundled color scheme.`,
  );
}

const terminalProfiles = await readdir(resolve(repositoryRoot, "themes/terminal")).catch(() => []);
if (process.platform === "darwin") {
  check(
    terminalProfiles.filter((file) => file.endsWith(".terminal")).length === variantIds.length,
    "Expected one native Terminal profile per variant.",
  );
}

if (process.platform === "darwin") {
  const plistFiles = [
    ...xcodeThemes.map((file) => resolve(repositoryRoot, "themes/xcode", file)),
    ...terminalProfiles
      .filter((file) => file.endsWith(".terminal"))
      .map((file) => resolve(repositoryRoot, "themes/terminal", file)),
  ];
  for (const file of plistFiles) {
    try {
      execFileSync("plutil", ["-lint", file], { stdio: "pipe" });
    } catch (error) {
      errorList.push(`Invalid plist ${file}: ${error.stderr?.toString() ?? error.message}`);
    }
  }
}

if (errorList.length) {
  console.error(errorList.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Validated shared tokens, the Zed v0.2.0 field contract, ${xcodeThemes.length} legacy and ${workspaceThemes.length} Xcode 27 themes, and JetBrains plugin assets.`,
  );
  if (process.platform === "darwin") console.log(`Validated ${variantIds.length} Terminal profile plists.`);
}
