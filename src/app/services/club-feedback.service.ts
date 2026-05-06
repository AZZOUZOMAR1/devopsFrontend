import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { ClubFeedback, ClubFeedbackStats, ClubFeedbackSummary } from '../models/club.model';

@Injectable({
  providedIn: 'root'
})
export class ClubFeedbackService {
  private apiUrl = `${API_URL}/clubs/feedback`;

  constructor(private http: HttpClient) {}

  createOrUpdate(payload: { idEtudiant: number; idClub: number; note: number; commentaire?: string }): Observable<ClubFeedback> {
    return this.http.post<ClubFeedback>(this.apiUrl, payload);
  }

  getByClub(clubId: number): Observable<ClubFeedback[]> {
    return this.http.get<ClubFeedback[]>(`${this.apiUrl}/club/${clubId}`);
  }

  /** Moyenne + nombre d'avis par club (un seul appel pour toute la liste). */
  getPublicSummaries(): Observable<ClubFeedbackSummary[]> {
    return this.http.get<ClubFeedbackSummary[]>(`${this.apiUrl}/public/summaries`);
  }

  getAllForAdmin(): Observable<ClubFeedback[]> {
    return this.http.get<ClubFeedback[]>(`${this.apiUrl}/admin/all`);
  }

  getStatsForAdmin(): Observable<ClubFeedbackStats> {
    return this.http.get<ClubFeedbackStats>(`${this.apiUrl}/admin/stats`);
  }
}



