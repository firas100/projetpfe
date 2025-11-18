package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.RecommendationService;
import com.example.projetpfe.entity.Recommendation;
import com.example.projetpfe.entity.RecommendationDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
            List<Map<String, Object>> result = service.executerRecommandationParOffre(offreId, experienceMin);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            // Gestion d'erreur logique
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur serveur : " + e.getMessage());
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
