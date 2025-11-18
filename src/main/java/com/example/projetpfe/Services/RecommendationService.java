package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.*;
import com.example.projetpfe.entity.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    private final CandidatRepo candidatRepo;
    private final RecommendationRepo recommendationRepo;
    private final PreInterviewRepo preInterviewRepo;
    private final OffreRepo offreRepo;
    private final CandidatureRepo candidatureRepo ;

    @Value("${python.script.path:C:\\Users\\Firas kdidi\\Desktop\\Pfe\\system-recommandation.py}")
    private String pythonScriptPath;

    public RecommendationService(CandidatRepo candidatRepo, RecommendationRepo recommendationRepo,
                                 PreInterviewRepo preInterviewRepo, OffreRepo offreRepo,
                                 CandidatureRepo candidatureRepo) {
        this.candidatRepo = candidatRepo;
        this.recommendationRepo = recommendationRepo;
        this.preInterviewRepo = preInterviewRepo;
        this.offreRepo = offreRepo;
        this.candidatureRepo = candidatureRepo;
    }

    private static final Logger logger = LoggerFactory.getLogger(RecommendationService.class);


    public List<Map<String, Object>> executerRecommandationParOffre(Integer offreId, int experienceMin)
            throws IOException, InterruptedException {

        // 1️⃣ Récupération de l'offre
        Offre offre = offreRepo.findById(offreId)
                .orElseThrow(() -> new RuntimeException("Offre introuvable pour l'id " + offreId));

        // 2️⃣ Vérifier si l'offre a des candidatures
        List<Candidature> candidatsPourOffre = candidatureRepo.findByOffre(offre); // ⚠️ nécessite une méthode dans CandidatRepo
        if (candidatsPourOffre == null || candidatsPourOffre.isEmpty()) {
            logger.warn("Aucune candidature trouvée pour l'offre ID: {}", offreId);
            throw new RuntimeException("Aucune candidature trouvée pour cette offre.");
        }

        // 3️⃣ Construire les mots-clés pour le script Python
        String keywords = String.join(". ",
                offre.getDescriptionJob(),
                offre.getCompetencesTechniques(),
                offre.getProfilRecherche());

        // 4️⃣ Écrire dans un fichier temporaire
        File tempFile = new File("temp_keywords.txt");
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(tempFile), "UTF-8"))) {
            writer.write(keywords);
        }

        // 5️⃣ Exécuter le script Python
        ProcessBuilder builder = new ProcessBuilder("python", pythonScriptPath, tempFile.getAbsolutePath(), String.valueOf(experienceMin));
        builder.environment().put("PYTHONIOENCODING", "utf-8");
        builder.redirectErrorStream(true);
        Process process = builder.start();

        // 6️⃣ Lire la sortie JSON
        String jsonOutput;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"))) {
            jsonOutput = reader.lines().collect(Collectors.joining("\n"));
        }
        logger.info("Python script output: {}", jsonOutput);

        // 7️⃣ Vérifier le code de sortie
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Python script failed with exit code " + exitCode + ". Output: " + jsonOutput);
        }

        // 8️⃣ Sauvegarder et retourner la liste
        List<Map<String, Object>> recommandations = saveRecommendationsFromJson(jsonOutput, offreId);
        tempFile.delete();

        return recommandations;
    }


    private List<Map<String, Object>> saveRecommendationsFromJson(String jsonOutput, Integer offreId) throws IOException {  // Add offreId param
        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> recommandations = mapper.readValue(jsonOutput, new TypeReference<>() {
        });

        // Déduppliquer par nom pour éviter les duplicates
        List<Map<String, Object>> uniqueRecommandations = recommandations.stream()
                .distinct()
                .collect(Collectors.toList());

        logger.info("Processing {} unique recommendations from Python for Offre ID: {}", uniqueRecommandations.size(), offreId);

        Offre offre = offreRepo.findById(offreId)
                .orElseThrow(() -> new RuntimeException("Offre introuvable pour l'id " + offreId));

        for (Map<String, Object> recMap : uniqueRecommandations) {
            if (recMap.containsKey("error")) {
                logger.error("Python error: {}", recMap.get("error"));
                throw new RuntimeException("Python error: " + recMap.get("error"));
            }

            String fullName = (String) recMap.get("Name");
            String cvPath = (String) recMap.get("CV");
            String nom = "";
            String prenom = "";
            if (fullName != null && !fullName.isEmpty()) {
                String[] parts = fullName.trim().split("\\s+");
                nom = parts[0].toLowerCase().trim();
                prenom = parts.length > 1 ? parts[1].toLowerCase().trim() : "";
            }
            logger.info("Searching Candidat for nom: {}, prenom: {}", nom, prenom);

            // Essayer d'abord case-sensitive
            List<Candidat> candidats = candidatRepo.findByNomEtPrenom(prenom, nom);

            // Si pas trouvé, essayer case-insensitive
            if (candidats.isEmpty()) {
                logger.warn("No exact match for: {} {}. Trying case-insensitive...", nom, prenom);
                candidats = candidatRepo.findByNomEtPrenom(prenom, nom);
            }

            if (candidats.isEmpty()) {
                logger.warn("No match found for: {} {}", nom, prenom);
                continue;  // Skip this rec
            }

            // Prendre le premier match
            Candidat c = candidats.get(0);

            // Vérifier si recommendation existe déjà pour ce candidat ET cette offre
            Optional<Recommendation> existingRec = recommendationRepo.findByCandidatAndOffre(c, offre);
            if (existingRec.isPresent()) {
                logger.info("Recommendation already exists for Candidat ID: {} and Offre ID: {}. Updating similarity.", c.getId_candidature(), offreId);
                Recommendation recommendationEntity = existingRec.get();
                recommendationEntity.setSimilarityScore(((Number) recMap.get("Similarity_Score")).doubleValue());
                recommendationEntity.setYearsOfExperience(((Number) recMap.get("Years_of_Experience")).intValue());
                recommendationRepo.save(recommendationEntity);  // Update existing
            } else {
                // Create new with link to offre
                Recommendation recommendation = new Recommendation();
                recommendation.setCandidat(c);
                recommendation.setOffre(offre);  // Link to the specific offre
                double similarity = ((Number) recMap.get("Similarity_Score")).doubleValue();
                if (similarity > 1.0) similarity = 1.0;
                recommendation.setSimilarityScore(similarity);
                recommendation.setYearsOfExperience(((Number) recMap.get("Years_of_Experience")).intValue());
                recommendationRepo.save(recommendation);
                logger.info("Saved new recommendation for Candidat ID: {} and Offre ID: {} with Similarity: {}", c.getId_candidature(), offreId, similarity);
            }
        }
        return recommandations;
    }

    public List<Recommendation> findall() {
        return recommendationRepo.findAll();
    }

    public List<RecommendationDTO> findAllCandidatsWithScores() {
        // Récupérer tous les candidats pour afficher tous, même sans recommendation
        List<Candidat> allCandidats = candidatRepo.findAll();

        List<RecommendationDTO> result = new ArrayList<>();

        for (Candidat c : allCandidats) {
            // Récupérer les recommendations pour ce candidat (peut en avoir plusieurs par offre)
            List<Recommendation> recs = recommendationRepo.findByCandidat(c);

            if (!recs.isEmpty()) {
                for (Recommendation rec : recs) {
                    RecommendationDTO dto = new RecommendationDTO();
                    dto.setId(rec.getIdRecommendation());
                    dto.setNom(c.getNom());
                    dto.setPrenom(c.getPrenom());
                    dto.setYearsOfExperience(rec.getYearsOfExperience());
                    dto.setSimilarityScore(rec.getSimilarityScore());
                    dto.setIdOffre(rec.getOffre().getIdOffre());
                    dto.setTitreOffre(rec.getOffre() != null ? rec.getOffre().getTitreOffre() : "Aucune offre");

                    // Ajouter le score final du pré-entretien (vidéo) spécifique à l'offre
                    PreInterview pre = preInterviewRepo.findTopByCandidatAndCandidatureOffreOrderByDateEnregistrementDesc(c, rec.getOffre());
                    dto.setFinalScore(pre != null ? pre.getFinalScore() : null);

                    result.add(dto);
                }
            } else {
                // Candidat sans recommendation : afficher avec valeurs null pour les champs de recommendation
                RecommendationDTO dto = new RecommendationDTO();
                dto.setId(null);
                dto.setNom(c.getNom());
                dto.setPrenom(c.getPrenom());
                dto.setYearsOfExperience(null);
                dto.setSimilarityScore(null);
                dto.setIdOffre(null);
                dto.setTitreOffre("Aucune offre");

                // Pour les candidats sans rec, pas de score vidéo spécifique
                dto.setFinalScore(null);

                result.add(dto);
            }
        }

        return result;
    }

    public List<RecommendationDTO> getRecommendationsFiltered(
            Double minScore, String titreOffre) {

        // Récupération de tous les candidats + recommendations (inclut ceux sans rec)
        List<RecommendationDTO> all = findAllCandidatsWithScores();

        // Application des filtres si demandés
        return all.stream()
                .filter(dto -> minScore == null || (dto.getSimilarityScore() != null && dto.getSimilarityScore() >= minScore))
                .filter(dto -> titreOffre == null || titreOffre.equalsIgnoreCase("Tous") ||
                        (dto.getTitreOffre() != null && dto.getTitreOffre().equalsIgnoreCase(titreOffre)))
                .collect(Collectors.toList());
    }

}