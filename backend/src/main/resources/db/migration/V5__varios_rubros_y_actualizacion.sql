-- Una persona puede tener varios rubros en la misma obra; cada rubro sigue teniendo un solo responsable.
ALTER TABLE asignacion_colaborador DROP CONSTRAINT uq_asignacion_obra_rubro;
ALTER TABLE asignacion_colaborador DROP CONSTRAINT asignacion_colaborador_pkey;
ALTER TABLE asignacion_colaborador ADD PRIMARY KEY (id_obra, rubro);

-- Última vez que cambió el monto o el estado del ítem; vacío mientras no se cargó nada.
ALTER TABLE item_de_presupuesto ADD COLUMN fecha_actualizacion DATE;

UPDATE item_de_presupuesto i
SET fecha_actualizacion = p.fecha_creacion
FROM presupuesto p
WHERE p.id_presupuesto = i.id_presupuesto
  AND i.estado <> 'SIN_CARGAR';
