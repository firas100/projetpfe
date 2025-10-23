import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login-component',
  standalone: false,
  templateUrl: './login-component.html',
  styleUrls: ['./login-component.css']
})
export class LoginComponent implements OnInit {
  loginData = {
    email: '',
    password: ''
  };
  message = '';
  messageType: 'success' | 'error' | '' = '';
  returnUrl: string | null = null;

  constructor(private authService: AuthService, private router: Router,
    private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || null;
     
    });
  }

  onLogin(form: NgForm) {
    if (form.invalid) {
      this.message = 'Veuillez remplir tous les champs requis.';
      this.messageType = 'error';
      alert(this.message);  
      return;
    }

    console.log('Return URL in onLogin:', this.returnUrl);

    this.message = '';
    console.log('Attempting login with:', this.loginData);

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        const roles = response.roles.map((role: string) => role.trim().toUpperCase()); 
        console.log('Normalized user roles:', roles);

        if (this.returnUrl) {
          console.log('Navigating to returnUrl:', this.returnUrl);
          this.router.navigateByUrl(this.returnUrl).then(success => {
            console.log('Navigation to returnUrl success:', success);
            if (!success) {
              console.error('Navigation to returnUrl failed');
            }
          });
        } else {
          if (roles.includes('RH')) {
            console.log('Navigating to /recommendation for RH role');
            this.router.navigate(['/recommendation']).then(success => { 
              console.log('Navigation to /recommendation success:', success);
              if (!success) {
                console.error('Navigation to /recommendation failed');
              }
            });
          } else if (roles.includes('CANDIDAT')) {
            console.log('Navigating to /candidature for CANDIDAT role');
            this.router.navigate(['/candidature']).then(success => {
              console.log('Navigation to /candidature success:', success);
              if (!success) {
                console.error('Navigation to /candidature failed');
              }
            });
          } else if (roles.includes('MANAGER')) {
            console.log('Navigating to /CalendrierManger for MANAGER role');
            this.router.navigate(['/CalendrierManger']).then(success => {
              console.log('Navigation to /CalendrierManger success:', success);
              if (!success) {
                console.error('Navigation to /CalendrierManger failed');
              }
            });
          } else {
            console.log('No valid roles found:', roles);
            this.message = 'Aucun rôle valide trouvé. Veuillez contacter l\'administrateur.';
            this.messageType = 'error';
            alert(this.message); 
          }
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.message = error.error?.message || error.message || 'Erreur lors de la connexion.';
        if (this.message.includes('Invalid user credentials') || error.status === 401) {
          this.message = 'Email ou mot de passe incorrect.'; 
        }
        this.messageType = 'error';
        alert(this.message);  
      }
    });
  }

  goSignup() {
    this.router.navigate(['/signup']);
  }
}