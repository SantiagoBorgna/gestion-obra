package com.gestionobra.obra.controller;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.obra.service.ObraService;
import com.gestionobra.obra.service.ParticipanteService;
import com.gestionobra.usuario.entity.Rol;
import com.gestionobra.usuario.service.UsuarioSesion;

@RestController
@RequestMapping("/api/obras")
public class ObraController {

    public record CrearObraRequest(
        @NotBlank(message = "Ingresá el título de la obra.")
        @Size(max = 150, message = "El título puede tener como máximo 150 caracteres.") String titulo,
        @NotBlank(message = "Ingresá la ubicación de la obra.")
        @Size(max = 200, message = "La ubicación puede tener como máximo 200 caracteres.") String ubicacion,
        @NotNull(message = "Ingresá la fecha de inicio.") LocalDate fechaInicio,
        @NotBlank(message = "Ingresá la descripción de la obra.")
        @Size(max = 1000, message = "La descripción puede tener como máximo 1000 caracteres.") String descripcion,
        @NotBlank(message = "Ingresá el nombre del cliente.")
        @Size(max = 120, message = "El nombre puede tener como máximo 120 caracteres.") String nombreCliente,
        @NotBlank(message = "Ingresá el correo del cliente.")
        @Email(message = "El correo del cliente no es válido.") String emailCliente) {
    }

    public record ParticipanteRequest(
        @NotBlank(message = "Ingresá el nombre del participante.")
        @Size(max = 120, message = "El nombre puede tener como máximo 120 caracteres.") String nombreCompleto,
        @NotBlank(message = "Ingresá el correo del participante.")
        @Email(message = "El correo del participante no es válido.") String email,
        @NotNull(message = "Elegí el rol del participante.") Rol rol,
        @NotNull(message = "Elegí el rubro del participante.") Rubro rubro) {
    }

    private final ObraService obras;
    private final ParticipanteService participantes;

    public ObraController(ObraService obras, ParticipanteService participantes) {
        this.obras = obras;
        this.participantes = participantes;
    }

    @GetMapping
    public List<ObraService.ObraResumen> listar(@AuthenticationPrincipal UsuarioSesion sesion) {
        return obras.listar(sesion);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ObraService.ObraDetalle crear(@Valid @RequestBody CrearObraRequest datos,
                                         @AuthenticationPrincipal UsuarioSesion sesion) {
        return obras.crear(datos.titulo(), datos.descripcion(), datos.ubicacion(), datos.fechaInicio(),
            datos.emailCliente(), datos.nombreCliente(), sesion);
    }

    @GetMapping("/{idObra}")
    public ObraService.ObraDetalle consultar(@PathVariable Long idObra,
                                             @AuthenticationPrincipal UsuarioSesion sesion) {
        return obras.consultar(idObra, sesion);
    }

    @PostMapping("/{idObra}/participantes")
    @ResponseStatus(HttpStatus.CREATED)
    public ObraService.Participante agregarParticipante(@PathVariable Long idObra,
                                                        @Valid @RequestBody ParticipanteRequest datos,
                                                        @AuthenticationPrincipal UsuarioSesion sesion) {
        return participantes.agregar(idObra, datos.email(), datos.nombreCompleto(), datos.rol(), datos.rubro(),
            sesion);
    }

    @PostMapping("/{idObra}/participantes/{idUsuario}/reenviar-invitacion")
    public ResponseEntity<Void> reenviarInvitacion(@PathVariable Long idObra, @PathVariable Long idUsuario,
                                                   @AuthenticationPrincipal UsuarioSesion sesion) {
        participantes.reenviarInvitacion(idObra, idUsuario, sesion);
        return ResponseEntity.noContent().build();
    }
}
