package com.gestionobra.presupuesto.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.Obra;
import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.usuario.entity.Usuario;

@Entity
@Table(name = "presupuesto")
public class Presupuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_presupuesto")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPresupuesto estado = EstadoPresupuesto.EN_ESTIMACION;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDate fechaCreacion;

    @Column(name = "fecha_presentacion")
    private LocalDate fechaPresentacion;

    @Column(name = "fecha_aprobacion")
    private LocalDate fechaAprobacion;

    @Column(name = "motivo_rechazo")
    private String motivoRechazo;

    /** Porcentaje de desvío a partir del cual se genera una alerta. */
    @Column(name = "umbral_desvio", nullable = false)
    private BigDecimal umbralDesvio = BigDecimal.TEN;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_obra")
    private Obra obra;

    @OneToMany(mappedBy = "presupuesto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemDePresupuesto> items = new ArrayList<>();

    protected Presupuesto() {
    }

    public Presupuesto(Obra obra, LocalDate fechaCreacion) {
        this.obra = obra;
        this.fechaCreacion = fechaCreacion;
    }

    public void agregarRubro(Rubro rubro, Usuario responsable) {
        items.add(ItemDePresupuesto.deRubro(this, rubro, responsable));
    }

    public void cargarHonorarios(BigDecimal monto) {
        exigirEstado(EstadoPresupuesto.EN_ESTIMACION, "Los honorarios solo se modifican durante la estimación.");
        honorarios().ifPresentOrElse(
            item -> item.cambiarMontoHonorarios(monto),
            () -> items.add(ItemDePresupuesto.deHonorarios(this, monto)));
    }

    public BigDecimal calcularMontoTotal() {
        return items.stream().map(ItemDePresupuesto::getMonto).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void consolidar() {
        exigirEstado(EstadoPresupuesto.EN_ESTIMACION, "El presupuesto no está en estimación.");
        String faltantes = items.stream()
            .filter(item -> item.esRubro() && !item.estaConfirmado())
            .map(item -> item.getNombreRubro().getNombre())
            .collect(Collectors.joining(", "));
        if (!faltantes.isEmpty()) {
            throw ErrorNegocio.conflicto("Para consolidar faltan completar o confirmar estos rubros: " + faltantes + ".");
        }
        if (honorarios().isEmpty()) {
            throw ErrorNegocio.conflicto("Para consolidar, cargá los honorarios.");
        }
        estado = EstadoPresupuesto.CONSOLIDADO;
    }

    public void presentar(LocalDate fecha) {
        exigirEstado(EstadoPresupuesto.CONSOLIDADO, "Solo se puede presentar un presupuesto consolidado.");
        estado = EstadoPresupuesto.PRESENTADO;
        fechaPresentacion = fecha;
        motivoRechazo = null;
    }

    public void aprobar(LocalDate fecha) {
        exigirEstado(EstadoPresupuesto.PRESENTADO, "El presupuesto no está presentado.");
        estado = EstadoPresupuesto.APROBADO;
        fechaAprobacion = fecha;
    }

    public void rechazar(String motivo) {
        exigirEstado(EstadoPresupuesto.PRESENTADO, "El presupuesto no está presentado.");
        estado = EstadoPresupuesto.RECHAZADO;
        motivoRechazo = motivo;
    }

    /** Reabre la estimación para corregir costos u honorarios. Las tareas no se tocan. */
    public void volverAEstimacion() {
        if (estado != EstadoPresupuesto.CONSOLIDADO && estado != EstadoPresupuesto.RECHAZADO) {
            throw ErrorNegocio.conflicto("Solo se puede volver a estimación desde un presupuesto consolidado o rechazado.");
        }
        estado = EstadoPresupuesto.EN_ESTIMACION;
    }

    public boolean enEstimacion() {
        return estado == EstadoPresupuesto.EN_ESTIMACION;
    }

    /** El cliente solo ve el presupuesto una vez que se lo presentaron. */
    public boolean visibleParaCliente() {
        return estado == EstadoPresupuesto.PRESENTADO
            || estado == EstadoPresupuesto.APROBADO
            || estado == EstadoPresupuesto.RECHAZADO;
    }

    public BigDecimal montoHonorarios() {
        return honorarios().map(ItemDePresupuesto::getMonto).orElse(BigDecimal.ZERO);
    }

    public void cambiarUmbral(BigDecimal umbral) {
        this.umbralDesvio = umbral;
    }

    public BigDecimal getUmbralDesvio() {
        return umbralDesvio;
    }

    public Optional<ItemDePresupuesto> itemDeRubro(Rubro rubro) {
        return items.stream().filter(item -> item.getNombreRubro() == rubro).findFirst();
    }

    private Optional<ItemDePresupuesto> honorarios() {
        return items.stream().filter(ItemDePresupuesto::esHonorarios).findFirst();
    }

    private void exigirEstado(EstadoPresupuesto esperado, String mensaje) {
        if (estado != esperado) {
            throw ErrorNegocio.conflicto(mensaje);
        }
    }

    public Long getId() {
        return id;
    }

    public EstadoPresupuesto getEstado() {
        return estado;
    }

    public LocalDate getFechaCreacion() {
        return fechaCreacion;
    }

    public LocalDate getFechaPresentacion() {
        return fechaPresentacion;
    }

    public LocalDate getFechaAprobacion() {
        return fechaAprobacion;
    }

    public String getMotivoRechazo() {
        return motivoRechazo;
    }

    public List<ItemDePresupuesto> getItems() {
        return items;
    }
}
