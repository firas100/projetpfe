import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup-component',
  standalone: false,
  templateUrl: './signup-component.html',
  styleUrls: ['./signup-component.css']
})
export class SignupComponent {
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

    console.log('Tentative d\'inscription avec :', signupData);
    this.authService.signup(signupData).subscribe({
      next: (response: any) => {
        console.log('Réponse d\'inscription :', response);
        if (response.success) {
          this.message = response.message || 'Inscription réussie !';
          this.messageType = 'success';
          form.resetForm();
          this.router.navigate(['/login']).then(success => {
            console.log('Navigation vers /login réussie :', success);
          });
        } else {
          this.message = response.message || 'Échec de l\'inscription.';
          this.messageType = 'error';
        }
      },
      
      
    });
  }

  goLogin() {
    this.router.navigate(['/login']);
  }
}