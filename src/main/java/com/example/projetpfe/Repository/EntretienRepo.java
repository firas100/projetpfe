    package com.example.projetpfe.Repository;

    import com.example.projetpfe.entity.Candidat;
    import com.example.projetpfe.entity.Candidature;
    import com.example.projetpfe.entity.Entretien;
    import com.example.projetpfe.entity.Recommendation;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.data.jpa.repository.Query;
    import org.springframework.data.repository.query.Param;

    import java.util.List;
    import java.util.Optional;

    public interface   EntretienRepo extends JpaRepository<Entretien,Integer> {
        List<Entretien> findByManagerId(String managerId);

        @Query("SELECT e FROM Entretien e WHERE e.candidat.id_candidature = :candidatId")
        List<Entretien> findByCandidatIdCandidature(@Param("candidatId") Integer candidatId);
        @Query("SELECT e FROM Entretien e WHERE e.candidature.id = :id")
        List<Entretien> findByCandidatureId(@Param("id") Integer id);
        @Query("SELECT p.candidat FROM PreInterview p WHERE p.finalScore >= :minScore ORDER BY p.finalScore DESC")
        List<Candidat> findCandidatsWithHighScore(@Param("minScore") Double minScore);

        @Query("SELECT p.candidat FROM PreInterview p " +
                "JOIN Candidature c ON p.candidat = c.candidat " +
                "WHERE c.offre.idOffre = :offreId AND p.finalScore >= :minScore " +
                "ORDER BY p.finalScore DESC")
        List<Candidat> findHighScoringCandidatesForOffre(@Param("offreId") Integer offreId,
                                                         @Param("minScore") Double minScore);


        boolean existsByCandidature(Candidature candidature);

    }
