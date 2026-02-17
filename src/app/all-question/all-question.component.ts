import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { QuestionService } from '../auth/services/QuestionService';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-all-question',
  standalone: false,
  templateUrl: './all-question.component.html',
  styleUrl: './all-question.component.scss'
})

export class AllQuestionComponent {

 questions: any[] = [];
  editingQuestionId: number | null = null;
  editedQuestionText: string = '';
  searchTerm: string = '';
  username = '';

  
  // Sidebar state
  sidebarCollapsed: boolean = false;
  questionMenuOpen: boolean = true;

  constructor(
    private questionService: QuestionService, 
    private router: Router,
        private authService: AuthService,
  ) {}

  ngOnInit(): void {
        this.username = this.authService.getUsername();

    this.loadQuestions();
  }

  // Charger toutes les questions
  loadQuestions() {
    this.questionService.getAllQuestions().subscribe(data => {
      this.questions = data;
    });
  }

  // Filtrer les questions selon le terme de recherche
  filteredQuestions() {
    if (!this.searchTerm.trim()) {
      return this.questions;
    }
    return this.questions.filter(q => 
      q.question.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Supprimer une question
  delete(id: number) {
    if (confirm('Voulez-vous vraiment supprimer cette question ?')) {
      this.questionService.deleteQuestion(id).subscribe(() => {
        this.loadQuestions();
        // Optionnel: afficher un message de succès
        alert('Question supprimée avec succès !');
      }, error => {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la question.');
      });
    }
  }

  // Activer le mode édition pour une question
  editQuestion(q: any) {
    this.editingQuestionId = q.idquestion;
    this.editedQuestionText = q.question;
  }

  // Annuler l'édition
  cancelEdit() {
    this.editingQuestionId = null;
    this.editedQuestionText = '';
  }

  // Sauvegarder les modifications
  saveEdit(id: number) {
    if (!this.editedQuestionText.trim()) {
      alert('La question ne peut pas être vide.');
      return;
    }

    const updatedQ = { question: this.editedQuestionText };

    this.questionService.updateQuestion(id, updatedQ).subscribe(() => {
      // Mettre à jour la question dans la liste locale
      const q = this.questions.find(q => q.idquestion === id);
      if (q) {
        q.question = this.editedQuestionText;
      }

      // Réinitialiser l'état d'édition
      this.editingQuestionId = null;
      this.editedQuestionText = '';
      
      alert('Question modifiée avec succès !');
    }, error => {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification de la question.');
    });
  }

  // Toggle sidebar
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  onLogout(): void {
    console.log('👋 Logging out user:', this.username);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
    applyFilters(): void {
    console.log('🔍 Applying filters:', {
      searchTerm: this.searchTerm
    });
  }
}