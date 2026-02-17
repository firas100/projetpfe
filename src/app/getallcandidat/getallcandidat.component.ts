import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CandidatService, CandidateDTO, CandidateHistoryDTO } from '../auth/services/candidat.service';
import { AuthService } from '../auth/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-getallcandidat',
  standalone: true,
  templateUrl: './getallcandidat.component.html',
  styleUrls: ['./getallcandidat.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  providers: [DecimalPipe]
})
export class GetallcandidatComponent implements OnInit {
  // Data Properties
  candidats: CandidateDTO[] = [];
  offres: string[] = [];
  username = '';
  
  // UI State
  sidebarCollapsed = false;
  searchTerm = '';
  sortField = '';
  currentPage = 1;
  candidatesPerPage = 6;
  selectedTitreOffre: string = '';
  minScoreFilter?: number;
  showCandidateModal = false;
  selectedCandidate?: CandidateHistoryDTO;
  selectedOriginalCandidate?: CandidateDTO;
  
  // Legacy properties (kept for compatibility)
  videoPath: string | null = null;
  candidateJobs: string[] = [];
  videoScore: number | null = null;
  
  // Loading States
  isInviting = false;
  isProcessingVideos = false;
  loadingHistory = false;
  
  // Enhanced Stats
  totalCandidates = 0;
  averageScore = 0;
  topPerformers = 0;
questionMenuOpen: any;

  constructor(
    private candidatService: CandidatService,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private router: Router,
      private snackBar: MatSnackBar

  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadCandidats();
    this.setupKeyboardShortcuts();
  }

  /**
   * Setup keyboard shortcuts for better UX
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // CMD/CTRL + K to focus search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      const searchInput = document.querySelector('.search') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // Escape to close modal
    if (event.key === 'Escape' && this.showCandidateModal) {
      this.closeCandidateModal();
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    // Additional keyboard shortcuts can be added here
  }

  /**
   * Load all candidates from the service
   */
  private loadCandidats(): void {
    this.candidatService.getAllCandidats().subscribe({
      next: data => {
        this.candidats = data || [];
        console.log(' Candidats loaded successfully:', this.candidats.length);
        console.log('Candidats with CV paths:', 
          this.candidats.filter(c => c.cvPath).map(c => ({ 
            id: c.id, 
            nom: c.nom, 
            cvPath: c.cvPath 
          }))
        );
        this.calculateStats();
        this.applySort();
        this.extractUniqueOffres();
      },
      error: err => {
        console.error(' Error loading candidates:', err);
        this.showErrorNotification('Erreur lors du chargement des candidats');
      }
    });
  }

  /**
   * Extract unique job offers from candidates
   */
  private extractUniqueOffres(): void {
    this.offres = [...new Set(
      this.candidats
        .map(c => c.titreOffre)
        .filter((o): o is string => !!o)
    )];
    console.log(' Unique offers extracted:', this.offres);
  }

  /**
   * Calculate dashboard statistics
   */
  private calculateStats(): void {
    this.totalCandidates = this.candidats.length;
    
    if (this.candidats.length > 0) {
      const totalScore = this.candidats.reduce(
        (sum, c) => sum + (c.similarityScore || 0), 
        0
      );
      this.averageScore = totalScore / this.candidats.length;
      this.topPerformers = this.candidats.filter(
        c => (c.similarityScore || 0) >= 80
      ).length;
    } else {
      this.averageScore = 0;
      this.topPerformers = 0;
    }

    console.log(' Stats calculated:', {
      total: this.totalCandidates,
      average: this.averageScore.toFixed(1),
      topPerformers: this.topPerformers
    });
  }

  /**
   * View candidate's complete history
   */
  viewCandidateHistory(candidat: CandidateDTO): void {
    console.log('👤 Viewing candidate history:', candidat.nom, candidat.prenom);
    
    if (!candidat.nom || !candidat.prenom) {
      console.error(' Missing name or first name:', candidat);
      this.showErrorNotification('Nom ou prénom manquant. Vérifiez les données.');
      return;
    }

    this.loadingHistory = true;
    this.selectedOriginalCandidate = candidat;

    this.candidatService.getCandidateIdByName(candidat.nom, candidat.prenom).subscribe({
      next: (candidateId: number) => {
        console.log(' Candidate ID found:', candidateId);
        
        if (!candidateId) {
          this.showErrorNotification('Aucun candidat trouvé avec ce nom/prénom.');
          this.loadingHistory = false;
          return;
        }

        this.fetchCandidateHistory(candidateId);
      },
      error: (err) => {
        console.error(' Error fetching candidate ID:', err);
        this.showErrorNotification('Erreur lors de la recherche du candidat.');
        this.loadingHistory = false;
      }
    });
  }

