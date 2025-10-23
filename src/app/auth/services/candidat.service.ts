import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface CandidateDTO {
 id: number;  // Recommendation ID (ignore for history)
  nom: string;
  prenom: string;
  email: string;
  tel?: number;
  cvPath?: string;
  similarityScore?: number;
  yearsOfExperience?: number;
  finalScore?: number;
  titreOffre?: string;
  idOffre?: number; 
}

export interface HistoryDTO {
  candidatureId: number;
  dateCandidature: string;
  statutCandidature: string;
  titreOffre: string;
  idOffre: number;
  cvScore?: number;
  yearsOfExperience?: number;
  videoScore?: number;
  interviewStatus?: string;
  commentaire?: string;
  cvPath?:string;
}

export interface CandidateHistoryDTO {
  candidateId: number;
  nom: string;
  prenom: string;
  cvPath?:string;
  applications: HistoryDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class CandidatService {
  private apiUrl = 'http://localhost:8086/api/recommendations';
  private baseUrl = 'http://localhost:8086/api/recommendations';
  private historyUrl = 'http://localhost:8086/Candidature'; 
  constructor(private http: HttpClient) {}

  getAllCandidats(): Observable<CandidateDTO[]> {
    return this.http.get<CandidateDTO[]>(`${this.apiUrl}/getAllRecommender`);
  }
  private apiUrl2 = 'http://localhost:8086/api/process';

    getFilteredCandidats(minScore?: number, titreOffre?: string): Observable<CandidateDTO[]> {
    let params = new HttpParams();
    if (minScore !== undefined) params = params.set('minScore', minScore);
    if (titreOffre) params = params.set('titreOffre', titreOffre);
    return this.http.get<CandidateDTO[]>(`${this.baseUrl}/filter`, { params });
  }
    startEmailProcess(idOffre: number): Observable<string> {
    return this.http.get<string>(`${this.apiUrl2}/start/${idOffre}`);
  }

  private apiUrl3 = 'http://localhost:8086/video';


 processVideos(idOffre: number): Observable<string> {
  let params = new HttpParams().set('offreId', idOffre.toString());
  return this.http.post<string>(`${this.apiUrl3}/process`, {}, { params });
}
pollVideoStatus(idOffre: number): Observable<any> {
  return this.http.get(`${this.apiUrl3}/status/${idOffre}`);
}

   getOffresByCandidat(idCandidat: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${idCandidat}/offres`);
  }

  getVideoScore(idCandidat: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${idCandidat}/videoScore`);
  }

  getVideoPath(idCandidat: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/${idCandidat}/videoPath`, { responseType: 'text' });
  }

 getCandidateIdByName(nom: string, prenom: string): Observable<number> {
    const url = `http://localhost:8086/Candidature/byName/${encodeURIComponent(nom)}/${encodeURIComponent(prenom)}`;
    console.log('Service: Fetching candidate ID from URL:', url);  // Log for debug
    return this.http.get<number>(url);
  }

  getAllHistories(): Observable<CandidateHistoryDTO[]> {
    const url = `${this.historyUrl}/history`;
    console.log('Service: Fetching all histories from:', url);
    return this.http.get<CandidateHistoryDTO[]>(url);
  }

  getHistoryById(id: number): Observable<CandidateHistoryDTO> {
    const url = `${this.historyUrl}/${id}/history`;
    console.log('Service: Fetching history from URL:', url);
    return this.http.get<CandidateHistoryDTO>(url);
  }

}
