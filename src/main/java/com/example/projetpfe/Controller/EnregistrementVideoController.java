    package com.example.projetpfe.Controller;

    import com.example.projetpfe.Repository.CandidatRepo;
    import com.example.projetpfe.Repository.CandidatePreInterviewRepo;
    import com.example.projetpfe.Repository.CandidatureRepo;
    import com.example.projetpfe.Repository.PreInterviewRepo;
    import com.example.projetpfe.Services.VideoService;
    import com.example.projetpfe.entity.Candidat;
    import com.example.projetpfe.entity.CandidatePreInterview;
    import com.example.projetpfe.entity.Candidature;
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
    import java.util.Optional;
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
        @Autowired
        private CandidatePreInterviewRepo candidatePreInterviewRepo;

        @Autowired
        private CandidatureRepo candidatureRepo;
        private static final String UPLOAD_DIR = "C:/Uploads/";

        @PostMapping("/upload")
        public ResponseEntity<String> uploadVideo(
                @RequestParam("file") MultipartFile file,
                @RequestParam("nom") String nom,
                @RequestParam("prenom") String prenom,
                @RequestParam("offreId") Integer offreId,
                @RequestParam("email") String email) {

            try {
                Path uploadDir = Paths.get(UPLOAD_DIR + offreId + "/");
                if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

                if (file.isEmpty()) return ResponseEntity.status(400).body("Le fichier est vide");

                String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                Path path = uploadDir.resolve(fileName);
                Files.write(path, file.getBytes());

                Optional<Candidat> candidatOpt = Optional.ofNullable(candidatRepository.findByEmail(email));
                if (candidatOpt.isEmpty()) {
                    return ResponseEntity.status(404).body("Candidat introuvable avec l'email : " + email);
                }
                Candidat candidat = candidatOpt.get();

                List<CandidatePreInterview> records = candidatePreInterviewRepo.findByOffreIdAndEmail(offreId, email);
                if (records.isEmpty()) {
                    throw new RuntimeException("Aucun pré-entretien trouvé !");
                }

                CandidatePreInterview record = records.get(records.size() - 1);

                // Lier candidature
                if (record.getCandidature() == null) {
                    Candidature candidature = candidatureRepo.findByCandidatEmailAndOffreId(email, offreId);
                    record.setCandidature(candidature);
                }

                record.setVideoSaved(true);
                candidatePreInterviewRepo.save(record);

                PreInterview preInterview = new PreInterview();
                preInterview.setNom(nom);
                preInterview.setPrenom(prenom);
                preInterview.setDateEnregistrement(LocalDateTime.now());
                preInterview.setVideoPath(path.toString());
                preInterview.setCandidat(candidat);
                preInterview.setCandidature(record.getCandidature());

                preInterviewRepository.save(preInterview);

                return ResponseEntity.ok("Vidéo enregistrée et PreInterview créé avec succès !");
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
            }
        }

        @PostMapping("/process")
        public ResponseEntity<String> processVideos(@RequestParam("offreId") Integer offreId) {
            try {
                String videoDirPath = "C:/Uploads/" + offreId + "/";

                List<PreInterview> processedVideos = videoService.processVideos(videoDirPath, offreId);

                return ResponseEntity.ok("Traitement terminé pour " + processedVideos.size() + " vidéos !");
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(500).body("Erreur lors du traitement : " + e.getMessage());
            }
        }


        }