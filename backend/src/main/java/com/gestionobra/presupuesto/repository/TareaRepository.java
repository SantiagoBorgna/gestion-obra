package com.gestionobra.presupuesto.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gestionobra.obra.entity.Rubro;
import com.gestionobra.presupuesto.entity.Tarea;

public interface TareaRepository extends JpaRepository<Tarea, Long> {

    List<Tarea> findByObraIdOrderById(Long idObra);

    List<Tarea> findByObraIdAndRubroOrderById(Long idObra, Rubro rubro);

    Optional<Tarea> findByIdAndObraId(Long id, Long idObra);
}
