import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';
import { interval, Subscription, switchMap } from 'rxjs';

interface Entretien {
  id: number;
  candidat: { 
    nom: string; 
    prenom: string; 
    email: string; 
    cvPath: string;  
  };
  dateEntretien: string;
  status: string;
  commentaire?: string; 
}
interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
  entretienId: number; 
}
@Component({
  selector: 'app-mangercalendrier',
  standalone: false,
  templateUrl: './mangercalendrier.component.html',
  styleUrl: './mangercalendrier.component.css'
})

export class MangercalendrierComponent implements OnInit, OnDestroy {
 apiUrl = 'http://localhost:8086/Entretient';
  managerId: string | null = null;  
  username: string = '';
  isSettingsOpen = false;
  searchTerm: string = '';
  sidebarCollapsed: boolean = false;
  currentPage: number = 1;

  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    eventClick: this.handleEventClick.bind(this)
  };

  showModal = false;
  selectedEntretien: Entretien | null = null;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotifications = false;
  private pollingSubscription: Subscription | null = null;

  constructor(private http: HttpClient,
      private authService: AuthService,private router: Router) {}

ngOnInit() {
    this.username = this.authService.getUsername();
    const names = this.username.trim().split(' ');
    console.log('Contenu complet du localStorage:', localStorage);
    this.managerId = localStorage.getItem('user_id');

    if (this.managerId) {
      console.log('Manager ID trouvé :', this.managerId);
      this.loadEntretiens();
      this.loadNotifications(); 
      this.startPolling();
    } else {
      console.error('Manager ID non trouvé dans localStorage');
    }
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  loadEntretiens() {
    if (!this.managerId) return;
    this.http.get<Entretien[]>(`${this.apiUrl}/manager/${this.managerId}/entretiens`)
      .subscribe(data => {
        this.calendarOptions.events = data.map(e => ({
          id: e.id.toString(),
          title: `${e.candidat.nom} ${e.candidat.prenom} (${e.status})`,
          start: e.dateEntretien,
          color: this.getColorByStatus(e.status),
          extendedProps: { entretien: e }
        }));
      });
  }

  loadNotifications() {
    if (!this.managerId) return;
    this.http.get<Notification[]>(`${this.apiUrl}/notifications/manager/${this.managerId}`)
      .subscribe(data => {
        const newNotifications = data.filter(n => !this.notifications.some(existing => existing.id === n.id));
        if (newNotifications.length > 0) {
          this.notifications = [...newNotifications, ...this.notifications]; 
          this.unreadCount += newNotifications.length;
        }
      });
  }

  startPolling() {
    this.pollingSubscription = interval(1000000) 
      .pipe(
        switchMap(() => this.http.get<Notification[]>(`${this.apiUrl}/notifications/manager/${this.managerId}`))
      )
      .subscribe(data => {
        const newNotifications = data.filter(n => !this.notifications.some(existing => existing.id === n.id && !n.read));
        if (newNotifications.length > 0) {
          this.notifications = [...newNotifications, ...this.notifications];
          this.unreadCount += newNotifications.length;
        }
      });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.markAllAsRead();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    this.http.post(`${this.apiUrl}/notifications/mark-read`, { managerId: this.managerId }).subscribe();
  }

  viewNotification(notification: Notification) {
    this.http.get<Entretien>(`${this.apiUrl}/${notification.entretienId}`)
      .subscribe(entretien => {
        this.selectedEntretien = entretien;
        this.showModal = true;
        this.showNotifications = false;
      });
  }

  getColorByStatus(status: string): string {
    switch (status) {
      case 'CONFIRME': return 'green';
      case 'REFUSE': return 'red';
      default: return 'gray';
    }
  }

  handleEventClick(clickInfo: EventClickArg) {
    const entretien: Entretien = clickInfo.event.extendedProps['entretien'];
    this.selectedEntretien = { ...entretien };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedEntretien = null;
  }

 updateStatus() {
  if (this.selectedEntretien) {
    const payload = {
      id: this.selectedEntretien.id,
      status: this.selectedEntretien.status,
      commentaire: this.selectedEntretien.commentaire
    };

    this.http.put(`${this.apiUrl}/updateStatusetComment`, payload)
      .subscribe(() => {
        this.loadEntretiens();
        this.closeModal();
      });
  }
}

  get selectedCvPath(): string | null {
    if (!this.selectedEntretien?.candidat?.cvPath) return null;
    return `http://localhost:8086/files/cv/${this.selectedEntretien.candidat.cvPath}`;
  }

  openCv() {
    if (this.selectedEntretien?.candidat.cvPath) {
      const url = `http://localhost:8086/files/cv/${this.selectedEntretien.candidat.cvPath}`;
      window.open(url, '_blank'); 
    }
  }
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  openSettings() {
    this.isSettingsOpen = true;
   
  }
  applyFilter() {
    this.currentPage = 1;
  }
toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}