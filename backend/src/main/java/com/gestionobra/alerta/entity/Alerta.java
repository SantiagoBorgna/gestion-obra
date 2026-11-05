package com.gestionobra.alerta.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.Obra;
import com.gestionobra.presupuesto.entity.ItemDePresupuesto;

/** Aviso de desvío presupuestario de un rubro o del total de la obra (alerta general). */
@Entity
@Table(name = "alerta")
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_alerta")
    private Long id;

    @Column(nullable = false)
    private String mensaje;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private Boolean resuelta = false;

    @Column(name = "gasto_real_resolucion")
    private BigDecimal gastoRealResolucion;

    @Column(name = "fecha_resolucion")
    private LocalDate fechaResolucion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_item")
    private ItemDePresupuesto item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_obra")
    private Obra obra;

    protected Alerta() {
    }

    private Alerta(String mensaje, LocalDate fecha) {
        this.mensaje = mensaje;
        this.fecha = fecha;
    }

    public static Alerta deRubro(ItemDePresupuesto item, String mensaje, LocalDate fecha) {
        Alerta alerta = new Alerta(mensaje, fecha);
        alerta.item = item;
        return alerta;
    }

    public static Alerta general(Obra obra, String mensaje, LocalDate fecha) {
        Alerta alerta = new Alerta(mensaje, fecha);
        alerta.obra = obra;
        return alerta;
    }

    public void resolver(BigDecimal gastoReal, LocalDate fecha) {
        if (resuelta) {
            throw ErrorNegocio.conflicto("Esta alerta ya está resuelta.");
        }
        resuelta = true;
        gastoRealResolucion = gastoReal;
        fechaResolucion = fecha;
    }

    public boolean esGeneral() {
        return item == null;
    }

    public Long getId() {
        return id;
    }

    public String getMensaje() {
        return mensaje;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public Boolean getResuelta() {
        return resuelta;
    }

    public BigDecimal getGastoRealResolucion() {
        return gastoRealResolucion;
    }

    public LocalDate getFechaResolucion() {
        return fechaResolucion;
    }

    public ItemDePresupuesto getItem() {
        return item;
    }
}
