package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Candidature;
import com.example.projetpfe.entity.CandidatureProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CandidatureProgressRepo extends JpaRepository<CandidatureProgress,Integer> {
    Optional<CandidatureProgress> findByCandidature(Candidature candidature);

}
