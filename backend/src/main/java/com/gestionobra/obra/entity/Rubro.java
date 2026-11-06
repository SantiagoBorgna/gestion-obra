package com.gestionobra.obra.entity;

public enum Rubro {
    MOVIMIENTO_DE_SUELOS("Movimiento de suelos"),
    FUNDACIONES("Cimientos"),
    ESTRUCTURAS("Estructuras"),
    MAMPOSTERIA("Mampostería"),
    TECHOS_Y_CUBIERTAS("Techos y cubiertas"),
    INSTALACION_SANITARIA("Instalación sanitaria"),
    INSTALACION_ELECTRICA("Instalación eléctrica"),
    INSTALACION_DE_GAS("Instalación de gas"),
    REVOQUES("Revoques"),
    PISOS("Pisos"),
    CARPINTERIA("Carpintería"),
    PINTURA("Pintura"),
    TERMINACIONES("Terminaciones");

    private final String nombre;

    Rubro(String nombre) {
        this.nombre = nombre;
    }

    /** Nombre para mostrar en mensajes y correos. */
    public String getNombre() {
        return nombre;
    }
}
