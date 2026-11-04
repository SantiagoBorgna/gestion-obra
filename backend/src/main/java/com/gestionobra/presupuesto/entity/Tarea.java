package com.gestionobra.presupuesto.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.gestionobra.obra.entity.Obra;
import com.gestionobra.obra.entity.Rubro;

/** Tarea del relevamiento del alcance, con el costo que carga el colaborador del rubro. */
@Entity
@Table(name = "tarea")
public class Tarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tarea")
    private Long id;

    @Column(nullable = false)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rubro rubro;

    @Column(name = "monto_estimado")
    private BigDecimal montoEstimado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_obra")
    private Obra obra;

    protected Tarea() {
    }

    public Tarea(Obra obra, String descripcion, Rubro rubro) {
        this.obra = obra;
        this.descripcion = descripcion;
        this.rubro = rubro;
    }

    public void modificar(String descripcion, Rubro rubro) {
        this.descripcion = descripcion;
        this.rubro = rubro;
    }

    public void cargarMonto(BigDecimal monto) {
        this.montoEstimado = monto;
    }

    public boolean tieneMonto() {
        return montoEstimado != null;
    }

    public Long getId() {
        return id;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public Rubro getRubro() {
        return rubro;
    }

    public BigDecimal getMontoEstimado() {
        return montoEstimado;
    }
}
