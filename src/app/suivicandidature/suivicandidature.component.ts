// suivicandidature.component.ts
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';

interface Step {
  id: number;
  label: string;
  code: string;
}

interface ProgressResponse {
  currentStep: string;
  steps: Step[];
}

interface Candidature {
  id: number;
  dateCandidature: string;
  statut: string;
  titreOffre: string;
}

@Component({
  selector: 'app-suivicandidature',
  standalone: false,
  templateUrl: './suivicandidature.component.html',
  styleUrls: ['./suivicandidature.component.css']
})
export class SuivicandidatureComponent {
  candidatures: Candidature[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  candidatId: number | null = null;
  sidebarCollapsed = false;
  pageSize = 6;
  currentPage = 1;
  searchTerm = '';
  username = '';
  selectedProgress: ProgressResponse | null = null;
  selectedCandidatureId: number | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    const keycloakId = localStorage.getItem('user_id');
    if (keycloakId) {
      this.loadCandidatures(keycloakId);
    } else {
      this.errorMessage = 'Utilisateur non identifié';
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadCandidatures(keycloakId: string): void {
    this.isLoading = true;
    this.http
      .get<Candidature[]>(
        `http://localhost:8086/GetMesCandidature?keycloakId=${keycloakId}`
      )
      .subscribe({
        next: (data) => {
          console.log('Données reçues:', data);
          this.candidatures = data;
        },
        error: (err) => {
          console.error('Erreur HTTP:', err);
          this.errorMessage = 'Erreur lors du chargement des candidatures.';
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  applyFilter() {
    this.currentPage = 1;
  }

  showProgress(candidatureId: number): void {
    // Toggle: si on clique sur la même ligne, on ferme
    if (this.selectedCandidatureId === candidatureId) {
      this.selectedCandidatureId = null;
      this.selectedProgress = null;
      return;
    }

    this.selectedCandidatureId = candidatureId;
    this.selectedProgress = null; // Reset pour afficher le loading
    
    this.http
      .get<ProgressResponse>(`http://localhost:8086/api/progress/${candidatureId}`)
      .subscribe({
        next: (data) => {
          this.selectedProgress = data;
        },
        error: (err) => {
          console.error('Erreur progression:', err);
          this.errorMessage = 'Erreur lors du chargement de la progression.';
        }
      });
  }

  isStepActive(stepCode: string, currentStep: string): boolean {
    const order = [
      'CANDIDATURE_ENREGISTREE',
      'CV_ANALYSE',
      'PREINTERVIEW_TERMINEE',
      'ENTRETIEN_PLANIFIE'
    ];
    return order.indexOf(stepCode) <= order.indexOf(currentStep);
  }

  // Calcule la largeur du connecteur en pourcentage
  getProgressWidth(currentStep: string): number {
    const order = [
      'CANDIDATURE_ENREGISTREE',
      'CV_ANALYSE',
      'PREINTERVIEW_TERMINEE',
      'ENTRETIEN_PLANIFIE'
    ];
    const index = order.indexOf(currentStep);
    const total = order.length - 1;
    
    if (index === -1) return 0;
    
    // Retourne un pourcentage entre 0 et 76 (pour l'espace entre les étapes)
    return (index / total) * 76;
  }

  // Retourne l'icône appropriée pour chaque étape
  getStepIcon(stepCode: string): string {
    const icons: { [key: string]: string } = {
      'CANDIDATURE_ENREGISTREE': 'fa-paper-plane',
      'CV_ANALYSE': 'fa-file-lines',
      'PREINTERVIEW_TERMINEE': 'fa-video',
      'ENTRETIEN_PLANIFIE': 'fa-calendar-check'
    };
    return icons[stepCode] || 'fa-hourglass-half';
  }
}