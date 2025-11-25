package com.example.projetpfe.Controller;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.CandidatureRepo;
import com.example.projetpfe.Repository.PreInterviewRepo;
import com.example.projetpfe.Services.CandidatService;
import com.example.projetpfe.Services.CandidatureService;
import com.example.projetpfe.Services.CvService;
import com.example.projetpfe.entity.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.camunda.zeebe.client.ZeebeClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/Candidature")
public class CandidatController {
    private static final Logger logger = LoggerFactory.getLogger(CandidatController.class);

    @Autowired
    CandidatService candidatService;
    @Autowired
    CandidatRepo candidatRepo ;
    @Autowired
    private PreInterviewRepo preInterviewRepo;
    @Autowired
    private CandidatureRepo candidatureRepo;

    @Autowired
    CvService cvService;
    @Autowired
    private CandidatureService candidatureService;
    @Autowired
    private ZeebeClient zeebeClient;
    private final String uploadsDir = "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\";

    @PostMapping("/extract")
    public Candidat extractFromCv(@RequestPart("Cv") MultipartFile cvFile) {
        try {
            logger.info("Début de l'extraction pour le fichier : {}", cvFile.getOriginalFilename());

            byte[] pdfContent = cvFile.getBytes();

            // Configurer le ProcessBuilder pour le script Python
            ProcessBuilder pb = new ProcessBuilder("python", "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\test2.py");
            Process process = pb.start();

            process.getOutputStream().write(pdfContent);
            process.getOutputStream().flush();
            process.getOutputStream().close();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            // Lire les erreurs
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            StringBuilder errorOutput = new StringBuilder();
            while ((line = errorReader.readLine()) != null) {
                errorOutput.append(line).append("\n");
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("Échec du script Python avec le code de sortie : " + exitCode + ", erreur : " + errorOutput.toString());
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode data = mapper.readTree(output.toString());
            if (data.has("error")) {
                throw new RuntimeException("Erreur lors de l'extraction : " + data.get("error").asText());
            }

            Candidat candidat = new Candidat();
            String name = data.get("name").asText(null);
            candidat.setNom(name != null ? name : "");
            candidat.setPrenom(name != null && name.contains(" ") ? name.split(" ")[0] : "");
            candidat.setEmail(data.get("email").asText(null));
            candidat.setTel(data.get("phone").asText(null));
            candidat.setAdresse(data.get("address").asText(null));
            candidat.setCvPath(""); // Pas de fichier temporaire

            logger.info("Extraction réussie : {}", candidat);
            return candidat;
        } catch (Exception e) {
            logger.error("Erreur lors de l'extraction : {}", e.getMessage(), e);
            throw   new RuntimeException("Erreur lors de l'extraction : " + e.getMessage());
        }
    }

    @PostMapping("/add")
    public Candidature addCandidature(
            @RequestParam Integer idOffre,
            @RequestParam("nom") String nom,
            @RequestParam("prenom") String prenom,
            @RequestParam("email") String email,
            @RequestParam("Tel") String tel,
            @RequestParam("adresse") String adresse,
            @RequestParam("keycloakId") String keycloakId,
            @RequestPart("Cv") MultipartFile cvFile) {

        logger.info("🎯 Réception candidature - Nom: {}, Prénom: {}, Email: {}", nom, prenom, email);

        try {
            // 🔹 ÉTAPE 1 : Créer le dossier de stockage si nécessaire
            File uploadFolder = new File(uploadsDir);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
                logger.info(" Dossier créé : {}", uploadsDir);
            }

            // 🔹 ÉTAPE 2 : Générer le nom du fichier CV
            String cleanNom = nom.trim().replaceAll("\\s+", "").toLowerCase();
            String cleanPrenom = prenom.trim().replaceAll("\\s+", "").toLowerCase();
            String finalFileName = cleanPrenom + "_" + cleanNom + ".pdf";
            String filePath = uploadsDir + finalFileName;

            logger.info(" Sauvegarde du CV : {}", filePath);
            File dest = new File(filePath);
            cvFile.transferTo(dest);

            // 🔹 ÉTAPE 3 : Vérifier si le candidat existe déjà
            Candidat existing = candidatRepo.findByKeycloakId(keycloakId).orElse(null);
            Candidat savedCandidat;

            if (existing != null) {
                logger.info("👤 Candidat existant trouvé : {}", existing.getEmail());
                savedCandidat = existing;
            } else {
                Candidat candidat = new Candidat();
                candidat.setNom(nom);
                candidat.setPrenom(prenom);
                candidat.setEmail(email);
                candidat.setTel(tel);
                candidat.setAdresse(adresse);
                candidat.setCvPath(finalFileName);
                candidat.setKeycloakId(keycloakId);

                savedCandidat = candidatService.addCondidature(candidat);
                logger.info(" Nouveau candidat créé avec ID : {}", savedCandidat.getId_candidature());
            }

            // 🔹 ÉTAPE 4 : Créer la candidature
            Candidature candidature = candidatureService.Postuler(savedCandidat.getId_candidature(), idOffre);
            logger.info(" Candidature créée avec ID : {}", candidature.getId());

            // 🔹 ÉTAPE 5 : DÉCLENCHER LE PROCESSUS CAMUNDA 8 (ZEEBE)
            logger.info(" Déclenchement du processus Camunda pour vérifier le CV...");

            Map<String, Object> processVariables = new HashMap<>();
            processVariables.put("cvPath", filePath);
            processVariables.put("nom", cleanNom);
            processVariables.put("prenom", cleanPrenom);
            processVariables.put("candidatId", savedCandidat.getId_candidature());
            processVariables.put("candidatureId", candidature.getId());

            try {
                zeebeClient.newCreateInstanceCommand()
                        .bpmnProcessId("cv_process")  // ID du processus dans le BPMN
                        .latestVersion()
                        .variables(processVariables)
                        .send()
                        .join();

                logger.info(" Processus Camunda démarré avec succès pour : {}", filePath);

            } catch (Exception e) {
                logger.error(" Erreur lors du démarrage du processus Camunda : {}", e.getMessage());
                // Ne pas bloquer la candidature si Camunda échoue
            }

            return candidature;

        } catch (Exception e) {
            logger.error(" Erreur dans /add : {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'ajout du candidat : " + e.getMessage());
        }
    }


