package com.gestionobra.alerta.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Diferencia entre lo presupuestado y lo gastado. Un valor positivo significa que se gastó de más. */
public record Desvio(BigDecimal presupuestado, BigDecimal gastoReal) {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);
    private static final BigDecimal FACTOR_ALTO = new BigDecimal("1.5");

    public BigDecimal diferencia() {
        return gastoReal.subtract(presupuestado);
    }

    public BigDecimal porcentaje() {
        if (presupuestado.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return diferencia().multiply(CIEN).divide(presupuestado, 2, RoundingMode.HALF_UP);
    }

    /** Compara sin redondear, para que un 10,001 % supere un umbral del 10 %. */
    public boolean supera(BigDecimal umbral) {
        return gastoReal.multiply(CIEN).compareTo(presupuestado.multiply(CIEN.add(umbral))) > 0;
    }

    public NivelDesvio nivel(BigDecimal umbral) {
        if (diferencia().signum() <= 0) {
            return NivelDesvio.SIN_DESVIO;
        }
        if (supera(umbral.multiply(FACTOR_ALTO))) {
            return NivelDesvio.ALTO;
        }
        return supera(umbral) ? NivelDesvio.MODERADO : NivelDesvio.BAJO;
    }
}
