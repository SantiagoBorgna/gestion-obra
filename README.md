# Gestión de Obra

Sistema web para arquitectos independientes que trabajan bajo la modalidad llave en mano. Centraliza el presupuesto por rubro, los cobros al cliente, los pagos a colaboradores, la comparación entre presupuesto y gasto real, y las alertas de desvío.

## Alcance de la demo

| Incluido | Historia de usuario |
|---|---|
| Alta de obra y registro de participantes | HU-01 |
| Autenticación | HU-03 |
| Relevamiento de tareas | HU-04 |
| Estimación de costos | HU-05 |
| Consolidación del presupuesto | HU-06 |
| Presentación y aprobación por el cliente | HU-07 |
| Cobros al cliente | HU-08 |
| Pagos a colaboradores | HU-09 |
| Comparación de presupuesto y gasto | HU-11 |
| Alertas de desvío | HU-12 |
| Honorarios del arquitecto | HU-13 |

Quedan fuera de la demo la asociación de usuarios existentes (HU-02), las etapas y la bitácora (HU-10, HU-14 y HU-15) y la finalización de la obra (HU-16). Etapas, Bitácora y Finalizar obra figuran en gris en el menú de la obra.

## Cómo ejecutarlo

Solo hace falta [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto. No hay que instalar Java, Node ni PostgreSQL, ni crear un archivo `.env`.

En la carpeta del proyecto:

```bash
docker compose up --build
```

La primera vez puede tardar varios minutos, porque descarga las imágenes y compila el sistema. Cuando termine, se usa desde estas direcciones:

| Qué | Dirección |
|---|---|
| Sistema | http://localhost:3000 |
| Correos enviados (Mailpit) | http://localhost:8025 |

Las pantallas están pensadas para celular. En una computadora se ven en una columna centrada.

### Cuenta inicial

Con la base vacía, el sistema crea la cuenta del arquitecto:

- **Correo:** `arquitecto@gestionobra.local`
- **Contraseña:** `obra-demo-local-2026`

Las demás cuentas se crean invitando participantes desde una obra.

### Correos

En modo local ningún correo sale a internet: todos quedan en Mailpit. Ahí están los enlaces de invitación y de recuperación de contraseña, y los avisos del sistema.

## Datos de ejemplo

Para ver el sistema con información cargada sin hacer todo el recorrido, con el sistema en marcha y la base vacía, ejecutar en otra terminal:

```bash
docker compose run --rm datos-ejemplo
```

Tarda menos de un minuto y carga datos ficticios. Si la base ya tiene obras, no carga nada.

| Obra | Estado | Para ver |
|---|---|---|
| Obra Ejemplo | Aprobada | Cobros, pagos, un pago anulado, comparación y dos alertas |
| Casa Villa Belgrano | En estimación | Un rubro en cada estado |
| Local Av. Colón | Presentada | El presupuesto esperando la respuesta del cliente |
| Galpón Ruta 9 | Rechazada | El motivo del rechazo y la vuelta a estimación |
| Dúplex Barrio Jardín | En relevamiento | Tareas cargadas, sin solicitar los costos |

Además de la cuenta del arquitecto, quedan estas cuentas, todas con la contraseña `caracol dorado sobre el puente`:

| Perfil | Correos |
|---|---|
| Cliente | `laura@correo.test`, `martin@correo.test`, `carla@correo.test`, `pablo@correo.test` |
| Cuadrilla | `diego@correo.test`, `marcos@correo.test` |
| Especialista | `walter@correo.test` |

Sofía Martínez (`sofia@correo.test`) queda con la invitación pendiente, para probar el alta desde Mailpit.

## Recorrido sugerido

Este recorrido arranca con la base vacía:

1. **Arquitecto:** iniciar sesión y crear una obra con su cliente.
2. **Arquitecto:** en Participantes, agregar un colaborador con su rubro.
3. **Mailpit:** abrir cada invitación y definir la contraseña, de entre 15 y 64 caracteres.
4. **Arquitecto:** en Relevamiento, cargar tareas y solicitar los costos.
5. **Colaborador:** cargar los costos de su rubro y enviarlos al arquitecto.
6. **Arquitecto:** en Presupuesto, confirmar el rubro, cargar los honorarios, consolidar y presentar al cliente.
7. **Cliente:** aprobar el presupuesto, o rechazarlo indicando el motivo.
8. **Arquitecto:** registrar cobros y pagos con su comprobante (PDF, JPG o PNG, de hasta 10 MB).
9. **Arquitecto:** pagar más de lo presupuestado en un rubro, y ver la diferencia en Presupuesto y gasto y el aviso en Alertas.

## Perfiles

| Perfil | Qué puede hacer |
|---|---|
| Arquitecto | Gestiona la obra completa: participantes, relevamiento, presupuesto, cobros, pagos, comparación y alertas |
| Cuadrilla o Especialista | Carga los costos de sus rubros y ve los pagos que recibió |
| Cliente | Revisa, aprueba o rechaza el presupuesto, y ve sus pagos |

Cada usuario accede solo a las obras en las que participa.

## Comandos útiles

Detener el sistema, conservando los datos:

```bash
docker compose down
```

Volver a empezar con la base vacía. **Borra todas las obras, los usuarios y los comprobantes cargados:**

```bash
docker compose down -v
```

## Problemas frecuentes

- **Un puerto está ocupado:** el sistema usa los puertos 3000, 5432, 8025 y 8080. Hay que cerrar el programa que ocupa alguno de ellos y volver a ejecutar el comando.
- **La pantalla da un error justo después de arrancar:** el backend tarda unos segundos más que el resto. Hay que esperar un momento y recargar.
- **La cuenta quedó bloqueada:** se bloquea al quinto intento fallido. Se recupera con "Olvidé mi contraseña", y el enlace llega a Mailpit.

## Tecnologías

- **Backend:** Java 21 y Spring Boot 3.3 (Spring Security con sesión en el servidor, Spring Data JPA, Spring Mail).
- **Base de datos:** PostgreSQL 16, con el esquema versionado con Flyway.
- **Frontend:** React 18, Vite y React Router, con CSS propio.
- **Infraestructura local:** Docker Compose. Nginx sirve el frontend y reenvía `/api` al backend, y Mailpit recibe los correos.

## Estructura del proyecto

```
backend/    API organizada por módulo de negocio
  src/main/java/com/gestionobra/
    usuario/      autenticación, invitaciones y contraseñas
    obra/         obras y participantes
    presupuesto/  tareas, estimación, consolidación y aprobación
    pago/         cobros, pagos y comprobantes
    alerta/       comparación y alertas de desvío
    comun/        correo, almacenamiento y errores
    config/       seguridad y configuración
  src/main/resources/db/migration/   migraciones de la base de datos
frontend/   aplicación React y configuración de Nginx
scripts/    carga opcional de datos de ejemplo
docker-compose.yml
```

## Configuración

Toda la configuración se hace por variables de entorno, con valores por defecto para ejecutarlo en forma local. Para cambiar alguno, copiar `.env.example` como `.env` y editarlo, ahí está cada variable explicada.

El almacenamiento en la nube (`STORAGE_TIPO=s3`) y el correo por SMTP externo están previstos para la publicación del sistema. El almacenamiento en la nube todavía no está implementado.
