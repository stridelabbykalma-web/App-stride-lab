// Plantilla del mensaje post-sesión (Mensaje_PostSesion_G2.pdf).
// Se envía primero este mensaje; el informe de valoración completo con las pautas va después.

export interface PostMessageFields {
  nombre: string;
  modelo: string;
  hallazgos: [string, string, string];
  enlace: string;
}

const orPlaceholder = (v: string, ph: string) => (v.trim() ? v.trim() : `[${ph}]`);

export function buildPostMessage(f: PostMessageFields): string {
  const firstName = f.nombre.trim().split(/\s+/)[0] ?? '';
  return `¡Hola ${orPlaceholder(firstName, 'NOMBRE')}!

Gracias por venir hoy a Stride Lab — ha sido una sesión muy completa y con cosas muy interesantes para trabajar.

Te hacemos un pequeño resumen de lo más importante que vimos:

*Zapatilla recomendada:* ${orPlaceholder(f.modelo, 'MODELO')}
*Punto clave 1:* ${orPlaceholder(f.hallazgos[0], 'HALLAZGO 1')}
*Punto clave 2:* ${orPlaceholder(f.hallazgos[1], 'HALLAZGO 2')}
*Punto clave 3:* ${orPlaceholder(f.hallazgos[2], 'HALLAZGO 3')}

En breve te enviaremos el informe de valoración completo con todas las pautas personalizadas para que puedas trabajar en cada uno de estos puntos

Además te adjuntamos el informe técnico de la sesión:
${orPlaceholder(f.enlace, 'ENLACE O ADJUNTO')}

Si tienes cualquier duda sobre lo que vimos, escríbenos sin problema.

¡Mucho ánimo y a correr!`;
}

/** Campos que siguen sin rellenar en el mensaje. */
export const missingFields = (msg: string) => msg.match(/\[[A-ZÁÉÍÓÚ0-9 ]+\]/g) ?? [];

/** Enlace wa.me con el texto precargado. Sin teléfono abre el selector de contacto. */
export function whatsappLink(text: string, phone = ''): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 9) digits = '34' + digits; // número español sin prefijo
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
