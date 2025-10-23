package com.example.projetpfe.Controller;

import com.example.projetpfe.Services.OffreService;
import com.example.projetpfe.entity.Offre;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Offre")

public class OffreController {
    @Autowired
    private OffreService offreService;

   @PostMapping("/AddOffre")
    public Offre addoffre(@RequestBody  Offre offre){
       System.out.println(offre);
       return offreService.AjouterOffre(offre);

   }
   @GetMapping("/getAlloffre")
    public List<Offre> getallOffre(){
       return offreService.getAllOffre();
   }
    @GetMapping("/getAllOffresAdmin")
    public List<Offre> getAllOffresAdmin() {
        return offreService.getAllOffresForAdmin();  // All for admin
    }
    @PutMapping("/update/{id}")
    public ResponseEntity<Offre> updateOffre(@PathVariable Integer id, @RequestBody Offre offre) {
        offre.setIdOffre(id);
        Offre updatedOffre = offreService.updateOffre(offre);
        return ResponseEntity.ok(updatedOffre);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteOffre(@PathVariable Integer id) {
        offreService.deleteOffre(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/toggleEnable/{id}")
    public ResponseEntity<Offre> toggleEnable(@PathVariable Integer id) {
        Offre toggledOffre = offreService.toggleEnable(id);
        return ResponseEntity.ok(toggledOffre);
    }
}
