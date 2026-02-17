import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/services/auth.service';
import { Router, RouterLink, RouterModule } from '@angular/router';
@Component({
  selector: 'app-question-pre-interview',
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  templateUrl: './question-pre-interview.component.html',
  styleUrl: './question-pre-interview.component.scss'
})
export class QuestionPreInterviewComponent {
ProcessVideos() {
throw new Error('Method not implemented.');
}
questionData: { question: string }[] = [{ question: '' }];
  sidebarCollapsed: boolean = false;
  message: string | null = null;
  isLoading: boolean = false;
  username: string = '';
  searchTerm: string = '';
  currentPage: number = 1;
totalCandidates: any;
questionMenuOpen: any;
isProcessingVideos: any;
topPerformers: any;


  constructor(private http: HttpClient, private authService: AuthService,private router:Router) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    console.log('username est:', this.username);
  }

  addQuestionField() {
    this.questionData.push({ question: '' });
  }

  removeQuestionField(index: number) {
    if (this.questionData.length > 1) {
      this.questionData.splice(index, 1);
    }
  }
   applyFilters(): void {
    console.log('🔍 Applying filters:', {
      searchTerm: this.searchTerm
    });
  }

  addQuestions(form: NgForm): void {
    if (form.valid && this.questionData.every(q => q.question.trim().length >= 3)) {
      this.isLoading = true;
      this.message = null;

      this.http.post('http://localhost:8086/Question/addQuestion', this.questionData)
        .subscribe({
          next: () => {
            this.message = 'Toutes les questions ont été enregistrées avec succès !';
            this.isLoading = false;
            form.resetForm();
            this.questionData = [{ question: '' }]; 
          },
          error: (error) => {
            this.message = `Erreur lors de l'enregistrement : ${error.message}`;
            this.isLoading = false;
            console.error(error);
          }
        });
    } else {
      this.message = 'Veuillez remplir correctement toutes les questions (min 3 caractères chacune).';
    }
  }
    toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  applyFilter() {
    this.currentPage = 1;
  }
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}