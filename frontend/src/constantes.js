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

/** Clase de la etiqueta de color para cada estado de presupuesto o de ítem. */
export const COLOR_ESTADO = {
  EN_ESTIMACION: 'etiqueta-ambar',
  CONSOLIDADO: '',
  PRESENTADO: 'etiqueta-ambar',
  APROBADO: 'etiqueta-verde',
  RECHAZADO: 'etiqueta-rojo',
  SIN_CARGAR: '',
  PENDIENTE_CONFIRMACION: 'etiqueta-ambar',
  CONFIRMADO: 'etiqueta-verde',
};

const FORMATO_MONTO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

export function formatearMonto(monto) {
  return monto === null || monto === undefined ? '—' : FORMATO_MONTO.format(monto);
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
