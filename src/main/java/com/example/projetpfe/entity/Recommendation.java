package com.example.projetpfe.entity;

import jakarta.persistence.*;

@Entity
public class Recommendation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRecommendation;

    private double similarityScore;
    private int yearsOfExperience;

    @ManyToOne
    @JoinColumn(name = "candidat_id")
    private Candidat candidat;


    public Integer getIdRecommendation() {
        return idRecommendation;
    }
    public void setIdRecommendation(Integer idRecommendation) {
        this.idRecommendation = idRecommendation;
    }

    public double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(double similarityScore) {
        this.similarityScore = similarityScore;
    }

    public int getYearsOfExperience() {
        return yearsOfExperience;
    }

    public void setYearsOfExperience(int yearsOfExperience) {
        this.yearsOfExperience = yearsOfExperience;
    }

    public Candidat getCandidat() {
        return candidat;
    }

    public void setCandidat(Candidat candidat) {
        this.candidat = candidat;
    }



}