  /**
   * Fetch candidate history by ID
   */
  private fetchCandidateHistory(candidateId: number): void {
    this.candidatService.getHistoryById(candidateId).subscribe({
      next: (history: CandidateHistoryDTO) => {
        console.log('📜 History loaded:', history);
        this.selectedCandidate = history;
        this.showCandidateModal = true;
        this.loadingHistory = false;
      },
      error: (err) => {
        console.error(' Error loading history for ID', candidateId, ':', err);
        this.showErrorNotification(`Erreur lors du chargement de l'historique (ID: ${candidateId}).`);
        this.loadingHistory = false;
      }
    });
  }

  /**
   * Open candidate's CV in new tab
   */
  openCv(candidat: CandidateDTO): void {
    if (!candidat.cvPath) {
      console.warn('⚠️ No CV path for candidate:', candidat.nom);
      this.showErrorNotification('Aucun CV disponible pour ce candidat.');
      return;
    }

    const url = `http://localhost:8086/files/cv/${candidat.cvPath}`;
    console.log('📄 Opening CV at:', url);
    window.open(url, '_blank');
  }

  /**
   * Close candidate modal
   */
  closeCandidateModal(): void {
    this.showCandidateModal = false;
    this.selectedCandidate = undefined;
    this.selectedOriginalCandidate = undefined;
    console.log('✖️ Modal closed');
  }

  /**
   * Invite top candidates for selected offer
   */
 inviteTopCandidates(): void {
  if (!this.selectedTitreOffre) {
    window.alert(' Veuillez sélectionner une offre avant d\'envoyer les invitations.');
    return;
  }

  const candidat = this.candidats.find(c => c.titreOffre === this.selectedTitreOffre);
  if (!candidat?.idOffre) {
    window.alert(' Impossible de trouver l\'ID de cette offre.');
    return;
  }

  const idOffre = candidat.idOffre;
  this.isInviting = true;

  this.candidatService.startEmailProcess(idOffre).subscribe({
    next: message => {
      window.alert(' Les invitations ont été envoyées avec succès.');
      this.isInviting = false;
    },
    error: err => {
      console.error(' Error sending invitations:', err);
      window.alert(' Échec de l\'envoi des invitations. Veuillez réessayer.');
      this.isInviting = false;
    }
  });
}


  /**
   * Apply filters to candidate list
   */
  applyFilters(): void {
    console.log('🔍 Applying filters:', {
      minScore: this.minScoreFilter,
      offer: this.selectedTitreOffre,
      searchTerm: this.searchTerm
    });

    this.currentPage = 1;

    this.candidatService
      .getFilteredCandidats(this.minScoreFilter, this.selectedTitreOffre)
      .subscribe({
        next: data => {
          this.candidats = data;
          console.log('✅ Filtered candidates:', this.candidats.length);
          this.calculateStats();
          this.applySort();
        },
        error: err => {
          console.error('❌ Error applying filters:', err);
          this.showErrorNotification('Erreur lors de l\'application des filtres');
        }
      });
  }

  /**
   * Apply sorting to candidate list
   */
  applySort(): void {
    if (!this.sortField) return;

    console.log('🔄 Sorting by:', this.sortField);

    this.candidats.sort((a: any, b: any) => {
      if (this.sortField === 'nom') {
        return a.nom.localeCompare(b.nom);
      }
      const aVal = a[this.sortField] ?? 0;
      const bVal = b[this.sortField] ?? 0;
      return bVal - aVal; // Descending order
    });
  }

