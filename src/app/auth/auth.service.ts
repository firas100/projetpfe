import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8086/api/auth';
  private keycloakUrl = 'http://localhost:9090/realms/pfe-realm/protocol/openid-connect/token';

  constructor(private http: HttpClient) {
    console.log('AuthService initialized'); // Debug
  }

  login(email: string, password: string): Observable<any> {
  console.log('login called with:', { email, password }); // Debug

  const headers = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded'
  });

  const body = new URLSearchParams();
  body.set('grant_type', 'password');
  body.set('client_id', 'spring-boot-app');
  body.set('client_secret', 'azj0tReMlu71BajK0ZkZmDKpqFE2U0Gg');
  body.set('username', email);
  body.set('password', password);

  console.log('Sending request to:', this.keycloakUrl, 'with body:', body.toString());

  return this.http.post(this.keycloakUrl, body.toString(), { headers }).pipe(
    map((response: any) => {
      console.log('Keycloak response:', response);

      if (!response.access_token || !response.refresh_token || !response.expires_in) {
        console.error('Invalid response: missing tokens');
        throw new Error('Invalid response from server: missing tokens');
      }

      try {
        const accessToken = response.access_token;
        const refreshToken = response.refresh_token;
        const expiresIn = response.expires_in;
        const expiryTime = (Date.now() + expiresIn * 1000).toString();

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('token_expiry', expiryTime);

        console.log('Tokens successfully stored in localStorage:', {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: expiryTime
        });

        return {
          accessToken,
          refreshToken,
          expiresIn
        };
      } catch (storageError) {
        console.error('Error storing tokens in localStorage:', storageError);
        throw storageError;
      }
    }),
    catchError((error) => {
      console.error('Login request failed:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        message: error.message,
        error: error.error ? JSON.stringify(error.error, null, 2) : 'No error details'
      });
      return throwError(() => new Error(error.error?.error_description || 'Login failed'));
    })
  );
}


  getAccessToken(): string | null {
    const token = localStorage.getItem('access_token');
    console.log('getAccessToken:', token ? 'Token found' : 'No token found');
    return token;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getTokenExpiry(): string | null {
    return localStorage.getItem('token_expiry');
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    const expiry = this.getTokenExpiry();
    if (!token || !expiry) {
      console.log('isLoggedIn: No token or expiry found');
      return false;
    }
    const isValid = Date.now() < parseInt(expiry);
    console.log('isLoggedIn:', { token: !!token, expiry, isValid });
    return isValid;
  }

  logout(): void {
    console.log('Logging out, clearing localStorage');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    window.location.href = 'http://localhost:4200';
  }

  getUserInfo(): Observable<any> {
    const token = this.getAccessToken();
    if (!token) {
      console.error('getUserInfo: No token available');
      return throwError(() => new Error('No token available'));
    }
    return this.http.get('http://localhost:9090/realms/pfe-realm/protocol/openid-connect/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.error('refreshToken: No refresh token available');
      return throwError(() => new Error('No refresh token available'));
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', 'spring-boot-app');
    body.set('client_secret', 'azj0tReMlu71BajK0ZkZmDKpqFE2U0Gg');
    body.set('refresh_token', refreshToken);

    return this.http.post(this.keycloakUrl, body.toString(), { headers }).pipe(
      map((response: any) => {
        console.log('Refresh token response:', JSON.stringify(response, null, 2));
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        localStorage.setItem('token_expiry', (Date.now() + response.expires_in * 1000).toString());
        console.log('Refreshed tokens stored:', {
          access_token: localStorage.getItem('access_token'),
          refresh_token: localStorage.getItem('refresh_token'),
          token_expiry: localStorage.getItem('token_expiry')
        });
        return {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresIn: response.expires_in
        };
      }),
      catchError((error) => {
        console.error('Refresh token request failed:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: JSON.stringify(error.error, null, 2)
        });
        this.logout();
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }
}