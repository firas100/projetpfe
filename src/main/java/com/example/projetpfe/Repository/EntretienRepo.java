package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Entretien;
import com.example.projetpfe.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EntretienRepo extends JpaRepository<Entretien,Integer> {
    List<Entretien> findByManagerId(String managerId);

    @Query("SELECT p.candidat FROM PreInterview p WHERE p.finalScore >= :minScore ORDER BY p.finalScore DESC")
    List<Candidat> findCandidatsWithHighScore(@Param("minScore") Double minScore);
}
