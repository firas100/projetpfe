package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Offre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OffreRepo extends JpaRepository<Offre,Integer> {
    List<Offre> findAllByEnableTrue();
}
