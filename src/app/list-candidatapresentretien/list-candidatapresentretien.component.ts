import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

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
  styleUrls: ['./list-candidatapresentretien.component.css'],
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [DatePipe]
})
export class ListCandidatapresentretienComponent {
  apiUrl = 'http://localhost:8086/Entretient/getCandidats';
  entretiens: Entretien[] = [];
  filteredEntretiens: Entretien[] = [];
  searchTerm: string = '';
  selectedStatus: string = '';
  sidebarCollapsed: boolean = false;
  currentPage: number = 1;
  pageSize: number = 5;
  username: string = '';
  paginatedEntretiens: Entretien[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadEntretiens();
  }

  loadEntretiens(): void {
    this.http.get<Entretien[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.entretiens = data || [];
        this.filteredEntretiens = [...this.entretiens];
        this.applyFilter();
      },
      error: (err) => console.error('Erreur chargement entretiens', err)
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    this.filteredEntretiens = this.entretiens.filter(e =>
      (e.candidat.nom?.toLowerCase().includes(term) ||
       e.candidat.prenom?.toLowerCase().includes(term) ||
       e.candidat.email?.toLowerCase().includes(term)) &&
      (!this.selectedStatus || e.status === this.selectedStatus)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  filterByStatus(): void {
    this.applyFilter();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedEntretiens = this.filteredEntretiens.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredEntretiens.length / this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  avatarColor(candidat: { nom: string; prenom: string }): string {
    const str = (candidat.nom || '') + (candidat.prenom || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 70%, 80%)`;
  }

  initials(candidat: { nom: string; prenom: string }): string {
    const prenomInitial = candidat.prenom ? candidat.prenom.charAt(0).toUpperCase() : '';
    const nomInitial = candidat.nom ? candidat.nom.charAt(0).toUpperCase() : '';
    return prenomInitial + nomInitial;
  }

  scheduleNewInterview() {
    alert('Fonctionnalité de planification à implémenter');
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}