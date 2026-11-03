package com.gestionobra.usuario.service;

import java.io.Serializable;

import com.gestionobra.usuario.entity.Rol;
import com.gestionobra.usuario.entity.Usuario;

/** Datos del usuario que se guardan en la sesión una vez que inició sesión. */
public record UsuarioSesion(Long id, String email, String nombreCompleto, Rol rol) implements Serializable {

    public static UsuarioSesion de(Usuario usuario) {
        return new UsuarioSesion(usuario.getId(), usuario.getEmail(), usuario.getNombreCompleto(), usuario.getRol());
    }

    public boolean esArquitecto() {
        return rol == Rol.ARQUITECTO;
    }
}
