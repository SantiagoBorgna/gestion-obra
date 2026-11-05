package com.gestionobra.presupuesto.controller;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.presupuesto.service.TareaService;
import com.gestionobra.usuario.service.UsuarioSesion;

@RestController
@RequestMapping("/api/obras/{idObra}/tareas")
public class TareaController {

    public record TareaRequest(
        @NotBlank(message = "Ingresá la descripción de la tarea.")
        @Size(max = 500, message = "La descripción puede tener como máximo 500 caracteres.") String descripcion,
        @NotNull(message = "Elegí el rubro de la tarea.") Rubro rubro) {
    }

    public record CostoRequest(
        @NotNull(message = "Falta indicar la tarea.") Long idTarea,
        @NotNull(message = "Ingresá el costo.")
        @DecimalMin(value = "0.01", message = "El costo tiene que ser mayor a cero.")
        @Digits(integer = 12, fraction = 2, message = "El costo admite hasta 12 enteros y 2 decimales.")
        BigDecimal monto) {
    }

    public record EstimacionRequest(
        @NotEmpty(message = "Cargá al menos un costo.") List<@Valid CostoRequest> costos) {
    }

    private final TareaService tareas;

    public TareaController(TareaService tareas) {
        this.tareas = tareas;
    }

    @GetMapping
    public List<TareaService.TareaVista> listar(@PathVariable Long idObra,
                                                @AuthenticationPrincipal UsuarioSesion sesion) {
        return tareas.listar(idObra, sesion);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TareaService.TareaVista crear(@PathVariable Long idObra, @Valid @RequestBody TareaRequest datos,
                                         @AuthenticationPrincipal UsuarioSesion sesion) {
        return tareas.crear(idObra, datos.descripcion(), datos.rubro(), sesion);
    }

    @PutMapping("/{idTarea}")
    public TareaService.TareaVista modificar(@PathVariable Long idObra, @PathVariable Long idTarea,
                                             @Valid @RequestBody TareaRequest datos,
                                             @AuthenticationPrincipal UsuarioSesion sesion) {
        return tareas.modificar(idObra, idTarea, datos.descripcion(), datos.rubro(), sesion);
    }

    @DeleteMapping("/{idTarea}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idObra, @PathVariable Long idTarea,
                                         @AuthenticationPrincipal UsuarioSesion sesion) {
        tareas.eliminar(idObra, idTarea, sesion);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/costos")
    public List<TareaService.TareaVista> guardarEstimacion(@PathVariable Long idObra,
                                                           @Valid @RequestBody EstimacionRequest datos,
                                                           @AuthenticationPrincipal UsuarioSesion sesion) {
        List<TareaService.CostoTarea> costos = datos.costos().stream()
            .map(costo -> new TareaService.CostoTarea(costo.idTarea(), costo.monto()))
            .toList();
        return tareas.guardarEstimacion(idObra, costos, sesion);
    }
}
