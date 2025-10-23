import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Offre {
  idOffre: number;
  titreOffre: string;
  descriptionJob: string;
  competencesTechniques: string;
  profilRecherche: string;
  nbreDePoste: number;
}

@Component({
  selector: 'app-home-offre',
  standalone: false,
  templateUrl: './home-offre.component.html',
  styleUrls: ['./home-offre.component.css']
})
export class HomeOffreComponent implements OnInit {
  offres: Offre[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 6;
  showDetails: Map<number, boolean> = new Map();
  activeFilter: string = 'Toutes les offres';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private http: HttpClient, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOffres();
  }

  loadOffres(): void {
    this.isLoading = true;
    this.error = null;
    
    this.http.get<Offre[]>('http://localhost:8086/Offre/getAlloffre').subscribe({
      next: (res: Offre[]) => {
        this.offres = res;
        this.isLoading = false;
        console.log('Offres chargées:', res);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Erreur lors du chargement des offres. Veuillez réessayer.';
        console.error('Erreur lors du chargement des offres:', err);
      }
    });
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.scrollToTop();
  }

  filteredOffres(): Offre[] {
    let filtered = [...this.offres];

    if (this.searchTerm?.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(o =>
        o.titreOffre?.toLowerCase().includes(searchLower) ||
        o.descriptionJob?.toLowerCase().includes(searchLower) ||
        o.competencesTechniques?.toLowerCase().includes(searchLower) ||
        o.profilRecherche?.toLowerCase().includes(searchLower)
      );
    }

    if (this.activeFilter === 'Récentes') {
      filtered.sort((a, b) => b.idOffre - a.idOffre);
    } else if (this.activeFilter === 'À distance') {
      filtered = filtered.filter(o => 
        o.descriptionJob?.toLowerCase().includes('distance') || 
        o.descriptionJob?.toLowerCase().includes('remote')
      );
    }

    return filtered;
  }

  paginatedOffres(): Offre[] {
    const filtered = this.filteredOffres();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    if (startIndex >= filtered.length) {
      this.currentPage = Math.max(1, this.totalPages());
      return filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
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
    this.showDetails.set(id, !this.showDetails.get(id));
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  GoToAddCandidature(offre: Offre): void {
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
}