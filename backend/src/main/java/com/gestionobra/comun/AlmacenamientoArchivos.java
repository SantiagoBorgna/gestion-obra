package com.gestionobra.comun;

import org.springframework.core.io.Resource;

/** Guarda y recupera archivos sin que el resto del sistema sepa dónde quedan. */
public interface AlmacenamientoArchivos {

    /** Guarda el contenido con un nombre aleatorio y devuelve la clave para recuperarlo. */
    String guardar(byte[] contenido, String extension);

    Resource leer(String clave);
}
