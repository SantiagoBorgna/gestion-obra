package com.gestionobra.presupuesto.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestionobra.comun.CorreoService;
import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.Obra;
import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.obra.service.ObraService;
import com.gestionobra.presupuesto.entity.EstadoItem;
import com.gestionobra.presupuesto.entity.EstadoPresupuesto;
import com.gestionobra.presupuesto.entity.ItemDePresupuesto;
import com.gestionobra.presupuesto.entity.Presupuesto;
import com.gestionobra.presupuesto.entity.Tarea;
import com.gestionobra.presupuesto.entity.TipoItem;
import com.gestionobra.presupuesto.repository.PresupuestoRepository;
import com.gestionobra.presupuesto.repository.TareaRepository;
import com.gestionobra.usuario.entity.Usuario;
import com.gestionobra.usuario.service.UsuarioSesion;

/** Honorarios (HU-13), consolidación (HU-06), presentación y aprobación (HU-07). */
@Service
public class PresupuestoService {

    /** Los campos que un perfil no debe ver van vacíos: el estado y el responsable para el cliente. */
    public record ItemVista(Long id, TipoItem tipo, Rubro rubro, BigDecimal monto, EstadoItem estado,
                            String responsable) {
    }

    /** El total va vacío para el colaborador, que solo ve lo de su rubro. */
    public record PresupuestoVista(Long id, EstadoPresupuesto estado, LocalDate fechaCreacion,
                                   LocalDate fechaPresentacion, LocalDate fechaAprobacion, String motivoRechazo,
                                   List<ItemVista> items, BigDecimal total) {
    }

    private final PresupuestoRepository presupuestos;
    private final TareaRepository tareas;
    private final ObraService obras;
    private final CorreoService correo;
    private final String urlApp;

    public PresupuestoService(PresupuestoRepository presupuestos, TareaRepository tareas, ObraService obras,
                              CorreoService correo, @Value("${app.url}") String urlApp) {
        this.presupuestos = presupuestos;
        this.tareas = tareas;
        this.obras = obras;
        this.correo = correo;
        this.urlApp = urlApp;
    }

    /** Vacío si el usuario todavía no puede ver el presupuesto o si aún no existe. */
    @Transactional(readOnly = true)
    public Optional<PresupuestoVista> consultar(Long idObra, UsuarioSesion sesion) {
        Obra obra = obras.obraAccesible(idObra, sesion);
        return presupuestos.findByObraId(idObra).flatMap(presupuesto -> vistaPara(obra, presupuesto, sesion));
    }

    /** Cierra el relevamiento: crea el presupuesto con un ítem por cada rubro que tiene tareas. */
    @Transactional
    public PresupuestoVista solicitarCostos(Long idObra, UsuarioSesion sesion) {
        Obra obra = obras.obraDelArquitecto(idObra, sesion);
        if (presupuestos.existsByObraId(idObra)) {
            throw ErrorNegocio.conflicto("Los costos ya fueron solicitados.");
        }
        Set<Rubro> rubros = tareas.findByObraIdOrderById(idObra).stream()
            .map(Tarea::getRubro)
            .collect(Collectors.toCollection(() -> EnumSet.noneOf(Rubro.class)));
        if (rubros.isEmpty()) {
            throw ErrorNegocio.conflicto("Cargá al menos una tarea antes de solicitar los costos.");
        }
        String sinResponsable = rubros.stream()
            .filter(rubro -> obra.responsableDe(rubro).isEmpty())
            .map(Rubro::getNombre)
            .collect(Collectors.joining(", "));
        if (!sinResponsable.isEmpty()) {
            throw ErrorNegocio.conflicto("Falta asignar un responsable para: " + sinResponsable + ".");
        }

        Presupuesto presupuesto = new Presupuesto(obra, LocalDate.now());
        for (Rubro rubro : rubros) {
            Usuario responsable = obra.responsableDe(rubro).orElseThrow();
            presupuesto.agregarRubro(rubro, responsable);
            correo.enviarAviso(responsable.getEmail(), "Cargá los costos de la obra " + obra.getTitulo(), """
                Hola %s:

                Se solicitaron los costos de %s para la obra "%s".
                Podés cargarlos desde acá:

                %s
                """.formatted(responsable.getNombreCompleto(), rubro.getNombre(), obra.getTitulo(), enlace(idObra)));
        }
        return vistaArquitecto(presupuestos.save(presupuesto));
    }

