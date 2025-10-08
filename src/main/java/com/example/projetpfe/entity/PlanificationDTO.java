package com.example.projetpfe.entity;

import lombok.Data;

import java.util.Date;

@Data
public class PlanificationDTO {
    private String managerId;
    private Date dateEntretien;
    private double minScore = 55;
}