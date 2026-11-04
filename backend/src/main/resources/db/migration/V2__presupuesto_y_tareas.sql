-- Módulo de presupuesto: tareas del relevamiento, presupuesto de la obra y sus ítems.

-- Cada ítem tiene un solo responsable, así que cada rubro tiene un solo colaborador por obra.
ALTER TABLE asignacion_colaborador
    ADD CONSTRAINT uq_asignacion_obra_rubro UNIQUE (id_obra, rubro);

CREATE TABLE tarea (
    id_tarea       BIGSERIAL     PRIMARY KEY,
    descripcion    VARCHAR(500)  NOT NULL,
    rubro          VARCHAR(40)   NOT NULL,
    -- Costo que carga el colaborador; queda vacío hasta entonces.
    monto_estimado NUMERIC(14,2),
    id_obra        BIGINT        NOT NULL REFERENCES obra (id_obra),
    CONSTRAINT ck_tarea_monto CHECK (monto_estimado IS NULL OR monto_estimado > 0)
);

CREATE INDEX ix_tarea_obra ON tarea (id_obra);

-- Se crea al solicitar los costos: mientras no existe, la obra está en relevamiento.
CREATE TABLE presupuesto (
    id_presupuesto     BIGSERIAL    PRIMARY KEY,
    estado             VARCHAR(20)  NOT NULL,
    fecha_creacion     DATE         NOT NULL,
    fecha_presentacion DATE,
    fecha_aprobacion   DATE,
    motivo_rechazo     VARCHAR(500),
    id_obra            BIGINT       NOT NULL UNIQUE REFERENCES obra (id_obra),
    CONSTRAINT ck_presupuesto_estado
        CHECK (estado IN ('EN_ESTIMACION', 'CONSOLIDADO', 'PRESENTADO', 'APROBADO', 'RECHAZADO'))
);

CREATE TABLE item_de_presupuesto (
    id_item        BIGSERIAL     PRIMARY KEY,
    -- Vacío en el ítem de honorarios, que no pertenece a ningún rubro.
    nombre_rubro   VARCHAR(40),
    monto          NUMERIC(14,2) NOT NULL DEFAULT 0,
    tipo           VARCHAR(20)   NOT NULL,
    estado         VARCHAR(30)   NOT NULL,
    id_presupuesto BIGINT        NOT NULL REFERENCES presupuesto (id_presupuesto),
    id_colaborador BIGINT        REFERENCES usuario (id_usuario),
    CONSTRAINT ck_item_tipo CHECK (tipo IN ('RUBRO', 'HONORARIOS')),
    CONSTRAINT ck_item_estado CHECK (estado IN ('SIN_CARGAR', 'PENDIENTE_CONFIRMACION', 'CONFIRMADO')),
    CONSTRAINT ck_item_rubro CHECK ((tipo = 'RUBRO') = (nombre_rubro IS NOT NULL)),
    CONSTRAINT uq_item_rubro UNIQUE (id_presupuesto, nombre_rubro)
);

-- Un solo ítem de honorarios por presupuesto.
CREATE UNIQUE INDEX uq_item_honorarios ON item_de_presupuesto (id_presupuesto) WHERE tipo = 'HONORARIOS';
