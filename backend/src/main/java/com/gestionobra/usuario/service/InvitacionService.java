package com.gestionobra.usuario.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestionobra.comun.CorreoService;
import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.usuario.entity.Usuario;
import com.gestionobra.usuario.repository.UsuarioRepository;

/**
 * Enlaces de un solo uso para definir la contraseña: la invitación a un participante
 * nuevo (vence a los 7 días) y la recuperación de contraseña (vence en 1 hora).
 * Cada usuario tiene un solo enlace vigente, así que generar uno nuevo invalida el anterior.
 */
@Service
public class InvitacionService {

    public record DatosEnlace(String nombreCompleto, String email) {
    }

    private static final Duration VIGENCIA_INVITACION = Duration.ofDays(7);
    private static final Duration VIGENCIA_RECUPERACION = Duration.ofHours(1);
    private static final String MENSAJE_ENLACE_INVALIDO =
        "El enlace no es válido o ya venció. Pedí uno nuevo.";

    private final SecureRandom aleatorio = new SecureRandom();
    private final UsuarioRepository usuarios;
    private final CorreoService correo;
    private final ValidadorClave validador;
    private final PasswordEncoder codificador;
    private final String urlApp;

    public InvitacionService(UsuarioRepository usuarios, CorreoService correo, ValidadorClave validador,
                             PasswordEncoder codificador, @Value("${app.url}") String urlApp) {
        this.usuarios = usuarios;
        this.correo = correo;
        this.validador = validador;
        this.codificador = codificador;
        this.urlApp = urlApp;
    }

    /** Genera un enlace nuevo y envía la invitación. Se llama dentro de la transacción del alta. */
    public void enviarInvitacion(Usuario usuario, String tituloObra) {
        String token = generarToken(usuario, VIGENCIA_INVITACION);
        correo.enviar(usuario.getEmail(), "Te invitaron a la obra " + tituloObra, """
            Hola %s:

            Te sumaron como participante de la obra "%s" en Gestión de Obra.
            Para empezar, definí tu contraseña desde este enlace:

            %s

            El enlace se puede usar una sola vez y vence en 7 días.
            """.formatted(usuario.getNombreCompleto(), tituloObra, enlace(token)));
    }

    @Transactional
    public void enviarRecuperacion(String email) {
        usuarios.findByEmail(AutenticacionService.normalizarEmail(email))
            .filter(Usuario::getActivo)
            .ifPresent(usuario -> {
                String token = generarToken(usuario, VIGENCIA_RECUPERACION);
                correo.enviar(usuario.getEmail(), "Recuperación de contraseña", """
                    Hola %s:

                    Recibimos un pedido para recuperar tu contraseña de Gestión de Obra.
                    Podés definir una nueva desde este enlace:

                    %s

                    El enlace se puede usar una sola vez y vence en 1 hora.
                    Si no fuiste vos, ignorá este correo.
                    """.formatted(usuario.getNombreCompleto(), enlace(token)));
            });
    }

    @Transactional(readOnly = true)
    public DatosEnlace consultarEnlace(String token) {
        Usuario usuario = usuarioDelToken(token);
        return new DatosEnlace(usuario.getNombreCompleto(), usuario.getEmail());
    }

    @Transactional
    public void definirClave(String token, String clave) {
        Usuario usuario = usuarioDelToken(token);
        validador.validar(clave, usuario);
        usuario.cambiarClave(codificador.encode(clave));
    }

    private Usuario usuarioDelToken(String token) {
        return usuarios.findByTokenHash(hash(token))
            .filter(u -> u.getActivo() && u.tokenVigente(LocalDateTime.now()))
            .orElseThrow(() -> ErrorNegocio.invalido(MENSAJE_ENLACE_INVALIDO));
    }

    private String generarToken(Usuario usuario, Duration vigencia) {
        byte[] bytes = new byte[32];
        aleatorio.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        usuario.asignarToken(hash(token), LocalDateTime.now().plus(vigencia));
        return token;
    }

    private String enlace(String token) {
        return urlApp + "/definir-clave?token=" + token;
    }

    private static String hash(String token) {
        try {
            byte[] resumen = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(resumen);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
