package com.example.projetpfe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Candidature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private LocalDateTime dateCandidature = LocalDateTime.now();

    private String statut = "EN_ATTENTE";

    @ManyToOne
    @JoinColumn(name = "candidat_id")
    @JsonIgnore
    private Candidat candidat;

    @ManyToOne
    @JoinColumn(name = "offre_id")
    @JsonIgnore
    private Offre offre;



}
