# Stride Lab · App de sesión G2

App web para llevar de principio a fin las sesiones de **análisis biomecánico de carrera** de
**Stride Lab by Kalma** (Cassà de la Selva, Girona), usando como base de resultados las métricas del
sistema **MotionMetrix G2** (informe en mmruns.com).

Sustituye a las hojas en papel: la ficha, la hoja de apuntes, la guía de ejercicios y el protocolo de tests
quedan en una sola herramienta que se usa en la tablet o el portátil durante la sesión.

## Flujo de trabajo

| Momento | En la app | Documento de origen |
|---|---|---|
| Días antes | **WhatsApp previo** — 5 mensajes listos para copiar, en orden | `Mensajes_WhatsApp_G2.pdf` |
| Días antes | **Ficha de cliente** — rellenar con las respuestas (secciones 1–7) | `Ficha_Cliente_G2.pdf` |
| –5 min | **Preparación** — checklist de sala (mmruns.com, Kinovea, agua…) | `Timing_Sesion_G2.pdf` |
| 0–10′ | **Anamnesis y tests** — resumen de la ficha + exploración clínica (versión mínima 10 min o completa), resultado y lado por test | `Protocolo_tests_principales_G2_Kalma.docx` |
| 10–15′ | **Observación libre** — marcar los 2–3 problemas que se ven (de los 15 de la guía) | `Timing_Sesion_G2.pdf` / `Guia_Sesion_G2_StrideLab.pdf` |
| 15–45′ | **Fase 1 · Zapatillas** — hasta 4 zapatillas × V1/V2/V3 con TC, cadencia, simetría y oscilación del G2. Ranking automático y elección de la ganadora | `Hoja_Apuntes_Sesion_G2.pdf` (pág. 1) |
| 45–70′ | **Fase 2 · Técnica** — por problema: qué se observa, TC/cadencia antes-después, ejercicio (E01–E03) con su cue y su porqué | `Hoja_Apuntes_Sesion_G2.pdf` (pág. 2) + `Guia_Sesion_G2_StrideLab.pdf` |
| 70–85′ | **Informe G2 · Qué decirle** — subes capturas del informe de mmruns.com y la app te prepara el guion para el cliente (ver abajo) | Informe MotionMetrix G2 |
| 70–85′ | **Cierre e informe** — 3 puntos clave, recomendaciones, mensaje post-sesión con botón de WhatsApp e impresión/PDF de la hoja de sesión | `Mensaje_PostSesion_G2.pdf` |

Cada fase muestra los puntos del timing y un cronómetro con el tiempo objetivo (se pone en rojo al pasarse).

## Qué decirle al cliente a partir de capturas del informe

En la sesión (paso **Informe G2 · Qué decirle**) o en la pestaña **Leer informe G2**:

1. Sube las capturas del informe de mmruns.com: elígelas, arrástralas o pégalas con Ctrl/Cmd+V (hasta 10).
2. Pulsa **Analizar**. Claude lee las capturas junto con lo registrado en la sesión: ficha, tests alterados,
   problemas observados, zapatilla elegida y correcciones.
3. Recibes:
   - **Qué decirle**: una frase de apertura, lo de la zapatilla, **máximo 3 puntos** (cada uno con el dato del
     informe, qué significa en lenguaje sencillo, la frase literal para decirle, y el ejercicio y el cue de la guía)
     y la frase de cierre «Lo más importante que te llevas hoy es…».
   - **Lo que se ha leído**: tabla de métricas con su valoración, para comprobarla con el informe.
   - **Avisos**: datos ilegibles o señales para derivar a fisioterapia.
4. **Usar los 3 puntos en el mensaje post-sesión** rellena los puntos clave del WhatsApp final. El guion también
   sale en la hoja de sesión que se imprime.

Requisitos: una **clave de API de Anthropic** (console.anthropic.com → API Keys). Se introduce una vez y se
guarda solo en ese dispositivo. Cada análisis cuesta unos céntimos. Las capturas se envían a la API de Anthropic
para leerlas: no subas capturas con datos que el cliente no haya autorizado. El prompt y la lógica están en
`src/lib/analyze.ts`.

