package com.example.projetpfe.entity;

import lombok.Data;

import java.util.Date;

@Data
public class EntretienPlanifierparOffreDTO {
    private Integer offreId;
    private String managerId;
    private Date dateEntretien;
    private String commentaire;
    private String status ;
    private double minScore = 55;
}
