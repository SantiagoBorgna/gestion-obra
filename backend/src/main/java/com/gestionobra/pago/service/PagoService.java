package com.gestionobra.pago.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.gestionobra.comun.AlmacenamientoArchivos;
import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.Obra;
import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.obra.service.ObraService;
import com.gestionobra.pago.entity.Comprobante;
import com.gestionobra.pago.entity.EstadoPago;
import com.gestionobra.pago.entity.Pago;
import com.gestionobra.pago.entity.TipoPago;
import com.gestionobra.pago.repository.PagoRepository;
import com.gestionobra.presupuesto.entity.EstadoPresupuesto;
import com.gestionobra.presupuesto.entity.ItemDePresupuesto;
import com.gestionobra.presupuesto.entity.Presupuesto;
import com.gestionobra.presupuesto.repository.PresupuestoRepository;
import com.gestionobra.usuario.service.UsuarioSesion;

/**
 * Cobros al cliente (HU-08) y pagos a colaboradores (HU-09). El arquitecto registra y anula;
 * el cliente solo ve los cobros y cada colaborador, los pagos que le hicieron a él.
 */
@Service
public class PagoService {

    public record PagoVista(Long id, LocalDate fecha, BigDecimal monto, String descripcion, TipoPago tipo,
                            EstadoPago estado, String motivoAnulacion, LocalDate fechaAnulacion, Rubro rubro,
                            String colaborador, String nombreComprobante) {
    }

    /** Rubro al que el arquitecto puede imputar un pago; el colaborador sale del responsable. */
    public record RubroVista(Long idItem, Rubro rubro, String responsable, BigDecimal presupuestado,
                             BigDecimal gastoReal) {
    }

    /** Los importes que un perfil no debe ver van vacíos. El saldo es lo cobrado menos lo pagado. */
    public record Resumen(BigDecimal totalPresupuesto, BigDecimal honorarios, BigDecimal totalCobrado,
                          BigDecimal porCobrar, BigDecimal totalPagado, BigDecimal saldo) {
    }

    public record MovimientosVista(boolean habilitado, Resumen resumen, List<PagoVista> cobros, List<PagoVista> pagos,
                                   List<RubroVista> rubros) {

        static MovimientosVista noHabilitado() {
            return new MovimientosVista(false, null, List.of(), List.of(), List.of());
        }
    }

    public record ArchivoComprobante(Resource contenido, String nombre, String tipoContenido) {
    }

    private final PagoRepository pagos;
    private final PresupuestoRepository presupuestos;
    private final ObraService obras;
    private final AlmacenamientoArchivos almacenamiento;
    private final ValidadorComprobante validador;

    public PagoService(PagoRepository pagos, PresupuestoRepository presupuestos, ObraService obras,
                       AlmacenamientoArchivos almacenamiento, ValidadorComprobante validador) {
        this.pagos = pagos;
        this.presupuestos = presupuestos;
        this.obras = obras;
        this.almacenamiento = almacenamiento;
        this.validador = validador;
    }

    @Transactional(readOnly = true)
    public MovimientosVista consultar(Long idObra, UsuarioSesion sesion) {
        Obra obra = obras.obraAccesible(idObra, sesion);
        Optional<Presupuesto> presupuesto = presupuestos.findByObraId(idObra).filter(this::estaAprobado);
        if (presupuesto.isEmpty()) {
            return MovimientosVista.noHabilitado();
        }
        return vistaPara(obra, presupuesto.get(), sesion.id());
    }

    @Transactional
    public PagoVista registrar(Long idObra, TipoPago tipo, Long idItem, LocalDate fecha, BigDecimal monto,
                               String descripcion, MultipartFile archivo, UsuarioSesion sesion) {
        Obra obra = obras.obraDelArquitecto(idObra, sesion);
        Presupuesto presupuesto = presupuestos.findByObraId(idObra)
            .filter(this::estaAprobado)
            .orElseThrow(() -> ErrorNegocio.conflicto(
                "Los cobros y pagos se habilitan cuando el cliente aprueba el presupuesto."));
        validador.validarPresencia(archivo);

        Pago pago = tipo == TipoPago.INGRESO
            ? Pago.cobro(obra, fecha, monto, descripcion.trim())
            : Pago.egreso(itemDeRubro(presupuesto, idItem), fecha, monto, descripcion.trim());
        pago.registrarComprobante(guardarComprobante(archivo));
        return vista(pagos.save(pago));
    }

    @Transactional
    public PagoVista anular(Long idObra, Long idPago, String motivo, UsuarioSesion sesion) {
        Obra obra = obras.obraDelArquitecto(idObra, sesion);
        Pago pago = movimientosDeObra(obra).stream()
            .filter(p -> p.getId().equals(idPago))
            .findFirst()
            .orElseThrow(() -> ErrorNegocio.noEncontrado("No se encontró el movimiento."));
        pago.anular(motivo.trim(), LocalDate.now());
        return vista(pago);
    }

    @Transactional(readOnly = true)
    public ArchivoComprobante obtenerComprobante(Long idObra, Long idPago, UsuarioSesion sesion) {
        Obra obra = obras.obraAccesible(idObra, sesion);
        Comprobante comprobante = movimientosDeObra(obra).stream()
            .filter(p -> p.getId().equals(idPago))
            .filter(visiblePara(obra, sesion.id()))
            .findFirst()
            .flatMap(p -> p.getComprobantes().stream().findFirst())
            .orElseThrow(() -> ErrorNegocio.noEncontrado("No se encontró el comprobante."));
        return new ArchivoComprobante(almacenamiento.leer(comprobante.getUrl()), comprobante.getNombreOriginal(),
            comprobante.getTipoContenido());
    }

