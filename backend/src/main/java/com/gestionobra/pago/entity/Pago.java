package com.gestionobra.pago.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.Obra;
import com.gestionobra.presupuesto.entity.ItemDePresupuesto;

/** Movimiento de dinero: cobro al cliente (INGRESO) o pago a un colaborador (EGRESO). */
@Entity
@Table(name = "pago")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago")
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private BigDecimal monto;

    @Column(nullable = false)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPago tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPago estado = EstadoPago.VIGENTE;

    @Column(name = "motivo_anulacion")
    private String motivoAnulacion;

    @Column(name = "fecha_anulacion")
    private LocalDate fechaAnulacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_obra")
    private Obra obra;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_item")
    private ItemDePresupuesto item;

    @OneToMany(mappedBy = "pago", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comprobante> comprobantes = new ArrayList<>();

    protected Pago() {
    }

    private Pago(LocalDate fecha, BigDecimal monto, String descripcion, TipoPago tipo) {
        this.fecha = fecha;
        this.monto = monto;
        this.descripcion = descripcion;
        this.tipo = tipo;
    }

    public static Pago cobro(Obra obra, LocalDate fecha, BigDecimal monto, String descripcion) {
        Pago pago = new Pago(fecha, monto, descripcion, TipoPago.INGRESO);
        pago.obra = obra;
        return pago;
    }

    public static Pago egreso(ItemDePresupuesto item, LocalDate fecha, BigDecimal monto, String descripcion) {
        Pago pago = new Pago(fecha, monto, descripcion, TipoPago.EGRESO);
        pago.item = item;
        return pago;
    }

    public void registrarComprobante(Comprobante comprobante) {
        comprobante.asociarA(this);
        comprobantes.add(comprobante);
    }

    /** No se borra: queda registrado con su motivo y deja de sumar a los totales. */
    public void anular(String motivo, LocalDate fecha) {
        if (estado == EstadoPago.ANULADO) {
            throw ErrorNegocio.conflicto("Este movimiento ya está anulado.");
        }
        estado = EstadoPago.ANULADO;
        motivoAnulacion = motivo;
        fechaAnulacion = fecha;
    }

    public boolean esVigente() {
        return estado == EstadoPago.VIGENTE;
    }

    public boolean esCobro() {
        return tipo == TipoPago.INGRESO;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public TipoPago getTipo() {
        return tipo;
    }

    public EstadoPago getEstado() {
        return estado;
    }

    public String getMotivoAnulacion() {
        return motivoAnulacion;
    }

    public LocalDate getFechaAnulacion() {
        return fechaAnulacion;
    }

    public ItemDePresupuesto getItem() {
        return item;
    }

    public List<Comprobante> getComprobantes() {
        return comprobantes;
    }
}
