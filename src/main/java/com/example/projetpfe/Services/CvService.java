package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.CvRepo;
import com.example.projetpfe.entity.Candidat;
import com.example.projetpfe.entity.Cv;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Service
public class CvService {
    @Autowired
    private CandidatRepo condidatRepo;
    @Autowired
    private CvRepo cvRepo;

    public List<String> afficherCv() {
        List<String> latexCvs = new ArrayList<>();
        try {
            ProcessBuilder builder = new ProcessBuilder(
                    "python",
                    "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\verifieCv.py"
            );

            builder.redirectErrorStream(true);
            Process process = builder.start();


            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {

                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println("- " + line);
                    latexCvs.add(line.trim());
                }
            }

            process.waitFor();
        } catch (Exception e) {
            System.err.println("Erreur exécution script Python : " + e.getMessage());
        }
        return latexCvs;
    }

    public void enregistrerLatexCvsViaNomFichier() {
        List<String> latexCvPaths = afficherCv();
        for (String path : latexCvPaths) {
            String filename = path.substring(path.lastIndexOf("\\") + 1);

            // Supprimer .pdf si présent
            if (filename.toLowerCase().endsWith(".pdf")) {
                filename = filename.substring(0, filename.length() - 4);
            }

            // Découper sur "_"
            String[] parts = filename.split("_");

            if (parts.length >= 2) {
                String nom = parts[1].toLowerCase().trim();
                String prenom = parts[0].toLowerCase().trim();

                System.out.println("Recherche Candidat avec Nom: " + nom + " et Prénom: " + prenom);

                // Recherche insensible à la casse
                List<Candidat> candidats = condidatRepo.findByNomEtPrenom(nom, prenom);

                if (!candidats.isEmpty()) {
                    for (Candidat candidat : candidats) {
                        System.out.println("Candidat trouvé : " + candidat.getNom() + " " + candidat.getPrenom());

                        if (!cvRepo.existsByCandidat(candidat)) {
                            // Vérifier l'existence du fichier
                            String basePath = "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\";
                            File file = new File(basePath + path);
                            if (file.exists() && file.isFile()) {
                                Cv cv = new Cv();
                                cv.setCandidat(candidat);
                                cv.setCvPath(basePath + path);
                                cvRepo.save(cv);
                                System.out.println("CV enregistré pour " + prenom + " " + nom + " avec ID = " + candidat.getId_candidature());
                            } else {
                                System.out.println("Le fichier CV n'existe pas : " + path);
                            }
                            break; // on enregistre pour le premier qui n'a pas déjà un CV
                        } else {
                            System.out.println("CV déjà enregistré pour " + prenom + " " + nom + " avec ID = " + candidat.getId_candidature());
                        }
                    }
                } else {
                    System.out.println("Aucun candidat trouvé pour : " + prenom + " " + nom);
                }
            }
        }
    }
    public void supprimerCvNonLatex() {
        // Liste des fichiers LaTeX détectés
        List<String> latexCvs = afficherCv();

        // Dossier des CVs
        String basePath = "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\";
        File dossierCv = new File(basePath);

        // Tous les fichiers PDF dans le dossier
        File[] fichiers = dossierCv.listFiles((dir, name) -> name.toLowerCase().endsWith(".pdf"));

        if (fichiers != null) {
            for (File fichier : fichiers) {
                // Vérifie si le chemin complet (relatif) du fichier est dans la liste LaTeX
                String cheminRelatif = fichier.getName(); // ex: "Ali_Salah.pdf"

                boolean estLatex = latexCvs.stream().anyMatch(p -> p.endsWith(cheminRelatif));

                if (!estLatex) {
                    System.out.println("Suppression du CV non-LaTeX : " + fichier.getAbsolutePath());
                    if (fichier.delete()) {
                        System.out.println("Fichier supprimé : " + cheminRelatif);
                    } else {
                        System.out.println("Échec de la suppression de : " + cheminRelatif);
                    }
                }
            }
        } else {
            System.out.println("Le dossier CV est vide ou n'existe pas.");
        }
    }

    public List<Cv> getallcvLatex(){
        return cvRepo.findAll();
    }

    protected File getFile(String path) {
        return new File(path);
    }
    protected File[] listFiles(File dossier, java.io.FilenameFilter filter) {
        return dossier.listFiles(filter);
    }
}
