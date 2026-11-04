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
        item.monto = monto;
        return item;
    }

    /**
     * El monto del rubro es la suma de sus tareas. Cualquier cambio de costo lo deja
     * pendiente, aunque ya estuviera confirmado, para que el arquitecto lo revise de nuevo.
     */
    public void actualizarMonto(BigDecimal suma, boolean todasLasTareasCargadas) {
        this.monto = suma;
        this.estado = todasLasTareasCargadas ? EstadoItem.PENDIENTE_CONFIRMACION : EstadoItem.SIN_CARGAR;
    }

    void cambiarMontoHonorarios(BigDecimal monto) {
        this.monto = monto;
    }

    public void confirmar() {
        if (estado != EstadoItem.PENDIENTE_CONFIRMACION) {
            throw ErrorNegocio.conflicto("Este rubro no está pendiente de confirmación.");
        }
        this.estado = EstadoItem.CONFIRMADO;
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

    public Usuario getColaboradorResponsable() {
        return colaboradorResponsable;
    }
}
