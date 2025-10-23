package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.*;
import com.example.projetpfe.entity.*;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service

public class CandidatService {
    private static final double MIN_SCORE = 55;
    @Autowired
    private RecommendationRepo recommendationRepo;

    @Autowired
    private CandidatRepo condidatRepo;
    @Autowired
    EntretienRepo entretienRepo;
    @Autowired
    private CvRepo cvRepo;
    @Autowired
    private PreInterviewRepo preInterviewRepository;

    @Autowired
    private CandidatureRepo candidatureRepo;

    public Candidat addCondidature(Candidat candidat) {
        return condidatRepo.save(candidat);
    }

    public List<Candidat> getAllCandidats() {
        return entretienRepo.findCandidatsWithHighScore(MIN_SCORE);
    }


    public Candidat getCandidatById(Integer id) {
        return condidatRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidat non trouvé avec id: " + id));
    }

    public List<Candidat> getCandidatesWithScoreAbove(double threshold) {
        List<Recommendation> recommendations = recommendationRepo.findBySimilarityScoreGreaterThan(threshold);
        return recommendations.stream()
                .map(Recommendation::getCandidat)
                .collect(Collectors.toList());
    }
   /* public Candidat getTopScoredCandidat() {
        Optional<Recommendation> topRecommendation = recommendationRepo.findTopByOrderBySimilarityScoreDesc();
        return topRecommendation.map(recommendation -> condidatRepo.findById(recommendation.getCandidat().getId_candidature())
                .orElse(null)).orElse(null);
    }*/

    public List<Candidat> getcandidat() {
        return condidatRepo.findAll();
    }

    public Candidat findByEmail(String email) {
        return condidatRepo.findByEmail(email);
    }

    @Transactional()
    public List<CandidateHistoryDTO> getAllCandidatesHistory() {
        List<Candidat> candidats = condidatRepo.findAll();  // FIXED: Use findAll for full entities (includes cvPath)
        List<CandidateHistoryDTO> histories = new ArrayList<>();

        for (Candidat candidat : candidats) {
            // FIXED: Explicitly log cvPath to confirm it's loaded
            System.out.println("Candidate " + candidat.getId_candidature() + " cvPath: " + candidat.getCvPath());

            CandidateHistoryDTO dto = new CandidateHistoryDTO();
            dto.setCandidateId(candidat.getId_candidature());
            dto.setNom(candidat.getNom());
            dto.setPrenom(candidat.getPrenom());
            dto.setCvPath(candidat.getCvPath());
            // NEW: Add cvPath to DTO if needed (extend CandidateHistoryDTO with cvPath)
            // dto.setCvPath(candidat.getCvPath());  // If DTO has setter for cvPath

            // FIXED: Fetch Entretien UNE FOIS par Candidat (lié à candidat_id)
            Integer candidatId = candidat.getId_candidature();
            System.out.println("Searching Entretien for candidatId: " + candidatId);  // Debug
            Entretien ent = (Entretien) entretienRepo.findByCandidatIdCandidature(candidatId);  // FIXED: Updated to match new @Query method name
            String interviewStatus = (ent != null) ? ent.getStatus() : "NON_PLANIFIE";
            String commentaire = (ent != null) ? ent.getCommentaire() : "Aucun entretien pour le moment";
            if (ent != null) {
                System.out.println("Found Entretien for candidatId " + candidatId + ": " + interviewStatus + " - " + commentaire);  // Debug
            } else {
                System.out.println("No Entretien found for candidatId: " + candidatId);  // Debug
            }

            List<Candidature> candidatures = candidatureRepo.findByCandidat(candidat);
            List<HistoryDTO> applications = new ArrayList<>();

            for (Candidature candidature : candidatures) {
                HistoryDTO appDto = new HistoryDTO();
                appDto.setCandidatureId(candidature.getId());
                appDto.setDateCandidature(candidature.getDateCandidature());
                appDto.setStatutCandidature(candidature.getStatut());
                appDto.setIdOffre(candidature.getOffre() != null ? candidature.getOffre().getIdOffre() : null);
                appDto.setTitreOffre(candidature.getOffre() != null ? candidature.getOffre().getTitreOffre() : "N/A");
                appDto.setCvPath(candidat.getCvPath());
                // Fetch Recommendation
                Optional<Recommendation> rec = recommendationRepo.findByCandidatAndOffre(candidat, candidature.getOffre());
                if (rec.isPresent()) {
                    appDto.setCvScore(rec.get().getSimilarityScore());
                    appDto.setYearsOfExperience(rec.get().getYearsOfExperience());
                }

                // Fetch PreInterview
                PreInterview pi = preInterviewRepository.findByCandidature(candidature);
                if (pi != null) {
                    appDto.setVideoScore(pi.getFinalScore());
                }

                // FIXED: Appliquez l'Entretien du Candidat à cette candidature
                appDto.setInterviewStatus(interviewStatus);
                appDto.setCommentaire(commentaire);

                applications.add(appDto);
            }

            dto.setApplications(applications);
            histories.add(dto);
        }

        return histories;
    }

