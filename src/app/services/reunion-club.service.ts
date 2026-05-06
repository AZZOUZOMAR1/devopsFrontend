import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReunionClub } from '../models/club.model';
import { API_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class ReunionClubService {
  private apiUrl = `${API_URL}/reunions-club`;

  constructor(private http: HttpClient) {}

  createReunion(reunion: ReunionClub): Observable<ReunionClub> {
    return this.http.post<ReunionClub>(this.apiUrl, reunion);
  }

  getReunionsByClub(clubId: number): Observable<ReunionClub[]> {
    return this.http.get<ReunionClub[]>(`${this.apiUrl}/club/${clubId}`);
  }

  getReunionsByClubAndDate(clubId: number, date: string): Observable<ReunionClub[]> {
    return this.http.get<ReunionClub[]>(`${this.apiUrl}/club/${clubId}/date/${date}`);
  }

  deleteReunion(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}


