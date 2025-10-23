package com.example.projetpfe.entity;

import java.time.LocalDateTime;

public class CandidateEmailDTO {
    private String nom;
    private String prenom;
    private String email;
    private String titreOffre;
    private LocalDateTime dateCandidature;
    private Double finalScore;
    private Integer idOffre;
    private Integer candidatId;

    
    public CandidateEmailDTO(Integer idCandidature, String nom, String prenom, String email, LocalDateTime dateCandidature, Double finalScore) {
        this.candidatId = idCandidature;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.titreOffre = titreOffre;
        this.dateCandidature = dateCandidature;
        this.finalScore = finalScore;
        this.idOffre = idOffre;
        this.candidatId = candidatId;
    }


    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTitreOffre() {
        return titreOffre;
    }

    public void setTitreOffre(String titreOffre) {
        this.titreOffre = titreOffre;
    }
}
