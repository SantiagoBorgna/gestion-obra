package com.gestionobra.comun;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

/** Guarda los archivos en una carpeta del servidor (en Docker, un volumen). */
@Component
@ConditionalOnProperty(name = "app.storage.tipo", havingValue = "local", matchIfMissing = true)
public class AlmacenamientoLocal implements AlmacenamientoArchivos {

    private final Path directorio;

    public AlmacenamientoLocal(@Value("${app.storage.directorio}") String directorio) {
        this.directorio = Path.of(directorio).toAbsolutePath().normalize();
    }

    @Override
    public String guardar(byte[] contenido, String extension) {
        String clave = UUID.randomUUID() + "." + extension;
        try {
            Files.createDirectories(directorio);
            Files.write(directorio.resolve(clave), contenido);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar el archivo", e);
        }
        return clave;
    }

    @Override
    public Resource leer(String clave) {
        Path ruta = directorio.resolve(clave).normalize();
        if (!ruta.startsWith(directorio) || !Files.isRegularFile(ruta)) {
            throw ErrorNegocio.noEncontrado("No se encontró el archivo.");
        }
        return new FileSystemResource(ruta);
    }
}
