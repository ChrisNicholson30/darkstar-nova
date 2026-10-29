import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { repositoryRoot, xmlEscape } from '../lib/design.mjs';

// Original 16px geometry. No fonts, external resources, filters, or brand assets.
const path = (d) => `<path d="${d}"/>`;
const circle = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const shapes = {
  code: path('m5 5-3 3 3 3m6-6 3 3-3 3M9 3 7 13'),
  react: `<ellipse cx="8" cy="8" rx="6" ry="2.3"/><ellipse cx="8" cy="8" rx="6" ry="2.3" transform="rotate(60 8 8)"/><ellipse cx="8" cy="8" rx="6" ry="2.3" transform="rotate(120 8 8)"/>${circle(8, 8, .7)}`,
  braces: path('M6 2H5c-1 0-1 1-1 2v2L2 8l2 2v2c0 1 0 2 1 2h1m4-12h1c1 0 1 1 1 2v2l2 2-2 2v2c0 1 0 2-1 2h-1'),
  database: `<ellipse cx="8" cy="3.5" rx="5.5" ry="2"/>${path('M2.5 3.5v9c0 2.7 11 2.7 11 0v-9M2.5 8c0 2.7 11 2.7 11 0')}`,
  config: `${path('m8 1.5 2 2 2.8.2.2 2.8 1.5 1.5-1.5 1.5-.2 2.8-2.8.2-2 2-2-2-2.8-.2-.2-2.8L1.5 8 3 6.5l.2-2.8L6 3.5Z')}${circle(8, 8, 2)}`,
  test: path('M6 2h4M7 2v5l-4 5c-.7 1-.2 2 1 2h8c1.2 0 1.7-1 1-2L9 7V2M5 10h6'),
  image: `${path('M2 2.5h12v11H2Zm0 8 3.5-4 4 4 2-2L14 11')}${circle(10.5, 5, 1)}`,
  git: `${circle(5, 3, 1.5)}${circle(11, 5, 1.5)}${circle(5, 13, 1.5)}${path('M5 4.5v7M11 6.5v1c0 2.5-6 1-6 4')}`,
  terminal: path('m3 4 4 4-4 4m6 0h4'),
  document: path('M9.5 1.5h-7v13h11v-9Zm0 0v4h4M5 8h5M5 11h5'),
  markdown: path('M1.5 4h13v8h-13Zm2 6V6l2 2 2-2v4m3-4v4m-1.5-1.5L10.5 10 12 8.5'),
  package: path('m8 1.5 6 3.3v6.4l-6 3.3-6-3.3V4.8Zm-6 3.3L8 8l6-3.2M8 8v6.5M5 3.2l6 3.2'),
  lock: `${path('M3.5 7h9v7h-9ZM5 7V4.5a3 3 0 0 1 6 0V7M8 10v1.5')}`,
  shield: path('m8 1.5 5.5 2v4c0 3-2.5 5.5-5.5 7-3-1.5-5.5-4-5.5-7v-4Zm-2.5 6L7.5 10l3-4'),
  cloud: path('M4.5 12.5h7a3 3 0 0 0 .5-6 4.5 4.5 0 0 0-8.5-1 3.5 3.5 0 0 0 1 7Z'),
  bolt: path('m9 1.5-6 7h4l-1 6 7-8H9Z'),
  check: path('m2.5 8 3.5 3.5L13.5 4'),
  layers: path('m8 1.5 6 3.3L8 8 2 4.8Zm-6 6L8 11l6-3.5M2 11l6 3.5 6-3.5'),
  component: path('M2 2h4v4H2Zm8 0h4v4h-4ZM2 10h4v4H2Zm10-1 3 3-3 3-3-3Z'),
  api: `${circle(3, 8, 1.5)}${circle(12, 3, 1.5)}${circle(12, 13, 1.5)}${path('M4.5 8H7V3h3.5M7 8v5h3.5')}`,
  globe: `${circle(8, 8, 6)}<ellipse cx="8" cy="8" rx="2.5" ry="6"/>${path('M2 8h12')}`,
  palette: `${path('M8 2a6 6 0 1 0 0 12c1.5 0 2-1.5 1-2.5-.7-1 .2-2 1.5-2h1a2.5 2.5 0 0 0 0-5A6 6 0 0 0 8 2Z')}${circle(5, 6, .5)}${circle(8, 4.5, .5)}${circle(11, 6, .5)}`,
  star: path('m8 1 1.8 4.9L15 8l-5.2 1.7L8 15 6.2 9.7 1 8l5.2-2.1Z'),
  audio: path('M6 11V3l7-1v8M6 5l7-1M6 11c-4-2-5 4-1 3 1-.3 1-1 1-3Zm7-1c-4-2-5 4-1 3 1-.3 1-1 1-3Z'),
  video: path('M2 3h9v10H2Zm9 4 3-2v6l-3-2'),
  font: path('M2 13 6.5 3 11 13M4 9h5m1-3h4m-2 0v7'),
  archive: path('M2 2h12v3H2Zm1 3v9h10V5M6 8h4'),
  link: path('m6 10 4-4M6 5l2-2a3 3 0 0 1 5 4l-2 2M5 6 3 8a3 3 0 0 0 4 5l2-2'),
  rust: `${circle(8, 8, 5)}${path('M8 1v2m0 10v2M1 8h2m10 0h2M3 3l1.5 1.5m7 7L13 13M3 13l1.5-1.5m7-7L13 3M6 11V5h2.5a1.5 1.5 0 0 1 0 3H6m2 0 2.5 3')}`,
  python: path('M3 7V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4H6v3H3a2 2 0 0 1-2-2V7Zm10 2v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8h5V5h3a2 2 0 0 1 2 2v2ZM7 4h.1m2 8h.1'),
  swift: path('m2 4 5 5-2-7 7 6c2 2 2 4 2 6l-3-2C7 15 2 12 2 9l5 2Z'),
  vue: path('M1 3h4l3 5 3-5h4L8 14Zm4 0h2l1 2 1-2h2'),
  docker: `${path('M2 7h11c0 4-3 6-6 6-4 0-5-2-5-6ZM4 7V4h3v3m0-3V1h3v6M1 9h1m11-2 2-2')}`,
};

