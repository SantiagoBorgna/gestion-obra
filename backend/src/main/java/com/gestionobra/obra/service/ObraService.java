package com.gestionobra.obra.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestionobra.comun.ErrorNegocio;
import com.gestionobra.obra.entity.AsignacionColaborador;
import com.gestionobra.obra.entity.EstadoObra;
import com.gestionobra.obra.entity.Obra;
import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.obra.repository.ObraRepository;
import com.gestionobra.usuario.entity.Rol;
import com.gestionobra.usuario.entity.Usuario;
import com.gestionobra.usuario.service.InvitacionService;
import com.gestionobra.usuario.service.UsuarioService;
import com.gestionobra.usuario.service.UsuarioSesion;

/** Alta y consulta de obras (HU-01). Cada usuario solo ve las obras en las que participa. */
@Service
public class ObraService {

    public record ObraResumen(Long id, String titulo, String ubicacion, LocalDate fechaInicio, EstadoObra estado,
                              String cliente) {

        static ObraResumen de(Obra obra) {
            return new ObraResumen(obra.getId(), obra.getTitulo(), obra.getUbicacion(), obra.getFechaInicio(),
                obra.getEstado(), obra.getCliente().getNombreCompleto());
        }
    }

    /** Participante de la obra; invitacionPendiente indica que todavía no definió su contraseña. */
    public record Participante(Long id, String nombreCompleto, String email, Rol rol, Rubro rubro,
                               boolean invitacionPendiente) {

        static Participante de(Usuario usuario, Rubro rubro) {
            return new Participante(usuario.getId(), usuario.getNombreCompleto(), usuario.getEmail(),
                usuario.getRol(), rubro, !usuario.tieneClave());
        }
    }

    public record ObraDetalle(Long id, String titulo, String descripcion, String ubicacion, LocalDate fechaInicio,
                              LocalDate fechaFin, EstadoObra estado, String arquitecto, boolean esArquitecto,
                              List<Participante> participantes) {
    }

    private final ObraRepository obras;
    private final UsuarioService usuarios;
    private final InvitacionService invitaciones;

    public ObraService(ObraRepository obras, UsuarioService usuarios, InvitacionService invitaciones) {
        this.obras = obras;
        this.usuarios = usuarios;
        this.invitaciones = invitaciones;
    }

    @Transactional
    public ObraDetalle crear(String titulo, String descripcion, String ubicacion, LocalDate fechaInicio,
                             String emailCliente, String nombreCliente, UsuarioSesion sesion) {
        if (!sesion.esArquitecto()) {
            throw ErrorNegocio.prohibido("Solo el arquitecto puede dar de alta obras.");
        }
        Usuario arquitecto = usuarios.obtener(sesion.id());
        Usuario cliente = usuarios.obtenerOCrear(emailCliente, nombreCliente, Rol.CLIENTE);

        Obra obra = obras.save(new Obra(titulo.trim(), descripcion.trim(), ubicacion.trim(), fechaInicio,
            arquitecto, cliente));
        if (!cliente.tieneClave()) {
            invitaciones.enviarInvitacion(cliente, obra.getTitulo());
        }
        return detalle(obra, sesion);
    }

    @Transactional(readOnly = true)
    public List<ObraResumen> listar(UsuarioSesion sesion) {
        return obras.findDeUsuario(sesion.id()).stream().map(ObraResumen::de).toList();
    }

    @Transactional(readOnly = true)
    public ObraDetalle consultar(Long idObra, UsuarioSesion sesion) {
        return detalle(obraAccesible(idObra, sesion), sesion);
    }

    /** Obra en la que participa el usuario. Si no participa, se responde como si no existiera. */
    public Obra obraAccesible(Long idObra, UsuarioSesion sesion) {
        return obras.findById(idObra)
            .filter(obra -> obra.participa(sesion.id()))
            .orElseThrow(() -> ErrorNegocio.noEncontrado("No se encontró la obra."));
    }

    /** Obra a cargo del usuario, para las acciones que solo puede hacer su arquitecto. */
    public Obra obraDelArquitecto(Long idObra, UsuarioSesion sesion) {
        Obra obra = obraAccesible(idObra, sesion);
        if (!obra.esArquitecto(sesion.id())) {
            throw ErrorNegocio.prohibido("Solo el arquitecto de la obra puede hacer esto.");
        }
        return obra;
    }

    private ObraDetalle detalle(Obra obra, UsuarioSesion sesion) {
        List<Participante> lista = new ArrayList<>();
        lista.add(Participante.de(obra.getCliente(), null));
        for (AsignacionColaborador asignacion : obra.getAsignaciones()) {
            lista.add(Participante.de(asignacion.getColaborador(), asignacion.getRubro()));
        }
        return new ObraDetalle(obra.getId(), obra.getTitulo(), obra.getDescripcion(), obra.getUbicacion(),
            obra.getFechaInicio(), obra.getFechaFin(), obra.getEstado(), obra.getArquitecto().getNombreCompleto(),
            obra.esArquitecto(sesion.id()), lista);
    }
}
