-- Módulo de alertas: umbral de desvío por obra y alertas por rubro o generales de la obra.

ALTER TABLE presupuesto
    ADD COLUMN umbral_desvio NUMERIC(5,2) NOT NULL DEFAULT 10,
    ADD CONSTRAINT ck_presupuesto_umbral CHECK (umbral_desvio > 0);

CREATE TABLE alerta (
    id_alerta             BIGSERIAL     PRIMARY KEY,
    mensaje               VARCHAR(300)  NOT NULL,
    fecha                 DATE          NOT NULL,
    resuelta              BOOLEAN       NOT NULL DEFAULT FALSE,
    -- Gasto real al resolverla: solo se genera otra alerta si el gasto supera este punto.
    gasto_real_resolucion NUMERIC(14,2),
    fecha_resolucion      DATE,
    -- Una alerta es de un rubro o general de la obra, nunca las dos cosas.
    id_item               BIGINT        REFERENCES item_de_presupuesto (id_item),
    id_obra               BIGINT        REFERENCES obra (id_obra),
    CONSTRAINT ck_alerta_destino CHECK ((id_item IS NULL) <> (id_obra IS NULL)),
    CONSTRAINT ck_alerta_resolucion CHECK (
        (resuelta AND gasto_real_resolucion IS NOT NULL AND fecha_resolucion IS NOT NULL)
        OR (NOT resuelta AND gasto_real_resolucion IS NULL AND fecha_resolucion IS NULL)
    )
);

-- No puede haber dos alertas activas para el mismo rubro ni dos generales en la misma obra.
CREATE UNIQUE INDEX uq_alerta_activa_item ON alerta (id_item) WHERE NOT resuelta AND id_item IS NOT NULL;
CREATE UNIQUE INDEX uq_alerta_activa_obra ON alerta (id_obra) WHERE NOT resuelta AND id_obra IS NOT NULL;

CREATE INDEX ix_alerta_item ON alerta (id_item);
CREATE INDEX ix_alerta_obra ON alerta (id_obra);
