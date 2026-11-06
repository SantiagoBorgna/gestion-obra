// Carga obras de ejemplo en distintos estados, usando la misma API que usan las pantallas.
// Se ejecuta con: docker compose run --rm datos-ejemplo
// Solo funciona con la base vacía, para no mezclarse con datos reales.

const API = process.env.API_URL ?? 'http://localhost:8080/api';
const MAILPIT = process.env.MAILPIT_URL ?? 'http://localhost:8025/api/v1';
const ARQUITECTO_EMAIL = process.env.ARQUITECTO_EMAIL ?? 'arquitecto@gestionobra.local';
const ARQUITECTO_CLAVE = process.env.ARQUITECTO_CLAVE ?? 'obra-demo-local-2026';
const CLAVE = 'caracol dorado sobre el puente';

const LAURA = 'laura@correo.test';
const MARTIN = 'martin@correo.test';
const CARLA = 'carla@correo.test';
const PABLO = 'pablo@correo.test';
const DIEGO = 'diego@correo.test';
const MARCOS = 'marcos@correo.test';
const WALTER = 'walter@correo.test';
const SOFIA = 'sofia@correo.test';

const esperar = (milisegundos) => new Promise((resolver) => { setTimeout(resolver, milisegundos); });

/** Devuelve una función para llamar a la API que conserva la cookie de sesión entre llamadas. */
function nuevaSesion() {
  let cookie = '';
  return async (metodo, ruta, datos) => {
    const opciones = { method: metodo, headers: {} };
    if (cookie) opciones.headers.cookie = cookie;
    if (datos instanceof FormData) {
      opciones.body = datos;
    } else if (datos !== undefined) {
      opciones.headers['Content-Type'] = 'application/json';
      opciones.body = JSON.stringify(datos);
    }
    const respuesta = await fetch(API + ruta, opciones);
    const recibida = respuesta.headers.get('set-cookie');
    if (recibida) cookie = recibida.split(';')[0];
    const texto = await respuesta.text();
    if (!respuesta.ok) throw new Error(`${metodo} ${ruta} respondió ${respuesta.status}: ${texto}`);
    return texto ? JSON.parse(texto) : null;
  };
}

async function entrar(email, clave = CLAVE) {
  const sesion = nuevaSesion();
  await sesion('POST', '/auth/login', { email, clave });
  return sesion;
}

async function esperarBackend() {
  for (let intento = 0; intento < 60; intento += 1) {
    try {
      if ((await fetch(`${API}/health`)).ok) return;
    } catch {
      // Todavía está arrancando.
    }
    await esperar(2000);
  }
  throw new Error('El backend no respondió en dos minutos.');
}

/** Define la contraseña con el enlace que llegó a Mailpit, como haría la persona invitada. */
async function activarCuenta(email) {
  for (let intento = 0; intento < 20; intento += 1) {
    const consulta = encodeURIComponent(`to:${email}`);
    const { messages } = await (await fetch(`${MAILPIT}/search?query=${consulta}`)).json();
    if (messages?.length > 0) {
      const { Text } = await (await fetch(`${MAILPIT}/message/${messages[0].ID}`)).json();
      const token = Text.match(/token=([\w-]+)/)[1];
      await nuevaSesion()('POST', `/invitaciones/${token}`, { clave: CLAVE });
      return;
    }
    await esperar(500);
  }
  throw new Error(`No llegó la invitación de ${email}.`);
}

/** PDF chico y válido, para que se vea algo al abrir el comprobante. */
function crearPdf(texto) {
  const contenido = `BT /F1 18 Tf 60 760 Td (${texto}) Tj ET`;
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let salida = '%PDF-1.4\n';
  const posiciones = [];
  objetos.forEach((objeto, indice) => {
    posiciones.push(salida.length);
    salida += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
  });
  const xref = salida.length;
  salida += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  posiciones.forEach((posicion) => { salida += `${String(posicion).padStart(10, '0')} 00000 n \n`; });
  salida += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(salida, 'latin1');
}

await esperarBackend();
const arquitecto = await entrar(ARQUITECTO_EMAIL, ARQUITECTO_CLAVE);

