package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.CandidatureProgressService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")

public class CandidatureProgressController {

    private CandidatureProgressService progressService;

    public CandidatureProgressController(CandidatureProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/{candidatureId}")
    public Map<String, Object> getProgress(@PathVariable Integer candidatureId,
                                           @RequestParam(defaultValue = "0.6") double minScore) {
        String currentStep = progressService.updateCandidatureProgress(candidatureId, minScore);

        Map<String, Object> response = new HashMap<>();
        response.put("currentStep", currentStep);
        response.put("steps", List.of(
                Map.of("id", 1, "label", "Candidature enregistrée", "code", "CANDIDATURE_ENREGISTREE"),
                Map.of("id", 2, "label", "Analyse du CV", "code", "CV_ANALYSE"),
                Map.of("id", 3, "label", "Pré-entretien vidéo", "code", "PREINTERVIEW_TERMINEE"),
                Map.of("id", 4, "label", "Entretien manager", "code", "ENTRETIEN_PLANIFIE")
        ));
        return response;
    }


}
