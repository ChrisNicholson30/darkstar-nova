import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  paletteColor,
  repositoryRoot,
  semanticColor,
  xmlEscape,
} from "../lib/design.mjs";

const themeProviderIds = {
  classic: "0c67b971-6d93-4f58-9f06-3d7dfb205417",
  ultra: "e8db41b8-7e8c-48b2-a02c-5ee15de6d3e1",
  stealth: "5197bf0d-c77f-4ee6-9c6e-4265f9a1a086",
};

function makeAttributes(palette, syntax) {
  const attributes = Object.fromEntries(
    Object.entries(syntax.jetbrains).map(([key, role]) => [
      key,
      semanticColor(palette, syntax, role),
    ]),
  );

  attributes.DEFAULT_TEXT = paletteColor(palette, "foreground.primary");
  attributes.BAD_CHARACTER = paletteColor(palette, "status.error");
  attributes.ERRORS_ATTRIBUTES = paletteColor(palette, "status.error");
  attributes.WARNING_ATTRIBUTES = paletteColor(palette, "status.warning");
  attributes.INFO_ATTRIBUTES = paletteColor(palette, "status.info");
  attributes.MATCHED_BRACE_ATTRIBUTES = paletteColor(palette, "accent.blue");
  attributes.UNMATCHED_BRACE_ATTRIBUTES = paletteColor(palette, "status.error");
  attributes.SEARCH_RESULT_ATTRIBUTES = paletteColor(palette, "selection.background");

  return attributes;
}