if ((await arquitecto('GET', '/obras')).length > 0) {
  console.error('La base ya tiene obras, así que no se cargó nada.');
  console.error('Para empezar de cero: docker compose down -v, docker compose up --build -d y este comando de nuevo.');
  process.exit(1);
}

async function crearObra(titulo, ubicacion, fechaInicio, descripcion, nombreCliente, emailCliente) {
  const obra = await arquitecto('POST', '/obras', { titulo, ubicacion, fechaInicio, descripcion, nombreCliente, emailCliente });
  return `/obras/${obra.id}`;
}

async function agregarParticipantes(obra, participantes) {
  for (const [nombreCompleto, email, rol, rubro] of participantes) {
    await arquitecto('POST', `${obra}/participantes`, { nombreCompleto, email, rol, rubro });
  }
}

/** Carga las tareas y devuelve sus identificadores por descripción. */
async function cargarTareas(obra, tareas) {
  const ids = {};
  for (const [descripcion, rubro] of tareas) {
    ids[descripcion] = (await arquitecto('POST', `${obra}/tareas`, { descripcion, rubro })).id;
  }
  return ids;
}

const costosDe = (ids, costos) => Object.entries(costos).map(([descripcion, monto]) => ({ idTarea: ids[descripcion], monto }));

async function registrarMovimiento(obra, tipo, idItem, fecha, monto, descripcion, comprobantes = 1) {
  const datos = new FormData();
  datos.append('tipo', tipo);
  if (idItem) datos.append('idItem', idItem);
  datos.append('fecha', fecha);
  datos.append('monto', monto);
  datos.append('descripcion', descripcion);
  const texto = `Comprobante: ${descripcion}`.normalize('NFD').replace(/[^\x20-\x7e]/g, '');
  for (let numero = 1; numero <= comprobantes; numero += 1) {
    datos.append('archivos', new Blob([crearPdf(texto)], { type: 'application/pdf' }), `comprobante-${numero}.pdf`);
  }
  return arquitecto('POST', `${obra}/pagos`, datos);
}

// Obra Ejemplo: aprobada, con cobros, pagos, un pago anulado y dos alertas. Son los números de las interfaces del documento.
const ejemplo = await crearObra('Obra Ejemplo', 'Oliva, Córdoba', '2026-09-01', 'Vivienda unifamiliar de dos plantas', 'Laura Pérez', LAURA);
await agregarParticipantes(ejemplo, [
  ['Diego Fernández', DIEGO, 'CUADRILLA', 'FUNDACIONES'],
  ['Marcos Ruiz', MARCOS, 'CUADRILLA', 'MAMPOSTERIA'],
  ['Walter Gómez', WALTER, 'ESPECIALISTA', 'INSTALACION_ELECTRICA'],
  ['Walter Gómez', WALTER, 'ESPECIALISTA', 'INSTALACION_SANITARIA'],
  ['Sofía Martínez', SOFIA, 'ESPECIALISTA', 'PINTURA'],
]);
for (const email of [LAURA, DIEGO, MARCOS, WALTER]) await activarCuenta(email);
const tareasEjemplo = await cargarTareas(ejemplo, [
  ['Excavación de zanjas', 'FUNDACIONES'],
  ['Hormigón de cimiento corrido', 'FUNDACIONES'],
  ['Muro de ladrillo hueco 18 cm', 'MAMPOSTERIA'],
  ['Tabiques interiores 12 cm', 'MAMPOSTERIA'],
  ['Dinteles de hormigón', 'MAMPOSTERIA'],
  ['Cañerías y cajas', 'INSTALACION_ELECTRICA'],
  ['Cableado y tablero', 'INSTALACION_ELECTRICA'],
  ['Cañerías de agua', 'INSTALACION_SANITARIA'],
]);
const presupuesto = await arquitecto('POST', `${ejemplo}/presupuesto/solicitar-costos`);
const item = (rubro) => presupuesto.items.find((i) => i.rubro === rubro).id;
await arquitecto('PUT', `${ejemplo}/tareas/costos`, {
  costos: costosDe(tareasEjemplo, {
    'Excavación de zanjas': 900000,
    'Hormigón de cimiento corrido': 950000,
    'Muro de ladrillo hueco 18 cm': 1450000,
    'Tabiques interiores 12 cm': 700000,
    'Dinteles de hormigón': 250000,
    'Cañerías y cajas': 600000,
    'Cableado y tablero': 670000,
    'Cañerías de agua': 980000,
  }),
});
await arquitecto('PUT', `${ejemplo}/presupuesto/honorarios`, { monto: 1500000 });
await arquitecto('POST', `${ejemplo}/presupuesto/consolidar`);
await arquitecto('POST', `${ejemplo}/presupuesto/presentar`);
await (await entrar(LAURA))('POST', `${ejemplo}/presupuesto/aprobar`);

