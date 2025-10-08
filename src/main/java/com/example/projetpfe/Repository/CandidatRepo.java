package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Candidat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatRepo extends JpaRepository<Candidat,Integer> {

    @Query("SELECT c FROM Candidat c WHERE LOWER(c.nom) = LOWER(:nom) AND LOWER(c.prenom) = LOWER(:prenom)")
    List<Candidat> findByNomEtPrenom(@Param("nom") String nom, @Param("prenom") String prenom);

    Optional<Candidat> findByNomAndPrenom(String nom, String prenom);


}
