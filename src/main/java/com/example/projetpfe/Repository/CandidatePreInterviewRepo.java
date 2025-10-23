package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.CandidatePreInterview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CandidatePreInterviewRepo extends JpaRepository<CandidatePreInterview, Long> {
    List<CandidatePreInterview> findByOffreIdAndEmail(Integer offreId, String email);

    List<CandidatePreInterview> findByOffreIdAndVideoSavedTrue(Integer offreId);

}
