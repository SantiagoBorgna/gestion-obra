package com.gestionobra.pago.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gestionobra.pago.entity.Pago;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    @Query("select p from Pago p where p.obra.id = :idObra order by p.fecha desc, p.id desc")
    List<Pago> findCobrosDeObra(@Param("idObra") Long idObra);

    @Query("select p from Pago p where p.item.presupuesto.id = :idPresupuesto order by p.fecha desc, p.id desc")
    List<Pago> findEgresosDePresupuesto(@Param("idPresupuesto") Long idPresupuesto);
}
