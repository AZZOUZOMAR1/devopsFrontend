import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FeedbackDto, MoyenneFeedbackDto } from '../models/evenement.model';
import { API_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${API_URL}/feedback`;

  constructor(private http: HttpClient) {}

  createOrUpdateFeedback(idEtudiant: number, evenementId: number, note: number, commentaire?: string): Observable<FeedbackDto> {
    return this.http.post<FeedbackDto>(this.apiUrl, {
      idEtudiant,
      evenementId,
      note,
      commentaire: commentaire || null
    });
  }

  getFeedbacksByEvenement(evenementId: number): Observable<FeedbackDto[]> {
    return this.http.get<FeedbackDto[]>(`${this.apiUrl}/evenement/${evenementId}`);
  }

  getMoyenneByEvenement(evenementId: number): Observable<MoyenneFeedbackDto> {
    return this.http.get<MoyenneFeedbackDto>(`${this.apiUrl}/moyenne/${evenementId}`);
  }

  getAllFeedbacksForAdmin(): Observable<FeedbackDto[]> {
    return this.http.get<FeedbackDto[]>(`${this.apiUrl}/admin/tous`);
  }

  hasEtudiantFeedback(idEtudiant: number, evenementId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/verifier/${idEtudiant}/${evenementId}`);
  }
}

