import { Component } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-signup',
  standalone: false,
  templateUrl: './admin-signup.component.html',
  styleUrl: './admin-signup.component.css'
})
export class AdminSignupComponent {
userData = {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  };
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.message = 'Veuillez remplir tous les champs requis correctement.';
      this.messageType = 'error';
      console.log('Formulaire invalide :', form.value);
      return;
    }

    if (this.userData.password !== this.userData.confirmPassword) {
      this.message = 'Les mots de passe ne correspondent pas.';
      this.messageType = 'error';
      console.log('Les mots de passe ne correspondent pas.');
      return;
    }

    const signupData = {
      username: this.userData.username,
      email: this.userData.email,
      firstName: this.userData.firstName,
      lastName: this.userData.lastName,
      password: this.userData.password
    };

    console.log('Tentative d\'inscription admin avec :', signupData);
    this.authService.adminSignup(signupData).subscribe({
      next: (response: any) => {
        console.log('Réponse d\'inscription admin :', response);
        if (response.success) {  // Adaptez si votre backend renvoie {success: true, message: '...'}
          this.message = response.message || 'Inscription admin réussie !';
          this.messageType = 'success';
          form.resetForm();
          this.router.navigate(['/login']).then(success => {
            console.log('Navigation vers /login réussie :', success);
          });
        } else {
          this.message = response.message || 'Échec de l\'inscription admin.';
          this.messageType = 'error';
        }
      },
      error: (error) => {
        console.error('Erreur d\'inscription admin :', error);
        this.message = error.message || 'Échec de l\'inscription admin.';
        this.messageType = 'error';
      }
    });
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

}
