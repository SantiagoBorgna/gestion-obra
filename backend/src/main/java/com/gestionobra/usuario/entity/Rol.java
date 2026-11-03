package com.gestionobra.usuario.entity;

public enum Rol {
    ARQUITECTO,
    CUADRILLA,
    ESPECIALISTA,
    CLIENTE;

    /** Cuadrilla y especialista son los colaboradores que se asignan a un rubro de la obra. */
    public boolean esColaborador() {
        return this == CUADRILLA || this == ESPECIALISTA;
    }
}
