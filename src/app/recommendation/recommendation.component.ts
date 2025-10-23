import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

interface Candidate {
  prenom: string;
  nom: string;
  email: string;
  yearsOfExperience: number;
  similarityScore: number;
  cvPath?: string;
  
}

@Component({
  selector: 'app-recommendation',
  standalone: true,   
  imports: [CommonModule, FormsModule, RouterModule, DecimalPipe],
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.css']
})
export class RecommendationComponent implements OnInit, OnDestroy {
  keywords = '';
  experienceMin = 0;
  message = '';
  isLoading = false;
  progressValue = 0;
  username = '';
  candidates: Candidate[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 6;
  sidebarCollapsed = false;
  sortField = '';
  selectedOffreId: number = 0;
  offres: { idOffre: number; titreOffre: string }[] = [];

  private progressInterval: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private sanitizer: DomSanitizer, private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadOffres();
  }

  ngOnDestroy() {
    if (this.progressInterval) clearInterval(this.progressInterval);
  }
 loadOffres() {
  this.http.get<{ idOffre: number; titreOffre: string }[]>('http://localhost:8086/Offre/getAlloffre')
    .subscribe({
      next: res => {
        this.offres = res;
        this.selectedOffreId = 0; 
      },
      error: err => console.error('Erreur chargement offres:', err)
    });
}

  submitRecommendation() {
  if (!this.selectedOffreId) {
    this.message = "Veuillez sélectionner une offre";
    console.log('Offre sélectionnée:', this.selectedOffreId);
    return;
  }

  this.isLoading = true;
  this.progressValue = 0;
  this.message = 'Analyse en cours...';
  this.candidates = [];

  this.progressInterval = setInterval(() => {
    this.progressValue = Math.min(this.progressValue + 5, 90);
  }, 200);

  const params = new HttpParams()
    .set('offreId', this.selectedOffreId.toString())
    .set('experienceMin', this.experienceMin.toString());

  this.http.post<Candidate[]>('http://localhost:8086/api/recommendations/generateByOffre', null, { params })
    .subscribe({
      next: (res) => {
        clearInterval(this.progressInterval);
        this.progressValue = 100;
        this.isLoading = false;
        this.candidates = res;
        this.message = `Recommandation terminée avec succès`;
      },
      error: (error) => {
        clearInterval(this.progressInterval);
        this.progressValue = 0;
        this.isLoading = false;
        this.message = 'Erreur lors de l\'analyse : ' + error.message;
      }
    });
}
  // Filtering
  filteredCandidates() {
    return this.candidates.filter(c =>
      c.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  listeCandidat() {
    this.router.navigate(['/recommendation']);
  }
  

  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }
  applyFilter() { this.currentPage = 1; }

  initials(c: Candidate) { return `${c.prenom[0]}${c.nom[0]}`.toUpperCase(); }

  avatarColor(c: Candidate) {
    const colors = ['#7c9cff', '#ff7c7c', '#7cff9c', '#ffc87c'];
    const code = (c.prenom.charCodeAt(0) + c.nom.charCodeAt(0)) % colors.length;
    return colors[code];
  }

  sanitizeUrl(url: string): SafeUrl { return this.sanitizer.bypassSecurityTrustUrl(url); }

  contactCandidate(c: Candidate) {
    alert(`Envoyer un mail à ${c.email}`);
  }
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
