import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DemandeParticipation,
  ResultDemande,
  DemandeParticipationView
} from '../models/club.model';
import { API_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class ParticipationClubService {
  private apiUrl = `${API_URL}/clubs/participation`;

  constructor(private http: HttpClient) {}

  demanderRejoindre(demande: DemandeParticipation): Observable<ResultDemande> {
    return this.http.post<ResultDemande>(`${this.apiUrl}/demander`, demande);
  }

  getDemandesEnAttente(clubId?: number): Observable<DemandeParticipationView[]> {
    const options = clubId != null
      ? { params: { clubId: clubId.toString() } }
      : {};
    return this.http.get<DemandeParticipationView[]>(`${this.apiUrl}/demandes-en-attente`, options);
  }

  accepter(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/accepter`, {}, {
      responseType: 'text'
    });
  }

  accepterAvecDepartement(id: number, departement?: string): Observable<string> {
    const params: any = {};
    if (departement) params.departement = departement;
    return this.http.post(`${this.apiUrl}/${id}/accepter`, {}, {
      params,
      responseType: 'text'
    });
  }

  refuser(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/refuser`, {}, {
      responseType: 'text'
    });
  }

  getStatutParticipation(idEtudiant: number, idClub: number): Observable<string | null> {
    return this.http.get<{ statut: string | null }>(`${this.apiUrl}/statut/${idEtudiant}/${idClub}`).pipe(
      map(r => r?.statut ?? null)
    );
  }

  getClubsMembre(idEtudiant: number): Observable<import('../models/club.model').Club[]> {
    return this.http.get<import('../models/club.model').Club[]>(`${this.apiUrl}/mes-clubs/${idEtudiant}`);
  }

  getDepartementAffecte(idEtudiant: number, idClub: number): Observable<string | null> {
    return this.http.get<{ departement: string | null }>(`${this.apiUrl}/affectation/${idEtudiant}/${idClub}`).pipe(
      map(r => r?.departement ?? null)
    );
  }

  getMembresClub(idClub: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/membres/${idClub}`);
  }

  bloquerMembre(participationId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/membres/${participationId}/bloquer`, {}, { responseType: 'text' });
  }

  supprimerMembre(participationId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/membres/${participationId}`, { responseType: 'text' });
  }
}


