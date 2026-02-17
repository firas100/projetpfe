import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { CandidateHistoryDTO, CandidatService, HistoryDTO } from '../auth/services/candidat.service';

@Component({
  selector: 'app-historique-manager',
  standalone: false,
  templateUrl: './historique-manager.component.html',
styleUrls: ['./historique-manager.component.scss'],
})
export class HistoriqueManagerComponent {
// Data arrays
  histories: CandidateHistoryDTO[] = [];
  filteredHistories: CandidateHistoryDTO[] = [];
  selectedHistory?: CandidateHistoryDTO;
  
  // State
  loading = true;
  error?: string;
  
  // UI State
  sidebarCollapsed = false;
  username = '';
  searchTerm = '';
  candidateIdInput = 0;
totalCandidates: any;
questionMenuOpen: any;

  constructor(
    private candidatService: CandidatService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadAllHistories();
    this.initKeyboardShortcuts();
  }

  /**
   * Initialize keyboard shortcuts
   */
  initKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // CMD/Ctrl + K for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
  }

  /**
   * Track by functions for performance
   */
  trackByCandidateId(index: number, history: CandidateHistoryDTO): number {
    return history.candidateId;
  }

  trackByApplicationId(index: number, app: HistoryDTO): number {
    return app.candidatureId;
  }

  /**
   * Safe value display
   */
  safeValue(value: any): any {
    return value != null ? value : 'N/A';
  }

  /**
   * Load all candidate histories
   */
  loadAllHistories(): void {
    this.loading = true;
    this.error = undefined;
    this.selectedHistory = undefined;
    
    this.candidatService.getAllHistories().subscribe({
      next: (data) => {
        this.histories = data;
        this.filteredHistories = [...data];
        this.loading = false;
        console.log('✅ Loaded histories:', data.length);
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des historiques';
        console.error('❌ Error loading histories:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Load history for specific candidate by ID
   */
  loadHistoryById(id: number): void {
    this.loading = true;
    this.error = undefined;
    
    this.candidatService.getHistoryById(id).subscribe({
      next: (data) => {
        this.selectedHistory = data;
        // Initialize showVideo property for each application
        this.selectedHistory.applications = this.selectedHistory.applications.map(app => ({ 
          ...app, 
          showVideo: false 
        }));
        this.loading = false;
        console.log('✅ Loaded history for candidate:', id);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.error = `Erreur lors du chargement de l'historique pour l'ID ${id}`;
        console.error('❌ Error loading history:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Load history by input ID (for testing/debugging)
   */
  loadHistoryByIdInput(): void {
    if (this.candidateIdInput > 0) {
      this.loadHistoryById(this.candidateIdInput);
    } else {
      this.error = 'Veuillez entrer un ID valide.';
    }
  }

  /**
   * Open CV in new tab
   */
  openCv(): void {
    if (this.selectedHistory?.cvPath) {
      const url = `http://localhost:8086/files/cv/${this.selectedHistory.cvPath}`;
      window.open(url, '_blank');
    } else {
      alert('Aucun CV disponible pour ce candidat.');
    }
  }

  /**
   * Toggle video visibility for an application
   */
  toggleVideo(app: HistoryDTO & { showVideo?: boolean }): void {
    app.showVideo = !app.showVideo;
  }

  /**
   * Format date to French locale
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  }

  /**
   * Apply search filter
   */
  applyFilter(): void {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      this.filteredHistories = [...this.histories];
      return;
    }

    const search = this.searchTerm.toLowerCase().trim();
    this.filteredHistories = this.histories.filter(h => 
      h.prenom.toLowerCase().includes(search) || 
      h.nom.toLowerCase().includes(search) ||
      h.candidateId.toString().includes(search)
    );
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    console.log('📱 Sidebar toggled:', this.sidebarCollapsed ? 'collapsed' : 'expanded');
  }

  /**
   * Logout
   */
  onLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      console.log('👋 Logging out user:', this.username);
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  /**
   * Get preview applications (first 3)
   */
  getPreviewApplications(applications: HistoryDTO[]): HistoryDTO[] {
    return applications ? applications.slice(0, 3) : [];
  }

  /**
   * Calculate total applications across all candidates
   */
  getTotalApplications(): number {
    return this.filteredHistories.reduce((sum, history) => 
      sum + (history.applications?.length || 0), 0
    );
  }

  /**
   * Calculate accepted applications
   */
  getAcceptedApplications(): number {
    return this.filteredHistories.reduce((sum, history) => {
      const accepted = history.applications?.filter(app => 
        app.statutCandidature === 'ACCEPTÉE'
      ).length || 0;
      return sum + accepted;
    }, 0);
  }

  /**
   * Calculate acceptance rate percentage
   */
  getAcceptanceRate(): number {
    const total = this.getTotalApplications();
    if (total === 0) return 0;
    
    const accepted = this.getAcceptedApplications();
    return Math.round((accepted / total) * 100);
  }

  /**
   * Get average CV score for applications
   */
  getAverageCvScore(applications: HistoryDTO[]): string {
    if (!applications || applications.length === 0) return 'N/A';
    
    const scoresWithValues = applications
      .filter(app => app.cvScore != null)
      .map(app => app.cvScore!);
    
    if (scoresWithValues.length === 0) return 'N/A';
    
    const average = scoresWithValues.reduce((sum, score) => sum + score, 0) / scoresWithValues.length;
    return average.toFixed(1);
  }

  /**
   * Count applications with videos
   */
  getVideoCount(applications: HistoryDTO[]): number {
    if (!applications) return 0;
    return applications.filter(app => app.videoPath).length;
  }

  /**
   * Count scheduled interviews
   */
  getInterviewCount(applications: HistoryDTO[]): number {
    if (!applications) return 0;
    return applications.filter(app => 
      app.interviewStatus && app.interviewStatus !== 'NON_PLANIFIE'
    ).length;
  }

  /**
   * Get accepted applications count for selected candidate
   */
  getAcceptedCount(applications: HistoryDTO[]): number {
    if (!applications) return 0;
    return applications.filter(app => app.statutCandidature === 'ACCEPTÉE').length;
  }

  /**
   * Get pending applications count for selected candidate
   */
  getPendingCount(applications: HistoryDTO[]): number {
    if (!applications) return 0;
    return applications.filter(app => app.statutCandidature === 'EN_ATTENTE').length;
  }

  /**
   * Get rejected applications count for selected candidate
   */
  getRejectedCount(applications: HistoryDTO[]): number {
    if (!applications) return 0;
    return applications.filter(app => app.statutCandidature === 'REFUSÉE').length;
  }
}