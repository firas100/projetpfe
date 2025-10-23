package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.*;
import com.example.projetpfe.entity.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CandidatureService {
    @Autowired
    private CandidatureRepo candidatureRepo;
    @Autowired
    private CandidatRepo candidatRepo;
    @Autowired
    private OffreRepo offreRepo;
    @Autowired
    private PreInterviewRepo preInterviewRepo;
    @Autowired
    private EntretienRepo entretienRepo;

    public Candidature Postuler(Integer candidadId, Integer idOffre) {
        Candidat candidat = candidatRepo.findById(candidadId)
                .orElseThrow(() -> new RuntimeException("Candidat Introuvable"));
        Offre offre = offreRepo.findById(idOffre)
                .orElseThrow(() -> new RuntimeException("Offre introuvable"));

        Candidature candidature = new Candidature();
        candidature.setCandidat(candidat);
        candidature.setOffre(offre);
        candidature.setDateCandidature(LocalDateTime.now());

        return candidatureRepo.save(candidature);
    }

    public List<Candidature> getAll() {
        return candidatureRepo.findAll();
    }

    public List<Candidature> getByCandidat(Integer candidatId) {
        Candidat candidat = candidatRepo.findById(candidatId)
                .orElseThrow(() -> new RuntimeException("Candidat introuvable"));
        return candidatureRepo.findByCandidat(candidat);
    }

    public List<CandidatureDTO> getByKeycloakId(String keycloakId) {
        Candidat candidat = candidatRepo.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("Candidat non trouvé"));
        List<Candidature> candidatures = candidatureRepo.findByCandidat(candidat);
        // Map to DTO with lambda (avoids method reference error)
        return candidatures.stream()
                .map(candidature -> new CandidatureDTO(candidature))  // Use lambda for explicit typing
                .collect(Collectors.toList());
    }

    public List<Candidature> getByOffre(Integer offreId) {
        Offre offre = offreRepo.findById(offreId)
                .orElseThrow(() -> new RuntimeException("Offre introuvable"));
        return candidatureRepo.findByOffre(offre);
    }

   }