// Tiny technical letterforms are paths, so SVG rasterizers never need a font.
const letters = {
  T: 'M2 4h5M4.5 4v8', S: 'M14 4h-3a2 2 0 0 0 0 4h1a2 2 0 0 1 0 4H9',
  J: 'M2 10c0 3 4 3 4 0V4H3', C: 'M11 4H7a4 4 0 0 0 0 8h4',
  P: 'M4 12V4h4a2.5 2.5 0 0 1 0 5H4', H: 'M3 4v8m5-8v8M3 8h5',
  G: 'M12 5a5 5 0 1 0 0 6V8H8', R: 'M4 12V4h4a2.5 2.5 0 0 1 0 5H4m4 0 4 3',
};
shapes.typescript = path(letters.T + letters.S);
shapes.javascript = path(letters.J + letters.S);
shapes.c = path(letters.C);
shapes.cpp = path(letters.C + 'M12 6v4m-2-2h4');
shapes.go = path(letters.G);
shapes.php = path(letters.P);
shapes.ruby = path('m5 2-3 4 6 8 6-8-3-4Zm-3 4h12M5 2l3 12 3-12');
shapes.java = path('M4 7h7v4c0 3-7 3-7 0Zm7 1h1a2 2 0 0 1 0 4h-1M6 5c-2-2 2-2 0-4m3 4c-2-2 2-2 0-4');
shapes.kotlin = path('M2 2h12L8 8l6 6H2Zm0 12L14 2');
shapes.svelte = path('m12 3-3-1c-4-1-8 5-4 7l4 1m-5 3 3 1c4 1 8-5 4-7L7 6');
shapes.astro = path('m3 11 3-9h4l3 9-5-2Zm3 2 2 2 2-2');

