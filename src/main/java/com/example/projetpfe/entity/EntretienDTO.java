package com.example.projetpfe.entity;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;

@Data
public class EntretienDTO {
    private Integer candidatId;
    private String managerId;  // id keycloak
    private Date dateEntretien;
    private String commentaire;
    private double minScore = 55;
}
