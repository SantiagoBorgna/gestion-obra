// Nombres para mostrar de los valores que usa el backend.

export const RUBROS = {
  MOVIMIENTO_DE_SUELOS: 'Movimiento de suelos',
  FUNDACIONES: 'Fundaciones',
  ESTRUCTURAS: 'Estructuras',
  MAMPOSTERIA: 'Mampostería',
  TECHOS_Y_CUBIERTAS: 'Techos y cubiertas',
  INSTALACION_SANITARIA: 'Instalación sanitaria',
  INSTALACION_ELECTRICA: 'Instalación eléctrica',
  INSTALACION_DE_GAS: 'Instalación de gas',
  REVOQUES: 'Revoques',
  PISOS: 'Pisos',
  CARPINTERIA: 'Carpintería',
  PINTURA: 'Pintura',
  TERMINACIONES: 'Terminaciones',
};

export const ROLES = {
  ARQUITECTO: 'Arquitecto',
  CUADRILLA: 'Cuadrilla',
  ESPECIALISTA: 'Especialista',
  CLIENTE: 'Cliente',
};

export const ESTADOS_OBRA = {
  EN_CURSO: 'En curso',
  FINALIZADA: 'Finalizada',
};

export const ESTADOS_PRESUPUESTO = {
  EN_ESTIMACION: 'En estimación',
  CONSOLIDADO: 'Consolidado',
  PRESENTADO: 'Presentado',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

export const ESTADOS_ITEM = {
  SIN_CARGAR: 'Sin cargar',
  PENDIENTE_CONFIRMACION: 'Pendiente de confirmación',
  CONFIRMADO: 'Confirmado',
};

/** "$8.000.000", con centavos solo cuando los tiene ("$1.270.000,50"). */
export function formatearMonto(monto) {
  if (monto === null || monto === undefined) return '-';
  const decimales = Number.isInteger(Number(monto)) ? 0 : 2;
  const formato = new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: 2 });
  const texto = `$${formato.format(Math.abs(monto))}`;
  return Number(monto) < 0 ? `-${texto}` : texto;
}

/** Clase de color del texto según el nivel de desvío. */
export const COLOR_NIVEL = {
  SIN_DESVIO: 'texto-verde',
  BAJO: 'texto-secundario',
  MODERADO: 'texto-ambar',
  ALTO: 'texto-error',
};

/** "17.3%"; con signo, "+17.3%". */
export function formatearPorcentaje(valor, conSigno = false) {
  const numero = Number(valor);
  const texto = Number.isInteger(numero) ? String(numero) : numero.toFixed(1);
  return `${conSigno && numero > 0 ? '+' : ''}${texto}%`;
}

/** "+$170.000 · +17.3%", a partir de un objeto con diferencia y porcentaje. */
export function formatearDiferencia({ diferencia, porcentaje }) {
  const signo = Number(diferencia) > 0 ? '+' : '';
  return `${signo}${formatearMonto(diferencia)} · ${formatearPorcentaje(porcentaje, true)}`;
}

/** "Septiembre 2026" a partir de "2026-09-05". */
export function formatearMes(iso) {
  const [anio, mes] = iso.split('-');
  const nombre = new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString('es-AR', { month: 'long' });
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
}

/** Convierte "2026-11-10" en "10/11/2026" sin pasar por zonas horarias. */
export function formatearFecha(iso) {
  if (!iso) return '';
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Fecha de hoy en "2026-11-10", según la hora local y no la de UTC. */
export function fechaDeHoy() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
