package com.gestionobra.usuario.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.usuario.entity.Usuario;

/**
 * Reglas de contraseña según NIST SP 800-63B-4: largo entre 15 y 64 caracteres,
 * sin reglas de composición, y rechazo de contraseñas comunes, repetitivas
 * o que contengan datos propios del usuario.
 */
@Component
public class ValidadorClave {

    public static final int LARGO_MINIMO = 15;
    public static final int LARGO_MAXIMO = 64;
    /** BCrypt solo usa los primeros 72 bytes; por encima, partes de la contraseña se ignorarían. */
    private static final int BYTES_MAXIMOS = 72;

    private final Set<String> clavesComunes;

    public ValidadorClave() throws IOException {
        var recurso = new ClassPathResource("claves-comunes.txt");
        try (var lector = new BufferedReader(new InputStreamReader(recurso.getInputStream(), StandardCharsets.UTF_8))) {
            clavesComunes = lector.lines()
                .map(String::trim)
                .filter(linea -> !linea.isEmpty() && !linea.startsWith("#"))
                .map(String::toLowerCase)
                .collect(Collectors.toUnmodifiableSet());
        }
    }

    public void validar(String clave, Usuario usuario) {
        if (clave == null) {
            throw ErrorNegocio.invalido("Ingresá una contraseña.");
        }
        int largo = clave.codePointCount(0, clave.length());
        if (largo < LARGO_MINIMO) {
            throw ErrorNegocio.invalido("La contraseña tiene que tener al menos " + LARGO_MINIMO + " caracteres.");
        }
        if (largo > LARGO_MAXIMO || clave.getBytes(StandardCharsets.UTF_8).length > BYTES_MAXIMOS) {
            throw ErrorNegocio.invalido("La contraseña puede tener como máximo " + LARGO_MAXIMO + " caracteres.");
        }

        String normalizada = clave.toLowerCase();
        if (clavesComunes.contains(normalizada) || esRepetitiva(normalizada)) {
            throw ErrorNegocio.invalido("Esa contraseña es muy común o fácil de adivinar. Elegí otra.");
        }
        if (contieneDatosDelUsuario(normalizada, usuario)) {
            throw ErrorNegocio.invalido("La contraseña no puede contener tu correo ni tu nombre.");
        }
    }

    /** Un mismo carácter repetido o una secuencia ascendente (por ejemplo 123456789012345). */
    private boolean esRepetitiva(String clave) {
        boolean igual = true;
        boolean secuencia = true;
        for (int i = 1; i < clave.length(); i++) {
            char anterior = clave.charAt(i - 1);
            char actual = clave.charAt(i);
            igual &= actual == anterior;
            secuencia &= actual == anterior + 1 || (anterior == '9' && actual == '0');
        }
        return igual || secuencia;
    }

    private boolean contieneDatosDelUsuario(String clave, Usuario usuario) {
        String usuarioCorreo = usuario.getEmail().split("@")[0];
        if (usuarioCorreo.length() >= 4 && clave.contains(usuarioCorreo)) {
            return true;
        }
        String nombreJunto = usuario.getNombreCompleto().toLowerCase().replaceAll("\\s+", "");
        return nombreJunto.length() >= 4 && clave.replaceAll("\\s+", "").contains(nombreJunto);
    }
}
