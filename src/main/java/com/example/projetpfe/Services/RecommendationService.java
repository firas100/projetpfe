package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.PreInterviewRepo;
import com.example.projetpfe.Repository.RecommendationRepo;
import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.PreInterview;
import com.example.projetpfe.entity.Recommendation;
import com.example.projetpfe.entity.RecommendationDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    private final CandidatRepo candidatRepo;
    private final RecommendationRepo recommendationRepo;

    private final PreInterviewRepo  preInterviewRepo;

    @Value("${python.script.path:C:\\Users\\Firas kdidi\\Desktop\\Pfe\\system-recommandation.py}")
    private String pythonScriptPath;

    public RecommendationService(CandidatRepo candidatRepo, RecommendationRepo recommendationRepo, PreInterviewRepo preInterviewRepo) {
        this.candidatRepo = candidatRepo;
        this.recommendationRepo = recommendationRepo;
        this.preInterviewRepo = preInterviewRepo;

    }

    public void executerRecommandation(String keywords, int experienceMin) throws IOException, InterruptedException {
        File tempFile = new File("temp_keywords.txt");
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(tempFile), "UTF-8"))) {
            writer.write(keywords);
        }

        ProcessBuilder builder = new ProcessBuilder("python",
                pythonScriptPath,
                tempFile.getAbsolutePath(),
                String.valueOf(experienceMin));

        builder.environment().put("PYTHONIOENCODING", "utf-8");
        builder.redirectErrorStream(true); // Combine stdout et stderr

        Process process = builder.start();

        String jsonOutput;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"))) {
            jsonOutput = reader.lines().collect(Collectors.joining("\n"));
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Python script failed with exit code " + exitCode + ". Output: " + jsonOutput);
        }

        if (jsonOutput.isEmpty() || (!jsonOutput.startsWith("[") && !jsonOutput.startsWith("{"))) {
            throw new RuntimeException("Invalid JSON output from Python script: " + jsonOutput);
        }

        ObjectMapper mapper = new ObjectMapper();
        try {
            List<Map<String, Object>> recommandations = mapper.readValue(jsonOutput, new TypeReference<>() {});
            for (Map<String, Object> rec : recommandations) {
                if (rec.containsKey("error")) {
                    throw new RuntimeException("Python script returned error: " + rec.get("error"));
                }

                String fullName = (String) rec.get("Name");
                String cvPath = (String) rec.get("CV");
                String nom = "";
                String prenom = "";
                if (fullName != null && !fullName.isEmpty()) {
                    String[] nameParts = fullName.trim().split("\\s+", 2);
                    nom = nameParts[0].toLowerCase();
                    prenom = (nameParts.length > 1) ? nameParts[1].toLowerCase() : nameParts[0].toLowerCase();
                }

                List<Candidat> candidats = candidatRepo.findByNomEtPrenom(nom, prenom);
                for (Candidat candidat : candidats) {
                    Optional<Recommendation> existingRecommendation = recommendationRepo.findByCandidat(candidat);
                    Recommendation recommendation;
                    if (existingRecommendation.isPresent()) {
                        // Mettre à jour la recommandation existante
                        recommendation = existingRecommendation.get();
                        recommendation.setSimilarityScore(((Number) rec.get("Similarity_Score")).doubleValue());
                        recommendation.setYearsOfExperience(((Number) rec.get("Years_of_Experience")).intValue());
                    } else {
                        // Créer une nouvelle recommandation
                        recommendation = new Recommendation();
                        recommendation.setCandidat(candidat);
                        recommendation.setSimilarityScore(((Number) rec.get("Similarity_Score")).doubleValue());
                        recommendation.setYearsOfExperience(((Number) rec.get("Years_of_Experience")).intValue());
                    }

                    recommendationRepo.save(recommendation);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse JSON: " + e.getMessage() + ". Output: " + jsonOutput);
        } finally {
            tempFile.delete();
        }
    }

    public List<Recommendation> findall() {
        return recommendationRepo.findAll();
    }

    public List<RecommendationDTO> findAllCandidatsWithScores() {
        List<Candidat> candidats = candidatRepo.findAll(); // Tous les candidats, même sans recommandation

        return candidats.stream().map(c -> {
            RecommendationDTO dto = new RecommendationDTO();
            dto.setNom(c.getNom());
            dto.setPrenom(c.getPrenom());
            dto.setId(null); // Pas de recommendation, donc id null

            // Vérifier s'il existe une recommendation
            Optional<Recommendation> recOpt = recommendationRepo.findByCandidat(c);
            if (recOpt.isPresent()) {
                Recommendation rec = recOpt.get();
                dto.setId(rec.getIdRecommendation());
                dto.setSimilarityScore(rec.getSimilarityScore());
                dto.setYearsOfExperience(rec.getYearsOfExperience());
            }

            // Vérifier s'il existe un PreInterview pour le candidat
            PreInterview pre = preInterviewRepo.findTopByCandidatOrderByDateEnregistrementDesc(c);
            if (pre != null) {
                dto.setFinalScore(pre.getFinalScore());
            }

            return dto;
        }).collect(Collectors.toList());
    }

}
