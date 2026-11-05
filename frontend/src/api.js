// Llamadas al backend. La cookie de sesión viaja sola porque frontend y API comparten origen.

export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export async function api(ruta, { metodo = 'GET', datos } = {}) {
  const opciones = { method: metodo, credentials: 'same-origin', headers: {} };
  if (datos instanceof FormData) {
    // El navegador arma solo el encabezado multipart con su separador.
    opciones.body = datos;
  } else if (datos !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, opciones);
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor.');
  }

  // La sesión venció o se cerró: se vuelve al inicio de sesión. Las rutas de /auth responden 401 sin que sea un vencimiento.
  if (respuesta.status === 401 && !ruta.startsWith('/auth/')) {
    window.location.assign('/login');
    throw new ErrorApi(401, 'Tu sesión venció. Volvé a iniciar sesión.');
  }

  const texto = await respuesta.text();
  let cuerpo = null;
  try {
    cuerpo = texto ? JSON.parse(texto) : null;
  } catch {
    // Nginx responde en HTML cuando corta un pedido, por ejemplo si el archivo es demasiado grande.
    if (respuesta.ok) throw new ErrorApi(respuesta.status, 'La respuesta del servidor no es válida.');
  }
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, cuerpo?.mensaje ?? 'Ocurrió un error inesperado.');
  }
  return cuerpo;
}
