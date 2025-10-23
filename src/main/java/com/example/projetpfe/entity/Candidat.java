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
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Candidat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_candidature;

    private String nom;
    private String prenom;
    private String email;
    private String Tel;
    private String adresse;
    private String cvPath ;

    @Column(unique = true)
    private String keycloakId;

    @OneToMany(mappedBy = "candidat", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Candidature> candidatures = new ArrayList<>();

    @OneToMany(mappedBy = "candidat", cascade = CascadeType.ALL)
    private List<Recommendation> recommendations = new ArrayList<>();

    @OneToMany(mappedBy = "candidat", cascade = CascadeType.ALL)
    private List<PreInterview> preInterviews = new ArrayList<>();

    @OneToMany(mappedBy = "candidat", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Entretien> entretiens = new ArrayList<>();

    public Integer getId_candidature() {
        return id_candidature;
    }

    public void setId_candidature(Integer id_candidature) {
        this.id_candidature = id_candidature;
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

    public String getTel() {
        return Tel;
    }

    public void setTel(String tel) {
        Tel = tel;
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }

    public String getCvPath() {
        return cvPath;
    }

    public void setCvPath(String cvPath) {
        this.cvPath = cvPath;
    }
}
