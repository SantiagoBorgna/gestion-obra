import { COLOR_ESTADO, ESTADOS_ITEM, RUBROS, formatearMonto } from '../../constantes.js';
import FormularioEstimacion from './FormularioEstimacion.jsx';

// Estimación de costos (HU-05): el colaborador solo ve las tareas de sus rubros.
export default function VistaColaborador({ idObra, presupuesto, tareas, alCambiar }) {
  const editable = presupuesto.estado === 'EN_ESTIMACION';

  if (presupuesto.items.length === 0) {
    return <p className="texto-secundario">Esta obra no tiene tareas de tus rubros.</p>;
  }

  return (
    <>
      <h1 className="titulo-pantalla">Estimación de costos</h1>
      {presupuesto.items.map((item) => {
        const delRubro = tareas.filter((t) => t.rubro === item.rubro);
        return (
          <section key={item.id} className="acciones">
            <h2 className="titulo-seccion">{RUBROS[item.rubro]} · {delRubro.length} {delRubro.length === 1 ? 'tarea' : 'tareas'}</h2>
            <div className="tarjeta">
              <div className="tarjeta-fila">
                <strong>{formatearMonto(item.monto)}</strong>
                <span className={`etiqueta ${COLOR_ESTADO[item.estado]}`}>{ESTADOS_ITEM[item.estado]}</span>
              </div>
              {editable && item.estado === 'CONFIRMADO' && (
                <span className="texto-suave">Si cambiás un costo, el arquitecto tiene que volver a confirmar el rubro.</span>
              )}
              {!editable && <span className="texto-suave">La estimación está cerrada: los costos ya no se pueden modificar.</span>}
            </div>
            {editable ? (
              <FormularioEstimacion key={item.fechaActualizacion} idObra={idObra} tareas={delRubro}
                                    textoBoton="Enviar al arquitecto" alGuardar={alCambiar} />
            ) : (
              <div className="tarjeta">
                {delRubro.map((t) => (
                  <div key={t.id} className="fila-monto"><span>{t.descripcion}</span><strong>{formatearMonto(t.montoEstimado)}</strong></div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
