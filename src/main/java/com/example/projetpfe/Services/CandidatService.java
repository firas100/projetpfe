package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.*;
import com.example.projetpfe.entity.*;

import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service

public class CandidatService {
    private static final Logger logger = LoggerFactory.getLogger(CandidatService.class);  // Ajoute un logger pour debug
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

    @Transactional
    public List<CandidateHistoryDTO> getAllCandidatesHistory() {
        List<Candidat> candidats = condidatRepo.findAll();
        List<CandidateHistoryDTO> histories = new ArrayList<>();

        for (Candidat candidat : candidats) {
            logger.debug("Candidate {} cvPath: {}", candidat.getId_candidature(), candidat.getCvPath());

            CandidateHistoryDTO dto = new CandidateHistoryDTO();
            dto.setCandidateId(candidat.getId_candidature());
            dto.setNom(candidat.getNom());
            dto.setPrenom(candidat.getPrenom());
            dto.setCvPath(candidat.getCvPath());

            List<Candidature> candidatures = candidatureRepo.findByCandidat(candidat);
            List<HistoryDTO> applications = new ArrayList<>();

            for (Candidature candidature : candidatures) {
                HistoryDTO appDto = new HistoryDTO();
                appDto.setCandidatureId(candidature.getId());
                appDto.setDateCandidature(candidature.getDateCandidature());
                //appDto.setStatutCandidature(candidature.getStatut());
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
                    if (pi.getVideoPath() != null) {
                        String cleanPath = Paths.get(pi.getVideoPath()).getFileName().toString();
                        appDto.setVideoPath(cleanPath);
                    }
                }

                // Fetch Entretien per Candidature
                List<Entretien> ents = entretienRepo.findByCandidatureId(candidature.getId());
                String interviewStatus = "NON_PLANIFIE";
                String commentaire = "Aucun entretien pour le moment";

                if (!ents.isEmpty()) {
                    Entretien ent = ents.get(0);  // Prends le premier; ou sort par date si besoin
                    interviewStatus = ent.getStatus();
                    commentaire = ent.getCommentaire();
                    logger.debug("Found Entretien for candidature {}: {} - {}", candidature.getId(), interviewStatus, commentaire);

                    if (ents.size() > 1) {
                        logger.warn("Multiple Entretien found for Candidature ID {}: {} records. Using the first one.", candidature.getId(), ents.size());
                    }
                } else {
                    logger.debug("No Entretien found for candidature: {}", candidature.getId());
                }

                appDto.setInterviewStatus(interviewStatus);
                appDto.setCommentaire(commentaire);

                applications.add(appDto);
            }

            dto.setApplications(applications);
            histories.add(dto);
        }

        return histories;
    }

    @Transactional
    public CandidateHistoryDTO getCandidateHistory(Integer candidateId) {
        Candidat candidat = condidatRepo.findById(candidateId).orElse(null);
        if (candidat == null) {
            return null;
        }
        logger.debug("Candidate {} cvPath: {}", candidateId, candidat.getCvPath());

        CandidateHistoryDTO dto = new CandidateHistoryDTO();
        dto.setCandidateId(candidat.getId_candidature());
        dto.setNom(candidat.getNom());
        dto.setPrenom(candidat.getPrenom());
        dto.setCvPath(candidat.getCvPath());

        List<Candidature> candidatures = candidatureRepo.findByCandidat(candidat);
        List<HistoryDTO> applications = new ArrayList<>();

        for (Candidature candidature : candidatures) {
            HistoryDTO appDto = new HistoryDTO();
            appDto.setCandidatureId(candidature.getId());
            appDto.setDateCandidature(candidature.getDateCandidature());
            //appDto.setStatutCandidature(candidature.getStatut());
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
                if (pi.getVideoPath() != null) {
                    String cleanPath = Paths.get(pi.getVideoPath()).getFileName().toString();
                    appDto.setVideoPath(cleanPath);
                }
            }

            // Fetch Entretien per Candidature
            List<Entretien> ents = entretienRepo.findByCandidatureId(candidature.getId());
            String interviewStatus = "NON_PLANIFIE";
            String commentaire = "Aucun entretien pour le moment";

            if (ents != null && !ents.isEmpty()) {
                Entretien ent = ents.get(0);  // Prends le premier; ou sort par date si besoin
                interviewStatus = ent.getStatus() != null ? ent.getStatus() : "NON_PLANIFIE";
                commentaire = ent.getCommentaire() != null ? ent.getCommentaire() : "Aucun commentaire";
                logger.debug("Found Entretien for candidature {}: {} - {}", candidature.getId(), interviewStatus, commentaire);

                if (ents.size() > 1) {
                    logger.warn("Multiple Entretien found for Candidature ID {}: {} records. Using the first one.", candidature.getId(), ents.size());
                }
            } else {
                logger.debug("No Entretien found for candidature: {}", candidature.getId());
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