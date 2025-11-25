package com.example.projetpfe.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CandidatureDTO {
    private Integer id;
    private Integer id_candidature;
    private LocalDateTime dateCandidature;
    private String titreOffre;
    private Integer idOffre;
    private Double scoreCv;
    private LocalDateTime dateAnalyseCv;
    private Double scoreVideo;
    private LocalDateTime dateTraitementVideo;
    private String statusEntretien;  // De l'Entretien
    private LocalDateTime dateEntretien;
    public CandidatureDTO(Candidature candidature) {
        this.id_candidature = candidature.getId();
        this.id = candidature.getId();
        this.dateCandidature = candidature.getDateCandidature();
        this.titreOffre = (candidature.getOffre() != null) ? candidature.getOffre().getTitreOffre() : "N/A";

        this.idOffre = (candidature.getOffre() != null) ? candidature.getOffre().getIdOffre() : null;
    }

    public CandidatureDTO(Integer id, Integer id_candidature, LocalDateTime dateCandidature, String titreOffre, Integer idOffre, Double scoreCv, LocalDateTime dateAnalyseCv, Double scoreVideo, LocalDateTime dateTraitementVideo, String statusEntretien, LocalDateTime dateEntretien) {
        this.id = id;
        this.id_candidature = id_candidature;
        this.dateCandidature = dateCandidature;
        this.titreOffre = titreOffre;
        this.idOffre = idOffre;
        this.scoreCv = scoreCv;
        this.dateAnalyseCv = dateAnalyseCv;
        this.scoreVideo = scoreVideo;
        this.dateTraitementVideo = dateTraitementVideo;
        this.statusEntretien = statusEntretien;
        this.dateEntretien = dateEntretien;
    }
}
