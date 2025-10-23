package com.example.projetpfe.entity;

import lombok.Data;

import java.time.LocalDateTime;
@Data
public class HistoryDTO {
    private Integer candidatureId;
    private LocalDateTime dateCandidature;
    private String statutCandidature;
    private String titreOffre;
    private Integer idOffre;
    private Double cvScore;
    private Integer yearsOfExperience;
    private Double videoScore;
    private String interviewStatus;
    private String commentaire;
    private String cvPath ;
    private String videoPath;

}
