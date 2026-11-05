package com.gestionobra.alerta.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gestionobra.alerta.entity.Alerta;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    /** Alertas de los rubros de la obra y alertas generales, de la más nueva a la más vieja. */
    @Query("""
        select a from Alerta a
        left join a.item i
        left join i.presupuesto p
        where a.obra.id = :idObra or p.obra.id = :idObra
        order by a.fecha desc, a.id desc
        """)
    List<Alerta> findDeObra(@Param("idObra") Long idObra);

    boolean existsByItemIdAndResueltaFalse(Long idItem);

    boolean existsByObraIdAndResueltaFalse(Long idObra);

    Optional<Alerta> findFirstByItemIdAndResueltaTrueOrderByIdDesc(Long idItem);

    Optional<Alerta> findFirstByObraIdAndResueltaTrueOrderByIdDesc(Long idObra);
}
