import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { catchError, map, Observable, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl ="http://localhost:8086/api/auth";
  private keycloakUrl = 'http://localhost:9090/realms/pfe-realm/protocol/openid-connect/token'; // Keycloak token endpoint

  constructor(private http:HttpClient, private keycloak:KeycloakService) { }

  adminSignup(userData: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  const body = new URLSearchParams();
  body.set('username', userData.username);
  body.set('email', userData.email);
  body.set('firstName', userData.firstName);
  body.set('lastName', userData.lastName);
  body.set('password', userData.password);

  return this.http.post(`${this.apiUrl}/admin/signup`, body.toString(), { headers });
}

  signup(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    const body = new URLSearchParams();
    body.set('username', userData.username);
    body.set('email', userData.email);
    body.set('firstName', userData.firstName);
    body.set('lastName', userData.lastName);
    body.set('password', userData.password);

    return this.http.post(`${this.apiUrl}/signup`, body.toString(), { headers });
  }
   login(email: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'spring-boot-app');
    body.set('client_secret', 'EN3ixRgYKw08xgaVyHxg7lh9EjJpzQrZ');
    body.set('username', email);
    body.set('password', password);

    return this.http.post(this.keycloakUrl, body.toString(), { headers }).pipe(
      map((response: any) => {
        const accessToken = response.access_token;
        const refreshToken = response.refresh_token;
        const expiresIn = response.expires_in;

        // Decode JWT
        const decodedToken: any = jwtDecode(accessToken);
        // Log raw decoded token for debugging
        console.log('Decoded JWT:', decodedToken);
        // Extract roles, checking multiple possible claims
        const roles = (decodedToken.realm_access?.roles || decodedToken.roles || decodedToken.resource_access?.['spring-boot-app']?.roles || []);
        const username = decodedToken.given_name && decodedToken.family_name 
         ? `${decodedToken.given_name} ${decodedToken.family_name}` 
        : decodedToken.preferred_username || decodedToken.email || decodedToken.name || 'User';
        const sub = decodedToken.sub;

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('token_expiry', (Date.now() + expiresIn * 1000).toString());
        localStorage.setItem('user_roles', JSON.stringify(roles));
        localStorage.setItem('username', username);
        localStorage.setItem('user_id', sub);
        return { accessToken, refreshToken, expiresIn, roles,username, sub };
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => new Error(error.error?.error_description || 'Login failed'));
      })
    );
  }

  getUsername(): string {
  return localStorage.getItem('username') || '';
}

  getUserRoles(): string[] {
    const roles = localStorage.getItem('user_roles');
    console.log('Retrieved roles from localStorage:', roles);
    return roles ? JSON.parse(roles) : [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  getToken(): Promise<string> {
    return this.keycloak.getToken();
  }

  getUserInfo(): Promise<any> {
    return this.keycloak.loadUserProfile();
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user_roles');
    this.keycloak.logout('http://localhost:4200');
  }

  async isLoggedIn(): Promise<boolean> {
  const token = localStorage.getItem('access_token');
  const expiry = localStorage.getItem('token_expiry');
  if (!token || !expiry) return false;

  return Date.now() < parseInt(expiry, 10);
}
}