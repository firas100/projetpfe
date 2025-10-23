    package com.example.projetpfe.Controller;

    import com.example.projetpfe.Services.CandidatureService;
    import com.example.projetpfe.entity.Candidature;
    import com.example.projetpfe.entity.CandidatureDTO;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.web.bind.annotation.GetMapping;
    import org.springframework.web.bind.annotation.RequestParam;
    import org.springframework.web.bind.annotation.RestController;

    import java.util.List;

    @RestController
    public class CandidatureController {
        @Autowired
        CandidatureService candidatureService;

        @GetMapping("/GetMesCandidature")
        public List<CandidatureDTO> getMesCandidatures(@RequestParam String keycloakId) {
            return candidatureService.getByKeycloakId(keycloakId);
        }

    }
