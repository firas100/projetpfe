import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

interface Offre {
  idOffre: number;
  titreOffre: string;
  descriptionJob: string;
  competencesTechniques: string;
  profilRecherche: string;
  nbreDePoste: number;
}

interface FilterOption {
  id: string;
  label: string;
  icon: string;
}

interface FilterStates {
  cdi: boolean;
  cdd: boolean;
  freelance: boolean;
  stage: boolean;
  remote: boolean;
  hybrid: boolean;
  onsite: boolean;
}

@Component({
  selector: 'app-home-offre',
  standalone: false,
  templateUrl: './home-offre.component.html',
  styleUrls: ['./home-offre.component.scss']
})
export class HomeOffreComponent implements OnInit, OnDestroy {
  offres: Offre[] = [];
  filteredOffresCache: Offre[] = [];
  searchTerm: string = '';
  searchSubject: Subject<string> = new Subject();
  currentPage: number = 1;
  pageSize: number = 6;
  showDetails: Map<number, boolean> = new Map();
  activeFilter: string = 'all';
  isLoading: boolean = false;
  error: string | null = null;
  savedOffers: Set<number> = new Set();
  hoveredCardId: number | null = null;

  // Mobile menu and sidebar states
  mobileMenuOpen: boolean = false;
  sidebarOpen: boolean = false;

  // Additional filter states
  filters: FilterStates = {
    cdi: false,
    cdd: false,
    freelance: false,
    stage: false,
    remote: false,
    hybrid: false,
    onsite: false
  };

  // Expose Math to template
  Math = Math;

  filterOptions: FilterOption[] = [
    { id: 'all', label: 'Tous les postes', icon: '📋' },
    { id: 'recent', label: 'Récentes', icon: '🕐' },
    { id: 'remote', label: 'À distance', icon: '🌍' },
    { id: 'featured', label: 'En vedette', icon: '⭐' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOffres();
    this.initializeSearchListener();
    this.loadSavedOffers();
    this.setupBodyClickListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSearchListener(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
      });
  }