## Leer el informe directamente de mmruns.com (agent-browser)

Para no tener que hacer capturas: Claude Code, en tu ordenador, abre el informe en mmruns.com con
[agent-browser](https://github.com/vercel-labs/agent-browser) usando la sesión del centro, lo lee y deja el guion
en un `analisis.json` que se importa en la app con **Importar análisis (.json)**. No hace falta clave de API.

Instalación (una vez por ordenador, con el repositorio clonado):

```bash
npm i -g agent-browser && agent-browser install
mkdir -p .claude/skills/informe-g2 && cp docs/skill-informe-g2/SKILL.md .claude/skills/informe-g2/
scripts/capturar-informe.sh login   # se abre el navegador: inicia sesión en mmruns.com a mano
```

Uso: en Claude Code, «lee el informe de Laura Pérez» o pega el enlace de mmruns.com. La skill:

1. Busca el informe en mmruns.com (o abre el enlace) con la sesión guardada en `~/.stridelab/mmruns-profile`.
2. Lo captura con `scripts/capturar-informe.sh`: texto, captura completa y PDF en `informes/…` (fuera de git).
3. Prepara el guion con las mismas reglas que la app y lo guarda en `informes/…/analisis.json`.

La contraseña de mmruns nunca pasa por Claude: el inicio de sesión lo haces tú en la ventana que se abre.
Si la sesión caduca, el script avisa y basta con repetir `login`.

## Datos del G2 (MotionMetrix)

Por cada pasada se guardan:

| Campo | Unidad | Mejor |
|---|---|---|
| Velocidad | km/h | — |
| TC (tiempo de contacto) | ms | más bajo |
| Cadencia | pasos/min | — (objetivo habitual 170–180) |
| Simetría | % del pie izquierdo en el balance I/D | 50 % |
| Oscilación vertical | cm | más baja / estable |

Se pueden escribir a mano o usar **«Pegar datos G2»**: se pega una tabla copiada del informe de mmruns.com o
de una hoja de cálculo (primera fila = cabecera, una fila por velocidad). Las columnas se reconocen por
nombre en español o inglés (`Velocidad/Speed`, `TC/Contact time`, `Cadencia/Cadence`, `Simetría/Balance`,
`Oscilación/Vertical oscillation`) y admite coma decimal y unidades (`245 ms`, `49,5 %`).

**Zapatilla ganadora.** Siguiendo el criterio del timing («TC más bajo, mejor simetría y oscilación vertical
más estable») la app puntúa cada zapatilla de 0 a 100: TC 50 %, simetría 30 %, oscilación 20 %, normalizado
entre las zapatillas y comparando solo las velocidades medidas en todas. Es una sugerencia; la elección final
se marca a mano.

> Si en vuestros informes la simetría aparece de otra forma (p. ej. índice 0–100 % o diferencia I/D),
> se ajusta en `src/lib/winner.ts`.

## Privacidad

Los datos de clientes son confidenciales y **se guardan solo en el navegador** del dispositivo (localStorage);
no se envían a ningún servidor. Desde la lista de clientes se puede **exportar/importar una copia JSON** para
hacer backup o pasar los datos a otro dispositivo.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm test         # tests (ranking de zapatillas, mensaje post-sesión, importación G2)
npm run build    # genera dist/ (estático, se puede publicar en GitHub Pages)
```

Stack: React 18 + TypeScript + Vite, sin backend. La lectura de capturas usa la API de Claude (`@anthropic-ai/sdk`) desde el navegador.

```
src/
  data/problems.ts   15 problemas × 3 ejercicios (guía de sesión)
  data/tests.ts      protocolo de tests clínicos y relación hallazgo → G2
  data/protocol.ts   WhatsApp previo, checklist, timing y velocidades
  lib/winner.ts      ranking de zapatillas con datos del G2
  lib/csv.ts         importación de tablas del G2
  lib/postMessage.ts mensaje post-sesión y enlace de WhatsApp
  lib/analyze.ts     lectura de capturas del G2 con Claude → guion para el cliente
  views/             pantallas (ficha, sesión, hoja imprimible, referencia)
```
