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
| 70–85′ | **Cierre e informe** — 3 puntos clave, recomendaciones, mensaje post-sesión con botón de WhatsApp e impresión/PDF de la hoja de sesión | `Mensaje_PostSesion_G2.pdf` |

Cada fase muestra los puntos del timing y un cronómetro con el tiempo objetivo (se pone en rojo al pasarse).

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

Stack: React 18 + TypeScript + Vite, sin backend.

```
src/
  data/problems.ts   15 problemas × 3 ejercicios (guía de sesión)
  data/tests.ts      protocolo de tests clínicos y relación hallazgo → G2
  data/protocol.ts   WhatsApp previo, checklist, timing y velocidades
  lib/winner.ts      ranking de zapatillas con datos del G2
  lib/csv.ts         importación de tablas del G2
  lib/postMessage.ts mensaje post-sesión y enlace de WhatsApp
  views/             pantallas (ficha, sesión, hoja imprimible, referencia)
```
