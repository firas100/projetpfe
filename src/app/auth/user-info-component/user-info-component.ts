import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
@Component({
  selector: 'app-user-info-component',
  standalone: false,
  templateUrl: './user-info-component.html',
  styleUrl: './user-info-component.css'
})



export class UserInfoComponent {
   private apiUrl = 'http://localhost:8086/api/auth/getUsers'; 

  users: User[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    this.http.get<User[]>(this.apiUrl).subscribe({
      next: (res) => {
        this.users = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
      }
    });
  }
}