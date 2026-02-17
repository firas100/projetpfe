import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

// Interfaces
export interface Entretien {
  id: number;
  dateEntretien: string;
  commentaire?: string;
  status: string;
  candidat: {
    nom: string;
    prenom: string;
    email: string;
  };
  managerId: string;
  managerEmail: string;
  managerName: string;
}

@Component({
  selector: 'app-list-candidatapresentretien',
  standalone: true,
  templateUrl: './list-candidatapresentretien.component.html',
  styleUrls: ['./list-candidatapresentretien.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [DatePipe]
})
export class ListCandidatapresentretienComponent implements OnInit {
  // API Configuration
  private readonly apiUrl = 'http://localhost:8086/Entretient/getCandidats';

  // Data Properties
  entretiens: Entretien[] = [];
  filteredEntretiens: Entretien[] = [];
  paginatedEntretiens: Entretien[] = [];
  
  // Filter & Search State
  searchTerm = '';
  selectedStatus = '';
  
  // Pagination State
  currentPage = 1;
  pageSize = 5;
  
  // UI State
  sidebarCollapsed = false;
  username = '';
  isLoading = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadEntretiens();
    this.setupKeyboardShortcuts();
    
    console.log('🎯 Interview List Component initialized');
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
    
    // Arrow keys for pagination
    if (event.key === 'ArrowLeft' && this.currentPage > 1) {
      event.preventDefault();
      this.prevPage();
    }
    
    if (event.key === 'ArrowRight' && this.currentPage < this.totalPages) {
      event.preventDefault();
      this.nextPage();
    }
  }

  /**
   * Setup additional keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    console.log('⌨️ Keyboard shortcuts enabled');
  }

  /**
   * Load all interviews from API
   */
  loadEntretiens(): void {
    this.isLoading = true;
    console.log('📥 Loading interviews from API...');

    this.http.get<Entretien[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.entretiens = data || [];
        this.filteredEntretiens = [...this.entretiens];
        this.applyFilter();
        this.isLoading = false;
        
        console.log('✅ Interviews loaded successfully:', this.entretiens.length);
        console.log('📊 Stats:', {
          total: this.entretiens.length,
          confirmed: this.getConfirmedCount(),
          pending: this.getPendingCount(),
          rejected: this.getRejectedCount()
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Error loading interviews:', err);
        
        // Show user-friendly error message
        alert('Erreur lors du chargement des entretiens. Veuillez réessayer.');
      }
    });
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    console.log('📱 Sidebar toggled:', this.sidebarCollapsed ? 'collapsed' : 'expanded');
  }

  /**
   * Apply all filters and update pagination
   */
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    this.filteredEntretiens = this.entretiens.filter(e => {
      // Search filter
      const matchesSearch = !term || 
        e.candidat.nom?.toLowerCase().includes(term) ||
        e.candidat.prenom?.toLowerCase().includes(term) ||
        e.candidat.email?.toLowerCase().includes(term) ||
        e.managerName?.toLowerCase().includes(term);
      
      // Status filter
      const matchesStatus = !this.selectedStatus || e.status === this.selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
    
    this.currentPage = 1;
    this.updatePagination();
    
    console.log('🔍 Filters applied:', {
      searchTerm: term,
      selectedStatus: this.selectedStatus,
      results: this.filteredEntretiens.length
    });
  }

  /**
   * Filter by status
   */
  filterByStatus(): void {
    this.applyFilter();
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.applyFilter();
    
    console.log('🔄 Filters reset');
  }

  /**
   * Update paginated results
   */
  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedEntretiens = this.filteredEntretiens.slice(start, end);
    
    console.log('📄 Pagination updated:', {
      page: this.currentPage,
      total: this.totalPages,
      showing: this.paginatedEntretiens.length
    });
  }

  /**
   * Calculate total number of pages
   */
  get totalPages(): number {
    return Math.ceil(this.filteredEntretiens.length / this.pageSize) || 1;
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.scrollToTop();
      console.log('➡️ Next page:', this.currentPage);
    }
  }

  /**
   * Navigate to previous page
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.scrollToTop();
      console.log('⬅️ Previous page:', this.currentPage);
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
  avatarColor(candidat: { nom: string; prenom: string }): string {
    const str = (candidat.nom || '') + (candidat.prenom || '');
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
  initials(candidat: { nom: string; prenom: string }): string {
    const prenomInitial = candidat.prenom?.charAt(0).toUpperCase() ?? '';
    const nomInitial = candidat.nom?.charAt(0).toUpperCase() ?? '';
    return prenomInitial + nomInitial;
  }

  /**
   * Get status class for styling
   */
  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CONFIRME':
        return 'confirme';
      case 'EN_ATTENTE':
        return 'en-attente';
      case 'REFUSE':
        return 'refuse';
      default:
        return 'unknown';
    }
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CONFIRME':
        return 'fa-check-circle';
      case 'EN_ATTENTE':
        return 'fa-clock';
      case 'REFUSE':
        return 'fa-times-circle';
      default:
        return 'fa-question-circle';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CONFIRME':
        return 'Confirmé';
      case 'EN_ATTENTE':
        return 'En Attente';
      case 'REFUSE':
        return 'Refusé';
      default:
        return status;
    }
  }

  /**
   * Get count of confirmed interviews
   */
  getConfirmedCount(): number {
    return this.entretiens.filter(e => e.status === 'CONFIRME').length;
  }

  /**
   * Get count of pending interviews
   */
  getPendingCount(): number {
    return this.entretiens.filter(e => e.status === 'EN_ATTENTE').length;
  }

  /**
   * Get count of rejected interviews
   */
  getRejectedCount(): number {
    return this.entretiens.filter(e => e.status === 'REFUSE').length;
  }

  /**
   * Schedule new interview
   */
  scheduleNewInterview(): void {
    console.log('📅 Schedule new interview clicked');
    
    // TODO: Navigate to interview scheduling page
    // this.router.navigate(['/schedule-interview']);
    
    alert('Fonctionnalité de planification à implémenter.\nVous serez redirigé vers le formulaire de création d\'entretien.');
  }

  /**
   * View interview details
   */
  viewInterviewDetails(entretien: Entretien): void {
    console.log('👁️ Viewing interview details:', entretien.id);
    
    // TODO: Navigate to interview details page or open modal
    // this.router.navigate(['/interview', entretien.id]);
  }

  /**
   * Edit interview
   */
  editInterview(entretien: Entretien): void {
    console.log('✏️ Editing interview:', entretien.id);
    
    // TODO: Navigate to edit page or open edit modal
    // this.router.navigate(['/interview/edit', entretien.id]);
  }

  /**
   * Delete interview
   */
  deleteInterview(entretien: Entretien): void {
    console.log('🗑️ Deleting interview:', entretien.id);
    
    const confirmDelete = confirm(
      `Êtes-vous sûr de vouloir supprimer l'entretien avec ${entretien.candidat.prenom} ${entretien.candidat.nom} ?`
    );
    
    if (confirmDelete) {
      // TODO: Call API to delete interview
      console.log('✅ Interview deletion confirmed');
    } else {
      console.log('❌ Interview deletion cancelled');
    }
  }

  /**
   * Contact candidate
   */
  contactCandidate(entretien: Entretien): void {
    if (!entretien.candidat.email) {
      alert('Email non disponible pour ce candidat');
      return;
    }

    const subject = encodeURIComponent(
      `Entretien prévu le ${this.datePipe.transform(entretien.dateEntretien, 'fullDate', '', 'fr')}`
    );
    const body = encodeURIComponent(
      `Bonjour ${entretien.candidat.prenom} ${entretien.candidat.nom},\n\nConcernant votre entretien prévu le ${this.datePipe.transform(entretien.dateEntretien, 'fullDate', '', 'fr')}.\n\nCordialement,\nL'équipe SIGA Recruitment`
    );
    
    const mailtoUrl = `mailto:${entretien.candidat.email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    
    console.log('📧 Opening email client for:', entretien.candidat.email);
  }

  /**
   * Contact manager
   */
  contactManager(entretien: Entretien): void {
    if (!entretien.managerEmail) {
      alert('Email du manager non disponible');
      return;
    }

    const subject = encodeURIComponent(
      `Entretien avec ${entretien.candidat.prenom} ${entretien.candidat.nom}`
    );
    const body = encodeURIComponent(
      `Bonjour ${entretien.managerName},\n\nConcernant l'entretien avec ${entretien.candidat.prenom} ${entretien.candidat.nom} prévu le ${this.datePipe.transform(entretien.dateEntretien, 'fullDate', '', 'fr')}.\n\nCordialement,\nL'équipe SIGA Recruitment`
    );
    
    const mailtoUrl = `mailto:${entretien.managerEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    
    console.log('📧 Opening email client for manager:', entretien.managerEmail);
  }

  /**
   * Export interviews to CSV
   */
  exportToCSV(): void {
    console.log('📤 Exporting interviews to CSV...');
    
    // Create CSV content
    const headers = ['ID', 'Date', 'Candidat', 'Email', 'Statut', 'Manager', 'Commentaire'];
    const rows = this.filteredEntretiens.map(e => [
      e.id,
      this.datePipe.transform(e.dateEntretien, 'short', '', 'fr'),
      `${e.candidat.prenom} ${e.candidat.nom}`,
      e.candidat.email,
      e.status,
      e.managerName,
      e.commentaire || 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `entretiens_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ CSV export complete');
  }

  /**
   * Print interviews list
   */
  printInterviews(): void {
    console.log('🖨️ Printing interviews list...');
    window.print();
  }

  /**
   * Refresh interviews data
   */
  refreshData(): void {
    console.log('🔄 Refreshing interviews data...');
    this.loadEntretiens();
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
   * Track by function for *ngFor optimization
   */
  trackByInterviewId(index: number, entretien: Entretien): number {
    return entretien.id;
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 Interview List Component destroyed');
  }
}