export const fileTypes = {
  default: ['document', 'foreground.muted', ''],
  typescript: ['typescript', 'accent.blue', 'ts mts cts'],
  javascript: ['javascript', 'syntax.number', 'js mjs cjs'],
  react: ['react', 'syntax.type', 'tsx jsx mtsx ctsx'],
  rust: ['rust', 'syntax.number', 'rs'], swift: ['swift', 'syntax.number', 'swift'],
  python: ['python', 'syntax.string', 'py pyi pyw ipynb'],
  go: ['go', 'syntax.type', 'go'], ruby: ['ruby', 'status.error', 'rb rake gemspec'],
  java: ['java', 'syntax.number', 'java jar'], kotlin: ['kotlin', 'accent.purple', 'kt kts'],
  c: ['c', 'accent.blue', 'c h'], cpp: ['cpp', 'accent.blue', 'cpp cc cxx hpp hxx'],
  csharp: ['code', 'accent.purple', 'cs csx'], php: ['php', 'accent.purple', 'php phtml'],
  vue: ['vue', 'syntax.string', 'vue'], svelte: ['svelte', 'syntax.number', 'svelte'],
  astro: ['astro', 'syntax.constant', 'astro'],
  html: ['code', 'syntax.number', 'html htm xhtml'],
  css: ['palette', 'accent.blue', 'css pcss postcss'],
  sass: ['palette', 'syntax.constant', 'scss sass less'],
  json: ['braces', 'syntax.number', 'json jsonc json5'],
  yaml: ['layers', 'accent.purple', 'yml yaml'], toml: ['config', 'syntax.number', 'toml'],
  config: ['config', 'foreground.secondary', 'ini conf cfg config editorconfig'],
  xml: ['code', 'syntax.number', 'xml plist xaml xib storyboard entitlements'],
  markdown: ['markdown', 'accent.blue', 'md markdown mdx'],
  document: ['document', 'foreground.secondary', 'txt rst rtf doc docx pdf odt tex'],
  database: ['database', 'syntax.type', 'sql db sqlite sqlite3 prisma'],
  data: ['database', 'syntax.string', 'csv tsv parquet'],
  graphql: ['api', 'syntax.constant', 'graphql gql graphqls'],
  shell: ['terminal', 'syntax.string', 'sh bash zsh fish ps1 bat cmd nu zshrc bashrc zprofile'],
  git: ['git', 'syntax.number', 'gitignore gitattributes gitmodules gitkeep diff patch'],
  image: ['image', 'syntax.constant', 'svg png jpg jpeg gif webp avif ico icns heic bmp tiff'],
  audio: ['audio', 'accent.purple', 'mp3 wav ogg flac m4a aac'],
  video: ['video', 'syntax.constant', 'mp4 mov mkv webm avi'],
  font: ['font', 'status.warning', 'woff woff2 ttf otf'],
  archive: ['archive', 'syntax.number', 'zip gz tar tgz bz2 xz 7z rar'],
  lock: ['lock', 'foreground.muted', 'lock lockb'],
  docker: ['docker', 'syntax.type', 'dockerfile'],
  terraform: ['layers', 'accent.purple', 'tf tfvars hcl'],
  test: ['test', 'syntax.string', 'test.ts test.tsx test.js test.jsx spec.ts spec.tsx spec.js spec.jsx test.mjs test.py'],
  types: ['code', 'syntax.type', 'd.ts d.mts d.cts'],
  package: ['package', 'syntax.string', ''],
  shield: ['shield', 'syntax.string', 'pem crt cer key pub'],
  log: ['terminal', 'foreground.muted', 'log out'],
  settings: ['config', 'accent.purple', ''],
  cloud: ['cloud', 'accent.blue', ''],
  bolt: ['bolt', 'status.warning', ''],
  license: ['shield', 'status.warning', ''],
  link: ['link', 'accent.blue', 'url webloc'],
  code: ['code', 'foreground.secondary', 'lua luau ex exs erl hs ml r R jl dart zig nix sol wgsl metal glsl vert frag'],
};

