-- Módulo de pagos: cobros al cliente (INGRESO) y pagos a colaboradores (EGRESO) con su comprobante.

CREATE TABLE pago (
    id_pago          BIGSERIAL     PRIMARY KEY,
    fecha            DATE          NOT NULL,
    monto            NUMERIC(14,2) NOT NULL,
    descripcion      VARCHAR(300)  NOT NULL,
    tipo             VARCHAR(10)   NOT NULL,
    estado           VARCHAR(10)   NOT NULL,
    motivo_anulacion VARCHAR(500),
    fecha_anulacion  DATE,
    -- El cobro pertenece a la obra; el pago, al ítem del rubro.
    id_obra          BIGINT        REFERENCES obra (id_obra),
    id_item          BIGINT        REFERENCES item_de_presupuesto (id_item),
    CONSTRAINT ck_pago_monto CHECK (monto > 0),
    CONSTRAINT ck_pago_tipo CHECK (tipo IN ('INGRESO', 'EGRESO')),
    CONSTRAINT ck_pago_estado CHECK (estado IN ('VIGENTE', 'ANULADO')),
    CONSTRAINT ck_pago_destino CHECK (
        (tipo = 'INGRESO' AND id_obra IS NOT NULL AND id_item IS NULL)
        OR (tipo = 'EGRESO' AND id_item IS NOT NULL AND id_obra IS NULL)
    ),
    CONSTRAINT ck_pago_anulacion CHECK (
        (estado = 'VIGENTE' AND motivo_anulacion IS NULL AND fecha_anulacion IS NULL)
        OR (estado = 'ANULADO' AND motivo_anulacion IS NOT NULL AND fecha_anulacion IS NOT NULL)
    )
);

CREATE INDEX ix_pago_obra ON pago (id_obra);
CREATE INDEX ix_pago_item ON pago (id_item);

CREATE TABLE comprobante (
    id_comprobante  BIGSERIAL    PRIMARY KEY,
    -- Clave del archivo en el almacenamiento: un nombre aleatorio, no el que subió el usuario.
    url             VARCHAR(300) NOT NULL,
    fecha           DATE         NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    tipo_contenido  VARCHAR(50)  NOT NULL,
    id_pago         BIGINT       NOT NULL REFERENCES pago (id_pago)
);

CREATE INDEX ix_comprobante_pago ON comprobante (id_pago);
