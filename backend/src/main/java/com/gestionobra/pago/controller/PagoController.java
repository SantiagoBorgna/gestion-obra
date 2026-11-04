package com.gestionobra.pago.controller;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.gestionobra.pago.entity.TipoPago;
import com.gestionobra.pago.service.PagoService;
import com.gestionobra.usuario.service.UsuarioSesion;

@RestController
@RequestMapping("/api/obras/{idObra}/pagos")
public class PagoController {

    public record RegistrarPagoRequest(
        @NotNull(message = "Indicá si es un cobro o un pago.") TipoPago tipo,
        Long idItem,
        @NotNull(message = "Ingresá la fecha.")
        @PastOrPresent(message = "La fecha no puede ser futura.")
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
        @NotNull(message = "Ingresá el monto.")
        @DecimalMin(value = "0.01", message = "El monto tiene que ser mayor a cero.")
        @Digits(integer = 12, fraction = 2, message = "El monto admite hasta 12 enteros y 2 decimales.")
        BigDecimal monto,
        @NotBlank(message = "Ingresá una descripción.")
        @Size(max = 300, message = "La descripción puede tener como máximo 300 caracteres.") String descripcion) {
    }

    public record AnularRequest(
        @NotBlank(message = "Indicá el motivo de la anulación.")
        @Size(max = 500, message = "El motivo puede tener como máximo 500 caracteres.") String motivo) {
    }

    private final PagoService pagos;

    public PagoController(PagoService pagos) {
        this.pagos = pagos;
    }

    @GetMapping
    public PagoService.MovimientosVista consultar(@PathVariable Long idObra,
                                                  @AuthenticationPrincipal UsuarioSesion sesion) {
        return pagos.consultar(idObra, sesion);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PagoService.PagoVista registrar(@PathVariable Long idObra,
                                           @Valid @ModelAttribute RegistrarPagoRequest datos,
                                           @RequestParam(name = "archivo", required = false) MultipartFile archivo,
                                           @AuthenticationPrincipal UsuarioSesion sesion) {
        return pagos.registrar(idObra, datos.tipo(), datos.idItem(), datos.fecha(), datos.monto(),
            datos.descripcion(), archivo, sesion);
    }

    @PostMapping("/{idPago}/anular")
    public PagoService.PagoVista anular(@PathVariable Long idObra, @PathVariable Long idPago,
                                        @Valid @RequestBody AnularRequest datos,
                                        @AuthenticationPrincipal UsuarioSesion sesion) {
        return pagos.anular(idObra, idPago, datos.motivo(), sesion);
    }

    /** Se abre en el navegador; el tipo sale del contenido real del archivo, no de lo que informó quien lo subió. */
    @GetMapping("/{idPago}/comprobante")
    public ResponseEntity<Resource> comprobante(@PathVariable Long idObra, @PathVariable Long idPago,
                                                @AuthenticationPrincipal UsuarioSesion sesion) {
        PagoService.ArchivoComprobante archivo = pagos.obtenerComprobante(idObra, idPago, sesion);
        ContentDisposition disposicion = ContentDisposition.inline()
            .filename(archivo.nombre(), StandardCharsets.UTF_8)
            .build();
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(archivo.tipoContenido()))
            .header(HttpHeaders.CONTENT_DISPOSITION, disposicion.toString())
            .body(archivo.contenido());
    }
}