export const folderTypes = {
  source: ['code', 'accent.blue', 'src source sources app apps'],
  components: ['component', 'syntax.type', 'components ui widgets views'],
  routes: ['api', 'accent.blue', 'routes pages screens navigation'],
  api: ['api', 'syntax.type', 'api server services endpoints functions'],
  hooks: ['link', 'accent.purple', 'hooks composables'],
  lib: ['layers', 'accent.purple', 'lib libs shared common utils utilities helpers'],
  styles: ['palette', 'syntax.constant', 'styles style css scss sass stylesheets'],
  assets: ['image', 'syntax.constant', 'assets images img media icons fonts'],
  public: ['globe', 'syntax.string', 'public static www'],
  tests: ['test', 'syntax.string', 'test tests __tests__ e2e specs __mocks__ fixtures'],
  config: ['config', 'foreground.secondary', 'config configs configuration settings .config .zed .vscode .idea'],
  docs: ['document', 'accent.blue', 'docs doc documentation notes'],
  scripts: ['terminal', 'syntax.string', 'scripts bin tools tooling'],
  database: ['database', 'syntax.type', 'database db sql prisma schema schemas'],
  migrations: ['database', 'syntax.number', 'migrations seeds'],
  supabase: ['bolt', 'syntax.string', 'supabase'],
  git: ['git', 'syntax.number', '.git .github .gitlab'],
  build: ['package', 'syntax.number', 'build dist out output target release releases'],
  packages: ['package', 'accent.purple', 'packages crates modules vendor node_modules .pnpm'],
  docker: ['docker', 'syntax.type', 'docker containers .devcontainer'],
  cloud: ['cloud', 'accent.blue', 'infra infrastructure deploy deployment terraform kubernetes k8s .aws'],
  security: ['shield', 'syntax.string', 'auth security certificates certs'],
  design: ['palette', 'accent.purple', 'design themes previews'],
  types: ['code', 'syntax.type', 'types typings interfaces models'],
  state: ['layers', 'syntax.number', 'store stores state context contexts'],
  features: ['component', 'accent.purple', 'features domains'],
  swift: ['swift', 'syntax.number', 'Sources'],
  cache: ['archive', 'foreground.muted', '.cache .next .nuxt coverage logs tmp temp'],
  nova: ['star', 'accent.blue', 'darkstar darkstar-nova'],
};

export const fileStems = {
  'package.json': 'package', 'package-lock.json': 'lock', 'pnpm-lock.yaml': 'lock',
  'yarn.lock': 'lock', 'bun.lock': 'lock', 'bun.lockb': 'lock', 'Cargo.lock': 'lock',
  'Cargo.toml': 'rust', 'go.mod': 'go', 'go.sum': 'lock', 'Gemfile': 'ruby',
  'Gemfile.lock': 'lock', 'Podfile': 'swift', 'Package.swift': 'swift',
  Dockerfile: 'docker', Containerfile: 'docker', '.dockerignore': 'docker',
  'docker-compose.yml': 'docker', 'docker-compose.yaml': 'docker',
  'compose.yml': 'docker', 'compose.yaml': 'docker',
  '.env': 'shield', '.env.local': 'shield', '.env.example': 'shield',
  '.env.production': 'shield', '.env.development': 'shield', '.env.test': 'shield',
  '.gitignore': 'git', '.gitattributes': 'git', '.gitmodules': 'git', '.gitkeep': 'git',
  '.editorconfig': 'settings', '.prettierrc': 'settings', '.prettierignore': 'settings',
  'tsconfig.json': 'typescript', 'jsconfig.json': 'javascript',
  'vite.config.ts': 'bolt', 'vite.config.js': 'bolt',
  'vitest.config.ts': 'test', 'playwright.config.ts': 'test', 'jest.config.js': 'test',
  'eslint.config.js': 'settings', 'eslint.config.mjs': 'settings', '.eslintrc.json': 'settings',
  'wrangler.toml': 'cloud', 'wrangler.json': 'cloud', 'wrangler.jsonc': 'cloud',
  'README.md': 'markdown', 'CHANGELOG.md': 'markdown', 'AGENTS.md': 'star',
  'CLAUDE.md': 'star', 'LICENSE': 'license', 'LICENSE.md': 'license', 'LICENCE': 'license',
  Makefile: 'shell', Justfile: 'shell', '.zshrc': 'shell', '.bashrc': 'shell',
};
fileTypes.star = ['star', 'accent.purple', ''];

