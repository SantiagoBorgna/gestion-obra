package com.gestionobra.usuario.entity;

import java.time.Duration;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.springframework.security.crypto.password.PasswordEncoder;

@Entity
@Table(name = "usuario")
public class Usuario {

    /** A partir de este intento fallido se exige una espera antes de volver a probar. */
    public static final int INTENTOS_ANTES_DE_ESPERA = 3;
    /** Al llegar a este intento fallido la cuenta se bloquea hasta recuperar la contraseña. */
    public static final int INTENTOS_ANTES_DE_BLOQUEO = 5;
    private static final long SEGUNDOS_ESPERA_INICIAL = 30;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long id;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    private String dni;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol rol;

    private String clave;

    @Column(nullable = false, unique = true)
    private String email;

    private String telefono;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "intentos_fallidos", nullable = false)
    private Integer intentosFallidos = 0;

    @Column(name = "ultimo_intento_fallido")
    private LocalDateTime ultimoIntentoFallido;

    @Column(nullable = false)
    private Boolean bloqueado = false;

    @Column(name = "token_hash")
    private String tokenHash;

    @Column(name = "token_vence")
    private LocalDateTime tokenVence;

    protected Usuario() {
    }

    public Usuario(String nombreCompleto, String email, Rol rol) {
        this.nombreCompleto = nombreCompleto;
        this.email = email;
        this.rol = rol;
    }

    public boolean validarCredenciales(String claveIngresada, PasswordEncoder codificador) {
        return clave != null && codificador.matches(claveIngresada, clave);
    }

    /** Guarda el hash de la nueva contraseña, invalida el enlace usado y desbloquea la cuenta. */
    public void cambiarClave(String hashNuevaClave) {
        this.clave = hashNuevaClave;
        this.tokenHash = null;
        this.tokenVence = null;
        reiniciarIntentos();
    }

    public void desactivar() {
        this.activo = false;
    }

    /** Indica si ya definió su contraseña (es decir, si aceptó la invitación). */
    public boolean tieneClave() {
        return clave != null;
    }

    public void registrarIntentoFallido(LocalDateTime ahora) {
        intentosFallidos++;
        ultimoIntentoFallido = ahora;
        if (intentosFallidos >= INTENTOS_ANTES_DE_BLOQUEO) {
            bloqueado = true;
        }
    }

    public void reiniciarIntentos() {
        intentosFallidos = 0;
        ultimoIntentoFallido = null;
        bloqueado = false;
    }

    /**
     * Segundos que faltan para poder volver a intentar. La espera arranca en 30 s
     * después del 3.er intento fallido y se duplica con cada fallo siguiente.
     */
    public long segundosDeEspera(LocalDateTime ahora) {
        if (intentosFallidos < INTENTOS_ANTES_DE_ESPERA || ultimoIntentoFallido == null) {
            return 0;
        }
        long espera = SEGUNDOS_ESPERA_INICIAL << (intentosFallidos - INTENTOS_ANTES_DE_ESPERA);
        long transcurridos = Duration.between(ultimoIntentoFallido, ahora).getSeconds();
        return Math.max(0, espera - transcurridos);
    }

    /** Asocia un nuevo enlace para definir la contraseña; el anterior deja de ser válido. */
    public void asignarToken(String tokenHash, LocalDateTime vence) {
        this.tokenHash = tokenHash;
        this.tokenVence = vence;
    }

    public boolean tokenVigente(LocalDateTime ahora) {
        return tokenHash != null && tokenVence != null && tokenVence.isAfter(ahora);
    }

    public Long getId() {
        return id;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public String getDni() {
        return dni;
    }

    public Rol getRol() {
        return rol;
    }

    public String getEmail() {
        return email;
    }

    public String getTelefono() {
        return telefono;
    }

    public Boolean getActivo() {
        return activo;
    }

    public Boolean getBloqueado() {
        return bloqueado;
    }

    public Integer getIntentosFallidos() {
        return intentosFallidos;
    }
}
