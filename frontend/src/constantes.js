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

/** Convierte "2026-11-10" en "10/11/2026" sin pasar por zonas horarias. */
export function formatearFecha(iso) {
  if (!iso) return '';
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}