export function svg(body, color, strokeWidth = 1.25) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>\n`;
}

function folder(body, color, expanded) {
  const outline = expanded
    ? 'M1.5 12.5v-9h4l1.5 2h6v2M1.5 12.5l1.5-5h11.5l-1.5 6h-11Z'
    : 'M1.5 13.5v-10h4l1.5 2h7v8.5Z';
  // Quiet translucent silhouette plus a small, legible semantic badge.
  return svg(`<path d="${outline}" fill="${color}" fill-opacity="0.08"/>` +
    (body ? `<g transform="translate(7 7.2) scale(.43)" stroke-width="2.1">${body}</g>` : ''), color);
}

export async function generateIcons(design, root = repositoryRoot) {
  const themes = [];
  for (const variant of design.variants) {
    const directory = resolve(root, 'icons', variant.id);
    await mkdir(directory, { recursive: true });
    const assetPath = (name) => `./icons/${variant.id}/${name}.svg`;
    const save = (name, content) => writeFile(resolve(directory, `${name}.svg`), content);
    const file_icons = {};
    const file_suffixes = {};
    for (const [name, [shape, token, suffixes]] of Object.entries(fileTypes)) {
      await save(name, svg(shapes[shape], variant.palette[token]));
      file_icons[name] = { path: assetPath(name) };
      for (const suffix of suffixes.split(' ').filter(Boolean)) file_suffixes[suffix] = name;
    }
    const pair = (name) => ({ collapsed: assetPath(name), expanded: assetPath(`${name}-open`) });
    await save('folder', folder('', variant.palette['accent.blue'], false));
    await save('folder-open', folder('', variant.palette['accent.blue'], true));
    const named_directory_icons = {};
    for (const [name, [shape, token, aliases]] of Object.entries(folderTypes)) {
      for (const expanded of [false, true]) {
        await save(`folder-${name}${expanded ? '-open' : ''}`, folder(shapes[shape], variant.palette[token], expanded));
      }
      for (const alias of aliases.split(' ')) named_directory_icons[alias] = pair(`folder-${name}`);
    }
    await save('chevron-right', svg(path('m6 4 4 4-4 4'), variant.palette['foreground.muted']));
    await save('chevron-down', svg(path('m4 6 4 4 4-4'), variant.palette['foreground.muted']));
    themes.push({ name: `${variant.name} Icons`, appearance: 'dark',
      directory_icons: pair('folder'), named_directory_icons,
      chevron_icons: { collapsed: assetPath('chevron-right'), expanded: assetPath('chevron-down') },
      file_stems: fileStems, file_suffixes, file_icons });
  }
  const family = { $schema: 'https://zed.dev/schema/icon_themes/v0.3.0.json',
    name: 'Darkstar Nova Icons', author: 'Chris Nicholson', themes };
  await mkdir(resolve(root, 'icon_themes'), { recursive: true });
  await writeFile(resolve(root, 'icon_themes/darkstar-nova-icons.json'), JSON.stringify(family, null, 2) + '\n');
  await generatePreview(design, root);
  return family;
}

async function generatePreview(design, root) {
  const pieces = [];
  const text = (x, y, content, color, size = 12) => `<text x="${x}" y="${y}" fill="${color}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="${size}">${xmlEscape(content)}</text>`;
  for (const [index, { id, name, palette: p }] of design.variants.entries()) {
    const x = index * 360;
    pieces.push(`<g transform="translate(${x} 0)"><rect width="360" height="1120" fill="${p['background.secondary']}"/>`);
    pieces.push(text(24, 39, name, p['foreground.primary'], 19));
    pieces.push(text(24, 63, 'PROJECT PANEL · 16px', p['foreground.muted'], 10));
    const rows = [
      ['folder-nova-open', 'darkstar-nova', 0], ['folder-source-open', 'src', 1],
      ['folder-components-open', 'components', 2], ['react', 'App.tsx', 3],
      ['typescript', 'Button.ts', 3], ['folder-hooks', 'hooks', 2],
      ['folder-styles-open', 'styles', 2], ['css', 'nova.css', 3],
      ['folder-api', 'api', 2], ['folder-types', 'types', 2],
      ['folder-tests-open', 'tests', 1], ['test', 'App.test.tsx', 2],
      ['folder-supabase-open', 'supabase', 1], ['folder-migrations-open', 'migrations', 2],
      ['database', '001_schema.sql', 3], ['folder-assets', 'assets', 1],
      ['folder-git', '.github', 1], ['folder-docs', 'docs', 1],
      ['package', 'package.json', 1], ['lock', 'pnpm-lock.yaml', 1],
      ['settings', 'eslint.config.js', 1], ['shield', '.env.local', 1],
      ['markdown', 'README.md', 1], ['star', 'AGENTS.md', 1],
    ];
    for (const [i, [icon, label, indent]] of rows.entries()) {
      const y = 88 + i * 25;
      if (label === 'App.tsx') pieces.push(`<rect x="12" y="${y - 4}" width="336" height="24" rx="4" fill="${p['selection.background']}"/>`);
      if (icon.startsWith('folder')) pieces.push(`<image x="${17 + indent * 14}" y="${y}" width="12" height="16" href="../icons/${id}/chevron-${icon.endsWith('-open') ? 'down' : 'right'}.svg"/>`);
      pieces.push(`<image x="${32 + indent * 14}" y="${y}" width="16" height="16" href="../icons/${id}/${icon}.svg"/>`);
      pieces.push(text(57 + indent * 14, y + 12, label, p['foreground.secondary']));
    }
    pieces.push(text(24, 736, 'LANGUAGE &amp; FILE GLYPHS'.replace('&amp;', '&'), p['foreground.muted'], 10));
    const samples = ['typescript', 'javascript', 'react', 'rust', 'swift', 'python', 'go', 'ruby', 'java', 'kotlin', 'vue', 'svelte', 'astro', 'html', 'css', 'json', 'yaml', 'toml', 'database', 'graphql', 'docker', 'cloud', 'image', 'audio', 'video', 'font', 'archive', 'license', 'shell', 'git'];
    for (const [i, icon] of samples.entries()) {
      const cx = 24 + (i % 3) * 110, cy = 762 + Math.floor(i / 3) * 31;
      pieces.push(`<image x="${cx}" y="${cy}" width="16" height="16" href="../icons/${id}/${icon}.svg"/>`);
      pieces.push(text(cx + 23, cy + 12, icon, p['foreground.secondary'], 10));
    }
    pieces.push('</g>');
  }
  // Inline all symbols so the preview is a portable, self-contained SVG.
  const { readFile } = await import('node:fs/promises');
  let output = pieces.join('');
  const matches = [...output.matchAll(/<image x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" href="\.\.\/(icons\/[^\"]+)"\/>/g)];
  for (const [match, x, y, w, h, asset] of matches) {
    const content = await readFile(resolve(root, asset), 'utf8');
    output = output.replace(match, content.replace('<svg ', `<svg x="${x}" y="${y}" `).replace('width="16" height="16"', `width="${w}" height="${h}"`));
  }
  await mkdir(resolve(root, 'previews'), { recursive: true });
  await writeFile(resolve(root, 'previews/icons.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1120" viewBox="0 0 1080 1120" role="img" aria-label="Darkstar Nova icon design preview, Classic, Ultra and Stealth">${output}</svg>\n`);
}