await registrarMovimiento(ejemplo, 'INGRESO', null, '2026-08-28', 3000000, 'Anticipo inicial');
await registrarMovimiento(ejemplo, 'INGRESO', null, '2026-09-20', 1500000, 'Segunda cuota - cimientos');
await registrarMovimiento(ejemplo, 'INGRESO', null, '2026-10-10', 1500000, 'Tercera cuota - mampostería', 2);

await registrarMovimiento(ejemplo, 'EGRESO', item('FUNDACIONES'), '2026-09-10', 1000000, 'Excavación y primera parte de cimientos');
await registrarMovimiento(ejemplo, 'EGRESO', item('INSTALACION_SANITARIA'), '2026-09-22', 600000, 'Cañerías de agua, primera parte', 2);
await registrarMovimiento(ejemplo, 'EGRESO', item('FUNDACIONES'), '2026-09-30', 850000, 'Saldo de cimientos');
await registrarMovimiento(ejemplo, 'EGRESO', item('MAMPOSTERIA'), '2026-10-08', 1200000, 'Muros de planta baja');
const anulado = await registrarMovimiento(ejemplo, 'EGRESO', item('MAMPOSTERIA'), '2026-10-12', 350000, 'Tabiques interiores');
await arquitecto('POST', `${ejemplo}/pagos/${anulado.id}/anular`, { motivo: 'monto mal cargado' });
await registrarMovimiento(ejemplo, 'EGRESO', item('INSTALACION_SANITARIA'), '2026-10-15', 550000, 'Cañerías de agua, saldo');
await registrarMovimiento(ejemplo, 'EGRESO', item('INSTALACION_ELECTRICA'), '2026-10-16', 420000, 'Cañerías y cajas');
await registrarMovimiento(ejemplo, 'EGRESO', item('MAMPOSTERIA'), '2026-10-20', 1550000, 'Muros de planta alta y tabiques');

// Casa Villa Belgrano: en estimación, con un rubro en cada estado.
const casa = await crearObra('Casa Villa Belgrano', 'Villa Belgrano, Córdoba', '2026-11-20', 'Casa de una planta con quincho', 'Martín Sosa', MARTIN);
await agregarParticipantes(casa, [
  ['Diego Fernández', DIEGO, 'CUADRILLA', 'FUNDACIONES'],
  ['Marcos Ruiz', MARCOS, 'CUADRILLA', 'MAMPOSTERIA'],
  ['Walter Gómez', WALTER, 'ESPECIALISTA', 'INSTALACION_ELECTRICA'],
  ['Walter Gómez', WALTER, 'ESPECIALISTA', 'INSTALACION_SANITARIA'],
]);
await activarCuenta(MARTIN);
const tareasCasa = await cargarTareas(casa, [
  ['Excavación de zanjas', 'FUNDACIONES'],
  ['Muro de ladrillo hueco 18 cm', 'MAMPOSTERIA'],
  ['Tabiques interiores 12 cm', 'MAMPOSTERIA'],
  ['Dinteles de hormigón', 'MAMPOSTERIA'],
  ['Cañerías y cajas', 'INSTALACION_ELECTRICA'],
  ['Cañerías de agua', 'INSTALACION_SANITARIA'],
]);
await arquitecto('POST', `${casa}/presupuesto/solicitar-costos`);
await arquitecto('PUT', `${casa}/tareas/costos`, { costos: costosDe(tareasCasa, { 'Excavación de zanjas': 1850000 }) });
await (await entrar(MARCOS))('PUT', `${casa}/tareas/costos`, {
  costos: costosDe(tareasCasa, { 'Muro de ladrillo hueco 18 cm': 1450000, 'Tabiques interiores 12 cm': 700000 }),
});
await (await entrar(WALTER))('PUT', `${casa}/tareas/costos`, { costos: costosDe(tareasCasa, { 'Cañerías de agua': 980000 }) });

