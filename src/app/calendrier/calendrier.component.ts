import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/services/auth.service';
import { Router, RouterLink, RouterModule } from '@angular/router';

// Interfaces
export interface Candidat {
  id_candidature: number;
  prenom: string;
  nom: string;
  email: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Offre {
  idOffre: number;
  titreOffre: string;
}

export interface CandidateEmailDTO {
  id_candidature: number;
  prenom: string;
  nom: string;
  email: string;
  dateCandidature: string;
  finalScore: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: any;
}

@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule, RouterModule, RouterLink],
  templateUrl: './calendrier.component.html',
  styleUrls: ['./calendrier.component.scss']
})
export class CalendrierComponent implements OnInit {
  // API Configuration
  private readonly apiUrl = 'http://localhost:8086/Entretient';

  // Data Properties
  candidats: Candidat[] = [];
  managers: User[] = [];
  offres: Offre[] = [];
  highScoringCandidates: CandidateEmailDTO[] = [];

  // Form State
  selectedCandidatId: number | null = null;
  selectedManagerId: string | null = null;
  selectedOffreId: number | null = null;
  selectedDate: string | null = null;
  selectedCommentaire = '';
  commentaire = '';
  minScore = 55;

  // UI State
  showModal = false;
  showBatchModal = false;
  sidebarCollapsed = false;
  username = '';
  currentPage = 1;
  candidatesPerPage = 6;
  searchTerm = '';
  sortField = '';

