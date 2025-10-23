  import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { CommonModule } from '@angular/common';
  import { AuthService } from '../auth/services/auth.service';
  import { ActivatedRoute, Router } from '@angular/router';
  import { FormsModule } from '@angular/forms';

  interface Questionpreinterview {
    idquestion: number;
    question: string;
  }

  @Component({
    selector: 'app-enregistrement-video',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './enregistrement-video.component.html',
    styleUrls: ['./enregistrement-video.component.css']
  })
  export class EnregistrementVideoComponent implements OnInit {
    @ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef;

    username: string = '';
    prenom: string = '';
    nom: string = '';
    mediaRecorder: any;
    chunks: Blob[] = [];
    isRecording = false;
    uploadMessage = '';
    questions: Questionpreinterview[] = [];
    globalMessage = '';
    timer = 90;
    timerInterval: any;
    isVideoRecorded = false;
    questionsCollapsed = false;
    isControlBarVisible = false;
    isSettingsOpen = false;
    cameras: MediaDeviceInfo[] = [];
    microphones: MediaDeviceInfo[] = [];
    selectedCamera: string = '';
    selectedMicrophone: string = '';
    email: string = '';
    offreId: number = 0;

    // NEW: Current question tracking
    currentQuestionIndex: number = 0;
    questionDuration: number = 30; 
    questionTimer: number = this.questionDuration;
    questionInterval: any;

    constructor(
      private http: HttpClient,
      private cdr: ChangeDetectorRef,
      private zone: NgZone,
      private authService: AuthService,
      private router: Router,
      private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
    this.username = this.authService.getUsername();
    const names = this.username.trim().split(' ');
    this.prenom = names[0] || '';
    this.nom = names.slice(1).join(' ') || '';
    this.route.queryParams.subscribe(params => {
    this.offreId = params['offreId'];
    this.email = params['email'];
  });
    

    this.getAllQuestions();
    this.loadMediaDevices();
    }

    async loadMediaDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.cameras = devices.filter(device => device.kind === 'videoinput');
        this.microphones = devices.filter(device => device.kind === 'audioinput');
        this.selectedCamera = this.cameras[0]?.deviceId || '';
        this.selectedMicrophone = this.microphones[0]?.deviceId || '';
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Erreur lors du chargement des périphériques:', error);
      }
    }

    async startRecording() {
      if (this.isVideoRecorded) return;

      this.uploadMessage = '';
      this.chunks = [];
      this.timer = this.questions.length * this.questionDuration || 90;
      this.globalMessage = '';
      this.currentQuestionIndex = 0;
      this.questionTimer = this.questionDuration;

      if (!this.videoPlayer || !this.videoPlayer.nativeElement) {
        console.error('Élément vidéo non trouvé');
        this.globalMessage = 'Erreur : L\'élément vidéo n\'est pas disponible.';
        this.cdr.detectChanges();
        return;
      }

      try {
        const constraints = {
          video: { deviceId: this.selectedCamera ? { exact: this.selectedCamera } : undefined },
          audio: { deviceId: this.selectedMicrophone ? { exact: this.selectedMicrophone } : undefined }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.videoPlayer.nativeElement.srcObject = stream;

        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (event: any) => {
          if (event.data.size > 0) this.chunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          const videoBlob = new Blob(this.chunks, { type: 'video/webm' });
          const formData = new FormData();
          const fileName = `${this.prenom}_${this.nom}_preinterview.webm`;
          formData.append('file', videoBlob, fileName);
          formData.append('nom', this.nom);
          formData.append('prenom', this.prenom);
          formData.append('email', this.email); // ⚠️ obligatoire !
          formData.append('offreId', String(this.offreId));

          this.http.post('http://localhost:8086/video/upload', formData).subscribe({
            next: () => {
              this.uploadMessage = '';
              this.showSuccessMessage();
            },
            error: () => {
              this.uploadMessage = 'Erreur lors de l’envoi';
              this.cdr.detectChanges();
            }
          });
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        this.isControlBarVisible = true;
        this.cdr.detectChanges();

        this.startTimer();
        this.startQuestionTimer();
      } catch (error) {
        console.error('Erreur accès caméra/micro', error);
        this.globalMessage = 'Erreur : Veuillez autoriser l’accès à la caméra et au microphone.';
        this.isRecording = false;
        this.cdr.detectChanges();
      }
    }

    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
        clearInterval(this.timerInterval);
        clearInterval(this.questionInterval);

        const stream: MediaStream = this.videoPlayer?.nativeElement?.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        this.isVideoRecorded = true;
        this.showSuccessMessage();
      }
    }

    getAllQuestions(): void {
      this.http.get<Questionpreinterview[]>('http://localhost:8086/Question/getAllQuestion')
        .subscribe({
          next: (data) => {
            this.zone.run(() => {
              this.questions = data;
              this.cdr.detectChanges();
            });
          },
          error: (error) => {
            console.error('Erreur lors du chargement des questions', error);
            this.globalMessage = 'Erreur lors du chargement des questions';
            this.cdr.detectChanges();
          }
        });
    }

    startTimer() {
      this.timerInterval = setInterval(() => {
        this.zone.run(() => {
          this.timer--;
          this.cdr.detectChanges();
          if (this.timer <= 0) {
            clearInterval(this.timerInterval);
            clearInterval(this.questionInterval);
            this.stopRecording();
          }
        });
      }, 1000);
    }

    startQuestionTimer() {
      this.questionInterval = setInterval(() => {
        this.questionTimer--;
        if (this.questionTimer <= 0) {
          this.currentQuestionIndex++;
          if (this.currentQuestionIndex < this.questions.length) {
            this.questionTimer = this.questionDuration;
          }
        }
        this.cdr.detectChanges();
      }, 1000);
    }

    showSuccessMessage() {
      this.isVideoRecorded = true;
      this.globalMessage = 'Votre pré-entretien a été effectué avec succès, en cours de traitement, à bientôt.';
      this.isControlBarVisible = false;
      this.cdr.detectChanges();
    }

    toggleQuestions() {
      this.questionsCollapsed = !this.questionsCollapsed;
      this.cdr.detectChanges();
    }

    showControlBar() {
      this.isControlBarVisible = true;
      this.cdr.detectChanges();
    }

    hideControlBar() {
      if (!this.isRecording) {
        this.isControlBarVisible = false;
        this.cdr.detectChanges();
      }
    }

    openSettings() {
      this.isSettingsOpen = true;
      this.cdr.detectChanges();
    }

    closeSettings() {
      this.isSettingsOpen = false;
      this.cdr.detectChanges();
    }

    async updateMediaDevices() {
      if (this.isRecording) {
        const stream: MediaStream = this.videoPlayer?.nativeElement?.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        this.isRecording = false;
        this.mediaRecorder.stop();
        clearInterval(this.timerInterval);
        clearInterval(this.questionInterval);
      }
      this.cdr.detectChanges();
    }

    resetRecording() {
      this.isVideoRecorded = false;
      this.globalMessage = '';
      this.timer = this.questions.length * this.questionDuration || 90;
      this.chunks = [];
      this.isControlBarVisible = true;
      this.currentQuestionIndex = 0;
      this.questionTimer = this.questionDuration;
      this.cdr.detectChanges();
    }

    onLogout() {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
