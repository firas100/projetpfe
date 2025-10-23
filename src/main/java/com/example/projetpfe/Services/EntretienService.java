package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.*;
import com.example.projetpfe.entity.*;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EntretienService {
    @Autowired
    private EntretienRepo entretienRepo;

    @Autowired
    private CandidatRepo candidatRepo;

    @Autowired
    private KeycloakUserService keycloakUserService;

    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private PreInterviewRepo preInterviewRepo;
    @Autowired
    private OffreRepo offreRepo;
    @Autowired
    private CandidatureRepo candidatureRepo;

    public List<CandidateEmailDTO> getCandidatesForOffre(Integer offreId, Double minScore) {
        List<Candidat> candidats = entretienRepo.findHighScoringCandidatesForOffre(offreId, minScore);
        List<CandidateEmailDTO> dtos = new ArrayList<>();

        for (Candidat candidat : candidats) {
            List<PreInterview> preInterviews = preInterviewRepo.findByCandidat(candidat);  // Maintenant une List
            if (preInterviews.isEmpty()) continue;

            // Sélectionnez le PreInterview avec le score le plus élevé (ou adaptez selon votre logique, ex. : le plus récent)
            PreInterview preInterview = preInterviews.stream()
                    .max(java.util.Comparator.comparing(PreInterview::getFinalScore))  // Assume getFinalScore() existe
                    .orElse(null);
            if (preInterview == null) continue;

            // Trouver la candidature pour cette offre
            Offre offre = offreRepo.findById(offreId).orElseThrow(() -> new RuntimeException("Offre introuvable"));
            Candidature candidature = candidatureRepo.findByCandidatAndOffre(candidat, offre);
            if (candidature == null) continue;

            CandidateEmailDTO dto = new CandidateEmailDTO(
                    candidat.getId_candidature(),
                    candidat.getPrenom(),
                    candidat.getNom(),
                    candidat.getEmail(),
                    candidature.getDateCandidature(),
                    preInterview.getFinalScore()
            );
            dtos.add(dto);
        }

        return dtos;
    }
    public List<Entretien> planifierEntretiensParOffre(EntretienPlanifierparOffreDTO dto) {
        Offre offre = offreRepo.findById(dto.getOffreId())
                .orElseThrow(() -> new RuntimeException("Offre introuvable"));

        List<Candidat> candidats = entretienRepo.findHighScoringCandidatesForOffre(dto.getOffreId(), dto.getMinScore());

        UserRepresentation manager = keycloakUserService.getUserById(dto.getManagerId());

        String managerName = manager.getFirstName() + " " + manager.getLastName();
        String managerEmail = manager.getEmail();

        List<Entretien> entretiens = new ArrayList<>();

        for (Candidat candidat : candidats) {
            Candidature candidature = candidatureRepo.findByCandidatAndOffre(candidat, offre);
            if (candidature == null) continue;  // Skip si pas de candidature (ne devrait pas arriver)

            Entretien entretien = new Entretien();
            entretien.setCandidat(candidat);
            entretien.setCandidature(candidature);  // Correction : Set la candidature spécifique
            entretien.setManagerId(manager.getId());
            entretien.setManagerEmail(managerEmail);
            entretien.setManagerName(managerName);
            entretien.setDateEntretien(dto.getDateEntretien());
            entretien.setCommentaire(dto.getCommentaire());  // Applique le commentaire commun
            entretien.setStatus("ENVOYE");

            entretienRepo.save(entretien);
            entretiens.add(entretien);

            envoyerEmails(entretien);  // Envoi emails pour chaque
        }

        return entretiens;
    }

    public Entretien planifierEntretien(EntretienDTO entretienDTO) {
        Candidat candidat = candidatRepo.findById(entretienDTO.getCandidatId())
                .orElseThrow(() -> new RuntimeException("Candidat introuvable"));

        Offre offre = offreRepo.findById(entretienDTO.getOffreId())
                .orElseThrow(() -> new RuntimeException("Offre introuvable"));

        Candidature candidature = candidatureRepo.findByCandidatAndOffre(candidat, offre);
        if (candidature == null) {
            throw new RuntimeException("Aucune candidature trouvée pour ce candidat et cette offre");
        }

        UserRepresentation manager = keycloakUserService.getUserById(entretienDTO.getManagerId());

        Entretien entretien = new Entretien();
        entretien.setCandidat(candidat);
        entretien.setCandidature(candidature);  // Associer la candidature spécifique (et donc l'offre)
        entretien.setManagerId(manager.getId());
        entretien.setManagerEmail(manager.getEmail());
        entretien.setManagerName(manager.getFirstName() + " " + manager.getLastName());
        entretien.setDateEntretien(entretienDTO.getDateEntretien());
        entretien.setCommentaire(entretienDTO.getCommentaire());
        entretien.setStatus("ENVOYE");

        entretienRepo.save(entretien);

        envoyerEmails(entretien);
        return entretien;
    }
    private void envoyerEmails(Entretien entretien) {
        // Email candidat
        SimpleMailMessage emailCandidat = new SimpleMailMessage();
        emailCandidat.setTo(entretien.getCandidat().getEmail());
        emailCandidat.setSubject("Invitation à un entretien");
        emailCandidat.setText("Bonjour " + entretien.getCandidat().getPrenom() + ",\n\n" +
                "Vous êtes invité à un entretien le " + entretien.getDateEntretien() +
                " avec le manager " + entretien.getManagerName() + ".\nMerci de confirmer.");

        SimpleMailMessage emailManager = new SimpleMailMessage();
        emailManager.setTo(entretien.getManagerEmail());
        emailManager.setSubject("Nouvel entretien assigné");
        emailManager.setText("Bonjour " + entretien.getManagerName() + ",\n\n" +
                "Un entretien a été planifié avec le candidat " +
                entretien.getCandidat().getPrenom() + " " + entretien.getCandidat().getNom() +
                " le " + entretien.getDateEntretien() + ".");

        mailSender.send(emailCandidat);
        mailSender.send(emailManager);
    }
    public List<Entretien> getEntretiensByManager(String mangerId){
        return entretienRepo.findByManagerId(mangerId);
    }

    public Entretien updateStatusAndComment(Integer entretienId, String status, String commentaire) {
        // Récupérer l'Entretien
        Entretien entretien = entretienRepo.findById(entretienId)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable !"));

        // Mise à jour de l'Entretien
        entretien.setStatus(status);
        entretien.setCommentaire(commentaire);

        // Récupérer la Candidature associée (via la relation)
        Candidature candidature = entretien.getCandidature();
        if (candidature == null) {
            throw new RuntimeException("Aucune candidature associée à cet entretien !");
        }

        // Mise à jour conditionnelle du statut de la Candidature
        switch (status) {
            case "ENVOYE":
                candidature.setStatut("ENTRETIEN_PROGRAMME");  // Ou "EN_ATTENTE" si pas de changement
                break;
            case "CONFIRME":
                candidature.setStatut("EN_COURS");  // Avancez vers l'entretien accepté
                break;
            case "REFUSE":
                candidature.setStatut("REFUSEE");  // Clôturez la candidature
                break;
            default:
                // Optionnel : Log ou ignore si statut inconnu
                System.out.println("Statut inconnu pour l'entretien : " + status + ". Pas de changement sur la candidature.");
                break;
        }

        // Sauvegarder les deux entités (JPA gère la cascade si configurée, sinon save explicite)
        entretienRepo.save(entretien);
        candidatureRepo.save(candidature);  // Assure la persistance de la Candidature

        return entretien;  // Retourne l'Entretien mis à jour
    }
}