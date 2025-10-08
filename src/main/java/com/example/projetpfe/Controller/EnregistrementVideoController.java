package com.example.projetpfe.Controller;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.PreInterviewRepo;
import com.example.projetpfe.Services.VideoService;
import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.PreInterview;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/video")
public class EnregistrementVideoController {

    @Autowired
    private CandidatRepo candidatRepository;

    @Autowired
    private PreInterviewRepo preInterviewRepository;

    @Autowired
    private VideoService videoService;
    private static final String UPLOAD_DIR = "C:/Uploads/";

    @PostMapping("/upload")
    public ResponseEntity<String> uploadVideo(@RequestParam("file") MultipartFile file, @RequestParam("nom") String nom,
                                              @RequestParam("prenom") String prenom) {
        try {

            Path uploadDir = Paths.get(UPLOAD_DIR);
            System.out.println("Chemin du dossier uploads : " + uploadDir.toAbsolutePath());
            if (!Files.exists(uploadDir)) {
                try {
                    Files.createDirectories(uploadDir);
                    System.out.println("Dossier uploads créé : " + uploadDir);

                } catch (IOException e) {
                    e.printStackTrace();
                    return ResponseEntity.status(500).body("Erreur lors de la création du dossier : " + e.getMessage());
                }
            }


            if (file.isEmpty()) {
                return ResponseEntity.status(400).body("Erreur : Le fichier est vide");
            }


            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path path = Paths.get(UPLOAD_DIR + fileName);
            Files.write(path, file.getBytes());

            Candidat candidat = candidatRepository.findByNomAndPrenom(nom, prenom).orElse(null);

            PreInterview preInterview = new PreInterview();
            preInterview.setNom(nom);
            preInterview.setPrenom(prenom);
            preInterview.setDateEnregistrement(LocalDateTime.now());
            preInterview.setVideoPath(path.toString());
            preInterview.setCandidat(candidat);


            preInterviewRepository.save(preInterview);
            return ResponseEntity.ok("Vidéo enregistrée et pré-entretien sauvegardé !");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de l'enregistrement :  " + e.getMessage());
        }
    }

    @PostMapping("/process")
    public ResponseEntity<String> processVideos() {
        try {
            // Chemin du dossier contenant les vidéos uploadées
            String videoDirPath = "C:/Uploads/";

            // Appel du service qui exécute le script Python
            List<PreInterview> processedVideos = videoService.processVideos(videoDirPath);

            return ResponseEntity.ok("Traitement terminé pour " + processedVideos.size() + " vidéos !");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors du traitement : " + e.getMessage());
        }
    }


}