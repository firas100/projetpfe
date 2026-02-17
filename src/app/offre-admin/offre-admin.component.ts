import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

interface Offre {
  idOffre: number;
  titreOffre: string;
  descriptionJob: string;
  competencesTechniques: string;
  profilRecherche: string;
  nbreDePoste: number;
  enable: boolean;
}

@Component({
  selector: 'app-offre-admin',
  templateUrl: './offre-admin.component.html',
  styleUrls: ['./offre-admin.component.scss'],
  standalone: false
})
export class OffreAdminComponent implements OnInit {
  // Data arrays
  offres: Offre[] = [];
  filteredOffres: Offre[] = [];
  paginatedOffres: Offre[] = [];

  // State
  loading: boolean = true;
  error: string | null = null;
  editingOffre: Offre | null = null;
  
  // User
  username = '';
  
  // UI State
  sidebarCollapsed = false;
  searchTerm = '';
  viewMode: 'grid' | 'list' = 'grid';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  sortBy: 'recent' | 'title' | 'posts' = 'recent';
  
  // Pagination
  currentPage = 1;
  pageSize = 9;
  
  // Stats
  totalOffres = 0;
  activeOffres = 0;
  inactiveOffres = 0;

  // Make Math available in template
  Math = Math;
totalCandidates: any;
questionMenuOpen: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadOffres();
    this.initKeyboardShortcuts();
  }

  /**
   * Initialize keyboard shortcuts for better UX
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
   * Load all offers from API
   */
  loadOffres(): void {
    this.loading = true;
    this.error = null;
    
    this.http.get<Offre[]>('http://localhost:8086/Offre/getAllOffresAdmin').subscribe({
      next: (res) => {
        this.offres = res;
        this.calculateStats();
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading offers:', err);
        this.error = 'Impossible de charger les offres. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  /**
   * Calculate statistics from offers
   */
  calculateStats(): void {
    this.totalOffres = this.offres.length;
    this.activeOffres = this.offres.filter(o => o.enable).length;
    this.inactiveOffres = this.totalOffres - this.activeOffres;
  }

  /**
   * Get total number of posts across all offers
   */
  getTotalPosts(): number {
    return this.offres.reduce((sum, offre) => sum + offre.nbreDePoste, 0);
  }

  /**
   * Apply all filters and sorting
   */
  applyFilter(): void {
    let filtered = [...this.offres];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(offre =>
        offre.titreOffre.toLowerCase().includes(term) ||
        offre.descriptionJob.toLowerCase().includes(term) ||
        offre.competencesTechniques.toLowerCase().includes(term) ||
        offre.profilRecherche.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.filterStatus === 'active') {
      filtered = filtered.filter(o => o.enable);
    } else if (this.filterStatus === 'inactive') {
      filtered = filtered.filter(o => !o.enable);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return a.titreOffre.localeCompare(b.titreOffre);
        case 'posts':
          return b.nbreDePoste - a.nbreDePoste;
        case 'recent':
        default:
          return b.idOffre - a.idOffre;
      }
    });

    this.filteredOffres = filtered;
    this.currentPage = 1;
    this.paginate();
  }

  /**
   * Paginate the filtered offers
   */
  paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOffres = this.filteredOffres.slice(start, end);
    
    // Scroll to top of content when paginating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Navigate to previous page
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginate();
    }
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginate();
    }
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginate();
    }
  }

  /**
   * Get total number of pages
   */
  get totalPages(): number {
    return Math.ceil(this.filteredOffres.length / this.pageSize);
  }

  /**
   * Generate page numbers for pagination
   */
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    
    if (total <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      if (current <= 4) {
        // Near the start
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (current >= total - 3) {
        // Near the end
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        // In the middle
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }
    
    return pages;
  }

  /**
   * Set view mode (grid or list)
   */
  setView(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    // Save preference to localStorage
    localStorage.setItem('offerViewMode', mode);
  }

  /**
   * Set filter status
   */
  setFilterStatus(status: 'all' | 'active' | 'inactive'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  /**
   * Set sorting method
   */
  setSortBy(sort: 'recent' | 'title' | 'posts'): void {
    this.sortBy = sort;
    this.applyFilter();
  }

  /**
   * Navigate to add offer page
   */
  onAddOffre(): void {
    this.router.navigate(['/AjouterOffre']);
  }

  /**
   * Open edit modal for offer
   */
  onEditOffre(offre: Offre): void {
    this.editingOffre = { ...offre };
  }

  /**
   * Save edited offer
   */
  saveEdit(): void {
    if (!this.editingOffre) return;

    // Validate fields
    if (!this.editingOffre.titreOffre.trim()) {
      alert('Le titre de l\'offre est requis');
      return;
    }
    if (!this.editingOffre.descriptionJob.trim()) {
      alert('La description est requise');
      return;
    }
    if (!this.editingOffre.competencesTechniques.trim()) {
      alert('Les compétences techniques sont requises');
      return;
    }

    this.http.put<Offre>(
      `http://localhost:8086/Offre/update/${this.editingOffre.idOffre}`,
      this.editingOffre
    ).subscribe({
      next: (updated) => {
        // Update the offer in the array
        const index = this.offres.findIndex(o => o.idOffre === updated.idOffre);
        if (index > -1) {
          this.offres[index] = updated;
        }
        
        this.calculateStats();
        this.applyFilter();
        this.editingOffre = null;
        
        // Show success message
        this.showSuccessMessage('Offre mise à jour avec succès');
      },
      error: (err) => {
        console.error('Update error:', err);
        alert('Erreur lors de la mise à jour de l\'offre');
      }
    });
  }

  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.editingOffre = null;
  }

  /**
   * Delete an offer
   */
  onDeleteOffre(offre: Offre): void {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'offre "${offre.titreOffre}" ?\n\nCette action est irréversible.`;
    
    if (confirm(confirmMessage)) {
      this.http.delete(`http://localhost:8086/Offre/delete/${offre.idOffre}`).subscribe({
        next: () => {
          this.offres = this.offres.filter(o => o.idOffre !== offre.idOffre);
          this.calculateStats();
          this.applyFilter();
          this.showSuccessMessage('Offre supprimée avec succès');
        },
        error: (err) => {
          console.error('Delete error:', err);
          alert('Erreur lors de la suppression de l\'offre');
        }
      });
    }
  }

  /**
   * Toggle offer enable status
   */
  onToggleEnable(offre: Offre): void {
    this.http.put<Offre>(
      `http://localhost:8086/Offre/toggleEnable/${offre.idOffre}`,
      {}
    ).subscribe({
      next: (toggled) => {
        const index = this.offres.findIndex(o => o.idOffre === toggled.idOffre);
        if (index > -1) {
          this.offres[index] = toggled;
        }
        
        this.calculateStats();
        this.applyFilter();
        
        const message = toggled.enable 
          ? 'Offre activée avec succès' 
          : 'Offre désactivée avec succès';
        this.showSuccessMessage(message);
      },
      error: (err) => {
        console.error('Toggle error:', err);
        alert('Erreur lors du changement de statut');
      }
    });
  }

  /**
   * View offer details
   */
  onViewOffre(offre: Offre): void {
    // You can navigate to a detail page or open a modal
    console.log('View details:', offre);
    // Example: this.router.navigate(['/offer-details', offre.idOffre]);
  }

  /**
   * Logout user
   */
  onLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /**
   * Get skills array from comma-separated string
   */
  getSkillsArray(skills: string): string[] {
    return skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 5);
  }

  /**
   * Clear search term
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  /**
   * Show success message (you can enhance this with a toast notification)
   */
  private showSuccessMessage(message: string): void {
    console.log('Success:', message);
    // You can implement a toast notification service here
  }
}