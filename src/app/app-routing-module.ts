import { NgModule } from '@angular/core';
import { LoginComponent } from './auth/login-component/login-component';
import { SignupComponent } from './auth/signup-component/signup-component';
import { UserInfoComponent } from './auth/user-info-component/user-info-component';
import { Routes, RouterModule, Router } from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';
import { CandidatpageComponent } from './candidatpage/candidatpage.component';
import { GetallcandidatComponent } from './getallcandidat/getallcandidat.component';
import { RecommendationComponent } from './recommendation/recommendation.component';
import { EnregistrementVideoComponent } from './enregistrement-video/enregistrement-video.component';
import { QuestionPreInterviewComponent } from './question-pre-interview/question-pre-interview.component';
import { RoleGuard } from './auth/services/RoleGuard';
import { CalendrierComponent } from './calendrier/calendrier.component';
import { MangercalendrierComponent } from './mangercalendrier/mangercalendrier.component';
import { ListCandidatapresentretienComponent } from './list-candidatapresentretien/list-candidatapresentretien.component';
import { OffreComponent } from './offre/offre.component';
import { HomeOffreComponent } from './home-offre/home-offre.component';
import { SuivicandidatureComponent } from './suivicandidature/suivicandidature.component';
import { OffreAdminComponent } from './offre-admin/offre-admin.component';
import { CandidateHistoryComponent } from './candidate-history/candidate-history.component';
import { AdminSignupComponent } from './admin-signup/admin-signup.component';



export class AuthGuard extends KeycloakAuthGuard {
  constructor(protected override readonly router: Router, protected readonly keycloak: KeycloakService) {
    super(router, keycloak);
  }

  public async isAccessAllowed(): Promise<boolean> {
    if (!(await this.keycloak.isLoggedIn())) {
      await this.keycloak.login({
        redirectUri: window.location.origin + this.router.url
      });
    }
    return true;
  }
}

const routes: Routes = [
  { path: '', redirectTo: '/AllOffre', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'user-info', component: UserInfoComponent},
  { path: 'candidature', component: CandidatpageComponent,canActivate: [RoleGuard],
    data: { role: 'CANDIDAT' }
  },
  { path: 'getall', component: GetallcandidatComponent,},
  { path: 'recommendation', component: RecommendationComponent,canActivate: [RoleGuard],
    data: { role: 'RH'}},
  {path: 'preinterview', component: EnregistrementVideoComponent ,canActivate: [RoleGuard],
    data: { role: 'CANDIDAT'}},
  {path: 'ajouterQuestion', component: QuestionPreInterviewComponent},
  {path: 'Calendrier', component: CalendrierComponent,canActivate: [RoleGuard],
    data: { role: 'RH'}},
  {path: 'getCandidats', component: ListCandidatapresentretienComponent,canActivate: [RoleGuard],
    data: { role: 'RH'}},
  {path: 'CalendrierManger', component: MangercalendrierComponent,canActivate: [RoleGuard],
    data: { role: 'MANAGER'}},
  {path: 'AjouterOffre', component: OffreComponent,canActivate: [RoleGuard],
    data: { role: 'RH'}},
    {path: 'AllOffre', component: HomeOffreComponent,},
    {path: 'MesCandidature', component: SuivicandidatureComponent,canActivate: [RoleGuard],
    data: { role: 'CANDIDAT'}},
    {path: 'OfferByAdmin', component: OffreAdminComponent,canActivate: [RoleGuard],
    data: { role: 'RH'}},
    {path: 'HistoriqueCandidat', component: CandidateHistoryComponent,canActivate: [RoleGuard],
    data: { role: 'RH'}},
    {path: 'SipnupManger', component: AdminSignupComponent,canActivate: [RoleGuard],
    data: { role: 'RH'}},


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}