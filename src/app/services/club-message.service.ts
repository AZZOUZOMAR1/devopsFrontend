import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export interface ClubMessage {
  id: number;
  idClub: number;
  idEtudiant: number;
  contenu: string;
  scope?: 'CLUB' | 'DEPARTEMENT';
  departement?: string;
  dateCreation: string;
  nomEtudiant: string;
  prenomEtudiant: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClubMessageService {
  private apiUrl = `${API_URL}/clubs/messages`;

  constructor(private http: HttpClient) {}

  getMessages(clubId: number, idEtudiant: number, scope: 'CLUB' | 'DEPARTEMENT' = 'CLUB', departement?: string): Observable<ClubMessage[]> {
    const params: any = { idEtudiant: idEtudiant.toString(), scope };
    if (departement) params.departement = departement;
    return this.http.get<ClubMessage[]>(`${this.apiUrl}/${clubId}`, {
      params
    });
  }

  envoyerMessage(clubId: number, idEtudiant: number, contenu: string, scope: 'CLUB' | 'DEPARTEMENT' = 'CLUB', departement?: string): Observable<ClubMessage> {
    return this.http.post<ClubMessage>(`${this.apiUrl}/${clubId}`, {
      idEtudiant,
      contenu,
      scope,
      departement
    });
  }
}


