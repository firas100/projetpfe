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
  styleUrls: ['./offre-admin.component.css'],
  standalone: false
})
export class OffreAdminComponent implements OnInit {
  offres: Offre[] = [];
  filteredOffres: Offre[] = [];
  paginatedOffres: Offre[] = [];
  loading: boolean = true;
  error: string | null = null;
  editingOffre: Offre | null = null;
  username = '';
  sidebarCollapsed = false;
  searchTerm = '';
  currentPage = 1;
  pageSize = 9;
  totalOffres = 0;
  activeOffres = 0;
  inactiveOffres = 0;
  viewMode: 'grid' | 'list' = 'grid';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  sortBy: 'recent' | 'title' | 'posts' = 'recent';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadOffres();
  }

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
        this.error = 'Erreur lors du chargement des offres';
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.totalOffres = this.offres.length;
    this.activeOffres = this.offres.filter(o => o.enable).length;
    this.inactiveOffres = this.totalOffres - this.activeOffres;
  }

  applyFilter(): void {
    let filtered = [...this.offres];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
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

  paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedOffres = this.filteredOffres.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginate();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginate();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.paginate();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOffres.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  }

  setView(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  setFilterStatus(status: 'all' | 'active' | 'inactive'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  setSortBy(sort: 'recent' | 'title' | 'posts'): void {
    this.sortBy = sort;
    this.applyFilter();
  }

  onAddOffre(): void {
    this.router.navigate(['/AjouterOffre']);
  }

  onEditOffre(offre: Offre): void {
    this.editingOffre = { ...offre };
  }

  saveEdit(): void {
    if (this.editingOffre) {
      this.http.put<Offre>(
        `http://localhost:8086/Offre/update/${this.editingOffre.idOffre}`,
        this.editingOffre
      ).subscribe({
        next: (updated) => {
          const index = this.offres.findIndex(o => o.idOffre === updated.idOffre);
          if (index > -1) this.offres[index] = updated;
          this.calculateStats();
          this.applyFilter();
          this.editingOffre = null;
        },
        error: (err) => {
          console.error('Update error:', err);
          alert('Erreur lors de la mise à jour');
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingOffre = null;
  }

  onDeleteOffre(offre: Offre): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'offre "${offre.titreOffre}" ?`)) {
      this.http.delete(`http://localhost:8086/Offre/delete/${offre.idOffre}`).subscribe({
        next: () => {
          this.offres = this.offres.filter(o => o.idOffre !== offre.idOffre);
          this.calculateStats();
          this.applyFilter();
        },
        error: (err) => {
          console.error('Delete error:', err);
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

  onToggleEnable(offre: Offre): void {
    this.http.put<Offre>(
      `http://localhost:8086/Offre/toggleEnable/${offre.idOffre}`,
      {}
    ).subscribe({
      next: (toggled) => {
        const index = this.offres.findIndex(o => o.idOffre === toggled.idOffre);
        if (index > -1) this.offres[index] = toggled;
        this.calculateStats();
        this.applyFilter();
      },
      error: (err) => {
        console.error('Toggle error:', err);
        alert('Erreur lors du changement de statut');
      }
    });
  }

  onViewOffre(offre: Offre): void {
    console.log('View details:', offre);
    // Navigate to detail view or open modal
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getSkillsArray(skills: string): string[] {
    return skills.split(',').map(s => s.trim()).filter(s => s).slice(0, 5);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }
}