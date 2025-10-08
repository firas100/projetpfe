package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.EntretienRepo;
import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Entretien;
import com.example.projetpfe.entity.EntretienDTO;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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

    public Entretien planifierEntretien(EntretienDTO entretienDTO) {
        Candidat candidat = candidatRepo.findById(entretienDTO.getCandidatId())
                .orElseThrow(() -> new RuntimeException("Candidat introuvable"));

        // Récupérer le manager depuis Keycloak
        UserRepresentation manager = keycloakUserService.getUserById(entretienDTO.getManagerId());

        Entretien entretien = new Entretien();
        entretien.setCandidat(candidat);
        entretien.setManagerId(manager.getId());
        entretien.setManagerEmail(manager.getEmail());
        entretien.setManagerName(manager.getFirstName() + " " + manager.getLastName());
        entretien.setDateEntretien(entretienDTO.getDateEntretien());
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

        // Email manager
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
        Entretien entretien = entretienRepo.findById(entretienId)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable !"));
        entretien.setStatus(status);
        entretien.setCommentaire(commentaire);
        return entretienRepo.save(entretien);
    }
}
