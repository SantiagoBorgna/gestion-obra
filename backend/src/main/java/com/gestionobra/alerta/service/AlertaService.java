package com.gestionobra.alerta.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestionobra.alerta.entity.Alerta;
import com.gestionobra.alerta.repository.AlertaRepository;
import com.gestionobra.comun.CorreoService;
import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.Obra;
import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.obra.service.ObraService;
import com.gestionobra.presupuesto.entity.ItemDePresupuesto;
import com.gestionobra.presupuesto.entity.Presupuesto;
import com.gestionobra.usuario.entity.Usuario;
import com.gestionobra.usuario.service.UsuarioSesion;

/** Alertas por desvío presupuestario (HU-12): por rubro y generales de la obra. */
@Service
public class AlertaService {

    /** El rubro va vacío en la alerta general. El nivel de una activa es siempre moderado o alto. */
    public record AlertaVista(Long id, Rubro rubro, BigDecimal presupuestado, BigDecimal gastoReal,
                              BigDecimal porcentaje, NivelDesvio nivel, LocalDate fecha, String mensaje,
                              BigDecimal gastoRealResolucion, LocalDate fechaResolucion) {
    }

    public record AlertasVista(boolean habilitado, BigDecimal umbral, List<AlertaVista> activas,
                               List<AlertaVista> resueltas) {
    }

    private final AlertaRepository alertas;
    private final ComparacionService comparacion;
    private final ObraService obras;
    private final CorreoService correo;
    private final String urlApp;

    public AlertaService(AlertaRepository alertas, ComparacionService comparacion, ObraService obras,
                         CorreoService correo, @Value("${app.url}") String urlApp) {
        this.alertas = alertas;
        this.comparacion = comparacion;
        this.obras = obras;
        this.correo = correo;
        this.urlApp = urlApp;
    }

    @Transactional(readOnly = true)
    public AlertasVista consultar(Long idObra, UsuarioSesion sesion) {
        obras.obraDelArquitecto(idObra, sesion);
        Optional<Presupuesto> aprobado = comparacion.presupuestoAprobado(idObra);
        if (aprobado.isEmpty()) {
            return new AlertasVista(false, null, List.of(), List.of());
        }
        return vista(idObra, aprobado.get());
    }

    /** Aplica el nuevo umbral en el momento: si bajó, pueden aparecer alertas nuevas. */
    @Transactional
    public AlertasVista cambiarUmbral(Long idObra, BigDecimal umbral, UsuarioSesion sesion) {
        Obra obra = obras.obraDelArquitecto(idObra, sesion);
        Presupuesto presupuesto = presupuestoAprobado(idObra);
        presupuesto.cambiarUmbral(umbral);
        revisar(obra, presupuesto);
        return vista(idObra, presupuesto);
    }

    @Transactional
    public AlertasVista resolver(Long idObra, Long idAlerta, UsuarioSesion sesion) {
        obras.obraDelArquitecto(idObra, sesion);
        Presupuesto presupuesto = presupuestoAprobado(idObra);
        Alerta alerta = alertas.findDeObra(idObra).stream()
            .filter(a -> a.getId().equals(idAlerta))
            .findFirst()
            .orElseThrow(() -> ErrorNegocio.noEncontrado("No se encontró la alerta."));
        Map<Long, BigDecimal> gastos = comparacion.gastosPorItem(presupuesto);
        alerta.resolver(desvioDe(alerta, presupuesto, gastos).gastoReal(), LocalDate.now());
        return vista(idObra, presupuesto);
    }

