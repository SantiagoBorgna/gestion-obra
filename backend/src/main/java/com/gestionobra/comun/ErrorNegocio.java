package com.gestionobra.comun;

import org.springframework.http.HttpStatus;

/**
 * Error previsto por las reglas de negocio. El mensaje se muestra tal cual al usuario,
 * así que tiene que estar redactado para él.
 */
public class ErrorNegocio extends RuntimeException {

    private final HttpStatus estado;

    public ErrorNegocio(HttpStatus estado, String mensaje) {
        super(mensaje);
        this.estado = estado;
    }

    public static ErrorNegocio noEncontrado(String mensaje) {
        return new ErrorNegocio(HttpStatus.NOT_FOUND, mensaje);
    }

    public static ErrorNegocio prohibido(String mensaje) {
        return new ErrorNegocio(HttpStatus.FORBIDDEN, mensaje);
    }

    public static ErrorNegocio conflicto(String mensaje) {
        return new ErrorNegocio(HttpStatus.CONFLICT, mensaje);
    }

    public static ErrorNegocio invalido(String mensaje) {
        return new ErrorNegocio(HttpStatus.BAD_REQUEST, mensaje);
    }

    public HttpStatus getEstado() {
        return estado;
    }
}
