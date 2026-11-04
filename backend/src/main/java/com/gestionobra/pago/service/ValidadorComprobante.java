package com.gestionobra.pago.service;

import java.util.Arrays;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.gestionobra.comun.ErrorNegocio;

/**
 * Identifica el tipo del comprobante por sus primeros bytes. No se confía en la
 * extensión ni en el tipo que informa el navegador, porque se pueden falsear.
 */
@Component
public class ValidadorComprobante {

    public record TipoArchivo(String tipoContenido, String extension) {
    }

    private static final long TAMANIO_MAXIMO = 10L * 1024 * 1024;
    private static final byte[] FIRMA_PDF = {'%', 'P', 'D', 'F', '-'};
    private static final byte[] FIRMA_JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] FIRMA_PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};

    public void validarPresencia(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw ErrorNegocio.invalido("Adjuntá el comprobante.");
        }
        if (archivo.getSize() > TAMANIO_MAXIMO) {
            throw ErrorNegocio.invalido("El comprobante puede pesar como máximo 10 MB.");
        }
    }

    public TipoArchivo identificar(byte[] contenido) {
        if (empiezaCon(contenido, FIRMA_PDF)) {
            return new TipoArchivo("application/pdf", "pdf");
        }
        if (empiezaCon(contenido, FIRMA_JPG)) {
            return new TipoArchivo("image/jpeg", "jpg");
        }
        if (empiezaCon(contenido, FIRMA_PNG)) {
            return new TipoArchivo("image/png", "png");
        }
        throw ErrorNegocio.invalido("El comprobante tiene que ser un archivo PDF, JPG o PNG.");
    }

    private boolean empiezaCon(byte[] contenido, byte[] firma) {
        return contenido.length >= firma.length
            && Arrays.equals(contenido, 0, firma.length, firma, 0, firma.length);
    }
}
