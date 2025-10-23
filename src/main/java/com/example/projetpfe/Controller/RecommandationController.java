package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.RecommendationService;
import com.example.projetpfe.entity.Recommendation;
import com.example.projetpfe.entity.RecommendationDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommandationController {
    private final RecommendationService service;

    public RecommandationController(RecommendationService service) {
        this.service = service;
    }

    @PostMapping("/generateByOffre")
    public ResponseEntity<?> startRecommandationByOffre(@RequestParam Integer offreId, @RequestParam int experienceMin){
        try {
            service.executerRecommandationParOffre(offreId, experienceMin);
            return ResponseEntity.ok("Recommandation terminée avec succès.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("erreur :" + e.getMessage());
        }
    }

    @GetMapping("/getAllRecommender")
    public List<RecommendationDTO> getall(){
        return service.findAllCandidatsWithScores();
    }
    @GetMapping("/filter")
    public List<RecommendationDTO> getFilteredRecommendations(
            @RequestParam(required = false) Double minScore,
            @RequestParam(required = false) String titreOffre) {

        return service.getRecommendationsFiltered(minScore, titreOffre);
    }

}
