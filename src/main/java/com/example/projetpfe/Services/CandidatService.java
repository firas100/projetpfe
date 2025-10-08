package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.CvRepo;
import com.example.projetpfe.Repository.EntretienRepo;
import com.example.projetpfe.Repository.RecommendationRepo;
import com.example.projetpfe.entity.Candidat;

import com.example.projetpfe.entity.Recommendation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service

public class CandidatService {
    private static final double MIN_SCORE = 55;
    @Autowired
    private RecommendationRepo recommendationRepo;

    @Autowired
    private CandidatRepo condidatRepo;
    @Autowired
    EntretienRepo entretienRepo;
    @Autowired
    private CvRepo cvRepo;

    public Candidat addCondidature(Candidat candidat) {
        return condidatRepo.save(candidat);
    }

    public List<Candidat> getAllCandidats() {
        return entretienRepo.findCandidatsWithHighScore(MIN_SCORE);
    }


    public Candidat getCandidatById(Integer id) {
        return condidatRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidat non trouvé avec id: " + id));
    }

    public List<Candidat> getCandidatesWithScoreAbove(double threshold) {
        List<Recommendation> recommendations = recommendationRepo.findBySimilarityScoreGreaterThan(threshold);
        return recommendations.stream()
                .map(Recommendation::getCandidat) // Supposant que Recommendation a une relation avec Candidat
                .collect(Collectors.toList());
    }
   /* public Candidat getTopScoredCandidat() {
        Optional<Recommendation> topRecommendation = recommendationRepo.findTopByOrderBySimilarityScoreDesc();
        return topRecommendation.map(recommendation -> condidatRepo.findById(recommendation.getCandidat().getId_candidature())
                .orElse(null)).orElse(null);
    }*/

    public List<Candidat> getcandidat(){
        return condidatRepo.findAll();
    }

}

