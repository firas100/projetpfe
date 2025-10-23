package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PreInterviewRepo extends JpaRepository<PreInterview,Integer> {
    List<PreInterview> findByNomAndPrenom(String nom, String prenom);
    List<PreInterview> findByCandidat(Candidat candidat);

    PreInterview findByCandidature(Candidature candidature);
    PreInterview findTopByCandidatOrderByDateEnregistrementDesc(Candidat candidat);

    @Query("SELECT p FROM PreInterview p WHERE p.candidat.id_candidature = :idCandidat")
    List<PreInterview> findByCandidatId(@Param("idCandidat") Integer idCandidat);

    @Query("SELECT p FROM PreInterview p WHERE p.prenom = :prenom AND p.nom = :nom AND p.candidature.offre.idOffre = :offreId")
    List<PreInterview> findByPrenomAndNomAndOffreId(@Param("prenom") String prenom, @Param("nom") String nom, @Param("offreId") Integer offreId);

    @Query("SELECT p FROM PreInterview p WHERE p.candidat = :candidat AND p.candidature.offre = :offre ORDER BY p.dateEnregistrement DESC")
    PreInterview findTopByCandidatAndCandidatureOffreOrderByDateEnregistrementDesc(@Param("candidat") Candidat candidat, @Param("offre") Offre offre);

    boolean existsByCandidatureAndVideoPathIsNotNull(Candidature candidature);



}