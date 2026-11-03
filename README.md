# Gestión de Obra

Sistema web para la gestión del presupuesto, los cobros, los pagos y el avance de obras de arquitectos independientes que trabajan bajo la modalidad llave en mano.

> README en construcción. Las instrucciones completas de instalación se agregan al finalizar el desarrollo.

## Ejecución rápida

Requisito: Docker Desktop.

```
docker compose up --build
```

Luego abrir http://localhost:3000.

Con la base vacía se crea una cuenta de arquitecto para empezar:

- Correo: `arquitecto@gestionobra.local`
- Contraseña: `obra-demo-local-2026`

Se pueden cambiar con las variables `ARQUITECTO_EMAIL` y `ARQUITECTO_CLAVE` (ver `.env.example`).

Los correos que envía el sistema (invitaciones y recuperación de contraseña) se ven en Mailpit: http://localhost:8025.
