package com.gestionobra.obra.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import com.gestionobra.usuario.entity.Usuario;

/** Colaborador (cuadrilla o especialista) asignado a una obra, con el rubro que tiene a cargo. */
@Entity
@Table(name = "asignacion_colaborador")
public class AsignacionColaborador {

    @EmbeddedId
    private Clave id;

    @MapsId("idObra")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_obra")
    private Obra obra;

    @MapsId("idColaborador")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_colaborador")
    private Usuario colaborador;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rubro rubro;

    protected AsignacionColaborador() {
    }

    AsignacionColaborador(Obra obra, Usuario colaborador, Rubro rubro) {
        this.id = new Clave(obra.getId(), colaborador.getId());
        this.obra = obra;
        this.colaborador = colaborador;
        this.rubro = rubro;
    }

    public Obra getObra() {
        return obra;
    }

    public Usuario getColaborador() {
        return colaborador;
    }

    public Rubro getRubro() {
        return rubro;
    }

    @Embeddable
    public static class Clave implements Serializable {

        @Column(name = "id_obra")
        private Long idObra;

        @Column(name = "id_colaborador")
        private Long idColaborador;

        protected Clave() {
        }

        Clave(Long idObra, Long idColaborador) {
            this.idObra = idObra;
            this.idColaborador = idColaborador;
        }

        @Override
        public boolean equals(Object otro) {
            if (this == otro) {
                return true;
            }
            if (!(otro instanceof Clave c)) {
                return false;
            }
            return Objects.equals(idObra, c.idObra) && Objects.equals(idColaborador, c.idColaborador);
        }

        @Override
        public int hashCode() {
            return Objects.hash(idObra, idColaborador);
        }
    }
}
