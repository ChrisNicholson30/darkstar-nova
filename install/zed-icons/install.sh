#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
REPOSITORY_ROOT=$(CDPATH= cd "$SCRIPT_DIR/../.." && pwd)
. "$REPOSITORY_ROOT/scripts/install-common.sh"

for required in icon_themes/darkstar-nova-icons.json icons/classic icons/ultra icons/stealth LICENSE; do
  [ -e "$REPOSITORY_ROOT/$required" ] || fail "Missing $required. Run npm run build:icons first."
done

# Zed loads icon themes only from extensions, so stage a standalone extension
# folder (same layout as the packaged zip) to select as a dev extension.
EXTENSION_DIRECTORY="${XDG_DATA_HOME:-"$HOME/.local/share"}/darkstar-nova/zed-icons"
STAGING=$(mktemp -d "${TMPDIR:-/tmp}/darkstar-nova-icons.XXXXXX") || fail "Could not create a staging directory."
trap 'rm -rf "$STAGING"' EXIT HUP INT TERM

cp -R "$REPOSITORY_ROOT/icons" "$REPOSITORY_ROOT/icon_themes" "$REPOSITORY_ROOT/LICENSE" "$STAGING/"
cp "$REPOSITORY_ROOT/design/icons.md" "$STAGING/README.md"
cat > "$STAGING/extension.toml" <<'TOML'
id = "darkstar-nova-icons"
name = "Darkstar Nova Icons"
version = "1.0.0"
schema_version = 1
authors = ["Chris Nicholson"]
description = "Original 16px project-panel icons matching Darkstar Nova Classic, Ultra, and Stealth."
repository = "https://github.com/ChrisNicholson30/darkstar-nova"
TOML

install_tree "$STAGING" "$EXTENSION_DIRECTORY"

printf 'In Zed: run "zed: install dev extension". In the file picker, go to the parent folder,\n'
printf 'click "zed-icons" once to highlight it (do not open it), then click Open:\n'
printf '  %s\n' "$EXTENSION_DIRECTORY"
printf 'Then run "icon theme selector: toggle" and choose a Darkstar Nova Icons variant. No Zed settings were changed.\n'
