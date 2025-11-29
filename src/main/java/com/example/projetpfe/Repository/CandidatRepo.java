package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Candidature;
import com.example.projetpfe.entity.Offre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatRepo extends JpaRepository<Candidat,Integer> {

    @Query("SELECT c FROM Candidat c WHERE LOWER(c.prenom) = LOWER(:prenom) AND LOWER(c.nom) = LOWER(:nom)")
    List<Candidat> findByNomEtPrenom(@Param("prenom") String prenom, @Param("nom") String nom);

    Optional<Candidat> findByNomAndPrenom(String nom, String prenom);
    Optional<Candidat> findByKeycloakId(String keycloakId);
    Candidat findByEmail(String email);


    @Query("SELECT c FROM Candidature c WHERE c.candidat.email = :email AND c.offre.idOffre = :offreId")
    Candidature findByCandidatEmailAndOffreId(@Param("email") String email, @Param("offreId") Integer offreId);
    @Query("SELECT c FROM Candidat c WHERE " +
            "LOWER(c.nom) LIKE LOWER(CONCAT('%', :search1, '%')) OR " +
            "LOWER(c.prenom) LIKE LOWER(CONCAT('%', :search1, '%')) OR " +
            "LOWER(c.nom) LIKE LOWER(CONCAT('%', :search2, '%')) OR " +
            "LOWER(c.prenom) LIKE LOWER(CONCAT('%', :search2, '%'))")
    List<Candidat> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(
            @Param("search1") String search1,
            @Param("search2") String search2
    );
}
