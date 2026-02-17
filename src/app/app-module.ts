import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

import { AppComponent } from './app.component';
import { CandidatpageComponent } from './candidatpage/candidatpage.component';
import { GetallcandidatComponent } from './getallcandidat/getallcandidat.component';
import { RecommendationComponent } from './recommendation/recommendation.component';
import { AppRoutingModule } from './app-routing-module';
import { UserInfoComponent } from './auth/user-info-component/user-info-component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendrierComponent } from './calendrier/calendrier.component';
import { MangercalendrierComponent } from './mangercalendrier/mangercalendrier.component';
import { SafeUrlPipe } from './mangercalendrier/SafeUrlPipe';
import { ListCandidatapresentretienComponent } from './list-candidatapresentretien/list-candidatapresentretien.component';
import { OffreComponent } from './offre/offre.component';
import { HomeOffreComponent } from './home-offre/home-offre.component';
import { OffreAdminComponent } from './offre-admin/offre-admin.component';
import { SuivicandidatureComponent } from './suivicandidature/suivicandidature.component';
import { CandidateHistoryComponent } from './candidate-history/candidate-history.component';
import { AdminSignupComponent } from './admin-signup/admin-signup.component';
import { Router } from '@angular/router';
import { keycloakConfig } from './keycloakConfig';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { AllQuestionComponent } from './all-question/all-question.component';
import { HistoriqueManagerComponent } from './historique-manager/historique-manager.component';

export function initializeKeycloak(keycloak: KeycloakService, router: Router) {
  return () => {
    // Init standard, avec check pour reset
    return keycloak.init({
      config: keycloakConfig,
      initOptions: {
        onLoad: router.url.startsWith('/reset-password') ? undefined : 'check-sso',  
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        redirectUri: router.url.startsWith('/reset-password') ? window.location.origin + '/reset-password' : window.location.origin + '/login',
        checkLoginIframe: router.url.startsWith('/reset-password') ? false : true,  
        enableLogging: true
      },
      enableBearerInterceptor: !router.url.startsWith('/reset-password'),  
      bearerExcludedUrls: ['/assets']
    }).then((authenticated) => {
      console.log('Keycloak init OK:', authenticated);
      if (authenticated && router.url.startsWith('/reset-password')) {
        // Auto-navigate si action requise (optionnel, après validation token dans composant)
        keycloak.getKeycloakInstance().updateToken(30).then(() => {
          const requiredActions = keycloak.getKeycloakInstance().tokenParsed?.['requiredActions'] || [];
          if (!requiredActions.includes('UPDATE_PASSWORD')) {
            router.navigate(['/login']);
          }
        }).catch(() => {});  // Ignore si pas de token (normal pour reset)
      }
    }).catch(err => console.error('Keycloak init error:', err));
  };
}

@NgModule({
  declarations: [
    AppComponent,UserInfoComponent,OffreComponent,HomeOffreComponent,OffreAdminComponent,SuivicandidatureComponent,AdminSignupComponent
    ,ForgetPasswordComponent,AllQuestionComponent,HistoriqueManagerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ListCandidatapresentretienComponent,
    CandidateHistoryComponent,
    FormsModule,
    CommonModule,
    CandidatpageComponent,
    KeycloakAngularModule,
    AppRoutingModule,
    GetallcandidatComponent,     
    RecommendationComponent,
     FormsModule,
    CommonModule,
    FullCalendarModule,
    SafeUrlPipe,
    
        
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
