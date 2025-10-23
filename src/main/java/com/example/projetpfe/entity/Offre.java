package com.example.projetpfe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Offre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idOffre;
    private String titreOffre;
    @Column(columnDefinition = "TEXT")
    private String descriptionJob;
    @Column(columnDefinition = "TEXT")
    private String competencesTechniques;
    @Column(columnDefinition = "TEXT")
    private String profilRecherche;
    private Integer nbreDePoste;
    private boolean enable ;
    @OneToMany(mappedBy = "offre", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Candidature> candidatures = new ArrayList<>();

}
