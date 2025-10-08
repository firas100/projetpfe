package com.example.projetpfe.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Entretien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Date dateEntretien;

    @ManyToOne
    private Candidat candidat;

    private String managerId;
    private String managerEmail;
    private String managerName;
    private String commentaire;
    private String status; // ENVOYE, CONFIRME, REFUSE
}
