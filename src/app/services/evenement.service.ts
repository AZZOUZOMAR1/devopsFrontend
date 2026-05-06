import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evenement, EventStatus, StatistiquesEvenement } from '../models/evenement.model';
import { API_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class EvenementService {
  private apiUrl = `${API_URL}/evenements`;

  constructor(private http: HttpClient) { }

  // CREATE - Créer un nouvel événement
  createEvenement(evenement: Evenement): Observable<Evenement> {
    return this.http.post<Evenement>(this.apiUrl, evenement);
  }

  // READ - Récupérer tous les événements
  getAllEvenements(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(this.apiUrl);
  }

  // READ - Récupérer un événement par son ID
  getEvenementById(id: number): Observable<Evenement> {
    return this.http.get<Evenement>(`${this.apiUrl}/${id}`);
  }

  // UPDATE - Mettre à jour un événement
  updateEvenement(id: number, evenement: Evenement): Observable<Evenement> {
    return this.http.put<Evenement>(`${this.apiUrl}/${id}`, evenement);
  }

  // DELETE - Supprimer un événement
  deleteEvenement(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Recherche par titre
  getEvenementByTitre(titre: string): Observable<Evenement> {
    return this.http.get<Evenement>(`${this.apiUrl}/titre/${encodeURIComponent(titre)}`);
  }

  // Recherche par type
  getEvenementsByType(type: string): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.apiUrl}/type/${encodeURIComponent(type)}`);
  }

  // Recherche par statut
  getEvenementsByStatus(status: EventStatus): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.apiUrl}/statut/${status}`);
  }

  // Recherche par date
  getEvenementsByDate(date: string): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.apiUrl}/date/${date}`);
  }

  // Recherche par lieu
  getEvenementsByLieu(lieu: string): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.apiUrl}/lieu/${encodeURIComponent(lieu)}`);
  }

  // Recherche des événements à venir
  getEvenementsAVenir(date: string): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.apiUrl}/avenir/${date}`);
  }

  // Statistiques avancées
  getStatistiques(): Observable<StatistiquesEvenement> {
    return this.http.get<StatistiquesEvenement>(`${this.apiUrl}/statistiques`);
  }
}

