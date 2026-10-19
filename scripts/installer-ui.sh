#!/bin/sh

# All artwork uses Basic Multilingual Plane characters (UCS-2 compatible).
# Keep the output readable in logs, on narrow terminals, and without ANSI color.
DARKSTAR_UI_RESET=
DARKSTAR_UI_CYAN=
DARKSTAR_UI_BLUE=
DARKSTAR_UI_VIOLET=
DARKSTAR_UI_PINK=
DARKSTAR_UI_DIM=
if [ -t 1 ] && [ "${TERM:-dumb}" != dumb ] && [ "${NO_COLOR+x}" != x ]; then
  DARKSTAR_UI_RESET=$(printf '\033[0m')
  DARKSTAR_UI_CYAN=$(printf '\033[1;38;5;117m')
  DARKSTAR_UI_BLUE=$(printf '\033[1;38;5;111m')
  DARKSTAR_UI_VIOLET=$(printf '\033[1;38;5;183m')
  DARKSTAR_UI_PINK=$(printf '\033[1;38;5;213m')
  DARKSTAR_UI_DIM=$(printf '\033[38;5;103m')
fi

darkstar_ui_line() {
  printf '%s%s%s\n' "$1" "$2" "$DARKSTAR_UI_RESET"
}

darkstar_banner() {
  darkstar_ui_width=${COLUMNS:-}
  if [ -z "$darkstar_ui_width" ] && [ -t 1 ] && command -v tput >/dev/null 2>&1; then
    darkstar_ui_width=$(tput cols 2>/dev/null) || darkstar_ui_width=80
  fi
  case "$darkstar_ui_width" in
    ''|*[!0-9]*) darkstar_ui_width=80 ;;
  esac

  printf '\n'
  if [ "${DARKSTAR_NOVA_ASCII:-0}" = 1 ] || [ "${TERM:-}" = dumb ]; then
    darkstar_ui_line "$DARKSTAR_UI_CYAN" '             \   |   /'
    darkstar_ui_line "$DARKSTAR_UI_BLUE" '         ----- < * > -----'
    darkstar_ui_line "$DARKSTAR_UI_VIOLET" '             /   |   \'
    darkstar_ui_line "$DARKSTAR_UI_CYAN" '          D A R K S T A R'
    darkstar_ui_line "$DARKSTAR_UI_PINK" '              N O V A'
  elif [ "$darkstar_ui_width" -lt 76 ]; then
    darkstar_ui_line "$DARKSTAR_UI_DIM" '       ·                   ·'
    darkstar_ui_line "$DARKSTAR_UI_CYAN" '           ╲     │     ╱'
    darkstar_ui_line "$DARKSTAR_UI_BLUE" '       ────── ◇━✦━◇ ──────'
    darkstar_ui_line "$DARKSTAR_UI_VIOLET" '           ╱     │     ╲'
    darkstar_ui_line "$DARKSTAR_UI_CYAN" '          D A R K S T A R'
    darkstar_ui_line "$DARKSTAR_UI_PINK" '              N O V A'
  else
    darkstar_ui_line "$DARKSTAR_UI_DIM" '       ·                 ✦                          ·           ✧'
    darkstar_ui_line "$DARKSTAR_UI_CYAN" '  ██████╗  █████╗ ██████╗ ██╗  ██╗███████╗████████╗ █████╗ ██████╗ '
    darkstar_ui_line "$DARKSTAR_UI_CYAN" '  ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝██╔════╝╚══██╔══╝██╔══██╗██╔══██╗'
    darkstar_ui_line "$DARKSTAR_UI_BLUE" '  ██║  ██║███████║██████╔╝█████╔╝ ███████╗   ██║   ███████║██████╔╝'
    darkstar_ui_line "$DARKSTAR_UI_BLUE" '  ██║  ██║██╔══██║██╔══██╗██╔═██╗ ╚════██║   ██║   ██╔══██║██╔══██╗'
    darkstar_ui_line "$DARKSTAR_UI_VIOLET" '  ██████╔╝██║  ██║██║  ██║██║  ██╗███████║   ██║   ██║  ██║██║  ██║'
    darkstar_ui_line "$DARKSTAR_UI_VIOLET" '  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝'
    darkstar_ui_line "$DARKSTAR_UI_DIM" '          ╲ │ ╱'
    darkstar_ui_line "$DARKSTAR_UI_VIOLET" '      ──── ◇✦◇ ────     ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ '
    darkstar_ui_line "$DARKSTAR_UI_PINK" '          ╱ │ ╲        ████╗  ██║██╔═══██╗██║   ██║██╔══██╗'
    darkstar_ui_line "$DARKSTAR_UI_PINK" '       ·    │    ·     ██╔██╗ ██║██║   ██║██║   ██║███████║'
    darkstar_ui_line "$DARKSTAR_UI_VIOLET" '                       ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║'
    darkstar_ui_line "$DARKSTAR_UI_BLUE" '                       ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║'
    darkstar_ui_line "$DARKSTAR_UI_CYAN" '                       ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝'
  fi
  printf '\n'
  darkstar_ui_line "$DARKSTAR_UI_DIM" '  THE NEXT EVOLUTION OF DARKNESS'
  darkstar_ui_line "$DARKSTAR_UI_VIOLET" "  DARKSTAR NOVA / $1"
  printf '\n'
}

darkstar_heading() {
  printf '\n%s  %s%s\n\n' "$DARKSTAR_UI_CYAN" "$*" "$DARKSTAR_UI_RESET"
}

darkstar_option() {
  printf '  %s[%s]%s  %-18s %s\n' "$DARKSTAR_UI_VIOLET" "$1" "$DARKSTAR_UI_RESET" "$2" "$3"
}
