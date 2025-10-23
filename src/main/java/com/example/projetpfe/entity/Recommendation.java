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
public class Recommendation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRecommendation;

    private double similarityScore;
    private int yearsOfExperience;

    @ManyToOne
    @JoinColumn(name = "candidat_id")
    @JsonIgnore  // Avoid cycle in JSON
    private Candidat candidat;

    @ManyToOne
    @JoinColumn(name = "offre_id")
    @JsonIgnore
    private Offre offre;  // New link to Offre

    // Constructors
    public Recommendation(Candidat candidat, Offre offre, double similarityScore, int yearsOfExperience) {
        this.candidat = candidat;
        this.offre = offre;
        this.similarityScore = similarityScore;
        this.yearsOfExperience = yearsOfExperience;
    }

    // Getters/Setters (keep existing, add for offre)
    public Offre getOffre() {
        return offre;
    }

    public void setOffre(Offre offre) {
        this.offre = offre;
    }

    // Existing getters/setters...
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