    @Transactional
    public PresupuestoVista confirmarRubro(Long idObra, Long idItem, UsuarioSesion sesion) {
        obras.obraDelArquitecto(idObra, sesion);
        Presupuesto presupuesto = presupuestoDe(idObra);
        if (!presupuesto.enEstimacion()) {
            throw ErrorNegocio.conflicto("El presupuesto no está en estimación.");
        }
        presupuesto.getItems().stream()
            .filter(item -> item.getId().equals(idItem) && item.esRubro())
            .findFirst()
            .orElseThrow(() -> ErrorNegocio.noEncontrado("No se encontró el rubro."))
            .confirmar();
        return vistaArquitecto(presupuesto);
    }

    @Transactional
    public PresupuestoVista cargarHonorarios(Long idObra, BigDecimal monto, UsuarioSesion sesion) {
        obras.obraDelArquitecto(idObra, sesion);
        Presupuesto presupuesto = presupuestoDe(idObra);
        presupuesto.cargarHonorarios(monto);
        return vistaArquitecto(presupuesto);
    }

    @Transactional
    public PresupuestoVista consolidar(Long idObra, UsuarioSesion sesion) {
        obras.obraDelArquitecto(idObra, sesion);
        Presupuesto presupuesto = presupuestoDe(idObra);
        presupuesto.consolidar();
        return vistaArquitecto(presupuesto);
    }

    @Transactional
    public PresupuestoVista volverAEstimacion(Long idObra, UsuarioSesion sesion) {
        obras.obraDelArquitecto(idObra, sesion);
        Presupuesto presupuesto = presupuestoDe(idObra);
        presupuesto.volverAEstimacion();
        return vistaArquitecto(presupuesto);
    }

    @Transactional
    public PresupuestoVista presentar(Long idObra, UsuarioSesion sesion) {
        Obra obra = obras.obraDelArquitecto(idObra, sesion);
        Presupuesto presupuesto = presupuestoDe(idObra);
        presupuesto.presentar(LocalDate.now());
        Usuario cliente = obra.getCliente();
        correo.enviarAviso(cliente.getEmail(), "Presupuesto de la obra " + obra.getTitulo(), """
            Hola %s:

            Ya está disponible el presupuesto de la obra "%s". Podés revisarlo y aprobarlo o rechazarlo desde acá:

            %s
            """.formatted(cliente.getNombreCompleto(), obra.getTitulo(), enlace(idObra)));
        return vistaArquitecto(presupuesto);
    }

    @Transactional
    public PresupuestoVista aprobar(Long idObra, UsuarioSesion sesion) {
        Obra obra = obraDelCliente(idObra, sesion);
        Presupuesto presupuesto = presupuestoDe(idObra);
        presupuesto.aprobar(LocalDate.now());
        avisarArquitecto(obra, "aprobó", "");
        return vistaCliente(presupuesto);
    }

    @Transactional
    public PresupuestoVista rechazar(Long idObra, String motivo, UsuarioSesion sesion) {
        Obra obra = obraDelCliente(idObra, sesion);
        Presupuesto presupuesto = presupuestoDe(idObra);
        presupuesto.rechazar(motivo.trim());
        avisarArquitecto(obra, "rechazó", "\nMotivo: " + motivo.trim() + "\n");
        return vistaCliente(presupuesto);
    }

