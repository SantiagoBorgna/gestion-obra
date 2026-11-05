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

/**
 * Responsable de un rubro en una obra. Cada rubro tiene un solo responsable,
 * y una misma persona (cuadrilla o especialista) puede tener varios rubros.
 */
@Entity
@Table(name = "asignacion_colaborador")
public class AsignacionColaborador {

    @EmbeddedId
    private Clave id;

    @MapsId("idObra")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_obra")
    private Obra obra;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_colaborador")
    private Usuario colaborador;

    protected AsignacionColaborador() {
    }

    AsignacionColaborador(Obra obra, Usuario colaborador, Rubro rubro) {
        this.id = new Clave(obra.getId(), rubro);
        this.obra = obra;
        this.colaborador = colaborador;
    }

    public Obra getObra() {
        return obra;
    }

    public Usuario getColaborador() {
        return colaborador;
    }

    public Rubro getRubro() {
        return id.rubro;
    }

    @Embeddable
    public static class Clave implements Serializable {

        @Column(name = "id_obra")
        private Long idObra;

        @Enumerated(EnumType.STRING)
        @Column(name = "rubro")
        private Rubro rubro;

        protected Clave() {
        }

        Clave(Long idObra, Rubro rubro) {
            this.idObra = idObra;
            this.rubro = rubro;
        }

        @Override
        public boolean equals(Object otro) {
            if (this == otro) {
                return true;
            }
            if (!(otro instanceof Clave c)) {
                return false;
            }
            return Objects.equals(idObra, c.idObra) && rubro == c.rubro;
        }

        @Override
        public int hashCode() {
            return Objects.hash(idObra, rubro);
        }
    }
}
