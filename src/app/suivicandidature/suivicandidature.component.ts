// suivicandidature.component.ts
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./suivicandidature.component.scss'],
 
   
})
export class SuivicandidatureComponent implements OnInit {
  // Data
  candidatures: Candidature[] = [];
  filteredCandidatures: Candidature[] = [];
  selectedProgress: ProgressResponse | null = null;
  selectedCandidatureId: number | null = null;
  
  // State
  isLoading: boolean = false;
  errorMessage: string | null = null;
  
  // User
  candidatId: number | null = null;
  username = '';
  
  // UI
  sidebarCollapsed = false;
  searchTerm = '';
  pageSize = 6;
  currentPage = 1;

  // Step order for progress calculation
  private readonly STEP_ORDER = [
    'CANDIDATURE_ENREGISTREE',
    'CV_ANALYSE',
    'PREINTERVIEW_TERMINEE',
    'ENTRETIEN_PLANIFIE'
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.initKeyboardShortcuts();
    
    const keycloakId = localStorage.getItem('user_id');
    if (keycloakId) {
      this.loadCandidatures(keycloakId);
    } else {
      this.errorMessage = 'Utilisateur non identifié. Veuillez vous reconnecter.';
    }
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
   * Load candidatures for user
   */
  loadCandidatures(keycloakId: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.http
      .get<Candidature[]>(
        `http://localhost:8086/GetMesCandidature?keycloakId=${keycloakId}`
      )
      .subscribe({
        next: (data) => {
          console.log('✅ Candidatures loaded:', data.length);
          this.candidatures = data;
          this.filteredCandidatures = [...data];
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error loading candidatures:', err);
          this.errorMessage = 'Erreur lors du chargement des candidatures. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Reload applications
   */
  reloadApplications(): void {
    const keycloakId = localStorage.getItem('user_id');
    if (keycloakId) {
      this.loadCandidatures(keycloakId);
    }
  }

  /**
   * Toggle progress display for a candidature
   */
  toggleProgress(candidatureId: number): void {
    // Toggle: if clicking on same application, close it
    if (this.selectedCandidatureId === candidatureId) {
      this.selectedCandidatureId = null;
      this.selectedProgress = null;
      return;
    }

    // Open new application
    this.selectedCandidatureId = candidatureId;
    this.selectedProgress = null; // Reset to show loading
    
    this.http
      .get<ProgressResponse>(`http://localhost:8086/api/progress/${candidatureId}`)
      .subscribe({
        next: (data) => {
          console.log('✅ Progress loaded for candidature:', candidatureId);
          this.selectedProgress = data;
        },
        error: (err) => {
          console.error('❌ Error loading progress:', err);
          this.errorMessage = 'Erreur lors du chargement de la progression.';
          this.selectedCandidatureId = null;
        }
      });
  }

  /**
   * Check if application is selected
   */
  isApplicationSelected(candidatureId: number): boolean {
    return this.selectedCandidatureId === candidatureId;
  }

  /**
   * Check if step is completed
   */
  isStepCompleted(stepCode: string, currentStep: string): boolean {
    const stepIndex = this.STEP_ORDER.indexOf(stepCode);
    const currentIndex = this.STEP_ORDER.indexOf(currentStep);
    return stepIndex < currentIndex;
  }

  /**
   * Check if step is current
   */
  isStepCurrent(stepCode: string, currentStep: string): boolean {
    return stepCode === currentStep;
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(currentStep: string): number {
    const index = this.STEP_ORDER.indexOf(currentStep);
    if (index === -1) return 0;
    
    const total = this.STEP_ORDER.length - 1;
    return Math.round((index / total) * 100);
  }

  /**
   * Get step icon based on code
   */
  getStepIcon(stepCode: string): string {
    const icons: { [key: string]: string } = {
      'CANDIDATURE_ENREGISTREE': 'fa-paper-plane',
      'CV_ANALYSE': 'fa-file-alt',
      'PREINTERVIEW_TERMINEE': 'fa-video',
      'ENTRETIEN_PLANIFIE': 'fa-calendar-check'
    };
    return icons[stepCode] || 'fa-hourglass-half';
  }

  /**
   * Get current step label
   */
  getCurrentStepLabel(currentStep: string, steps: Step[]): string {
    const step = steps.find(s => s.code === currentStep);
    return step ? step.label : 'Étape inconnue';
  }

  /**
   * Format date to French locale
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return 'Date inconnue';
    
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
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
      this.filteredCandidatures = [...this.candidatures];
      return;
    }

    const search = this.searchTerm.toLowerCase().trim();
    this.filteredCandidatures = this.candidatures.filter(c => 
      c.titreOffre.toLowerCase().includes(search) ||
      c.id.toString().includes(search)
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
   * Get total applications count
   */
  getTotalApplications(): number {
    return this.candidatures.length;
  }

  /**
   * Get in-progress applications (estimate)
   */
  getInProgressApplications(): number {
    // This is an estimate - you might want to add actual status tracking
    return Math.ceil(this.candidatures.length * 0.6);
  }

  /**
   * Get scheduled interviews count (estimate)
   */
  getScheduledInterviews(): number {
    // This is an estimate - you might want to add actual status tracking
    return Math.floor(this.candidatures.length * 0.3);
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
}