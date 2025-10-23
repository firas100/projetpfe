import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KeycloakAngularModule } from 'keycloak-angular';

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



@NgModule({
  declarations: [
    AppComponent,UserInfoComponent,MangercalendrierComponent,OffreComponent,HomeOffreComponent,OffreAdminComponent,SuivicandidatureComponent,CandidateHistoryComponent,AdminSignupComponent

  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ListCandidatapresentretienComponent,
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
