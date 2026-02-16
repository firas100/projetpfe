package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.CandidatRepo;
import com.example.projetpfe.Repository.CandidatureRepo;
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

    @Autowired
    private CandidatureRepo candidatureRepo;


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


    public boolean verifierCvLatexParChemin(String cvPath) {
        try {
            System.out.println("DEBUG - Verification CV");
            System.out.println("Chemin recu : [" + cvPath + "]");

            // VALIDATION : Vérifier que ce n'est pas la chaîne littérale "cvPath"
            if (cvPath == null || cvPath.trim().isEmpty() || cvPath.equals("cvPath")) {
                System.err.println("[ERREUR CRITIQUE] cvPath invalide ou literal !");
                return false;
            }

            // Vérifier que le fichier existe
            File cvFile = new File(cvPath);
            if (!cvFile.exists()) {
                System.err.println("[ERREUR] Fichier n'existe pas : " + cvPath);
                return false;
            }

            System.out.println("[OK] Fichier existe : " + cvFile.getAbsolutePath());

            // Appeler le script Python avec le chemin du CV spécifique
            ProcessBuilder builder = new ProcessBuilder(
                    "python",
                    "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\verifieCv.py",
                    cvPath  // Passer le chemin en argument
            );

            builder.redirectErrorStream(true);
            Process process = builder.start();

            // Lire la sortie pour le debug
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {

                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println("Python: " + line);
                }
            }

            int exitCode = process.waitFor();
            System.out.println("Python Exit Code : " + exitCode);

            boolean isLatex = (exitCode == 0);

            System.out.println("Resultat final : " + (isLatex ? "[LATEX]" : "[NON-LATEX]"));

            return isLatex;

        } catch (Exception e) {
            System.err.println("[ERREUR] Exception verification CV : " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public boolean enregistrerCvLatex(String cvPath, String nom, String prenom) {
        try {
            System.out.println(" Enregistrement CV pour : " + prenom + " " + nom);

            // Recherche du candidat
            List<Candidat> candidats = condidatRepo.findByNomEtPrenom(
                    nom.toLowerCase().trim(),
                    prenom.toLowerCase().trim()
            );

            if (candidats.isEmpty()) {
                System.out.println(" Aucun candidat trouvé pour : " + prenom + " " + nom);
                return false;
            }

            Candidat candidat = candidats.get(0);

            // Vérifier si un CV n'existe pas déjà
            if (cvRepo.existsByCandidat(candidat)) {
                System.out.println("ℹ CV déjà enregistré pour ce candidat");
                return true;
            }

            // Enregistrer le CV
            Cv cv = new Cv();
            cv.setCandidat(candidat);
            cv.setCvPath(cvPath);
            cvRepo.save(cv);

            System.out.println(" CV enregistré avec succès pour " + prenom + " " + nom);
            return true;

        } catch (Exception e) {
            System.err.println(" Erreur enregistrement CV : " + e.getMessage());
            return false;
        }
    }


    public boolean supprimerCvEtCandidature(String cvPath, Integer candidatId, Integer candidatureId) {
        try {
            System.out.println("SUPPRESSION COMPLETE (CV + Candidature + Candidat)");
            System.out.println("CV Path : " + cvPath);
            System.out.println("Candidat ID : " + candidatId);
            System.out.println("Candidature ID : " + candidatureId);

            boolean toutSupprime = true;


            File cvFile = new File(cvPath);
            if (cvFile.exists()) {
                if (cvFile.delete()) {
                    System.out.println("[OK] Fichier CV supprime du disque");
                } else {
                    System.err.println("[ERREUR] Impossible de supprimer le fichier CV");
                    toutSupprime = false;
                }
            } else {
                System.out.println("[INFO] Fichier CV n'existe pas sur le disque");
            }


            if (candidatId != null) {
                Candidat candidat = condidatRepo.findById(candidatId).orElse(null);
                if (candidat != null) {
                    List<Cv> cvs = cvRepo.findByCandidat(candidat);
                    if (!cvs.isEmpty()) {
                        cvRepo.deleteAll(cvs);
                        System.out.println("[OK] CV supprime de la BD (" + cvs.size() + " enregistrement(s))");
                    } else {
                        System.out.println("[INFO] Aucun CV en BD pour ce candidat");
                    }
                }
            }


            if (candidatureId != null) {
                try {
                    candidatureRepo.deleteById(candidatureId);
                    System.out.println("[OK] Candidature supprimee de la BD (ID: " + candidatureId + ")");
                } catch (Exception e) {
                    System.err.println("[ERREUR] Impossible de supprimer la candidature : " + e.getMessage());
                    e.printStackTrace();
                    toutSupprime = false;
                }
            }


            if (candidatId != null) {
                try {
                    condidatRepo.deleteById(candidatId);
                    System.out.println("[OK] Candidat supprime de la BD (ID: " + candidatId + ")");
                } catch (Exception e) {
                    System.err.println("[ERREUR] Impossible de supprimer le candidat : " + e.getMessage());
                    System.err.println("[INFO] Verifiez s'il n'a pas d'autres candidatures actives");
                    e.printStackTrace();
                    toutSupprime = false;
                }
            }

            System.out.println("Resultat suppression : " + (toutSupprime ? "SUCCESS COMPLET" : "PARTIEL"));

            return toutSupprime;

        } catch (Exception e) {
            System.err.println("[ERREUR] Exception suppression : " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public void enregistrerLatexCvsViaNomFichier() {
        List<String> latexCvPaths = afficherCv();
        for (String path : latexCvPaths) {
            String filename = path.substring(path.lastIndexOf("\\") + 1);

            if (filename.toLowerCase().endsWith(".pdf")) {
                filename = filename.substring(0, filename.length() - 4);
            }

            String[] parts = filename.split("_");

            if (parts.length >= 2) {
                String nom = parts[1].toLowerCase().trim();
                String prenom = parts[0].toLowerCase().trim();

                System.out.println("Recherche Candidat avec Nom: " + nom + " et Prénom: " + prenom);

                List<Candidat> candidats = condidatRepo.findByNomEtPrenom(nom, prenom);

                if (!candidats.isEmpty()) {
                    for (Candidat candidat : candidats) {
                        System.out.println("Candidat trouvé : " + candidat.getNom() + " " + candidat.getPrenom());

                        if (!cvRepo.existsByCandidat(candidat)) {
                            String basePath = "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\";
                            File file = new File(basePath + path);
                            if (file.exists() && file.isFile()) {
                                Cv cv = new Cv();
                                cv.setCandidat(candidat);
                                cv.setCvPath(basePath + path);
                                cvRepo.save(cv);
                                System.out.println("CV enregistré pour " + prenom + " " + nom);
                            } else {
                                System.out.println("Le fichier CV n'existe pas : " + path);
                            }
                            break;
                        } else {
                            System.out.println("CV déjà enregistré pour " + prenom + " " + nom);
                        }
                    }
                } else {
                    System.out.println("Aucun candidat trouvé pour : " + prenom + " " + nom);
                }
            }
        }
    }
    public void supprimerCvNonLatex() {
        List<String> latexCvs = afficherCv();

        String basePath = "C:\\Users\\Firas kdidi\\Desktop\\Pfe\\CV\\";
        File dossierCv = new File(basePath);

        File[] fichiers = dossierCv.listFiles((dir, name) -> name.toLowerCase().endsWith(".pdf"));

        if (fichiers != null) {
            for (File fichier : fichiers) {
                String cheminRelatif = fichier.getName();

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


    public List<Cv> getallcvLatex() {
        return cvRepo.findAll();
    }


    protected File getFile(String path) {
        return new File(path);
    }

    protected File[] listFiles(File dossier, java.io.FilenameFilter filter) {
        return dossier.listFiles(filter);
    }
}