    private MovimientosVista vistaPara(Obra obra, Presupuesto presupuesto, Long idUsuario) {
        List<Pago> cobros = pagos.findCobrosDeObra(obra.getId());
        List<Pago> egresos = pagos.findEgresosDePresupuesto(presupuesto.getId());
        BigDecimal totalPresupuesto = presupuesto.calcularMontoTotal();
        BigDecimal totalCobrado = sumarVigentes(cobros);
        BigDecimal porCobrar = totalPresupuesto.subtract(totalCobrado);

        if (obra.esArquitecto(idUsuario)) {
            BigDecimal totalPagado = sumarVigentes(egresos);
            BigDecimal honorarios = presupuesto.getItems().stream()
                .filter(ItemDePresupuesto::esHonorarios)
                .map(ItemDePresupuesto::getMonto)
                .findFirst()
                .orElse(BigDecimal.ZERO);
            Resumen resumen = new Resumen(totalPresupuesto, honorarios, totalCobrado, porCobrar, totalPagado,
                totalCobrado.subtract(totalPagado));
            return new MovimientosVista(true, resumen, vistas(cobros), vistas(egresos),
                rubros(presupuesto, egresos));
        }
        if (obra.esCliente(idUsuario)) {
            Resumen resumen = new Resumen(totalPresupuesto, null, totalCobrado, porCobrar, null, null);
            return new MovimientosVista(true, resumen, vistas(cobros), List.of(), List.of());
        }
        List<Pago> propios = egresos.stream().filter(visiblePara(obra, idUsuario)).toList();
        Resumen resumen = new Resumen(null, null, null, null, sumarVigentes(propios), null);
        return new MovimientosVista(true, resumen, List.of(), vistas(propios), List.of());
    }

    private Predicate<Pago> visiblePara(Obra obra, Long idUsuario) {
        if (obra.esArquitecto(idUsuario)) {
            return pago -> true;
        }
        if (obra.esCliente(idUsuario)) {
            return Pago::esCobro;
        }
        return pago -> !pago.esCobro()
            && pago.getItem().getColaboradorResponsable() != null
            && pago.getItem().getColaboradorResponsable().getId().equals(idUsuario);
    }

    private List<Pago> movimientosDeObra(Obra obra) {
        List<Pago> movimientos = new ArrayList<>(pagos.findCobrosDeObra(obra.getId()));
        presupuestos.findByObraId(obra.getId())
            .ifPresent(presupuesto -> movimientos.addAll(pagos.findEgresosDePresupuesto(presupuesto.getId())));
        return movimientos;
    }

    private boolean estaAprobado(Presupuesto presupuesto) {
        return presupuesto.getEstado() == EstadoPresupuesto.APROBADO;
    }

    /** Solo se puede imputar a un rubro de esta obra: los honorarios no reciben pagos a colaboradores. */
    private ItemDePresupuesto itemDeRubro(Presupuesto presupuesto, Long idItem) {
        if (idItem == null) {
            throw ErrorNegocio.invalido("Elegí el rubro del pago.");
        }
        return presupuesto.getItems().stream()
            .filter(item -> item.getId().equals(idItem) && item.esRubro())
            .findFirst()
            .orElseThrow(() -> ErrorNegocio.invalido("Elegí un rubro de esta obra."));
    }

    private Comprobante guardarComprobante(MultipartFile archivo) {
        try {
            byte[] contenido = archivo.getBytes();
            ValidadorComprobante.TipoArchivo tipo = validador.identificar(contenido);
            String clave = almacenamiento.guardar(contenido, tipo.extension());
            return new Comprobante(clave, LocalDate.now(), nombreOriginal(archivo, tipo.extension()),
                tipo.tipoContenido());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el comprobante", e);
        }
    }

    private String nombreOriginal(MultipartFile archivo, String extension) {
        String nombre = archivo.getOriginalFilename();
        if (nombre == null || nombre.isBlank()) {
            return "comprobante." + extension;
        }
        String sinCarpetas = nombre.substring(Math.max(nombre.lastIndexOf('/'), nombre.lastIndexOf('\\')) + 1);
        return sinCarpetas.length() > 255 ? sinCarpetas.substring(sinCarpetas.length() - 255) : sinCarpetas;
    }

    private List<RubroVista> rubros(Presupuesto presupuesto, List<Pago> egresos) {
        return presupuesto.getItems().stream()
            .filter(ItemDePresupuesto::esRubro)
            .sorted(Comparator.comparing(ItemDePresupuesto::getNombreRubro))
            .map(item -> new RubroVista(item.getId(), item.getNombreRubro(),
                item.getColaboradorResponsable().getNombreCompleto(), item.getMonto(),
                sumarVigentes(egresos.stream().filter(p -> p.getItem().getId().equals(item.getId())).toList())))
            .toList();
    }

    private BigDecimal sumarVigentes(List<Pago> movimientos) {
        return movimientos.stream().filter(Pago::esVigente).map(Pago::getMonto).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<PagoVista> vistas(List<Pago> movimientos) {
        return movimientos.stream().map(this::vista).toList();
    }

    private PagoVista vista(Pago pago) {
        ItemDePresupuesto item = pago.getItem();
        String nombreComprobante = pago.getComprobantes().stream()
            .findFirst()
            .map(Comprobante::getNombreOriginal)
            .orElse(null);
        return new PagoVista(pago.getId(), pago.getFecha(), pago.getMonto(), pago.getDescripcion(), pago.getTipo(),
            pago.getEstado(), pago.getMotivoAnulacion(), pago.getFechaAnulacion(),
            item == null ? null : item.getNombreRubro(),
            item == null ? null : item.getColaboradorResponsable().getNombreCompleto(),
            nombreComprobante);
    }
}
