package com.gestionobra.alerta.controller;

import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.gestionobra.alerta.service.AlertaService;
import com.gestionobra.alerta.service.ComparacionService;
import com.gestionobra.usuario.service.UsuarioSesion;

/** Todo lo de este controlador es solo para el arquitecto de la obra. */
@RestController
public class AlertaController {

    public record UmbralRequest(
        @NotNull(message = "Ingresá el umbral.")
        @DecimalMin(value = "0.01", message = "El umbral tiene que ser mayor a cero.")
        @DecimalMax(value = "999.99", message = "El umbral puede ser como máximo 999,99 %.")
        @Digits(integer = 3, fraction = 2, message = "El umbral admite hasta 2 decimales.")
        BigDecimal umbral) {
    }

    private final ComparacionService comparacion;
    private final AlertaService alertas;

    public AlertaController(ComparacionService comparacion, AlertaService alertas) {
        this.comparacion = comparacion;
        this.alertas = alertas;
    }

    @GetMapping("/api/obras/{idObra}/comparacion")
    public ComparacionService.ComparacionVista comparacion(@PathVariable Long idObra,
                                                           @AuthenticationPrincipal UsuarioSesion sesion) {
        return comparacion.consultar(idObra, sesion);
    }

    @GetMapping("/api/obras/{idObra}/alertas")
    public AlertaService.AlertasVista alertas(@PathVariable Long idObra,
                                              @AuthenticationPrincipal UsuarioSesion sesion) {
        return alertas.consultar(idObra, sesion);
    }

    @PutMapping("/api/obras/{idObra}/alertas/umbral")
    public AlertaService.AlertasVista cambiarUmbral(@PathVariable Long idObra,
                                                    @Valid @RequestBody UmbralRequest datos,
                                                    @AuthenticationPrincipal UsuarioSesion sesion) {
        return alertas.cambiarUmbral(idObra, datos.umbral(), sesion);
    }

    @PostMapping("/api/obras/{idObra}/alertas/{idAlerta}/resolver")
    public AlertaService.AlertasVista resolver(@PathVariable Long idObra, @PathVariable Long idAlerta,
                                               @AuthenticationPrincipal UsuarioSesion sesion) {
        return alertas.resolver(idObra, idAlerta, sesion);
    }
}
