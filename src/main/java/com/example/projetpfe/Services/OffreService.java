package com.example.projetpfe.Services;

import com.example.projetpfe.Repository.OffreRepo;
import com.example.projetpfe.entity.Offre;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class OffreService {
    @Autowired
    private OffreRepo offreRepo;

  public Offre AjouterOffre(Offre offre){
      return offreRepo.save(offre);
  }
  
  public List<Offre> getAllOffre(){
      return offreRepo.findAllByEnableTrue();
  }
    public List<Offre> getAllOffresForAdmin() {
        return offreRepo.findAll();  // All offers for admin
    }
    public Offre updateOffre(Offre offre) {
        if (offre.getIdOffre() == null) {
            throw new IllegalArgumentException("ID de l'offre est requis pour la mise à jour");
        }
        return offreRepo.save(offre);
    }
    public void deleteOffre(Integer idOffre) {
        if (!offreRepo.existsById(idOffre)) {
            throw new IllegalArgumentException("Offre non trouvée avec l'ID: " + idOffre);
        }
        offreRepo.deleteById(idOffre);
    }

    public Offre toggleEnable(Integer idOffre) {
        Offre offre = offreRepo.findById(idOffre)
                .orElseThrow(() -> new IllegalArgumentException("Offre non trouvée avec l'ID: " + idOffre));
        offre.setEnable(!offre.isEnable());
        return offreRepo.save(offre);
    }
}
