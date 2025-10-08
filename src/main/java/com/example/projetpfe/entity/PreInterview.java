package com.example.projetpfe.entity;

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
public class PreInterview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nom;
    private String prenom;
    private LocalDateTime dateEnregistrement;
    private Double finalScore;

    private String videoPath; // chemin de la vidéo stockée

    @ManyToOne
    @JoinColumn(name = "candidat_id") // clé étrangère vers la table Candidat
    private Candidat candidat;

}
