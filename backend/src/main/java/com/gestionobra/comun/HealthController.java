package com.gestionobra.comun;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint de estado: confirma que el backend responde y que la base de datos está accesible.
 */
@RestController
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        String baseDeDatos;
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            baseDeDatos = "ok";
        } catch (Exception e) {
            baseDeDatos = "sin conexión";
        }
        return Map.of("backend", "ok", "baseDeDatos", baseDeDatos);
    }
}
