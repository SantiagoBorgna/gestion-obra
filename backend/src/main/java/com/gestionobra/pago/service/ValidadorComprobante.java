package com.gestionobra.pago.service;

import java.util.Arrays;
import java.util.List;

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

    private static final int CANTIDAD_MAXIMA = 5;
    private static final long TAMANIO_MAXIMO = 10L * 1024 * 1024;
    private static final byte[] FIRMA_PDF = {'%', 'P', 'D', 'F', '-'};
    private static final byte[] FIRMA_JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] FIRMA_PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};

    /** Devuelve los archivos que traen contenido, después de controlar la cantidad y el tamaño. */
    public List<MultipartFile> validarPresencia(List<MultipartFile> archivos) {
        List<MultipartFile> conContenido = archivos == null
            ? List.of()
            : archivos.stream().filter(archivo -> !archivo.isEmpty()).toList();
        if (conContenido.isEmpty()) {
            throw ErrorNegocio.invalido("Adjuntá al menos un comprobante.");
        }
        if (conContenido.size() > CANTIDAD_MAXIMA) {
            throw ErrorNegocio.invalido("Podés adjuntar hasta " + CANTIDAD_MAXIMA + " comprobantes.");
        }
        if (conContenido.stream().anyMatch(archivo -> archivo.getSize() > TAMANIO_MAXIMO)) {
            throw ErrorNegocio.invalido("Cada comprobante puede pesar como máximo 10 MB.");
        }
        return conContenido;
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
