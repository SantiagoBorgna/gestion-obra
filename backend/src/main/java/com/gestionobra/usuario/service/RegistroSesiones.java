package com.gestionobra.usuario.service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;

import org.springframework.stereotype.Component;

/** Recuerda las sesiones abiertas de cada usuario, para cerrarlas todas cuando cambia su contraseña. */
@Component
public class RegistroSesiones implements HttpSessionListener {

    private final Map<Long, Set<HttpSession>> sesionesPorUsuario = new ConcurrentHashMap<>();

    public void registrar(Long idUsuario, HttpSession sesion) {
        sesionesPorUsuario.computeIfAbsent(idUsuario, id -> ConcurrentHashMap.newKeySet()).add(sesion);
    }

    public void cerrarSesiones(Long idUsuario) {
        Set<HttpSession> sesiones = sesionesPorUsuario.remove(idUsuario);
        if (sesiones == null) {
            return;
        }
        for (HttpSession sesion : sesiones) {
            try {
                sesion.invalidate();
            } catch (IllegalStateException yaCerrada) {
                // Venció entre que se leyó el registro y este cierre: no hay nada que hacer.
            }
        }
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent evento) {
        sesionesPorUsuario.values().forEach(sesiones -> sesiones.remove(evento.getSession()));
    }
}
