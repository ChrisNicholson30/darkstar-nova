import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { loadDesign, repositoryRoot } from "../generators/lib/design.mjs";
import { generateJetBrains } from "../generators/jetbrains/generate.mjs";
import { generateXcode } from "../generators/xcode/generate.mjs";
import { generateZed } from "../generators/zed/generate.mjs";
import { generateIcons } from "../generators/zed/icons.mjs";

const design = await loadDesign();

await generateZed(design);
await generateIcons(design);
await generateXcode(design);
await generateJetBrains(design);

if (process.platform === "darwin") {
  const terminalGenerator = resolve(repositoryRoot, "generators/terminal/generate.swift");
  execFileSync("swift", [terminalGenerator, repositoryRoot], { stdio: "inherit" });
} else {
  console.log("Skipping native macOS Terminal profiles (requires Swift/AppKit).");
}

console.log(`Generated ${design.variants.length} Darkstar Nova variants.`);
