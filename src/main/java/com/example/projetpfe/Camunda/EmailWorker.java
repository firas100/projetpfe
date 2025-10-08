package com.example.projetpfe.Camunda;

import com.example.projetpfe.Repository.RecommendationRepo;
import com.example.projetpfe.Services.CandidatService;
import com.example.projetpfe.Services.EmailService;
import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Recommendation;
import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.client.api.worker.JobClient;
import io.camunda.zeebe.client.api.worker.JobHandler;
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
    private RecommendationRepo  recommendationRepo;

    @PostConstruct
    public void startWorkers() {
        // Worker pour récupérer les candidats recommandés
        zeebeClient.newWorker()
                .jobType("get-recommended-candidates")
                .handler(new JobHandler() {
                    @Override
                    public void handle(JobClient client, ActivatedJob job) throws Exception {
                        List<Candidat> eligibleCandidates = candidatService.getCandidatesWithScoreAbove(8.0);
                        if (!eligibleCandidates.isEmpty()) {
                            // Convertir la liste en une structure Map pour Zeebe
                            client.newCompleteCommand(job.getKey())
                                    .variables(Map.of("candidates", eligibleCandidates)) // Zeebe sérialisera cela
                                    .send().join();
                        } else {
                            client.newFailCommand(job.getKey()).retries(0).errorMessage("No eligible candidates found").send().join();
                        }
                    }
                })
                .name("get-recommended-candidates-worker")
                .timeout(Duration.ofSeconds(10))
                .open();

        // Worker pour envoyer l'email
        zeebeClient.newWorker()
                .jobType("send-email")
                .handler(new JobHandler() {
                    @Override
                    public void handle(JobClient client, ActivatedJob job) throws Exception {
                        Map<String, Object> variables = job.getVariablesAsMap();
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> candidatesData = (List<Map<String, Object>>) variables.get("candidates");
                        if (candidatesData != null && !candidatesData.isEmpty()) {
                            for (Map<String, Object> candidateData : candidatesData) {
                                String email = (String) candidateData.get("email");
                                String nom = (String) candidateData.get("nom");
                                String prenom = (String) candidateData.get("prenom");
                                if (email != null && nom != null && prenom != null) {
                                    String name = nom + " " + prenom;
                                    String subject = "Félicitations ! Vous êtes sélectionné";
                                    try {
                                        emailService.sendEmail(email, subject, name, "http://localhost:4200/preinterview");
                                    } catch (Exception e) {
                                        System.err.println("Failed to send email to " + email + ": " + e.getMessage());
                                    }
                                }
                            }
                            client.newCompleteCommand(job.getKey()).send().join();
                        } else {
                            client.newFailCommand(job.getKey()).retries(0).errorMessage("No candidates to process").send().join();
                        }
                    }
                })
                .name("send-email-worker")
                .timeout(Duration.ofSeconds(10))
                .open();
    }
    public List<Candidat> getCandidatesWithScoreAbove(double threshold) {
        List<Recommendation> recommendations = recommendationRepo.findBySimilarityScoreGreaterThan(threshold);
        return recommendations.stream()
                .map(Recommendation::getCandidat) // Supposant que Recommendation a une relation avec Candidat
                .collect(Collectors.toList());
    }
}