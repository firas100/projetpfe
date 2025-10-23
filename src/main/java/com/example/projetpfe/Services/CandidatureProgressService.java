package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.*;
import com.example.projetpfe.entity.Candidature;
import com.example.projetpfe.entity.CandidatureProgress;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CandidatureProgressService {
    private  CandidatureRepo candidatureRepo;
    private  RecommendationRepo recommendationRepo;
    private  PreInterviewRepo preInterviewRepo;
    private  EntretienRepo entretienRepo;
    private  CandidatureProgressRepo progressRepo;

    public CandidatureProgressService(CandidatureRepo candidatureRepo, RecommendationRepo recommendationRepo, PreInterviewRepo preInterviewRepo, EntretienRepo entretienRepo, CandidatureProgressRepo progressRepo) {
        this.candidatureRepo = candidatureRepo;
        this.recommendationRepo = recommendationRepo;
        this.preInterviewRepo = preInterviewRepo;
        this.entretienRepo = entretienRepo;
        this.progressRepo = progressRepo;
    }

    public String updateCandidatureProgress(Integer candidatureId, double minScore) {
        Optional<Candidature> candidatureOpt = candidatureRepo.findById(candidatureId);
        if (candidatureOpt.isEmpty()) return "Candidature non trouvée";

        Candidature candidature = candidatureOpt.get();

        String step = "CANDIDATURE_ENREGISTREE";
        String desc = "Votre candidature est en cours de traitement.";

        // Étape 1 : candidature enregistrée
        if (!"EN_ATTENTE".equalsIgnoreCase(candidature.getStatut())) {
            step = "CANDIDATURE_TRAITEE";
            desc = "Candidature analysée.";
        }

        // Étape 2 : recommandation
        boolean recommended = recommendationRepo.existsByCandidatAndOffreAndSimilarityScoreGreaterThanEqual(
                candidature.getCandidat(), candidature.getOffre(), minScore);
        if (recommended) {
            step = "CV_ANALYSE";
            desc = "Votre CV a été analysé et jugé pertinent pour le poste.";
        }

        // Étape 3 : pré-entretien
        boolean videoDone = preInterviewRepo.existsByCandidatureAndVideoPathIsNotNull(candidature);
        if (videoDone) {
            step = "PREINTERVIEW_TERMINEE";
            desc = "Votre vidéo d'entretien préliminaire a été enregistrée.";
        }

        // Étape 4 : entretien
        boolean entretienPlanifie = entretienRepo.existsByCandidature(candidature);
        if (entretienPlanifie) {
            step = "ENTRETIEN_PLANIFIE";
            desc = "Vous avez été convié à un entretien avec le manager.";
        }

        // Sauvegarde ou mise à jour du suivi
        CandidatureProgress progress = progressRepo.findByCandidature(candidature)
                .orElse(new CandidatureProgress());
        progress.setCandidature(candidature);
        progress.setCurrentStep(step);
        progress.setDescription(desc);

        progressRepo.save(progress);

        return step;
    }
}