    private Obra obraDelCliente(Long idObra, UsuarioSesion sesion) {
        Obra obra = obras.obraAccesible(idObra, sesion);
        if (!obra.esCliente(sesion.id())) {
            throw ErrorNegocio.prohibido("Solo el cliente de la obra puede hacer esto.");
        }
        return obra;
    }

    private Presupuesto presupuestoDe(Long idObra) {
        return presupuestos.findByObraId(idObra)
            .orElseThrow(() -> ErrorNegocio.conflicto("Todavía no se solicitaron los costos."));
    }

    private Optional<PresupuestoVista> vistaPara(Obra obra, Presupuesto presupuesto, UsuarioSesion sesion) {
        if (obra.esArquitecto(sesion.id())) {
            return Optional.of(vistaArquitecto(presupuesto));
        }
        if (obra.esCliente(sesion.id())) {
            return presupuesto.visibleParaCliente() ? Optional.of(vistaCliente(presupuesto)) : Optional.empty();
        }
        return Optional.of(vistaColaborador(presupuesto, obra.rubroDe(sesion.id()).orElse(null)));
    }

    private PresupuestoVista vistaArquitecto(Presupuesto presupuesto) {
        List<ItemVista> items = itemsOrdenados(presupuesto).stream()
            .map(item -> new ItemVista(item.getId(), item.getTipo(), item.getNombreRubro(), item.getMonto(),
                item.getEstado(), nombreResponsable(item)))
            .toList();
        return vista(presupuesto, presupuesto.getMotivoRechazo(), items, presupuesto.calcularMontoTotal());
    }

    private PresupuestoVista vistaCliente(Presupuesto presupuesto) {
        List<ItemVista> items = itemsOrdenados(presupuesto).stream()
            .map(item -> new ItemVista(item.getId(), item.getTipo(), item.getNombreRubro(), item.getMonto(),
                null, null))
            .toList();
        return vista(presupuesto, presupuesto.getMotivoRechazo(), items, presupuesto.calcularMontoTotal());
    }

    private PresupuestoVista vistaColaborador(Presupuesto presupuesto, Rubro rubro) {
        List<ItemVista> items = itemsOrdenados(presupuesto).stream()
            .filter(item -> item.getNombreRubro() != null && item.getNombreRubro() == rubro)
            .map(item -> new ItemVista(item.getId(), item.getTipo(), item.getNombreRubro(), item.getMonto(),
                item.getEstado(), nombreResponsable(item)))
            .toList();
        return vista(presupuesto, null, items, null);
    }

    private PresupuestoVista vista(Presupuesto presupuesto, String motivo, List<ItemVista> items, BigDecimal total) {
        return new PresupuestoVista(presupuesto.getId(), presupuesto.getEstado(), presupuesto.getFechaCreacion(),
            presupuesto.getFechaPresentacion(), presupuesto.getFechaAprobacion(), motivo, items, total);
    }

    /** Los rubros en orden de obra y los honorarios al final. */
    private List<ItemDePresupuesto> itemsOrdenados(Presupuesto presupuesto) {
        return presupuesto.getItems().stream()
            .sorted(Comparator.comparing(ItemDePresupuesto::getNombreRubro,
                Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
    }

    private String nombreResponsable(ItemDePresupuesto item) {
        return item.getColaboradorResponsable() == null ? null : item.getColaboradorResponsable().getNombreCompleto();
    }

    private void avisarArquitecto(Obra obra, String decision, String detalle) {
        Usuario arquitecto = obra.getArquitecto();
        correo.enviarAviso(arquitecto.getEmail(), "El cliente " + decision + " el presupuesto de " + obra.getTitulo(), """
            Hola %s:

            %s %s el presupuesto de la obra "%s".
            %s
            %s
            """.formatted(arquitecto.getNombreCompleto(), obra.getCliente().getNombreCompleto(), decision,
                obra.getTitulo(), detalle, enlace(obra.getId())));
    }

    private String enlace(Long idObra) {
        return urlApp + "/obras/" + idObra + "/presupuesto";
    }
}
