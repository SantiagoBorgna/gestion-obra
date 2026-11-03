package com.gestionobra.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.gestionobra.usuario.entity.Rol;
import com.gestionobra.usuario.entity.Usuario;
import com.gestionobra.usuario.repository.UsuarioRepository;

/**
 * Crea la cuenta del arquitecto al arrancar si la base está vacía. No hay registro
 * público: el arquitecto es el dueño del sistema y da de alta al resto de los usuarios.
 */
@Component
public class InicializadorDatos implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(InicializadorDatos.class);

    private final UsuarioRepository usuarios;
    private final PasswordEncoder codificador;
    private final String nombre;
    private final String email;
    private final String clave;

    public InicializadorDatos(UsuarioRepository usuarios, PasswordEncoder codificador,
                              @Value("${app.arquitecto.nombre}") String nombre,
                              @Value("${app.arquitecto.email}") String email,
                              @Value("${app.arquitecto.clave}") String clave) {
        this.usuarios = usuarios;
        this.codificador = codificador;
        this.nombre = nombre;
        this.email = email;
        this.clave = clave;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarios.count() > 0) {
            return;
        }
        Usuario arquitecto = new Usuario(nombre, email.trim().toLowerCase(), Rol.ARQUITECTO);
        arquitecto.cambiarClave(codificador.encode(clave));
        usuarios.save(arquitecto);
        log.info("Se creó la cuenta del arquitecto: {}", arquitecto.getEmail());
    }
}
