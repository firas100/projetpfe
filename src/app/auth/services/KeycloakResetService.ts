import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { Observable } from 'rxjs';
import { keycloakConfig } from '../../keycloakConfig';

@Injectable({
  providedIn: 'root'
})
export class KeycloakResetService {
  constructor(private http: HttpClient, private keycloak: KeycloakService) {}

  validateActionToken(): Observable<any> {
    const actionToken = this.getActionToken();
    if (!actionToken) {
      throw new Error('Pas de token d\'action dans l\'URL');
    }
    const validateUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/login-actions/action-token?key=${actionToken}`;
    return this.http.get(validateUrl);
  }

  updatePassword(newPassword: string): Observable<any> {
    const actionToken = this.getActionToken();
    if (!actionToken) {
      throw new Error('Pas de token d\'action');
    }
    const actionUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/login-actions/execute-action-token?key=${actionToken}`;
    
    // Pas de Bearer token (pas de session) ; le 'key' param suffit pour auth
    return this.http.post(actionUrl, { passwordNew: newPassword });  // Body pour UPDATE_PASSWORD
  }

  private getActionToken(): string {
    return new URLSearchParams(window.location.search).get('key') || '';
  }
}