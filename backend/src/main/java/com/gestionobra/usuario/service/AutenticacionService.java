package com.gestionobra.usuario.service;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.usuario.entity.Usuario;
import com.gestionobra.usuario.repository.UsuarioRepository;

/** Verificación de credenciales con espera progresiva y bloqueo (HU-03). */
@Service
public class AutenticacionService {

    static final String MENSAJE_CREDENCIALES = "Correo o contraseña incorrectos.";
    static final String MENSAJE_BLOQUEO =
        "La cuenta está bloqueada por demasiados intentos fallidos. Recuperá tu contraseña para desbloquearla.";

    /**
     * Hash de una contraseña cualquiera. Cuando el correo no existe se compara igual contra
     * este hash, para que la respuesta tarde lo mismo y no revele qué correos están registrados.
     */
    private final String hashFicticio;

    private final UsuarioRepository usuarios;
    private final PasswordEncoder codificador;

    public AutenticacionService(UsuarioRepository usuarios, PasswordEncoder codificador) {
        this.usuarios = usuarios;
        this.codificador = codificador;
        this.hashFicticio = codificador.encode("clave-ficticia-para-igualar-tiempos");
    }

    /**
     * Devuelve el usuario si las credenciales son correctas. Los intentos fallidos se
     * guardan aunque se lance el error, por eso no se revierte la transacción.
     */
    @Transactional(noRollbackFor = ErrorNegocio.class)
    public UsuarioSesion autenticar(String email, String clave) {
        Usuario usuario = usuarios.findByEmail(normalizarEmail(email)).orElse(null);

        if (usuario == null || !usuario.getActivo() || !usuario.tieneClave()) {
            codificador.matches(clave, hashFicticio);
            throw credencialesIncorrectas();
        }
        if (usuario.getBloqueado()) {
            throw new ErrorNegocio(HttpStatus.LOCKED, MENSAJE_BLOQUEO);
        }

        LocalDateTime ahora = LocalDateTime.now();
        long espera = usuario.segundosDeEspera(ahora);
        if (espera > 0) {
            throw new ErrorNegocio(HttpStatus.TOO_MANY_REQUESTS,
                "Demasiados intentos fallidos. Esperá " + espera + " segundos antes de volver a intentar.");
        }

        if (!usuario.validarCredenciales(clave, codificador)) {
            usuario.registrarIntentoFallido(ahora);
            if (usuario.getBloqueado()) {
                throw new ErrorNegocio(HttpStatus.LOCKED, MENSAJE_BLOQUEO);
            }
            throw credencialesIncorrectas();
        }

        usuario.reiniciarIntentos();
        return UsuarioSesion.de(usuario);
    }

    public static String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static ErrorNegocio credencialesIncorrectas() {
        return new ErrorNegocio(HttpStatus.UNAUTHORIZED, MENSAJE_CREDENCIALES);
    }
}
