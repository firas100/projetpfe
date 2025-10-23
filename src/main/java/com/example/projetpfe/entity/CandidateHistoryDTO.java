package com.example.projetpfe.entity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CandidateHistoryDTO {
    private Integer candidateId;
    private String nom;
    private String prenom;
    private String cvPath ;
    private List<HistoryDTO> applications;


}