    /**
     * Revisa todos los rubros y el total de la obra. Se puede llamar las veces que haga falta:
     * solo crea una alerta si se supera el umbral, no hay otra activa y el gasto superó
     * el punto en que se resolvió la anterior.
     */
    @Transactional
    public void revisar(Obra obra, Presupuesto presupuesto) {
        BigDecimal umbral = presupuesto.getUmbralDesvio();
        Map<Long, BigDecimal> gastos = comparacion.gastosPorItem(presupuesto);

        for (ItemDePresupuesto item : comparacion.rubros(presupuesto)) {
            Desvio desvio = comparacion.desvioDe(item, gastos);
            boolean corresponde = desvio.supera(umbral)
                && !alertas.existsByItemIdAndResueltaFalse(item.getId())
                && superaResolucion(alertas.findFirstByItemIdAndResueltaTrueOrderByIdDesc(item.getId()), desvio);
            if (corresponde) {
                crear(obra, Alerta.deRubro(item, mensaje(item.getNombreRubro().getNombre(), desvio), LocalDate.now()));
            }
        }

        Desvio total = comparacion.desvioTotal(presupuesto, gastos);
        boolean corresponde = total.supera(umbral)
            && !alertas.existsByObraIdAndResueltaFalse(obra.getId())
            && superaResolucion(alertas.findFirstByObraIdAndResueltaTrueOrderByIdDesc(obra.getId()), total);
        if (corresponde) {
            crear(obra, Alerta.general(obra, mensaje("El total de la obra", total), LocalDate.now()));
        }
    }

    private boolean superaResolucion(Optional<Alerta> ultimaResuelta, Desvio desvio) {
        return ultimaResuelta
            .map(alerta -> desvio.gastoReal().compareTo(alerta.getGastoRealResolucion()) > 0)
            .orElse(true);
    }

    private void crear(Obra obra, Alerta alerta) {
        alertas.save(alerta);
        Usuario arquitecto = obra.getArquitecto();
        correo.enviarAviso(arquitecto.getEmail(), "Alerta de desvío en " + obra.getTitulo(), """
            Hola %s:

            %s

            Podés revisarlo desde acá:

            %s
            """.formatted(arquitecto.getNombreCompleto(), alerta.getMensaje(),
                urlApp + "/obras/" + obra.getId() + "/alertas"));
    }

    private String mensaje(String sujeto, Desvio desvio) {
        String porcentaje = desvio.porcentaje().stripTrailingZeros().toPlainString().replace('.', ',');
        return sujeto + " superó lo presupuestado en un " + porcentaje + " %.";
    }

    private Presupuesto presupuestoAprobado(Long idObra) {
        return comparacion.presupuestoAprobado(idObra)
            .orElseThrow(() -> ErrorNegocio.conflicto("Todavía no hay un presupuesto aprobado."));
    }

    private Desvio desvioDe(Alerta alerta, Presupuesto presupuesto, Map<Long, BigDecimal> gastos) {
        return alerta.esGeneral()
            ? comparacion.desvioTotal(presupuesto, gastos)
            : comparacion.desvioDe(alerta.getItem(), gastos);
    }

    private AlertasVista vista(Long idObra, Presupuesto presupuesto) {
        BigDecimal umbral = presupuesto.getUmbralDesvio();
        Map<Long, BigDecimal> gastos = comparacion.gastosPorItem(presupuesto);
        List<Alerta> todas = alertas.findDeObra(idObra);
        List<AlertaVista> activas = todas.stream()
            .filter(alerta -> !alerta.getResuelta())
            .map(alerta -> vista(alerta, presupuesto, gastos, umbral))
            .toList();
        List<AlertaVista> resueltas = todas.stream()
            .filter(Alerta::getResuelta)
            .map(alerta -> vista(alerta, presupuesto, gastos, umbral))
            .toList();
        return new AlertasVista(true, umbral, activas, resueltas);
    }

    /** Muestra el desvío actual. Si un pago anulado lo bajó del umbral, la alerta sigue como moderada. */
    private AlertaVista vista(Alerta alerta, Presupuesto presupuesto, Map<Long, BigDecimal> gastos, BigDecimal umbral) {
        Desvio desvio = desvioDe(alerta, presupuesto, gastos);
        NivelDesvio nivel = desvio.nivel(umbral) == NivelDesvio.ALTO ? NivelDesvio.ALTO : NivelDesvio.MODERADO;
        Rubro rubro = alerta.esGeneral() ? null : alerta.getItem().getNombreRubro();
        return new AlertaVista(alerta.getId(), rubro, desvio.presupuestado(), desvio.gastoReal(), desvio.porcentaje(),
            nivel, alerta.getFecha(), alerta.getMensaje(), alerta.getGastoRealResolucion(),
            alerta.getFechaResolucion());
    }
}
