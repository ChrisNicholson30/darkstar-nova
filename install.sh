#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
. "$SCRIPT_DIR/scripts/install-common.sh"
. "$SCRIPT_DIR/scripts/installer-ui.sh"

show_menu() {
  darkstar_heading 'CHOOSE YOUR DESTINATIONS'
  darkstar_option 1 'Zed' 'All three variants'
  darkstar_option 2 'Xcode' 'macOS; includes Xcode 27 workspace themes'
  darkstar_option 3 'macOS Terminal' 'Stage profiles for import'
  darkstar_option 4 'JetBrains IDEs' 'Build plugin; requires JDK 17+ and Gradle 9+'
  darkstar_option 5 'Zed icons' 'Stage icon extension for dev-extension install'
  darkstar_option 6 'All compatible' 'Every target supported on this OS'
  darkstar_option 0 'Exit' ''
  printf '\n  Select one or more: 1 or 1,2,3\n'
}

show_help() {
  cat <<'HELP'
Usage: sh install.sh [SELECTION ...]

Without arguments, opens the numbered installation menu.
Choose numbers 1–6, or names: zed, xcode, terminal, jetbrains, icons, all.
Separate multiple choices with commas or spaces. Use 0 to exit.

Examples:
  sh install.sh
  sh install.sh 1,2,3
  sh install.sh zed xcode
  DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR="/absolute/IDE/plugins" sh install.sh 4

Options:
  --list        Preview the menu without installing anything
  -h, --help    Show this help

JetBrains prompts for its existing plugins directory in the interactive menu.
For commands with a selection argument, set DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR.
All installs include Classic, Ultra, and Stealth. Existing app preferences stay
unchanged. Run sh uninstall.sh to remove unchanged, manifest-tracked files.

Appearance: NO_COLOR=1 disables color; DARKSTAR_NOVA_ASCII=1 uses ASCII artwork.
HELP
}

darkstar_banner INSTALLER
case "${1:-}" in
  --help|-h) show_help; exit 0 ;;
  --list) show_menu; exit 0 ;;
esac

interactive_selection=0
if [ "$#" -eq 0 ]; then
  interactive_selection=1
  show_menu
  printf '\n  Install > '
  if ! IFS= read -r selection; then
    printf '\n  Installation cancelled.\n'
    exit 0
  fi
else
  selection="$*"
fi

target_zed=0
target_xcode=0
target_terminal=0
target_jetbrains=0
target_icons=0
target_exit=0
selected_any=0
system=$(uname -s)
selection=$(printf '%s' "$selection" | tr ',' ' ')
# Deliberate word splitting accepts spaces without expanding wildcards or code.
set -f
for choice in $selection; do
  case "$choice" in
    1|zed) target_zed=1 ;;
    2|xcode) target_xcode=1 ;;
    3|terminal) target_terminal=1 ;;
    4|jetbrains) target_jetbrains=1 ;;
    5|icons) target_icons=1 ;;
    6|all)
      target_zed=1
      target_icons=1
      target_jetbrains=1
      if [ "$system" = Darwin ]; then
        target_xcode=1
        target_terminal=1
      fi
      ;;
    0|q|quit) target_exit=1; continue ;;
    *) fail "Unknown selection: $choice. Choose 1–6, or 0 to exit. See sh install.sh --help." ;;
  esac
  selected_any=1
done

if [ "$target_exit" -eq 1 ]; then
  [ "$selected_any" -eq 0 ] || fail 'Exit cannot be combined with installation targets.'
  printf '  Installation cancelled.\n'
  exit 0
fi
[ "$selected_any" -eq 1 ] || fail 'No destinations selected. Choose 1–6, or 0 to exit.'
if [ "$system" != Darwin ] && { [ "$target_xcode" -eq 1 ] || [ "$target_terminal" -eq 1 ]; }; then
  fail 'Xcode and macOS Terminal require macOS. Choose Zed or JetBrains on this OS.'
fi

plugins_directory=${DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR:-}
if [ "$target_jetbrains" -eq 1 ] && [ -z "$plugins_directory" ]; then
  if [ "$interactive_selection" -eq 1 ]; then
    darkstar_heading 'JETBRAINS DESTINATION'
    printf '  Enter the existing plugins directory for your IDE.\n'
    printf '  Example: ~/Library/Application Support/JetBrains/IntelliJIdea2024.2/plugins\n\n'
    printf '  Plugins directory > '
    IFS= read -r plugins_directory || fail 'No JetBrains plugins directory provided.'
  else
    fail 'Set DARKSTAR_NOVA_JETBRAINS_PLUGINS_DIR to your existing IDE plugins directory, or run sh install.sh to use the menu.'
  fi
fi
if [ "$target_jetbrains" -eq 1 ]; then
  case "$plugins_directory" in
    '~/'*) plugins_directory="$HOME/${plugins_directory#'~/'}" ;;
  esac
  [ -d "$plugins_directory" ] || fail "JetBrains plugins directory does not exist: $plugins_directory"
  is_safe_home_path "$plugins_directory/darkstar-nova-theme" || fail 'JetBrains plugins directory must resolve inside HOME.'
fi

installed=0
failed=0
for target in zed zed-icons xcode terminal jetbrains; do
  case "$target" in
    zed) [ "$target_zed" -eq 1 ] || continue ;;
    zed-icons) [ "$target_icons" -eq 1 ] || continue ;;
    xcode) [ "$target_xcode" -eq 1 ] || continue ;;
    terminal) [ "$target_terminal" -eq 1 ] || continue ;;
    jetbrains) [ "$target_jetbrains" -eq 1 ] || continue ;;
  esac
  darkstar_heading "INSTALLING / $target"
  if [ "$target" = jetbrains ]; then
    if sh "$SCRIPT_DIR/install/$target/install.sh" "$plugins_directory"; then
      installed=$((installed + 1))
    else
      failed=$((failed + 1))
      printf '\n  Could not install %s. See the details above.\n' "$target" >&2
    fi
  elif sh "$SCRIPT_DIR/install/$target/install.sh"; then
    installed=$((installed + 1))
  else
    failed=$((failed + 1))
    printf '\n  Could not install %s. See the details above.\n' "$target" >&2
  fi
done

darkstar_heading "RESULT / $installed succeeded / $failed failed"
if [ "$installed" -gt 0 ]; then
  printf '  Select a Darkstar Nova variant in your app to finish.\n'
  printf '  Remove tracked files later with: sh uninstall.sh\n'
fi
if [ "$failed" -gt 0 ]; then
  printf '  Resolve the errors above, then rerun the failed target numbers.\n'
fi
printf '\n'
[ "$failed" -eq 0 ]
