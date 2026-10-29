import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDesign, repositoryRoot } from '../generators/lib/design.mjs';

export async function validateIcons(root = repositoryRoot) {
  const family = JSON.parse(await readFile(resolve(root, 'icon_themes/darkstar-nova-icons.json')));
  const { variants } = await loadDesign();
  assert.equal(family.$schema, 'https://zed.dev/schema/icon_themes/v0.3.0.json');
  assert.equal(family.author, 'Chris Nicholson');
  assert.equal(family.themes.length, variants.length);
  const referenced = new Set();
  for (const [index, theme] of family.themes.entries()) {
    const variant = variants[index];
    assert.equal(theme.name, `${variant.name} Icons`);
    assert.equal(theme.appearance, 'dark');
    assert.ok(theme.file_icons.default);
    const palette = new Set(Object.values(variant.palette));
    for (const mapping of [theme.file_stems, theme.file_suffixes]) {
      for (const key of Object.values(mapping)) assert.ok(theme.file_icons[key], `Unknown icon: ${key}`);
    }
    const pairs = [theme.directory_icons, theme.chevron_icons, ...Object.values(theme.named_directory_icons)];
    const paths = Object.values(theme.file_icons).map(({ path }) => path);
    for (const pair of pairs) {
      assert.notEqual(pair.collapsed, pair.expanded);
      paths.push(pair.collapsed, pair.expanded);
    }
    for (const asset of new Set(paths)) {
      assert.match(asset, new RegExp(`^\\./icons/${variant.id}/[a-z-]+\\.svg$`));
      const svg = await readFile(resolve(root, asset), 'utf8');
      assert.match(svg, /viewBox="0 0 16 16"/);
      assert.ok(!/<(?:text|image|script|foreignObject|filter)\b|(?:href|style)=|url\(/i.test(svg), asset);
      assert.ok(!svg.includes('undefined'), asset);
      for (const color of svg.match(/#[\da-f]{6}/gi) ?? []) assert.ok(palette.has(color), `${asset}: ${color}`);
      referenced.add(asset);
    }
  }
  for (const variant of variants) {
    for (const file of await readdir(resolve(root, 'icons', variant.id))) {
      assert.ok(referenced.has(`./icons/${variant.id}/${file}`), `Unreferenced icon: ${file}`);
    }
  }
  console.log(`Validated ${family.themes.length} icon themes and ${referenced.size} SVG assets.`);
  return family;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await validateIcons();
