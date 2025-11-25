package com.example.projetpfe.Camunda;

import com.example.projetpfe.Services.CvService;
import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.response.ProcessInstanceEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;


import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.client.api.response.ActivatedJob;

import java.util.HashMap;
import java.util.Map;

@Component
public class CvWorker {

    @Autowired
    private CvService cvService;

    @JobWorker(type = "verifierEtEnregistrerCv", autoComplete = true)
    public Map<String, Object> verifierEtEnregistrerCv(final ActivatedJob job) {
        System.out.println("JOB WORKER ACTIVE");

        // Récupérer TOUTES les variables
        Map<String, Object> variables = job.getVariablesAsMap();

        System.out.println("DEBUG - VARIABLES RECUES :");
        variables.forEach((key, value) ->
                System.out.println("  [" + key + "] = [" + value + "]")
        );

        String cvPath = (String) variables.get("cvPath");
        String nom = (String) variables.get("nom");
        String prenom = (String) variables.get("prenom");
        Integer candidatId = (Integer) variables.get("candidatId");
        Integer candidatureId = (Integer) variables.get("candidatureId");

        Map<String, Object> resultVariables = new HashMap<>();

        //  VALIDATION CRITIQUE
        if (cvPath == null || cvPath.trim().isEmpty() || cvPath.equals("cvPath")) {
            System.err.println("[ERREUR CRITIQUE] Variable cvPath invalide : [" + cvPath + "]");
            System.err.println("[ACTION] Le BPMN ne passe pas correctement les variables !");
            System.err.println("[SOLUTION] Verifier le fichier BPMN et redemarrer l'application");

            resultVariables.put("isLatex", false);
            resultVariables.put("message", "Erreur technique : chemin CV invalide");
            return resultVariables;
        }

        try {
            System.out.println("[INFO] Verification du CV : " + cvPath);

            // ÉTAPE 1 : Vérifier si le CV est LaTeX
            boolean isLatex = cvService.verifierCvLatexParChemin(cvPath);

            if (isLatex) {
                System.out.println("[RESULTAT] CV LaTeX detecte - ACCEPTE");

                //  ÉTAPE 2 : Enregistrer le CV
                boolean enregistre = cvService.enregistrerCvLatex(cvPath, nom, prenom);

                if (enregistre) {
                    System.out.println("[SUCCESS] CV enregistre en base de donnees");
                    resultVariables.put("isLatex", true);
                    resultVariables.put("message", "Candidature acceptee");
                } else {
                    System.out.println("[ERREUR] Echec enregistrement");
                    resultVariables.put("isLatex", false);
                    resultVariables.put("message", "Erreur enregistrement");
                }

            } else {
                System.out.println("[RESULTAT] CV non-LaTeX detecte - REJETE");

                //  ÉTAPE 3 : Supprimer le CV
                boolean supprime = cvService.supprimerCvEtCandidature(
                        cvPath, candidatId, candidatureId
                );

                System.out.println("[ACTION] Suppression CV : " +
                        (supprime ? "SUCCESS" : "ECHEC"));

                resultVariables.put("isLatex", false);
                resultVariables.put("message", "Candidature rejetee - CV non-LaTeX");
            }

        } catch (Exception e) {
            System.err.println("[EXCEPTION] " + e.getMessage());
            e.printStackTrace();

            resultVariables.put("isLatex", false);
            resultVariables.put("message", "Erreur : " + e.getMessage());
        }

        System.out.println("JOB WORKER TERMINE - isLatex = " + resultVariables.get("isLatex"));

        return resultVariables;
    }
}