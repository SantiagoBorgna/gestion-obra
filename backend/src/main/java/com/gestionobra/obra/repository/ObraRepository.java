package com.gestionobra.obra.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gestionobra.obra.entity.Obra;

public interface ObraRepository extends JpaRepository<Obra, Long> {

    /** Obras en las que el usuario participa como arquitecto, cliente o colaborador. */
    @Query("""
        select distinct o from Obra o
        left join o.asignaciones a
        where o.arquitecto.id = :idUsuario
           or o.cliente.id = :idUsuario
           or a.colaborador.id = :idUsuario
        order by o.fechaInicio desc, o.id desc
        """)
    List<Obra> findDeUsuario(@Param("idUsuario") Long idUsuario);
}
