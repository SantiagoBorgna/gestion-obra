import { ESTADOS_ITEM, RUBROS, formatearMonto } from '../../constantes.js';
import FormularioEstimacion from './FormularioEstimacion.jsx';

const COLOR_ITEM = { SIN_CARGAR: 'grupo-gris', PENDIENTE_CONFIRMACION: 'grupo-ambar', CONFIRMADO: 'grupo-verde' };

// Estimación de costos (HU-05): el colaborador solo ve las tareas de sus rubros.
export default function VistaColaborador({ idObra, presupuesto, tareas, alCambiar }) {
  const editable = presupuesto.estado === 'EN_ESTIMACION';

  return (
    <>
      <h1 className="titulo-pantalla">Estimación de costos</h1>
      {presupuesto.items.length === 0 && <p className="texto-secundario">Esta obra no tiene tareas de tus rubros.</p>}
      {presupuesto.items.map((item) => {
        const delRubro = tareas.filter((t) => t.rubro === item.rubro);
        return (
          <section key={item.id} className="seccion">
            <h2 className="titulo-seccion">
              {RUBROS[item.rubro]} · {delRubro.length === 1 ? '1 tarea' : `${delRubro.length} tareas`}
            </h2>
            {item.estado !== 'SIN_CARGAR' && (
              <span className={`grupo-titulo estado-chico ${COLOR_ITEM[item.estado]}`}><span className="marcador" />{ESTADOS_ITEM[item.estado]}</span>
            )}
            {editable ? (
              <>
                {item.estado === 'CONFIRMADO' && (
                  <span className="texto-suave">Si cambiás un costo, el arquitecto tiene que volver a confirmar el rubro.</span>
                )}
                <FormularioEstimacion idObra={idObra} tareas={delRubro} textoBoton="Enviar al arquitecto" alGuardar={alCambiar} />
              </>
            ) : (
              <>
                <div className="tarjeta tarjeta-tareas">
                  {delRubro.map((t) => (
                    <div key={t.id} className="fila-tarea"><span>{t.descripcion}</span><strong>{formatearMonto(t.montoEstimado)}</strong></div>
                  ))}
                </div>
                <div className="total-seccion"><span>Total del rubro</span><strong>{formatearMonto(item.monto)}</strong></div>
                <span className="texto-suave">La estimación está cerrada: los costos ya no se pueden modificar.</span>
              </>
            )}
          </section>
        );
      })}
    </>
  );
}
