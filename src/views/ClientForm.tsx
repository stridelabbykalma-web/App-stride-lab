import type { Client } from '../types';
import { Card, Choice, Text } from '../ui';

export function ClientForm({ client, onChange }: { client: Client; onChange: (c: Client) => void }) {
  const set = <K extends keyof Client>(k: K) => (v: Client[K]) => onChange({ ...client, [k]: v });

  return (
    <div className="stack">
      <p className="hint">
        Rellena con las respuestas de la secuencia de WhatsApp. Lo que falte, se pregunta en consulta.
      </p>
      <Card title="1. Datos personales">
        <div className="grid">
          <Text label="Nombre completo" value={client.nombre} onChange={set('nombre')} />
          <Text label="Teléfono (WhatsApp)" value={client.telefono} onChange={set('telefono')} inputMode="tel" />
          <Text label="Correo electrónico" value={client.email} onChange={set('email')} inputMode="email" />
          <Text label="Edad" value={client.edad} onChange={set('edad')} inputMode="numeric" />
          <Text label="Peso" unit="kg" value={client.peso} onChange={set('peso')} inputMode="decimal" />
          <Text label="Talla" unit="cm" value={client.talla} onChange={set('talla')} inputMode="numeric" />
          <Text label="Ocupación" value={client.ocupacion} onChange={set('ocupacion')} />
        </div>
        <Choice
          label="Jornada laboral"
          value={client.jornada}
          onChange={set('jornada')}
          options={[['sentado', 'Mayormente sentado'], ['de-pie', 'Mayormente de pie'], ['mixto', 'Mixto']]}
        />
      </Card>

      <Card title="2. Perfil como corredor">
        <div className="grid">
          <Text label="Años corriendo" value={client.anosCorriendo} onChange={set('anosCorriendo')} />
          <Text label="Km / semana aprox." value={client.kmSemana} onChange={set('kmSemana')} />
          <Text label="Ritmo habitual" unit="min/km" value={client.ritmo} onChange={set('ritmo')} />
        </div>
        <Choice
          label="Tipo de terreno"
          value={client.terreno}
          onChange={set('terreno')}
          options={[['asfalto', 'Asfalto'], ['montana', 'Montaña'], ['mixto', 'Mixto']]}
        />
        <Choice label="¿Corre en competición?" value={client.competicion} onChange={set('competicion')} options={[['si', 'Sí'], ['no', 'No']]} />
        <Text label="Próxima carrera u objetivo concreto" value={client.objetivoCarrera} onChange={set('objetivoCarrera')} />
      </Card>

      <Card title="3. Zapatillas">
        <div className="grid">
          <Text label="Zapatilla de entrenamiento (marca / modelo)" value={client.zapEntreno} onChange={set('zapEntreno')} />
          <Text label="Km aproximados que tienen" value={client.zapEntrenoKm} onChange={set('zapEntrenoKm')} />
          <Text label="Zapatilla de competición (marca / modelo)" value={client.zapCompeticion} onChange={set('zapCompeticion')} />
        </div>
        <Text label="¿Trae más pares a la sesión? ¿Cuáles?" value={client.zapExtra} onChange={set('zapExtra')} />
      </Card>

      <Card title="4. Historial de lesiones">
        <Text area label="Lesiones pasadas relacionadas con la carrera" value={client.lesionesPasadas} onChange={set('lesionesPasadas')} />
        <Text area label="Molestias actuales (aunque sean leves)" value={client.molestiasActuales} onChange={set('molestiasActuales')} />
        <Choice
          label="¿Ha llevado plantillas?"
          value={client.plantillas}
          onChange={set('plantillas')}
          options={[['si', 'Sí'], ['no', 'No'], ['actualmente', 'Actualmente sí']]}
        />
        <Choice label="¿Estudio biomecánico previo?" value={client.estudioPrevio} onChange={set('estudioPrevio')} options={[['si', 'Sí'], ['no', 'No']]} />
        {client.estudioPrevio === 'si' && (
          <Text label="¿Dónde y cuándo?" value={client.estudioPrevioDonde} onChange={set('estudioPrevioDonde')} />
        )}
      </Card>

      <Card title="5. Objetivo y motivación">
        <Text area label="¿Por qué ha decidido hacer el estudio ahora?" value={client.porQueAhora} onChange={set('porQueAhora')} />
        <Text area label="¿Qué espera llevarse de la sesión?" value={client.expectativas} onChange={set('expectativas')} />
        <Choice
          label="Objetivo principal"
          value={client.objetivo}
          onChange={set('objetivo')}
          options={[['rendimiento', 'Rendimiento'], ['prevencion', 'Prevención'], ['lesion', 'Lesión concreta']]}
        />
      </Card>

      <Card title="6. Estilo de vida">
        <Choice
          label="¿Hace trabajo de fuerza?"
          value={client.fuerza}
          onChange={set('fuerza')}
          options={[['regular', 'Sí, regularmente'], ['ocasional', 'Ocasionalmente'], ['no', 'No']]}
        />
        <div className="grid">
          <Text label="Otros deportes que practica" value={client.otrosDeportes} onChange={set('otrosDeportes')} />
          <Text label="Horas de sueño media" value={client.horasSueno} onChange={set('horasSueno')} />
        </div>
        <Text area label="Patología general a tener en cuenta" value={client.patologia} onChange={set('patologia')} />
      </Card>

      <Card title="7. ¿Cómo ha conocido Stride Lab?">
        <Choice
          label="Origen"
          value={client.origen}
          onChange={set('origen')}
          options={[
            ['boca-a-boca', 'Boca a boca'],
            ['instagram', 'Instagram'],
            ['google', 'Google'],
            ['medico-fisio', 'Médico / fisio'],
            ['otro', 'Otro'],
          ]}
        />
        <Text label="¿Quién lo ha recomendado?" value={client.recomendadoPor} onChange={set('recomendadoPor')} />
      </Card>
    </div>
  );
}
