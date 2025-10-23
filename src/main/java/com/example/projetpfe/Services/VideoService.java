package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.PreInterviewRepo;
import com.example.projetpfe.entity.PreInterview;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class VideoService {

    @Autowired
    private PreInterviewRepo preInterviewRepository;

    public List<PreInterview> processVideos(String videoDirPath, Integer offreId) throws Exception {
        List<PreInterview> processedVideos = new ArrayList<>();

        ProcessBuilder pb = new ProcessBuilder(
                "python",
                "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\Traitementdesvideo.py",
                videoDirPath
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();

        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        String jsonString = "";

        while ((line = reader.readLine()) != null) {
            if (line.startsWith("[INFO]") || line.startsWith("[ERROR]")) {
                System.out.println(line);
            } else if (!line.trim().isEmpty()) {
                jsonString = line;
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Erreur Python : code de sortie " + exitCode);
        }

        if (jsonString.isEmpty()) {
            throw new RuntimeException("Aucune sortie JSON valide détectée du script Python");
        }

        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> results = mapper.readValue(jsonString, List.class);

        for (Map<String, Object> result : results) {
            String nom = (String) result.get("nom");
            String prenom = (String) result.get("prenom");
            Double finalScore = result.get("final_score") != null ? ((Number) result.get("final_score")).doubleValue() : null;

            if (nom != null && prenom != null && finalScore != null) {
                List<PreInterview> pres = preInterviewRepository.findByPrenomAndNomAndOffreId(prenom, nom, offreId);
                if (pres.isEmpty()) {
                    // Essayer avec inversion
                    pres = preInterviewRepository.findByPrenomAndNomAndOffreId(nom, prenom, offreId);
                }
                if (!pres.isEmpty()) {
                    PreInterview pre = pres.get(pres.size() - 1);
                    pre.setFinalScore(finalScore);
                    preInterviewRepository.save(pre);
                    processedVideos.add(pre);
                } else {
                    System.out.println("[WARN] Aucun PreInterview trouvé pour " + nom + " " + prenom + " et offreId " + offreId);
                }
            }
        }

        System.out.println("JSON parsed: " + jsonString);

        return processedVideos;
    }
}