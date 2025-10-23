// candidatpage.component.ts

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-candidatpage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidatpage.component.html',
  styleUrls: ['./candidatpage.component.css']
})
export class CandidatpageComponent {
  candidatData = {
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    tel: '',
    cvPath: ''
  };
  username: string = '';
  message: string | null = null;
  selectedFile: File | null = null;
  isLoading: boolean = false;
  isFormVisible: boolean = false;
  sidebarCollapsed: boolean = false;
  searchTerm: string = '';
  idOffre: number | null = null;
  offreTitre: string = '';
  descriptionJob: string = '';
  competencesTechniques: string = '';
  profilRecherche: string = '';
  nbreDePoste: number | null = null;
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    
    // Load from query params first
    this.route.queryParams.subscribe(params => {
      this.idOffre = params['idOffre'] ? +params['idOffre'] : null;
      this.offreTitre = params['titre'] || '';
      this.descriptionJob = params['descriptionJob'] || '';
      this.competencesTechniques = params['competencesTechniques'] || '';
      this.profilRecherche = params['profilRecherche'] || '';
      this.nbreDePoste = params['nbreDePoste'] ? +params['nbreDePoste'] : null;
      
      console.log('Query params loaded:', { idOffre: this.idOffre, titre: this.offreTitre });
    });

    // Fallback to localStorage if query params are missing (after login/signup)
    if (!this.idOffre) {
      const pendingOffre = localStorage.getItem('pendingOffre');
      if (pendingOffre) {
        const offreData = JSON.parse(pendingOffre);
        this.idOffre = offreData.idOffre;
        this.offreTitre = offreData.titre || this.offreTitre;
        this.descriptionJob = offreData.descriptionJob || this.descriptionJob;
        this.competencesTechniques = offreData.competencesTechniques || this.competencesTechniques;
        this.profilRecherche = offreData.profilRecherche || this.profilRecherche;
        this.nbreDePoste = offreData.nbreDePoste || this.nbreDePoste;
        localStorage.removeItem('pendingOffre');  // Clean up after use
        console.log('Loaded pending offre from localStorage:', offreData);
      } else {
        console.warn('No pending offre in localStorage and no query params found.');
      }
    }

  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.isLoading = true;
      this.isFormVisible = false;
      this.message = null;

      const formData = new FormData();
      formData.append('Cv', this.selectedFile as File);  // Cast to File to avoid null issue

      this.http.post('http://localhost:8086/Candidature/extract', formData)
        .subscribe({
          next: (response: any) => {
            this.candidatData = {
              nom: response.nom || '',
              prenom: response.prenom || '',
              email: response.email || '',
              adresse: response.adresse || '',
              tel: response.tel || '',
              cvPath: response.cvPath || ''
            };
            this.message = 'Données extraites avec succès. Vérifiez et soumettez.';
            this.isLoading = false;
            this.isFormVisible = true;
            this.cdr.detectChanges();
          },
          error: (error: HttpErrorResponse) => {
            this.message = `Erreur lors de l'extraction : ${error.message}`;
            this.isLoading = false;
            this.isFormVisible = false;
            this.cdr.detectChanges();
          }
        });
    } else {
      this.message = 'Aucun fichier sélectionné.';
      this.isLoading = false;
      this.isFormVisible = false;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget) {
      (event.currentTarget as HTMLElement).classList.add('dragover');
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget) {
      (event.currentTarget as HTMLElement).classList.remove('dragover');
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget) {
      (event.currentTarget as HTMLElement).classList.remove('dragover');
    }
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
        const input = document.querySelector('#file-upload') as HTMLInputElement;
        if (input) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        this.message = 'Veuillez déposer un fichier PDF.';
        this.cdr.detectChanges();
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.isFormVisible = false;
    this.message = null;
    const input = document.querySelector('#file-upload') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  getFileSize(size: number): string {
    const kb = size / 1024;
    if (kb < 1024) return kb.toFixed(2) + ' KB';
    return (kb / 1024).toFixed(2) + ' MB';
  }

  onSubmit(form: NgForm): void {
    if (form.valid && this.selectedFile) {
      this.isLoading = true;
      this.message = null;

      const formData = new FormData();
      formData.append('nom', this.candidatData.nom);
      formData.append('prenom', this.candidatData.prenom);
      formData.append('email', this.candidatData.email);
      formData.append('Tel', this.candidatData.tel);
      formData.append('adresse', this.candidatData.adresse);
      formData.append('Cv', this.selectedFile as File);  // Cast to File
      const keycloakId = localStorage.getItem('user_id');
      if (keycloakId) {
        formData.append('keycloakId', keycloakId);
      }
      if (this.idOffre !== null) {
        formData.append('idOffre', this.idOffre.toString()); // Nom exact attendu côté Spring
      } else {
        this.message = 'Erreur : id de l’offre manquant.';
        this.isLoading = false;
        return;
      }

      this.http.post('http://localhost:8086/Candidature/add', formData)
        .subscribe({
          next: () => {
            this.message = 'Candidature enregistrée avec succès !';
            this.isLoading = false;
            this.isFormVisible = false;
            form.resetForm();
            this.candidatData = { nom: '', prenom: '', email: '', tel: '', adresse: '', cvPath: '' };
            this.selectedFile = null;
          },
          error: err => {
            this.message = `Erreur lors de l'enregistrement : ${err.message}`;
            this.isLoading = false;
          }
        });
    } else {
      this.message = 'Veuillez remplir tous les champs et uploader un CV.';
      this.isLoading = false;
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  AllOffre(): void {
    this.router.navigate(['/AllOffre']);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  applyFilter(): void {
    console.log('Search term:', this.searchTerm);
  }
}