  /**
   * Get filtered candidates based on search term
   */
  filteredCandidats(): CandidateDTO[] {
    if (!this.searchTerm.trim()) {
      return this.candidats;
    }

    const term = this.searchTerm.toLowerCase().trim();
    return this.candidats.filter(c =>
      c.nom?.toLowerCase().includes(term) ||
      c.prenom?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  }

  /**
   * Get paginated candidates for current page
   */
  paginatedCandidats(): CandidateDTO[] {
    const filtered = this.filteredCandidats();
    const start = (this.currentPage - 1) * this.candidatesPerPage;
    const end = start + this.candidatesPerPage;
    return filtered.slice(start, end);
  }

  /**
   * Calculate total number of pages
   */
  totalPages(): number {
    const total = Math.ceil(this.filteredCandidats().length / this.candidatesPerPage);
    return total || 0;
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToTop();
      console.log('⬅️ Previous page:', this.currentPage);
    }
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.scrollToTop();
      console.log('➡️ Next page:', this.currentPage);
    }
  }

  /**
   * Scroll to top of page smoothly
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Generate avatar color based on candidate name
   */
  avatarColor(c: CandidateDTO): string {
    const str = (c.nom || '') + (c.prenom || '');
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 65%)`;
  }

  /**
   * Get initials from candidate name
   */
  initials(c: CandidateDTO): string {
    const prenomInitial = c.prenom?.charAt(0).toUpperCase() ?? '';
    const nomInitial = c.nom?.charAt(0).toUpperCase() ?? '';
    return prenomInitial + nomInitial;
  }

  /**
   * Get score class for styling based on score value
   */
  getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    console.log('📱 Sidebar toggled:', this.sidebarCollapsed ? 'collapsed' : 'expanded');
  }

  /**
   * Sanitize URL for safe display
   */
  sanitizeUrl(url?: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url || '');
  }

  /**
   * Contact candidate via email
   */
  contactCandidate(c: CandidateDTO): void {
    if (!c.email) {
      this.showErrorNotification('Email non disponible pour ce candidat.');
      return;
    }

    const subject = encodeURIComponent(`Opportunité chez SIGA`);
    const body = encodeURIComponent(`Bonjour ${c.prenom} ${c.nom},\n\n`);
    const mailtoUrl = `mailto:${c.email}?subject=${subject}&body=${body}`;
    
    window.location.href = mailtoUrl;
    console.log('📧 Opening email client for:', c.email);
  }

  /**
   * Logout user
   */
  onLogout(): void {
    console.log('👋 Logging out user:', this.username);
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Process videos for selected offer
   */
  ProcessVideos(): void {
  if (!this.selectedTitreOffre) {
    this.showErrorNotification('Veuillez sélectionner une offre avant de traiter les vidéos.');
    return;
  }

  const candidat = this.candidats.find(c => c.titreOffre === this.selectedTitreOffre);
  
  if (!candidat?.idOffre) {
    this.showErrorNotification('Impossible de trouver l\'ID de cette offre.');
    return;
  }

  const idOffre = candidat.idOffre;

  if (!confirm(`Voulez-vous lancer le traitement des vidéos pour l'offre "${this.selectedTitreOffre}" ?\nCette opération est asynchrone et peut prendre du temps.`)) {
    return;
  }

  console.log('🎥 Processing videos for offer ID:', idOffre);
  this.isProcessingVideos = true;

  this.candidatService.processVideos(idOffre).subscribe({
    next: (response: any) => {
      this.isProcessingVideos = false;

      if (response.status === 'success') {
        this.showSuccessNotification(response.message);
        this.pollVideoProcessingStatus(idOffre);
      } else if (response.status === 'failed') {
        this.showErrorNotification(response.message);
      } else {
        this.showErrorNotification('Erreur inconnue lors du traitement des vidéos.');
      }
    },
    error: (err: any) => {
      this.isProcessingVideos = false;
      const errorMessage = err?.error?.message || 'Une erreur est survenue.';
      this.showErrorNotification(`Erreur : ${errorMessage}`);
      console.error(' Error processing videos:', err);
    }
  });
}


  /**
   * Poll video processing status
   */
  private pollVideoProcessingStatus(idOffre: number): void {
    console.log(' Starting status polling for offer:', idOffre);
    
    const interval = setInterval(() => {
      this.candidatService.pollVideoStatus(idOffre).subscribe({
        next: status => {
          console.log('📊 Processing status:', status);
          
          if (status.completed) {
            console.log(' Video processing completed');
            clearInterval(interval);
            this.showSuccessNotification('Traitement des vidéos terminé !');
            this.loadCandidats(); // Refresh candidates
          }
        },
        error: () => {
          console.warn('⚠️ Error polling status, stopping...');
          clearInterval(interval);
        }
      });
    }, 10000); // Poll every 10 seconds
  }

  /**
   * Format date string to localized format
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  }

  /**
   * Show success notification
   */
  private showSuccessNotification(message: string): void {
    alert(message); // Replace with a proper toast/notification service
  }

  /**
   * Show error notification
   */
  private showErrorNotification(message: string): void {
    alert(message); // Replace with a proper toast/notification service
  }
}