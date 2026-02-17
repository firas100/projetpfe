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

interface Offre {
  idOffre: number;
  titreOffre: string;
}

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DecimalPipe],
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.scss']
})
export class RecommendationComponent implements OnInit, OnDestroy {
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
  selectedOffreId: number | null = null;
  offres: Offre[] = [];

  // Enhanced stats
  totalRecommendations = 0;
  averageScore = 0;
  topMatches = 0;

  private progressInterval: any;
totalCandidates: any;
questionMenuOpen: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadOffres();
  }

  ngOnDestroy(): void {
    if (this.progressInterval) clearInterval(this.progressInterval);
  }

  loadOffres(): void {
    this.http.get<Offre[]>('http://localhost:8086/Offre/getAlloffre')
      .subscribe({
        next: res => {
          this.offres = res;
        },
        error: err => console.error('Erreur chargement offres:', err)
      });
  }

  submitRecommendation(): void {
    if (!this.selectedOffreId) {
      this.message = "Veuillez sélectionner une offre";
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
          this.calculateStats;
          this.message = `Recommandation terminée avec succès`;
          
          // Clear message after 3 seconds
          setTimeout(() => {
            this.message = '';
          }, 5000);
          this.router.navigate(['/getall']);
        },
        error: (error) => {
        clearInterval(this.progressInterval);
        this.progressValue = 0;
        this.isLoading = false;
        this.message = 'Erreur lors de l\'analyse : ' + error.message;
      }
    });
  }
     
 
  

  private calculateStats(): void {
    this.totalRecommendations = this.candidates.length;
    if (this.candidates.length > 0) {
      const total = this.candidates.reduce((sum, c) => sum + (c.similarityScore || 0), 0);
      this.averageScore = total / this.candidates.length;
      this.topMatches = this.candidates.filter(c => (c.similarityScore || 0) >= 80).length;
    }
  }

  filteredCandidates(): Candidate[] {
    return this.candidates.filter(c =>
      c.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  paginatedCandidates(): Candidate[] {
    const filtered = this.filteredCandidates();
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.filteredCandidates().length / this.pageSize);
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  applyFilter(): void {
    this.currentPage = 1;
  }

  initials(c: Candidate): string {
    return `${c.prenom[0]}${c.nom[0]}`.toUpperCase();
  }

  avatarColor(c: Candidate): string {
    const str = (c.nom || '') + (c.prenom || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${hash % 360}, 70%, 65%)`;
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  }

  sanitizeUrl(url?: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url || '');
  }

  openCv(candidat: Candidate): void {
    if (!candidat.cvPath) {
      alert('Aucun CV disponible pour ce candidat.');
      return;
    }
    const url = `http://localhost:8086/files/cv/${candidat.cvPath}`;
    window.open(url, '_blank');
  }

  contactCandidate(c: Candidate): void {
    alert(`Envoyer un mail à ${c.email}`);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}