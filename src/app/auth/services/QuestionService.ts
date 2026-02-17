import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {

  private baseUrl = 'http://localhost:8086/Question';

  constructor(private http: HttpClient) {}

  addQuestion(question: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/addQuestion`, [question]);
  }

  getAllQuestions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getAllQuestion`);
  }

  updateQuestion(id: number, question: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/UpdateQ/${id}`, question);
  }

  deleteQuestion(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deleteQ/${id}`);
  }
}
