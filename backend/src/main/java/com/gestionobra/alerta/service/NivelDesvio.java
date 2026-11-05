package com.gestionobra.alerta.service;

public enum NivelDesvio {
    /** Gastó lo presupuestado o menos. */
    SIN_DESVIO,
    /** Se pasó, pero sin superar el umbral. */
    BAJO,
    /** Superó el umbral. */
    MODERADO,
    /** Superó 1,5 veces el umbral. */
    ALTO
}
