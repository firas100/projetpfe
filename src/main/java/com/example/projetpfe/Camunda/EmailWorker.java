package com.example.projetpfe.Camunda;

import com.example.projetpfe.Repository.CandidatePreInterviewRepo;
import com.example.projetpfe.Repository.RecommendationRepo;
import com.example.projetpfe.Services.CandidatService;
import com.example.projetpfe.Services.EmailService;
import com.example.projetpfe.entity.CandidatePreInterview;
import com.example.projetpfe.entity.Recommendation;
import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.client.api.worker.JobClient;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class EmailWorker {

    @Autowired
    private ZeebeClient zeebeClient;

    @Autowired
    private CandidatService candidatService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private RecommendationRepo recommendationRepo;

    @Autowired
    private CandidatePreInterviewRepo preInterviewRepo;

    @PostConstruct
    public void startWorkers() {

        // === Worker 1 : récupérer candidats recommandés ===
        zeebeClient.newWorker()
                .jobType("get-recommended-candidates")
                .handler((client, job) -> {
                    Map<String, Object> variables = job.getVariablesAsMap();
                    Integer idOffre = variables.get("idOffre") != null
                            ? ((Number) variables.get("idOffre")).intValue()
                            : null;

                    if (idOffre == null) {
                        client.newFailCommand(job.getKey())
                                .retries(0)
                                .errorMessage("idOffre is missing")
                                .send()
                                .join();
                        return;
                    }

                    List<Recommendation> recommendations = recommendationRepo.findByOffre_IdOffre(idOffre);

                    // Transformer en Map pour éviter problème de sérialisation
                    List<Map<String, Object>> selectedCandidates = recommendations.stream()
                            .filter(r -> r.getSimilarityScore() > 25)
                            .map(r -> {
                                Map<String, Object> map = new java.util.HashMap<>();
                                map.put("nom", r.getCandidat().getNom());
                                map.put("prenom", r.getCandidat().getPrenom());
                                map.put("email", r.getCandidat().getEmail());
                                map.put("titreOffre", r.getOffre().getTitreOffre());
                                map.put("score", r.getSimilarityScore());
                                map.put("offreId", r.getOffre().getIdOffre());
                                return map;
                            })
                            .collect(Collectors.toList());

                    if (!selectedCandidates.isEmpty()) {
                        client.newCompleteCommand(job.getKey())
                                .variables(Map.of("candidates", selectedCandidates))
                                .send()
                                .join();
                    } else {
                        client.newFailCommand(job.getKey())
                                .retries(0)
                                .errorMessage("No candidates with score > 25 for this offer")
                                .send()
                                .join();
                    }
                })
                .name("get-recommended-candidates-worker")
                .timeout(Duration.ofSeconds(10))
                .open();

        // === Worker 2 : envoyer les emails ===
        zeebeClient.newWorker()
                .jobType("send-email")
                .handler((JobClient client, ActivatedJob job) -> {
                    Map<String, Object> variables = job.getVariablesAsMap();
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> candidatesData = (List<Map<String, Object>>) variables.get("candidates");

                    if (candidatesData != null && !candidatesData.isEmpty()) {
                        for (Map<String, Object> candidateData : candidatesData) {
                            try {
                                String email = (String) candidateData.get("email");
                                String nom = (String) candidateData.get("nom");
                                String prenom = (String) candidateData.get("prenom");
                                String titreOffre = (String) candidateData.get("titreOffre");
                                Object offreIdObj = candidateData.get("offreId");
                                Integer offreId = null;
                                if (offreIdObj instanceof Number) {
                                    offreId = ((Number) offreIdObj).intValue();
                                }
                                double score = candidateData.get("score") != null
                                        ? ((Number) candidateData.get("score")).doubleValue()
                                        : 0;

                                if (email == null || nom == null || prenom == null || offreId == null) {
                                    System.err.println("Données manquantes pour le candidat : " + candidateData);
                                    continue;
                                }

                                // Préparer le mail
                                String subject = "Félicitations ! Vous êtes présélectionné pour l'offre : " + titreOffre;
                                String body = String.format(
                                        "Bonjour %s %s,\n\n" +
                                                "Félicitations ! Vous avez été présélectionné pour le poste '%s'.\n" +
                                                "Veuillez compléter votre pré-entretien sur le lien suivant :\n" +
                                                "http://localhost:4200/preinterview?offreId=%d&email=%s\n\n" +
                                                "Cordialement,\nL'équipe RH.",
                                        prenom, nom, titreOffre, offreId, email
                                );

                                // Envoi du mail
                                emailService.sendEmail(email, subject, body, "");
                                System.out.println("Email envoyé à : " + email);

                                // Sauvegarde en base avec videoSaved = false
                                CandidatePreInterview record = new CandidatePreInterview();
                                record.setEmail(email);
                                record.setNom(nom);
                                record.setPrenom(prenom);
                                record.setOffreId(offreId);
                                record.setOffreTitre(titreOffre);
                                record.setVideoSaved(false);
                                preInterviewRepo.save(record);

                            } catch (Exception e) {
                                System.err.println("Erreur lors de l'envoi du mail ou sauvegarde : " + e.getMessage());
                                e.printStackTrace();
                            }
                        }

                        client.newCompleteCommand(job.getKey()).send().join();
                    } else {
                        client.newFailCommand(job.getKey())
                                .retries(0)
                                .errorMessage("No candidates to send emails to")
                                .send()
                                .join();
                    }
                })
                .name("send-email-worker")
                .timeout(Duration.ofSeconds(10))
                .open();
    }
}
