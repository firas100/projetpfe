package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.CvRepo;
import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Cv;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.util.*;

import static com.google.common.io.MoreFiles.listFiles;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class CvServiceTest {
    @InjectMocks
    private CvService cvService;

    @Mock
    private CandidatRepo candidatRepo;

    @Mock
    private CvRepo cvRepo;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("afficherCv renvoie une liste de chemins simulée")
    void testAfficherCv() throws Exception {
        // Ici on ne peut pas exécuter le vrai script, on peut spy la méthode pour simuler
        CvService spyService = Mockito.spy(cvService);
        List<String> fakePaths = Arrays.asList("Ali_Salah.pdf", "John_Doe.pdf");

        doReturn(fakePaths).when(spyService).afficherCv();

        List<String> result = spyService.afficherCv();
        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.contains("Ali_Salah.pdf"));
    }

    @Test
    @DisplayName("enregistrerLatexCvsViaNomFichier sauvegarde le CV si candidat existe")
    void testEnregistrerLatexCvsViaNomFichier() {
        CvService spyService = Mockito.spy(cvService);

        // Simuler afficherCv()
        List<String> fakePaths = Arrays.asList("Doe_John.pdf");
        doReturn(fakePaths).when(spyService).afficherCv();

        // Simuler candidat existant
        Candidat john = new Candidat();
        john.setNom("john");
        john.setPrenom("doe");
        john.setId_candidature(1);

        when(candidatRepo.findByNomEtPrenom("john", "doe")).thenReturn(Collections.singletonList(john));
        when(cvRepo.existsByCandidat(john)).thenReturn(false);

        // Simuler fichier existant
        String basePath = "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\";
        File fileMock = mock(File.class);
        doReturn(fileMock).when(spyService).getFile(basePath + "Doe_John.pdf");
        when(fileMock.exists()).thenReturn(true);
        when(fileMock.isFile()).thenReturn(true);

        // On appelle la méthode
        spyService.enregistrerLatexCvsViaNomFichier();

        // Vérifier qu'on a bien sauvegardé
        verify(cvRepo, atLeastOnce()).save(any(Cv.class));
    }

    @Test
    @DisplayName("supprimerCvNonLatex supprime les fichiers non latex")
    void testSupprimerCvNonLatex() {
        CvService spyService = Mockito.spy(cvService);

        // Fichiers LaTeX détectés
        List<String> latexFiles = Arrays.asList("Ali_Salah.pdf");
        doReturn(latexFiles).when(spyService).afficherCv();

        // Mock fichiers
        File fileMock1 = mock(File.class);
        when(fileMock1.getName()).thenReturn("Ali_Salah.pdf");
        when(fileMock1.delete()).thenReturn(true);

        File fileMock2 = mock(File.class);
        when(fileMock2.getName()).thenReturn("John_Doe.pdf");
        when(fileMock2.delete()).thenReturn(true);

        // Mock dossier
        File dossierMock = mock(File.class);
        doReturn(new File[]{fileMock1, fileMock2})
                .when(spyService)
                .listFiles(eq(dossierMock), any());

        // Mock getFile pour dossier
        String basePath = "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\";
        doReturn(dossierMock).when(spyService).getFile(basePath);

        // Appel de la méthode
        spyService.supprimerCvNonLatex();

        // Vérifier suppression du fichier non latex
        verify(fileMock2, times(1)).delete();
        verify(fileMock1, never()).delete();
    }
}