  private setupBodyClickListener(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const sidebar = document.querySelector('.sidebar-filters');
        const toggleBtn = document.querySelector('.filters-toggle-btn');
        
        if (this.sidebarOpen && 
            sidebar && 
            !sidebar.contains(target) && 
            toggleBtn && 
            !toggleBtn.contains(target)) {
          this.sidebarOpen = false;
        }
      });
    }
  }

  loadOffres(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<Offre[]>('http://localhost:8086/Offre/getAlloffre').subscribe({
      next: (res: Offre[]) => {
        this.offres = res || [];
        this.filteredOffresCache = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Erreur lors du chargement des offres. Veuillez réessayer.';
        console.error('Erreur lors du chargement:', err);
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  setFilter(filterId: string): void {
    this.activeFilter = filterId;
    this.currentPage = 1;
    this.scrollToTop();
    
    // Close sidebar on mobile after selecting filter
    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
    }
  }

  filteredOffres(): Offre[] {
    let filtered = [...this.offres];

    // Search filter
    if (this.searchTerm?.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(o =>
        o.titreOffre?.toLowerCase().includes(searchLower) ||
        o.descriptionJob?.toLowerCase().includes(searchLower) ||
        o.competencesTechniques?.toLowerCase().includes(searchLower) ||
        o.profilRecherche?.toLowerCase().includes(searchLower)
      );
    }

    // Category filters
    switch (this.activeFilter) {
      case 'recent':
        filtered.sort((a, b) => b.idOffre - a.idOffre);
        break;
      case 'remote':
        filtered = filtered.filter(o =>
          o.descriptionJob?.toLowerCase().includes('distance') ||
          o.descriptionJob?.toLowerCase().includes('remote')
        );
        break;
      case 'featured':
        filtered = filtered.filter(o => o.nbreDePoste >= 2);
        break;
    }

    // Apply checkbox filters if any are active
    // (In a real app, you would filter based on actual job properties)
    // This is a placeholder implementation
    const hasActiveFilters = Object.values(this.filters).some(v => v);
    if (hasActiveFilters) {
      // Example filter logic - customize based on your data structure
      if (this.filters.remote) {
        filtered = filtered.filter(o => 
          o.descriptionJob?.toLowerCase().includes('remote') ||
          o.descriptionJob?.toLowerCase().includes('distance')
        );
      }
    }

    this.filteredOffresCache = filtered;
    return filtered;
  }

  paginatedOffres(): Offre[] {
    const filtered = this.filteredOffres();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    if (startIndex >= filtered.length && this.currentPage > 1) {
      this.currentPage = Math.max(1, this.totalPages());
      return filtered.slice(
        (this.currentPage - 1) * this.pageSize,
        this.currentPage * this.pageSize
      );
    }

    return filtered.slice(startIndex, endIndex);
  }

  totalPages(): number {
    const totalItems = this.filteredOffres().length;
    return Math.max(1, Math.ceil(totalItems / this.pageSize));
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const pages: number[] = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(total, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.scrollToTop();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToTop();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
      this.scrollToTop();
    }
  }

  toggleDetails(id: number): void {
    const current = this.showDetails.get(id) || false;
    this.showDetails.set(id, !current);
  }

  toggleSaveOffer(offre: Offre, event: Event): void {
    event.stopPropagation();
    if (this.savedOffers.has(offre.idOffre)) {
      this.savedOffers.delete(offre.idOffre);
    } else {
      this.savedOffers.add(offre.idOffre);
    }
    this.saveSavedOffers();
  }

  isSaved(id: number): boolean {
    return this.savedOffers.has(id);
  }

  private loadSavedOffers(): void {
    const saved = localStorage.getItem('savedOffers');
    if (saved) {
      this.savedOffers = new Set(JSON.parse(saved));
    }
  }

  private saveSavedOffers(): void {
    localStorage.setItem('savedOffers', JSON.stringify(Array.from(this.savedOffers)));
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  goToAddCandidature(offre: Offre): void {
    const isAuthenticated = !!localStorage.getItem('user_id');

    const offreData = {
      idOffre: offre.idOffre,
      titre: offre.titreOffre,
      descriptionJob: offre.descriptionJob,
      competencesTechniques: offre.competencesTechniques,
      profilRecherche: offre.profilRecherche,
      nbreDePoste: offre.nbreDePoste
    };

    localStorage.setItem('pendingOffre', JSON.stringify(offreData));

    if (!isAuthenticated) {
      const encodedParams = Object.entries(offreData)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      const returnUrl = `/candidature?${encodedParams}`;

      this.router.navigate(['/login'], {
        queryParams: { returnUrl },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate(['/candidature'], { queryParams: offreData });
    }
  }

  shareOffer(offre: Offre, event: Event): void {
    event.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: offre.titreOffre,
        text: offre.descriptionJob,
        url: window.location.href
      }).catch(err => console.log('Erreur partage:', err));
    } else {
      const shareUrl = `${window.location.href}?job=${offre.idOffre}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Lien copié dans le presse-papiers!');
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.activeFilter = 'all';
    this.currentPage = 1;
    
    // Reset all checkbox filters
    this.filters = {
      cdi: false,
      cdd: false,
      freelance: false,
      stage: false,
      remote: false,
      hybrid: false,
      onsite: false
    };
  }

  getFilterLabel(): string {
    const filter = this.filterOptions.find(f => f.id === this.activeFilter);
    return filter?.label || 'Tous les postes';
  }

  getSkillsArray(skills: string): string[] {
    return skills ? skills.split(',').map(s => s.trim()) : [];
  }

  extractSkillsPreview(skills: string, count: number = 3): string[] {
    return this.getSkillsArray(skills).slice(0, count);
  }

  onCardHover(id: number | null): void {
    this.hoveredCardId = id;
  }
}