package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecommendationRepo extends JpaRepository<Recommendation, Integer> {
    @Query("SELECT r FROM Recommendation r WHERE r.candidat = :candidat")
    Optional<Recommendation> findByCandidat(@Param("candidat") Candidat candidat);

    Optional<Recommendation> findTopByOrderBySimilarityScoreDesc();
    List<Recommendation> findBySimilarityScoreGreaterThan(Double score);
}
