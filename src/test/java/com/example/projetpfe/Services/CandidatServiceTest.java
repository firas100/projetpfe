package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.CvRepo;
import com.example.projetpfe.Repository.EntretienRepo;
import com.example.projetpfe.Repository.RecommendationRepo;
import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Recommendation;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;  // Correct import for verify, times, when, any, etc.

@ExtendWith(MockitoExtension.class)
class CandidatServiceTest {
    @InjectMocks
    private CandidatService candidatService;
    @Mock
    private RecommendationRepo recommendationRepo;
    @Mock
    private CandidatRepo candidatRepo;
    @Mock
    private EntretienRepo entretienRepo;
    @Mock
    private CvRepo cvRepo;

    @Nested
    @DisplayName("add Candidature Test")
    class addCandidatureTest {

        @Test
        @DisplayName(" Ajout d'un candidat réussi")
        void createCandidatureSuccess() {
            // Arrange
            Candidat candidatInput = new Candidat();
            candidatInput.setNom("John Doe");

            Candidat candidatSaved = new Candidat();
            candidatSaved.setNom("John Doe");
            candidatSaved.setId_candidature(1);

            when(candidatRepo.save(any(Candidat.class))).thenReturn(candidatSaved);

            // Act
            Candidat result = candidatService.addCondidature(candidatInput);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getId_candidature());
            assertEquals("John Doe", result.getNom());
            verify(candidatRepo, times(1)).save(any(Candidat.class));
        }

        @Test
        @DisplayName(" Échec de l'ajout d'un candidat (exception)")
        void createCandidatureFailure() {
            // Arrange
            when(candidatRepo.save(any(Candidat.class))).thenThrow(new RuntimeException("Erreur de sauvegarde"));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class, () ->
                    candidatService.addCondidature(new Candidat()));

            assertEquals("Erreur de sauvegarde", exception.getMessage());
            verify(candidatRepo, times(1)).save(any(Candidat.class));
        }
    }
    @Nested
    @DisplayName("Méthode getAllCandidats")
    class GetAllCandidatsTest {

        @Test
        @DisplayName(" Récupération des candidats avec score > MIN_SCORE")
        void getAllCandidatsSuccess() {
            List<Candidat> expected = List.of(new Candidat(), new Candidat());
            when(entretienRepo.findCandidatsWithHighScore(anyDouble())).thenReturn(expected);

            List<Candidat> result = candidatService.getAllCandidats();

            assertEquals(2, result.size());
            verify(entretienRepo, times(1)).findCandidatsWithHighScore(55.0);
        }
    }
    @Nested
    @DisplayName("Méthode getCandidatById")
    class GetCandidatByIdTest {

        @Test
        @DisplayName("Trouve un candidat existant")
        void getCandidatByIdFound() {
            Candidat candidat = new Candidat();
            candidat.setId_candidature(1);
            when(candidatRepo.findById(1)).thenReturn(Optional.of(candidat));

            Candidat result = candidatService.getCandidatById(1);

            assertNotNull(result);
            assertEquals(1, result.getId_candidature());
            verify(candidatRepo, times(1)).findById(1);
        }

        @Test
        @DisplayName(" Lève une exception si le candidat n'existe pas")
        void getCandidatByIdNotFound() {
            when(candidatRepo.findById(99)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class, () ->
                    candidatService.getCandidatById(99));

            assertEquals("Candidat non trouvé avec id: 99", ex.getMessage());
            verify(candidatRepo, times(1)).findById(99);
        }
    }
    @Nested
    @DisplayName("Méthode getCandidatesWithScoreAbove")
    class GetCandidatesWithScoreAboveTest {

        @Test
        @DisplayName(" Retourne les candidats ayant un score supérieur au seuil")
        void getCandidatesWithScoreAboveSuccess() {
            Candidat candidat1 = new Candidat();
            candidat1.setNom("Alice");
            Candidat candidat2 = new Candidat();
            candidat2.setNom("Bob");

            Recommendation rec1 = new Recommendation();
            rec1.setCandidat(candidat1);
            Recommendation rec2 = new Recommendation();
            rec2.setCandidat(candidat2);

            when(recommendationRepo.findBySimilarityScoreGreaterThan(70.0))
                    .thenReturn(List.of(rec1, rec2));

            List<Candidat> result = candidatService.getCandidatesWithScoreAbove(70.0);

            assertEquals(2, result.size());
            assertTrue(result.stream().anyMatch(c -> "Alice".equals(c.getNom())));
            assertTrue(result.stream().anyMatch(c -> "Bob".equals(c.getNom())));
            verify(recommendationRepo, times(1)).findBySimilarityScoreGreaterThan(70.0);
        }

        @Test
        @DisplayName(" Retourne une liste vide si aucun résultat")
        void getCandidatesWithScoreAboveEmpty() {
            when(recommendationRepo.findBySimilarityScoreGreaterThan(anyDouble())).thenReturn(Collections.emptyList());

            List<Candidat> result = candidatService.getCandidatesWithScoreAbove(80.0);

            assertTrue(result.isEmpty());
            verify(recommendationRepo, times(1)).findBySimilarityScoreGreaterThan(80.0);
        }
    }
    @Nested
    @DisplayName("Méthode getcandidat()")
    class GetCandidatListTest {

        @Test
        @DisplayName("✅ Retourne la liste complète des candidats")
        void getCandidatListSuccess() {
            when(candidatRepo.findAll()).thenReturn(List.of(new Candidat(), new Candidat(), new Candidat()));

            List<Candidat> result = candidatService.getcandidat();

            assertEquals(3, result.size());
            verify(candidatRepo, times(1)).findAll();
        }

        @Test
        @DisplayName("✅ Retourne une liste vide si aucun candidat")
        void getCandidatListEmpty() {
            when(candidatRepo.findAll()).thenReturn(Collections.emptyList());

            List<Candidat> result = candidatService.getcandidat();

            assertTrue(result.isEmpty());
            verify(candidatRepo, times(1)).findAll();
        }
    }

}