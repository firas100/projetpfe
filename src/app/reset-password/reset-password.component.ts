import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  email: string = '';
  message: string = '';

   constructor(private http: HttpClient) {}

   onSubmit() {
    this.http.post('http://localhost:8086/api/auth/forgot-password', null, {
      params: { email: this.email },
      responseType: 'text'
    }).subscribe({
      next: (res) => this.message = res,
      error: (err) => this.message = 'Erreur : ' + err.error
    });
  }
}