// Local Av. Colón: presentado, esperando la respuesta de la clienta.
const local = await crearObra('Local Av. Colón', 'Av. Colón, Córdoba', '2026-11-20', 'Refacción de local comercial', 'Carla Ríos', CARLA);
await agregarParticipantes(local, [
  ['Diego Fernández', DIEGO, 'CUADRILLA', 'FUNDACIONES'],
  ['Marcos Ruiz', MARCOS, 'CUADRILLA', 'MAMPOSTERIA'],
]);
await activarCuenta(CARLA);
const tareasLocal = await cargarTareas(local, [
  ['Excavación de zanjas', 'FUNDACIONES'],
  ['Muro de ladrillo hueco 18 cm', 'MAMPOSTERIA'],
]);
await arquitecto('POST', `${local}/presupuesto/solicitar-costos`);
await arquitecto('PUT', `${local}/tareas/costos`, {
  costos: costosDe(tareasLocal, { 'Excavación de zanjas': 1850000, 'Muro de ladrillo hueco 18 cm': 2400000 }),
});
await arquitecto('PUT', `${local}/presupuesto/honorarios`, { monto: 750000 });
await arquitecto('POST', `${local}/presupuesto/consolidar`);
await arquitecto('POST', `${local}/presupuesto/presentar`);

// Galpón Ruta 9: rechazado por el cliente, con motivo.
const galpon = await crearObra('Galpón Ruta 9', 'Ruta 9, Oliva', '2026-12-01', 'Galpón de depósito', 'Pablo Núñez', PABLO);
await agregarParticipantes(galpon, [['Diego Fernández', DIEGO, 'CUADRILLA', 'FUNDACIONES']]);
await activarCuenta(PABLO);
const tareasGalpon = await cargarTareas(galpon, [['Platea de hormigón', 'FUNDACIONES']]);
await arquitecto('POST', `${galpon}/presupuesto/solicitar-costos`);
await arquitecto('PUT', `${galpon}/tareas/costos`, { costos: costosDe(tareasGalpon, { 'Platea de hormigón': 3000000 }) });
await arquitecto('PUT', `${galpon}/presupuesto/honorarios`, { monto: 500000 });
await arquitecto('POST', `${galpon}/presupuesto/consolidar`);
await arquitecto('POST', `${galpon}/presupuesto/presentar`);
await (await entrar(PABLO))('POST', `${galpon}/presupuesto/rechazar`, { motivo: 'Los honorarios superan lo que habíamos hablado.' });

// Dúplex Barrio Jardín: en relevamiento, todavía sin solicitar los costos.
const duplex = await crearObra('Dúplex Barrio Jardín', 'Barrio Jardín, Córdoba', '2027-01-10', 'Dúplex de dos unidades', 'Laura Pérez', LAURA);
await agregarParticipantes(duplex, [
  ['Diego Fernández', DIEGO, 'CUADRILLA', 'FUNDACIONES'],
  ['Marcos Ruiz', MARCOS, 'CUADRILLA', 'MAMPOSTERIA'],
]);
await cargarTareas(duplex, [
  ['Excavación de zanjas', 'FUNDACIONES'],
  ['Hormigón de cimiento corrido', 'FUNDACIONES'],
  ['Muro de ladrillo hueco 18 cm', 'MAMPOSTERIA'],
  ['Tabiques interiores 12 cm', 'MAMPOSTERIA'],
]);

console.log('Datos de ejemplo cargados: 5 obras en distintos estados.');
console.log(`Contraseña de las cuentas de ejemplo: ${CLAVE}`);
