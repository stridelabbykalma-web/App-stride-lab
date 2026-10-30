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

## Sin clave de API: con tu cuenta de claude.ai

La app no necesita API para la parte de Claude. Usa copiar y pegar con claude.ai, que va con tu suscripción:

- **Ficha desde WhatsApp** (en la ficha del cliente): pega los mensajes o adjunta las capturas en claude.ai,
  pulsa **Copiar para Claude**, pega la respuesta y **Rellenar ficha**. Solo se rellenan los campos vacíos.
- **Análisis del informe** (paso Informe G2 · Análisis): carga el enlace del informe, pulsa **Copiar para
  Claude**, pégalo en claude.ai con la búsqueda web activada y pega la respuesta. Salen el guion, los ejercicios
  en directo, el tipo de zapatilla que le funciona y las fichas de las zapatillas, que quedan guardadas.

Lo que se copia lleva todos los valores del informe (cada pasada con sus métricas izquierda/derecha), la ficha,
los tests, lo observado, las zapatillas y las instrucciones de Stride Lab. Claude responde en un formato que la
app comprueba antes de usarlo.

La clave de API sigue siendo opcional, para hacerlo todo con un botón.

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

## Cargar el informe con el enlace compartido (recomendado)

En el paso **Informe G2 · Qué decirle** (o en la pestaña **Leer informe G2**) pega el enlace que se comparte
con el cliente (`https://shared.mmruns.com/areport2/index.php?r=CÓDIGO`) y pulsa **Cargar informe**:

- Se descargan los **valores exactos** del informe: cadencia, tiempo de contacto izquierda/derecha, balance,
  overstride, oscilación vertical, fuerzas, ángulos, puntuaciones de zapatilla (energy return, shock absorption,
  stride consistency) y perfil de corredor.
- Se **rellena la Fase 1** sola: cada zapatilla con sus velocidades en V1/V2/V3. El enlace queda guardado para
  el mensaje post-sesión.
- **Analizar** prepara el guion con esos datos, sin capturas. Las capturas siguen sirviendo como alternativa.

**El enlace se guarda con la sesión.** Se pega una vez, en la Fase 1 o en el paso de análisis. Cada vez que se
abre la sesión se vuelve a consultar mmruns, y con **Actualizar** (o «Actualizar solo cada 30 s») se recogen las
pasadas nuevas a medida que se graban. Las zapatillas de la Fase 1 se completan sin perder la ganadora elegida ni las
zapatillas añadidas a mano.

Cómo funciona: el enlace compartido no pide inicio de sesión. Al abrirlo, mmruns da un permiso temporal con el que
su API (`/api/report/CÓDIGO`) devuelve el informe en JSON. El navegador no deja a la app llamar a esa API
directamente, así que pasa por una función mínima, `api/mmruns.ts`, que solo acepta códigos de informe y no guarda
nada. En local la sirve `npm run dev` y en producción se publica en **Vercel**: importas el repositorio en
vercel.com, sin configurar nada más. En GitHub Pages esta parte no funciona porque no ejecuta funciones.

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

## Fichas de zapatillas y qué tipo le funciona al cliente

Cada modelo probado tiene un botón **Buscar ficha**, en la Fase 1 y en la lista del informe. Claude busca en
internet (RunRepeat, la web de la marca, tiendas y reviews) el drop, el stack del talón y del antepié, el peso, la
firmeza de la amortiguación, la reactividad, si lleva placa o rocker y el tipo de zapatilla. La ficha se guarda en
el dispositivo, se reutiliza en todos los clientes y se puede corregir a mano.

Al **Analizar**, esas fichas se cruzan con los datos del G2. Como en Stride Lab cada zapatilla se prueba a
velocidades distintas, se compara siempre a la misma velocidad. Sale una conclusión de **qué tipo de zapatilla le
funciona** (por ejemplo «drop 6-8 mm, amortiguación media, placa solo para ritmos rápidos») con la evidencia en
que se apoya.

## Ejercicios en directo

Para cada punto (máximo 3), el análisis propone un ejercicio sencillo que el cliente hace en la cinta y nota en el
momento. Cada uno lleva qué hace, el cue, **qué debe notar** para tomar consciencia y **qué dato del G2 debe
moverse**, para enseñárselo en pantalla. La guía de los 15 problemas es un ejemplo del estilo: si el problema no
está en la guía, se propone un ejercicio nuevo del mismo tipo. El paso **Informe G2 · Análisis** va antes de la
Fase 2, y allí los ejercicios propuestos se añaden con un clic.

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
entre las zapatillas y comparando cada zapatilla solo con las que se probaron a su misma velocidad. Es una sugerencia; la elección final
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
