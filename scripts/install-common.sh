#!/bin/sh

STATE_HOME=${DARKSTAR_NOVA_STATE_HOME:-${XDG_STATE_HOME:-"$HOME/.local/state"}/darkstar-nova}
INSTALL_MANIFEST="$STATE_HOME/installed-files.tsv"

fail() {
  printf 'Darkstar Nova: %s\n' "$*" >&2
  exit 1
}

ensure_state_home() {
  mkdir -p "$STATE_HOME"
}

sha256_file() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    fail "Neither shasum nor sha256sum is available; cannot safely track installed files."
  fi
}

manifest_has_path() {
  [ -f "$INSTALL_MANIFEST" ] || return 1
  awk -F '	' -v target="$1" '$2 == target { found = 1 } END { exit !found }' "$INSTALL_MANIFEST"
}

manifest_tracks_directory() {
  [ -f "$INSTALL_MANIFEST" ] || return 1
  awk -F '	' -v prefix="${1%/}/" 'index($2, prefix) == 1 { found = 1 } END { exit !found }' "$INSTALL_MANIFEST"
}

is_safe_home_path() {
  path=$1
  case "$path" in
    "$HOME"/*) ;;
    *) return 1 ;;
  esac
  case "/$path/" in
    *"/../"*|*"/./"*) return 1 ;;
  esac

  home_physical=$(CDPATH= cd "$HOME" 2>/dev/null && pwd -P) || return 1
  parent=$(dirname "$path")
  probe=$parent
  while [ ! -d "$probe" ]; do
    next_probe=$(dirname "$probe")
    [ "$next_probe" != "$probe" ] || return 1
    probe=$next_probe
  done
  probe_physical=$(CDPATH= cd "$probe" 2>/dev/null && pwd -P) || return 1
  case "$probe_physical" in
    "$home_physical"|"$home_physical"/*) ;;
    *) return 1 ;;
  esac

  if [ -d "$parent" ]; then
    parent_physical=$(CDPATH= cd "$parent" 2>/dev/null && pwd -P) || return 1
    case "$parent_physical" in
      "$home_physical"|"$home_physical"/*) ;;
      *) return 1 ;;
    esac
  fi
  return 0
}

record_installed_file() {
  destination=$1
  digest=$(sha256_file "$destination")
  ensure_state_home
  if ! manifest_has_path "$destination"; then
    printf '%s\t%s\n' "$digest" "$destination" >> "$INSTALL_MANIFEST"
  fi
}

install_file() {
  source=$1
  destination=$2

  [ -f "$source" ] || fail "Source file not found: $source"
  is_safe_home_path "$destination" || fail "Install destination must resolve inside HOME: $destination"

  if [ -e "$destination" ] || [ -L "$destination" ]; then
    if [ -f "$destination" ] && cmp -s "$source" "$destination"; then
      printf 'Already present; leaving untouched: %s\n' "$destination"
      return 0
    fi
    fail "Refusing to overwrite an existing file: $destination"
  fi

  parent=$(dirname "$destination")
  mkdir -p "$parent"
  is_safe_home_path "$destination" || fail "Install destination resolves outside HOME: $destination"
  temporary=$(mktemp "$parent/.darkstar-nova.XXXXXX") || fail "Could not create a temporary file in $parent"
  if ! cp "$source" "$temporary"; then
    rm -f "$temporary"
    fail "Could not stage $source"
  fi
  if ! ln "$temporary" "$destination" 2>/dev/null; then
    rm -f "$temporary"
    if [ -f "$destination" ] && cmp -s "$source" "$destination"; then
      printf 'Already present; leaving untouched: %s\n' "$destination"
      return 0
    fi
    fail "Destination appeared during installation; left untouched: $destination"
  fi
  rm -f "$temporary"
  record_installed_file "$destination"
  printf 'Installed: %s\n' "$destination"
}

install_tree() {
  source_directory=$1
  destination_directory=$2

  [ -d "$source_directory" ] || fail "Source directory not found: $source_directory"
  is_safe_home_path "$destination_directory" || fail "Install destination must resolve inside HOME: $destination_directory"

  if [ -e "$destination_directory" ] || [ -L "$destination_directory" ]; then
    if [ -d "$destination_directory" ] && manifest_tracks_directory "$destination_directory"; then
      printf 'Already managed; leaving untouched: %s\n' "$destination_directory"
      return 0
    fi
    fail "Refusing to overwrite an existing directory: $destination_directory"
  fi

  parent=$(dirname "$destination_directory")
  mkdir -p "$parent"
  is_safe_home_path "$destination_directory" || fail "Install destination resolves outside HOME: $destination_directory"
  temporary=$(mktemp -d "$parent/.darkstar-nova.XXXXXX") || fail "Could not create a temporary directory in $parent"
  if ! cp -R "$source_directory/." "$temporary/"; then
    rm -rf "$temporary"
    fail "Could not stage plugin files."
  fi
  if find "$temporary" -type l -print | grep . >/dev/null 2>&1; then
    rm -rf "$temporary"
    fail "Refusing to install a plugin tree containing symbolic links."
  fi
  if ! mv -n "$temporary" "$destination_directory"; then
    rm -rf "$temporary"
    fail "Could not install plugin directory: $destination_directory"
  fi
  if [ -e "$temporary" ]; then
    rm -rf "$temporary"
    fail "Destination appeared during installation; left untouched: $destination_directory"
  fi

  find "$destination_directory" -type f -print |
    while IFS= read -r installed_file; do
      record_installed_file "$installed_file"
    done
  printf 'Installed plugin files in: %s\n' "$destination_directory"
}
