import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CandidatService, CandidateDTO, CandidateHistoryDTO } from '../auth/services/candidat.service';
import { AuthService } from '../auth/services/auth.service';
import { Console } from 'console';

@Component({
  selector: 'app-getallcandidat',
  standalone: true,
  templateUrl: './getallcandidat.component.html',
  styleUrls: ['./getallcandidat.component.css'],
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [DecimalPipe]
})
export class GetallcandidatComponent {
candidats: CandidateDTO[] = [];
  offres: string[] = [];
  username = '';
  sidebarCollapsed = false;
  searchTerm = '';
  sortField = '';
  currentPage = 1;
  candidatesPerPage = 6;
  selectedTitreOffre: string = '';
  minScoreFilter?: number;
  showCandidateModal = false;  // Modal for displaying candidate history details
  selectedCandidate?: CandidateHistoryDTO;  // Typed to CandidateHistoryDTO for history details
  selectedOriginalCandidate?: CandidateDTO;  // NEW: Store original candidate for CV access
  videoPath: string | null = null;
  candidateJobs: string[] = [];
  videoScore: number | null = null;
  isInviting = false;
  isProcessingVideos = false;
  loadingHistory = false;  // NEW: Loading state for history fetch

  constructor(
    private candidatService: CandidatService,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {  // FIXED: Moved ngOnInit implementation here
    this.username = this.authService.getUsername();
    this.loadCandidats();
  }

  private loadCandidats(): void {
    this.candidatService.getAllCandidats().subscribe({
      next: data => {
        this.candidats = data || [];
        console.log('Candidats loaded with cvPath:', this.candidats.map(c => ({ id: c.id, nom: c.nom, cvPath: c.cvPath })));  // FIXED: Log cvPath to confirm
        this.applySort();
        this.offres = [...new Set(
          this.candidats.map(c => c.titreOffre).filter((o): o is string => !!o)
        )];
      },
      error: err => console.error('Erreur chargement candidats:', err)
    });
  }

  // FIXED: Updated to load history details in modal instead of navigate
viewCandidateHistory(candidat: CandidateDTO): void {
    console.log('Clicked on candidate:', candidat);  // Debug
    if (!candidat.nom || !candidat.prenom) {
      console.error('Nom ou prénom manquant pour:', candidat);
      alert('Nom ou prénom manquant. Vérifiez les données.');
      return;
    }
    console.log('Fetching candidate ID by name:', candidat.nom, candidat.prenom);
    this.loadingHistory = true;
    this.candidatService.getCandidateIdByName(candidat.nom, candidat.prenom).subscribe({
      next: (candidateId: number) => {
        console.log('Candidate ID fetched by name:', candidateId);  // Log real candidate ID
        if (!candidateId) {
          alert('Aucun candidat trouvé avec ce nom/prénom.');
          this.loadingHistory = false;
          return;
        }
        // FIXED: Store original candidate for CV access BEFORE fetching history
        this.selectedOriginalCandidate = candidat;  // NEW: Set here to have cvPath available in modal
        // Now fetch history with real candidate ID
        this.candidatService.getHistoryById(candidateId).subscribe({
          next: (history: CandidateHistoryDTO) => {
            console.log('History loaded for candidate ID:', candidateId, history);
            this.selectedCandidate = history;
            this.showCandidateModal = true;
            this.loadingHistory = false;
          },
          error: (err) => {
            console.error('Erreur fetch history for ID ' + candidateId + ':', err);
            alert('Erreur lors du chargement de l\'historique (ID: ' + candidateId + ').');
            this.loadingHistory = false;
          }
        });
      },
      error: (err) => {
        console.error('Erreur fetch candidate ID by name:', err);
        alert('Erreur lors de la recherche du candidat par nom.');
        this.loadingHistory = false;
      }
    });
  }

  // FIXED: openCv method - now takes a CandidateDTO parameter (use selectedOriginalCandidate in modal)
  openCv(candidat: CandidateDTO): void {
    if (!candidat.cvPath) {
      console.warn('No cvPath for candidate:', candidat);  // FIXED: Log for debug
      alert('Aucun CV disponible pour ce candidat.');
      return;
    }
    const url = `http://localhost:8086/files/cv/${candidat.cvPath}`;  // FIXED: Use candidat.cvPath (single object)
    console.log('Opening CV URL:', url);  // FIXED: Debug log (check console for URL)
    window.open(url, '_blank');  // Open in new tab
  }

  closeCandidateModal(): void {
    this.showCandidateModal = false;
    this.selectedCandidate = undefined;
    this.selectedOriginalCandidate = undefined;  // FIXED: Reset original candidate on close
  }

  inviteTopCandidates() {
    if (!this.selectedTitreOffre) {
      alert('Veuillez sélectionner une offre avant d’envoyer les invitations.');
      return;
    }
    const candidat = this.candidats.find(c => c.titreOffre === this.selectedTitreOffre);
    console.log('Candidat trouvé pour l\'offre', this.selectedTitreOffre, candidat);
    if (!candidat?.idOffre) {
      alert('Impossible de trouver l’ID de cette offre.');
      return;
    }
    const idOffre = candidat.idOffre!;
    console.log('ID de l\'offre à envoyer', idOffre);
    this.isInviting = true;
    this.candidatService.startEmailProcess(idOffre).subscribe({
      next: message => {
        alert(' ' + message);
        this.isInviting = false;
      },
      error: err => {
        alert('Erreur lors de l’envoi : ' + err.message);
        this.isInviting = false;
      }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.candidatService
      .getFilteredCandidats(this.minScoreFilter, this.selectedTitreOffre)
      .subscribe({
        next: data => {
          this.candidats = data;
          this.applySort();
        },
        error: err => console.error('Erreur filtre:', err)
      });
  }

  applySort() {
    if (!this.sortField) return;
    this.candidats.sort((a: any, b: any) => {
      if (this.sortField === 'nom') return a.nom.localeCompare(b.nom);
      const aVal = a[this.sortField] ?? 0;
      const bVal = b[this.sortField] ?? 0;
      return bVal - aVal;
    });
  }

  filteredCandidats(): CandidateDTO[] {
    const term = this.searchTerm.toLowerCase();
    return this.candidats.filter(c =>
      c.nom?.toLowerCase().includes(term) ||
      c.prenom?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  }

  paginatedCandidats(): CandidateDTO[] {
    const filtered = this.filteredCandidats();
    const start = (this.currentPage - 1) * this.candidatesPerPage;
    return filtered.slice(start, start + this.candidatesPerPage);
  }

  totalPages(): number {
    return Math.ceil(this.filteredCandidats().length / this.candidatesPerPage);
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  avatarColor(c: CandidateDTO): string {
    const str = (c.nom || '') + (c.prenom || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${hash % 360}, 60%, 70%)`;
  }

  initials(c: CandidateDTO): string {
    const prenomInitial = c.prenom?.charAt(0).toUpperCase() ?? '';
    const nomInitial = c.nom?.charAt(0).toUpperCase() ?? '';
    return prenomInitial + nomInitial;
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  sanitizeUrl(url?: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url || '');
  }

  contactCandidate(c: CandidateDTO) {
    alert(`Contacter ${c.prenom} ${c.nom}`);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ProcessVideos() {
    if (!this.selectedTitreOffre) {
      alert('Veuillez sélectionner une offre avant de traiter les vidéos.');
      return;
    }
    const candidat = this.candidats.find(c => c.titreOffre === this.selectedTitreOffre);
    if (!candidat?.idOffre) {
      alert('Impossible de trouver l’ID de cette offre.');
      return;
    }
    const idOffre = candidat.idOffre!;
    if (!confirm('Voulez-vous traiter les vidéos pour l\'offre sélectionnée ? (Asynchrone)')) return;
    this.isProcessingVideos = true;
    this.candidatService.processVideos(idOffre).subscribe({
      next: message => {
        alert('Traitement lancé : ' + message);
        this.isProcessingVideos = false;
        this.pollStatus(idOffre);
      },
      error: err => {
        alert('Erreur : ' + err.message);
        this.isProcessingVideos = false;
      }
    });
  }

  private pollStatus(idOffre: number) {
    const interval = setInterval(() => {
      this.candidatService.pollVideoStatus(idOffre).subscribe({
        next: status => {
          console.log('Statut : ', status);
          if (status.completed) clearInterval(interval);
        },
        error: () => clearInterval(interval)
      });
    }, 10000);
  }

  // NEW: Helper method to format date for history display (if needed)
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }
}