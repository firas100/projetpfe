import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';

export interface Candidat { id_candidature: number; prenom: string; nom: string; email: string; }
export interface User { id: string; firstName: string; lastName: string; email: string; }
export interface Offre { idOffre: number; titreOffre: string; }
export interface CandidateEmailDTO { id_candidature: number; prenom: string; nom: string; email: string; dateCandidature: string; finalScore: number; }
@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './calendrier.component.html',
  styleUrls: ['./calendrier.component.css']
})
export class CalendrierComponent {
apiUrl = 'http://localhost:8086/Entretient';

  candidats: Candidat[] = [];
  managers: User[] = [];
  offres: Offre[] = [];

  selectedCandidatId: number | null = null;
  selectedManagerId: string | null = null;
  selectedDate: string | null = null;
  selectedCommentaire: string = '';
  username = '';

  showModal = false;

  selectedOffreId: number | null = null;
  minScore: number = 55;
  commentaire: string = '';
  highScoringCandidates: CandidateEmailDTO[] = [];
  showBatchModal = false;

  calendarOptions: any;

   currentPage: number = 1;
  candidatesPerPage: number = 6;
   searchTerm: string = '';
  sortField: string = '';
  sidebarCollapsed: boolean = false;

  constructor(private http: HttpClient,
      private authService: AuthService,private router: Router) {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      dateClick: this.handleDateClick.bind(this)
    };
  }

  ngOnInit() {
    this.loadCandidats();
    this.loadManagers();
    this.loadOffres();
    this.username = this.authService.getUsername();

  }

  loadCandidats() {
  this.http.get<Candidat[]>('http://localhost:8086/Entretient/candidats')
    .subscribe({
      next: res => this.candidats = res,
      error: err => {
        console.error('Error loading candidats:', err);
        alert('Failed to load candidates. Check console for details.');
      }
    });
}

  loadManagers() {
    this.http.get<User[]>('http://localhost:8086/Entretient/managers')
      .subscribe(res => this.managers = res);
  }

  loadOffres() {
    this.http.get<Offre[]>('http://localhost:8086/Entretient/offres')
      .subscribe(res => this.offres = res);
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; }

  openBatchModal() { this.showBatchModal = true; }
  closeBatchModal() { 
    this.showBatchModal = false; 
    this.highScoringCandidates = []; 
    this.selectedOffreId = null; 
    this.selectedManagerId = null; 
    this.selectedDate = null; 
    this.minScore = 55; 
    this.commentaire = ''; 
  }

 loadHighScoringCandidates() {
  if (!this.selectedOffreId) {
    console.warn('Aucune offre sélectionnée');
    this.highScoringCandidates = [];
    return;
  }

  const url = `${this.apiUrl}/offres/${this.selectedOffreId}/high-scoring-candidates`;
  console.log('URL appelée :', url);

  this.http.get<CandidateEmailDTO[]>(url).subscribe({
    next: res => {
      this.highScoringCandidates = res;
      console.log('Candidats chargés :', res);
    },
    error: err => {
      console.error('Erreur chargement candidats par offre:', err);
      alert('Erreur chargement candidats pour cette offre.');
    }
  });
}

  planifierEntretien() {
    if (this.selectedCandidatId == null || !this.selectedManagerId || !this.selectedDate) {
      alert('Veuillez remplir tous les champs !');
      return;
    }

    const entretien = {
      candidatId: this.selectedCandidatId,
      managerId: this.selectedManagerId,
      dateEntretien: new Date(this.selectedDate).toISOString(),
      commentaire: this.selectedCommentaire
    };

    const planifierUrl = 'http://localhost:8086/Entretient/planifier';
    this.http.post(planifierUrl, entretien).subscribe({
      next: () => {
        alert('Entretien planifié et emails envoyés !');
        this.closeModal();
      },
      error: err => console.error(err)
    });
  }

  planifierParOffre() {
    if (this.selectedOffreId == null || !this.selectedManagerId || !this.selectedDate) {
      alert('Veuillez remplir tous les champs !');
      return;
    }

    const dto = {
      offreId: this.selectedOffreId,
      managerId: this.selectedManagerId,
      dateEntretien: new Date(this.selectedDate).toISOString(),
      commentaire: this.commentaire,
      minScore: this.minScore
    };

    const batchUrl = 'http://localhost:8086/Entretient/planifier-par-offre';
    this.http.post(batchUrl, dto).subscribe({
      next: () => {
        alert('Entretiens planifiés et emails envoyés !');
        this.closeBatchModal();
      },
      error: err => console.error(err)
    });
  }

  handleDateClick(arg: DateClickArg) {
    this.selectedDate = arg.dateStr;
    this.openModal();
  }
   applyFilter() {
    this.currentPage = 1;
  }
  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}