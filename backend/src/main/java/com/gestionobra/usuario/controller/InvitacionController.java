package com.gestionobra.usuario.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gestionobra.usuario.service.InvitacionService;

/** Enlaces para definir la contraseña, tanto de invitación como de recuperación. */
@RestController
@RequestMapping("/api/invitaciones")
public class InvitacionController {

    public record DefinirClaveRequest(@NotBlank(message = "Ingresá una contraseña.") String clave) {
    }

    private final InvitacionService invitaciones;

    public InvitacionController(InvitacionService invitaciones) {
        this.invitaciones = invitaciones;
    }

    @GetMapping("/{token}")
    public InvitacionService.DatosEnlace consultar(@PathVariable String token) {
        return invitaciones.consultarEnlace(token);
    }

    @PostMapping("/{token}")
    public ResponseEntity<Void> definirClave(@PathVariable String token,
                                             @Valid @RequestBody DefinirClaveRequest datos) {
        invitaciones.definirClave(token, datos.clave());
        return ResponseEntity.noContent().build();
    }
}
