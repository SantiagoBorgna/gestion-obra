package com.gestionobra.usuario.service;

import org.springframework.stereotype.Service;

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.usuario.entity.Rol;
import com.gestionobra.usuario.entity.Usuario;
import com.gestionobra.usuario.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarios;

    public UsuarioService(UsuarioRepository usuarios) {
        this.usuarios = usuarios;
    }

    public Usuario obtener(Long idUsuario) {
        return usuarios.findById(idUsuario)
            .orElseThrow(() -> ErrorNegocio.noEncontrado("No se encontró el usuario."));
    }

    /**
     * El correo identifica al usuario: si ya existe se reutiliza sin crear otro,
     * siempre que tenga el mismo rol; si no existe, se crea sin contraseña.
     */
    public Usuario obtenerOCrear(String email, String nombreCompleto, Rol rol) {
        String emailNormalizado = AutenticacionService.normalizarEmail(email);
        return usuarios.findByEmail(emailNormalizado)
            .map(existente -> {
                if (existente.getRol() != rol) {
                    throw ErrorNegocio.conflicto("Ya hay un usuario con ese correo registrado como "
                        + existente.getRol().name().toLowerCase() + ".");
                }
                return existente;
            })
            .orElseGet(() -> usuarios.save(new Usuario(nombreCompleto.trim(), emailNormalizado, rol)));
    }
}
