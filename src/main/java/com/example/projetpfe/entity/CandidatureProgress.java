package com.example.projetpfe.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CandidatureProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idCandidatureProgress;

    private String currentStep;
    private String description;

    @OneToOne
    @JoinColumn(name = "candidature_id")
    private Candidature candidature;
}
