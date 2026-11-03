-- Módulo de usuarios y obras: usuarios, obras y asignación de colaboradores a cada obra.

CREATE TABLE usuario (
    id_usuario             BIGSERIAL    PRIMARY KEY,
    nombre_completo        VARCHAR(120) NOT NULL,
    dni                    VARCHAR(20),
    rol                    VARCHAR(20)  NOT NULL,
    -- Hash de la contraseña. Queda vacío hasta que el usuario acepta la invitación.
    clave                  VARCHAR(100),
    email                  VARCHAR(254) NOT NULL UNIQUE,
    telefono               VARCHAR(30),
    activo                 BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Control de intentos de inicio de sesión (HU-03)
    intentos_fallidos      INTEGER      NOT NULL DEFAULT 0,
    ultimo_intento_fallido TIMESTAMP,
    bloqueado              BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Enlace vigente para definir la contraseña (invitación o recuperación).
    -- Se guarda el hash SHA-256 del token, nunca el token en sí.
    token_hash             VARCHAR(64)  UNIQUE,
    token_vence            TIMESTAMP,
    CONSTRAINT ck_usuario_rol CHECK (rol IN ('ARQUITECTO', 'CUADRILLA', 'ESPECIALISTA', 'CLIENTE'))
);

CREATE TABLE obra (
    id_obra       BIGSERIAL     PRIMARY KEY,
    titulo        VARCHAR(150)  NOT NULL,
    descripcion   VARCHAR(1000) NOT NULL,
    ubicacion     VARCHAR(200)  NOT NULL,
    fecha_inicio  DATE          NOT NULL,
    fecha_fin     DATE,
    estado        VARCHAR(20)   NOT NULL,
    id_arquitecto BIGINT        NOT NULL REFERENCES usuario (id_usuario),
    id_cliente    BIGINT        NOT NULL REFERENCES usuario (id_usuario),
    CONSTRAINT ck_obra_estado CHECK (estado IN ('EN_CURSO', 'FINALIZADA'))
);

CREATE INDEX ix_obra_arquitecto ON obra (id_arquitecto);
CREATE INDEX ix_obra_cliente ON obra (id_cliente);

CREATE TABLE asignacion_colaborador (
    id_obra        BIGINT      NOT NULL REFERENCES obra (id_obra),
    id_colaborador BIGINT      NOT NULL REFERENCES usuario (id_usuario),
    -- Rubro del que se encarga el colaborador en esta obra
    rubro          VARCHAR(40) NOT NULL,
    PRIMARY KEY (id_obra, id_colaborador)
);

CREATE INDEX ix_asignacion_colaborador ON asignacion_colaborador (id_colaborador);
