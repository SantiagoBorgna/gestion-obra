package com.gestionobra.presupuesto.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

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

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.usuario.entity.Usuario;

@Entity
@Table(name = "item_de_presupuesto")
public class ItemDePresupuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_item")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "nombre_rubro")
    private Rubro nombreRubro;

    @Column(nullable = false)
    private BigDecimal monto = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoItem tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoItem estado;

    @Column(name = "fecha_actualizacion")
    private LocalDate fechaActualizacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_presupuesto")
    private Presupuesto presupuesto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_colaborador")
    private Usuario colaboradorResponsable;

    protected ItemDePresupuesto() {
    }

    private ItemDePresupuesto(Presupuesto presupuesto, TipoItem tipo, EstadoItem estado) {
        this.presupuesto = presupuesto;
        this.tipo = tipo;
        this.estado = estado;
    }

    static ItemDePresupuesto deRubro(Presupuesto presupuesto, Rubro rubro, Usuario responsable) {
        ItemDePresupuesto item = new ItemDePresupuesto(presupuesto, TipoItem.RUBRO, EstadoItem.SIN_CARGAR);
        item.nombreRubro = rubro;
        item.colaboradorResponsable = responsable;
        return item;
    }

    /** Los honorarios los carga el propio arquitecto, así que no necesitan confirmación. */
    static ItemDePresupuesto deHonorarios(Presupuesto presupuesto, BigDecimal monto) {
        ItemDePresupuesto item = new ItemDePresupuesto(presupuesto, TipoItem.HONORARIOS, EstadoItem.CONFIRMADO);
        item.cambiarMontoHonorarios(monto);
        return item;
    }

    /**
     * El monto del rubro es la suma de sus tareas. Si el cambio lo hace el colaborador, el rubro queda
     * pendiente aunque ya estuviera confirmado, para que el arquitecto lo revise de nuevo. Si lo hace
     * el arquitecto, queda confirmado, porque él es quien lo revisa.
     */
    public void actualizarMonto(BigDecimal suma, boolean todasLasTareasCargadas, boolean cargadoPorArquitecto) {
        this.monto = suma;
        this.fechaActualizacion = LocalDate.now();
        if (!todasLasTareasCargadas) {
            this.estado = EstadoItem.SIN_CARGAR;
        } else {
            this.estado = cargadoPorArquitecto ? EstadoItem.CONFIRMADO : EstadoItem.PENDIENTE_CONFIRMACION;
        }
    }

    void cambiarMontoHonorarios(BigDecimal monto) {
        this.monto = monto;
        this.fechaActualizacion = LocalDate.now();
    }

    public void confirmar() {
        if (estado != EstadoItem.PENDIENTE_CONFIRMACION) {
            throw ErrorNegocio.conflicto("Este rubro no está pendiente de confirmación.");
        }
        this.estado = EstadoItem.CONFIRMADO;
        this.fechaActualizacion = LocalDate.now();
    }

    public boolean esRubro() {
        return tipo == TipoItem.RUBRO;
    }

    public boolean esHonorarios() {
        return tipo == TipoItem.HONORARIOS;
    }

    public boolean estaConfirmado() {
        return estado == EstadoItem.CONFIRMADO;
    }

    public Long getId() {
        return id;
    }

    public Rubro getNombreRubro() {
        return nombreRubro;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public TipoItem getTipo() {
        return tipo;
    }

    public EstadoItem getEstado() {
        return estado;
    }

    public LocalDate getFechaActualizacion() {
        return fechaActualizacion;
    }

    public Usuario getColaboradorResponsable() {
        return colaboradorResponsable;
    }
}
