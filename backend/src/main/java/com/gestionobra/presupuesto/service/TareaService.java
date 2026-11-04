package com.gestionobra.presupuesto.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.Obra;
import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.obra.service.ObraService;
import com.gestionobra.presupuesto.entity.ItemDePresupuesto;
import com.gestionobra.presupuesto.entity.Presupuesto;
import com.gestionobra.presupuesto.entity.Tarea;
import com.gestionobra.presupuesto.repository.PresupuestoRepository;
import com.gestionobra.presupuesto.repository.TareaRepository;
import com.gestionobra.usuario.service.UsuarioSesion;

/** Relevamiento de tareas (HU-04) y carga de costos por rubro (HU-05). */
@Service
public class TareaService {

    public record TareaVista(Long id, String descripcion, Rubro rubro, BigDecimal montoEstimado) {

        static TareaVista de(Tarea tarea) {
            return new TareaVista(tarea.getId(), tarea.getDescripcion(), tarea.getRubro(), tarea.getMontoEstimado());
        }
    }

    private final TareaRepository tareas;
    private final PresupuestoRepository presupuestos;
    private final ObraService obras;

    public TareaService(TareaRepository tareas, PresupuestoRepository presupuestos, ObraService obras) {
        this.tareas = tareas;
        this.presupuestos = presupuestos;
        this.obras = obras;
    }

    /**
     * El arquitecto ve todas las tareas. El colaborador ve las de su rubro, y recién
     * cuando se solicitaron los costos. El cliente no ve las tareas.
     */
    @Transactional(readOnly = true)
    public List<TareaVista> listar(Long idObra, UsuarioSesion sesion) {
        Obra obra = obras.obraAccesible(idObra, sesion);
        if (obra.esArquitecto(sesion.id())) {
            return tareas.findByObraIdOrderById(idObra).stream().map(TareaVista::de).toList();
        }
        if (obra.esCliente(sesion.id())) {
            throw ErrorNegocio.prohibido("El cliente no tiene acceso al detalle de las tareas.");
        }
        if (!presupuestos.existsByObraId(idObra)) {
            return List.of();
        }
        return obra.rubroDe(sesion.id())
            .map(rubro -> tareas.findByObraIdAndRubroOrderById(idObra, rubro).stream().map(TareaVista::de).toList())
            .orElse(List.of());
    }

    @Transactional
    public TareaVista crear(Long idObra, String descripcion, Rubro rubro, UsuarioSesion sesion) {
        Obra obra = obras.obraDelArquitecto(idObra, sesion);
        exigirRelevamientoAbierto(idObra);
        return TareaVista.de(tareas.save(new Tarea(obra, descripcion.trim(), rubro)));
    }

    @Transactional
    public TareaVista modificar(Long idObra, Long idTarea, String descripcion, Rubro rubro, UsuarioSesion sesion) {
        obras.obraDelArquitecto(idObra, sesion);
        exigirRelevamientoAbierto(idObra);
        Tarea tarea = tareaDeLaObra(idObra, idTarea);
        tarea.modificar(descripcion.trim(), rubro);
        return TareaVista.de(tarea);
    }

    @Transactional
    public void eliminar(Long idObra, Long idTarea, UsuarioSesion sesion) {
        obras.obraDelArquitecto(idObra, sesion);
        exigirRelevamientoAbierto(idObra);
        tareas.delete(tareaDeLaObra(idObra, idTarea));
    }

    /** Carga el costo de una tarea y recalcula el monto y el estado del rubro. */
    @Transactional
    public TareaVista cargarCosto(Long idObra, Long idTarea, BigDecimal monto, UsuarioSesion sesion) {
        Obra obra = obras.obraAccesible(idObra, sesion);
        Tarea tarea = tareaDeLaObra(idObra, idTarea);
        if (obra.rubroDe(sesion.id()).filter(rubro -> rubro == tarea.getRubro()).isEmpty()) {
            throw ErrorNegocio.prohibido("Solo el responsable del rubro puede cargar este costo.");
        }
        Presupuesto presupuesto = presupuestos.findByObraId(idObra)
            .orElseThrow(() -> ErrorNegocio.conflicto("Todavía no se solicitaron los costos."));
        if (!presupuesto.enEstimacion()) {
            throw ErrorNegocio.conflicto("Los costos ya no se pueden modificar: la estimación está cerrada.");
        }

        tarea.cargarMonto(monto);
        ItemDePresupuesto item = presupuesto.itemDeRubro(tarea.getRubro())
            .orElseThrow(() -> new IllegalStateException("Falta el ítem del rubro " + tarea.getRubro()));
        List<Tarea> delRubro = tareas.findByObraIdAndRubroOrderById(idObra, tarea.getRubro());
        BigDecimal suma = delRubro.stream()
            .filter(Tarea::tieneMonto)
            .map(Tarea::getMontoEstimado)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        item.actualizarMonto(suma, delRubro.stream().allMatch(Tarea::tieneMonto));
        return TareaVista.de(tarea);
    }

    private void exigirRelevamientoAbierto(Long idObra) {
        if (presupuestos.existsByObraId(idObra)) {
            throw ErrorNegocio.conflicto("Las tareas ya no se pueden modificar: los costos ya fueron solicitados.");
        }
    }

    private Tarea tareaDeLaObra(Long idObra, Long idTarea) {
        return tareas.findByIdAndObraId(idTarea, idObra)
            .orElseThrow(() -> ErrorNegocio.noEncontrado("No se encontró la tarea."));
    }
}
