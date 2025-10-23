package com.example.projetpfe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CandidatePreInterview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idCPreinterview;

    private String email;
    private String nom;
    private String prenom;
    private Integer offreId;
    private String offreTitre;

    private boolean videoSaved = false;

    @ManyToOne
    @JoinColumn(name = "candidature_id")
    @JsonIgnore
    private Candidature candidature;
}
