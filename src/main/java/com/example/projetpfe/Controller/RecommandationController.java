package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.RecommendationService;
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

    @PostMapping("/generate")
    public ResponseEntity<?> startRecommandation(@RequestParam String keywords,@RequestParam int experienceMin){
        try {
            service.executerRecommandation(keywords, experienceMin);
            return ResponseEntity.ok("Recommandation terminée avec succès.");
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("erreur :" + e.getMessage());
        }
    }

    @GetMapping("/getAllRecommender")
    public List<RecommendationDTO> getall(){
        return service.findAllCandidatsWithScores();
    }

}
