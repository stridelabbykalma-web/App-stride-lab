// Guía de Sesión G2 — 15 problemas + 3 ejercicios en cinta por problema.
// Fuente: Guia_Sesion_G2_StrideLab.pdf (uso interno).

export interface Exercise {
  id: string; // E01, E02, E03
  name: string;
  how: string;
  cue: string;
  why: string;
}

export interface Problem {
  id: string; // "01".."15"
  name: string;
  /** Métrica del G2 que suele reflejar el problema, si la hay. */
  metric?: 'tc' | 'cadencia' | 'simetria' | 'oscilacion';
  exercises: Exercise[];
}

export const PROBLEMS: Problem[] = [
  {
    id: '01',
    name: 'TC alto',
    metric: 'tc',
    exercises: [
      {
        id: 'E01',
        name: 'Exageración y contraste',
        how: 'Pídele que corra exageradamente pesado 20" → muéstrale el TC en pantalla. Luego aplica el cue y muéstrale el cambio.',
        cue: 'Imagina que el suelo está lleno de brasas. El pie toca y sale — no se queda.',
        why: 'Ver el número bajar él solo genera más adherencia al cambio que cualquier explicación.',
      },
      {
        id: 'E02',
        name: 'Skipping directo a cinta',
        how: 'Para la cinta. Skipping rápido en el suelo 20" → sube directo sin parar. El sistema neuromuscular mantiene el ritmo automáticamente en los primeros 30-40".',
        cue: 'Mantén ese ritmo de pies — no lo pierdas al subir.',
        why: 'El sistema neuromuscular ya está activado y mantiene el ritmo de forma automática.',
      },
      {
        id: 'E03',
        name: 'Cadencia +5 ppm con metrónomo',
        how: 'Activa metrónomo a la cadencia objetivo. Pídele que sincronice los pasos sin correr más rápido.',
        cue: 'Más pasos, más cortos — no más rápido.',
        why: 'Al acortar la zancada el pie cae debajo del cuerpo y el TC baja solo por geometría.',
      },
    ],
  },
  {
    id: '02',
    name: 'Overstriding',
    exercises: [
      {
        id: 'E01',
        name: 'Inclinación de cinta 1-2%',
        how: 'Pon la cinta al 1-2% sin decirle nada más. Deja que corra y luego explícale lo que ha pasado.',
        cue: '¿Notas cómo el pie cae más debajo del cuerpo solo? Eso es lo que buscamos en llano.',
        why: 'La pendiente obliga a inclinarse hacia adelante. Cuando el cuerpo va adelante el pie no puede caer por delante.',
      },
      {
        id: 'E02',
        name: 'Palmas hacia arriba',
        how: 'Pídele que corra con las palmas mirando al techo como si llevara una bandeja durante 30".',
        cue: 'Mantén las palmas arriba — los hombros bajan solos.',
        why: 'Fuerza los hombros a bajar y rota la pelvis hacia adelante. Cuando la pelvis está bien el pie cae debajo.',
      },
      {
        id: 'E03',
        name: 'Pared de cristal imaginaria',
        how: 'Pídele que imagine que hay una pared de cristal a medio metro delante. No puede romperla con el pie.',
        cue: 'No puedes romper la pared — acorta el paso.',
        why: 'Genera la corrección de overstriding de forma refleja sin tener que pensar en la técnica.',
      },
    ],
  },
  {
    id: '03',
    name: 'Oscilación vertical alta',
    metric: 'oscilacion',
    exercises: [
      {
        id: 'E01',
        name: 'Techo imaginario',
        how: 'Pídele que imagine que hay un techo a 10 cm de su cabeza durante 30".',
        cue: 'No toques el techo — crece hacia adelante, no hacia arriba.',
        why: 'El cuerpo deja de buscar altura y busca avance horizontal. La energía que iba arriba ahora va adelante.',
      },
      {
        id: 'E02',
        name: 'Punto fijo en la pared',
        how: 'Señala un punto fijo a la altura de los ojos. Pídele que no lo pierda de vista mientras corre.',
        cue: 'Si botas, pierdes el punto. Mantenlo fijo.',
        why: 'El cuerpo se estabiliza solo para mantener el punto visual. Reduce el bote sin pensar en técnica.',
      },
      {
        id: 'E03',
        name: 'Deslízate no saltes',
        how: 'Pídele que cambie el patrón mental de salto a deslizamiento durante 30".',
        cue: 'No saltes — deslízate. Como si el suelo fuera hielo.',
        why: 'El corredor que salta frena la caída. El que desliza aprovecha la energía para avanzar.',
      },
    ],
  },
  {
    id: '04',
    name: 'Asimetría',
    metric: 'simetria',
    exercises: [
      {
        id: 'E01',
        name: 'Foco en pierna débil',
        how: 'Pídele que olvide la pierna dominante y solo sienta la débil durante 30".',
        cue: 'Olvida la pierna derecha. Solo siente cómo cae y sale la izquierda.',
        why: 'El cerebro activa neurológicamente la pierna débil que estaba en piloto automático.',
      },
      {
        id: 'E02',
        name: 'Saltos a una pierna antes de correr',
        how: 'Para la cinta. 10 saltos pequeños sobre la pierna débil → sube directo a correr.',
        cue: 'Activa esa pierna ahora — así correrá activada.',
        why: 'El sistema nervioso tiene memoria corta. Si la activas justo antes, corre activada.',
      },
      {
        id: 'E03',
        name: 'Contar pasos de la pierna débil',
        how: 'Pídele que cuente solo los pasos de la pierna débil en voz alta o mentalmente durante 30".',
        cue: 'Uno… dos… tres — solo cuenta la izquierda.',
        why: 'El foco consciente en esa pierna equilibra la carga entre ambos lados de forma inmediata.',
      },
    ],
  },
  {
    id: '05',
    name: 'Caída de cadera',
    exercises: [
      {
        id: 'E01',
        name: 'Línea recta imaginaria',
        how: 'Pídele que imagine una línea recta en el centro de la cinta y que los pies caigan sobre ella.',
        cue: 'Dos pies sobre la misma línea — uno delante del otro.',
        why: 'Activa el glúteo medio automáticamente para estabilizar la pelvis sin pensar en ello.',
      },
      {
        id: 'E02',
        name: 'Manos en caderas',
        how: 'Pídele que corra con las manos en las caderas durante 20".',
        cue: '¿Notas si una cae más que la otra? Intenta que vayan al mismo nivel.',
        why: 'El feedback táctil directo hace consciente algo que normalmente pasa totalmente desapercibido.',
      },
      {
        id: 'E03',
        name: 'Vaso de agua en la cabeza',
        how: 'Usa la imagen visual del Kinovea si tienes vista trasera disponible.',
        cue: 'Llevas un vaso de agua en la cabeza — no lo derrames.',
        why: 'La imagen de estabilidad obliga a estabilizar la pelvis de forma automática.',
      },
    ],
  },
  {
    id: '06',
    name: 'Braceo tenso o cruzado',
    exercises: [
      {
        id: 'E01',
        name: 'Sacudir las manos',
        how: 'Reduce la velocidad un momento. Pídele que sacuda las manos como si tuviera agua en los dedos 10" → sube velocidad y corre.',
        cue: 'Mantén esa soltura en las manos mientras corres.',
        why: 'La tensión viaja de manos a hombros a caderas. Si las manos están sueltas toda la cadena se relaja.',
      },
      {
        id: 'E02',
        name: 'Palmas hacia arriba 30"',
        how: 'Corre con palmas mirando al techo. Aquí el foco es la relajación del braceo, no la pelvis.',
        cue: '¿Notas cómo los hombros bajan solos? Así deben estar siempre.',
        why: 'La tensión en el braceo es uno de los principales frenos de la cadena cinética.',
      },
      {
        id: 'E03',
        name: 'Patata caliente en cada mano',
        how: 'Pídele que imagine que lleva una patata caliente en cada mano durante 30".',
        cue: 'Ni la aprietes ni la sueltes — solo sostenla.',
        why: 'Regula la tensión del agarre y libera la cadena superior de forma precisa.',
      },
    ],
  },
  {
    id: '07',
    name: 'Tronco muy inclinado adelante',
    exercises: [
      {
        id: 'E01',
        name: 'Mirar al frente no al suelo',
        how: 'Pídele que suba la mirada a la pared de delante y la mantenga fija ahí.',
        cue: 'Mira la pared — no el suelo. Donde va la cabeza va el cuerpo.',
        why: 'La cabeza alineada coloca el tronco automáticamente. Es la corrección más rápida y efectiva.',
      },
      {
        id: 'E02',
        name: 'Crecer hacia arriba',
        how: 'Pídele que imagine que alguien le tira de la coronilla hacia el techo mientras corre.',
        cue: 'Crece mientras corres — alguien tira de tu cabeza hacia arriba.',
        why: 'Alarga la columna y corrige la inclinación sin necesidad de pensar en la postura del tronco.',
      },
      {
        id: 'E03',
        name: 'Reducir velocidad y reconstruir',
        how: 'Baja la velocidad de la cinta. Pídele que se coloque bien y luego sube progresivamente.',
        cue: 'Primero postura, luego velocidad — no al revés.',
        why: 'El patrón de compensación está muy asentado a velocidades altas. La corrección se consolida mejor partiendo de ritmo bajo.',
      },
    ],
  },
  {
    id: '08',
    name: 'Tronco erguido o hacia atrás',
    exercises: [
      {
        id: 'E01',
        name: 'Inclinación 1-2%',
        how: 'Pon la cinta al 1-2%. La pendiente genera la inclinación correcta de forma automática.',
        cue: '¿Sientes cómo el cuerpo busca inclinarse solo? Eso es lo que necesitas en llano.',
        why: 'La pendiente obliga al cuerpo a inclinarse hacia adelante sin que el corredor tenga que pensarlo.',
      },
      {
        id: 'E02',
        name: 'Caída controlada hacia adelante',
        how: 'Pídele que imagine que se va a caer hacia adelante y los pies le salvan.',
        cue: 'Déjate caer ligeramente — los pies siempre estarán ahí.',
        why: 'Genera la inclinación natural de la carrera eficiente. El miedo a caer suele ser lo que mantiene el tronco atrás.',
      },
      {
        id: 'E03',
        name: 'Acelerar progresivamente',
        how: 'Sube la velocidad en incrementos pequeños y muéstrale la imagen en Kinovea.',
        cue: 'Mira cómo a más velocidad el cuerpo busca solo la posición correcta.',
        why: 'A más velocidad el cuerpo necesita inclinación para avanzar eficientemente. La imagen lo hace muy evidente.',
      },
    ],
  },
  {
    id: '09',
    name: 'Pisada de talón muy marcada',
    exercises: [
      {
        id: 'E01',
        name: 'Ankling',
        how: 'Para la cinta. Pasos muy cortos con tobillo rígido, casi sin doblar rodilla, rozando el suelo 20" → sube a correr.',
        cue: 'El tobillo no dobla — es un muelle que se comprime y se libera.',
        why: 'Activa el tobillo y reduce el impacto de talón de forma refleja al subir a la cinta.',
      },
      {
        id: 'E02',
        name: 'Subir cadencia',
        how: 'Usa metrónomo o sube la cadencia 5-10 ppm.',
        cue: 'Más pasos, más cortos — el talón no tiene tiempo de adelantarse.',
        why: 'A mayor cadencia el pie cae más debajo del cuerpo y el talón deja de ser el primer punto de contacto.',
      },
      {
        id: 'E03',
        name: 'Roza el suelo',
        how: 'Pídele que cambie el patrón mental de golpear a rozar durante 30".',
        cue: 'No golpees el suelo — rózalo. El pie acaricia la superficie.',
        why: 'Cambia el patrón de impacto a contacto progresivo. Reduce el pico de fuerza de reacción del suelo.',
      },
    ],
  },
  {
    id: '10',
    name: 'Cadencia baja',
    metric: 'cadencia',
    exercises: [
      {
        id: 'E01',
        name: 'Metrónomo o audio',
        how: 'Pon metrónomo o música a la cadencia objetivo — normalmente 170-180 ppm.',
        cue: 'Sincroniza los pasos con el ritmo — no corras más rápido, solo más pasos.',
        why: 'El feedback auditivo externo es el regulador de cadencia más eficaz y más rápido.',
      },
      {
        id: 'E02',
        name: 'Skipping marcando ritmo',
        how: 'Skipping rápido en sitio 20" marcando bien el ritmo → sube directo a cinta sin parar.',
        cue: 'Mantén ese ritmo de pies al subir — no lo pierdas.',
        why: 'El cuerpo ya sabe a qué velocidad tiene que ir. Transferir el ritmo del skipping a la cinta es inmediato.',
      },
      {
        id: 'E03',
        name: 'Zancada corta exagerada',
        how: 'Pídele que exagere los pasos cortos 30" como si corriera entre obstáculos muy juntos. Luego vuelve a normal.',
        cue: 'Como si hubiera obstáculos cada 30 cm — pasos muy pequeños.',
        why: 'El contraste hace que su cadencia habitual parezca lenta y la suba de forma natural.',
      },
    ],
  },
  {
    id: '11',
    name: 'Falta de impulso de tobillo',
    exercises: [
      {
        id: 'E01',
        name: 'Ankling',
        how: 'Pasos cortos con tobillo activo y rígido rozando el suelo 20" → sube a correr.',
        cue: 'El tobillo es un muelle — se comprime y te propulsa solo.',
        why: 'Activa el ciclo estiramiento-acortamiento del tendón de Aquiles justo antes de correr.',
      },
      {
        id: 'E02',
        name: 'Saltos de puntillas en sitio',
        how: '10-15 saltos pequeños sobre puntillas, rebote rápido, talón que no toca → sube a correr.',
        cue: 'Rápido y reactivo — el talón no toca el suelo.',
        why: 'Pre-activa el complejo tobillo-Aquiles en modo reactivo. La transferencia a la carrera es inmediata.',
      },
      {
        id: 'E03',
        name: 'Muelle en el tobillo',
        how: 'Pídele que imagine que tiene un muelle en el tobillo mientras corre durante 30".',
        cue: 'Cada vez que el pie toca el suelo el muelle se comprime y te lanza hacia adelante.',
        why: 'Activa el ciclo estiramiento-acortamiento de forma cognitiva. Muy efectivo para corredores sin base técnica.',
      },
    ],
  },
  {
    id: '12',
    name: 'Rotación excesiva de tronco',
    exercises: [
      {
        id: 'E01',
        name: 'Faros en los hombros',
        how: 'Baja la velocidad. Pídele que imagine que tiene dos faros en los hombros apuntando siempre al frente.',
        cue: 'Los faros no se giran — siempre apuntan a la pared.',
        why: 'El foco en los hombros estabiliza el tronco automáticamente. Más fácil de interiorizar que pensar en la rotación.',
      },
      {
        id: 'E02',
        name: 'Codos hacia atrás',
        how: 'Si el braceo cruza la línea media, pídele que lleve los codos hacia atrás durante 30".',
        cue: 'Los codos van hacia atrás — como si empujaras paredes a los lados.',
        why: 'Corrige el origen de la rotación. La mayoría de rotaciones excesivas vienen de un braceo que cruza la línea media.',
      },
      {
        id: 'E03',
        name: 'Reducir velocidad y reconstruir',
        how: 'Baja la velocidad. Pídele que se estabilice y luego sube progresivamente con la corrección.',
        cue: 'Primero sin rotar, luego añadimos velocidad.',
        why: 'A velocidades altas el patrón de rotación es muy automático. La corrección debe consolidarse partiendo de ritmo bajo.',
      },
    ],
  },
  {
    id: '13',
    name: 'Rodillas con poco rango',
    exercises: [
      {
        id: 'E01',
        name: 'High knees suave en sitio',
        how: 'Rodillas al frente, suaves, sin exagerar 20" → sube directo a cinta.',
        cue: 'Lleva la rodilla hacia adelante — no hacia arriba.',
        why: 'Pre-activa los flexores de cadera. La zancada se alarga de forma natural al subir a la cinta.',
      },
      {
        id: 'E02',
        name: 'A-skip lento',
        how: 'Skip con rodilla al frente y extensión de cadera atrás, alternando despacio 20" → sube a correr.',
        cue: 'Siente cómo la cadera se abre con cada paso.',
        why: 'Trabaja simultáneamente la elevación de rodilla y la extensión de cadera. Los dos extremos de la zancada.',
      },
      {
        id: 'E03',
        name: 'Rodilla a la pared',
        how: 'Pídele mientras corre que lleve la rodilla hacia la pared de delante en cada zancada.',
        cue: 'Rodilla hacia la pared — no hacia el suelo.',
        why: 'Mejora el rango de cadera y alarga la zancada de forma controlada sin riesgo de overstriding.',
      },
    ],
  },
  {
    id: '14',
    name: 'Pisada muy lateral',
    exercises: [
      {
        id: 'E01',
        name: 'Línea recta imaginaria',
        how: 'Pídele que imagine una línea en el centro de la cinta y que los dos pies caigan sobre esa línea.',
        cue: 'Un pie delante del otro — como si caminaras por una cuerda floja.',
        why: 'Corrige la base de sustentación sin tener que pensar en la técnica del pie.',
      },
      {
        id: 'E02',
        name: 'Mirar los pies 10"',
        how: 'Permite que baje la vista a los pies 10" para que sea consciente de dónde caen. Luego mira al frente.',
        cue: '¿Los ves? Ahora mira al frente y mantén esa sensación.',
        why: 'El feedback visual directo es muy potente. Con 10" es suficiente para crear la consciencia del patrón.',
      },
      {
        id: 'E03',
        name: 'Pies en paralelo — esquíes',
        how: 'Pídele que imagine que lleva esquíes durante 30".',
        cue: 'Esquíes siempre paralelos — nunca abiertos hacia los lados.',
        why: 'Corrige la rotación externa del pie de forma inmediata. La imagen es intuitiva y fácil de mantener.',
      },
    ],
  },
  {
    id: '15',
    name: 'Falta de extensión de cadera',
    exercises: [
      {
        id: 'E01',
        name: 'A-skip con extensión exagerada',
        how: 'Skip lento con extensión activa de cadera atrás en cada paso, exagerando 20" → sube a correr.',
        cue: 'Siente cómo el glúteo empuja en cada extensión — eso es lo que buscamos.',
        why: 'Trabaja la extensión de cadera con feedback táctil del propio glúteo. La transferencia a la carrera es directa.',
      },
      {
        id: 'E02',
        name: 'Empuja el suelo hacia atrás',
        how: 'Pídele que cambie el foco mental durante 30".',
        cue: 'No empujes hacia abajo — empuja el suelo hacia atrás, como si movieras la cinta con el pie.',
        why: 'Activa la extensión de cadera y el glúteo de forma inmediata. Es la imagen más efectiva para este patrón.',
      },
      {
        id: 'E03',
        name: 'Subir velocidad progresivamente',
        how: 'Sube la velocidad en incrementos pequeños y muéstrale la imagen en Kinovea.',
        cue: '¿Notas cómo el glúteo trabaja más? Así debe ser a cualquier velocidad.',
        why: 'A más velocidad el cuerpo necesita más extensión de cadera. La imagen lo hace evidente y auto-motivador.',
      },
    ],
  },
];

export const findProblem = (id: string) => PROBLEMS.find((p) => p.id === id);
export const findExercise = (problemId: string, exerciseId: string) =>
  findProblem(problemId)?.exercises.find((e) => e.id === exerciseId);
