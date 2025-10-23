import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-offre',
  standalone: false,
  templateUrl: './offre.component.html',
  styleUrl: './offre.component.css'
})
export class OffreComponent {
offre = {
    titreOffre: '',
    descriptionJob: '',
    competencesTechniques: '',
    profilRecherche: '',
    nbreDePoste: null as number | null
  };

  message = '';
  isSubmitting = false;
  sidebarCollapsed: boolean = false;
  searchTerm: string = '';
    username: string = '';

  constructor(private http: HttpClient, private router: Router,private authService:AuthService) {}
  ngOnInit(): void {
    this.username = this.authService.getUsername();
  }
  submitOffre(form: NgForm) {
    if (form.invalid) {
      this.message = 'Veuillez remplir tous les champs requis';
      return;
    }

    this.isSubmitting = true;
    this.message = '';

    this.http.post('http://localhost:8086/Offre/AddOffre', this.offre)
      .subscribe({
        next: res => {
          this.isSubmitting = false;
          this.message = 'Offre ajoutée avec succès !';
          form.resetForm();
        },
        error: err => {
          this.isSubmitting = false;
          this.message = 'Erreur lors de l\'ajout de l\'offre : ' + err.message;
        }
      });
  }
   onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  applyFilter(): void {
    console.log('Search term:', this.searchTerm);
  }

}

