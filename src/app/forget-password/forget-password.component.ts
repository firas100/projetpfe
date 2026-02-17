import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forget-password',
  standalone: false,
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css'
})
export class ForgetPasswordComponent {
email: string = '';
  message: string = '';
  isLoading: boolean = false;
  isSuccess: boolean = false;

  private backendUrl = 'http://localhost:8086/api/auth/forgot-password';  // Ton endpoint

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    if (!this.email) {
      this.message = 'Veuillez saisir votre email.';
      return;
    }

    this.isLoading = true;
    this.message = 'Envoi en cours...';

    this.http.post(this.backendUrl, null, {
      params: { email: this.email },
      responseType: 'text'
    }).subscribe({
      next: (res) => {
        this.message = res;  // Ex. : "Email de réinitialisation envoyé à : email@example.com"
        this.isSuccess = true;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);  // Redirige après succès
      },
      error: (err) => {
        this.message = 'Erreur : ' + (err.error || 'Impossible d\'envoyer l\'email. Vérifiez votre email.');
        this.isSuccess = false;
        this.isLoading = false;
      }
    });
  }

}
