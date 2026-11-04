package com.gestionobra.presupuesto.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gestionobra.presupuesto.entity.Presupuesto;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {

    Optional<Presupuesto> findByObraId(Long idObra);

    boolean existsByObraId(Long idObra);
}
