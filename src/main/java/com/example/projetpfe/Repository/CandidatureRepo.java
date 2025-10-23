package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Candidature;
import com.example.projetpfe.entity.Offre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CandidatureRepo extends JpaRepository<Candidature,Integer> {
    List<Candidature> findByCandidat(Candidat candidat);
    List<Candidature> findByOffre(Offre offre);
    Candidature findByCandidatAndOffre(Candidat candidat, Offre offre);

    @Query("SELECT c FROM Candidature c WHERE c.candidat.id_candidature = :idCandidat")
    List<Candidature> findByCandidatId(@Param("idCandidat") Integer idCandidat);

    @Query("SELECT c FROM Candidature c WHERE c.candidat.email = :email AND c.offre.idOffre = :offreId")
    Candidature findByCandidatEmailAndOffreId(@Param("email") String email, @Param("offreId") Integer offreId);
}
