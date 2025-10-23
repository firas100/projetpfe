package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecommendationRepo extends JpaRepository<Recommendation, Integer> {
    Optional<Recommendation> findTopByOrderBySimilarityScoreDesc();
    List<Recommendation> findBySimilarityScoreGreaterThan(Double score);

    //List<Recommendation>findOffreByIdOffre(Integer idOffre);
    List<Recommendation> findByOffre_IdOffre(Integer idOffre);


    Optional<Recommendation> findByCandidatAndOffre(Candidat candidat, Offre offre);

    List<Recommendation> findByCandidat(Candidat candidat);

    boolean existsByCandidatAndOffreAndSimilarityScoreGreaterThanEqual(Candidat candidat, Offre offre, double minScore);


}
