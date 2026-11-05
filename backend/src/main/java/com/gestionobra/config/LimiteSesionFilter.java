package com.gestionobra.config;

import java.io.IOException;
import java.time.Duration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Cierra la sesión cuando alcanza su duración máxima, aunque el usuario siga activo.
 * El vencimiento por inactividad lo controla el contenedor (server.servlet.session.timeout).
 */
public class LimiteSesionFilter extends OncePerRequestFilter {

    private final long limiteEnMilisegundos;

    public LimiteSesionFilter(Duration limite) {
        this.limiteEnMilisegundos = limite.toMillis();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain cadena)
            throws ServletException, IOException {
        HttpSession sesion = request.getSession(false);
        if (sesion != null && System.currentTimeMillis() - sesion.getCreationTime() > limiteEnMilisegundos) {
            sesion.invalidate();
        }
        cadena.doFilter(request, response);
    }
}
