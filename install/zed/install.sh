#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
REPOSITORY_ROOT=$(CDPATH= cd "$SCRIPT_DIR/../.." && pwd)
. "$REPOSITORY_ROOT/scripts/install-common.sh"

THEME_SOURCE="$REPOSITORY_ROOT/themes/darkstar-nova.json"
THEME_DIRECTORY="${XDG_CONFIG_HOME:-"$HOME/.config"}/zed/themes"
install_file "$THEME_SOURCE" "$THEME_DIRECTORY/darkstar-nova.json"

printf 'Select a Darkstar Nova variant in Zed’s theme selector. No Zed settings were changed.\n'
