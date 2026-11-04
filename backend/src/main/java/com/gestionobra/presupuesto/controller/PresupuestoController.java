package com.gestionobra.presupuesto.controller;

import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gestionobra.presupuesto.service.PresupuestoService;
import com.gestionobra.presupuesto.service.PresupuestoService.PresupuestoVista;
import com.gestionobra.usuario.service.UsuarioSesion;

@RestController
@RequestMapping("/api/obras/{idObra}/presupuesto")
public class PresupuestoController {

    public record HonorariosRequest(
        @NotNull(message = "Ingresá el monto de los honorarios.")
        @DecimalMin(value = "0.01", message = "Los honorarios tienen que ser mayores a cero.")
        @Digits(integer = 12, fraction = 2, message = "Los honorarios admiten hasta 12 enteros y 2 decimales.")
        BigDecimal monto) {
    }

    public record RechazoRequest(
        @NotBlank(message = "Indicá el motivo del rechazo.")
        @Size(max = 500, message = "El motivo puede tener como máximo 500 caracteres.") String motivo) {
    }

    private final PresupuestoService presupuestos;

    public PresupuestoController(PresupuestoService presupuestos) {
        this.presupuestos = presupuestos;
    }

    /** Responde sin contenido si el presupuesto no existe o el usuario todavía no puede verlo. */
    @GetMapping
    public ResponseEntity<PresupuestoVista> consultar(@PathVariable Long idObra,
                                                      @AuthenticationPrincipal UsuarioSesion sesion) {
        return presupuestos.consultar(idObra, sesion)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/solicitar-costos")
    public PresupuestoVista solicitarCostos(@PathVariable Long idObra, @AuthenticationPrincipal UsuarioSesion sesion) {
        return presupuestos.solicitarCostos(idObra, sesion);
    }

    @PostMapping("/items/{idItem}/confirmar")
    public PresupuestoVista confirmarRubro(@PathVariable Long idObra, @PathVariable Long idItem,
                                           @AuthenticationPrincipal UsuarioSesion sesion) {
        return presupuestos.confirmarRubro(idObra, idItem, sesion);
    }

    @PutMapping("/honorarios")
    public PresupuestoVista cargarHonorarios(@PathVariable Long idObra, @Valid @RequestBody HonorariosRequest datos,
                                             @AuthenticationPrincipal UsuarioSesion sesion) {
        return presupuestos.cargarHonorarios(idObra, datos.monto(), sesion);
    }

    @PostMapping("/consolidar")
    public PresupuestoVista consolidar(@PathVariable Long idObra, @AuthenticationPrincipal UsuarioSesion sesion) {
        return presupuestos.consolidar(idObra, sesion);
    }

    @PostMapping("/presentar")
    public PresupuestoVista presentar(@PathVariable Long idObra, @AuthenticationPrincipal UsuarioSesion sesion) {
        return presupuestos.presentar(idObra, sesion);
    }

    @PostMapping("/volver-a-estimacion")
    public PresupuestoVista volverAEstimacion(@PathVariable Long idObra,
                                              @AuthenticationPrincipal UsuarioSesion sesion) {
        return presupuestos.volverAEstimacion(idObra, sesion);
    }

    @PostMapping("/aprobar")
    public PresupuestoVista aprobar(@PathVariable Long idObra, @AuthenticationPrincipal UsuarioSesion sesion) {
        return presupuestos.aprobar(idObra, sesion);
    }

    @PostMapping("/rechazar")
    public PresupuestoVista rechazar(@PathVariable Long idObra, @Valid @RequestBody RechazoRequest datos,
                                     @AuthenticationPrincipal UsuarioSesion sesion) {
        return presupuestos.rechazar(idObra, datos.motivo(), sesion);
    }
}
