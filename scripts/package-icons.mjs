import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { repositoryRoot, loadDesign } from '../generators/lib/design.mjs';
import { generateIcons } from '../generators/zed/icons.mjs';
import { validateIcons } from './validate-icons.mjs';

await generateIcons(await loadDesign());
await validateIcons();
const output = resolve(process.argv[2] ?? resolve(repositoryRoot, 'dist/darkstar-nova-icons.zip'));
// Unique staging avoids bundling unrelated repository files or stale assets.
const staging = await mkdtemp(resolve(tmpdir(), 'darkstar-nova-icons-'));
const extension = resolve(staging, 'darkstar-nova-icons');
await mkdir(extension);
for (const name of ['icons', 'icon_themes', 'LICENSE']) {
  await cp(resolve(repositoryRoot, name), resolve(extension, name), { recursive: true });
}
await writeFile(resolve(extension, 'extension.toml'), `id = "darkstar-nova-icons"
name = "Darkstar Nova Icons"
version = "1.0.0"
schema_version = 1
authors = ["Chris Nicholson"]
description = "Original 16px project-panel icons matching Darkstar Nova Classic, Ultra, and Stealth."
repository = "https://github.com/ChrisNicholson30/darkstar-nova"
`);
await writeFile(resolve(extension, 'README.md'), await readFile(resolve(repositoryRoot, 'design/icons.md')));
await mkdir(resolve(output, '..'), { recursive: true });
// Write a fresh archive rather than updating an existing zip (which retains deleted entries).
const archive = resolve(staging, 'darkstar-nova-icons.zip');
execFileSync('zip', ['-q', '-r', archive, 'darkstar-nova-icons'], { cwd: staging });
await cp(archive, output);
console.log(`Icon extension ready: ${output}`);
