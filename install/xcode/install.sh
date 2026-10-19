#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
REPOSITORY_ROOT=$(CDPATH= cd "$SCRIPT_DIR/../.." && pwd)
. "$REPOSITORY_ROOT/scripts/install-common.sh"

[ "$(uname -s)" = "Darwin" ] || fail "Xcode themes can only be installed on macOS."

THEME_DIRECTORY="$HOME/Library/Developer/Xcode/UserData/FontAndColorThemes"
set -- "$REPOSITORY_ROOT"/themes/xcode/*.xccolortheme
[ -f "$1" ] || fail "No generated Xcode themes found in themes/xcode."
set -- "$@" "$REPOSITORY_ROOT"/themes/xcode/*.xcworkspacecolortheme
for theme in "$@"; do
  [ -f "$theme" ] || fail "Missing generated Xcode theme: $theme. Run npm run build first."
done

for theme in "$@"; do
  install_file "$theme" "$THEME_DIRECTORY/$(basename "$theme")"
done

printf 'Xcode 27 or newer: select a Darkstar Nova variant in Xcode Settings → Appearance → Theme → Choose….\n'
printf 'Earlier Xcode versions: select a variant in Xcode Settings → Themes (or Fonts & Colors).\n'
printf 'If the new themes are not listed, reopen Settings or restart Xcode. No Xcode settings were changed.\n'
