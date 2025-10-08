package com.example.projetpfe.Repository;

import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Cv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CvRepo extends JpaRepository<Cv, Integer> {


    boolean existsByCandidat(Candidat candidat);


}
