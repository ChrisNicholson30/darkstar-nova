#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
REPOSITORY_ROOT=$(CDPATH= cd "$SCRIPT_DIR/../.." && pwd)
. "$REPOSITORY_ROOT/scripts/install-common.sh"

[ "$(uname -s)" = "Darwin" ] || fail "Xcode themes can only be installed on macOS."

THEME_DIRECTORY="$HOME/Library/Developer/Xcode/UserData/FontAndColorThemes"
set -- "$REPOSITORY_ROOT"/themes/xcode/*.xccolortheme
[ -f "$1" ] || fail "No generated Xcode themes found in themes/xcode."

for theme in "$@"; do
  install_file "$theme" "$THEME_DIRECTORY/$(basename "$theme")"
done

printf 'Select a Darkstar Nova variant in Xcode Settings → Themes. No Xcode settings were changed.\n'
