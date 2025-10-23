package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.CvService;
import io.camunda.zeebe.client.ZeebeClient;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@RestController
@AllArgsConstructor
public class CvController {
    private final ZeebeClient zeebeClient;
    private final CvService cvService;
    private static final String CV_FOLDER_PATH = "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV";

    @PostConstruct
    public void startProcess() {
        try {
            System.out.println("🧹 Suppression des CV non-LaTeX...");
            cvService.supprimerCvNonLatex();

            ClassPathResource resource = new ClassPathResource("cv-process.bpmn");

            if (!resource.exists()) {
                System.out.println(" Fichier BPMN non trouvé dans les ressources !");
                return;
            } else {
                System.out.println(" Fichier BPMN trouvé !");
            }

            zeebeClient.newDeployCommand()
                    .addResourceStream(resource.getInputStream(), "cv-process.bpmn")
                    .send()
                    .join();

            System.out.println(" Processus BPMN déployé avec succès");

            File folder = new File(CV_FOLDER_PATH);
            File[] files = folder.listFiles((dir, name) -> name.toLowerCase().endsWith(".pdf"));

            if (files != null && files.length > 0) {
                for (File cvFile : files) {
                    Map<String, Object> variables = new HashMap<>();
                    variables.put("cvPath", cvFile.getAbsolutePath());

                    zeebeClient.newCreateInstanceCommand()
                            .bpmnProcessId("cv_process")
                            .latestVersion()
                            .variables(variables)
                            .send()
                            .join();

                    System.out.println(" Instance démarrée pour : " + cvFile.getAbsolutePath());
                }
            } else {
                System.out.println("⚠ Aucun fichier PDF trouvé dans le dossier : " + CV_FOLDER_PATH);
            }

        } catch (Exception e) {
            throw new RuntimeException(" Erreur lors du déploiement ou du lancement des processus", e);
        }
    }
}
