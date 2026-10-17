#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
REPOSITORY_ROOT=$(CDPATH= cd "$SCRIPT_DIR/../.." && pwd)
. "$REPOSITORY_ROOT/scripts/install-common.sh"

PLUGINS_DIRECTORY=${1:-${DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR:-}}
[ -n "$PLUGINS_DIRECTORY" ] || fail "Pass the target IDE plugins directory as an argument or set DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR."
case "$PLUGINS_DIRECTORY" in
  "$HOME"/*) ;;
  *) fail "The IDE plugins directory must be inside HOME: $PLUGINS_DIRECTORY" ;;
esac
[ -d "$PLUGINS_DIRECTORY" ] || fail "IDE plugins directory does not exist: $PLUGINS_DIRECTORY"
is_safe_home_path "$PLUGINS_DIRECTORY/darkstar-nova-theme" || fail "IDE plugins directory must resolve inside HOME."

command -v java >/dev/null 2>&1 || fail "Java 17+ is required to build the JetBrains plugin."
command -v gradle >/dev/null 2>&1 || fail "Gradle 9+ is required to build the JetBrains plugin."
command -v unzip >/dev/null 2>&1 || fail "unzip is required to install the JetBrains plugin archive."

gradle -p "$REPOSITORY_ROOT/themes/jetbrains" clean buildPlugin

DISTRIBUTIONS="$REPOSITORY_ROOT/themes/jetbrains/build/distributions"
set -- "$DISTRIBUTIONS"/darkstar-nova-theme-*.zip
[ -f "$1" ] || fail "Gradle completed, but no plugin ZIP was found in $DISTRIBUTIONS."
[ "$#" -eq 1 ] || fail "Expected one JetBrains plugin ZIP in $DISTRIBUTIONS; found more than one."

WORK_DIRECTORY=$(mktemp -d "${TMPDIR:-/tmp}/darkstar-nova-plugin.XXXXXX")
trap 'rm -rf "$WORK_DIRECTORY"' EXIT HUP INT TERM
mkdir "$WORK_DIRECTORY/unpacked"
unzip -q "$1" -d "$WORK_DIRECTORY/unpacked"

PLUGIN_CONTENTS=
for candidate in "$WORK_DIRECTORY"/unpacked/*; do
  if [ -d "$candidate/lib" ]; then
    PLUGIN_CONTENTS=$candidate
    break
  fi
done
if [ -z "$PLUGIN_CONTENTS" ] && [ -d "$WORK_DIRECTORY/unpacked/lib" ]; then
  PLUGIN_CONTENTS="$WORK_DIRECTORY/unpacked"
fi
[ -n "$PLUGIN_CONTENTS" ] || fail "The plugin ZIP did not contain a recognizable IntelliJ plugin layout."

install_tree "$PLUGIN_CONTENTS" "$PLUGINS_DIRECTORY/darkstar-nova-theme"
printf 'Restart the target IDE to load Darkstar Nova. The global uninstaller tracks these plugin files.\n'
