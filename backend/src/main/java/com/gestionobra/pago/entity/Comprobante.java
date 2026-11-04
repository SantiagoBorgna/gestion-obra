package com.gestionobra.pago.entity;

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

@Entity
@Table(name = "comprobante")
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_comprobante")
    private Long id;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "nombre_original", nullable = false)
    private String nombreOriginal;

    @Column(name = "tipo_contenido", nullable = false)
    private String tipoContenido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pago")
    private Pago pago;

    protected Comprobante() {
    }

    public Comprobante(String url, LocalDate fecha, String nombreOriginal, String tipoContenido) {
        this.url = url;
        this.fecha = fecha;
        this.nombreOriginal = nombreOriginal;
        this.tipoContenido = tipoContenido;
    }

    void asociarA(Pago pago) {
        this.pago = pago;
    }

    public String getUrl() {
        return url;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public String getNombreOriginal() {
        return nombreOriginal;
    }

    public String getTipoContenido() {
        return tipoContenido;
    }
}
