// Textos de protocolo: mensajes de WhatsApp previos, timing de sesión y mensaje post-sesión.
// Fuentes: Mensajes_WhatsApp_G2.pdf, Timing_Sesion_G2.pdf, Mensaje_PostSesion_G2.pdf

export const WHATSAPP_SEQUENCE: { title: string; note: string; text: string }[] = [
  {
    title: 'Presentación',
    note: 'Primer contacto — esperar confirmación antes de continuar.',
    text: `¡Hola! Somos el equipo de Stride Lab by Kalma

Te escribimos para preparar tu sesión de análisis biomecánico. Para que el estudio sea lo más completo posible, nos gustaría conocerte un poco antes de que vengas.

Te haremos unas preguntas cortas en varios mensajes — no te llevarán más de 5 minutos

¿Empezamos?`,
  },
  {
    title: 'Datos básicos',
    note: 'Esperar respuesta completa antes de continuar.',
    text: `Datos básicos

• ¿Cuál es tu nombre completo?
• ¿Cuántos años tienes?
• ¿Cuánto pesas y cuánto mides aproximadamente?
• ¿A qué te dedicas? ¿Pasas el día mayormente sentado o de pie?
• ¿Cuál es tu correo electrónico? (para enviarte el informe)`,
  },
  {
    title: 'Perfil como corredor',
    note: 'Esperar respuesta completa antes de continuar.',
    text: `Como corredor

• ¿Cuántos años llevas corriendo?
• ¿Cuántos km haces a la semana aproximadamente?
• ¿Corres en asfalto, montaña o mixto?
• ¿Cuál es tu ritmo habitual de entrenamiento?
• ¿Corres en competición? ¿Tienes alguna carrera próxima?`,
  },
  {
    title: 'Zapatillas',
    note: 'Esperar respuesta completa antes de continuar.',
    text: `Zapatillas

• ¿Qué zapatillas usas para entrenar? (marca y modelo si lo sabes)
• ¿Cuántos km aproximados tienen?
• ¿Tienes zapatillas de competición diferentes?
• ¿Puedes traer más de un par a la sesión? Cuantos más traigas, más completo será el estudio`,
  },
  {
    title: 'Historial + cierre',
    note: 'Mensaje final. Con todas las respuestas ya puedes rellenar la ficha del cliente.',
    text: `Historial

• ¿Has tenido lesiones relacionadas con la carrera?
• ¿Tienes alguna molestia ahora mismo aunque sea leve?
• ¿Has llevado plantillas alguna vez?
• ¿Has hecho algún estudio biomecánico antes?
• Y por último — ¿cómo has conocido Stride Lab? (boca a boca, Instagram, Google...)

¡Perfecto! Con esto llegamos preparados y aprovecharemos al máximo la sesión ¡Nos vemos pronto!`,
  },
];

export const PREP_CHECKLIST = [
  'Música ambient encendida (altavoz lateral, volumen bajo)',
  'mmruns.com abierto con la sesión del cliente lista',
  'Kinovea abierto y cámara activa',
  'Ficha del cliente impresa encima de la mesa',
  'Botella de agua para el cliente en la mesa',
  'Nada personal ni de otros clientes visible',
];

export interface TimingPhase {
  id: string;
  label: string;
  minutes: number;
  points: string[];
  tip?: string;
}

export const TIMING: TimingPhase[] = [
  {
    id: 'anamnesis',
    label: 'Recepción y anamnesis',
    minutes: 10,
    points: [
      'Saludar y hacer pasar — no ir corriendo, con calma',
      'Repasar la ficha con los datos recibidos por WhatsApp',
      'Preguntas en consulta: objetivo, lesiones, patología, fuerza, sueño',
      'Recoger TODAS las zapatillas que ha traído',
    ],
    tip: '"Lo que vamos a hacer hoy tiene dos partes: primero buscamos la zapatilla con la que tu cuerpo trabaja mejor, después trabajamos la técnica en directo."',
  },
  {
    id: 'observacion',
    label: 'Observación libre en cinta',
    minutes: 5,
    points: [
      'Cliente sube con la zapatilla de entrenamiento habitual',
      'Velocidad cómoda — la que él diga o empezar a 9 km/h',
      'Observar sin decir nada: postura, braceo, caída de cadera, overstriding',
      'No dar feedback todavía — necesitas verle correr natural',
      'Anotar los 2-3 problemas principales que ves',
    ],
    tip: 'Esta fase es solo para ti. El cliente no sabe que ya lo estás analizando.',
  },
  {
    id: 'fase1',
    label: 'Fase 1 — Selección de zapatilla',
    minutes: 30,
    points: [
      'V1 Suave 3 min — ritmo cómodo de recuperación (~9–10 km/h popular, ~11–12 competición)',
      'V2 Media 3 min — ritmo habitual de entrenamiento',
      'V3 Rápida 2 min — ritmo de competición o umbral, solo si tiene capacidad',
      'Descanso 1–2 min entre zapatillas. Cambio sin prisas.',
    ],
    tip: 'La ganadora es la que tenga TC más bajo, mejor simetría y oscilación vertical más estable. → "Con esta zapatilla tu cuerpo trabaja mejor — con esta seguimos."',
  },
  {
    id: 'fase2',
    label: 'Fase 2 — Corrección técnica en directo',
    minutes: 25,
    points: [
      'Base 3 min — velocidad cómoda, patrón natural con zapatilla ganadora',
      'Corrección 3–5 min — cue / ejercicio → captura inmediata → mostrar cambio',
      'Contraste 3 min — exageración del error → corrección → comparar en G2',
      'Cierre 2–3 min — pasada final a ritmo cómodo con todos los ajustes',
      'Máximo 2–3 problemas por sesión — no abrumar',
    ],
    tip: 'La última pasada es importante: el cliente "graba" la sensación correcta como último recuerdo muscular.',
  },
  {
    id: 'cierre',
    label: 'Cierre e informe',
    minutes: 15,
    points: [
      'Cliente baja de la cinta — darle agua',
      'Generar informe en mmruns.com',
      'Explicar máximo 3 puntos clave',
      'Adjuntar informe técnico del G2 por WhatsApp / email',
      'Avisar que en breve recibirá el informe de valoración completo con las pautas',
    ],
    tip: '"Lo más importante que te llevas hoy es: zapatilla X, trabajar Y, y Z." No alargar el cierre.',
  },
];

export const SPEEDS = [
  { id: 'V1', label: 'V1 — Suave', minutes: 3 },
  { id: 'V2', label: 'V2 — Media', minutes: 3 },
  { id: 'V3', label: 'V3 — Rápida', minutes: 2 },
] as const;

export type SpeedId = (typeof SPEEDS)[number]['id'];
