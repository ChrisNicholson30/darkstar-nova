# Darkstar Nova Icons

Original project-panel icons for Zed, drawn on a 16 × 16 grid with rounded 1.25px strokes. Classic, Ultra, and Stealth each use their matching Darkstar Nova palette. Folder badges use heavier strokes to remain legible at sidebar size; colour and shape work together to identify a role.

## Install

1. Extract `darkstar-nova-icons.zip`.
2. In Zed's command palette, run **zed: install dev extension** (or choose **Install Dev Extension** from Extensions).
3. Select the extracted **darkstar-nova-icons** folder, containing `extension.toml`.
4. Run **icon theme selector: toggle**, then select **Darkstar Nova Ultra Icons**, **Darkstar Nova Classic Icons**, or **Darkstar Nova Stealth Icons** to match your editor theme.

If you are developing from the full Darkstar Nova repository, select that repository as the dev extension instead. It contains both the editor themes and the icon themes. The existing shell theme installer only installs editor colours; use the dev extension to load icons. No Rust toolchain is needed for this asset-only extension.

Optional Zed settings:

```json
{
  "theme": "Darkstar Nova Ultra",
  "icon_theme": "Darkstar Nova Ultra Icons"
}
```

The icon variant is selected independently of the editor theme; it does not automatically follow Classic/Ultra/Stealth changes. The pack customises project folders, file icons (also used in tabs), and disclosure chevrons through Zed's public icon-theme API. Fixed dock/toolbar action buttons are not exposed by that API.

## Design

- Blue default folders, with distinct collapsed and expanded silhouettes.
- Semantic folders for source, components, routes, API, hooks, libraries, styling, assets, public files, tests, config, docs, scripts, databases, migrations, Supabase, Git, builds, packages, containers, infrastructure, security, design, types, state, features, Swift sources, caches, and Darkstar roots.
- Dedicated language glyphs plus document, media, config, data, package, lock, security, and tooling symbols. Test/spec and TypeScript declaration suffixes have dedicated associations.
- Exact filenames for common manifests, lockfiles, environment files, build tools, and agent instructions. Unknown files use a quiet document fallback.
- Self-contained SVGs: no fonts, network requests, image embeds, filters, or third-party logo assets.
- MIT licensed original geometry. Language glyphs are visual identifiers, not official brand artwork.

## Build and validate

```sh
npm run build:icons
npm run validate
npm test
npm run package:icons
```

The package command creates `dist/darkstar-nova-icons.zip`. It includes only the icon assets, icon-theme definitions, standalone extension manifest, this guide, and MIT licence. It does not install anything or edit user settings.

`previews/icons.svg` in the source repository is a generated design preview at native 16px icon size, with all three palettes and a representative project tree. It is not an in-app screenshot. Structural validation does not establish Zed runtime acceptance; check the selector and project panel in your installed Zed version.

The format follows [Zed's icon extension documentation](https://zed.dev/docs/extensions/icon-themes) and [v0.3.0 schema](https://zed.dev/schema/icon_themes/v0.3.0.json).
