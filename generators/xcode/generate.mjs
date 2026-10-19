import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  paletteColor,
  repositoryRoot,
  semanticColor,
  xcodeColor,
} from "../lib/design.mjs";
import { plistXml } from "../lib/plist.mjs";
import { workspaceTheme } from "./workspace.mjs";

export async function generateXcode({ syntax, variants }) {
  const outputDirectory = resolve(repositoryRoot, "themes/xcode");
  await mkdir(outputDirectory, { recursive: true });

  for (const variant of variants) {
    const palette = variant.palette;
    const sourceSyntaxColors = Object.fromEntries(
      Object.entries(syntax.xcode).map(([scope, role]) => [
        scope,
        xcodeColor(semanticColor(palette, syntax, role)),
      ]),
    );
    const theme = {
      DVTFontAndColorVersion: 1,
      DVTLineSpacing: 1,
      DVTSourceTextBackground: xcodeColor(paletteColor(palette, "background.primary")),
      DVTSourceTextCurrentLineHighlightColor: xcodeColor(paletteColor(palette, "line.active")),
      DVTSourceTextSelectionColor: xcodeColor(paletteColor(palette, "selection.background")),
      DVTSourceTextBlockDimBackgroundColor: xcodeColor(paletteColor(palette, "background.tertiary")),
      DVTSourceTextInvisiblesColor: xcodeColor(paletteColor(palette, "foreground.muted")),
      DVTSourceTextSyntaxColors: sourceSyntaxColors,
      DVTSourceTextSyntaxFonts: {
        "xcode.syntax.plain": "SFMono-Regular - 12.0",
      },
      DVTConsoleTextBackgroundColor: xcodeColor(paletteColor(palette, "background.secondary")),
      DVTConsoleTextSelectionColor: xcodeColor(paletteColor(palette, "selection.background")),
      DVTConsoleTextInsertionPointColor: xcodeColor(paletteColor(palette, "syntax.type")),
      DVTConsoleDebuggerInputTextColor: xcodeColor(paletteColor(palette, "syntax.function")),
      DVTConsoleDebuggerOutputTextColor: xcodeColor(paletteColor(palette, "foreground.primary")),
      DVTConsoleDebuggerPromptTextColor: xcodeColor(paletteColor(palette, "syntax.type")),
      DVTConsoleExectuableInputTextColor: xcodeColor(paletteColor(palette, "foreground.primary")),
      DVTConsoleExectuableOutputTextColor: xcodeColor(paletteColor(palette, "foreground.secondary")),
      DVTMarkupTextBackgroundColor: xcodeColor(paletteColor(palette, "background.tertiary")),
      DVTMarkupTextBorderColor: xcodeColor(paletteColor(palette, "border.default")),
      DVTMarkupTextNormalColor: xcodeColor(paletteColor(palette, "foreground.primary")),
      DVTMarkupTextEmphasisColor: xcodeColor(paletteColor(palette, "foreground.primary")),
      DVTMarkupTextStrongColor: xcodeColor(paletteColor(palette, "foreground.primary")),
      DVTMarkupTextLinkColor: xcodeColor(paletteColor(palette, "accent.blue")),
      DVTMarkupTextInlineCodeColor: xcodeColor(paletteColor(palette, "syntax.string")),
      DVTScrollbarMarkerErrorColor: xcodeColor(paletteColor(palette, "status.error")),
      DVTScrollbarMarkerWarningColor: xcodeColor(paletteColor(palette, "status.warning")),
      DVTScrollbarMarkerDiffColor: xcodeColor(paletteColor(palette, "git.modified")),
      DVTScrollbarMarkerBreakpointColor: xcodeColor(paletteColor(palette, "syntax.constant")),
    };

    await writeFile(
      resolve(outputDirectory, `${variant.name}.xccolortheme`),
      plistXml(theme),
    );
    await writeFile(
      resolve(outputDirectory, `${variant.name}.xcworkspacecolortheme`),
      `${JSON.stringify(workspaceTheme(variant, syntax), null, 2)}\n`,
    );
  }
}
