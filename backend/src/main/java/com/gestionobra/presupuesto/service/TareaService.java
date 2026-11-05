package com.gestionobra.presupuesto.service;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

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

    public record CostoTarea(Long idTarea, BigDecimal monto) {
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
     * El arquitecto ve todas las tareas. El colaborador ve las de sus rubros, y recién
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
        List<Rubro> propios = obra.rubrosDe(sesion.id());
        return tareas.findByObraIdOrderById(idObra).stream()
            .filter(tarea -> propios.contains(tarea.getRubro()))
            .map(TareaVista::de)
            .toList();
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

    /**
     * Guarda de una vez los costos enviados y recalcula los rubros en los que algo cambió.
     * Puede cargarlos el responsable del rubro o el arquitecto. Reenviar los mismos valores
     * no cambia nada, así un rubro confirmado no vuelve a quedar pendiente sin motivo.
     */
    @Transactional
    public List<TareaVista> guardarEstimacion(Long idObra, List<CostoTarea> costos, UsuarioSesion sesion) {
        Obra obra = obras.obraAccesible(idObra, sesion);
        boolean esArquitecto = obra.esArquitecto(sesion.id());
        List<Rubro> propios = obra.rubrosDe(sesion.id());
        if (!esArquitecto && propios.isEmpty()) {
            throw ErrorNegocio.prohibido("Solo el responsable del rubro puede cargar costos.");
        }
        Presupuesto presupuesto = presupuestos.findByObraId(idObra)
            .orElseThrow(() -> ErrorNegocio.conflicto("Todavía no se solicitaron los costos."));
        if (!presupuesto.enEstimacion()) {
            throw ErrorNegocio.conflicto("Los costos ya no se pueden modificar: la estimación está cerrada.");
        }

        List<Tarea> tareasDeObra = tareas.findByObraIdOrderById(idObra);
        Map<Long, Tarea> porId = tareasDeObra.stream().collect(Collectors.toMap(Tarea::getId, Function.identity()));
        Set<Rubro> modificados = EnumSet.noneOf(Rubro.class);
        for (CostoTarea costo : costos) {
            Tarea tarea = porId.get(costo.idTarea());
            if (tarea == null) {
                throw ErrorNegocio.noEncontrado("No se encontró la tarea.");
            }
            if (!esArquitecto && !propios.contains(tarea.getRubro())) {
                throw ErrorNegocio.prohibido("Solo el responsable del rubro puede cargar este costo.");
            }
            if (!tarea.tieneMonto() || tarea.getMontoEstimado().compareTo(costo.monto()) != 0) {
                tarea.cargarMonto(costo.monto());
                modificados.add(tarea.getRubro());
            }
        }

        for (Rubro rubro : modificados) {
            ItemDePresupuesto item = presupuesto.itemDeRubro(rubro)
                .orElseThrow(() -> new IllegalStateException("Falta el ítem del rubro " + rubro));
            List<Tarea> delRubro = tareasDeObra.stream().filter(tarea -> tarea.getRubro() == rubro).toList();
            BigDecimal suma = delRubro.stream()
                .filter(Tarea::tieneMonto)
                .map(Tarea::getMontoEstimado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            item.actualizarMonto(suma, delRubro.stream().allMatch(Tarea::tieneMonto), esArquitecto);
        }
        return tareasDeObra.stream()
            .filter(tarea -> esArquitecto || propios.contains(tarea.getRubro()))
            .map(TareaVista::de)
            .toList();
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