function renderScheme(name, palette, syntax) {
  const colors = {
    CARET_COLOR: paletteColor(palette, "syntax.type"),
    CONSOLE_BACKGROUND_KEY: paletteColor(palette, "background.primary"),
    GUTTER_BACKGROUND: paletteColor(palette, "background.primary"),
    LINE_NUMBERS_COLOR: paletteColor(palette, "foreground.muted"),
    RIGHT_MARGIN_COLOR: paletteColor(palette, "border.default"),
    SELECTION_BACKGROUND: paletteColor(palette, "selection.background"),
    SELECTION_FOREGROUND: paletteColor(palette, "foreground.primary"),
    TEARLINE_COLOR: paletteColor(palette, "border.default"),
    WHITESPACES: paletteColor(palette, "foreground.muted"),
    FILESTATUS_ADDED: paletteColor(palette, "git.added"),
    FILESTATUS_MODIFIED: paletteColor(palette, "git.modified"),
    FILESTATUS_DELETED: paletteColor(palette, "git.deleted"),
  };
  const colorOptions = Object.entries(colors)
    .map(([key, value]) => `    <option name="${key}" value="${value.slice(1)}" />`)
    .join("\n");
  const attributeOptions = Object.entries(makeAttributes(palette, syntax))
    .filter(([key]) => key !== "DEFAULT_TEXT")
    .map(
      ([key, value]) =>
        `    <option name="${xmlEscape(key)}">\n` +
        `      <value>\n` +
        `        <option name="FOREGROUND" value="${value.slice(1)}" />\n` +
        `      </value>\n` +
        `    </option>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<scheme name="${xmlEscape(name)}" version="142" parent_scheme="Darcula">
  <metaInfo>
    <property name="created">Darkstar Nova 1.0.0</property>
  </metaInfo>
  <colors>
${colorOptions}
  </colors>
  <attributes>
${attributeOptions}
    <option name="DEFAULT_TEXT">
      <value>
        <option name="FOREGROUND" value="${paletteColor(palette, "foreground.primary").slice(1)}" />
        <option name="BACKGROUND" value="${paletteColor(palette, "background.primary").slice(1)}" />
      </value>
    </option>
  </attributes>
</scheme>
`;
}

function makeUi(palette) {
  const background = paletteColor(palette, "background.primary");
  const surface = paletteColor(palette, "background.secondary");
  const elevated = paletteColor(palette, "background.elevated");
  const foreground = paletteColor(palette, "foreground.primary");
  const muted = paletteColor(palette, "foreground.muted");
  const border = paletteColor(palette, "border.default");
  const focus = paletteColor(palette, "border.focused");
  const selection = paletteColor(palette, "selection.background");

  return {
    "*": {
      background: surface,
      foreground,
      disabledForeground: muted,
      borderColor: border,
      focusColor: focus,
      focusedBorderColor: focus,
      selectionBackground: selection,
      selectionForeground: foreground,
      errorForeground: paletteColor(palette, "status.error"),
      successForeground: paletteColor(palette, "status.success"),
    },
    MainWindow: { background },
    EditorTabs: {
      background: surface,
      underlinedTabBackground: background,
      underlinedTabForeground: paletteColor(palette, "accent.blue"),
      inactiveUnderlineColor: border,
    },
    ToolWindow: { background: surface, borderColor: border },
    "ToolWindow.Header": { background: surface, foreground },
    PopupMenu: {
      background: elevated,
      foreground,
      borderColor: border,
      selectionBackground: selection,
      selectionForeground: foreground,
    },
    Menu: {
      background: surface,
      foreground,
      selectionBackground: selection,
      selectionForeground: foreground,
    },
    TabbedPane: {
      background: surface,
      selectedBackground: background,
      underlineColor: paletteColor(palette, "accent.blue"),
    },
    Tree: {
      background: surface,
      foreground,
      selectionBackground: selection,
      selectionForeground: foreground,
    },
    TextField: { background, foreground, borderColor: border, focusColor: focus },
    Button: { background: paletteColor(palette, "background.tertiary"), foreground },
    StatusBar: { background: surface, foreground },
    Notification: { background: elevated, foreground, borderColor: border },
    ScrollBar: {
      thumbColor: paletteColor(palette, "foreground.muted"),
      trackColor: background,
    },
  };
}

function themeDescription(variant) {
  const palette = variant.palette;
  return {
    name: variant.name,
    dark: true,
    author: "Chris Nicholson",
    parentTheme: "Darcula",
    editorScheme: `/darkstar-nova-${variant.id}.xml`,
    ui: makeUi(palette),
  };
}

function pluginXml(variants) {
  const themes = variants
    .map(
      (variant) =>
        `    <themeProvider id="${themeProviderIds[variant.id]}" path="/darkstar-nova-${variant.id}.theme.json" />`,
    )
    .join("\n");
  const schemes = variants
    .map(
      (variant) =>
        `    <bundledColorScheme path="darkstar-nova-${variant.id}" id="${xmlEscape(variant.name)}" />`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<idea-plugin>
  <id>com.darkstarnova.theme</id>
  <name>Darkstar Nova Themes</name>
  <vendor>Chris Nicholson</vendor>
  <description><![CDATA[Classic, Ultra, and Stealth dark themes for IntelliJ Platform IDEs.]]></description>
  <depends>com.intellij.modules.platform</depends>
  <extensions defaultExtensionNs="com.intellij">
${themes}
${schemes}
  </extensions>
</idea-plugin>
`;
}

const pluginIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect width="40" height="40" rx="9" fill="#171B26"/>
  <path d="M20 5 23.7 16.3 35 20 23.7 23.7 20 35 16.3 23.7 5 20 16.3 16.3Z" fill="#82AAFF"/>
  <circle cx="20" cy="20" r="3.2" fill="#89DDFF"/>
</svg>
`;

export async function generateJetBrains({ syntax, variants }) {
  const resourceDirectory = resolve(repositoryRoot, "themes/jetbrains/src/main/resources");
  const metadataDirectory = resolve(resourceDirectory, "META-INF");
  await mkdir(metadataDirectory, { recursive: true });

  await writeFile(resolve(metadataDirectory, "plugin.xml"), pluginXml(variants));
  await writeFile(resolve(metadataDirectory, "pluginIcon.svg"), pluginIcon);

  for (const variant of variants) {
    const id = variant.id;
    await writeFile(
      resolve(resourceDirectory, `darkstar-nova-${id}.theme.json`),
      `${JSON.stringify(themeDescription(variant), null, 2)}\n`,
    );
    await writeFile(
      resolve(resourceDirectory, `darkstar-nova-${id}.xml`),
      renderScheme(variant.name, variant.palette, syntax),
    );
  }
}
