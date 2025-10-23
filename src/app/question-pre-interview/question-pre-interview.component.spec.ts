import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgForm } from '@angular/forms';

interface Question {
  id: number;
  question: string;
}

@Component({
  selector: 'app-question-pre-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './question-pre-interview.component.html',
  styleUrls: ['./question-pre-interview.component.css']
})
export class QuestionPreInterviewComponent implements OnInit {

  /** SIDEBAR */
  sidebarCollapsed: boolean = false;
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /** SEARCH & SORT */
  searchTerm: string = '';
  sortField: string = '';
  applyFilter() {
    this.currentPage = 1;
    console.log('Searching for:', this.searchTerm);
  }
  applySort() {
    if (!this.sortField) return;
    this.questions.sort((a: any, b: any) => {
      if (this.sortField === 'question') return a.question.localeCompare(b.question);
      return b[this.sortField] - a[this.sortField];
    });
    console.log('Sorting by:', this.sortField);
  }

  /** ACTION BUTTONS */
  inviteTopCandidates() {
    console.log('Inviting top candidates...');
  }
  ProcessVideos() {
    console.log('Processing videos...');
  }

  /** QUESTIONS FORM */
  questionData: { question: string }[] = [{ question: '' }];
  isLoading: boolean = false;
  message: string = '';

  addQuestionField() {
    this.questionData.push({ question: '' });
  }

  removeQuestionField(index: number) {
    this.questionData.splice(index, 1);
  }

  addQuestions(form: NgForm) {
    if (form.invalid) {
      this.message = 'Erreur : Veuillez remplir toutes les questions correctement.';
      return;
    }
    this.isLoading = true;
    this.message = '';

    console.log('Questions to add:', this.questionData);

    setTimeout(() => {
      this.questionData.forEach(q => {
        this.questions.push({
          id: this.questions.length + 1,
          question: q.question
        });
      });
      this.isLoading = false;
      this.message = 'Questions ajoutées avec succès !';
      form.resetForm();
      this.questionData = [{ question: '' }];
      this.applySort();
    }, 1000);
  }

  /** QUESTIONS LIST */
  questions: Question[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 6;

  filteredQuestions(): Question[] {
    if (!this.searchTerm) return this.questions;
    return this.questions.filter(q =>
      q.question.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  paginatedQuestions(): Question[] {
    const filtered = this.filteredQuestions();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.ceil(this.filteredQuestions().length / this.itemsPerPage);
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  removeQuestion(q: Question) {
    this.questions = this.questions.filter(qq => qq.id !== q.id);
  }

  constructor() { }

  ngOnInit(): void { }
}