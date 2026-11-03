package com.gestionobra.obra.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.Obra;
import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.usuario.entity.Rol;
import com.gestionobra.usuario.entity.Usuario;
import com.gestionobra.usuario.service.InvitacionService;
import com.gestionobra.usuario.service.UsuarioService;
import com.gestionobra.usuario.service.UsuarioSesion;

/** Registro de colaboradores de una obra y reenvío de invitaciones (HU-01). */
@Service
public class ParticipanteService {

    private final UsuarioService usuarios;
    private final InvitacionService invitaciones;
    private final ObraService obras;

    public ParticipanteService(UsuarioService usuarios, InvitacionService invitaciones, ObraService obras) {
        this.usuarios = usuarios;
        this.invitaciones = invitaciones;
        this.obras = obras;
    }

    @Transactional
    public ObraService.Participante agregar(Long idObra, String email, String nombreCompleto, Rol rol, Rubro rubro,
                                            UsuarioSesion sesion) {
        Obra obra = obras.obraDelArquitecto(idObra, sesion);
        if (!rol.esColaborador()) {
            throw ErrorNegocio.invalido("El participante tiene que ser cuadrilla o especialista.");
        }

        Usuario usuario = usuarios.obtenerOCrear(email, nombreCompleto, rol);
        if (obra.participa(usuario.getId())) {
            throw ErrorNegocio.conflicto("Esa persona ya participa de la obra.");
        }
        obra.agregarColaborador(usuario, rubro);
        if (!usuario.tieneClave()) {
            invitaciones.enviarInvitacion(usuario, obra.getTitulo());
        }
        return ObraService.Participante.de(usuario, rubro);
    }

    /** Envía un enlace nuevo; el anterior deja de servir. */
    @Transactional
    public void reenviarInvitacion(Long idObra, Long idUsuario, UsuarioSesion sesion) {
        Obra obra = obras.obraDelArquitecto(idObra, sesion);
        if (obra.esArquitecto(idUsuario) || !obra.participa(idUsuario)) {
            throw ErrorNegocio.noEncontrado("Esa persona no participa de la obra.");
        }
        Usuario usuario = usuarios.obtener(idUsuario);
        if (usuario.tieneClave()) {
            throw ErrorNegocio.conflicto("Esa persona ya definió su contraseña y puede iniciar sesión.");
        }
        invitaciones.enviarInvitacion(usuario, obra.getTitulo());
    }
}