    @Transactional()
    public CandidateHistoryDTO getCandidateHistory(Integer candidateId) {
        Candidat candidat = condidatRepo.findById(candidateId).orElse(null);  // FIXED: Use findById for full entity with cvPath
        if (candidat == null) {
            return null;
        }
        // FIXED: Log cvPath to confirm
        System.out.println("Candidate " + candidateId + " cvPath: " + candidat.getCvPath());

        CandidateHistoryDTO dto = new CandidateHistoryDTO();
        dto.setCandidateId(candidat.getId_candidature());
        dto.setNom(candidat.getNom());
        dto.setPrenom(candidat.getPrenom());
        dto.setCvPath(candidat.getCvPath());
        // NEW: Add cvPath to DTO if needed
        // dto.setCvPath(candidat.getCvPath());  // If DTO has it

        // FIXED: Même logique : Fetch Entretien par Candidat ID
        Integer id = candidat.getId_candidature();
        System.out.println("Searching Entretien for candidatId: " + id);  // Debug
        Entretien ent = (Entretien) entretienRepo.findByCandidatIdCandidature(id);
        String interviewStatus = (ent != null) ? ent.getStatus() : "NON_PLANIFIE";
        String commentaire = (ent != null) ? ent.getCommentaire() : "Aucun entretien pour le moment";
        if (ent != null) {
            System.out.println("Found Entretien for candidatId " + id + ": " + interviewStatus + " - " + commentaire);
        } else {
            System.out.println("No Entretien found for candidatId: " + id);
        }

        List<Candidature> candidatures = candidatureRepo.findByCandidat(candidat);
        List<HistoryDTO> applications = new ArrayList<>();

        for (Candidature candidature : candidatures) {
            HistoryDTO appDto = new HistoryDTO();
            appDto.setCandidatureId(candidature.getId());
            appDto.setDateCandidature(candidature.getDateCandidature());
            appDto.setStatutCandidature(candidature.getStatut());
            appDto.setIdOffre(candidature.getOffre() != null ? candidature.getOffre().getIdOffre() : null);
            appDto.setTitreOffre(candidature.getOffre() != null ? candidature.getOffre().getTitreOffre() : "N/A");
            appDto.setCvPath(candidat.getCvPath());

            // Fetch Recommendation
            Optional<Recommendation> rec = recommendationRepo.findByCandidatAndOffre(candidat, candidature.getOffre());
            if (rec.isPresent()) {
                appDto.setCvScore(rec.get().getSimilarityScore());
                appDto.setYearsOfExperience(rec.get().getYearsOfExperience());
            }

            // Fetch PreInterview
            PreInterview pi = preInterviewRepository.findByCandidature(candidature);
            if (pi != null) {
                appDto.setVideoScore(pi.getFinalScore());
            }

            appDto.setInterviewStatus(interviewStatus);
            appDto.setCommentaire(commentaire);

            applications.add(appDto);
        }

        dto.setApplications(applications);
        return dto;
    }

    // FIXED: Changed to return Optional<Candidat> for byName (existing repo method)
    public Optional<Candidat> getCandidatByName(String nom, String prenom) {
        return condidatRepo.findByNomAndPrenom(nom, prenom);  // FIXED: Use existing repo method (case-insensitive if LOWER in repo)
    }
}