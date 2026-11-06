package com.gestionobra.alerta.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.obra.service.ObraService;
import com.gestionobra.pago.entity.Pago;
import com.gestionobra.pago.repository.PagoRepository;
import com.gestionobra.presupuesto.entity.EstadoPresupuesto;
import com.gestionobra.presupuesto.entity.ItemDePresupuesto;
import com.gestionobra.presupuesto.entity.Presupuesto;
import com.gestionobra.presupuesto.repository.PresupuestoRepository;
import com.gestionobra.usuario.service.UsuarioSesion;

/**
 * Comparación entre lo presupuestado y lo gastado (HU-11). Se calcula en cada consulta a partir
 * de los pagos vigentes, así que siempre está al día. Los honorarios no reciben pagos: figuran
 * con el gasto igual a lo presupuestado, sin desvío, y forman parte de los totales.
 */
@Service
public class ComparacionService {

    /** El rubro va vacío en la fila de honorarios. */
    public record FilaComparacion(Long idItem, Rubro rubro, BigDecimal presupuestado, BigDecimal gastoReal,
                                  BigDecimal diferencia, BigDecimal porcentaje, NivelDesvio nivel) {
    }

    public record Totales(BigDecimal presupuestado, BigDecimal gastoReal, BigDecimal diferencia,
                          BigDecimal porcentaje, NivelDesvio nivel) {
    }

    public record ComparacionVista(boolean habilitado, BigDecimal umbral, Totales totales,
                                   List<FilaComparacion> rubros) {
    }

    private final PresupuestoRepository presupuestos;
    private final PagoRepository pagos;
    private final ObraService obras;

    public ComparacionService(PresupuestoRepository presupuestos, PagoRepository pagos, ObraService obras) {
        this.presupuestos = presupuestos;
        this.pagos = pagos;
        this.obras = obras;
    }

    @Transactional(readOnly = true)
    public ComparacionVista consultar(Long idObra, UsuarioSesion sesion) {
        obras.obraDelArquitecto(idObra, sesion);
        Optional<Presupuesto> aprobado = presupuestoAprobado(idObra);
        if (aprobado.isEmpty()) {
            return new ComparacionVista(false, null, null, List.of());
        }

        Presupuesto presupuesto = aprobado.get();
        BigDecimal umbral = presupuesto.getUmbralDesvio();
        Map<Long, BigDecimal> gastos = gastosPorItem(presupuesto);
        // De mayor a menor desvío. Con el mismo desvío, los honorarios van después de los rubros.
        List<FilaComparacion> filas = presupuesto.getItems().stream()
            .sorted(Comparator.comparing((ItemDePresupuesto item) -> desvioDe(item, gastos).porcentaje(), Comparator.reverseOrder())
                .thenComparing(ItemDePresupuesto::esHonorarios)
                .thenComparing(ItemDePresupuesto::getNombreRubro, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(item -> {
                Desvio desvio = desvioDe(item, gastos);
                return new FilaComparacion(item.getId(), item.getNombreRubro(), desvio.presupuestado(),
                    desvio.gastoReal(), desvio.diferencia(), desvio.porcentaje(), desvio.nivel(umbral));
            })
            .toList();
        Desvio total = desvioTotal(presupuesto, gastos);
        Totales totales = new Totales(total.presupuestado(), total.gastoReal(), total.diferencia(),
            total.porcentaje(), total.nivel(umbral));
        return new ComparacionVista(true, umbral, totales, filas);
    }

    Optional<Presupuesto> presupuestoAprobado(Long idObra) {
        return presupuestos.findByObraId(idObra)
            .filter(presupuesto -> presupuesto.getEstado() == EstadoPresupuesto.APROBADO);
    }

    List<ItemDePresupuesto> rubros(Presupuesto presupuesto) {
        return presupuesto.getItems().stream()
            .filter(ItemDePresupuesto::esRubro)
            .sorted(Comparator.comparing(ItemDePresupuesto::getNombreRubro))
            .toList();
    }

    /** Gasto real de cada rubro: la suma de sus pagos vigentes. */
    Map<Long, BigDecimal> gastosPorItem(Presupuesto presupuesto) {
        return pagos.findEgresosDePresupuesto(presupuesto.getId()).stream()
            .filter(Pago::esVigente)
            .collect(Collectors.toMap(pago -> pago.getItem().getId(), Pago::getMonto, BigDecimal::add));
    }

    Desvio desvioDe(ItemDePresupuesto item, Map<Long, BigDecimal> gastos) {
        if (item.esHonorarios()) {
            return new Desvio(item.getMonto(), item.getMonto());
        }
        return new Desvio(item.getMonto(), gastos.getOrDefault(item.getId(), BigDecimal.ZERO));
    }

    Desvio desvioTotal(Presupuesto presupuesto, Map<Long, BigDecimal> gastos) {
        BigDecimal pagos = gastos.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return new Desvio(presupuesto.calcularMontoTotal(), pagos.add(presupuesto.montoHonorarios()));
    }
}
