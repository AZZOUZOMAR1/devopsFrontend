import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Club } from '../models/club.model';
import { API_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private apiUrl = `${API_URL}/clubs`;

  constructor(private http: HttpClient) {}

  createClub(club: Club): Observable<Club> {
    return this.http.post<Club>(this.apiUrl, club);
  }

  getAllClubs(): Observable<Club[]> {
    return this.http.get<Club[]>(this.apiUrl);
  }

  getClubById(id: number): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/${id}`);
  }

  updateClub(id: number, club: Club): Observable<Club> {
    return this.http.put<Club>(`${this.apiUrl}/${id}`, club);
  }

  deleteClub(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getClubByNom(nom: string): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/nom/${encodeURIComponent(nom)}`);
  }

  getClubsByType(type: string): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/type/${encodeURIComponent(type)}`);
  }

  getClubsByStatut(statut: string): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/statut/${encodeURIComponent(statut)}`);
  }

  getClubsByResponsable(idResponsable: number): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/responsable/${idResponsable}`);
  }

  getDepartements(clubId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${clubId}/departements`);
  }
}



