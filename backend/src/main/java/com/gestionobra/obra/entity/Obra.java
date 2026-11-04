package com.gestionobra.obra.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

import com.gestionobra.usuario.entity.Usuario;

@Entity
@Table(name = "obra")
public class Obra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_obra")
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private String ubicacion;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoObra estado = EstadoObra.EN_CURSO;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_arquitecto")
    private Usuario arquitecto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_cliente")
    private Usuario cliente;

    @OneToMany(mappedBy = "obra", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AsignacionColaborador> asignaciones = new ArrayList<>();

    protected Obra() {
    }

    public Obra(String titulo, String descripcion, String ubicacion, LocalDate fechaInicio,
                Usuario arquitecto, Usuario cliente) {
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.ubicacion = ubicacion;
        this.fechaInicio = fechaInicio;
        this.arquitecto = arquitecto;
        this.cliente = cliente;
    }

    public void agregarColaborador(Usuario colaborador, Rubro rubro) {
        asignaciones.add(new AsignacionColaborador(this, colaborador, rubro));
    }

    public boolean tieneColaborador(Long idUsuario) {
        return asignaciones.stream().anyMatch(a -> a.getColaborador().getId().equals(idUsuario));
    }

    /** Arquitecto, cliente o colaborador asignado: los únicos que pueden ver la obra. */
    public boolean participa(Long idUsuario) {
        return arquitecto.getId().equals(idUsuario)
            || cliente.getId().equals(idUsuario)
            || tieneColaborador(idUsuario);
    }

    public boolean esArquitecto(Long idUsuario) {
        return arquitecto.getId().equals(idUsuario);
    }

    public boolean esCliente(Long idUsuario) {
        return cliente.getId().equals(idUsuario);
    }

    /** Rubro que tiene a cargo el colaborador en esta obra. */
    public Optional<Rubro> rubroDe(Long idUsuario) {
        return asignaciones.stream()
            .filter(a -> a.getColaborador().getId().equals(idUsuario))
            .map(AsignacionColaborador::getRubro)
            .findFirst();
    }

    /** Colaborador responsable del rubro en esta obra. */
    public Optional<Usuario> responsableDe(Rubro rubro) {
        return asignaciones.stream()
            .filter(a -> a.getRubro() == rubro)
            .map(AsignacionColaborador::getColaborador)
            .findFirst();
    }

    public Long getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public EstadoObra getEstado() {
        return estado;
    }

    public Usuario getArquitecto() {
        return arquitecto;
    }

    public Usuario getCliente() {
        return cliente;
    }

    public List<AsignacionColaborador> getAsignaciones() {
        return asignaciones;
    }
}
