#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
REPOSITORY_ROOT=$(CDPATH= cd "$SCRIPT_DIR/../.." && pwd)
. "$REPOSITORY_ROOT/scripts/install-common.sh"

[ "$(uname -s)" = "Darwin" ] || fail "macOS Terminal profiles can only be installed on macOS."

PROFILE_DIRECTORY="$STATE_HOME/terminal-profiles"
mkdir -p "$PROFILE_DIRECTORY"
set -- "$REPOSITORY_ROOT"/themes/terminal/*.terminal
[ -f "$1" ] || fail "No generated Terminal profiles found in themes/terminal."

for profile in "$@"; do
  install_file "$profile" "$PROFILE_DIRECTORY/$(basename "$profile")"
done

printf 'Profiles are staged in: %s\n' "$PROFILE_DIRECTORY"
printf 'Import them in Terminal Settings → Profiles. This script does not edit Terminal preferences.\n'
