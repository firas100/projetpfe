import { Component } from '@angular/core';
import { CandidateHistoryDTO, CandidatService, HistoryDTO } from '../auth/services/candidat.service';

@Component({
  selector: 'app-candidate-history',
  standalone: false,
  templateUrl: './candidate-history.component.html',
  styleUrl: './candidate-history.component.css'
})
export class CandidateHistoryComponent {
histories: CandidateHistoryDTO[] = [];
  selectedHistory?: CandidateHistoryDTO;
  loading = true;
  error?: string;
  candidateIdInput = 0;

  constructor(private candidatService: CandidatService) {}

  ngOnInit(): void {
    this.loadAllHistories();
  }

  trackByCandidateId(index: number, history: CandidateHistoryDTO): number {
    return history.candidateId;
  }

  trackByApplicationId(index: number, app: HistoryDTO): number {
    return app.candidatureId;
  }

  safeValue(value: any): any {
    return value != null ? value : 'N/A';
  }

  loadAllHistories(): void {
    this.loading = true;
    this.error = undefined;
    this.candidatService.getAllHistories().subscribe({
      next: (data) => {
        this.histories = data;
        console.log('Histories loaded with cvPath:', this.histories.map(h => ({ candidateId: h.candidateId, cvPath: h.cvPath, appCvPaths: h.applications.map(a => a.cvPath) })));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des historiques';
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadHistoryById(id: number): void {
    this.loading = true;
    this.error = undefined;
    this.candidatService.getHistoryById(id).subscribe({
      next: (data) => {
        this.selectedHistory = data;
        console.log('Selected history with cvPath:', data.cvPath, 'Apps cvPath:', data.applications.map(a => a.cvPath));
        this.loading = false;
      },
      error: (err) => {
        this.error = `Erreur lors du chargement de l'historique pour l'ID ${id}`;
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadHistoryByIdInput(): void {
    if (this.candidateIdInput > 0) {
      this.loadHistoryById(this.candidateIdInput);
    } else {
      this.error = 'Veuillez entrer un ID valide.';
    }
  }

  openCv(): void {
    if (this.selectedHistory?.cvPath) {
      const url = `http://localhost:8086/files/cv/${this.selectedHistory.cvPath}`;
      console.log('Opening CV URL:', url);
      window.open(url, '_blank');
    } else {
      alert('Aucun CV disponible pour ce candidat.');
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}