    @GetMapping("/all")
    public List<Cv> getAllCandidats() {
        return cvService.getallcvLatex();
    }

    @GetMapping("/{idCandidat}/offres")
    public List<String> getOffresByCandidat(@PathVariable Integer idCandidat) {
    List<Candidature> candidatures = candidatureRepo.findByCandidatId(idCandidat);
        return candidatures.stream()
                .map(c -> c.getOffre() != null ? c.getOffre().getTitreOffre() : "N/A")
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     *  Récupère le dernier score vidéo du candidat
     */
    @GetMapping("/{idCandidat}/videoScore")
    public Double getVideoScore(@PathVariable Integer idCandidat) {
        List<PreInterview> videos = preInterviewRepo.findByCandidatId(idCandidat);
        if (videos.isEmpty()) return null;

        return videos.stream()
                .sorted((v1, v2) -> v2.getDateEnregistrement().compareTo(v1.getDateEnregistrement()))
                .map(PreInterview::getFinalScore)
                .findFirst()
                .orElse(null);
    }

    /**
     *  Récupère le chemin de la dernière vidéo enregistrée
     */
    @GetMapping("/{idCandidat}/videoPath")
    public String getVideoPath(@PathVariable Integer idCandidat) {
        List<PreInterview> videos = preInterviewRepo.findByCandidatId(idCandidat);
        if (videos.isEmpty()) return null;

        return videos.stream()
                .sorted((v1, v2) -> v2.getDateEnregistrement().compareTo(v1.getDateEnregistrement()))
                .map(PreInterview::getVideoPath)
                .findFirst()
                .orElse(null);
    }


    @GetMapping("/history")
    public List<CandidateHistoryDTO> getAllHistories() {

        return candidatService.getAllCandidatesHistory();
    }
    @GetMapping("/byName/{nom}/{prenom}")
    public ResponseEntity<Integer> getCandidateIdByName(@PathVariable String nom, @PathVariable String prenom) {
        Optional<Candidat> candidats = candidatService.getCandidatByName(nom, prenom);  // Use service method
        if (candidats.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        // Return first match (assume unique name; adjust if multiple)
        Integer id = candidats.get().getId_candidature();
        return ResponseEntity.ok(id);
    }
    @GetMapping("/{id}/history")
    public CandidateHistoryDTO getHistoryById(@PathVariable Integer id) {
        return candidatService.getCandidateHistory(id);
    }
}


