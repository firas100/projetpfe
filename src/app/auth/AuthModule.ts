import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { SignupComponent } from './signup-component/signup-component';
import { LoginComponent } from './login-component/login-component';
import { CandidatpageComponent } from '../candidatpage/candidatpage.component';

@NgModule({
  declarations: [SignupComponent,LoginComponent],
  imports: [
    CommonModule,
    FormsModule // Required for ngModel
  ],
  exports: [SignupComponent] // Optional: export if used elsewhere
})
export class AuthModule {}