#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
. "$SCRIPT_DIR/scripts/install-common.sh"

if [ ! -f "$INSTALL_MANIFEST" ]; then
  printf 'No Darkstar Nova files are registered for removal.\n'
  exit 0
fi

temporary_manifest="$INSTALL_MANIFEST.tmp.$$"
: > "$temporary_manifest"
removed=0
preserved=0

while IFS="$(printf '\t')" read -r expected_digest destination || [ -n "${expected_digest:-}${destination:-}" ]; do
  [ -n "${expected_digest:-}" ] || continue
  [ -n "${destination:-}" ] || continue

  if ! is_safe_home_path "$destination"; then
    printf 'Keeping invalid or redirected manifest path: %s\n' "$destination" >&2
    printf '%s\t%s\n' "$expected_digest" "$destination" >> "$temporary_manifest"
    preserved=$((preserved + 1))
    continue
  fi

  if [ ! -f "$destination" ]; then
    printf 'Already absent: %s\n' "$destination"
    continue
  fi

  actual_digest=$(sha256_file "$destination")
  if [ "$actual_digest" = "$expected_digest" ]; then
    rm -f "$destination"
    printf 'Removed: %s\n' "$destination"
    removed=$((removed + 1))
  else
    printf 'Keeping modified file: %s\n' "$destination"
    printf '%s\t%s\n' "$expected_digest" "$destination" >> "$temporary_manifest"
    preserved=$((preserved + 1))
  fi
done < "$INSTALL_MANIFEST"

if [ -s "$temporary_manifest" ]; then
  mv "$temporary_manifest" "$INSTALL_MANIFEST"
else
  rm -f "$temporary_manifest" "$INSTALL_MANIFEST"
  rmdir "$STATE_HOME" 2>/dev/null || true
fi

printf 'Uninstalled %s unchanged file(s); preserved %s modified or unsafe file(s).\n' "$removed" "$preserved"
printf 'Profiles imported into Terminal are stored in Terminal preferences; remove those manually in Terminal Settings → Profiles.\n'
