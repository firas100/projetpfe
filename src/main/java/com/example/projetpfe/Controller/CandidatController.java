package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.CandidatService;
import com.example.projetpfe.Services.CvService;
import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Cv;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/Candidature")
public class CandidatController {
    private static final Logger logger = LoggerFactory.getLogger(CandidatController.class);

    @Autowired
    CandidatService candidatService;

    @Autowired
    CvService cvService;

    private final String uploadsDir = "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\";

    @PostMapping("/extract")
    public Candidat extractFromCv(@RequestPart("Cv") MultipartFile cvFile) {
        try {
            logger.info("Début de l'extraction pour le fichier : {}", cvFile.getOriginalFilename());

            // Ne pas sauvegarder le fichier, utiliser directement les données
            byte[] pdfContent = cvFile.getBytes();

            // Configurer le ProcessBuilder pour le script Python
            ProcessBuilder pb = new ProcessBuilder("python", "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\test2.py");
            Process process = pb.start();

            // Écrire le contenu du PDF dans stdin du processus Python
            process.getOutputStream().write(pdfContent);
            process.getOutputStream().flush();
            process.getOutputStream().close();

            // Lire la sortie du script
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

            // Parser la sortie JSON
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
    public Candidat addCandidature(
            @RequestParam("nom") String nom,
            @RequestParam("prenom") String prenom,
            @RequestParam("email") String email,
            @RequestParam("Tel") String Tel,
            @RequestParam("adresse") String adresse,
            @RequestPart("Cv") MultipartFile cvFile) {
        logger.info("Received request to /Candidature/add with nom: {}, prenom: {}, email: {}, Tel: {}, adresse: {}", nom, prenom, email, Tel, adresse);
        try {
            File uploadFolder = new File(uploadsDir);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
                logger.info("Created upload folder: {}", uploadsDir);
            }

            String cleanNom = nom.trim().replaceAll("\\s+", "").toLowerCase();
            String cleanPrenom = prenom.trim().replaceAll("\\s+", "").toLowerCase();
            String finalFileName = cleanPrenom + "_" + cleanNom + ".pdf";
            String filePath = uploadsDir + finalFileName;

            logger.info("Saving CV file to: {}", filePath);
            File dest = new File(filePath);
            cvFile.transferTo(dest);

            Candidat candidat = new Candidat();
            candidat.setNom(nom);
            candidat.setPrenom(prenom);
            candidat.setEmail(email);
            candidat.setTel(Tel);
            candidat.setAdresse(adresse);
            candidat.setCvPath(finalFileName);

            logger.info("Saving candidat: {}", candidat);
            Candidat savedCandidat = candidatService.addCondidature(candidat);
            logger.info("Candidat saved successfully: {}", savedCandidat);
            return savedCandidat;
        } catch (Exception e) {
            logger.error("Error in /add: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'ajout du candidat : " + e.getMessage());
        }
    }


}