  // Calendar Options
  calendarOptions: CalendarOptions;
questionMenuOpen: any;
totalCandidates: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      dateClick: this.handleDateClick.bind(this),
      eventClick: this.handleEventClick.bind(this),
      events: [],
      locale: 'fr',
      firstDay: 1, // Monday
      buttonText: {
        today: "Aujourd'hui",
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour'
      },
      height: 'auto',
      aspectRatio: 1.8
    };
  }

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadCandidats();
    this.loadManagers();
    this.loadOffres();
    this.loadCalendarEvents();
    this.setupKeyboardShortcuts();
    
    console.log('📅 Calendar Component initialized');
  }

  /**
   * Setup keyboard shortcuts
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

    // ESC to close modals
    if (event.key === 'Escape') {
      if (this.showModal) {
        this.closeModal();
      }
      if (this.showBatchModal) {
        this.closeBatchModal();
      }
    }
  }

  private setupKeyboardShortcuts(): void {
    console.log('⌨️ Keyboard shortcuts enabled');
  }

  /**
   * Load all candidates
   */
  loadCandidats(): void {
    console.log('👥 Loading candidates...');
    
    this.http.get<Candidat[]>(`${this.apiUrl}/candidats`).subscribe({
      next: (res) => {
        this.candidats = res || [];
        console.log('✅ Candidates loaded:', this.candidats.length);
      },
      error: (err) => {
        console.error('❌ Error loading candidates:', err);
        alert('Échec du chargement des candidats. Consultez la console pour plus de détails.');
      }
    });
  }
  

  /**
   * Load all managers
   */
  loadManagers(): void {
    console.log('👔 Loading managers...');
    
    this.http.get<User[]>(`${this.apiUrl}/managers`).subscribe({
      next: (res) => {
        this.managers = res || [];
        console.log('✅ Managers loaded:', this.managers.length);
      },
      error: (err) => {
        console.error('❌ Error loading managers:', err);
      }
    });
  }

  /**
   * Load all job offers
   */
  loadOffres(): void {
    console.log('💼 Loading job offers...');
    
    this.http.get<Offre[]>(`${this.apiUrl}/offres`).subscribe({
      next: (res) => {
        this.offres = res || [];
        console.log('✅ Job offers loaded:', this.offres.length);
      },
      error: (err) => {
        console.error('❌ Error loading job offers:', err);
      }
    });
  }

  /**
   * Load calendar events
   */
  loadCalendarEvents(): void {
    console.log('📆 Loading calendar events...');
    
    // TODO: Implement API endpoint to fetch scheduled interviews
    // For now, using empty array
    this.calendarOptions.events = [];
  }

  /**
   * Load high-scoring candidates for selected offer
   */
  loadHighScoringCandidates(): void {
    if (!this.selectedOffreId) {
      console.warn('⚠️ No offer selected');
      this.highScoringCandidates = [];
      return;
    }

    const url = `${this.apiUrl}/offres/${this.selectedOffreId}/high-scoring-candidates`;
    console.log('🔍 Loading high-scoring candidates for offer:', this.selectedOffreId);

    this.http.get<CandidateEmailDTO[]>(url).subscribe({
      next: (res) => {
        this.highScoringCandidates = res || [];
        console.log('✅ High-scoring candidates loaded:', this.highScoringCandidates.length);
        
        if (this.highScoringCandidates.length === 0) {
          console.warn('⚠️ No candidates meet the minimum score requirement');
          alert(`Aucun candidat ne correspond au score minimum de ${this.minScore}%`);
        }
      },
      error: (err) => {
        console.error('❌ Error loading high-scoring candidates:', err);
        alert('Erreur lors du chargement des candidats pour cette offre.');
        this.highScoringCandidates = [];
      }
    });
  }

  /**
   * Handle date click in calendar
   */
  handleDateClick(arg: DateClickArg): void {
    console.log('📅 Date clicked:', arg.dateStr);
    this.selectedDate = arg.dateStr;
    this.openModal();
  }

  /**
   * Handle event click in calendar
   */
  handleEventClick(arg: EventClickArg): void {
    console.log('🎯 Event clicked:', arg.event.title);
    // TODO: Show event details or edit modal
  }

  /**
   * Open single interview modal
   */
  openModal(): void {
    this.showModal = true;
    console.log('✨ Single interview modal opened');
  }

  /**
   * Close single interview modal
   */
  closeModal(): void {
    this.showModal = false;
    this.resetSingleForm();
    console.log('❌ Single interview modal closed');
  }

  /**
   * Open batch scheduling modal
   */
  openBatchModal(): void {
    this.showBatchModal = true;
    console.log('✨ Batch scheduling modal opened');
  }

  /**
   * Close batch scheduling modal
   */
  closeBatchModal(): void {
    this.showBatchModal = false;
    this.resetBatchForm();
    console.log('❌ Batch scheduling modal closed');
  }

  /**
   * Reset single interview form
   */
  private resetSingleForm(): void {
    this.selectedCandidatId = null;
    this.selectedManagerId = null;
    this.selectedDate = null;
    this.selectedCommentaire = '';
  }

  /**
   * Reset batch scheduling form
   */
  private resetBatchForm(): void {
    this.highScoringCandidates = [];
    this.selectedOffreId = null;
    this.selectedCandidatId = null;
    this.selectedManagerId = null;
    this.selectedDate = null;
    this.minScore = 55;
    this.commentaire = '';
  }

  /**
   * Schedule single interview
   */
  planifierEntretien(): void {
    if (this.selectedCandidatId == null || !this.selectedManagerId || !this.selectedDate) {
      alert('Veuillez remplir tous les champs obligatoires !');
      return;
    }

    const entretien = {
      candidatId: this.selectedCandidatId,
      managerId: this.selectedManagerId,
      dateEntretien: new Date(this.selectedDate).toISOString(),
      commentaire: this.selectedCommentaire
    };

    console.log('📤 Scheduling single interview:', entretien);

    const planifierUrl = `${this.apiUrl}/planifier`;
    this.http.post(planifierUrl, entretien).subscribe({
      next: () => {
        console.log('✅ Interview scheduled successfully');
        alert('Entretien planifié et emails envoyés avec succès !');
        this.closeModal();
        this.loadCalendarEvents(); // Refresh calendar
      },
      error: (err) => {
        console.error('❌ Error scheduling interview:', err);
        alert('Erreur lors de la planification de l\'entretien.');
      }
    });
  }

  /**
   * Schedule batch interviews by offer
   */
  planifierParOffre(): void {
    if (this.selectedOffreId == null || !this.selectedManagerId || !this.selectedDate) {
      alert('Veuillez remplir tous les champs obligatoires !');
      return;
    }

    if (this.highScoringCandidates.length === 0) {
      alert('Aucun candidat éligible pour cette offre.');
      return;
    }

    const dto = {
      offreId: this.selectedOffreId,
      managerId: this.selectedManagerId,
      dateEntretien: new Date(this.selectedDate).toISOString(),
      commentaire: this.commentaire,
      minScore: this.minScore
    };

    console.log('📤 Scheduling batch interviews:', dto);

    const batchUrl = `${this.apiUrl}/planifier-par-offre`;
    this.http.post(batchUrl, dto).subscribe({
      next: () => {
        console.log('✅ Batch interviews scheduled successfully');
        alert(`${this.highScoringCandidates.length} entretien(s) planifié(s) et emails envoyés avec succès !`);
        this.closeBatchModal();
        this.loadCalendarEvents(); // Refresh calendar
      },
      error: (err) => {
        console.error('❌ Error scheduling batch interviews:', err);
        alert('Erreur lors de la planification des entretiens.');
      }
    });
  }

  /**
   * Refresh calendar data
   */
  refreshCalendar(): void {
    console.log('🔄 Refreshing calendar...');
    this.loadCalendarEvents();
    this.loadCandidats();
    this.loadManagers();
    this.loadOffres();
  }

  /**
   * Get minimum datetime for date inputs (current date/time)
   */
  getMinDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  /**
   * Get total calendar events count
   */
  getTotalEvents(): number {
    if (Array.isArray(this.calendarOptions.events)) {
      return this.calendarOptions.events.length;
    }
    return 0;
  }

  /**
   * Apply filters
   */
  applyFilter(): void {
    this.currentPage = 1;
    console.log('🔍 Filters applied:', this.searchTerm);
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    console.log('📱 Sidebar toggled:', this.sidebarCollapsed ? 'collapsed' : 'expanded');
  }

  /**
   * Export calendar to ICS
   */
  exportToICS(): void {
    console.log('📤 Exporting calendar to ICS...');
    // TODO: Implement ICS export
    alert('Fonctionnalité d\'export ICS à implémenter');
  }

  /**
   * Print calendar
   */
  printCalendar(): void {
    console.log('🖨️ Printing calendar...');
    window.print();
  }

  /**
   * Navigate to today in calendar
   */
  goToToday(): void {
    console.log('📅 Navigating to today...');
    // FullCalendar API will handle this via the 'today' button
  }

  /**
   * Change calendar view
   */
  changeView(view: string): void {
    console.log('👁️ Changing calendar view to:', view);
    // FullCalendar API will handle this
  }

  /**
   * Get formatted date for display
   */
  formatDate(date: string | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Check if date is in the past
   */
  isPastDate(date: string): boolean {
    return new Date(date) < new Date();
  }

  /**
   * Get candidate full name
   */
  getCandidateName(candidat: Candidat | CandidateEmailDTO): string {
    return `${candidat.prenom} ${candidat.nom}`;
  }

  /**
   * Get manager full name
   */
  getManagerName(managerId: string): string {
    const manager = this.managers.find(m => m.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : 'Inconnu';
  }

  /**
   * Get offer title
   */
  getOfferTitle(offreId: number): string {
    const offer = this.offres.find(o => o.idOffre === offreId);
    return offer ? offer.titreOffre : 'Inconnu';
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
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 Calendar Component destroyed');
  }
}