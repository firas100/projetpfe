package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.PreInterview;
import com.example.projetpfe.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PreInterviewRepo extends JpaRepository<PreInterview,Integer> {
    PreInterview findByNomAndPrenom(String nom, String prenom);


    PreInterview findTopByCandidatOrderByDateEnregistrementDesc(Candidat candidat);

}
