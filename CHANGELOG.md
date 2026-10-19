# Changelog

## Unreleased

- Add a global numbered installer with multiple target selection, direct command-line choices, and a JetBrains directory prompt.
- Add shared UCS-2-compatible Unicode branding to the installer and uninstaller, with compact, ASCII, and color-free output.
- Generate and install `.xcworkspacecolortheme` recipes so all three variants appear in Xcode 27's Appearance picker, alongside the legacy themes for earlier Xcode versions.
- Validate workspace color roles and OKLCH palette conversion, and document the current Xcode settings location.

## 1.0.0

- Add the Classic, Ultra, and Stealth design-token palettes.
- Generate Zed themes, native Xcode color themes, JetBrains theme plugin assets, and macOS Terminal profiles from shared design data.
- Add platform validation, representative code samples, and installation documentation.
