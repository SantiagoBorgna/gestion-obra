package com.gestionobra.usuario.controller;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gestionobra.usuario.service.AutenticacionService;
import com.gestionobra.usuario.service.InvitacionService;
import com.gestionobra.usuario.service.UsuarioSesion;

@RestController
@RequestMapping("/api/auth")
public class AutenticacionController {

    public record LoginRequest(
        @NotBlank(message = "Ingresá tu correo.") String email,
        @NotBlank(message = "Ingresá tu contraseña.") String clave) {
    }

    public record RecuperarRequest(@NotBlank(message = "Ingresá tu correo.") String email) {
    }

    private final AutenticacionService autenticacion;
    private final InvitacionService invitaciones;
    private final SecurityContextRepository repositorioContexto;

    public AutenticacionController(AutenticacionService autenticacion, InvitacionService invitaciones,
                                   SecurityContextRepository repositorioContexto) {
        this.autenticacion = autenticacion;
        this.invitaciones = invitaciones;
        this.repositorioContexto = repositorioContexto;
    }

    @PostMapping("/login")
    public UsuarioSesion login(@Valid @RequestBody LoginRequest datos,
                               HttpServletRequest request, HttpServletResponse response) {
        UsuarioSesion usuario = autenticacion.autenticar(datos.email(), datos.clave());

        // Se cambia el identificador de sesión al iniciar sesión para evitar la fijación de sesión.
        request.getSession(true);
        request.changeSessionId();

        var autenticado = UsernamePasswordAuthenticationToken.authenticated(
            usuario, null, List.of(new SimpleGrantedAuthority("ROLE_" + usuario.rol())));
        SecurityContext contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(autenticado);
        SecurityContextHolder.setContext(contexto);
        repositorioContexto.saveContext(contexto, request, response);

        return usuario;
    }

    @GetMapping("/yo")
    public UsuarioSesion yo(@AuthenticationPrincipal UsuarioSesion usuario) {
        return usuario;
    }

    /** Siempre responde lo mismo, exista o no el correo, para no revelar qué cuentas hay. */
    @PostMapping("/recuperar")
    public ResponseEntity<Void> recuperar(@Valid @RequestBody RecuperarRequest datos) {
        invitaciones.enviarRecuperacion(datos.email());
        return ResponseEntity.noContent().build();
    }
}
