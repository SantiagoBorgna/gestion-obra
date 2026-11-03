// Llamadas al backend. La cookie de sesión viaja sola porque frontend y API comparten origen.

export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export async function api(ruta, { metodo = 'GET', datos } = {}) {
  const opciones = { method: metodo, credentials: 'same-origin', headers: {} };
  if (datos !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, opciones);
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor.');
  }

  const texto = await respuesta.text();
  const cuerpo = texto ? JSON.parse(texto) : null;
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, cuerpo?.mensaje ?? 'Ocurrió un error inesperado.');
  }
  return cuerpo;
}
