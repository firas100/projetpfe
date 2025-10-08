package com.example.projetpfe.Controller;

import com.example.projetpfe.Repository.EntretienRepo;
import com.example.projetpfe.Services.CandidatService;
import com.example.projetpfe.Services.EntretienService;
import com.example.projetpfe.Services.KeycloakUserService;
import com.example.projetpfe.Services.NotificationService;
import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Entretien;
import com.example.projetpfe.entity.EntretienDTO;
import com.example.projetpfe.entity.Notification;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/Entretient")
public class EntretienController {
    @Autowired
    private EntretienService entretienService;

    @Autowired
    private KeycloakUserService keycloakUserService;

    @Autowired
    private CandidatService candidatService;

    @Autowired
    private EntretienRepo entretienRepo;

    @Autowired
    NotificationService notificationService;


    @GetMapping("/managers")
    public ResponseEntity<?> getAllManagers() {
        try {
            List<UserRepresentation> managers = keycloakUserService.getManagers();
            return ResponseEntity.ok(managers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur Keycloak: " + e.getMessage());
        }
    }


        @GetMapping("/candidats")
    public ResponseEntity<?> getAllCandidats() {
        try {
            List<Candidat> candidats = candidatService.getAllCandidats();
            return ResponseEntity.ok(candidats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de recuperation de candidat" + e.getMessage());
        }
    }
    @PostMapping("/planifier")
    public ResponseEntity<String> planifierEntretien(@RequestBody EntretienDTO entretienDTO) {
        Entretien entretient = entretienService.planifierEntretien(entretienDTO);
        Notification notification = new Notification();
        notification.setMessage("Nouvel entretien assigné avec " + entretient.getCandidat().getNom() + " le " + entretient.getDateEntretien());
        notification.setManagerId(entretient.getManagerId()); // Assumez que Entretient a un champ Manager
        notification.setEntretientId(Long.valueOf(entretient.getId()));
        notification.setRead(false);
        notification.setCreatedAt(new Date());
        notificationService.save(notification);
        return ResponseEntity.ok("Entretien planifié et emails envoyés !");
    }
    @GetMapping("/manager/{managerId}/entretiens")
    public ResponseEntity<?> getEntretiensManager(@PathVariable String managerId) {
        try {
            List<Entretien> entretiens = entretienService.getEntretiensByManager(managerId);
            return ResponseEntity.ok(entretiens);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur récupération entretiens : " + e.getMessage());
        }
    }

    @PutMapping("/updateStatusetComment")
    public ResponseEntity<Entretien> updateStatusAndComment(@RequestBody Map<String, Object> request) {
        Integer id = (Integer) request.get("id");
        String status = (String) request.get("status");
        String commentaire = (String) request.get("commentaire");

        Entretien updated = entretienService.updateStatusAndComment(id, status, commentaire);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/getCandidats")
    public ResponseEntity<?> getCandidatApresEntretiens() {
        try {
            List<Entretien> entretiens = entretienRepo.findAll();
            return ResponseEntity.ok(entretiens);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de recuperation de candidat" + e.getMessage());
        }
    }

}
