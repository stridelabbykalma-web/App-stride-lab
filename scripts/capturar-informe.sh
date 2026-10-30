#!/usr/bin/env bash
# Captura un informe de mmruns.com con agent-browser usando la sesión guardada de Stride Lab.
#
#   scripts/capturar-informe.sh login                 # 1ª vez: abre el navegador para iniciar sesión a mano
#   scripts/capturar-informe.sh <url-del-informe> [carpeta]
#
# Deja en la carpeta (por defecto informes/<fecha-hora>/): informe.txt (texto de la página),
# informe.png (captura completa), informe.pdf y url.txt. La carpeta informes/ no se sube a git.
set -euo pipefail

PROFILE="${STRIDELAB_MMRUNS_PROFILE:-$HOME/.stridelab/mmruns-profile}"
AB=(agent-browser --profile "$PROFILE")

if ! command -v agent-browser >/dev/null; then
  echo "Falta agent-browser. Instálalo con: npm i -g agent-browser && agent-browser install" >&2
  exit 1
fi

if [[ "${1:-}" == "login" ]]; then
  mkdir -p "$PROFILE"
  "${AB[@]}" open https://mmruns.com/ --headed
  echo "Inicia sesión en la ventana que se ha abierto. Cuando veas tus sesiones, pulsa Enter aquí."
  read -r
  "${AB[@]}" close
  echo "Sesión guardada en $PROFILE"
  exit 0
fi

URL="${1:?Uso: $0 login | $0 <url-del-informe> [carpeta]}"
OUT="${2:-informes/$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$OUT"

"${AB[@]}" open "$URL"
"${AB[@]}" wait --load load
# Las gráficas del informe se dibujan después de cargar: margen corto antes de leer.
"${AB[@]}" wait 2500

if "${AB[@]}" get url | grep -qiE 'login|signin|sign-in'; then
  "${AB[@]}" close
  echo "La sesión de mmruns ha caducado. Ejecuta: $0 login" >&2
  exit 2
fi

echo "$URL" > "$OUT/url.txt"
"${AB[@]}" read > "$OUT/informe.txt"
"${AB[@]}" screenshot --full "$OUT/informe.png"
"${AB[@]}" pdf "$OUT/informe.pdf" || echo "(no se pudo generar el PDF, sigo)" >&2
"${AB[@]}" close

echo "Informe capturado en $OUT"
